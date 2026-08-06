"""
Owner: Krrish
Central device-selection logic — import get_device() anywhere
training/evaluation/inference needs to pick mps vs cpu, so the logic
(and its known caveats) live in exactly one place.
"""
import logging

logger = logging.getLogger(__name__)


def get_device(prefer: str = "auto") -> str:
    """Returns 'mps', 'cpu', or whatever was explicitly requested.

    'auto' tries Apple Silicon GPU (MPS) first, falls back to CPU if
    unavailable. KNOWN CAVEAT: some torch/ultralytics version combos have
    a bug where MPS training reports box_loss/dfl_loss stuck at exactly
    0.0 with abnormally high cls_loss — that's not your data, it's a
    known MPS issue. If you see it, rerun with device='cpu' before
    trusting the results. MPS has also been reported slower than CPU for
    small models/datasets in some cases, so if training feels slower
    than expected, try --device cpu and compare.
    """
    if prefer != "auto":
        return prefer
    try:
        import torch
        if torch.backends.mps.is_available():
            logger.info("MPS (Apple Silicon GPU) detected — using device='mps'")
            return "mps"
    except ImportError:
        pass
    logger.info("MPS not available — falling back to device='cpu'")
    return "cpu"
