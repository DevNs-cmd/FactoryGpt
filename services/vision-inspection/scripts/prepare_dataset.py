#!/usr/bin/env python3
"""
Owner: Krrish
Prepares a raw images/ + labels/ dataset (flat or nested, .xml or .txt
labels) into a proper 70/20/10 train/val/test split for ultralytics YOLO
training, and writes data.yaml.

Expected input layout:
    <source>/images/...   (any nesting — matched by filename stem)
    <source>/labels/...   (.xml Pascal VOC, or .txt already-YOLO)

Usage:
    python scripts/prepare_dataset.py \
        --source data \
        --dest data/prepared \
        --train-ratio 0.7 --val-ratio 0.2 --test-ratio 0.1

    # If labels are already YOLO .txt with no companion class-name file,
    # supply the real names in index order:
    python scripts/prepare_dataset.py --source data --dest data/prepared \
        --classes "bad_welding,crack,excess_reinforcement,good_welding,porosity,spatters"

Then:
    python app/model/train.py --data data/prepared/data.yaml --epochs 50
    python app/model/evaluate.py --weights <best.pt> --data data/prepared/data.yaml
"""
import argparse
import random
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp"}
CLASS_FILE_NAMES = {"classes.txt", "obj.names", "labels.txt"}


def index_by_stem(root: Path, exts):
    """Recursively index files under root by filename stem -> path."""
    out = {}
    if not root.exists():
        return out
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in exts:
            out[p.stem] = p
    return out


def find_companion_class_file(source: Path):
    for name in CLASS_FILE_NAMES:
        for candidate in source.rglob(name):
            return candidate
    for candidate in source.rglob("*.yaml"):
        return candidate
    for candidate in source.rglob("*.yml"):
        return candidate
    return None


def load_classes_from_companion(path: Path):
    if path.suffix in (".yaml", ".yml"):
        text = path.read_text()
        names = []
        in_names = False
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("names:"):
                in_names = True
                inline = stripped.split(":", 1)[1].strip()
                if inline.startswith("["):
                    return [n.strip().strip("'\"") for n in inline.strip("[]").split(",") if n.strip()]
                continue
            if in_names:
                if stripped.startswith("-"):
                    names.append(stripped[1:].strip().strip("'\""))
                elif ":" in stripped:
                    names.append(stripped.split(":", 1)[1].strip().strip("'\""))
                else:
                    break
        return names
    # plain classes.txt / obj.names — one class per line
    return [line.strip() for line in path.read_text().splitlines() if line.strip()]


def parse_voc_xml(xml_path: Path, img_path: Path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    size_tag = root.find("size")
    if size_tag is not None and size_tag.find("width") is not None:
        width = int(float(size_tag.find("width").text))
        height = int(float(size_tag.find("height").text))
    else:
        from PIL import Image
        with Image.open(img_path) as im:
            width, height = im.size

    objects = []
    for obj in root.findall("object"):
        name = obj.find("name").text.strip()
        bnd = obj.find("bndbox")
        xmin, ymin = float(bnd.find("xmin").text), float(bnd.find("ymin").text)
        xmax, ymax = float(bnd.find("xmax").text), float(bnd.find("ymax").text)
        objects.append((name, xmin, ymin, xmax, ymax))
    return width, height, objects


def build_pairs(source: Path):
    images_by_stem = index_by_stem(source / "images", IMG_EXTS)
    labels_by_stem = index_by_stem(source / "labels", {".xml", ".txt"})

    if not images_by_stem:
        raise SystemExit(f"No images found under {source / 'images'}")
    if not labels_by_stem:
        raise SystemExit(f"No label files found under {source / 'labels'}")

    label_exts = {p.suffix.lower() for p in labels_by_stem.values()}
    if ".xml" in label_exts and ".txt" in label_exts:
        print("WARNING: found both .xml and .txt labels — mixed formats aren't handled, check your data")
    label_format = "xml" if ".xml" in label_exts else "txt"
    print(f"Detected label format: {label_format}")

    pairs = []
    missing = 0
    for stem, img_path in images_by_stem.items():
        lbl_path = labels_by_stem.get(stem)
        if lbl_path is None:
            missing += 1
            continue
        pairs.append((img_path, lbl_path))
    if missing:
        print(f"WARNING: {missing} images had no matching label file — skipped")
    print(f"Matched {len(pairs)} image/label pairs")
    return pairs, label_format


def resolve_classes(source: Path, pairs, label_format, cli_classes):
    if cli_classes:
        names = [c.strip() for c in cli_classes.split(",") if c.strip()]
        print(f"Using classes supplied on the command line: {names}")
        return names

    companion = find_companion_class_file(source)
    if companion:
        names = load_classes_from_companion(companion)
        if names:
            print(f"Using classes found in {companion.name}: {names}")
            return names

    if label_format == "xml":
        found = set()
        for img_path, xml_path in pairs:
            _, _, objects = parse_voc_xml(xml_path, img_path)
            for name, *_ in objects:
                found.add(name)
        names = sorted(found)
        print(f"Discovered classes directly from XML content: {names}")
        return names

    # txt format with no companion file — we genuinely don't know real names
    max_id = -1
    for _, lbl_path in pairs:
        for line in lbl_path.read_text().strip().splitlines():
            if not line.strip():
                continue
            max_id = max(max_id, int(line.split()[0]))
    names = [f"class_{i}" for i in range(max_id + 1)]
    print(
        f"\nWARNING: labels are already YOLO .txt but no classes.txt/data.yaml was "
        f"found alongside them, so real class names are unknown. Using placeholders: "
        f"{names}\nEdit data.yaml's 'names' list by hand afterward, or re-run with "
        f"--classes \"name0,name1,...\" in the correct index order.\n"
    )
    return names


def convert_to_yolo_if_needed(pairs, label_format, class_names, tmp_dir: Path):
    if label_format == "txt":
        return pairs  # already YOLO format, use as-is

    tmp_dir.mkdir(parents=True, exist_ok=True)
    name_to_id = {name: i for i, name in enumerate(class_names)}
    converted = []
    for img_path, xml_path in pairs:
        width, height, objects = parse_voc_xml(xml_path, img_path)
        lines = []
        for name, xmin, ymin, xmax, ymax in objects:
            class_id = name_to_id[name]
            x_c = ((xmin + xmax) / 2) / width
            y_c = ((ymin + ymax) / 2) / height
            w = (xmax - xmin) / width
            h = (ymax - ymin) / height
            lines.append(f"{class_id} {x_c:.6f} {y_c:.6f} {w:.6f} {h:.6f}")
        txt_path = tmp_dir / (img_path.stem + ".txt")
        txt_path.write_text("\n".join(lines))
        converted.append((img_path, txt_path))
    return converted


def make_split(pairs, dest: Path, train_ratio, val_ratio, test_ratio, seed):
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "ratios must sum to 1.0"
    random.seed(seed)
    pairs = list(pairs)
    random.shuffle(pairs)

    n_total = len(pairs)
    n_test = round(n_total * test_ratio)
    n_val = round(n_total * val_ratio)

    test_pairs = pairs[:n_test]
    val_pairs = pairs[n_test:n_test + n_val]
    train_pairs = pairs[n_test + n_val:]

    for split in ["train", "val", "test"]:
        (dest / "images" / split).mkdir(parents=True, exist_ok=True)
        (dest / "labels" / split).mkdir(parents=True, exist_ok=True)

    for split, split_pairs in [("train", train_pairs), ("val", val_pairs), ("test", test_pairs)]:
        for img_path, lbl_path in split_pairs:
            shutil.copy2(img_path, dest / "images" / split / img_path.name)
            shutil.copy2(lbl_path, dest / "labels" / split / (img_path.stem + ".txt"))

    print(f"Split: {len(train_pairs)} train / {len(val_pairs)} val / {len(test_pairs)} test -> {dest}")


def write_data_yaml(dest: Path, class_names):
    yaml_path = dest / "data.yaml"
    names_block = "\n".join(f"  {i}: {name}" for i, name in enumerate(class_names))
    yaml_path.write_text(
        f"path: {dest.resolve()}\n"
        f"train: images/train\n"
        f"val: images/val\n"
        f"test: images/test\n"
        f"nc: {len(class_names)}\n"
        f"names:\n{names_block}\n"
    )
    print(f"Wrote {yaml_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="folder containing images/ and labels/")
    parser.add_argument("--dest", default="data/prepared")
    parser.add_argument("--train-ratio", type=float, default=0.7)
    parser.add_argument("--val-ratio", type=float, default=0.2)
    parser.add_argument("--test-ratio", type=float, default=0.1)
    parser.add_argument("--classes", default=None, help="comma-separated class names in index order, if known")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    source = Path(args.source)
    dest = Path(args.dest)

    pairs, label_format = build_pairs(source)
    class_names = resolve_classes(source, pairs, label_format, args.classes)
    if not class_names:
        raise SystemExit("Could not resolve any class names — check your data or pass --classes explicitly.")

    tmp_dir = dest / "_tmp_converted_labels"
    pairs = convert_to_yolo_if_needed(pairs, label_format, class_names, tmp_dir)

    make_split(pairs, dest, args.train_ratio, args.val_ratio, args.test_ratio, args.seed)
    write_data_yaml(dest, class_names)
    shutil.rmtree(tmp_dir, ignore_errors=True)

    print(f"\nNext steps:")
    print(f"  python app/model/train.py --data {dest.resolve()}/data.yaml --epochs 50")
    print(f"  python app/model/evaluate.py --weights <best.pt> --data {dest.resolve()}/data.yaml")


if __name__ == "__main__":
    main()
