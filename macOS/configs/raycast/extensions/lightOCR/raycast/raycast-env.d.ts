/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** OCR Quality - Controls the trade-off between speed and accuracy. 'Balanced' is recommended for most use cases. */
  "quality": "fast" | "balanced" | "accurate",
  /** Preload Formula Model - Load the math recognition model at daemon startup instead of on first use. Increases startup time but eliminates the first-formula delay. */
  "preloadFormula": boolean,
  /** Show Confidence Score - Display the OCR confidence score in the result preview. */
  "showConfidence": boolean,
  /** Enable Result Cache - Cache OCR results by image hash. Identical screenshots are returned instantly. */
  "cacheEnabled": boolean,
  /** Daemon Socket Path - Unix domain socket path for the LightningOCR daemon. */
  "socketPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `ocr-clipboard` command */
  export type OcrClipboard = ExtensionPreferences & {}
  /** Preferences accessible in the `ocr-file` command */
  export type OcrFile = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `ocr-clipboard` command */
  export type OcrClipboard = {}
  /** Arguments passed to the `ocr-file` command */
  export type OcrFile = {}
}

