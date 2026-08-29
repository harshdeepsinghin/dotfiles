"""
models.py — Model registry for LightningOCR daemon.

Tracks which models are currently loaded, their memory footprint,
and version identifiers (used for cache invalidation).
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Optional

log = logging.getLogger(__name__)

# Bump this when model weights or inference logic change significantly.
# Any cache entries recorded against a different MODEL_VERSION are discarded.
MODEL_VERSION = "1.0.0"


@dataclass
class ModelInfo:
    name: str
    loaded: bool = False
    loaded_at: Optional[float] = None
    estimated_mb: int = 0
    instance: Any = None

    def mark_loaded(self, instance: Any, estimated_mb: int = 0) -> None:
        self.instance = instance
        self.loaded = True
        self.loaded_at = time.time()
        self.estimated_mb = estimated_mb
        log.info("Model '%s' loaded (%.0f MB).", self.name, estimated_mb)

    def unload(self) -> None:
        self.instance = None
        self.loaded = False
        self.loaded_at = None
        log.info("Model '%s' unloaded.", self.name)


class ModelRegistry:
    """
    Central registry of all OCR models used by the daemon.

    Models are registered at startup but not necessarily loaded immediately.
    Engines call `get()` which returns None if the model isn't loaded yet,
    allowing lazy initialisation.
    """

    def __init__(self) -> None:
        self._models: dict[str, ModelInfo] = {}

    def register(self, name: str) -> ModelInfo:
        info = ModelInfo(name=name)
        self._models[name] = info
        return info

    def get(self, name: str) -> Optional[ModelInfo]:
        return self._models.get(name)

    def all_loaded(self) -> list[ModelInfo]:
        return [m for m in self._models.values() if m.loaded]

    def total_memory_mb(self) -> int:
        return sum(m.estimated_mb for m in self.all_loaded())

    def status_dict(self) -> dict:
        return {
            name: {
                "loaded": info.loaded,
                "memory_mb": info.estimated_mb,
                "loaded_at": info.loaded_at,
            }
            for name, info in self._models.items()
        }

    @property
    def version(self) -> str:
        return MODEL_VERSION


# Module-level singleton used by all engines.
registry = ModelRegistry()
registry.register("vision_ocr")       # Apple Vision (Swift binary, always "loaded")
registry.register("pix2text_mfd")     # Math Formula Detector
registry.register("pix2text_mfr")     # Math Formula Recogniser
registry.register("pix2text_layout")  # Layout analyser
