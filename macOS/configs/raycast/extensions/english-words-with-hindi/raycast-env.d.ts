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
  "geminiModel": "gemini-3.5-flash" | "gemini-2.5-flash",
  /** Words Storage Directory - Local directory path to save vocabulary markdown files */
  "wordsDirectory": string,
  /** Telegram Bot Token - Enter your Telegram Bot API token (from @BotFather) */
  "telegramBotToken"?: string,
  /** Telegram Channel / Chat ID - Enter your Telegram Channel username (e.g. @mychannel) or Chat ID */
  "telegramChatId"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `know-about-words` command */
  export type KnowAboutWords = ExtensionPreferences & {}
  /** Preferences accessible in the `scheduled-list` command */
  export type ScheduledList = ExtensionPreferences & {}
  /** Preferences accessible in the `schedule-checker` command */
  export type ScheduleChecker = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `know-about-words` command */
  export type KnowAboutWords = {}
  /** Arguments passed to the `scheduled-list` command */
  export type ScheduledList = {}
  /** Arguments passed to the `schedule-checker` command */
  export type ScheduleChecker = {}
}

