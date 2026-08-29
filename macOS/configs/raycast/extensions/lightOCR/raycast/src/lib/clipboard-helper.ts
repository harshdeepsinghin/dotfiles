/**
 * clipboard-helper.ts
 *
 * Calls the compiled `clipboard-image` Swift binary to extract the current
 * clipboard image to a temp file and returns its path.
 *
 * The binary path is resolved relative to the extension's assets directory,
 * with a fallback to the project's native/bin directory for development.
 */

import path from "path";
import os from "os";
import fs from "fs";
import { execa } from "execa";
import { environment } from "@raycast/api";

// ------------------------------------------------------------------
// Binary resolution
// ------------------------------------------------------------------

/** Paths searched in order for the clipboard-image binary. */
function findBinaryPath(): string | null {
  const candidates = [
    // 1. Raycast bundled assets directory
    path.join(environment.assetsPath, "bin", "clipboard-image"),
    path.join(environment.assetsPath, "clipboard-image"),
    // 2. Absolute project workspace paths
    "/Users/ektara/gitrepos/dotfiles/macOS/configs/raycast/extensions/lightOCR/raycast/assets/bin/clipboard-image",
    "/Users/ektara/gitrepos/dotfiles/macOS/configs/raycast/extensions/lightOCR/native/bin/clipboard-image",
    "/Users/ektara/gitrepos/dotfiles/macOS/configs/raycast/extensions/lightOCR/native/.build/release/clipboard-image",
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

export interface ClipboardImageResult {
  /** Absolute path to the temp file containing the clipboard image. */
  path: string;
  /** True if this is a pre-existing file on disk (not a temp copy). */
  isExistingFile: boolean;
}

/**
 * Extract the clipboard image to a temp file.
 *
 * @returns `ClipboardImageResult` on success, or `null` if there is no image
 *          in the clipboard.
 * @throws if the binary is not found or fails unexpectedly.
 */
export async function getClipboardImagePath(): Promise<ClipboardImageResult | null> {
  const binaryPath = findBinaryPath();

  if (!binaryPath) {
    throw new Error(
      "clipboard-image binary not found. " +
        "Run `./scripts/install.sh` to build the native helpers."
    );
  }

  let result;
  try {
    result = await execa(binaryPath, [], { reject: false });
  } catch (err) {
    throw new Error(`clipboard-image failed to execute: ${err}`);
  }

  // Exit code 1 = no image in clipboard (expected, not an error).
  if (result.exitCode === 1) {
    return null;
  }

  if (result.exitCode !== 0) {
    throw new Error(
      `clipboard-image exited with code ${result.exitCode}: ${result.stderr}`
    );
  }

  const imagePath = String(result.stdout).trim();
  if (!imagePath) return null;

  // Determine if this is a temp copy (lightningocr_clipboard_*.png)
  // or a reference to an existing file.
  const isExistingFile = !path.basename(imagePath).startsWith("lightningocr_clipboard_");

  return { path: imagePath, isExistingFile };
}

/**
 * Clean up a temp clipboard image file after use.
 * Safe to call with an existing-file path (it won't delete those).
 */
export function cleanupTempImage(result: ClipboardImageResult): void {
  if (result.isExistingFile) return;
  try {
    fs.unlinkSync(result.path);
  } catch {
    // Ignore cleanup errors.
  }
}
