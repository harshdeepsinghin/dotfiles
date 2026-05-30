/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Gemini API Key - Enter your Gemini API key (e.g. from Google AI Studio) */
  "geminiApiKey": string,
  /** Gemini Model - Select the Gemini model to use for definitions */
  "geminiModel": "gemini-3.5-flash" | "gemini-2.5-flash" | "gemini-2.0-flash" | "gemini-2.0-pro" | "gemini-1.5-flash" | "gemini-1.5-pro",
  /** Words Storage Directory - Local directory path to save vocabulary markdown files */
  "wordsDirectory": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `know-about-words` command */
  export type KnowAboutWords = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `know-about-words` command */
  export type KnowAboutWords = {}
}

