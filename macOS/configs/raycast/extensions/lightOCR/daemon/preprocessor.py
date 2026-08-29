"""
preprocessor.py — Adaptive image preprocessor for LightningOCR.

Only applies transforms when analysis suggests they will improve OCR quality.
The guiding principle: unnecessary preprocessing costs latency.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image

log = logging.getLogger(__name__)

# Minimum character height (px) below which we upscale 2×.
_MIN_CHAR_HEIGHT_PX = 16
# Target DPI for upscaling heuristic.
_TARGET_SHORT_SIDE_PX = 1080


@dataclass
class PreprocessResult:
    path: str            # Path to (possibly modified) image
    was_modified: bool   # True if a copy was written
    operations: list[str]
    estimated_char_height_px: Optional[float] = None


class Preprocessor:
    """
    Analyses an image and applies the minimum set of transforms needed
    to improve OCR accuracy without wasting latency.
    """

    def __init__(self, tmp_dir: str = "/tmp") -> None:
        self.tmp_dir = Path(tmp_dir)

    def process(self, image_path: str) -> PreprocessResult:
        """
        Decide which preprocessing operations are needed and apply them.
        Returns the path to use for OCR (may be the original).
        """
        ops: list[str] = []
        img_bgr = cv2.imread(image_path, cv2.IMREAD_COLOR)
        if img_bgr is None:
            log.warning("Could not read image: %s — skipping preprocessing.", image_path)
            return PreprocessResult(path=image_path, was_modified=False, operations=[])

        h, w = img_bgr.shape[:2]
        log.debug("Image size: %dx%d.", w, h)

        # --- 1. Orientation correction (EXIF) ---
        pil_img = Image.open(image_path)
        pil_img = self._fix_orientation(pil_img)

        # Convert back to BGR for cv2 ops.
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w = img_bgr.shape[:2]

        # --- 2. Grayscale for analysis ---
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # --- 3. Estimate character height ---
        char_h = self._estimate_char_height(gray)
        log.debug("Estimated char height: %.1f px.", char_h or -1)

        # --- 4. Upscale if text is tiny ---
        needs_upscale = char_h is not None and char_h < _MIN_CHAR_HEIGHT_PX
        if needs_upscale:
            img_bgr = cv2.resize(img_bgr, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
            h, w = img_bgr.shape[:2]
            ops.append("upscale_2x")
            log.debug("Upscaled to %dx%d.", w, h)

        # --- 5. Contrast normalization for washed-out images ---
        if self._is_low_contrast(gray):
            img_bgr = self._normalize_contrast(img_bgr)
            ops.append("contrast_normalize")

        # --- 6. Deskew if significantly tilted ---
        angle = self._estimate_skew(gray)
        if abs(angle) > 0.5:
            img_bgr = self._deskew(img_bgr, angle)
            ops.append(f"deskew_{angle:.1f}deg")

        if not ops:
            return PreprocessResult(
                path=image_path,
                was_modified=False,
                operations=[],
                estimated_char_height_px=char_h,
            )

        # Write modified image to temp file.
        stem = Path(image_path).stem
        out_path = self.tmp_dir / f"lightningocr_pre_{stem}.png"
        cv2.imwrite(str(out_path), img_bgr)
        log.debug("Preprocessed image written to %s. Ops: %s", out_path, ops)

        return PreprocessResult(
            path=str(out_path),
            was_modified=True,
            operations=ops,
            estimated_char_height_px=char_h,
        )

    # ------------------------------------------------------------------
    # Analysis helpers
    # ------------------------------------------------------------------

    def _fix_orientation(self, img: Image.Image) -> Image.Image:
        """Apply EXIF orientation tag if present."""
        try:
            exif = img._getexif()  # type: ignore[attr-defined]
            if exif is None:
                return img
            orientation_tag = 274  # 0x0112
            orientation = exif.get(orientation_tag)
            rotations = {3: 180, 6: 270, 8: 90}
            if orientation in rotations:
                img = img.rotate(rotations[orientation], expand=True)
        except Exception:
            pass
        return img

    def _estimate_char_height(self, gray: np.ndarray) -> Optional[float]:
        """
        Estimate typical character height in pixels via connected component analysis.
        Returns None if estimation fails.
        """
        try:
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            num_labels, _, stats, _ = cv2.connectedComponentsWithStats(thresh, connectivity=8)
            if num_labels < 2:
                return None
            heights = stats[1:, cv2.CC_STAT_HEIGHT]  # skip background
            # Filter to plausible text component heights.
            img_h = gray.shape[0]
            reasonable = heights[(heights > 4) & (heights < img_h * 0.5)]
            if len(reasonable) == 0:
                return None
            return float(np.median(reasonable))
        except Exception:
            return None

    def _is_low_contrast(self, gray: np.ndarray) -> bool:
        """True if the image has very low dynamic range (washed out or very dark)."""
        p5, p95 = np.percentile(gray, [5, 95])
        return (p95 - p5) < 60

    def _estimate_skew(self, gray: np.ndarray) -> float:
        """
        Estimate document skew angle using Hough lines.
        Returns angle in degrees; 0.0 on failure.
        """
        try:
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
            if lines is None:
                return 0.0
            angles = []
            for line in lines[:50]:
                theta = line[0][1]
                angle = np.degrees(theta) - 90
                if abs(angle) < 45:
                    angles.append(angle)
            if not angles:
                return 0.0
            return float(np.median(angles))
        except Exception:
            return 0.0

    # ------------------------------------------------------------------
    # Transform helpers
    # ------------------------------------------------------------------

    def _normalize_contrast(self, img_bgr: np.ndarray) -> np.ndarray:
        """CLAHE contrast normalization on L channel (LAB colorspace)."""
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_ch = clahe.apply(l_ch)
        lab = cv2.merge([l_ch, a_ch, b_ch])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    def _deskew(self, img_bgr: np.ndarray, angle: float) -> np.ndarray:
        """Rotate image by -angle degrees to correct skew."""
        h, w = img_bgr.shape[:2]
        center = (w / 2, h / 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(img_bgr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


# Module-level singleton.
preprocessor = Preprocessor()
