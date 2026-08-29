/**
 * daemon-client.ts
 *
 * Typed client for the LightningOCR Unix domain socket daemon.
 * Uses Node's `net` module to connect, send a single JSON request,
 * and receive the JSON response line.
 *
 * Also handles daemon-not-running detection: if the socket doesn't exist or
 * the connection is refused, attempts to start the daemon via launchctl
 * and retries once.
 */

import net from "net";
import { execSync } from "child_process";
import path from "path";
import os from "os";
import { getPreferenceValues } from "@raycast/api";
import type { Preferences } from "../preferences";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OCRRequest {
  id: string;
  operation: "ocr" | "ping" | "status" | "cache_clear";
  image_path?: string;
  mode?: "auto" | "text" | "formula" | "mixed";
  quality?: "fast" | "balanced" | "accurate";
}

export interface OCRResponse {
  id: string;
  status: "success" | "error" | "low_confidence";
  markdown?: string;
  confidence?: number;
  route?: string;
  latency_ms?: number;
  error?: string;
  cache_hit?: boolean;
  // ping
  pong?: boolean;
  // status
  models?: Record<string, unknown>;
  cache?: Record<string, unknown>;
  vision_available?: boolean;
  pix2text_loaded?: boolean;
  total_memory_mb?: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LAUNCHD_LABEL = "com.lightningocr.daemon";
const DAEMON_PLIST = path.join(os.homedir(), "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);
const CONNECT_TIMEOUT_MS = 3000;
const REQUEST_TIMEOUT_MS = 30_000;
const AUTO_START_RETRY_DELAY_MS = 2000;

function getSocketPath(): string {
  try {
    const prefs = getPreferenceValues<Preferences>();
    return prefs.socketPath || "/tmp/lightningocr.sock";
  } catch {
    return "/tmp/lightningocr.sock";
  }
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

function sendRequest(socketPath: string, request: OCRRequest): Promise<OCRResponse> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ path: socketPath });
    let buffer = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error("Request timed out after " + REQUEST_TIMEOUT_MS + "ms"));
      }
    }, REQUEST_TIMEOUT_MS);

    const connectTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error("DAEMON_NOT_RUNNING"));
      }
    }, CONNECT_TIMEOUT_MS);

    socket.on("connect", () => {
      clearTimeout(connectTimeout);
      const line = JSON.stringify(request) + "\n";
      socket.write(line);
    });

    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      const newlineIdx = buffer.indexOf("\n");
      if (newlineIdx !== -1) {
        clearTimeout(timeout);
        const jsonLine = buffer.slice(0, newlineIdx);
        socket.end();
        if (!settled) {
          settled = true;
          try {
            resolve(JSON.parse(jsonLine) as OCRResponse);
          } catch (e) {
            reject(new Error(`Failed to parse daemon response: ${jsonLine}`));
          }
        }
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      clearTimeout(connectTimeout);
      if (!settled) {
        settled = true;
        const msg = err.message || String(err);
        if (msg.includes("ENOENT") || msg.includes("ECONNREFUSED")) {
          reject(new Error("DAEMON_NOT_RUNNING"));
        } else {
          reject(err);
        }
      }
    });

    socket.on("close", () => {
      clearTimeout(timeout);
      clearTimeout(connectTimeout);
    });
  });
}

// ---------------------------------------------------------------------------
// Auto-start the daemon if not running
// ---------------------------------------------------------------------------

function startDaemon(): void {
  try {
    execSync(`launchctl load -w "${DAEMON_PLIST}" 2>/dev/null || launchctl kickstart -k gui/$(id -u)/${LAUNCHD_LABEL} 2>/dev/null || true`);
  } catch {
    // Ignore — daemon may already be running or plist not yet installed.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an OCR request to the daemon.
 * If the daemon is not running, attempts to start it via launchctl and retries once.
 */
export async function sendToDaemon(request: OCRRequest): Promise<OCRResponse> {
  const socketPath = getSocketPath();

  try {
    return await sendRequest(socketPath, request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg === "DAEMON_NOT_RUNNING") {
      // Attempt auto-start.
      startDaemon();
      await sleep(AUTO_START_RETRY_DELAY_MS);

      try {
        return await sendRequest(socketPath, request);
      } catch (retryErr) {
        throw new Error(
          "LightningOCR daemon is not running. Run `./scripts/install.sh` to set it up, " +
            "or start it manually with: python daemon/server.py"
        );
      }
    }

    throw err;
  }
}

/**
 * Ping the daemon to check if it's alive. Returns true if alive.
 */
export async function pingDaemon(): Promise<boolean> {
  const socketPath = getSocketPath();
  try {
    const resp = await sendRequest(socketPath, { id: "ping", operation: "ping" });
    return resp.pong === true;
  } catch {
    return false;
  }
}

/**
 * Fetch daemon status (model load state, cache stats, memory usage).
 */
export async function getDaemonStatus(): Promise<OCRResponse> {
  return sendToDaemon({ id: "status", operation: "status" });
}
