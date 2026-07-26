"""
Owner: Krrish
No real camera exists, so this loops through data/sample_images/ to
simulate a live feed for the demo.
"""
import itertools
import os

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_images")


def frame_generator():
    files = sorted(
        f for f in os.listdir(SAMPLE_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ) if os.path.isdir(SAMPLE_DIR) else []
    if not files:
        return
    for filename in itertools.cycle(files):
        yield os.path.join(SAMPLE_DIR, filename)
