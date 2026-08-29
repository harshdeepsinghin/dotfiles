export interface VocabularyWord {
  word: string;
  pronunciation?: string;
  definitions: {
    partOfSpeech: string;
    meaning: string;
  }[];
  hindiEquivalent?: string[];
  whenToUse?: string[];
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  /** The original raw markdown content of the vocabulary file. */
  rawMarkdown: string;
}
