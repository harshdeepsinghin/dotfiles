import os from "os";
import path from "path";
import { VocabularyWord } from "../types/vocabulary";

/**
 * Expands a leading `~/` in a file path to the user's home directory,
 * consistent with `getWordsDir()` in `know-about-words.tsx`.
 */
export function expandPath(filePath: string): string {
  if (filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return path.resolve(filePath);
}

/**
 * Represents a tokenized section from a markdown vocabulary file.
 */
interface Section {
  heading: string; // The `## Heading` text (lowercase), or "__title__" for the h1 block
  content: string; // Raw text content below the heading
}

/**
 * Tokenizes markdown content into an h1 title block and named ## sections.
 * Returns null if the content cannot be tokenized (no h1 heading found).
 */
function tokenizeSections(
  content: string,
): { title: string; sections: Section[] } | null {
  const lines = content.split("\n");

  // Find the h1 title line
  let titleLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+\S/.test(lines[i])) {
      titleLineIndex = i;
      break;
    }
  }

  if (titleLineIndex === -1) {
    return null;
  }

  const titleLine = lines[titleLineIndex];
  const sections: Section[] = [];

  // Collect content lines after the h1 and before the first ## section
  let currentHeading = "__title__";
  let currentLines: string[] = [];

  for (let i = titleLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      // Save the current section
      sections.push({
        heading: currentHeading,
        content: currentLines.join("\n").trim(),
      });
      currentHeading = h2Match[1].trim().toLowerCase();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Push the last section
  sections.push({
    heading: currentHeading,
    content: currentLines.join("\n").trim(),
  });

  return { title: titleLine, sections };
}

/**
 * Parses the `## Synonyms` or `## Antonyms` sections which contain
 * comma-separated word lists on one or more lines.
 */
function parseCommaSeparatedList(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Lines may be `w1, w2, w3` or `- w1, w2` (unlikely but handle gracefully)
    const cleaned = trimmed.replace(/^-\s*/, "");
    for (const part of cleaned.split(",")) {
      const word = part.trim();
      if (word) items.push(word);
    }
  }
  return items;
}

/**
 * Parses bullet-list lines from a section's content.
 * Handles both `- text` and bare text lines.
 */
function parseBulletList(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Strip leading `- ` if present
    const item = trimmed.replace(/^-\s+/, "").trim();
    if (item) items.push(item);
  }
  return items;
}

/**
 * Parses example sentences from the `## Examples` section.
 * The format alternates: English sentence, Hindi translation, English, Hindi, ...
 * We extract only the English sentences (odd-indexed bullet items, 0-based).
 */
function parseExamples(content: string): string[] {
  const allLines = parseBulletList(content);
  // Every even-indexed item (0, 2, 4, ...) is an English sentence
  return allLines.filter((_, idx) => idx % 2 === 0);
}

/**
 * Parses part-of-speech + definition pairs from the title section content or
 * from the h1 content area.
 *
 * The prompt produces lines like:
 *   - **Noun:** definition text
 *   **Noun:** definition text   (without leading dash)
 *
 * The regex captures the POS label and the definition text.
 */
function parseDefinitions(
  content: string,
): { partOfSpeech: string; meaning: string }[] {
  const definitions: { partOfSpeech: string; meaning: string }[] = [];
  const posPattern =
    /^\s*(?:-\s+)?\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*\s*(.+)$/im;

  for (const line of content.split("\n")) {
    const match = line.match(posPattern);
    if (match) {
      definitions.push({
        partOfSpeech: match[1].trim(),
        meaning: match[2].trim(),
      });
    }
  }

  return definitions;
}

/**
 * Parses a vocabulary markdown file into a structured `VocabularyWord` object.
 *
 * Returns `null` if:
 * - The content cannot be tokenized (no `# Heading` found)
 * - The word name is missing
 * - No part-of-speech definitions are found
 *
 * Returns a partial object (with optional fields absent) for files that
 * tokenize successfully but lack optional sections.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */
export function parseVocabularyFile(content: string): VocabularyWord | null {
  // --- Tokenize ---
  const tokenized = tokenizeSections(content);
  if (!tokenized) {
    return null;
  }

  const { title: titleLine, sections } = tokenized;

  // --- Extract word name and pronunciation from h1 ---
  // Format: `# Word Name (Pronunciation)`
  const titleMatch = titleLine.match(/^#\s+([^(]+?)(?:\s*\(([^)]*)\))?\s*$/);
  if (!titleMatch) {
    return null;
  }

  const wordName = titleMatch[1].trim().toLowerCase();
  if (!wordName) {
    return null;
  }

  const pronunciation = titleMatch[2] ? titleMatch[2].trim() : undefined;

  // --- Build a lookup map for sections by heading ---
  // Collect the title-block content (lines between h1 and first ##)
  const sectionMap = new Map<string, string>();
  let titleBlockContent = "";

  for (const section of sections) {
    if (section.heading === "__title__") {
      titleBlockContent = section.content;
    } else {
      // Later sections with same heading name override earlier ones
      sectionMap.set(section.heading, section.content);
    }
  }

  // --- Definitions ---
  // Definitions appear as `**POS:** meaning` in the title block content
  const definitions = parseDefinitions(titleBlockContent);

  // Required: at least one definition with a part-of-speech
  if (definitions.length === 0) {
    return null;
  }

  // --- Optional sections ---

  // Hindi Equivalent: comma-separated on the first non-blank line after the heading
  let hindiEquivalent: string[] | undefined;
  const hindiContent = sectionMap.get("hindi equivalent");
  if (hindiContent) {
    const items = parseCommaSeparatedList(hindiContent);
    if (items.length > 0) hindiEquivalent = items;
  }

  // When to use: bullet list
  let whenToUse: string[] | undefined;
  const whenContent = sectionMap.get("when to use");
  if (whenContent) {
    const items = parseBulletList(whenContent);
    if (items.length > 0) whenToUse = items;
  }

  // Examples: alternating English/Hindi bullet items — keep English only
  let examples: string[] | undefined;
  const examplesContent = sectionMap.get("examples");
  if (examplesContent) {
    const items = parseExamples(examplesContent);
    if (items.length > 0) examples = items;
  }

  // Synonyms: comma-separated
  let synonyms: string[] | undefined;
  const synonymsContent = sectionMap.get("synonyms");
  if (synonymsContent) {
    const items = parseCommaSeparatedList(synonymsContent);
    if (items.length > 0) synonyms = items;
  }

  // Antonyms: comma-separated
  let antonyms: string[] | undefined;
  const antonymsContent = sectionMap.get("antonyms");
  if (antonymsContent) {
    const items = parseCommaSeparatedList(antonymsContent);
    if (items.length > 0) antonyms = items;
  }

  return {
    word: wordName,
    ...(pronunciation !== undefined && { pronunciation }),
    definitions,
    ...(hindiEquivalent !== undefined && { hindiEquivalent }),
    ...(whenToUse !== undefined && { whenToUse }),
    ...(examples !== undefined && { examples }),
    ...(synonyms !== undefined && { synonyms }),
    ...(antonyms !== undefined && { antonyms }),
    rawMarkdown: content,
  };
}
