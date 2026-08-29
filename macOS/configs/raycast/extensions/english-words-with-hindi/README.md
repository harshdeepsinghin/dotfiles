# English Words with Hindi - Raycast Extension

A premium, AI-powered vocabulary companion inside Raycast that looks up English words, lists their definitions across multiple parts of speech, extracts Hindi translations and pronunciations, provides usage instructions and examples, and saves them locally as clean markdown files.

## Features

- **AI-Powered Lookups**: Leverages Gemini 2.5/3.5 models to query structured dictionary entries dynamically.
- **Saved Words Sorting**: Organize your saved vocabulary list instantly using the search bar dropdown. Sort options include:
  - *Recently Added* (default)
  - *Oldest Added*
  - *Alphabetical (A-Z)*
  - *Alphabetical (Z-A)*
- **Multi-Role Local Definitions**: Local dictionary definitions cleanly parse and structure all grammatical roles (e.g., Noun, Verb, Adjective) into separate bolded sections.
- **Performance Optimized**: Spawns dictionary query subprocesses efficiently using a 250ms typing debounce and loads saved items in parallel.
- **Hindi Translation & Pronunciation**: Translates word meanings and examples, and fetches phonetical Hindi pronunciations.
- **Local Markdown Files**: Stores your lookup history offline in a local directory (`~/words` by default) as portable markdown files.
- **Clipboard Integration**: Copy clean markdown representations of your words directly to the clipboard.
- **Telegram Integration**:
  - **Copy Telegram Text (`⌘ ⇧ C`)**: Copy any word formatted as Telegram-friendly text (`**bold**`, `__italic__`, 2-space line endings) ready to paste into Telegram chats.
  - **Post to Telegram Channel (`⌘ ⇧ ↵`)**: Directly publish formatted vocabulary entries to a Telegram channel via Telegram Bot API.
- **Finder & File Navigation**: Instantly open the local markdown file in your default editor or reveal it in Finder.
- **Clean UI Accessories**: Lists words with tags displaying their roles (e.g., Noun, Verb) and subtitle summaries showing the main Hindi translation.

## Installation / Sideloading

To use this extension locally in Raycast:

1. Clone or copy this extension directory inside your local workspace.
2. Open terminal and navigate to this extension directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server to sideload it into Raycast:
   ```bash
   npm run dev
   ```

## Configuration (Preferences)

Once installed, configure the extension in Raycast with the following preferences:

- **Gemini API Key** (*Required*): Get your API key from [Google AI Studio](https://aistudio.google.com/).
- **Gemini Model** (*Required*): Select your desired Google Gemini model (e.g. `gemini-3.5-flash`, `gemini-2.5-flash`). Defaults to `gemini-3.5-flash`.
- **Words Storage Directory** (*Optional*): Path to the folder where your vocabulary markdown files will be saved. Defaults to `~/words`.
- **Telegram Bot Token** (*Optional*): Bot API Token from `@BotFather` to post words directly to your Telegram channel.
- **Telegram Channel / Chat ID** (*Optional*): Channel username (e.g. `@mychannel`) or numerical Chat ID.

## Development Commands

- **Build**: Compiles typescript code and bundles the extension:
  ```bash
  npm run build
  ```
- **Development**: Runs the extension in watch/hot-reload mode:
  ```bash
  npm run dev
  ```
- **Linting & Formatting**: Runs ESLint, package JSON validation, and Prettier checks:
  ```bash
  npm run lint
  ```
- **Auto-Fix Style Issues**: Fixes ESLint and Prettier styling issues automatically:
  ```bash
  npm run fix-lint
  ```

---

*Powered by Google Gemini AI.*