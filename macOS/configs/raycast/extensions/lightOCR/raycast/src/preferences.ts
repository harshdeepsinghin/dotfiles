/**
 * preferences.ts
 *
 * Typed interface for all LightningOCR Raycast preferences.
 * Used with `getPreferenceValues<Preferences>()` from @raycast/api.
 */

export interface Preferences {
  /** OCR quality level. */
  quality: "fast" | "balanced" | "accurate";

  /** If true, Pix2Text formula model is loaded at daemon startup. */
  preloadFormula: boolean;

  /** If true, show the confidence score in the result preview. */
  showConfidence: boolean;

  /** If true, the result cache is enabled. */
  cacheEnabled: boolean;

  /** Unix domain socket path for the daemon. */
  socketPath: string;
}
