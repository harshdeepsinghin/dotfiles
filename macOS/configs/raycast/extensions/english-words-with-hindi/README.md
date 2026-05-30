# English Words with Hindi - Raycast Extension

A premium, AI-powered vocabulary companion inside Raycast that looks up English words, lists their definitions across multiple parts of speech, extracts Hindi translations and pronunciations, provides usage instructions and examples, and saves them locally as clean markdown files.

## Features

- **AI-Powered Lookups**: Leverages Gemini 2.5/3.5 models to query structured dictionary entries dynamically.
- **Multi-Role Definitions**: Automatically identifies and displays definitions for all grammatical roles a word satisfies (e.g., Noun, Verb, Adjective, Adverb) with bold highlighting.
- **Hindi Translation & Pronunciation**: Translates word meanings and examples, and fetches phonetical Hindi pronunciations.
- **Local Markdown Files**: Stores your lookup history offline in a local directory (`~/words` by default) as portable markdown files.
- **Clipboard Integration**: Copy clean markdown representations of your words directly to the clipboard.
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
- **Gemini Model** (*Required*): Select your desired Google Gemini model (e.g. `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`). Defaults to `gemini-3.5-flash`.
- **Words Storage Directory** (*Optional*): Path to the folder where your vocabulary markdown files will be saved. Defaults to `~/words`.

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