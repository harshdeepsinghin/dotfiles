"""
engines/vision_engine.py — Apple Vision OCR engine wrapper.

Calls the compiled Swift `vision-ocr` binary as a subprocess and parses
its JSON output into LightningOCR Region objects. The binary is fast to
invoke (~5–10 ms process overhead) because Vision framework is already
loaded system-wide.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import Optional

from markdown import Region

log = logging.getLogger(__name__)

# Locate the compiled binary relative to this file.
_NATIVE_BIN = Path(__file__).parent.parent.parent / "native" / ".build" / "release" / "vision-ocr"
# Fallback: allow override via env var.
_BINARY_PATH = Path(os.environ.get("LIGHTNINGOCR_VISION_BIN", str(_NATIVE_BIN)))

# Vision confidence threshold for "trusted" text OCR.
CONFIDENCE_ACCEPT = float(os.environ.get("VISION_CONFIDENCE_ACCEPT", "0.92"))
CONFIDENCE_RETRY = float(os.environ.get("VISION_CONFIDENCE_RETRY", "0.70"))

# Timeout for the Swift subprocess.
_TIMEOUT_SEC = 10.0


class VisionEngine:
    """
    Thin asyncio wrapper around the `vision-ocr` Swift binary.

    The binary accepts an image path via argv[1] and prints a JSON array:
        [{"text": "...", "confidence": 0.99, "bbox": [x1, y1, x2, y2]}, ...]

    We convert each observation into a Region object.
    """

    def is_available(self) -> bool:
        return _BINARY_PATH.exists() and os.access(_BINARY_PATH, os.X_OK)

    async def recognize(
        self,
        image_path: str,
        accurate: bool = True,
    ) -> tuple[list[Region], float]:
        """
        Run Vision text recognition on `image_path`.

        Returns:
            (regions, overall_confidence)
        """
        if not self.is_available():
            log.error("vision-ocr binary not found at %s.", _BINARY_PATH)
            return [], 0.0

        t0 = time.perf_counter()
        mode_flag = "--accurate" if accurate else "--fast"

        try:
            proc = await asyncio.create_subprocess_exec(
                str(_BINARY_PATH),
                image_path,
                mode_flag,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=_TIMEOUT_SEC)
        except asyncio.TimeoutError:
            log.warning("vision-ocr timed out for %s.", image_path)
            return [], 0.0
        except Exception as exc:
            log.error("vision-ocr subprocess error: %s", exc)
            return [], 0.0

        elapsed_ms = (time.perf_counter() - t0) * 1000
        log.debug("vision-ocr finished in %.1f ms (exit=%d).", elapsed_ms, proc.returncode)

        if proc.returncode != 0:
            log.warning("vision-ocr exited %d: %s", proc.returncode, stderr.decode().strip())
            return [], 0.0

        return self._parse_output(stdout.decode())

    def _parse_output(self, raw: str) -> tuple[list[Region], float]:
        """Parse the JSON array from vision-ocr into Region objects."""
        try:
            observations = json.loads(raw.strip())
        except json.JSONDecodeError as exc:
            log.error("Failed to parse vision-ocr output: %s — raw: %r", exc, raw[:200])
            return [], 0.0

        if not observations:
            return [], 0.0

        regions: list[Region] = []
        confidences: list[float] = []

        for obs in observations:
            text = obs.get("text", "").strip()
            confidence = float(obs.get("confidence", 0.0))
            bbox = obs.get("bbox", [0, 0, 0, 0])

            if not text:
                continue

            regions.append(Region(
                type="text",
                bbox=bbox,
                content=text,
                confidence=confidence,
            ))
            confidences.append(confidence)

        overall = sum(confidences) / len(confidences) if confidences else 0.0
        log.debug("Vision: %d regions, overall conf=%.3f.", len(regions), overall)
        return regions, overall


# Module-level singleton.
vision_engine = VisionEngine()
