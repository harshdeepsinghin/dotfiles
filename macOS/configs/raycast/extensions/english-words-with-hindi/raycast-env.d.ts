/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Gemini API Key - Enter your Gemini API key (e.g. from Google AI Studio) */
  "geminiApiKey": string,
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

