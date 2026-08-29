#!/usr/bin/env python3
"""
warmup.py — LightningOCR model warm-up script.

Run after install to trigger model downloads and pre-JIT the inference path.
This ensures the first real user request is not slowed by lazy initialisation.
"""
import asyncio
import logging
import sys
import time
from pathlib import Path

# Ensure daemon package is on sys.path.
sys.path.insert(0, str(Path(__file__).parent.parent / "daemon"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("warmup")

DUMMY_IMAGE = Path(__file__).parent / "warmup_test.png"


def create_dummy_image():
    """Create a tiny synthetic test image with text."""
    try:
        from PIL import Image, ImageDraw, ImageFont  # type: ignore
        img = Image.new("RGB", (400, 100), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((20, 30), "The value of x is 42.", fill=(0, 0, 0))
        img.save(str(DUMMY_IMAGE))
        log.info("Created dummy test image: %s", DUMMY_IMAGE)
        return True
    except Exception as exc:
        log.warning("Could not create dummy image: %s", exc)
        return False


async def warmup_vision():
    """Warm up the Apple Vision engine."""
    from engines.vision_engine import vision_engine
    if not vision_engine.is_available():
        log.warning("vision-ocr binary not found — skipping Vision warm-up.")
        return

    if not DUMMY_IMAGE.exists():
        log.warning("No dummy image available — skipping Vision warm-up.")
        return

    log.info("Warming up Apple Vision OCR…")
    t0 = time.perf_counter()
    regions, confidence = await vision_engine.recognize(str(DUMMY_IMAGE), accurate=True)
    elapsed = (time.perf_counter() - t0) * 1000
    log.info("Vision warm-up complete: %.1f ms (conf=%.3f, %d regions).", elapsed, confidence, len(regions))


async def warmup_pix2text():
    """Load Pix2Text and run a dummy inference."""
    from engines.pix2text_engine import pix2text_engine
    log.info("Loading Pix2Text (may download models on first run — this is expected)…")
    t0 = time.perf_counter()
    loaded = await pix2text_engine.ensure_loaded()
    elapsed = (time.perf_counter() - t0) * 1000
    if loaded:
        log.info("Pix2Text loaded in %.1f ms.", elapsed)
    else:
        log.error("Pix2Text failed to load. Check that pix2text is installed correctly.")
        return

    if not DUMMY_IMAGE.exists():
        log.info("Pix2Text loaded — skipping inference warm-up (no dummy image).")
        return

    log.info("Running Pix2Text warm-up inference…")
    t0 = time.perf_counter()
    regions, conf = await pix2text_engine.recognize_mixed(str(DUMMY_IMAGE))
    elapsed = (time.perf_counter() - t0) * 1000
    log.info("Pix2Text warm-up complete: %.1f ms (%d regions).", elapsed, len(regions))


async def main():
    log.info("=" * 60)
    log.info("LightningOCR — Model Warm-up")
    log.info("=" * 60)

    create_dummy_image()
    await warmup_vision()
    await warmup_pix2text()

    if DUMMY_IMAGE.exists():
        DUMMY_IMAGE.unlink()

    log.info("=" * 60)
    log.info("Warm-up complete. The daemon is ready.")
    log.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
