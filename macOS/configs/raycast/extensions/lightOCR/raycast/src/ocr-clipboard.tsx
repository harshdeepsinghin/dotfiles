/**
 * ocr-clipboard.tsx — "OCR Clipboard Image" Raycast command
 *
 * Flow:
 *   1. Read image from clipboard via clipboard-image binary
 *   2. Send image path to LightningOCR daemon over Unix socket
 *   3. Show Markdown preview in Raycast Detail view
 *   4. On Enter → copy Markdown to clipboard
 *   5. On ⌘↵   → copy plain text (formulas stripped)
 *   6. On ⌘⇧C  → copy LaTeX expressions only
 */

import React, { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  getPreferenceValues,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { v4 as uuidv4 } from "uuid";
import { getClipboardImagePath, cleanupTempImage, type ClipboardImageResult } from "./lib/clipboard-helper";
import { sendToDaemon, type OCRResponse } from "./lib/daemon-client";
import type { Preferences } from "./preferences";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractLatex(markdown: string): string {
  const matches: string[] = [];
  // Display formulas: $$...$$
  const display = [...markdown.matchAll(/\$\$([\s\S]+?)\$\$/g)];
  display.forEach((m) => matches.push(m[1].trim()));
  // Inline formulas: $...$
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
// Component
// ---------------------------------------------------------------------------

type Phase =
  | { kind: "reading_clipboard" }
  | { kind: "ocr_running" }
  | { kind: "done"; result: OCRResponse; cacheHit: boolean; latencyMs: number }
  | { kind: "error"; message: string };

export default function OCRClipboard() {
  const prefs = getPreferenceValues<Preferences>();
  const [phase, setPhase] = useState<Phase>({ kind: "reading_clipboard" });
  const [clipboardResult, setClipboardResult] = useState<ClipboardImageResult | null>(null);

  useEffect(() => {
    run();
    return () => {
      // Cleanup temp file if the component unmounts before we finish.
      if (clipboardResult && !clipboardResult.isExistingFile) {
        cleanupTempImage(clipboardResult);
      }
    };
  }, []);

  async function run() {
    // Step 1 — Extract clipboard image.
    let cbResult: ClipboardImageResult | null = null;
    try {
      cbResult = await getClipboardImagePath();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "Clipboard error", message: msg });
      return;
    }

    if (!cbResult) {
      const msg = "No image found in clipboard. Take a screenshot (⌘⇧4) first.";
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "No clipboard image", message: msg });
      return;
    }

    setClipboardResult(cbResult);
    setPhase({ kind: "ocr_running" });

    await showToast({ style: Toast.Style.Animated, title: "Running OCR…" });

    // Step 2 — Send to daemon.
    const t0 = Date.now();
    let response: OCRResponse;

    try {
      response = await sendToDaemon({
        id: uuidv4(),
        operation: "ocr",
        image_path: cbResult.path,
        mode: "auto",
        quality: prefs.quality,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "OCR failed", message: msg });
      if (!cbResult.isExistingFile) cleanupTempImage(cbResult);
      return;
    }

    const latencyMs = Date.now() - t0;

    if (!cbResult.isExistingFile) cleanupTempImage(cbResult);

    if (response.status === "error") {
      const msg = response.error ?? "Unknown error from daemon";
      setPhase({ kind: "error", message: msg });
      await showToast({ style: Toast.Style.Failure, title: "OCR failed", message: msg });
      return;
    }

    setPhase({
      kind: "done",
      result: response,
      cacheHit: response.cache_hit ?? false,
      latencyMs,
    });

    await showToast({
      style: Toast.Style.Success,
      title: response.status === "low_confidence" ? "⚠ Low confidence" : "✓ OCR complete",
      message: `${latencyMs}ms  ·  Press ↵ to copy`,
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  function renderLoading(message: string): React.JSX.Element {
    return (
      <Detail
        isLoading={true}
        markdown={`## LightningOCR\n\n${message}`}
        navigationTitle="OCR Clipboard Image"
      />
    );
  }

  if (phase.kind === "reading_clipboard") return renderLoading("⏳ Reading clipboard image…");
  if (phase.kind === "ocr_running") return renderLoading("⏳ Running OCR…");

  if (phase.kind === "error") {
    return (
      <Detail
        markdown={`## ❌ Error\n\n${phase.message}`}
        navigationTitle="OCR Clipboard Image"
        actions={
          <ActionPanel>
            <Action title="Retry" onAction={() => { setPhase({ kind: "reading_clipboard" }); run(); }} />
          </ActionPanel>
        }
      />
    );
  }

  // Done
  const { result, cacheHit, latencyMs } = phase;
  const markdown = result.markdown ?? "";
  const confidence = result.confidence ?? 0;
  const latex = extractLatex(markdown);
  const plainText = stripFormulas(markdown);

  const metaLines: string[] = [];
  if (prefs.showConfidence) {
    metaLines.push(`${confidenceBadge(confidence)} Confidence: **${(confidence * 100).toFixed(1)}%**`);
  }
  metaLines.push(`⚡ ${cacheHit ? "Cache hit" : `${result.latency_ms ?? latencyMs} ms`}  ·  Route: ${routeLabel(result.route)}`);
  if (result.status === "low_confidence") {
    metaLines.push("⚠️  Low confidence — result may contain errors");
  }

  const displayMarkdown = `${metaLines.join("  \n")}\n\n---\n\n${markdown}`;

  return (
    <Detail
      markdown={displayMarkdown}
      navigationTitle="OCR Clipboard Image"
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Route" text={routeLabel(result.route)} />
          <Detail.Metadata.Label
            title="Confidence"
            text={`${(confidence * 100).toFixed(1)}%`}
          />
          <Detail.Metadata.Label
            title="Latency"
            text={cacheHit ? "Cache hit" : `${result.latency_ms ?? latencyMs} ms`}
          />
          {cacheHit && <Detail.Metadata.Label title="Source" text="Cached result" />}
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
            <Action
              title="Re-run OCR"
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={() => {
                setPhase({ kind: "reading_clipboard" });
                run();
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
