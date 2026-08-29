import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatForTelegram,
  telegramMarkdownToHtml,
  postToTelegramChannel,
} from "./telegram";

const VIGNETTE_RAW_MD = `# Vignette (विन्येट)
- **Noun:** A short descriptive scene or brief literary sketch focusing on a moment, character, or idea.
- **Noun:** A small decorative illustration or design, often fading into the background.

## Hindi Equivalent
लघु चित्रण, संक्षिप्त झलक, सजावटी चित्र

## When to use
- In literature, films, or storytelling
- For brief but vivid descriptions
- In art, photography, or graphic design

## Examples
- The novel is made up of emotional vignettes.
- उपन्यास भावनात्मक **संक्षिप्त झलकियों** से बना है।
- The film opens with a vignette from childhood.
- फ़िल्म की शुरुआत बचपन की एक **लघु झलक** से होती है।
- The page had floral vignette designs.
- पृष्ठ पर फूलों के **सजावटी चित्र** बने थे।

## Synonyms
sketch, snapshot, scene, portrayal, illustration

## Antonyms
full-length-work, detailed-account, complete-narrative

## Word Breakdown
- **vigne** → vine (French)
- **-ette** → small / diminutive

## Formation Flow
- vigne (vine decoration)
- + ette → **vignette** (small decorative design → short descriptive sketch)

## Etymology
From French 'vignette' ("small vine decoration"), originally referring to decorative vine-like illustrations in books.
`;

const SINGLE_DEF_MD = `# rebate (री-बेट)
- **Noun:** A partial refund to someone who has paid too much for a product or service.

## Hindi Equivalent
छूट, वापसी

## Synonyms
discount, refund
`;

describe("formatForTelegram", () => {
  it("formats title line with bold and 2 spaces line end", () => {
    const formatted = formatForTelegram(VIGNETTE_RAW_MD);
    expect(formatted).toContain("**Vignette (विन्येट)**  ");
  });

  it("capitalizes lowercase word names in title", () => {
    const formatted = formatForTelegram(SINGLE_DEF_MD);
    expect(formatted).toContain("**Rebate (री-बेट)**  ");
  });

  it("formats definitions inline under POS without numbering", () => {
    const formatted = formatForTelegram(VIGNETTE_RAW_MD);
    expect(formatted).toContain(
      "**Noun:** A short descriptive scene or brief literary sketch focusing on a moment, character, or idea.  ",
    );
    expect(formatted).toContain(
      "**Noun:** A small decorative illustration or design, often fading into the background.  ",
    );
  });

  it("formats section headers with double asterisks and bold", () => {
    const formatted = formatForTelegram(VIGNETTE_RAW_MD);
    expect(formatted).toContain("**Hindi Equivalent:**  ");
    expect(formatted).toContain("**When to use:**  ");
    expect(formatted).toContain("**Examples:**  ");
    expect(formatted).toContain(
      "**Synonyms:** sketch, snapshot, scene, portrayal, illustration  ",
    );
    expect(formatted).toContain(
      "**Antonyms:** full-length-work, detailed-account, complete-narrative  ",
    );
    expect(formatted).toContain("**Word Breakdown:**");
    expect(formatted).toContain("**Formation Flow:**");
    expect(formatted).toContain("**Etymology:**  ");
  });

  it("converts single-quoted origin terms in Etymology to __term__ (double underscore italic)", () => {
    const formatted = formatForTelegram(VIGNETTE_RAW_MD);
    expect(formatted).toContain("From French __vignette__");
  });

  it("returns empty string for empty input", () => {
    expect(formatForTelegram("")).toBe("");
    expect(formatForTelegram("   ")).toBe("");
  });
});

describe("telegramMarkdownToHtml", () => {
  it("converts **bold** to <b>bold</b>", () => {
    const input = "**Vignette (विन्येट)**";
    expect(telegramMarkdownToHtml(input)).toBe("<b>Vignette (विन्येट)</b>");
  });

  it("converts __italic__ to <i>italic</i>", () => {
    const input = "From French __vignette__";
    expect(telegramMarkdownToHtml(input)).toBe("From French <i>vignette</i>");
  });

  it("escapes HTML special characters (&, <, >)", () => {
    const input = "A & B < C > D";
    expect(telegramMarkdownToHtml(input)).toBe("A &amp; B &lt; C &gt; D");
  });
});

describe("postToTelegramChannel", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns error if botToken or chatId is missing", async () => {
    const res1 = await postToTelegramChannel("", "@channel", "test");
    expect(res1.success).toBe(false);
    expect(res1.message).toContain("Bot Token is required");

    const res2 = await postToTelegramChannel("token", "", "test");
    expect(res2.success).toBe(false);
    expect(res2.message).toContain("Chat ID is required");
  });

  it("returns success: true when Telegram API returns ok: true", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 123 } }),
    });

    const res = await postToTelegramChannel(
      "123:ABC",
      "@mychannel",
      "**Test**",
    );
    expect(res.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:ABC/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("<b>Test</b>"),
      }),
    );
  });

  it("handles 401 Unauthorized API error gracefully", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({
        ok: false,
        error_code: 401,
        description: "Unauthorized",
      }),
    });

    const res = await postToTelegramChannel(
      "invalid_token",
      "@mychannel",
      "test",
    );
    expect(res.success).toBe(false);
    expect(res.message).toContain("Invalid Telegram Bot Token");
  });
});

describe("deleteTelegramMessage", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls deleteMessage endpoint on Telegram API", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { deleteTelegramMessage } = await import("./telegram");
    const res = await deleteTelegramMessage("123:ABC", "@mychannel", 999);
    expect(res.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:ABC/deleteMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ chat_id: "@mychannel", message_id: 999 }),
      }),
    );
  });
});
