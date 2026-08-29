"""
cache.py — SHA-256 content-hash result cache for LightningOCR.

Uses `diskcache` (SQLite + file store) so results survive daemon restarts.
Cache key: SHA-256(image bytes) + model version string.
"""
from __future__ import annotations

import hashlib
import logging
import os
import time
from pathlib import Path
from typing import Optional

import diskcache

from models import registry

log = logging.getLogger(__name__)

# Default cache location: ~/.cache/lightningocr/
_DEFAULT_CACHE_DIR = Path.home() / ".cache" / "lightningocr"
_DEFAULT_MAX_SIZE_MB = 500
_DEFAULT_TTL_SECONDS = 7 * 24 * 3600  # 7 days


class OCRCache:
    """
    Persistent result cache backed by diskcache.

    Key format:  sha256hex:model_version
    Value:       dict with keys matching OCRResponse fields
    """

    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        max_size_mb: int = _DEFAULT_MAX_SIZE_MB,
        ttl: int = _DEFAULT_TTL_SECONDS,
        enabled: bool = True,
    ) -> None:
        self.enabled = enabled
        self.ttl = ttl

        if not enabled:
            log.info("OCR cache disabled.")
            self._cache = None
            return

        cache_dir = cache_dir or _DEFAULT_CACHE_DIR
        cache_dir.mkdir(parents=True, exist_ok=True)

        self._cache = diskcache.Cache(
            str(cache_dir),
            size_limit=max_size_mb * 1024 * 1024,
        )
        log.info("OCR cache initialised at %s (max %d MB).", cache_dir, max_size_mb)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(self, image_path: str) -> Optional[dict]:
        """Return cached result or None on miss."""
        if not self.enabled or self._cache is None:
            return None

        key = self._make_key(image_path)
        if key is None:
            return None

        result = self._cache.get(key)
        if result is not None:
            log.debug("Cache HIT for %s.", image_path)
        else:
            log.debug("Cache MISS for %s.", image_path)
        return result

    def put(self, image_path: str, result: dict) -> None:
        """Store a result in the cache."""
        if not self.enabled or self._cache is None:
            return

        key = self._make_key(image_path)
        if key is None:
            return

        # Augment the stored result with cache metadata.
        result = dict(result)
        result["cached_at"] = time.time()
        result["cache_hit"] = True

        self._cache.set(key, result, expire=self.ttl)
        log.debug("Cached result for %s.", image_path)

    def clear(self) -> int:
        """Clear all cache entries. Returns number of entries removed."""
        if not self.enabled or self._cache is None:
            return 0
        n = len(self._cache)
        self._cache.clear()
        log.info("Cache cleared (%d entries removed).", n)
        return n

    def stats(self) -> dict:
        """Return cache statistics."""
        if not self.enabled or self._cache is None:
            return {"enabled": False}
        return {
            "enabled": True,
            "entries": len(self._cache),
            "size_bytes": self._cache.volume(),
            "directory": str(self._cache.directory),
        }

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _make_key(self, image_path: str) -> Optional[str]:
        """Compute SHA-256 of image bytes + model version → cache key."""
        try:
            with open(image_path, "rb") as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
            return f"{digest}:{registry.version}"
        except OSError as exc:
            log.warning("Cannot read image for cache key: %s", exc)
            return None


# Module-level singleton.
ocr_cache = OCRCache(enabled=os.environ.get("LIGHTNINGOCR_CACHE", "1") != "0")
