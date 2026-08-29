# LightningOCR

A macOS-native, permanently-warm OCR engine for Raycast. Converts clipboard images containing text and mathematical formulas into clean Markdown with LaTeX.

## Architecture

```
macOS Boot → launchd → LightningOCR Daemon (Python, models warm)
                              ↑
                    Unix Domain Socket
                              ↑
                    Raycast Extension (TypeScript)
                              ↑
                           User
```

- **Fast path** (plain text): Apple Vision framework via Swift CLI → <150ms P50
- **Formula path**: Pix2Text MFD + MFR → LaTeX in `$...$` / `$$...$$`
- **Mixed path**: Layout analysis → regions routed to Vision or MFR individually
- **Cache**: SHA-256 hash → diskcache → <10ms on repeat screenshots

## Requirements

- macOS 13+ (Ventura or later)
- Apple Silicon (M1/M2/M3/M4/M5) — Intel via CPU fallback
- Python 3.10+
- Swift 5.9+ (Xcode Command Line Tools)
- Raycast

## Install

```bash
cd lightOCR
chmod +x scripts/install.sh
./scripts/install.sh
```

The install script will:
1. Create a Python venv and install Pix2Text + dependencies
2. Download OCR models (~1–2 GB, one-time)
3. Compile Swift native helpers
4. Install and activate the launchd LaunchAgent
5. Run a warm-up inference

## Raycast Commands

| Command | Description |
|---|---|
| **OCR Clipboard Image** | OCRs whatever image is in your clipboard |
| **OCR Image File** | Opens file picker, OCRs selected image |

### Typical workflow

```
⌘ Shift 4          → screenshot to clipboard
⌘ Space            → open Raycast
OCR Clipboard Image → Enter
⏎                  → Markdown copied to clipboard
```

## IPC Protocol

Unix domain socket: `/tmp/lightningocr.sock`

**Request:**
```json
{
  "id": "req-123",
  "operation": "ocr",
  "image_path": "/tmp/clipboard.png",
  "mode": "auto",
  "quality": "balanced"
}
```

**Response:**
```json
{
  "id": "req-123",
  "status": "success",
  "markdown": "The value of $x$ is 5.",
  "confidence": 0.98,
  "mode": "text",
  "latency_ms": 87
}
```

## Project Structure

```
lightOCR/
├── daemon/           # Python asyncio OCR server
│   ├── engines/      # Vision + Pix2Text wrappers
│   ├── server.py     # Unix socket server
│   ├── router.py     # Intelligent request router
│   ├── cache.py      # SHA-256 result cache
│   ├── markdown.py   # Region → Markdown assembler
│   ├── preprocessor.py
│   └── models.py
├── native/           # Swift CLI helpers
│   ├── Sources/
│   │   ├── vision-ocr/      # Apple Vision text recognition
│   │   └── clipboard-image/ # NSPasteboard image extraction
│   └── Package.swift
├── raycast/          # Raycast extension (TypeScript/React)
│   └── src/
│       ├── ocr-clipboard.tsx
│       ├── ocr-file.tsx
│       └── lib/
├── scripts/          # Install, launchd plist, warmup
└── README.md
```

## Performance Targets

| Scenario | P50 | P95 |
|---|---|---|
| Plain text (warm) | <150ms | <400ms |
| Formula (warm) | <500ms | <1.5s |
| Cache hit | <10ms | <10ms |
| Cold start | one-time | — |

## Privacy

All OCR runs locally. No images are uploaded. No network requests. The daemon listens only on a Unix domain socket.
