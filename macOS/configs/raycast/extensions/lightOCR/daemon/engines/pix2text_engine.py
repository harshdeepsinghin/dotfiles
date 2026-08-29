"""
engines/pix2text_engine.py — Pix2Text MFD/MFR engine wrapper.

Pix2Text is initialised ONCE at daemon startup (or lazily on first formula
request). It stays loaded in memory for the life of the daemon process.
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from markdown import Region
from models import registry

log = logging.getLogger(__name__)

# Run Pix2Text inference on a thread pool so the asyncio loop isn't blocked.
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="pix2text")

# Preload setting (can be overridden via env).
PRELOAD_FORMULA_MODEL = os.environ.get("LIGHTNINGOCR_PRELOAD_FORMULA", "0") == "1"

# Inline formula classification: if formula bbox height < this fraction of
# line height, treat it as inline rather than display.
_INLINE_HEIGHT_FRACTION = 1.4


class Pix2TextEngine:
    """
    Long-lived wrapper around Pix2Text.

    The `p2t` instance is created once and reused across all requests.
    Inference is dispatched to a single-threaded executor to avoid blocking
    the asyncio event loop while keeping PyTorch serial (no GPU contention).
    """

    def __init__(self) -> None:
        self._p2t = None  # type: ignore
        self._loading = False
        self._load_lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def ensure_loaded(self) -> bool:
        """Load Pix2Text if not already loaded. Returns True on success."""
        if self._p2t is not None:
            return True

        async with self._load_lock:
            if self._p2t is not None:
                return True  # Another coroutine loaded it while we waited.

            self._loading = True
            log.info("Loading Pix2Text (this may take a moment)…")
            t0 = time.perf_counter()

            try:
                p2t = await asyncio.get_event_loop().run_in_executor(
                    _executor, self._load_pix2text
                )
                self._p2t = p2t
                elapsed = time.perf_counter() - t0

                info = registry.get("pix2text_mfr")
                if info:
                    info.mark_loaded(instance=p2t, estimated_mb=1200)

                log.info("Pix2Text loaded in %.1f s.", elapsed)
                return True
            except Exception as exc:
                log.error("Failed to load Pix2Text: %s", exc, exc_info=True)
                return False
            finally:
                self._loading = False

    async def recognize_mixed(self, image_path: str) -> tuple[list[Region], float]:
        """
        Full mixed text+formula recognition via Pix2Text layout analysis.

        Returns (regions, overall_confidence).
        """
        if not await self.ensure_loaded():
            return [], 0.0

        t0 = time.perf_counter()
        loop = asyncio.get_event_loop()

        try:
            raw_result = await loop.run_in_executor(
                _executor, self._run_mixed, image_path
            )
        except Exception as exc:
            log.error("Pix2Text recognize_mixed error: %s", exc, exc_info=True)
            return [], 0.0

        elapsed_ms = (time.perf_counter() - t0) * 1000
        log.debug("Pix2Text mixed recognition: %.1f ms.", elapsed_ms)

        return self._parse_mixed_result(raw_result)

    async def recognize_formula(self, image_path: str) -> tuple[str, float]:
        """
        Dedicated formula-only recognition (cropped formula image).

        Returns (latex_string, confidence).
        """
        if not await self.ensure_loaded():
            return "", 0.0

        loop = asyncio.get_event_loop()
        t0 = time.perf_counter()

        try:
            result = await loop.run_in_executor(
                _executor, self._run_formula, image_path
            )
        except Exception as exc:
            log.error("Pix2Text formula recognition error: %s", exc, exc_info=True)
            return "", 0.0

        elapsed_ms = (time.perf_counter() - t0) * 1000
        log.debug("Pix2Text formula recognition: %.1f ms.", elapsed_ms)

        return result, 0.95  # Pix2Text doesn't expose per-formula confidence; default 0.95.

    def is_loaded(self) -> bool:
        return self._p2t is not None

    # ------------------------------------------------------------------
    # Synchronous internals (run inside executor)
    # ------------------------------------------------------------------

    def _load_pix2text(self):
        """Import and initialise Pix2Text. Called in thread executor."""
        from pix2text import Pix2Text  # type: ignore
        return Pix2Text.from_config()

    def _run_mixed(self, image_path: str):
        """Call Pix2Text on an image, get mixed layout result."""
        return self._p2t.recognize(image_path, return_text=False)

    def _run_formula(self, image_path: str) -> str:
        """Call Pix2Text formula-only recognition."""
        result = self._p2t.recognize(image_path, file_type="formula")
        if isinstance(result, str):
            return result
        # If it returns a list of regions, grab the first formula.
        if isinstance(result, list):
            for item in result:
                if hasattr(item, "type") and "formula" in str(item.type).lower():
                    return str(item.text)
                if isinstance(item, dict) and "formula" in str(item.get("type", "")).lower():
                    return str(item.get("text", ""))
        return str(result)

    def _parse_mixed_result(self, raw) -> tuple[list[Region], float]:
        """
        Convert Pix2Text output into a list of Region objects.

        Pix2Text v1.1+ returns a list of objects with `.type` and `.text`
        attributes, or a plain string for simple images.
        """
        if isinstance(raw, str):
            # Simple text-only result.
            return [Region(type="text", bbox=[0, 0, 0, 0], content=raw, confidence=0.95)], 0.95

        regions: list[Region] = []

        for item in (raw if isinstance(raw, list) else []):
            try:
                # Pix2Text returns objects with .type, .text, .position attributes.
                if hasattr(item, "type"):
                    rtype_raw = str(item.type).lower()
                    text = str(item.text).strip() if hasattr(item, "text") else ""
                    pos = list(item.position) if hasattr(item, "position") else [0, 0, 0, 0]
                elif isinstance(item, dict):
                    rtype_raw = str(item.get("type", "text")).lower()
                    text = str(item.get("text", "")).strip()
                    pos = item.get("position", [0, 0, 0, 0])
                else:
                    continue

                if not text:
                    continue

                rtype = self._map_type(rtype_raw)
                # Normalise bbox to [x1, y1, x2, y2].
                bbox = self._normalise_bbox(pos)

                regions.append(Region(
                    type=rtype,
                    bbox=bbox,
                    content=text,
                    confidence=0.95,
                ))
            except Exception as exc:
                log.debug("Skipping malformed region: %s", exc)
                continue

        overall = 0.95 if regions else 0.0
        return regions, overall

    def _map_type(self, raw_type: str) -> str:
        """Map Pix2Text type strings to our internal type labels."""
        if "isolated" in raw_type or "display" in raw_type:
            return "formula_display"
        if "embedding" in raw_type or "inline" in raw_type or "formula" in raw_type:
            return "formula_inline"
        if "title" in raw_type or "heading" in raw_type:
            return "heading"
        if "table" in raw_type:
            return "code"  # Render tables as code blocks for now.
        return "text"

    def _normalise_bbox(self, pos) -> list[int]:
        """Convert various position formats to [x1, y1, x2, y2]."""
        try:
            flat = [int(v) for v in (pos if isinstance(pos, (list, tuple)) else [0, 0, 0, 0])]
            if len(flat) == 4:
                return flat
            if len(flat) == 8:
                # Corner points: x1,y1, x2,y1, x2,y2, x1,y2
                xs = flat[0::2]
                ys = flat[1::2]
                return [min(xs), min(ys), max(xs), max(ys)]
        except Exception:
            pass
        return [0, 0, 0, 0]


# Module-level singleton.
pix2text_engine = Pix2TextEngine()
