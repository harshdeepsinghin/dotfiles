/**
 * ocr-file.tsx — "OCR Image File" Raycast command
 *
 * Opens a file picker (via open dialog or Finder selection), sends the
 * image to the LightningOCR daemon, and shows the same Markdown preview
 * as the clipboard command.
 */

import React, { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  getPreferenceValues,
  getSelectedFinderItems,
  open,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { sendToDaemon, type OCRResponse } from "./lib/daemon-client";
import type { Preferences } from "./preferences";

// ---------------------------------------------------------------------------
// Helpers (shared with ocr-clipboard)
// ---------------------------------------------------------------------------

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".heic", ".bmp"];

function isSupportedImage(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

function extractLatex(markdown: string): string {
  const matches: string[] = [];
  const display = [...markdown.matchAll(/\$\$([\s\S]+?)\$\$/g)];
  display.forEach((m) => matches.push(m[1].trim()));
  const inline = [...markdown.matchAll(/(?<!\$)\$(?!\$)([\s\S]+?)(?<!\$)\$(?!\$)/g)];
  inline.forEach((m) => matches.push(m[1].trim()));
  return matches.join("\n\n");
}

function stripFormulas(markdown: string): string {
  let text = markdown;
  text = text.replace(/\$\$[\s\S]+?\$\$/g, "");
  text = text.replace(/(?<!\$)\$(?!\$)[\s\S]+?(?<!\$)\$(?!\$)/g, "");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 0.95) return "🟢";
  if (confidence >= 0.80) return "🟡";
  return "🔴";
}

function routeLabel(route?: string): string {
  switch (route) {
    case "text":    return "Vision Text";
    case "formula": return "MFR Formula";
    case "mixed":   return "Layout + Mixed";
    default:        return route ?? "auto";
  }
}

// ---------------------------------------------------------------------------
// Phase type
// ---------------------------------------------------------------------------

type Phase =
  | { kind: "selecting" }
  | { kind: "ocr_running"; filePath: string }
  | { kind: "done"; result: OCRResponse; filePath: string; latencyMs: number }
  | { kind: "error"; message: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OCRFile() {
  const prefs = getPreferenceValues<Preferences>();
  const [phase, setPhase] = useState<Phase>({ kind: "selecting" });

  useEffect(() => {
    run();
  }, []);

  async function run() {
    setPhase({ kind: "selecting" });

    // Try to get the currently selected Finder item first.
    let filePath: string | null = null;
    try {
      const selected = await getSelectedFinderItems();
      const img = selected.find((item) => isSupportedImage(item.path));
      if (img) filePath = img.path;
    } catch {
      // Finder not active — fall through to file picker.
    }

    if (!filePath) {
      // Show toast prompting user to use Finder.
      await showToast({
        style: Toast.Style.Animated,
        title: "Select an image in Finder",
        message: "Then re-run this command, or open Finder and select an image first.",
      });
      // Open Finder as a helpful hint.
      try {
        await open("/");
      } catch { /* ignore */ }
      setPhase({ kind: "error", message: "No image selected. Select an image file in Finder and run this command again." });
      return;
    }

    if (!isSupportedImage(filePath)) {
      const msg = `Unsupported file type: ${path.extname(filePath)}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`;
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "Unsupported file", message: msg });
      return;
    }

    setPhase({ kind: "ocr_running", filePath });
    await showToast({ style: Toast.Style.Animated, title: "Running OCR…", message: path.basename(filePath) });

    const t0 = Date.now();
    let response: OCRResponse;

    try {
      response = await sendToDaemon({
        id: uuidv4(),
        operation: "ocr",
        image_path: filePath,
        mode: "auto",
        quality: prefs.quality,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "OCR failed", message: msg });
      return;
    }

    const latencyMs = Date.now() - t0;

    if (response.status === "error") {
      const msg = response.error ?? "Unknown daemon error";
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "OCR failed", message: msg });
      return;
    }

    setPhase({ kind: "done", result: response, filePath, latencyMs });

    await showToast({
      style: Toast.Style.Success,
      title: response.status === "low_confidence" ? "⚠ Low confidence" : "✓ OCR complete",
      message: `${response.latency_ms ?? latencyMs}ms  ·  Press ↵ to copy`,
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (phase.kind === "selecting") {
    return (
      <Detail
        isLoading
        markdown="## LightningOCR\n\n⏳ Looking for selected Finder image…"
        navigationTitle="OCR Image File"
      />
    );
  }

  if (phase.kind === "ocr_running") {
    return (
      <Detail
        isLoading
        markdown={`## LightningOCR\n\n⏳ Running OCR on **${path.basename(phase.filePath)}**…`}
        navigationTitle="OCR Image File"
      />
    );
  }

  if (phase.kind === "error") {
    return (
      <Detail
        markdown={`## ❌ Error\n\n${phase.message}`}
        navigationTitle="OCR Image File"
        actions={
          <ActionPanel>
            <Action title="Retry" onAction={run} />
          </ActionPanel>
        }
      />
    );
  }

  // Done
  const { result, filePath, latencyMs } = phase;
  const markdown = result.markdown ?? "";
  const confidence = result.confidence ?? 0;
  const latex = extractLatex(markdown);
  const plainText = stripFormulas(markdown);
  const cacheHit = result.cache_hit ?? false;

  const metaLines: string[] = [];
  if (prefs.showConfidence) {
    metaLines.push(`${confidenceBadge(confidence)} Confidence: **${(confidence * 100).toFixed(1)}%**`);
  }
  metaLines.push(`📄 \`${path.basename(filePath)}\``);
  metaLines.push(`⚡ ${cacheHit ? "Cache hit" : `${result.latency_ms ?? latencyMs} ms`}  ·  Route: ${routeLabel(result.route)}`);
  if (result.status === "low_confidence") {
    metaLines.push("⚠️  Low confidence — result may contain errors");
  }

  const displayMarkdown = `${metaLines.join("  \n")}\n\n---\n\n${markdown}`;

  return (
    <Detail
      markdown={displayMarkdown}
      navigationTitle={`OCR — ${path.basename(filePath)}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="File" text={path.basename(filePath)} />
          <Detail.Metadata.Label title="Route" text={routeLabel(result.route)} />
          <Detail.Metadata.Label title="Confidence" text={`${(confidence * 100).toFixed(1)}%`} />
          <Detail.Metadata.Label
            title="Latency"
            text={cacheHit ? "Cache hit" : `${result.latency_ms ?? latencyMs} ms`}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Copy">
            <Action
              title="Copy Markdown"
              shortcut={{ modifiers: [], key: "return" }}
              onAction={async () => {
                await Clipboard.copy(markdown);
                await showHUD("✓ Markdown copied");
              }}
            />
            <Action
              title="Copy Plain Text"
              shortcut={{ modifiers: ["cmd"], key: "return" }}
              onAction={async () => {
                await Clipboard.copy(plainText);
                await showHUD("✓ Plain text copied");
              }}
            />
            {latex && (
              <Action
                title="Copy LaTeX Only"
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                onAction={async () => {
                  await Clipboard.copy(latex);
                  await showHUD("✓ LaTeX copied");
                }}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section title="Actions">
            <Action title="Re-run OCR" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={run} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
