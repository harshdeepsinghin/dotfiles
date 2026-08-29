"""
markdown.py — Region → Markdown assembler for LightningOCR.

Takes a list of recognised regions (each with a type, bbox, and content)
and assembles them into clean Markdown with properly delimited LaTeX.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Optional

log = logging.getLogger(__name__)

# Unicode math symbol → LaTeX mapping (most commonly misrecognised).
_UNICODE_TO_LATEX: dict[str, str] = {
    "√": r"\sqrt",
    "∑": r"\sum",
    "∏": r"\prod",
    "∫": r"\int",
    "∂": r"\partial",
    "∞": r"\infty",
    "≤": r"\leq",
    "≥": r"\geq",
    "≠": r"\neq",
    "≈": r"\approx",
    "∈": r"\in",
    "∉": r"\notin",
    "∀": r"\forall",
    "∃": r"\exists",
    "→": r"\rightarrow",
    "↔": r"\leftrightarrow",
    "∇": r"\nabla",
    "±": r"\pm",
    "×": r"\times",
    "÷": r"\div",
    "·": r"\cdot",
    "α": r"\alpha",
    "β": r"\beta",
    "γ": r"\gamma",
    "δ": r"\delta",
    "ε": r"\epsilon",
    "θ": r"\theta",
    "λ": r"\lambda",
    "μ": r"\mu",
    "π": r"\pi",
    "σ": r"\sigma",
    "φ": r"\phi",
    "ω": r"\omega",
    "Δ": r"\Delta",
    "Σ": r"\Sigma",
    "Π": r"\Pi",
    "Ω": r"\Omega",
}

# Regex to find inline \(...\) and convert to $...$
_INLINE_PAREN_RE = re.compile(r"\\\((.+?)\\\)", re.DOTALL)
# Regex to find display \[...\] and convert to $$...$$
_DISPLAY_BRACKET_RE = re.compile(r"\\\[(.+?)\\\]", re.DOTALL)


@dataclass
class Region:
    """A single recognised region from the OCR pipeline."""
    type: str          # "text" | "formula_inline" | "formula_display" | "heading" | "code" | "list"
    bbox: list[int]    # [x1, y1, x2, y2]
    content: str       # Raw recognised content
    confidence: float = 1.0
    page_width: int = 0


class MarkdownAssembler:
    """
    Converts a list of Region objects into a Markdown string.

    Reading-order sort: columns are detected if the image is wide enough
    to have two side-by-side text columns; otherwise top-to-bottom order.
    """

    COLUMN_THRESHOLD = 0.45  # If gap between right and left halves > this fraction → two columns

    def assemble(self, regions: list[Region], image_width: int = 0) -> str:
        if not regions:
            return ""

        sorted_regions = self._sort_regions(regions, image_width)
        parts: list[str] = []

        for region in sorted_regions:
            md = self._region_to_markdown(region)
            if md:
                parts.append(md)

        return "\n\n".join(parts).strip()

    # ------------------------------------------------------------------
    # Reading-order sort
    # ------------------------------------------------------------------

    def _sort_regions(self, regions: list[Region], image_width: int) -> list[Region]:
        """
        Sort regions into reading order.
        Single-column: top → bottom.
        Two-column: left column top→bottom, then right column top→bottom.
        """
        if image_width > 0 and self._is_two_column(regions, image_width):
            mid = image_width // 2
            left = sorted([r for r in regions if r.bbox[0] < mid], key=lambda r: r.bbox[1])
            right = sorted([r for r in regions if r.bbox[0] >= mid], key=lambda r: r.bbox[1])
            return left + right

        return sorted(regions, key=lambda r: (r.bbox[1], r.bbox[0]))

    def _is_two_column(self, regions: list[Region], image_width: int) -> bool:
        """Heuristic: if there is a vertical band in the centre with no text, two columns."""
        if len(regions) < 4:
            return False
        mid = image_width // 2
        margin = image_width * 0.1
        centre_regions = [
            r for r in regions
            if r.bbox[0] < mid + margin and r.bbox[2] > mid - margin
        ]
        # If very few regions cross the midline, likely two columns.
        return len(centre_regions) <= len(regions) * 0.15

    # ------------------------------------------------------------------
    # Region → Markdown
    # ------------------------------------------------------------------

    def _region_to_markdown(self, region: Region) -> str:
        content = region.content.strip()
        if not content:
            return ""

        rtype = region.type.lower()

        if rtype == "formula_display":
            latex = self._normalise_latex(content)
            return f"$$\n{latex}\n$$"

        if rtype == "formula_inline":
            latex = self._normalise_latex(content)
            return f"${latex}$"

        if rtype == "heading":
            # Single # — we trust the layout engine's heading detection.
            return f"# {content}"

        if rtype == "code":
            return f"```\n{content}\n```"

        if rtype == "list":
            return self._format_list(content)

        # Default: plain text. Still normalise any embedded formula delimiters.
        return self._normalise_text_formulas(content)

    # ------------------------------------------------------------------
    # LaTeX normalisation
    # ------------------------------------------------------------------

    def _normalise_latex(self, latex: str) -> str:
        """
        Clean up LaTeX produced by formula recognisers:
        - Strip outer delimiters if they wrapped the content.
        - Normalise unicode math symbols to LaTeX commands.
        - Validate brace balance; attempt repair if unbalanced.
        """
        # Strip common outer delimiters left by some models.
        for prefix, suffix in [("$$", "$$"), ("$", "$"), (r"\[", r"\]"), (r"\(", r"\)")]:
            s = latex.strip()
            if s.startswith(prefix) and s.endswith(suffix) and len(s) > len(prefix) + len(suffix):
                latex = s[len(prefix):-len(suffix)].strip()
                break

        # Replace unicode math characters with LaTeX.
        for uni, tex in _UNICODE_TO_LATEX.items():
            latex = latex.replace(uni, tex)

        # Validate and attempt brace repair.
        latex = self._repair_braces(latex)

        return latex

    def _normalise_text_formulas(self, text: str) -> str:
        r"""Convert \(...\) and \[...\] delimiters from Pix2Text to $...$ form."""
        text = _INLINE_PAREN_RE.sub(lambda m: f"${m.group(1).strip()}$", text)
        text = _DISPLAY_BRACKET_RE.sub(lambda m: f"$$\n{m.group(1).strip()}\n$$", text)
        return text

    def _repair_braces(self, latex: str) -> str:
        """
        Attempt to fix unbalanced braces by appending missing closing braces.
        Only applies deterministic repairs; never invents mathematical content.
        """
        depth = 0
        for ch in latex:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1

        if depth > 0:
            log.debug("Repairing %d unmatched '{' in LaTeX.", depth)
            latex = latex + "}" * depth
        elif depth < 0:
            log.debug("LaTeX has %d extra '}'; trimming.", -depth)
            for _ in range(-depth):
                idx = latex.rfind("}")
                if idx >= 0:
                    latex = latex[:idx] + latex[idx + 1:]

        return latex

    def _format_list(self, content: str) -> str:
        """Ensure list items start with '- '."""
        lines = content.splitlines()
        result = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Already has a bullet.
            if line.startswith(("- ", "• ", "* ", "· ")):
                result.append(f"- {line[2:].strip()}")
            elif re.match(r"^\d+[.)]\s+", line):
                # Numbered list → keep as-is.
                result.append(line)
            else:
                result.append(f"- {line}")
        return "\n".join(result)


# Module-level singleton.
assembler = MarkdownAssembler()
