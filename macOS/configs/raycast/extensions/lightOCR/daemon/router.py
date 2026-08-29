"""
router.py — Intelligent request router for LightningOCR.

Classifies each incoming image as TEXT_ONLY, FORMULA_ONLY, or MIXED,
then dispatches to the appropriate fast path.

Classification order (short-circuit on first confident result):
  1. Vision fast-scan → if all text confidences are high → TEXT_ONLY
  2. Edge/symbol density heuristics → if formula-like → probe MFD
  3. Pix2Text layout → MIXED or FORMULA_ONLY
"""
from __future__ import annotations

import asyncio
import logging
import time
from enum import Enum
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from engines.vision_engine import vision_engine, CONFIDENCE_ACCEPT
from engines.pix2text_engine import pix2text_engine
from markdown import Region, assembler

log = logging.getLogger(__name__)


class RouteMode(str, Enum):
    TEXT_ONLY = "text"
    FORMULA_ONLY = "formula"
    MIXED = "mixed"


def _load_gray(image_path: str) -> Optional[np.ndarray]:
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    return img


def _edge_density(gray: np.ndarray) -> float:
    """
    Ratio of edge pixels to total pixels.
    Mathematical content tends to have higher edge density than plain text.
    """
    edges = cv2.Canny(gray, 50, 150)
    return float(np.count_nonzero(edges)) / edges.size


def _has_formula_symbols(gray: np.ndarray) -> bool:
    """
    Very fast heuristic: look for pixel patterns typical of math symbols
    (thin horizontal strokes like fractions, radical signs, integral signs).

    We use horizontal line detection via morphological ops as a proxy.
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 1))
    horizontal = cv2.morphologyEx(
        cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1],
        cv2.MORPH_OPEN,
        kernel,
    )
    # If we find long thin horizontal lines (fraction bars), it's likely math.
    contours, _ = cv2.findContours(horizontal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    long_lines = sum(1 for c in contours if cv2.boundingRect(c)[2] > 30)
    return long_lines >= 2


class Router:
    """
    Dispatches an image to the right recognition pipeline and returns
    assembled Markdown along with metadata.
    """

    async def process(
        self,
        image_path: str,
        mode: str = "auto",
        quality: str = "balanced",
    ) -> dict:
        """
        Main entry point.

        Returns a dict with keys:
            markdown, confidence, route, regions, latency_ms
        """
        t_start = time.perf_counter()
        stages: dict[str, float] = {}

        # ---- Manual mode override ----
        if mode == "text":
            route = RouteMode.TEXT_ONLY
        elif mode == "formula":
            route = RouteMode.FORMULA_ONLY
        elif mode == "mixed":
            route = RouteMode.MIXED
        else:
            route, stages["route_ms"] = await self._classify(image_path, quality)

        log.info("[ROUTE] %s → %s", Path(image_path).name, route.value)

        # ---- Dispatch ----
        if route == RouteMode.TEXT_ONLY:
            regions, confidence, stage_ms = await self._text_path(image_path, quality)
            stages["text_ms"] = stage_ms

        elif route == RouteMode.FORMULA_ONLY:
            regions, confidence, stage_ms = await self._formula_path(image_path)
            stages["formula_ms"] = stage_ms

        else:  # MIXED
            regions, confidence, stage_ms = await self._mixed_path(image_path)
            stages["mixed_ms"] = stage_ms

        # ---- Assemble Markdown ----
        t_md = time.perf_counter()
        gray = _load_gray(image_path)
        image_width = gray.shape[1] if gray is not None else 0
        markdown = assembler.assemble(regions, image_width=image_width)
        stages["markdown_ms"] = (time.perf_counter() - t_md) * 1000

        total_ms = (time.perf_counter() - t_start) * 1000

        log.info(
            "[TOTAL] %.1f ms | conf=%.3f | %s",
            total_ms,
            confidence,
            " | ".join(f"{k}={v:.1f}" for k, v in stages.items()),
        )

        return {
            "markdown": markdown,
            "confidence": round(confidence, 4),
            "route": route.value,
            "latency_ms": round(total_ms, 1),
            "stages": stages,
        }

    # ------------------------------------------------------------------
    # Classification
    # ------------------------------------------------------------------

    async def _classify(self, image_path: str, quality: str) -> tuple[RouteMode, float]:
        t0 = time.perf_counter()

        gray = _load_gray(image_path)
        if gray is None:
            return RouteMode.TEXT_ONLY, 0.0

        # Step 1: cheap heuristics.
        edge_d = _edge_density(gray)
        has_symbols = _has_formula_symbols(gray)
        log.debug("Edge density=%.4f, formula_symbols=%s.", edge_d, has_symbols)

        # Very low edge density → probably plain text or simple screenshot.
        if edge_d < 0.02 and not has_symbols:
            elapsed = (time.perf_counter() - t0) * 1000
            return RouteMode.TEXT_ONLY, elapsed

        # Step 2: Vision fast-scan to probe text confidence.
        accurate = quality != "fast"
        regions, conf = await vision_engine.recognize(image_path, accurate=accurate)

        if conf >= CONFIDENCE_ACCEPT and not has_symbols:
            # Vision is confident and no math symbols found → TEXT_ONLY.
            elapsed = (time.perf_counter() - t0) * 1000
            return RouteMode.TEXT_ONLY, elapsed

        # Step 3: If edge density is high or symbols detected, check for formulas.
        if has_symbols or edge_d > 0.05:
            # Load Pix2Text lazily to detect formula regions.
            if not pix2text_engine.is_loaded():
                log.debug("Formula symbols detected — loading Pix2Text…")
            await pix2text_engine.ensure_loaded()

            # Quick check: run Pix2Text on the image to see if there are formula regions.
            # We do this async so the daemon stays responsive.
            mixed_regions, _ = await pix2text_engine.recognize_mixed(image_path)
            has_formula = any("formula" in r.type for r in mixed_regions)
            has_text = any(r.type == "text" for r in mixed_regions)

            elapsed = (time.perf_counter() - t0) * 1000
            if has_formula and not has_text:
                return RouteMode.FORMULA_ONLY, elapsed
            if has_formula and has_text:
                return RouteMode.MIXED, elapsed

        elapsed = (time.perf_counter() - t0) * 1000
        return RouteMode.TEXT_ONLY, elapsed

    # ------------------------------------------------------------------
    # Execution paths
    # ------------------------------------------------------------------

    async def _text_path(
        self, image_path: str, quality: str
    ) -> tuple[list[Region], float, float]:
        """Fast path: Apple Vision only."""
        t0 = time.perf_counter()
        accurate = quality != "fast"
        regions, confidence = await vision_engine.recognize(image_path, accurate=accurate)
        return regions, confidence, (time.perf_counter() - t0) * 1000

    async def _formula_path(
        self, image_path: str
    ) -> tuple[list[Region], float, float]:
        """Formula-only path: Pix2Text MFR directly."""
        t0 = time.perf_counter()
        await pix2text_engine.ensure_loaded()
        latex, confidence = await pix2text_engine.recognize_formula(image_path)

        region = Region(
            type="formula_display",
            bbox=[0, 0, 0, 0],
            content=latex,
            confidence=confidence,
        )
        return [region], confidence, (time.perf_counter() - t0) * 1000

    async def _mixed_path(
        self, image_path: str
    ) -> tuple[list[Region], float, float]:
        """
        Mixed path: Pix2Text layout → regions.
        Text regions may be re-processed by Vision for higher accuracy.
        """
        t0 = time.perf_counter()
        await pix2text_engine.ensure_loaded()
        regions, confidence = await pix2text_engine.recognize_mixed(image_path)
        return regions, confidence, (time.perf_counter() - t0) * 1000


# Module-level singleton.
router = Router()
