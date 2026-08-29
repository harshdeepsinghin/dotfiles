"""
server.py — LightningOCR asyncio Unix domain socket server.

Entry point for the daemon. Starts up, pre-warms models, then listens on
the Unix socket at /tmp/lightningocr.sock (configurable via env).

Protocol: newline-delimited JSON (each request/response is one JSON line).

Request fields:
    id          str   — client-generated request ID (echoed in response)
    operation   str   — "ocr" | "ping" | "status" | "cache_clear"
    image_path  str   — (ocr only) absolute path to image file
    mode        str   — "auto" | "text" | "formula" | "mixed"
    quality     str   — "fast" | "balanced" | "accurate"

Response fields:
    id          str
    status      str   — "success" | "error" | "low_confidence"
    markdown    str   — (ocr success)
    confidence  float
    route       str
    latency_ms  float
    error       str   — (error only)
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import sys
import time
import uuid
from pathlib import Path

# Ensure daemon package root is on sys.path regardless of cwd.
sys.path.insert(0, str(Path(__file__).parent))

from cache import ocr_cache
from engines.pix2text_engine import pix2text_engine, PRELOAD_FORMULA_MODEL
from engines.vision_engine import vision_engine
from models import registry
from preprocessor import preprocessor
from router import router

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------

SOCKET_PATH = os.environ.get("LIGHTNINGOCR_SOCKET", "/tmp/lightningocr.sock")
LOG_LEVEL = os.environ.get("LIGHTNINGOCR_LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("server")

# Confidence below which we flag the result as low_confidence.
CONFIDENCE_LOW = float(os.environ.get("LIGHTNINGOCR_CONF_LOW", "0.75"))


# ------------------------------------------------------------------
# Request handler
# ------------------------------------------------------------------

async def handle_connection(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
    peer = writer.get_extra_info("peername", "unknown")
    log.debug("New connection from %s.", peer)

    try:
        while True:
            raw = await reader.readline()
            if not raw:
                break  # Client disconnected.

            t_recv = time.perf_counter()
            await handle_request(raw.decode().strip(), writer, t_recv)

    except (asyncio.IncompleteReadError, ConnectionResetError):
        pass
    except Exception as exc:
        log.error("Unexpected error in connection handler: %s", exc, exc_info=True)
    finally:
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass


async def handle_request(raw: str, writer: asyncio.StreamWriter, t_recv: float) -> None:
    req_id = "unknown"
    try:
        req = json.loads(raw)
        req_id = req.get("id", str(uuid.uuid4()))
        operation = req.get("operation", "ocr")

        if operation == "ping":
            await send(writer, {"id": req_id, "status": "success", "pong": True})
            return

        if operation == "status":
            await send(writer, {
                "id": req_id,
                "status": "success",
                "models": registry.status_dict(),
                "cache": ocr_cache.stats(),
                "vision_available": vision_engine.is_available(),
                "pix2text_loaded": pix2text_engine.is_loaded(),
                "total_memory_mb": registry.total_memory_mb(),
            })
            return

        if operation == "cache_clear":
            n = ocr_cache.clear()
            await send(writer, {"id": req_id, "status": "success", "cleared": n})
            return

        if operation == "ocr":
            await handle_ocr(req, req_id, writer)
            return

        await send_error(writer, req_id, f"Unknown operation: {operation!r}")

    except json.JSONDecodeError as exc:
        await send_error(writer, req_id, f"Invalid JSON: {exc}")
    except Exception as exc:
        log.error("Error handling request %s: %s", req_id, exc, exc_info=True)
        await send_error(writer, req_id, str(exc))


async def handle_ocr(req: dict, req_id: str, writer: asyncio.StreamWriter) -> None:
    image_path = req.get("image_path", "").strip()
    mode = req.get("mode", "auto")
    quality = req.get("quality", "balanced")

    if not image_path:
        await send_error(writer, req_id, "Missing image_path.")
        return

    if not Path(image_path).exists():
        await send_error(writer, req_id, f"Image not found: {image_path}")
        return

    log.info("[OCR] %s  mode=%s  quality=%s", Path(image_path).name, mode, quality)

    # ---- Cache check ----
    cached = ocr_cache.get(image_path)
    if cached:
        log.info("[CACHE HIT] Returning cached result.")
        cached["id"] = req_id
        await send(writer, cached)
        return

    # ---- Adaptive preprocessing ----
    pre = preprocessor.process(image_path)
    effective_path = pre.path
    if pre.operations:
        log.debug("Preprocessing ops: %s → %s", pre.operations, effective_path)

    # ---- Route + recognize ----
    try:
        result = await router.process(effective_path, mode=mode, quality=quality)
    except Exception as exc:
        log.error("Router error: %s", exc, exc_info=True)
        await send_error(writer, req_id, f"OCR failed: {exc}")
        return

    # ---- Build response ----
    confidence = result.get("confidence", 0.0)
    status = "low_confidence" if confidence < CONFIDENCE_LOW else "success"

    response = {
        "id": req_id,
        "status": status,
        "markdown": result.get("markdown", ""),
        "confidence": confidence,
        "route": result.get("route", "unknown"),
        "latency_ms": result.get("latency_ms", 0.0),
    }

    # ---- Cache the result ----
    if status == "success":
        ocr_cache.put(image_path, response)

    # ---- Cleanup temp preprocessing file ----
    if pre.was_modified:
        try:
            Path(pre.path).unlink(missing_ok=True)
        except Exception:
            pass

    await send(writer, response)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

async def send(writer: asyncio.StreamWriter, data: dict) -> None:
    line = json.dumps(data, ensure_ascii=False) + "\n"
    writer.write(line.encode())
    await writer.drain()


async def send_error(writer: asyncio.StreamWriter, req_id: str, message: str) -> None:
    log.warning("[ERROR] %s: %s", req_id, message)
    await send(writer, {"id": req_id, "status": "error", "error": message})


# ------------------------------------------------------------------
# Startup / shutdown
# ------------------------------------------------------------------

async def startup() -> None:
    log.info("LightningOCR daemon starting…")

    # Mark Vision as always available (it's a system framework).
    info = registry.get("vision_ocr")
    if info:
        if vision_engine.is_available():
            info.mark_loaded(instance="system_framework", estimated_mb=0)
            log.info("Apple Vision OCR: available.")
        else:
            log.warning("vision-ocr binary not found — text fast path unavailable.")

    # Optionally preload Pix2Text.
    if PRELOAD_FORMULA_MODEL:
        log.info("Preloading Pix2Text formula model (PRELOAD_FORMULA_MODEL=1)…")
        await pix2text_engine.ensure_loaded()

    log.info("Daemon ready. Listening on %s.", SOCKET_PATH)


async def main() -> None:
    # Remove stale socket file.
    socket_path = Path(SOCKET_PATH)
    if socket_path.exists():
        socket_path.unlink()

    # Graceful shutdown on SIGTERM/SIGINT.
    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _signal_handler():
        log.info("Shutdown signal received.")
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _signal_handler)

    await startup()

    server = await asyncio.start_unix_server(
        handle_connection,
        path=SOCKET_PATH,
    )

    # Restrict socket permissions: owner read/write only.
    socket_path.chmod(0o600)

    async with server:
        try:
            await stop_event.wait()
        finally:
            log.info("Shutting down server…")
            server.close()
            await server.wait_closed()
            socket_path.unlink(missing_ok=True)
            log.info("Goodbye.")


if __name__ == "__main__":
    asyncio.run(main())
