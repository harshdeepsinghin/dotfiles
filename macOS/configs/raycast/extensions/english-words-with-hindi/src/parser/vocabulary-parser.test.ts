import { describe, it, expect } from "vitest";
import { parseVocabularyFile, expandPath } from "./vocabulary-parser";
import os from "os";
import path from "path";

// ---------------------------------------------------------------------------
// Sample markdown strings matching the format produced by know-about-words.tsx
// ---------------------------------------------------------------------------

const FULL_WORD_MD = `# atonement (अटोन्मेंट)
- **Noun:** The action of making amends for a wrong or injury; reparation or reconciliation.

## Hindi Equivalent
प्रायश्चित्त, क्षतिपूर्ति, मेल-मिलाप

## When to use
- When someone seeks to make amends for past wrongdoings.
- When referring to an act of reparation for an offense.
- In religious contexts, signifying reconciliation with God.

## Examples
- He sought atonement for his past mistakes.
- उसने अपनी पिछली गलतियों के लिए प्रायश्चित्त मांगा।
- The story explores themes of sin and atonement.
- कहानी पाप और प्रायश्चित्त के विषयों की पड़ताल करती है।

## Synonyms
reparation, expiation, penance, amends, reconciliation

## Antonyms
offense, sin, wrongdoing, unforgiveness, alienation

## Etymology
From Middle English "atonement" (1520s), literally "at-one-ment".
`;

const MULTI_POS_MD = `# run (रन)
- **Noun:** An act of running; a journey or trip.
- **Verb:** To move swiftly on foot.
- **Adjective:** Having been run or operated.

## Hindi Equivalent
दौड़, भागना

## Synonyms
sprint, jog, dash
`;

const BARE_BOLD_MD = `# ephemeral (एफेमरल)
**Adjective:** Lasting for a very short time; transitory.

## Synonyms
transient, fleeting, momentary
`;

const MISSING_DEFINITION_MD = `# ghost (घोस्ट)

## Hindi Equivalent
भूत, प्रेत

## Synonyms
specter, phantom
`;

const MISSING_H1_MD = `## Hindi Equivalent
प्रायश्चित्त

**Noun:** Something without a title.
`;

const MINIMAL_VALID_MD = `# zeal
- **Noun:** Great energy or enthusiasm in pursuit of a cause.
`;

const NO_OPTIONAL_SECTIONS_MD = `# quaff (क्वाफ)
**Verb:** To drink heartily.
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseVocabularyFile", () => {
  describe("basic extraction", () => {
    it("extracts the word name (lowercased) from the h1 heading", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result).not.toBeNull();
      expect(result!.word).toBe("atonement");
    });

    it("extracts pronunciation from parenthetical in the h1 heading", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.pronunciation).toBe("अटोन्मेंट");
    });

    it("extracts a single Noun definition from a list-item line", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.definitions).toHaveLength(1);
      expect(result!.definitions[0].partOfSpeech).toBe("Noun");
      expect(result!.definitions[0].meaning).toContain("making amends");
    });

    it("extracts multiple part-of-speech definitions", () => {
      const result = parseVocabularyFile(MULTI_POS_MD);
      expect(result!.definitions).toHaveLength(3);
      expect(result!.definitions.map((d) => d.partOfSpeech)).toEqual([
        "Noun",
        "Verb",
        "Adjective",
      ]);
    });

    it("extracts definition from bare **POS:** line (no leading dash)", () => {
      const result = parseVocabularyFile(BARE_BOLD_MD);
      expect(result!.definitions).toHaveLength(1);
      expect(result!.definitions[0].partOfSpeech).toBe("Adjective");
      expect(result!.definitions[0].meaning).toContain("very short time");
    });
  });

  describe("optional sections", () => {
    it("extracts Hindi equivalent as array of trimmed strings", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.hindiEquivalent).toEqual([
        "प्रायश्चित्त",
        "क्षतिपूर्ति",
        "मेल-मिलाप",
      ]);
    });

    it("extracts when-to-use bullet points", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.whenToUse).toHaveLength(3);
      expect(result!.whenToUse![0]).toContain("make amends");
    });

    it("extracts English example sentences only (skipping Hindi translations)", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.examples).toHaveLength(2);
      expect(result!.examples![0]).toBe(
        "He sought atonement for his past mistakes.",
      );
      expect(result!.examples![1]).toContain("story explores");
    });

    it("extracts synonyms as an array", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.synonyms).toEqual([
        "reparation",
        "expiation",
        "penance",
        "amends",
        "reconciliation",
      ]);
    });

    it("extracts antonyms as an array", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      expect(result!.antonyms).toEqual([
        "offense",
        "sin",
        "wrongdoing",
        "unforgiveness",
        "alienation",
      ]);
    });

    it("does not include Etymology section in any parsed field", () => {
      const result = parseVocabularyFile(FULL_WORD_MD);
      const parsedFields = { ...result } as Record<string, unknown>;
      delete parsedFields.rawMarkdown;
      expect(JSON.stringify(parsedFields)).not.toContain("at-one-ment");
    });
  });

  describe("null / missing required fields", () => {
    it("returns null when content has no h1 heading", () => {
      expect(parseVocabularyFile(MISSING_H1_MD)).toBeNull();
    });

    it("returns null when no part-of-speech definitions are found", () => {
      expect(parseVocabularyFile(MISSING_DEFINITION_MD)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseVocabularyFile("")).toBeNull();
    });

    it("returns null for whitespace-only content", () => {
      expect(parseVocabularyFile("   \n\n   ")).toBeNull();
    });
  });

  describe("partial / minimal files", () => {
    it("returns a valid object with just word + definition (no optional sections)", () => {
      const result = parseVocabularyFile(NO_OPTIONAL_SECTIONS_MD);
      expect(result).not.toBeNull();
      expect(result!.word).toBe("quaff");
      expect(result!.definitions[0].partOfSpeech).toBe("Verb");
      expect(result!.hindiEquivalent).toBeUndefined();
      expect(result!.whenToUse).toBeUndefined();
      expect(result!.examples).toBeUndefined();
      expect(result!.synonyms).toBeUndefined();
      expect(result!.antonyms).toBeUndefined();
    });

    it("returns a valid object when pronunciation is absent", () => {
      const result = parseVocabularyFile(MINIMAL_VALID_MD);
      expect(result).not.toBeNull();
      expect(result!.word).toBe("zeal");
      expect(result!.pronunciation).toBeUndefined();
    });

    it("omits synonyms when Synonyms section is present but empty", () => {
      const md = `# blank (ब्लैंक)\n**Noun:** An empty space.\n\n## Synonyms\n`;
      const result = parseVocabularyFile(md);
      expect(result).not.toBeNull();
      expect(result!.synonyms).toBeUndefined();
    });
  });

  describe("idempotence (Requirement 1.4)", () => {
    it("produces identical results when parsing the same content twice", () => {
      const first = parseVocabularyFile(FULL_WORD_MD);
      const second = parseVocabularyFile(FULL_WORD_MD);
      expect(first).toEqual(second);
    });

    it("produces identical results for multi-POS content", () => {
      const first = parseVocabularyFile(MULTI_POS_MD);
      const second = parseVocabularyFile(MULTI_POS_MD);
      expect(first).toEqual(second);
    });
  });

  describe("real-file format variants", () => {
    it("parses a file where definitions appear without leading dashes", () => {
      // atonement.md style: bare **Noun:** line after h1
      const md = `# atonement (अटोन्मेंट)\n**Noun:** The action of making amends.\n\n## Synonyms\nreparation`;
      const result = parseVocabularyFile(md);
      expect(result).not.toBeNull();
      expect(result!.definitions[0].partOfSpeech).toBe("Noun");
    });

    it("handles multi-line Hindi Equivalent section gracefully", () => {
      const md = `# word (वर्ड)\n**Noun:** A unit of language.\n\n## Hindi Equivalent\nशब्द, वाक्य`;
      const result = parseVocabularyFile(md);
      expect(result!.hindiEquivalent).toEqual(["शब्द", "वाक्य"]);
    });
  });
});

describe("expandPath", () => {
  it("expands ~/path to home directory path", () => {
    const expanded = expandPath("~/words");
    expect(expanded).toBe(path.join(os.homedir(), "words"));
  });

  it("leaves an absolute path unchanged (relative to cwd via resolve)", () => {
    const result = expandPath("/tmp/test");
    expect(result).toBe("/tmp/test");
  });

  it("expands ~/nested/path correctly", () => {
    const expanded = expandPath("~/some/deep/dir");
    expect(expanded).toBe(path.join(os.homedir(), "some/deep/dir"));
  });
});
