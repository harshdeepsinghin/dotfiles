"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/know-about-words.tsx
var know_about_words_exports = {};
__export(know_about_words_exports, {
  default: () => Command
});
module.exports = __toCommonJS(know_about_words_exports);
var import_api = require("@raycast/api");
var import_react = require("react");
var import_promises = __toESM(require("fs/promises"));
var import_os = __toESM(require("os"));

// src/prompt.ts
var PROMPT = `
You are a vocabulary assistant.

Word: {word}

Output STRICT Markdown.

Rules:
- Use only Markdown
- No HTML
- No emojis
- No tables
- Use "-" bullets only
- Keep spacing clean
- Keep concise
- No code blocks
- Do not wrap response in markdown fences
- Maximum clarity, minimum words

Format:

# Word (Hindi Pronunciation)
- **Noun:** short definition (\u226420 words) (include ONLY if the word can be used as a noun)
- **Verb:** short definition (\u226420 words) (include ONLY if the word can be used as a verb)
- **Adjective:** short definition (\u226420 words) (include ONLY if the word can be used as an adjective)
- **Adverb:** short definition (\u226420 words) (include ONLY if the word can be used as an adverb)
(just like that all other types of part of speeches, above 4 are just examples) (and when multiple part of speeches exists, then use a list item "-" for each part of speech, so they are cleanly separated as list items. means no two part of speech on same line)

## Hindi Equivalent
meaning1, meaning2, meaning3

## When to use
- point
- point
- point

## Examples
- sentence
- Hindi translation
- sentence
- Hindi translation

## Synonyms
w1, w2, w3, w4

## Antonyms
w1, w2, w3, w4

Conditional:
Include only when meaningful.

## Word Breakdown
- part \u2192 meaning

## Formation Flow
- step \u2192 meaning

## Etymology
brief origin

Constraints:
- No extra text
- No explanations
- No deviations
- Output only the formatted entry
`;

// src/know-about-words.tsx
var import_path = __toESM(require("path"));
var import_child_process = require("child_process");
var import_util = require("util");

// src/lookup-swift.ts
var SWIFT_LOOKUP_CODE = `
import Foundation
import CoreServices.DictionaryServices

func getDefinition(for word: String) -> String? {
    let nsString = word as NSString
    let range = CFRange(location: 0, length: nsString.length)
    
    guard let definition = DCSCopyTextDefinition(nil, nsString, range) else {
        return nil
    }
    
    return definition.takeUnretainedValue() as String
}

let args = CommandLine.arguments
if args.count < 2 {
    exit(1)
}

let word = args[1]
if let definition = getDefinition(for: word) {
    print(definition)
} else {
    exit(2)
}
`;

// src/telegram.ts
function formatForTelegram(markdownContent) {
  if (!markdownContent || !markdownContent.trim()) {
    return "";
  }
  const lines = markdownContent.trim().split("\n");
  let titleIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i])) {
      titleIndex = i;
      break;
    }
  }
  if (titleIndex === -1) {
    return markdownContent;
  }
  const rawTitleLine = lines[titleIndex];
  const titleMatch = rawTitleLine.match(/^#\s+([^(]+?)(?:\s*\(([^)]*)\))?\s*$/);
  let titleText = "";
  if (titleMatch) {
    const rawWord = titleMatch[1].trim();
    const capitalizedWord = rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
    const pron = titleMatch[2] ? titleMatch[2].trim() : "";
    titleText = pron ? `**${capitalizedWord} (${pron})**` : `**${capitalizedWord}**`;
  } else {
    const cleanedTitle = rawTitleLine.replace(/^#\s+/, "").trim();
    const capitalizedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
    titleText = `**${capitalizedTitle}**`;
  }
  let currentHeading = "__title__";
  let currentLines = [];
  const sectionMap = /* @__PURE__ */ new Map();
  const sectionOrder = [];
  for (let i = titleIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentHeading === "__title__") {
        sectionMap.set("__title__", {
          originalHeading: "__title__",
          contentLines: currentLines
        });
      } else {
        sectionMap.set(currentHeading, {
          originalHeading: currentHeading,
          contentLines: currentLines
        });
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
      sectionOrder.push(currentHeading);
    } else {
      currentLines.push(line);
    }
  }
  if (currentHeading === "__title__") {
    sectionMap.set("__title__", {
      originalHeading: "__title__",
      contentLines: currentLines
    });
  } else {
    sectionMap.set(currentHeading, {
      originalHeading: currentHeading,
      contentLines: currentLines
    });
  }
  const titleBlock = sectionMap.get("__title__");
  const posDefinitionsMap = /* @__PURE__ */ new Map();
  if (titleBlock) {
    const posPattern = /^\s*(?:-\s+)?\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*\s*(.+)$/i;
    for (const line of titleBlock.contentLines) {
      const match = line.match(posPattern);
      if (match) {
        const pos = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const meaning = match[2].trim();
        if (!posDefinitionsMap.has(pos)) {
          posDefinitionsMap.set(pos, []);
        }
        posDefinitionsMap.get(pos).push(meaning);
      }
    }
  }
  const resultBlocks = [];
  resultBlocks.push(`${titleText}  `);
  if (posDefinitionsMap.size > 0) {
    const defBlockLines = [];
    for (const [pos, defs] of posDefinitionsMap.entries()) {
      defs.forEach((def) => {
        const cleanDef = def.replace(/^\d+\)\s*/, "").replace(/^-\s*/, "");
        defBlockLines.push(`**${pos}:** ${cleanDef}  `);
      });
    }
    resultBlocks.push(defBlockLines.join("\n"));
  }
  for (const headingName of sectionOrder) {
    const sectionData = sectionMap.get(headingName);
    if (!sectionData) continue;
    const headingLower = headingName.toLowerCase();
    const rawContentLines = sectionData.contentLines.map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawContentLines.length === 0) continue;
    if (headingLower === "hindi equivalent") {
      const line = rawContentLines.join(" ");
      resultBlocks.push(`**Hindi Equivalent:**  
${line}`);
    } else if (headingLower === "when to use") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**When to use:**  
${items.join("\n")}`);
    } else if (headingLower === "examples") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**Examples:**  
${items.join("\n")}`);
    } else if (headingLower === "synonyms") {
      const text = rawContentLines.join(" ").replace(/^-\s*/, "");
      resultBlocks.push(`**Synonyms:** ${text}  `);
    } else if (headingLower === "antonyms") {
      const text = rawContentLines.join(" ").replace(/^-\s*/, "");
      resultBlocks.push(`**Antonyms:** ${text}  `);
    } else if (headingLower === "word breakdown") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**Word Breakdown:**
${items.join("\n")}`);
    } else if (headingLower === "formation flow") {
      const items = rawContentLines.map((line) => {
        const cleaned = line.replace(/^-\s*/, "");
        return `- ${cleaned}  `;
      });
      resultBlocks.push(`**Formation Flow:**
${items.join("\n")}`);
    } else if (headingLower === "etymology") {
      let text = rawContentLines.join(" ");
      text = text.replace(/'([^']+)'/g, "__$1__");
      text = text.replace(/(^|\s)\*([^*]+)\*(\s|$)/g, "$1__$2__$3");
      resultBlocks.push(`**Etymology:**  
${text}`);
    } else {
      const headingCap = headingName.charAt(0).toUpperCase() + headingName.slice(1);
      resultBlocks.push(`**${headingCap}:**  
${rawContentLines.join("\n")}`);
    }
  }
  return resultBlocks.join("\n\n");
}
function telegramMarkdownToHtml(telegramText) {
  if (!telegramText) return "";
  let html = telegramText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  html = html.replace(/__([^_]+)__/g, "<i>$1</i>");
  html = html.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  html = html.replace(/[ \t]+\n/g, "\n");
  return html;
}
async function postToTelegramChannel(botToken, chatId, telegramFormattedText) {
  const token = botToken.trim();
  const chat = chatId.trim();
  if (!token) {
    return { success: false, message: "Telegram Bot Token is required." };
  }
  if (!chat) {
    return {
      success: false,
      message: "Telegram Channel / Chat ID is required."
    };
  }
  const htmlContent = telegramMarkdownToHtml(telegramFormattedText);
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chat,
        text: htmlContent,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      return { success: true };
    }
    const errDesc = data.description || response.statusText || `HTTP ${response.status}`;
    if (response.status === 401 || data.error_code === 401) {
      return {
        success: false,
        message: "Invalid Telegram Bot Token. Please check extension preferences."
      };
    }
    if (response.status === 400 || data.error_code === 400) {
      return {
        success: false,
        message: `Telegram Error: ${errDesc}. Ensure the bot is added to the channel.`
      };
    }
    if (response.status === 403 || data.error_code === 403) {
      return {
        success: false,
        message: `Telegram Error: ${errDesc}. Ensure bot has posting admin permissions.`
      };
    }
    return {
      success: false,
      message: `Telegram Error (${data.error_code || response.status}): ${errDesc}`
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err)
    };
  }
}

// src/know-about-words.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var execFilePromise = (0, import_util.promisify)(import_child_process.execFile);
var execPromise = (0, import_util.promisify)(import_child_process.exec);
function getWordsDir(wordsDirectoryPref) {
  const resolved = wordsDirectoryPref || "~/words";
  if (resolved.startsWith("~/")) {
    return import_path.default.join(import_os.default.homedir(), resolved.slice(2));
  }
  return import_path.default.resolve(resolved);
}
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function getSubtitle(markdown) {
  const lines = markdown.split("\n");
  const hindiEquivalentIndex = lines.findIndex(
    (l) => l.includes("## Hindi Equivalent")
  );
  if (hindiEquivalentIndex !== -1 && lines[hindiEquivalentIndex + 1]) {
    const meaningLine = lines[hindiEquivalentIndex + 1].trim();
    if (meaningLine) return meaningLine;
  }
  const titleMatch = markdown.match(/^#\s+[^(]+\(([^)]+)\)/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1];
  }
  return "";
}
function getPartOfSpeech(markdown) {
  const parts = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const boldMatch = line.match(
      /^(?:-\s+)?\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*/i
    );
    if (boldMatch) {
      parts.push(capitalize(boldMatch[1].toLowerCase()));
    }
  }
  if (parts.length > 0) {
    return parts.join(", ");
  }
  const match = markdown.match(
    /^##\s+(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection)/im
  );
  return match ? capitalize(match[1].toLowerCase()) : "";
}
function getPromptForWord(word) {
  return PROMPT.replace("{word}", word);
}
var supportPath = import_api.environment.supportPath;
var swiftFilePath = import_path.default.join(supportPath, "lookup.swift");
var binaryPath = import_path.default.join(supportPath, "lookup");
var isCompilingPromise = null;
var compileSuccess = false;
async function ensureLookupCompiled() {
  if (compileSuccess) return true;
  if (isCompilingPromise) return isCompilingPromise;
  isCompilingPromise = (async () => {
    try {
      await import_promises.default.mkdir(supportPath, { recursive: true });
      await import_promises.default.writeFile(swiftFilePath, SWIFT_LOOKUP_CODE);
      try {
        await import_promises.default.access(binaryPath);
        compileSuccess = true;
        return true;
      } catch {
        try {
          await execPromise(`swiftc -O "${swiftFilePath}" -o "${binaryPath}"`);
          compileSuccess = true;
          return true;
        } catch (err) {
          console.error(
            "Swift compilation failed, will use fallback runner:",
            err
          );
          return false;
        }
      }
    } catch (err) {
      console.error("Error setting up lookup files:", err);
      return false;
    }
  })();
  return isCompilingPromise;
}
async function lookupLocalDictionary(word) {
  const normalizedWord = word.trim();
  if (!normalizedWord) return null;
  const isCompiled = await ensureLookupCompiled();
  if (isCompiled) {
    try {
      const { stdout } = await execFilePromise(binaryPath, [normalizedWord]);
      if (stdout.trim()) return stdout.trim();
    } catch (err) {
      const error = err;
      if (error.code === 2) {
        return null;
      }
      console.error("Binary execution failed, trying script interpreter:", err);
    }
  }
  try {
    const { stdout } = await execFilePromise("swift", [
      swiftFilePath,
      normalizedWord
    ]);
    if (stdout.trim()) return stdout.trim();
  } catch (err) {
    const error = err;
    if (error.code === 2) {
      return null;
    }
    console.error("Swift script execution failed, trying API fallback:", err);
  }
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const entry = data[0];
        const phonetic = entry.phonetic || "";
        const partsOfSpeechStrings = entry.meanings.map((m, mIdx) => {
          const defs = m.definitions.map((d, dIdx) => `${dIdx + 1} ${d.definition}`).join(" \u2022 ");
          if (mIdx === 0) {
            return `${entry.word} ${m.partOfSpeech} | ${phonetic} | ${defs}`;
          } else {
            return ` ${m.partOfSpeech} | ${phonetic} | ${defs}`;
          }
        });
        return partsOfSpeechStrings.join("");
      }
    }
  } catch (err) {
    console.error("Online API fallback failed:", err);
  }
  return null;
}
function formatLocalDefinition(word, text) {
  if (!text) return "";
  const trimmed = text.trim().replace(/[ \t]+/g, " ");
  const posList = [
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "plural noun",
    "intransitive verb",
    "transitive verb",
    "adjective & adverb",
    "determiner",
    "exclamation",
    "abbreviation"
  ];
  const posRegex = new RegExp(
    `\\b(${posList.join("|")})\\b(\\s*\\[[^\\]]+\\])?\\s*(?:\\|\\s*([^|]+)\\s*\\||\\s+([1-9]\\b|\\[no object\\]|\\[with object\\]))`,
    "gi"
  );
  const firstPipe = trimmed.indexOf("|");
  let secondPipe = -1;
  if (firstPipe !== -1) {
    secondPipe = trimmed.indexOf("|", firstPipe + 1);
  }
  if (firstPipe === -1 || secondPipe === -1) {
    let formatted = trimmed.replace(/•/g, "\n\u2022 ");
    formatted = formatted.replace(/\s+([1-9])\s+(?=[a-zA-Z])/g, "\n\n**$1.** ");
    formatted = formatted.replace(
      /\b(PHRASES|ORIGIN|DERIVATIVES|USAGE|PHRASAL VERBS)\b/g,
      "\n\n### $1\n"
    );
    return `# ${capitalize(word)}

${formatted}`;
  }
  let head = trimmed.substring(0, firstPipe).trim();
  const pron = trimmed.substring(firstPipe + 1, secondPipe).trim();
  let rest = trimmed.substring(secondPipe + 1).trim();
  let firstPos = "";
  let firstDetails = "";
  for (const pos of posList) {
    const pattern = new RegExp(`\\b${pos}(\\s+\\[[^\\]]+\\])?$`, "i");
    const m = head.match(pattern);
    if (m) {
      firstPos = pos;
      firstDetails = m[1] || "";
      head = head.substring(0, m.index).trim();
      break;
    }
  }
  if (!firstPos) {
    for (const pos of posList) {
      const pattern = new RegExp(`^${pos}\\b(\\s+\\[[^\\]]+\\])?`, "i");
      const m = rest.match(pattern);
      if (m) {
        firstPos = pos;
        firstDetails = m[1] || "";
        rest = rest.substring(m[0].length).trim();
        break;
      }
    }
  }
  const matches = [];
  let match;
  posRegex.lastIndex = 0;
  while ((match = posRegex.exec(rest)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      partOfSpeech: match[1],
      details: match[2] || "",
      pronunciation: match[3] || "",
      defStartToken: match[4] || ""
    });
  }
  const segments = [];
  const firstSegEnd = matches.length > 0 ? matches[0].index : rest.length;
  segments.push({
    pos: firstPos || "definition",
    details: firstDetails,
    pron,
    text: rest.substring(0, firstSegEnd).trim()
  });
  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    const endPos = idx + 1 < matches.length ? matches[idx + 1].index : rest.length;
    let matchLen = m.length;
    if (m.defStartToken) {
      const matchStr = rest.substring(m.index, m.index + m.length);
      const tokenIndex = matchStr.indexOf(m.defStartToken);
      if (tokenIndex !== -1) {
        matchLen = tokenIndex;
      }
    }
    const defText = rest.substring(m.index + matchLen, endPos).trim();
    segments.push({
      pos: m.partOfSpeech,
      details: m.details,
      pron: m.pronunciation || pron,
      text: defText
    });
  }
  const formattedTitle = head ? capitalize(head) : capitalize(word);
  let result = `# ${formattedTitle}
`;
  for (const seg of segments) {
    const posLabel = capitalize(seg.pos.toLowerCase());
    const detailsLabel = seg.details ? ` *${seg.details.trim()}*` : "";
    const pronLabel = seg.pron.trim() ? ` *| ${seg.pron.trim()} |*` : "";
    let text2 = seg.text;
    text2 = text2.replace(/•/g, "\n\u2022 ");
    text2 = text2.replace(/\s+([1-9])\s+(?=[a-zA-Z])/g, "\n\n**$1.** ");
    text2 = text2.replace(
      /\b(PHRASES|ORIGIN|DERIVATIVES|USAGE|PHRASAL VERBS)\b/g,
      "\n\n### $1\n"
    );
    result += `
**${posLabel}**${detailsLabel}${pronLabel}
${text2}
`;
  }
  return result;
}
var RateLimitError = class extends Error {
  status = 429;
};
function Command() {
  const preferences = (0, import_api.getPreferenceValues)();
  const wordsDir = (0, import_react.useMemo)(
    () => getWordsDir(preferences.wordsDirectory),
    [preferences.wordsDirectory]
  );
  const [words, setWords] = (0, import_react.useState)({});
  const [sortBy, setSortBy] = (0, import_react.useState)("date-newest");
  const [loadingHistory, setLoadingHistory] = (0, import_react.useState)(true);
  const [isSearching, setIsSearching] = (0, import_react.useState)(false);
  const [searchText, setSearchText] = (0, import_react.useState)("");
  const [selectedId, setSelectedId] = (0, import_react.useState)(void 0);
  const programmaticSelectionRef = (0, import_react.useRef)(null);
  const [lookupError, setLookupError] = (0, import_react.useState)(null);
  const [localDefinition, setLocalDefinition] = (0, import_react.useState)(null);
  const [loadingLocalDefinition, setLoadingLocalDefinition] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (lookupError && lookupError.word !== searchText.trim()) {
      setLookupError(null);
    }
  }, [searchText, lookupError]);
  (0, import_react.useEffect)(() => {
    if (programmaticSelectionRef.current !== null) {
      const timer = setTimeout(() => {
        programmaticSelectionRef.current = null;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchText, selectedId]);
  (0, import_react.useEffect)(() => {
    async function initAndLoad() {
      try {
        await import_promises.default.mkdir(wordsDir, { recursive: true });
        const files = await import_promises.default.readdir(wordsDir);
        const mdFiles = files.filter((file) => file.endsWith(".md"));
        const filePromises = mdFiles.map(async (file) => {
          const wordName = file.slice(0, -3).toLowerCase();
          const filePath = import_path.default.join(wordsDir, file);
          const stat = await import_promises.default.stat(filePath);
          const content = await import_promises.default.readFile(filePath, "utf-8");
          return {
            wordName,
            wordItem: {
              name: wordName,
              content,
              createdAt: stat.birthtimeMs || stat.mtimeMs || Date.now(),
              updatedAt: stat.mtimeMs || Date.now()
            }
          };
        });
        const results = await Promise.all(filePromises);
        const loadedWords = {};
        for (const res of results) {
          loadedWords[res.wordName] = res.wordItem;
        }
        setWords(loadedWords);
      } catch (err) {
        console.error("Failed to load vocabulary files", err);
        (0, import_api.showToast)({
          style: import_api.Toast.Style.Failure,
          title: "Failed to load saved vocabulary",
          message: String(err)
        });
      } finally {
        setLoadingHistory(false);
      }
    }
    initAndLoad();
  }, [wordsDir]);
  const cleanSearchText = searchText.trim();
  (0, import_react.useEffect)(() => {
    let active = true;
    const lowerQuery = cleanSearchText.toLowerCase();
    if (!lowerQuery || words[lowerQuery]) {
      setLocalDefinition(null);
      setLoadingLocalDefinition(false);
      return;
    }
    setLoadingLocalDefinition(true);
    setLocalDefinition(null);
    const handler = setTimeout(async () => {
      try {
        const def = await lookupLocalDictionary(lowerQuery);
        if (active) {
          setLocalDefinition(def);
        }
      } catch (err) {
        console.error("Local lookup failed", err);
      } finally {
        if (active) {
          setLoadingLocalDefinition(false);
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [cleanSearchText, words]);
  const sortedAndFilteredWords = (0, import_react.useMemo)(() => {
    const query = cleanSearchText.toLowerCase();
    const filtered = Object.values(words).filter((wordItem) => {
      if (!query) return true;
      return wordItem.name.includes(query) || getSubtitle(wordItem.content).toLowerCase().includes(query);
    });
    return filtered.sort((a, b) => {
      if (sortBy === "alphabetical-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "alphabetical-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "date-oldest") {
        return a.createdAt - b.createdAt;
      } else {
        return b.createdAt - a.createdAt;
      }
    });
  }, [words, cleanSearchText, sortBy]);
  const showLookupItem = (0, import_react.useMemo)(() => {
    if (!cleanSearchText) return false;
    const lowerQuery = cleanSearchText.toLowerCase();
    return !words[lowerQuery];
  }, [words, cleanSearchText]);
  async function handleLookup(wordToLookup, forceRecreate = false) {
    const normalizedWord = wordToLookup.trim().toLowerCase();
    if (!normalizedWord) return;
    if (!forceRecreate && words[normalizedWord]) {
      setSelectedId(normalizedWord);
      return;
    }
    const toast = await (0, import_api.showToast)({
      style: import_api.Toast.Style.Animated,
      title: forceRecreate ? "Re-generating word entry..." : `Looking up "${wordToLookup}"...`
    });
    setIsSearching(true);
    setLookupError(null);
    try {
      const apiKey = preferences.geminiApiKey;
      if (!apiKey) {
        throw new Error(
          "Gemini API key is not configured in extension preferences."
        );
      }
      const model = preferences.geminiModel || "gemini-3.5-flash";
      const promptText = getPromptForWord(wordToLookup);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ]
          })
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new RateLimitError("Rate limit reached");
        }
        throw new Error(
          `Gemini API Request failed: ${response.status} ${response.statusText}
${errorText}`
        );
      }
      const data = await response.json();
      const resultMarkdown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultMarkdown || resultMarkdown.trim() === "No response received.") {
        throw new Error(
          "No response or invalid format received from Gemini API."
        );
      }
      const headingMatch = resultMarkdown.trim().match(/^#\s+([^(\n]+)/);
      const aiWordName = headingMatch ? headingMatch[1].trim().toLowerCase() : normalizedWord;
      const filePath = import_path.default.join(wordsDir, `${aiWordName}.md`);
      await import_promises.default.writeFile(filePath, resultMarkdown.trim());
      const stat = await import_promises.default.stat(filePath);
      setWords((prev) => ({
        ...prev,
        [aiWordName]: {
          name: aiWordName,
          content: resultMarkdown.trim(),
          createdAt: prev[aiWordName]?.createdAt || stat.birthtimeMs || stat.mtimeMs || Date.now(),
          updatedAt: stat.mtimeMs || Date.now()
        }
      }));
      programmaticSelectionRef.current = aiWordName;
      setSelectedId(aiWordName);
      setSearchText("");
      toast.style = import_api.Toast.Style.Success;
      toast.title = "Word Saved";
      toast.message = `${capitalize(aiWordName)} added to database`;
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isNetworkError = errMsg.includes("ENOTFOUND") || errMsg.includes("fetch failed") || errMsg.includes("network") || err instanceof Error && err.name === "TypeError";
      if (isNetworkError) {
        setLookupError({
          word: wordToLookup,
          type: "network",
          message: "Internet is not connected. Please check your network connection and try again."
        });
        toast.style = import_api.Toast.Style.Failure;
        toast.title = "No Internet Connection";
        toast.message = "Internet is not connected. Please check your network and try again.";
      } else if (err instanceof RateLimitError || errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit")) {
        setLookupError({
          word: wordToLookup,
          type: "rate-limit",
          message: "Rate limit reached. This rate limit will take some time, please try again later."
        });
        toast.style = import_api.Toast.Style.Failure;
        toast.title = "Rate Limit Reached";
        toast.message = "Rate limit reached. Try again later.";
      } else {
        setLookupError({
          word: wordToLookup,
          type: "other",
          message: errMsg
        });
        toast.style = import_api.Toast.Style.Failure;
        toast.title = "Lookup Failed";
        toast.message = errMsg;
      }
    } finally {
      setIsSearching(false);
    }
  }
  async function handleOpenFile(wordName) {
    const filePath = import_path.default.join(wordsDir, `${wordName.toLowerCase()}.md`);
    try {
      await (0, import_api.open)(filePath);
    } catch (err) {
      (0, import_api.showToast)({
        style: import_api.Toast.Style.Failure,
        title: "Could not open file",
        message: String(err)
      });
    }
  }
  async function handleRevealInFinder(wordName) {
    const filePath = import_path.default.join(wordsDir, `${wordName.toLowerCase()}.md`);
    try {
      await (0, import_api.showInFinder)(filePath);
    } catch (err) {
      (0, import_api.showToast)({
        style: import_api.Toast.Style.Failure,
        title: "Could not reveal file",
        message: String(err)
      });
    }
  }
  async function handleDelete(wordName) {
    const filePath = import_path.default.join(wordsDir, `${wordName.toLowerCase()}.md`);
    const toast = await (0, import_api.showToast)({
      style: import_api.Toast.Style.Animated,
      title: `Deleting "${capitalize(wordName)}"...`
    });
    try {
      await import_promises.default.unlink(filePath);
      setWords((prev) => {
        const next = { ...prev };
        delete next[wordName];
        return next;
      });
      toast.style = import_api.Toast.Style.Success;
      toast.title = "Word Deleted";
      toast.message = `Removed ${capitalize(wordName)} from database`;
    } catch (err) {
      toast.style = import_api.Toast.Style.Failure;
      toast.title = "Delete Failed";
      toast.message = String(err);
    }
  }
  async function handleCopyTelegramText(wordName, content) {
    const telegramText = formatForTelegram(content);
    await import_api.Clipboard.copy(telegramText);
    await (0, import_api.showToast)({
      style: import_api.Toast.Style.Success,
      title: "Copied Telegram Text",
      message: `${capitalize(wordName)} copied in Telegram-friendly format`
    });
  }
  async function handlePostToTelegramChannel(wordName, content) {
    const botToken = preferences.telegramBotToken;
    const chatId = preferences.telegramChatId;
    if (!botToken || !chatId) {
      await (0, import_api.showToast)({
        style: import_api.Toast.Style.Failure,
        title: "Telegram Credentials Missing",
        message: "Please configure Telegram Bot Token and Chat ID in Extension Preferences."
      });
      return;
    }
    const toast = await (0, import_api.showToast)({
      style: import_api.Toast.Style.Animated,
      title: `Posting "${capitalize(wordName)}" to Telegram...`
    });
    const telegramText = formatForTelegram(content);
    const res = await postToTelegramChannel(botToken, chatId, telegramText);
    if (res.success) {
      toast.style = import_api.Toast.Style.Success;
      toast.title = "Posted to Telegram Channel";
      toast.message = `${capitalize(wordName)} sent to ${chatId}`;
    } else {
      toast.style = import_api.Toast.Style.Failure;
      toast.title = "Failed to Post to Telegram";
      toast.message = res.message || "Unknown error";
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_api.List,
    {
      isShowingDetail: Object.keys(words).length > 0 || showLookupItem,
      searchBarPlaceholder: "Search saved words or look up new ones...",
      onSearchTextChange: setSearchText,
      searchText,
      isLoading: loadingHistory || isSearching,
      selectedItemId: selectedId,
      onSelectionChange: (id) => {
        if (programmaticSelectionRef.current !== null) {
          if (id === programmaticSelectionRef.current) {
            programmaticSelectionRef.current = null;
          }
          return;
        }
        setSelectedId(id || void 0);
      },
      searchBarAccessory: Object.keys(words).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        import_api.List.Dropdown,
        {
          tooltip: "Sort Words",
          onChange: setSortBy,
          value: sortBy,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Dropdown.Item, { title: "Recently Added", value: "date-newest" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Dropdown.Item, { title: "Oldest Added", value: "date-oldest" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_api.List.Dropdown.Item,
              {
                title: "Alphabetical (A-Z)",
                value: "alphabetical-asc"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_api.List.Dropdown.Item,
              {
                title: "Alphabetical (Z-A)",
                value: "alphabetical-desc"
              }
            )
          ]
        }
      ) : void 0,
      children: [
        showLookupItem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Section, { title: "AI Lookup", children: lookupError && lookupError.word.toLowerCase() === cleanSearchText.toLowerCase() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.List.Item,
          {
            id: "lookup-item-error",
            title: `Lookup Failed for "${cleanSearchText}"`,
            subtitle: lookupError.type === "rate-limit" ? "Rate Limit Reached" : lookupError.type === "network" ? "No Internet" : "Error",
            icon: { source: import_api.Icon.ExclamationMark, color: import_api.Color.Red },
            actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Retry Lookup",
                  icon: import_api.Icon.Repeat,
                  onAction: () => handleLookup(cleanSearchText)
                }
              ),
              lookupError.type === "rate-limit" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_api.Action.OpenInBrowser,
                  {
                    title: "Search on Google",
                    icon: import_api.Icon.Globe,
                    url: `https://www.google.com/search?q=${encodeURIComponent(cleanSearchText + " meaning")}`
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_api.Action.OpenInBrowser,
                  {
                    title: "Open ChatGPT",
                    icon: import_api.Icon.Message,
                    url: `https://chatgpt.com/?q=${encodeURIComponent(getPromptForWord(cleanSearchText))}`
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  import_api.Action,
                  {
                    title: "Copy Prompt",
                    icon: import_api.Icon.CopyClipboard,
                    onAction: async () => {
                      await import_api.Clipboard.copy(
                        getPromptForWord(cleanSearchText)
                      );
                      await (0, import_api.showToast)({
                        style: import_api.Toast.Style.Success,
                        title: "Prompt Copied",
                        message: "Designated ChatGPT prompt copied to clipboard"
                      });
                    }
                  }
                )
              ] })
            ] }),
            detail: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_api.List.Item.Detail,
              {
                markdown: `# Lookup Failed for "${cleanSearchText}"

${lookupError.type === "rate-limit" ? `\u26A0\uFE0F **Rate limit reached.** This rate limit will take some time, please try again later.

### Alternatives:
1. **Google Search**: Search for this word directly on Google.
2. **Open ChatGPT**: Open ChatGPT with the designated prompt already embedded.
3. **Copy Prompt**: Copy the prompt to clipboard to manually paste it in any AI.` : lookupError.type === "network" ? `\u{1F4E1} **Internet is not connected.** Please check your network connection and try again.` : `\u274C **Error**: ${lookupError.message}`}`
              }
            )
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.List.Item,
          {
            id: "lookup-item",
            title: `Search Gemini for "${cleanSearchText}"`,
            icon: import_api.Icon.Globe,
            actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.ActionPanel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_api.Action,
              {
                title: "Lookup Word",
                icon: import_api.Icon.MagnifyingGlass,
                onAction: () => handleLookup(cleanSearchText)
              }
            ) }),
            detail: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_api.List.Item.Detail,
              {
                markdown: loadingLocalDefinition ? `# ${capitalize(cleanSearchText)}

*Searching local dictionary...*` : localDefinition ? `${formatLocalDefinition(cleanSearchText, localDefinition)}

---

\u{1F4A1} *Press **Enter** to look up on Gemini AI and save this word with Hindi meaning, examples, etymology, etc.*` : `# ${capitalize(cleanSearchText)}

*Definition not found in local dictionary.*

---

\u{1F4A1} *Press **Enter** to look up on Gemini AI and save this word with Hindi meaning, examples, etymology, etc.*`
              }
            )
          }
        ) }),
        sortedAndFilteredWords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Section, { title: "Saved Vocabulary", children: sortedAndFilteredWords.map((wordItem) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.List.Item,
          {
            id: wordItem.name,
            title: capitalize(wordItem.name),
            subtitle: getSubtitle(wordItem.content),
            accessories: [
              {
                tag: {
                  value: getPartOfSpeech(wordItem.content),
                  color: import_api.Color.Blue
                }
              }
            ],
            detail: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Item.Detail, { markdown: wordItem.content }),
            actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Copy Telegram Text",
                  icon: import_api.Icon.CopyClipboard,
                  shortcut: import_api.Keyboard.Shortcut.Common.Copy,
                  onAction: () => handleCopyTelegramText(wordItem.name, wordItem.content)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Post to Telegram Channel",
                  icon: import_api.Icon.Paperplane,
                  shortcut: { modifiers: ["cmd", "shift"], key: "return" },
                  onAction: () => handlePostToTelegramChannel(
                    wordItem.name,
                    wordItem.content
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Copy Markdown",
                  icon: import_api.Icon.CopyClipboard,
                  onAction: async () => {
                    await import_api.Clipboard.copy(wordItem.content);
                    await (0, import_api.showToast)({
                      style: import_api.Toast.Style.Success,
                      title: "Copied to Clipboard",
                      message: `${capitalize(wordItem.name)} markdown copied`
                    });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Open File",
                  icon: import_api.Icon.Document,
                  onAction: () => handleOpenFile(wordItem.name)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Reveal in Finder",
                  icon: import_api.Icon.Finder,
                  onAction: () => handleRevealInFinder(wordItem.name)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Refresh Word",
                  icon: import_api.Icon.Repeat,
                  shortcut: import_api.Keyboard.Shortcut.Common.Refresh,
                  onAction: () => handleLookup(wordItem.name, true)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Delete Word",
                  icon: import_api.Icon.Trash,
                  style: import_api.Action.Style.Destructive,
                  shortcut: { modifiers: ["ctrl"], key: "x" },
                  onAction: () => handleDelete(wordItem.name)
                }
              )
            ] })
          },
          wordItem.name
        )) }) : !showLookupItem && !loadingHistory && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.List.EmptyView,
          {
            title: "Your vocabulary is empty",
            description: "Type a word in the search bar and press Enter to query Gemini AI.",
            icon: import_api.Icon.Book
          }
        )
      ]
    }
  );
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9rbm93LWFib3V0LXdvcmRzLnRzeCIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3Byb21wdC50cyIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL2xvb2t1cC1zd2lmdC50cyIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3RlbGVncmFtLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xuICBBY3Rpb24sXG4gIEFjdGlvblBhbmVsLFxuICBMaXN0LFxuICBzaG93VG9hc3QsXG4gIFRvYXN0LFxuICBnZXRQcmVmZXJlbmNlVmFsdWVzLFxuICBvcGVuLFxuICBzaG93SW5GaW5kZXIsXG4gIEljb24sXG4gIENvbG9yLFxuICBDbGlwYm9hcmQsXG4gIGVudmlyb25tZW50LFxuICBLZXlib2FyZCxcbn0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlUmVmIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzL3Byb21pc2VzXCI7XG5pbXBvcnQgb3MgZnJvbSBcIm9zXCI7XG5pbXBvcnQgeyBQUk9NUFQgfSBmcm9tIFwiLi9wcm9tcHRcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBleGVjLCBleGVjRmlsZSB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tIFwidXRpbFwiO1xuaW1wb3J0IHsgU1dJRlRfTE9PS1VQX0NPREUgfSBmcm9tIFwiLi9sb29rdXAtc3dpZnRcIjtcbmltcG9ydCB7IGZvcm1hdEZvclRlbGVncmFtLCBwb3N0VG9UZWxlZ3JhbUNoYW5uZWwgfSBmcm9tIFwiLi90ZWxlZ3JhbVwiO1xuXG5jb25zdCBleGVjRmlsZVByb21pc2UgPSBwcm9taXNpZnkoZXhlY0ZpbGUpO1xuY29uc3QgZXhlY1Byb21pc2UgPSBwcm9taXNpZnkoZXhlYyk7XG5cbi8vIERlZmluZSB0aGUgcHJlZmVyZW5jZXMgaW50ZXJmYWNlIG1hdGNoaW5nIHBhY2thZ2UuanNvblxuaW50ZXJmYWNlIFByZWZlcmVuY2VzIHtcbiAgZ2VtaW5pQXBpS2V5OiBzdHJpbmc7XG4gIHdvcmRzRGlyZWN0b3J5OiBzdHJpbmc7XG4gIGdlbWluaU1vZGVsOiBzdHJpbmc7XG4gIHRlbGVncmFtQm90VG9rZW4/OiBzdHJpbmc7XG4gIHRlbGVncmFtQ2hhdElkPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgV29yZEl0ZW0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBudW1iZXI7XG4gIHVwZGF0ZWRBdDogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBnZXRXb3Jkc0Rpcih3b3Jkc0RpcmVjdG9yeVByZWY6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJlc29sdmVkID0gd29yZHNEaXJlY3RvcnlQcmVmIHx8IFwifi93b3Jkc1wiO1xuICBpZiAocmVzb2x2ZWQuc3RhcnRzV2l0aChcIn4vXCIpKSB7XG4gICAgcmV0dXJuIHBhdGguam9pbihvcy5ob21lZGlyKCksIHJlc29sdmVkLnNsaWNlKDIpKTtcbiAgfVxuICByZXR1cm4gcGF0aC5yZXNvbHZlKHJlc29sdmVkKTtcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXMpIHJldHVybiBcIlwiO1xuICByZXR1cm4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSk7XG59XG5cbmZ1bmN0aW9uIGdldFN1YnRpdGxlKG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KFwiXFxuXCIpO1xuICBjb25zdCBoaW5kaUVxdWl2YWxlbnRJbmRleCA9IGxpbmVzLmZpbmRJbmRleCgobCkgPT5cbiAgICBsLmluY2x1ZGVzKFwiIyMgSGluZGkgRXF1aXZhbGVudFwiKSxcbiAgKTtcbiAgaWYgKGhpbmRpRXF1aXZhbGVudEluZGV4ICE9PSAtMSAmJiBsaW5lc1toaW5kaUVxdWl2YWxlbnRJbmRleCArIDFdKSB7XG4gICAgY29uc3QgbWVhbmluZ0xpbmUgPSBsaW5lc1toaW5kaUVxdWl2YWxlbnRJbmRleCArIDFdLnRyaW0oKTtcbiAgICBpZiAobWVhbmluZ0xpbmUpIHJldHVybiBtZWFuaW5nTGluZTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrOiBzZWFyY2ggZm9yIEhpbmRpIHByb251bmNpYXRpb24gaW4gdGhlIHRpdGxlXG4gIGNvbnN0IHRpdGxlTWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvXiNcXHMrW14oXStcXCgoW14pXSspXFwpL20pO1xuICBpZiAodGl0bGVNYXRjaCAmJiB0aXRsZU1hdGNoWzFdKSB7XG4gICAgcmV0dXJuIHRpdGxlTWF0Y2hbMV07XG4gIH1cbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIGdldFBhcnRPZlNwZWVjaChtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd24uc3BsaXQoXCJcXG5cIik7XG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGJvbGRNYXRjaCA9IGxpbmUubWF0Y2goXG4gICAgICAvXig/Oi1cXHMrKT9cXCpcXCooTm91bnxWZXJifEFkamVjdGl2ZXxBZHZlcmJ8UHJlcG9zaXRpb258Q29uanVuY3Rpb258UHJvbm91bnxJbnRlcmplY3Rpb24pOlxcKlxcKi9pLFxuICAgICk7XG4gICAgaWYgKGJvbGRNYXRjaCkge1xuICAgICAgcGFydHMucHVzaChjYXBpdGFsaXplKGJvbGRNYXRjaFsxXS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgfVxuICB9XG4gIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIG9sZGVyIGhlYWRlciBmb3JtYXRcbiAgY29uc3QgbWF0Y2ggPSBtYXJrZG93bi5tYXRjaChcbiAgICAvXiMjXFxzKyhOb3VufFZlcmJ8QWRqZWN0aXZlfEFkdmVyYnxQcmVwb3NpdGlvbnxDb25qdW5jdGlvbnxQcm9ub3VufEludGVyamVjdGlvbikvaW0sXG4gICk7XG4gIHJldHVybiBtYXRjaCA/IGNhcGl0YWxpemUobWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkgOiBcIlwiO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9tcHRGb3JXb3JkKHdvcmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBQUk9NUFQucmVwbGFjZShcInt3b3JkfVwiLCB3b3JkKTtcbn1cblxuY29uc3Qgc3VwcG9ydFBhdGggPSBlbnZpcm9ubWVudC5zdXBwb3J0UGF0aDtcbmNvbnN0IHN3aWZ0RmlsZVBhdGggPSBwYXRoLmpvaW4oc3VwcG9ydFBhdGgsIFwibG9va3VwLnN3aWZ0XCIpO1xuY29uc3QgYmluYXJ5UGF0aCA9IHBhdGguam9pbihzdXBwb3J0UGF0aCwgXCJsb29rdXBcIik7XG5cbmxldCBpc0NvbXBpbGluZ1Byb21pc2U6IFByb21pc2U8Ym9vbGVhbj4gfCBudWxsID0gbnVsbDtcbmxldCBjb21waWxlU3VjY2VzcyA9IGZhbHNlO1xuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVMb29rdXBDb21waWxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgaWYgKGNvbXBpbGVTdWNjZXNzKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGlzQ29tcGlsaW5nUHJvbWlzZSkgcmV0dXJuIGlzQ29tcGlsaW5nUHJvbWlzZTtcblxuICBpc0NvbXBpbGluZ1Byb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5ta2RpcihzdXBwb3J0UGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUoc3dpZnRGaWxlUGF0aCwgU1dJRlRfTE9PS1VQX0NPREUpO1xuXG4gICAgICAvLyBDaGVjayBpZiBiaW5hcnkgYWxyZWFkeSBleGlzdHMgYW5kIHdvcmtzXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5hY2Nlc3MoYmluYXJ5UGF0aCk7XG4gICAgICAgIGNvbXBpbGVTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gQmluYXJ5IGRvZXNuJ3QgZXhpc3QsIGxldCdzIGNvbXBpbGUgaXRcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBleGVjUHJvbWlzZShgc3dpZnRjIC1PIFwiJHtzd2lmdEZpbGVQYXRofVwiIC1vIFwiJHtiaW5hcnlQYXRofVwiYCk7XG4gICAgICAgICAgY29tcGlsZVN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgXCJTd2lmdCBjb21waWxhdGlvbiBmYWlsZWQsIHdpbGwgdXNlIGZhbGxiYWNrIHJ1bm5lcjpcIixcbiAgICAgICAgICAgIGVycixcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNldHRpbmcgdXAgbG9va3VwIGZpbGVzOlwiLCBlcnIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSkoKTtcblxuICByZXR1cm4gaXNDb21waWxpbmdQcm9taXNlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb29rdXBMb2NhbERpY3Rpb25hcnkod29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRXb3JkID0gd29yZC50cmltKCk7XG4gIGlmICghbm9ybWFsaXplZFdvcmQpIHJldHVybiBudWxsO1xuXG4gIC8vIDEuIFRyeSBjb21waWxlZCBiaW5hcnlcbiAgY29uc3QgaXNDb21waWxlZCA9IGF3YWl0IGVuc3VyZUxvb2t1cENvbXBpbGVkKCk7XG4gIGlmIChpc0NvbXBpbGVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBleGVjRmlsZVByb21pc2UoYmluYXJ5UGF0aCwgW25vcm1hbGl6ZWRXb3JkXSk7XG4gICAgICBpZiAoc3Rkb3V0LnRyaW0oKSkgcmV0dXJuIHN0ZG91dC50cmltKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBFeGl0IGNvZGUgMiBtZWFucyB3b3JkIG5vdCBmb3VuZCwgb3RoZXIgZXhpdCBjb2RlcyBtZWFuIGZhaWx1cmVcbiAgICAgIGNvbnN0IGVycm9yID0gZXJyIGFzIHsgY29kZT86IG51bWJlciB9O1xuICAgICAgaWYgKGVycm9yLmNvZGUgPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmVycm9yKFwiQmluYXJ5IGV4ZWN1dGlvbiBmYWlsZWQsIHRyeWluZyBzY3JpcHQgaW50ZXJwcmV0ZXI6XCIsIGVycik7XG4gICAgfVxuICB9XG5cbiAgLy8gMi4gRmFsbGJhY2s6IFJ1biBTd2lmdCBzY3JpcHQgZGlyZWN0bHkgdmlhIGBzd2lmdGAgY29tbWFuZCBsaW5lIGludGVycHJldGVyXG4gIHRyeSB7XG4gICAgY29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IGV4ZWNGaWxlUHJvbWlzZShcInN3aWZ0XCIsIFtcbiAgICAgIHN3aWZ0RmlsZVBhdGgsXG4gICAgICBub3JtYWxpemVkV29yZCxcbiAgICBdKTtcbiAgICBpZiAoc3Rkb3V0LnRyaW0oKSkgcmV0dXJuIHN0ZG91dC50cmltKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IGVycm9yID0gZXJyIGFzIHsgY29kZT86IG51bWJlciB9O1xuICAgIGlmIChlcnJvci5jb2RlID09PSAyKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc29sZS5lcnJvcihcIlN3aWZ0IHNjcmlwdCBleGVjdXRpb24gZmFpbGVkLCB0cnlpbmcgQVBJIGZhbGxiYWNrOlwiLCBlcnIpO1xuICB9XG5cbiAgLy8gMy4gRmFsbGJhY2s6IE9ubGluZSBEaWN0aW9uYXJ5IEFQSVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXG4gICAgICBgaHR0cHM6Ly9hcGkuZGljdGlvbmFyeWFwaS5kZXYvYXBpL3YyL2VudHJpZXMvZW4vJHtlbmNvZGVVUklDb21wb25lbnQobm9ybWFsaXplZFdvcmQpfWAsXG4gICAgKTtcbiAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgIGludGVyZmFjZSBBUElSZXNwb25zZSB7XG4gICAgICAgIHdvcmQ6IHN0cmluZztcbiAgICAgICAgcGhvbmV0aWM/OiBzdHJpbmc7XG4gICAgICAgIG1lYW5pbmdzOiBBcnJheTx7XG4gICAgICAgICAgcGFydE9mU3BlZWNoOiBzdHJpbmc7XG4gICAgICAgICAgZGVmaW5pdGlvbnM6IEFycmF5PHtcbiAgICAgICAgICAgIGRlZmluaXRpb246IHN0cmluZztcbiAgICAgICAgICAgIGV4YW1wbGU/OiBzdHJpbmc7XG4gICAgICAgICAgfT47XG4gICAgICAgIH0+O1xuICAgICAgfVxuICAgICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXNwb25zZS5qc29uKCkpIGFzIEFQSVJlc3BvbnNlW107XG4gICAgICBpZiAoZGF0YSAmJiBkYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBkYXRhWzBdO1xuICAgICAgICBjb25zdCBwaG9uZXRpYyA9IGVudHJ5LnBob25ldGljIHx8IFwiXCI7XG4gICAgICAgIGNvbnN0IHBhcnRzT2ZTcGVlY2hTdHJpbmdzID0gZW50cnkubWVhbmluZ3MubWFwKChtLCBtSWR4KSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVmcyA9IG0uZGVmaW5pdGlvbnNcbiAgICAgICAgICAgIC5tYXAoKGQsIGRJZHgpID0+IGAke2RJZHggKyAxfSAke2QuZGVmaW5pdGlvbn1gKVxuICAgICAgICAgICAgLmpvaW4oXCIgXHUyMDIyIFwiKTtcblxuICAgICAgICAgIGlmIChtSWR4ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZW50cnkud29yZH0gJHttLnBhcnRPZlNwZWVjaH0gfCAke3Bob25ldGljfSB8ICR7ZGVmc31gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gYCAke20ucGFydE9mU3BlZWNofSB8ICR7cGhvbmV0aWN9IHwgJHtkZWZzfWA7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBhcnRzT2ZTcGVlY2hTdHJpbmdzLmpvaW4oXCJcIik7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiT25saW5lIEFQSSBmYWxsYmFjayBmYWlsZWQ6XCIsIGVycik7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0TG9jYWxEZWZpbml0aW9uKHdvcmQ6IHN0cmluZywgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF0ZXh0KSByZXR1cm4gXCJcIjtcblxuICBjb25zdCB0cmltbWVkID0gdGV4dC50cmltKCkucmVwbGFjZSgvWyBcXHRdKy9nLCBcIiBcIik7XG5cbiAgY29uc3QgcG9zTGlzdCA9IFtcbiAgICBcIm5vdW5cIixcbiAgICBcInZlcmJcIixcbiAgICBcImFkamVjdGl2ZVwiLFxuICAgIFwiYWR2ZXJiXCIsXG4gICAgXCJwcm9ub3VuXCIsXG4gICAgXCJwcmVwb3NpdGlvblwiLFxuICAgIFwiY29uanVuY3Rpb25cIixcbiAgICBcImludGVyamVjdGlvblwiLFxuICAgIFwicGx1cmFsIG5vdW5cIixcbiAgICBcImludHJhbnNpdGl2ZSB2ZXJiXCIsXG4gICAgXCJ0cmFuc2l0aXZlIHZlcmJcIixcbiAgICBcImFkamVjdGl2ZSAmIGFkdmVyYlwiLFxuICAgIFwiZGV0ZXJtaW5lclwiLFxuICAgIFwiZXhjbGFtYXRpb25cIixcbiAgICBcImFiYnJldmlhdGlvblwiLFxuICBdO1xuXG4gIGNvbnN0IHBvc1JlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICBgXFxcXGIoJHtwb3NMaXN0LmpvaW4oXCJ8XCIpfSlcXFxcYihcXFxccypcXFxcW1teXFxcXF1dK1xcXFxdKT9cXFxccyooPzpcXFxcfFxcXFxzKihbXnxdKylcXFxccypcXFxcfHxcXFxccysoWzEtOV1cXFxcYnxcXFxcW25vIG9iamVjdFxcXFxdfFxcXFxbd2l0aCBvYmplY3RcXFxcXSkpYCxcbiAgICBcImdpXCIsXG4gICk7XG5cbiAgY29uc3QgZmlyc3RQaXBlID0gdHJpbW1lZC5pbmRleE9mKFwifFwiKTtcbiAgbGV0IHNlY29uZFBpcGUgPSAtMTtcbiAgaWYgKGZpcnN0UGlwZSAhPT0gLTEpIHtcbiAgICBzZWNvbmRQaXBlID0gdHJpbW1lZC5pbmRleE9mKFwifFwiLCBmaXJzdFBpcGUgKyAxKTtcbiAgfVxuXG4gIGlmIChmaXJzdFBpcGUgPT09IC0xIHx8IHNlY29uZFBpcGUgPT09IC0xKSB7XG4gICAgbGV0IGZvcm1hdHRlZCA9IHRyaW1tZWQucmVwbGFjZSgvXHUyMDIyL2csIFwiXFxuXHUyMDIyIFwiKTtcbiAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZSgvXFxzKyhbMS05XSlcXHMrKD89W2EtekEtWl0pL2csIFwiXFxuXFxuKiokMS4qKiBcIik7XG4gICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UoXG4gICAgICAvXFxiKFBIUkFTRVN8T1JJR0lOfERFUklWQVRJVkVTfFVTQUdFfFBIUkFTQUwgVkVSQlMpXFxiL2csXG4gICAgICBcIlxcblxcbiMjIyAkMVxcblwiLFxuICAgICk7XG4gICAgcmV0dXJuIGAjICR7Y2FwaXRhbGl6ZSh3b3JkKX1cXG5cXG4ke2Zvcm1hdHRlZH1gO1xuICB9XG5cbiAgbGV0IGhlYWQgPSB0cmltbWVkLnN1YnN0cmluZygwLCBmaXJzdFBpcGUpLnRyaW0oKTtcbiAgY29uc3QgcHJvbiA9IHRyaW1tZWQuc3Vic3RyaW5nKGZpcnN0UGlwZSArIDEsIHNlY29uZFBpcGUpLnRyaW0oKTtcbiAgbGV0IHJlc3QgPSB0cmltbWVkLnN1YnN0cmluZyhzZWNvbmRQaXBlICsgMSkudHJpbSgpO1xuXG4gIGxldCBmaXJzdFBvcyA9IFwiXCI7XG4gIGxldCBmaXJzdERldGFpbHMgPSBcIlwiO1xuICBmb3IgKGNvbnN0IHBvcyBvZiBwb3NMaXN0KSB7XG4gICAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoYFxcXFxiJHtwb3N9KFxcXFxzK1xcXFxbW15cXFxcXV0rXFxcXF0pPyRgLCBcImlcIik7XG4gICAgY29uc3QgbSA9IGhlYWQubWF0Y2gocGF0dGVybik7XG4gICAgaWYgKG0pIHtcbiAgICAgIGZpcnN0UG9zID0gcG9zO1xuICAgICAgZmlyc3REZXRhaWxzID0gbVsxXSB8fCBcIlwiO1xuICAgICAgaGVhZCA9IGhlYWQuc3Vic3RyaW5nKDAsIG0uaW5kZXgpLnRyaW0oKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICghZmlyc3RQb3MpIHtcbiAgICBmb3IgKGNvbnN0IHBvcyBvZiBwb3NMaXN0KSB7XG4gICAgICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChgXiR7cG9zfVxcXFxiKFxcXFxzK1xcXFxbW15cXFxcXV0rXFxcXF0pP2AsIFwiaVwiKTtcbiAgICAgIGNvbnN0IG0gPSByZXN0Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgaWYgKG0pIHtcbiAgICAgICAgZmlyc3RQb3MgPSBwb3M7XG4gICAgICAgIGZpcnN0RGV0YWlscyA9IG1bMV0gfHwgXCJcIjtcbiAgICAgICAgcmVzdCA9IHJlc3Quc3Vic3RyaW5nKG1bMF0ubGVuZ3RoKS50cmltKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1hdGNoZXM6IHtcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIGxlbmd0aDogbnVtYmVyO1xuICAgIHBhcnRPZlNwZWVjaDogc3RyaW5nO1xuICAgIGRldGFpbHM6IHN0cmluZztcbiAgICBwcm9udW5jaWF0aW9uOiBzdHJpbmc7XG4gICAgZGVmU3RhcnRUb2tlbjogc3RyaW5nO1xuICB9W10gPSBbXTtcblxuICBsZXQgbWF0Y2g7XG4gIHBvc1JlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gIHdoaWxlICgobWF0Y2ggPSBwb3NSZWdleC5leGVjKHJlc3QpKSAhPT0gbnVsbCkge1xuICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICBpbmRleDogbWF0Y2guaW5kZXgsXG4gICAgICBsZW5ndGg6IG1hdGNoWzBdLmxlbmd0aCxcbiAgICAgIHBhcnRPZlNwZWVjaDogbWF0Y2hbMV0sXG4gICAgICBkZXRhaWxzOiBtYXRjaFsyXSB8fCBcIlwiLFxuICAgICAgcHJvbnVuY2lhdGlvbjogbWF0Y2hbM10gfHwgXCJcIixcbiAgICAgIGRlZlN0YXJ0VG9rZW46IG1hdGNoWzRdIHx8IFwiXCIsXG4gICAgfSk7XG4gIH1cblxuICBpbnRlcmZhY2UgU2VnbWVudCB7XG4gICAgcG9zOiBzdHJpbmc7XG4gICAgZGV0YWlsczogc3RyaW5nO1xuICAgIHByb246IHN0cmluZztcbiAgICB0ZXh0OiBzdHJpbmc7XG4gIH1cbiAgY29uc3Qgc2VnbWVudHM6IFNlZ21lbnRbXSA9IFtdO1xuXG4gIGNvbnN0IGZpcnN0U2VnRW5kID0gbWF0Y2hlcy5sZW5ndGggPiAwID8gbWF0Y2hlc1swXS5pbmRleCA6IHJlc3QubGVuZ3RoO1xuICBzZWdtZW50cy5wdXNoKHtcbiAgICBwb3M6IGZpcnN0UG9zIHx8IFwiZGVmaW5pdGlvblwiLFxuICAgIGRldGFpbHM6IGZpcnN0RGV0YWlscyxcbiAgICBwcm9uOiBwcm9uLFxuICAgIHRleHQ6IHJlc3Quc3Vic3RyaW5nKDAsIGZpcnN0U2VnRW5kKS50cmltKCksXG4gIH0pO1xuXG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IG1hdGNoZXMubGVuZ3RoOyBpZHgrKykge1xuICAgIGNvbnN0IG0gPSBtYXRjaGVzW2lkeF07XG4gICAgY29uc3QgZW5kUG9zID1cbiAgICAgIGlkeCArIDEgPCBtYXRjaGVzLmxlbmd0aCA/IG1hdGNoZXNbaWR4ICsgMV0uaW5kZXggOiByZXN0Lmxlbmd0aDtcblxuICAgIGxldCBtYXRjaExlbiA9IG0ubGVuZ3RoO1xuICAgIGlmIChtLmRlZlN0YXJ0VG9rZW4pIHtcbiAgICAgIGNvbnN0IG1hdGNoU3RyID0gcmVzdC5zdWJzdHJpbmcobS5pbmRleCwgbS5pbmRleCArIG0ubGVuZ3RoKTtcbiAgICAgIGNvbnN0IHRva2VuSW5kZXggPSBtYXRjaFN0ci5pbmRleE9mKG0uZGVmU3RhcnRUb2tlbik7XG4gICAgICBpZiAodG9rZW5JbmRleCAhPT0gLTEpIHtcbiAgICAgICAgbWF0Y2hMZW4gPSB0b2tlbkluZGV4O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGRlZlRleHQgPSByZXN0LnN1YnN0cmluZyhtLmluZGV4ICsgbWF0Y2hMZW4sIGVuZFBvcykudHJpbSgpO1xuICAgIHNlZ21lbnRzLnB1c2goe1xuICAgICAgcG9zOiBtLnBhcnRPZlNwZWVjaCxcbiAgICAgIGRldGFpbHM6IG0uZGV0YWlscyxcbiAgICAgIHByb246IG0ucHJvbnVuY2lhdGlvbiB8fCBwcm9uLFxuICAgICAgdGV4dDogZGVmVGV4dCxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGZvcm1hdHRlZFRpdGxlID0gaGVhZCA/IGNhcGl0YWxpemUoaGVhZCkgOiBjYXBpdGFsaXplKHdvcmQpO1xuICBsZXQgcmVzdWx0ID0gYCMgJHtmb3JtYXR0ZWRUaXRsZX1cXG5gO1xuXG4gIGZvciAoY29uc3Qgc2VnIG9mIHNlZ21lbnRzKSB7XG4gICAgY29uc3QgcG9zTGFiZWwgPSBjYXBpdGFsaXplKHNlZy5wb3MudG9Mb3dlckNhc2UoKSk7XG4gICAgY29uc3QgZGV0YWlsc0xhYmVsID0gc2VnLmRldGFpbHMgPyBgICoke3NlZy5kZXRhaWxzLnRyaW0oKX0qYCA6IFwiXCI7XG4gICAgY29uc3QgcHJvbkxhYmVsID0gc2VnLnByb24udHJpbSgpID8gYCAqfCAke3NlZy5wcm9uLnRyaW0oKX0gfCpgIDogXCJcIjtcblxuICAgIGxldCB0ZXh0ID0gc2VnLnRleHQ7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXHUyMDIyL2csIFwiXFxuXHUyMDIyIFwiKTtcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHMrKFsxLTldKVxccysoPz1bYS16QS1aXSkvZywgXCJcXG5cXG4qKiQxLioqIFwiKTtcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKFxuICAgICAgL1xcYihQSFJBU0VTfE9SSUdJTnxERVJJVkFUSVZFU3xVU0FHRXxQSFJBU0FMIFZFUkJTKVxcYi9nLFxuICAgICAgXCJcXG5cXG4jIyMgJDFcXG5cIixcbiAgICApO1xuXG4gICAgcmVzdWx0ICs9IGBcXG4qKiR7cG9zTGFiZWx9Kioke2RldGFpbHNMYWJlbH0ke3Byb25MYWJlbH1cXG4ke3RleHR9XFxuYDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNsYXNzIFJhdGVMaW1pdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXMgPSA0Mjk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENvbW1hbmQoKSB7XG4gIGNvbnN0IHByZWZlcmVuY2VzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3Qgd29yZHNEaXIgPSB1c2VNZW1vKFxuICAgICgpID0+IGdldFdvcmRzRGlyKHByZWZlcmVuY2VzLndvcmRzRGlyZWN0b3J5KSxcbiAgICBbcHJlZmVyZW5jZXMud29yZHNEaXJlY3RvcnldLFxuICApO1xuXG4gIGNvbnN0IFt3b3Jkcywgc2V0V29yZHNdID0gdXNlU3RhdGU8UmVjb3JkPHN0cmluZywgV29yZEl0ZW0+Pih7fSk7XG4gIGNvbnN0IFtzb3J0QnksIHNldFNvcnRCeV0gPSB1c2VTdGF0ZTxzdHJpbmc+KFwiZGF0ZS1uZXdlc3RcIik7XG4gIGNvbnN0IFtsb2FkaW5nSGlzdG9yeSwgc2V0TG9hZGluZ0hpc3RvcnldID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtpc1NlYXJjaGluZywgc2V0SXNTZWFyY2hpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoVGV4dCwgc2V0U2VhcmNoVGV4dF0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW3NlbGVjdGVkSWQsIHNldFNlbGVjdGVkSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgdW5kZWZpbmVkPih1bmRlZmluZWQpO1xuICBjb25zdCBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYgPSB1c2VSZWY8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtsb29rdXBFcnJvciwgc2V0TG9va3VwRXJyb3JdID0gdXNlU3RhdGU8e1xuICAgIHdvcmQ6IHN0cmluZztcbiAgICB0eXBlOiBcInJhdGUtbGltaXRcIiB8IFwibmV0d29ya1wiIHwgXCJvdGhlclwiO1xuICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgfSB8IG51bGw+KG51bGwpO1xuXG4gIGNvbnN0IFtsb2NhbERlZmluaXRpb24sIHNldExvY2FsRGVmaW5pdGlvbl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2xvYWRpbmdMb2NhbERlZmluaXRpb24sIHNldExvYWRpbmdMb2NhbERlZmluaXRpb25dID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIC8vIENsZWFyIGxvb2t1cCBlcnJvciB3aGVuIHNlYXJjaCB0ZXh0IGNoYW5nZXMgdG8gc29tZXRoaW5nIGRpZmZlcmVudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChsb29rdXBFcnJvciAmJiBsb29rdXBFcnJvci53b3JkICE9PSBzZWFyY2hUZXh0LnRyaW0oKSkge1xuICAgICAgc2V0TG9va3VwRXJyb3IobnVsbCk7XG4gICAgfVxuICB9LCBbc2VhcmNoVGV4dCwgbG9va3VwRXJyb3JdKTtcblxuICAvLyBDbGVhbnVwIHByb2dyYW1tYXRpYyBzZWxlY3Rpb24gcmVmIGFmdGVyIHRoZSBsaXN0IGxheW91dCB1cGRhdGVzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAyMDApO1xuICAgICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgfVxuICB9LCBbc2VhcmNoVGV4dCwgc2VsZWN0ZWRJZF0pO1xuXG4gIC8vIExvYWQgc2F2ZWQgd29yZHMgZnJvbSB0aGUgZGlyZWN0b3J5XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gaW5pdEFuZExvYWQoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih3b3Jkc0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucmVhZGRpcih3b3Jkc0Rpcik7XG4gICAgICAgIGNvbnN0IG1kRmlsZXMgPSBmaWxlcy5maWx0ZXIoKGZpbGUpID0+IGZpbGUuZW5kc1dpdGgoXCIubWRcIikpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVQcm9taXNlcyA9IG1kRmlsZXMubWFwKGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgICAgY29uc3Qgd29yZE5hbWUgPSBmaWxlLnNsaWNlKDAsIC0zKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBmaWxlKTtcbiAgICAgICAgICBjb25zdCBzdGF0ID0gYXdhaXQgZnMuc3RhdChmaWxlUGF0aCk7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3b3JkTmFtZSxcbiAgICAgICAgICAgIHdvcmRJdGVtOiB7XG4gICAgICAgICAgICAgIG5hbWU6IHdvcmROYW1lLFxuICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICBjcmVhdGVkQXQ6IHN0YXQuYmlydGh0aW1lTXMgfHwgc3RhdC5tdGltZU1zIHx8IERhdGUubm93KCksXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogc3RhdC5tdGltZU1zIHx8IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChmaWxlUHJvbWlzZXMpO1xuICAgICAgICBjb25zdCBsb2FkZWRXb3JkczogUmVjb3JkPHN0cmluZywgV29yZEl0ZW0+ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgcmVzIG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICBsb2FkZWRXb3Jkc1tyZXMud29yZE5hbWVdID0gcmVzLndvcmRJdGVtO1xuICAgICAgICB9XG4gICAgICAgIHNldFdvcmRzKGxvYWRlZFdvcmRzKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdm9jYWJ1bGFyeSBmaWxlc1wiLCBlcnIpO1xuICAgICAgICBzaG93VG9hc3Qoe1xuICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICAgIHRpdGxlOiBcIkZhaWxlZCB0byBsb2FkIHNhdmVkIHZvY2FidWxhcnlcIixcbiAgICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRMb2FkaW5nSGlzdG9yeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5pdEFuZExvYWQoKTtcbiAgfSwgW3dvcmRzRGlyXSk7XG5cbiAgLy8gQ2xlYW4gYW5kIGZpbHRlciBzZWFyY2ggcXVlcnlcbiAgY29uc3QgY2xlYW5TZWFyY2hUZXh0ID0gc2VhcmNoVGV4dC50cmltKCk7XG5cbiAgLy8gRmV0Y2ggbG9jYWwgZGljdGlvbmFyeSBkZWZpbml0aW9uIGZvciBuZXcgd29yZHMgd2l0aCBkZWJvdW5jZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgY29uc3QgbG93ZXJRdWVyeSA9IGNsZWFuU2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghbG93ZXJRdWVyeSB8fCB3b3Jkc1tsb3dlclF1ZXJ5XSkge1xuICAgICAgc2V0TG9jYWxEZWZpbml0aW9uKG51bGwpO1xuICAgICAgc2V0TG9hZGluZ0xvY2FsRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0TG9hZGluZ0xvY2FsRGVmaW5pdGlvbih0cnVlKTtcbiAgICBzZXRMb2NhbERlZmluaXRpb24obnVsbCk7XG5cbiAgICBjb25zdCBoYW5kbGVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZWYgPSBhd2FpdCBsb29rdXBMb2NhbERpY3Rpb25hcnkobG93ZXJRdWVyeSk7XG4gICAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgICBzZXRMb2NhbERlZmluaXRpb24oZGVmKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJMb2NhbCBsb29rdXAgZmFpbGVkXCIsIGVycik7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoYWN0aXZlKSB7XG4gICAgICAgICAgc2V0TG9hZGluZ0xvY2FsRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAyNTApOyAvLyBEZWJvdW5jZSBsb29rdXAgYnkgMjUwbXMgdG8gb3B0aW1pemUgcHJvY2VzcyBzcGF3bmluZ1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJUaW1lb3V0KGhhbmRsZXIpO1xuICAgIH07XG4gIH0sIFtjbGVhblNlYXJjaFRleHQsIHdvcmRzXSk7XG5cbiAgLy8gRmlsdGVyIGFuZCBzb3J0IGxvY2FsIHdvcmRzIG1hdGNoaW5nIHRoZSBzZWFyY2ggdGV4dFxuICBjb25zdCBzb3J0ZWRBbmRGaWx0ZXJlZFdvcmRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcXVlcnkgPSBjbGVhblNlYXJjaFRleHQudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIDEuIEZpbHRlclxuICAgIGNvbnN0IGZpbHRlcmVkID0gT2JqZWN0LnZhbHVlcyh3b3JkcykuZmlsdGVyKCh3b3JkSXRlbSkgPT4ge1xuICAgICAgaWYgKCFxdWVyeSkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB3b3JkSXRlbS5uYW1lLmluY2x1ZGVzKHF1ZXJ5KSB8fFxuICAgICAgICBnZXRTdWJ0aXRsZSh3b3JkSXRlbS5jb250ZW50KS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIDIuIFNvcnRcbiAgICByZXR1cm4gZmlsdGVyZWQuc29ydCgoYSwgYikgPT4ge1xuICAgICAgaWYgKHNvcnRCeSA9PT0gXCJhbHBoYWJldGljYWwtYXNjXCIpIHtcbiAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICB9IGVsc2UgaWYgKHNvcnRCeSA9PT0gXCJhbHBoYWJldGljYWwtZGVzY1wiKSB7XG4gICAgICAgIHJldHVybiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUpO1xuICAgICAgfSBlbHNlIGlmIChzb3J0QnkgPT09IFwiZGF0ZS1vbGRlc3RcIikge1xuICAgICAgICByZXR1cm4gYS5jcmVhdGVkQXQgLSBiLmNyZWF0ZWRBdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlZmF1bHQ6IGRhdGUtbmV3ZXN0XG4gICAgICAgIHJldHVybiBiLmNyZWF0ZWRBdCAtIGEuY3JlYXRlZEF0O1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBbd29yZHMsIGNsZWFuU2VhcmNoVGV4dCwgc29ydEJ5XSk7XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHdlIHNob3VsZCBzaG93IHRoZSBcIlNlYXJjaCBHZW1pbmlcIiBpdGVtXG4gIGNvbnN0IHNob3dMb29rdXBJdGVtID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFjbGVhblNlYXJjaFRleHQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBsb3dlclF1ZXJ5ID0gY2xlYW5TZWFyY2hUZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gRG8gbm90IHNob3cgbG9va3VwIG9wdGlvbiBpZiBpdCBtYXRjaGVzIGEgc2F2ZWQgd29yZCBleGFjdGx5XG4gICAgcmV0dXJuICF3b3Jkc1tsb3dlclF1ZXJ5XTtcbiAgfSwgW3dvcmRzLCBjbGVhblNlYXJjaFRleHRdKTtcblxuICAvLyBIYW5kbGUgR2VtaW5pIEFQSSBsb29rdXBcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTG9va3VwKHdvcmRUb0xvb2t1cDogc3RyaW5nLCBmb3JjZVJlY3JlYXRlID0gZmFsc2UpIHtcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmRUb0xvb2t1cC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWRXb3JkKSByZXR1cm47XG5cbiAgICBpZiAoIWZvcmNlUmVjcmVhdGUgJiYgd29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICBzZXRTZWxlY3RlZElkKG5vcm1hbGl6ZWRXb3JkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogZm9yY2VSZWNyZWF0ZVxuICAgICAgICA/IFwiUmUtZ2VuZXJhdGluZyB3b3JkIGVudHJ5Li4uXCJcbiAgICAgICAgOiBgTG9va2luZyB1cCBcIiR7d29yZFRvTG9va3VwfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIHNldElzU2VhcmNoaW5nKHRydWUpO1xuICAgIHNldExvb2t1cEVycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcGlLZXkgPSBwcmVmZXJlbmNlcy5nZW1pbmlBcGlLZXk7XG4gICAgICBpZiAoIWFwaUtleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJHZW1pbmkgQVBJIGtleSBpcyBub3QgY29uZmlndXJlZCBpbiBleHRlbnNpb24gcHJlZmVyZW5jZXMuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZGVsID0gcHJlZmVyZW5jZXMuZ2VtaW5pTW9kZWwgfHwgXCJnZW1pbmktMy41LWZsYXNoXCI7XG4gICAgICBjb25zdCBwcm9tcHRUZXh0ID0gZ2V0UHJvbXB0Rm9yV29yZCh3b3JkVG9Mb29rdXApO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgICBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy8ke21vZGVsfTpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7YXBpS2V5fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHByb21wdFRleHQsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgKTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgIHRocm93IG5ldyBSYXRlTGltaXRFcnJvcihcIlJhdGUgbGltaXQgcmVhY2hlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEdlbWluaSBBUEkgUmVxdWVzdCBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9XFxuJHtlcnJvclRleHR9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaW50ZXJmYWNlIEdlbWluaVJlc3BvbnNlIHtcbiAgICAgICAgY2FuZGlkYXRlcz86IEFycmF5PHtcbiAgICAgICAgICBjb250ZW50Pzoge1xuICAgICAgICAgICAgcGFydHM/OiBBcnJheTx7XG4gICAgICAgICAgICAgIHRleHQ/OiBzdHJpbmc7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICB9O1xuICAgICAgICB9PjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBHZW1pbmlSZXNwb25zZTtcbiAgICAgIGNvbnN0IHJlc3VsdE1hcmtkb3duID0gZGF0YT8uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xuXG4gICAgICBpZiAoXG4gICAgICAgICFyZXN1bHRNYXJrZG93biB8fFxuICAgICAgICByZXN1bHRNYXJrZG93bi50cmltKCkgPT09IFwiTm8gcmVzcG9uc2UgcmVjZWl2ZWQuXCJcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJObyByZXNwb25zZSBvciBpbnZhbGlkIGZvcm1hdCByZWNlaXZlZCBmcm9tIEdlbWluaSBBUEkuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgd29yZCB0byBsb2NhbCBkYXRhYmFzZVxuICAgICAgLy8gVXNlIHRoZSB3b3JkIG5hbWUgZnJvbSB0aGUgQUkncyBtYXJrZG93biBoZWFkaW5nIChjb3JyZWN0bHkgc3BlbGxlZCwgbG93ZXJjYXNlKVxuICAgICAgLy8gcmF0aGVyIHRoYW4gd2hhdCB0aGUgdXNlciB0eXBlZCwgc28gdHlwb3MgbGlrZSBcInJhcG90XCIgc2F2ZSBhcyBcInJhcHBvcnQubWRcIlxuICAgICAgY29uc3QgaGVhZGluZ01hdGNoID0gcmVzdWx0TWFya2Rvd24udHJpbSgpLm1hdGNoKC9eI1xccysoW14oXFxuXSspLyk7XG4gICAgICBjb25zdCBhaVdvcmROYW1lID0gaGVhZGluZ01hdGNoXG4gICAgICAgID8gaGVhZGluZ01hdGNoWzFdLnRyaW0oKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIDogbm9ybWFsaXplZFdvcmQ7XG5cbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBgJHthaVdvcmROYW1lfS5tZGApO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKGZpbGVQYXRoLCByZXN1bHRNYXJrZG93bi50cmltKCkpO1xuICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IGZzLnN0YXQoZmlsZVBhdGgpO1xuXG4gICAgICAvLyBVcGRhdGUgc3RhdGVcbiAgICAgIHNldFdvcmRzKChwcmV2KSA9PiAoe1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICBbYWlXb3JkTmFtZV06IHtcbiAgICAgICAgICBuYW1lOiBhaVdvcmROYW1lLFxuICAgICAgICAgIGNvbnRlbnQ6IHJlc3VsdE1hcmtkb3duLnRyaW0oKSxcbiAgICAgICAgICBjcmVhdGVkQXQ6XG4gICAgICAgICAgICBwcmV2W2FpV29yZE5hbWVdPy5jcmVhdGVkQXQgfHxcbiAgICAgICAgICAgIHN0YXQuYmlydGh0aW1lTXMgfHxcbiAgICAgICAgICAgIHN0YXQubXRpbWVNcyB8fFxuICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICB1cGRhdGVkQXQ6IHN0YXQubXRpbWVNcyB8fCBEYXRlLm5vdygpLFxuICAgICAgICB9LFxuICAgICAgfSkpO1xuXG4gICAgICAvLyBGb2N1cyB0aGUgbmV3bHkgbG9va2VkIHVwL2NyZWF0ZWQgd29yZFxuICAgICAgcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBhaVdvcmROYW1lO1xuICAgICAgc2V0U2VsZWN0ZWRJZChhaVdvcmROYW1lKTtcbiAgICAgIHNldFNlYXJjaFRleHQoXCJcIik7IC8vIENsZWFyIHNlYXJjaCB0byBzaG93IGluIHRoZSBsaXN0IG9mIHNhdmVkIHdvcmRzXG5cbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJXb3JkIFNhdmVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gYCR7Y2FwaXRhbGl6ZShhaVdvcmROYW1lKX0gYWRkZWQgdG8gZGF0YWJhc2VgO1xuICAgIH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuXG4gICAgICBjb25zdCBlcnJNc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICBjb25zdCBpc05ldHdvcmtFcnJvciA9XG4gICAgICAgIGVyck1zZy5pbmNsdWRlcyhcIkVOT1RGT1VORFwiKSB8fFxuICAgICAgICBlcnJNc2cuaW5jbHVkZXMoXCJmZXRjaCBmYWlsZWRcIikgfHxcbiAgICAgICAgZXJyTXNnLmluY2x1ZGVzKFwibmV0d29ya1wiKSB8fFxuICAgICAgICAoZXJyIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyLm5hbWUgPT09IFwiVHlwZUVycm9yXCIpOyAvLyBzdGFuZGFyZCBmZXRjaCBmYWlsdXJlIG9ubGluZS9vZmZsaW5lIGlzIGEgVHlwZUVycm9yXG5cbiAgICAgIGlmIChpc05ldHdvcmtFcnJvcikge1xuICAgICAgICBzZXRMb29rdXBFcnJvcih7XG4gICAgICAgICAgd29yZDogd29yZFRvTG9va3VwLFxuICAgICAgICAgIHR5cGU6IFwibmV0d29ya1wiLFxuICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICBcIkludGVybmV0IGlzIG5vdCBjb25uZWN0ZWQuIFBsZWFzZSBjaGVjayB5b3VyIG5ldHdvcmsgY29ubmVjdGlvbiBhbmQgdHJ5IGFnYWluLlwiLFxuICAgICAgICB9KTtcbiAgICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5GYWlsdXJlO1xuICAgICAgICB0b2FzdC50aXRsZSA9IFwiTm8gSW50ZXJuZXQgQ29ubmVjdGlvblwiO1xuICAgICAgICB0b2FzdC5tZXNzYWdlID1cbiAgICAgICAgICBcIkludGVybmV0IGlzIG5vdCBjb25uZWN0ZWQuIFBsZWFzZSBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIHRyeSBhZ2Fpbi5cIjtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGVyciBpbnN0YW5jZW9mIFJhdGVMaW1pdEVycm9yIHx8XG4gICAgICAgIGVyck1zZy5pbmNsdWRlcyhcIjQyOVwiKSB8fFxuICAgICAgICBlcnJNc2cudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcInJhdGUgbGltaXRcIilcbiAgICAgICkge1xuICAgICAgICBzZXRMb29rdXBFcnJvcih7XG4gICAgICAgICAgd29yZDogd29yZFRvTG9va3VwLFxuICAgICAgICAgIHR5cGU6IFwicmF0ZS1saW1pdFwiLFxuICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICBcIlJhdGUgbGltaXQgcmVhY2hlZC4gVGhpcyByYXRlIGxpbWl0IHdpbGwgdGFrZSBzb21lIHRpbWUsIHBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuXCIsXG4gICAgICAgIH0pO1xuICAgICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICAgIHRvYXN0LnRpdGxlID0gXCJSYXRlIExpbWl0IFJlYWNoZWRcIjtcbiAgICAgICAgdG9hc3QubWVzc2FnZSA9IFwiUmF0ZSBsaW1pdCByZWFjaGVkLiBUcnkgYWdhaW4gbGF0ZXIuXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb29rdXBFcnJvcih7XG4gICAgICAgICAgd29yZDogd29yZFRvTG9va3VwLFxuICAgICAgICAgIHR5cGU6IFwib3RoZXJcIixcbiAgICAgICAgICBtZXNzYWdlOiBlcnJNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICAgIHRvYXN0LnRpdGxlID0gXCJMb29rdXAgRmFpbGVkXCI7XG4gICAgICAgIHRvYXN0Lm1lc3NhZ2UgPSBlcnJNc2c7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzU2VhcmNoaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICAvLyBPcGVuIGZpbGUgaW4gZGVmYXVsdCBhcHBsaWNhdGlvblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVPcGVuRmlsZSh3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke3dvcmROYW1lLnRvTG93ZXJDYXNlKCl9Lm1kYCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG9wZW4oZmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIkNvdWxkIG5vdCBvcGVuIGZpbGVcIixcbiAgICAgICAgbWVzc2FnZTogU3RyaW5nKGVyciksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXZlYWwgZmlsZSBpbiBmaW5kZXJcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmV2ZWFsSW5GaW5kZXIod29yZE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBgJHt3b3JkTmFtZS50b0xvd2VyQ2FzZSgpfS5tZGApO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzaG93SW5GaW5kZXIoZmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIkNvdWxkIG5vdCByZXZlYWwgZmlsZVwiLFxuICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIERlbGV0ZSB3b3JkIGZpbGUgYW5kIGVudHJ5XG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZURlbGV0ZSh3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke3dvcmROYW1lLnRvTG93ZXJDYXNlKCl9Lm1kYCk7XG4gICAgY29uc3QgdG9hc3QgPSBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkFuaW1hdGVkLFxuICAgICAgdGl0bGU6IGBEZWxldGluZyBcIiR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XCIuLi5gLFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlUGF0aCk7XG4gICAgICBzZXRXb3JkcygocHJldikgPT4ge1xuICAgICAgICBjb25zdCBuZXh0ID0geyAuLi5wcmV2IH07XG4gICAgICAgIGRlbGV0ZSBuZXh0W3dvcmROYW1lXTtcbiAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICB9KTtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJXb3JkIERlbGV0ZWRcIjtcbiAgICAgIHRvYXN0Lm1lc3NhZ2UgPSBgUmVtb3ZlZCAke2NhcGl0YWxpemUod29yZE5hbWUpfSBmcm9tIGRhdGFiYXNlYDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJEZWxldGUgRmFpbGVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gU3RyaW5nKGVycik7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29weSB3b3JkIGZvcm1hdHRlZCBpbiBUZWxlZ3JhbS1mcmllbmRseSBtYXJrZG93biB0byBjbGlwYm9hcmRcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQ29weVRlbGVncmFtVGV4dCh3b3JkTmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0ZWxlZ3JhbVRleHQgPSBmb3JtYXRGb3JUZWxlZ3JhbShjb250ZW50KTtcbiAgICBhd2FpdCBDbGlwYm9hcmQuY29weSh0ZWxlZ3JhbVRleHQpO1xuICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuU3VjY2VzcyxcbiAgICAgIHRpdGxlOiBcIkNvcGllZCBUZWxlZ3JhbSBUZXh0XCIsXG4gICAgICBtZXNzYWdlOiBgJHtjYXBpdGFsaXplKHdvcmROYW1lKX0gY29waWVkIGluIFRlbGVncmFtLWZyaWVuZGx5IGZvcm1hdGAsXG4gICAgfSk7XG4gIH1cblxuICAvLyBQb3N0IHdvcmQgZGlyZWN0bHkgdG8gVGVsZWdyYW0gY2hhbm5lbCB2aWEgVGVsZWdyYW0gQm90IEFQSVxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVQb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gICAgd29yZE5hbWU6IHN0cmluZyxcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICkge1xuICAgIGNvbnN0IGJvdFRva2VuID0gcHJlZmVyZW5jZXMudGVsZWdyYW1Cb3RUb2tlbjtcbiAgICBjb25zdCBjaGF0SWQgPSBwcmVmZXJlbmNlcy50ZWxlZ3JhbUNoYXRJZDtcblxuICAgIGlmICghYm90VG9rZW4gfHwgIWNoYXRJZCkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIlRlbGVncmFtIENyZWRlbnRpYWxzIE1pc3NpbmdcIixcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcIlBsZWFzZSBjb25maWd1cmUgVGVsZWdyYW0gQm90IFRva2VuIGFuZCBDaGF0IElEIGluIEV4dGVuc2lvbiBQcmVmZXJlbmNlcy5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRvYXN0ID0gYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5BbmltYXRlZCxcbiAgICAgIHRpdGxlOiBgUG9zdGluZyBcIiR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XCIgdG8gVGVsZWdyYW0uLi5gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGVsZWdyYW1UZXh0ID0gZm9ybWF0Rm9yVGVsZWdyYW0oY29udGVudCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcG9zdFRvVGVsZWdyYW1DaGFubmVsKGJvdFRva2VuLCBjaGF0SWQsIHRlbGVncmFtVGV4dCk7XG5cbiAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJQb3N0ZWQgdG8gVGVsZWdyYW0gQ2hhbm5lbFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGAke2NhcGl0YWxpemUod29yZE5hbWUpfSBzZW50IHRvICR7Y2hhdElkfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJGYWlsZWQgdG8gUG9zdCB0byBUZWxlZ3JhbVwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IHJlcy5tZXNzYWdlIHx8IFwiVW5rbm93biBlcnJvclwiO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPExpc3RcbiAgICAgIGlzU2hvd2luZ0RldGFpbD17T2JqZWN0LmtleXMod29yZHMpLmxlbmd0aCA+IDAgfHwgc2hvd0xvb2t1cEl0ZW19XG4gICAgICBzZWFyY2hCYXJQbGFjZWhvbGRlcj1cIlNlYXJjaCBzYXZlZCB3b3JkcyBvciBsb29rIHVwIG5ldyBvbmVzLi4uXCJcbiAgICAgIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0U2VhcmNoVGV4dH1cbiAgICAgIHNlYXJjaFRleHQ9e3NlYXJjaFRleHR9XG4gICAgICBpc0xvYWRpbmc9e2xvYWRpbmdIaXN0b3J5IHx8IGlzU2VhcmNoaW5nfVxuICAgICAgc2VsZWN0ZWRJdGVtSWQ9e3NlbGVjdGVkSWR9XG4gICAgICBvblNlbGVjdGlvbkNoYW5nZT17KGlkKSA9PiB7XG4gICAgICAgIGlmIChwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmIChpZCA9PT0gcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldFNlbGVjdGVkSWQoaWQgfHwgdW5kZWZpbmVkKTtcbiAgICAgIH19XG4gICAgICBzZWFyY2hCYXJBY2Nlc3Nvcnk9e1xuICAgICAgICBPYmplY3Qua2V5cyh3b3JkcykubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICA8TGlzdC5Ecm9wZG93blxuICAgICAgICAgICAgdG9vbHRpcD1cIlNvcnQgV29yZHNcIlxuICAgICAgICAgICAgb25DaGFuZ2U9e3NldFNvcnRCeX1cbiAgICAgICAgICAgIHZhbHVlPXtzb3J0Qnl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPExpc3QuRHJvcGRvd24uSXRlbSB0aXRsZT1cIlJlY2VudGx5IEFkZGVkXCIgdmFsdWU9XCJkYXRlLW5ld2VzdFwiIC8+XG4gICAgICAgICAgICA8TGlzdC5Ecm9wZG93bi5JdGVtIHRpdGxlPVwiT2xkZXN0IEFkZGVkXCIgdmFsdWU9XCJkYXRlLW9sZGVzdFwiIC8+XG4gICAgICAgICAgICA8TGlzdC5Ecm9wZG93bi5JdGVtXG4gICAgICAgICAgICAgIHRpdGxlPVwiQWxwaGFiZXRpY2FsIChBLVopXCJcbiAgICAgICAgICAgICAgdmFsdWU9XCJhbHBoYWJldGljYWwtYXNjXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8TGlzdC5Ecm9wZG93bi5JdGVtXG4gICAgICAgICAgICAgIHRpdGxlPVwiQWxwaGFiZXRpY2FsIChaLUEpXCJcbiAgICAgICAgICAgICAgdmFsdWU9XCJhbHBoYWJldGljYWwtZGVzY1wiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvTGlzdC5Ecm9wZG93bj5cbiAgICAgICAgKSA6IHVuZGVmaW5lZFxuICAgICAgfVxuICAgID5cbiAgICAgIHtzaG93TG9va3VwSXRlbSAmJiAoXG4gICAgICAgIDxMaXN0LlNlY3Rpb24gdGl0bGU9XCJBSSBMb29rdXBcIj5cbiAgICAgICAgICB7bG9va3VwRXJyb3IgJiZcbiAgICAgICAgICBsb29rdXBFcnJvci53b3JkLnRvTG93ZXJDYXNlKCkgPT09IGNsZWFuU2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpID8gKFxuICAgICAgICAgICAgPExpc3QuSXRlbVxuICAgICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtLWVycm9yXCJcbiAgICAgICAgICAgICAgdGl0bGU9e2BMb29rdXAgRmFpbGVkIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgICAgc3VidGl0bGU9e1xuICAgICAgICAgICAgICAgIGxvb2t1cEVycm9yLnR5cGUgPT09IFwicmF0ZS1saW1pdFwiXG4gICAgICAgICAgICAgICAgICA/IFwiUmF0ZSBMaW1pdCBSZWFjaGVkXCJcbiAgICAgICAgICAgICAgICAgIDogbG9va3VwRXJyb3IudHlwZSA9PT0gXCJuZXR3b3JrXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcIk5vIEludGVybmV0XCJcbiAgICAgICAgICAgICAgICAgICAgOiBcIkVycm9yXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpY29uPXt7IHNvdXJjZTogSWNvbi5FeGNsYW1hdGlvbk1hcmssIGNvbG9yOiBDb2xvci5SZWQgfX1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJldHJ5IExvb2t1cFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uUmVwZWF0fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlTG9va3VwKGNsZWFuU2VhcmNoVGV4dCl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAge2xvb2t1cEVycm9yLnR5cGUgPT09IFwicmF0ZS1saW1pdFwiICYmIChcbiAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiU2VhcmNoIG9uIEdvb2dsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkdsb2JlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsPXtgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChjbGVhblNlYXJjaFRleHQgKyBcIiBtZWFuaW5nXCIpfWB9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBDaGF0R1BUXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uTWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybD17YGh0dHBzOi8vY2hhdGdwdC5jb20vP3E9JHtlbmNvZGVVUklDb21wb25lbnQoZ2V0UHJvbXB0Rm9yV29yZChjbGVhblNlYXJjaFRleHQpKX1gfVxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDb3B5IFByb21wdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNvcHlDbGlwYm9hcmR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDbGlwYm9hcmQuY29weShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRQcm9tcHRGb3JXb3JkKGNsZWFuU2VhcmNoVGV4dCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiUHJvbXB0IENvcGllZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkRlc2lnbmF0ZWQgQ2hhdEdQVCBwcm9tcHQgY29waWVkIHRvIGNsaXBib2FyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGV0YWlsPXtcbiAgICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbFxuICAgICAgICAgICAgICAgICAgbWFya2Rvd249e2AjIExvb2t1cCBGYWlsZWQgZm9yIFwiJHtjbGVhblNlYXJjaFRleHR9XCJcXG5cXG4ke1xuICAgICAgICAgICAgICAgICAgICBsb29rdXBFcnJvci50eXBlID09PSBcInJhdGUtbGltaXRcIlxuICAgICAgICAgICAgICAgICAgICAgID8gYFx1MjZBMFx1RkUwRiAqKlJhdGUgbGltaXQgcmVhY2hlZC4qKiBUaGlzIHJhdGUgbGltaXQgd2lsbCB0YWtlIHNvbWUgdGltZSwgcGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cXG5cXG4jIyMgQWx0ZXJuYXRpdmVzOlxcbjEuICoqR29vZ2xlIFNlYXJjaCoqOiBTZWFyY2ggZm9yIHRoaXMgd29yZCBkaXJlY3RseSBvbiBHb29nbGUuXFxuMi4gKipPcGVuIENoYXRHUFQqKjogT3BlbiBDaGF0R1BUIHdpdGggdGhlIGRlc2lnbmF0ZWQgcHJvbXB0IGFscmVhZHkgZW1iZWRkZWQuXFxuMy4gKipDb3B5IFByb21wdCoqOiBDb3B5IHRoZSBwcm9tcHQgdG8gY2xpcGJvYXJkIHRvIG1hbnVhbGx5IHBhc3RlIGl0IGluIGFueSBBSS5gXG4gICAgICAgICAgICAgICAgICAgICAgOiBsb29rdXBFcnJvci50eXBlID09PSBcIm5ldHdvcmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPyBgXHVEODNEXHVEQ0UxICoqSW50ZXJuZXQgaXMgbm90IGNvbm5lY3RlZC4qKiBQbGVhc2UgY2hlY2sgeW91ciBuZXR3b3JrIGNvbm5lY3Rpb24gYW5kIHRyeSBhZ2Fpbi5gXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGBcdTI3NEMgKipFcnJvcioqOiAke2xvb2t1cEVycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPExpc3QuSXRlbVxuICAgICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtXCJcbiAgICAgICAgICAgICAgdGl0bGU9e2BTZWFyY2ggR2VtaW5pIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgICAgaWNvbj17SWNvbi5HbG9iZX1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxvb2t1cCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5NYWduaWZ5aW5nR2xhc3N9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVMb29rdXAoY2xlYW5TZWFyY2hUZXh0KX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZXRhaWw9e1xuICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsXG4gICAgICAgICAgICAgICAgICBtYXJrZG93bj17XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdMb2NhbERlZmluaXRpb25cbiAgICAgICAgICAgICAgICAgICAgICA/IGAjICR7Y2FwaXRhbGl6ZShjbGVhblNlYXJjaFRleHQpfVxcblxcbipTZWFyY2hpbmcgbG9jYWwgZGljdGlvbmFyeS4uLipgXG4gICAgICAgICAgICAgICAgICAgICAgOiBsb2NhbERlZmluaXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgID8gYCR7Zm9ybWF0TG9jYWxEZWZpbml0aW9uKGNsZWFuU2VhcmNoVGV4dCwgbG9jYWxEZWZpbml0aW9uKX1cXG5cXG4tLS1cXG5cXG5cdUQ4M0RcdURDQTEgKlByZXNzICoqRW50ZXIqKiB0byBsb29rIHVwIG9uIEdlbWluaSBBSSBhbmQgc2F2ZSB0aGlzIHdvcmQgd2l0aCBIaW5kaSBtZWFuaW5nLCBleGFtcGxlcywgZXR5bW9sb2d5LCBldGMuKmBcbiAgICAgICAgICAgICAgICAgICAgICAgIDogYCMgJHtjYXBpdGFsaXplKGNsZWFuU2VhcmNoVGV4dCl9XFxuXFxuKkRlZmluaXRpb24gbm90IGZvdW5kIGluIGxvY2FsIGRpY3Rpb25hcnkuKlxcblxcbi0tLVxcblxcblx1RDgzRFx1RENBMSAqUHJlc3MgKipFbnRlcioqIHRvIGxvb2sgdXAgb24gR2VtaW5pIEFJIGFuZCBzYXZlIHRoaXMgd29yZCB3aXRoIEhpbmRpIG1lYW5pbmcsIGV4YW1wbGVzLCBldHltb2xvZ3ksIGV0Yy4qYFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9MaXN0LlNlY3Rpb24+XG4gICAgICApfVxuXG4gICAgICB7c29ydGVkQW5kRmlsdGVyZWRXb3Jkcy5sZW5ndGggPiAwID8gKFxuICAgICAgICA8TGlzdC5TZWN0aW9uIHRpdGxlPVwiU2F2ZWQgVm9jYWJ1bGFyeVwiPlxuICAgICAgICAgIHtzb3J0ZWRBbmRGaWx0ZXJlZFdvcmRzLm1hcCgod29yZEl0ZW0pID0+IChcbiAgICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgICAga2V5PXt3b3JkSXRlbS5uYW1lfVxuICAgICAgICAgICAgICBpZD17d29yZEl0ZW0ubmFtZX1cbiAgICAgICAgICAgICAgdGl0bGU9e2NhcGl0YWxpemUod29yZEl0ZW0ubmFtZSl9XG4gICAgICAgICAgICAgIHN1YnRpdGxlPXtnZXRTdWJ0aXRsZSh3b3JkSXRlbS5jb250ZW50KX1cbiAgICAgICAgICAgICAgYWNjZXNzb3JpZXM9e1tcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGdldFBhcnRPZlNwZWVjaCh3b3JkSXRlbS5jb250ZW50KSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IENvbG9yLkJsdWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgIGRldGFpbD17PExpc3QuSXRlbS5EZXRhaWwgbWFya2Rvd249e3dvcmRJdGVtLmNvbnRlbnR9IC8+fVxuICAgICAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBUZWxlZ3JhbSBUZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5Db3B5Q2xpcGJvYXJkfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17S2V5Ym9hcmQuU2hvcnRjdXQuQ29tbW9uLkNvcHl9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNvcHlUZWxlZ3JhbVRleHQod29yZEl0ZW0ubmFtZSwgd29yZEl0ZW0uY29udGVudClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJQb3N0IHRvIFRlbGVncmFtIENoYW5uZWxcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlBhcGVycGxhbmV9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCIsIFwic2hpZnRcIl0sIGtleTogXCJyZXR1cm5cIiB9fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVQb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JkSXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29yZEl0ZW0uY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBNYXJrZG93blwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uQ29weUNsaXBib2FyZH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDbGlwYm9hcmQuY29weSh3b3JkSXRlbS5jb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJDb3BpZWQgdG8gQ2xpcGJvYXJkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgJHtjYXBpdGFsaXplKHdvcmRJdGVtLm5hbWUpfSBtYXJrZG93biBjb3BpZWRgLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJPcGVuIEZpbGVcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkRvY3VtZW50fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlT3BlbkZpbGUod29yZEl0ZW0ubmFtZSl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJldmVhbCBpbiBGaW5kZXJcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkZpbmRlcn1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZVJldmVhbEluRmluZGVyKHdvcmRJdGVtLm5hbWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJSZWZyZXNoIFdvcmRcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlJlcGVhdH1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e0tleWJvYXJkLlNob3J0Y3V0LkNvbW1vbi5SZWZyZXNofVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlTG9va3VwKHdvcmRJdGVtLm5hbWUsIHRydWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgV29yZFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uVHJhc2h9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXtBY3Rpb24uU3R5bGUuRGVzdHJ1Y3RpdmV9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY3RybFwiXSwga2V5OiBcInhcIiB9fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlRGVsZXRlKHdvcmRJdGVtLm5hbWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L0xpc3QuU2VjdGlvbj5cbiAgICAgICkgOiAoXG4gICAgICAgICFzaG93TG9va3VwSXRlbSAmJlxuICAgICAgICAhbG9hZGluZ0hpc3RvcnkgJiYgKFxuICAgICAgICAgIDxMaXN0LkVtcHR5Vmlld1xuICAgICAgICAgICAgdGl0bGU9XCJZb3VyIHZvY2FidWxhcnkgaXMgZW1wdHlcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJUeXBlIGEgd29yZCBpbiB0aGUgc2VhcmNoIGJhciBhbmQgcHJlc3MgRW50ZXIgdG8gcXVlcnkgR2VtaW5pIEFJLlwiXG4gICAgICAgICAgICBpY29uPXtJY29uLkJvb2t9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuICAgICAgKX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG4iLCAiZXhwb3J0IGNvbnN0IFBST01QVCA9IGBcbllvdSBhcmUgYSB2b2NhYnVsYXJ5IGFzc2lzdGFudC5cblxuV29yZDoge3dvcmR9XG5cbk91dHB1dCBTVFJJQ1QgTWFya2Rvd24uXG5cblJ1bGVzOlxuLSBVc2Ugb25seSBNYXJrZG93blxuLSBObyBIVE1MXG4tIE5vIGVtb2ppc1xuLSBObyB0YWJsZXNcbi0gVXNlIFwiLVwiIGJ1bGxldHMgb25seVxuLSBLZWVwIHNwYWNpbmcgY2xlYW5cbi0gS2VlcCBjb25jaXNlXG4tIE5vIGNvZGUgYmxvY2tzXG4tIERvIG5vdCB3cmFwIHJlc3BvbnNlIGluIG1hcmtkb3duIGZlbmNlc1xuLSBNYXhpbXVtIGNsYXJpdHksIG1pbmltdW0gd29yZHNcblxuRm9ybWF0OlxuXG4jIFdvcmQgKEhpbmRpIFByb251bmNpYXRpb24pXG4tICoqTm91bjoqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhIG5vdW4pXG4tICoqVmVyYjoqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhIHZlcmIpXG4tICoqQWRqZWN0aXZlOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGFuIGFkamVjdGl2ZSlcbi0gKipBZHZlcmI6Kiogc2hvcnQgZGVmaW5pdGlvbiAoXHUyMjY0MjAgd29yZHMpIChpbmNsdWRlIE9OTFkgaWYgdGhlIHdvcmQgY2FuIGJlIHVzZWQgYXMgYW4gYWR2ZXJiKVxuKGp1c3QgbGlrZSB0aGF0IGFsbCBvdGhlciB0eXBlcyBvZiBwYXJ0IG9mIHNwZWVjaGVzLCBhYm92ZSA0IGFyZSBqdXN0IGV4YW1wbGVzKSAoYW5kIHdoZW4gbXVsdGlwbGUgcGFydCBvZiBzcGVlY2hlcyBleGlzdHMsIHRoZW4gdXNlIGEgbGlzdCBpdGVtIFwiLVwiIGZvciBlYWNoIHBhcnQgb2Ygc3BlZWNoLCBzbyB0aGV5IGFyZSBjbGVhbmx5IHNlcGFyYXRlZCBhcyBsaXN0IGl0ZW1zLiBtZWFucyBubyB0d28gcGFydCBvZiBzcGVlY2ggb24gc2FtZSBsaW5lKVxuXG4jIyBIaW5kaSBFcXVpdmFsZW50XG5tZWFuaW5nMSwgbWVhbmluZzIsIG1lYW5pbmczXG5cbiMjIFdoZW4gdG8gdXNlXG4tIHBvaW50XG4tIHBvaW50XG4tIHBvaW50XG5cbiMjIEV4YW1wbGVzXG4tIHNlbnRlbmNlXG4tIEhpbmRpIHRyYW5zbGF0aW9uXG4tIHNlbnRlbmNlXG4tIEhpbmRpIHRyYW5zbGF0aW9uXG5cbiMjIFN5bm9ueW1zXG53MSwgdzIsIHczLCB3NFxuXG4jIyBBbnRvbnltc1xudzEsIHcyLCB3MywgdzRcblxuQ29uZGl0aW9uYWw6XG5JbmNsdWRlIG9ubHkgd2hlbiBtZWFuaW5nZnVsLlxuXG4jIyBXb3JkIEJyZWFrZG93blxuLSBwYXJ0IFx1MjE5MiBtZWFuaW5nXG5cbiMjIEZvcm1hdGlvbiBGbG93XG4tIHN0ZXAgXHUyMTkyIG1lYW5pbmdcblxuIyMgRXR5bW9sb2d5XG5icmllZiBvcmlnaW5cblxuQ29uc3RyYWludHM6XG4tIE5vIGV4dHJhIHRleHRcbi0gTm8gZXhwbGFuYXRpb25zXG4tIE5vIGRldmlhdGlvbnNcbi0gT3V0cHV0IG9ubHkgdGhlIGZvcm1hdHRlZCBlbnRyeVxuYDtcbiIsICJleHBvcnQgY29uc3QgU1dJRlRfTE9PS1VQX0NPREUgPSBgXG5pbXBvcnQgRm91bmRhdGlvblxuaW1wb3J0IENvcmVTZXJ2aWNlcy5EaWN0aW9uYXJ5U2VydmljZXNcblxuZnVuYyBnZXREZWZpbml0aW9uKGZvciB3b3JkOiBTdHJpbmcpIC0+IFN0cmluZz8ge1xuICAgIGxldCBuc1N0cmluZyA9IHdvcmQgYXMgTlNTdHJpbmdcbiAgICBsZXQgcmFuZ2UgPSBDRlJhbmdlKGxvY2F0aW9uOiAwLCBsZW5ndGg6IG5zU3RyaW5nLmxlbmd0aClcbiAgICBcbiAgICBndWFyZCBsZXQgZGVmaW5pdGlvbiA9IERDU0NvcHlUZXh0RGVmaW5pdGlvbihuaWwsIG5zU3RyaW5nLCByYW5nZSkgZWxzZSB7XG4gICAgICAgIHJldHVybiBuaWxcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGRlZmluaXRpb24udGFrZVVucmV0YWluZWRWYWx1ZSgpIGFzIFN0cmluZ1xufVxuXG5sZXQgYXJncyA9IENvbW1hbmRMaW5lLmFyZ3VtZW50c1xuaWYgYXJncy5jb3VudCA8IDIge1xuICAgIGV4aXQoMSlcbn1cblxubGV0IHdvcmQgPSBhcmdzWzFdXG5pZiBsZXQgZGVmaW5pdGlvbiA9IGdldERlZmluaXRpb24oZm9yOiB3b3JkKSB7XG4gICAgcHJpbnQoZGVmaW5pdGlvbilcbn0gZWxzZSB7XG4gICAgZXhpdCgyKVxufVxuYDtcbiIsICIvKipcbiAqIFRlbGVncmFtIGZvcm1hdHRpbmcgYW5kIEJvdCBBUEkgdXRpbGl0eSBtb2R1bGUuXG4gKi9cblxuLyoqXG4gKiBGb3JtYXRzIGEgdm9jYWJ1bGFyeSBlbnRyeSdzIHJhdyBtYXJrZG93biBjb250ZW50IGludG8gVGVsZWdyYW0tZnJpZW5kbHkgdGV4dC5cbiAqXG4gKiBGb3JtYXR0aW5nIHJ1bGVzOlxuICogLSBUaXRsZTogKipXb3JkIChQcm9udW5jaWF0aW9uKSoqIHdpdGggMiBzcGFjZXMgbGluZSBlbmRcbiAqIC0gRGVmaW5pdGlvbnM6IEdyb3VwZWQgYnkgUE9TICgqKk5vdW46KiopIHdpdGggMSkgLi4uIDIpIC4uLiBudW1iZXJlZCBsaXN0XG4gKiAtIFNlY3Rpb25zICgqKkhpbmRpIEVxdWl2YWxlbnQ6KiosICoqV2hlbiB0byB1c2U6KiosICoqRXhhbXBsZXM6KiosIGV0Yy4pXG4gKiAtIExpc3RzOiBCdWxsZXRzIGZvcm1hdHRlZCB3aXRoIGAtIGl0ZW1gIGFuZCAyIHNwYWNlcyBsaW5lIGVuZFxuICogLSBFdHltb2xvZ3k6IE9yaWdpbiB0ZXJtcyBmb3JtYXR0ZWQgd2l0aCBgX190ZXJtX19gIChUZWxlZ3JhbSBkb3VibGUgdW5kZXJzY29yZSBpdGFsaWMpXG4gKiAtIE1haW4gc2VjdGlvbnMgc2VwYXJhdGVkIGJ5IGRvdWJsZSBuZXdsaW5lcyBgXFxuXFxuYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Rm9yVGVsZWdyYW0obWFya2Rvd25Db250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIW1hcmtkb3duQ29udGVudCB8fCAhbWFya2Rvd25Db250ZW50LnRyaW0oKSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bkNvbnRlbnQudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xuXG4gIC8vIDEuIEZpbmQgSDEgVGl0bGUgbGluZSAoIyBXb3JkIC4uLilcbiAgbGV0IHRpdGxlSW5kZXggPSAtMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICgvXiNcXHMrLy50ZXN0KGxpbmVzW2ldKSkge1xuICAgICAgdGl0bGVJbmRleCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAodGl0bGVJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gbWFya2Rvd25Db250ZW50O1xuICB9XG5cbiAgY29uc3QgcmF3VGl0bGVMaW5lID0gbGluZXNbdGl0bGVJbmRleF07XG4gIGNvbnN0IHRpdGxlTWF0Y2ggPSByYXdUaXRsZUxpbmUubWF0Y2goL14jXFxzKyhbXihdKz8pKD86XFxzKlxcKChbXildKilcXCkpP1xccyokLyk7XG4gIGxldCB0aXRsZVRleHQgPSBcIlwiO1xuICBpZiAodGl0bGVNYXRjaCkge1xuICAgIGNvbnN0IHJhd1dvcmQgPSB0aXRsZU1hdGNoWzFdLnRyaW0oKTtcbiAgICBjb25zdCBjYXBpdGFsaXplZFdvcmQgPSByYXdXb3JkLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmF3V29yZC5zbGljZSgxKTtcbiAgICBjb25zdCBwcm9uID0gdGl0bGVNYXRjaFsyXSA/IHRpdGxlTWF0Y2hbMl0udHJpbSgpIDogXCJcIjtcbiAgICB0aXRsZVRleHQgPSBwcm9uXG4gICAgICA/IGAqKiR7Y2FwaXRhbGl6ZWRXb3JkfSAoJHtwcm9ufSkqKmBcbiAgICAgIDogYCoqJHtjYXBpdGFsaXplZFdvcmR9KipgO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNsZWFuZWRUaXRsZSA9IHJhd1RpdGxlTGluZS5yZXBsYWNlKC9eI1xccysvLCBcIlwiKS50cmltKCk7XG4gICAgY29uc3QgY2FwaXRhbGl6ZWRUaXRsZSA9XG4gICAgICBjbGVhbmVkVGl0bGUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjbGVhbmVkVGl0bGUuc2xpY2UoMSk7XG4gICAgdGl0bGVUZXh0ID0gYCoqJHtjYXBpdGFsaXplZFRpdGxlfSoqYDtcbiAgfVxuXG4gIC8vIDIuIFRva2VuaXplIGNvbnRlbnQgaW50byBUaXRsZSBCbG9jayBhbmQgIyMgU2VjdGlvbnNcbiAgbGV0IGN1cnJlbnRIZWFkaW5nID0gXCJfX3RpdGxlX19cIjtcbiAgbGV0IGN1cnJlbnRMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgc2VjdGlvbk1hcCA9IG5ldyBNYXA8XG4gICAgc3RyaW5nLFxuICAgIHsgb3JpZ2luYWxIZWFkaW5nOiBzdHJpbmc7IGNvbnRlbnRMaW5lczogc3RyaW5nW10gfVxuICA+KCk7XG4gIGNvbnN0IHNlY3Rpb25PcmRlcjogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gdGl0bGVJbmRleCArIDE7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpXTtcbiAgICBjb25zdCBoMk1hdGNoID0gbGluZS5tYXRjaCgvXiMjXFxzKyguKykkLyk7XG4gICAgaWYgKGgyTWF0Y2gpIHtcbiAgICAgIGlmIChjdXJyZW50SGVhZGluZyA9PT0gXCJfX3RpdGxlX19cIikge1xuICAgICAgICBzZWN0aW9uTWFwLnNldChcIl9fdGl0bGVfX1wiLCB7XG4gICAgICAgICAgb3JpZ2luYWxIZWFkaW5nOiBcIl9fdGl0bGVfX1wiLFxuICAgICAgICAgIGNvbnRlbnRMaW5lczogY3VycmVudExpbmVzLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlY3Rpb25NYXAuc2V0KGN1cnJlbnRIZWFkaW5nLCB7XG4gICAgICAgICAgb3JpZ2luYWxIZWFkaW5nOiBjdXJyZW50SGVhZGluZyxcbiAgICAgICAgICBjb250ZW50TGluZXM6IGN1cnJlbnRMaW5lcyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50SGVhZGluZyA9IGgyTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgY3VycmVudExpbmVzID0gW107XG4gICAgICBzZWN0aW9uT3JkZXIucHVzaChjdXJyZW50SGVhZGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRMaW5lcy5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjdXJyZW50SGVhZGluZyA9PT0gXCJfX3RpdGxlX19cIikge1xuICAgIHNlY3Rpb25NYXAuc2V0KFwiX190aXRsZV9fXCIsIHtcbiAgICAgIG9yaWdpbmFsSGVhZGluZzogXCJfX3RpdGxlX19cIixcbiAgICAgIGNvbnRlbnRMaW5lczogY3VycmVudExpbmVzLFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHNlY3Rpb25NYXAuc2V0KGN1cnJlbnRIZWFkaW5nLCB7XG4gICAgICBvcmlnaW5hbEhlYWRpbmc6IGN1cnJlbnRIZWFkaW5nLFxuICAgICAgY29udGVudExpbmVzOiBjdXJyZW50TGluZXMsXG4gICAgfSk7XG4gIH1cblxuICAvLyAzLiBQcm9jZXNzIERlZmluaXRpb25zIGluIFRpdGxlIEJsb2NrXG4gIGNvbnN0IHRpdGxlQmxvY2sgPSBzZWN0aW9uTWFwLmdldChcIl9fdGl0bGVfX1wiKTtcbiAgY29uc3QgcG9zRGVmaW5pdGlvbnNNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG5cbiAgaWYgKHRpdGxlQmxvY2spIHtcbiAgICBjb25zdCBwb3NQYXR0ZXJuID1cbiAgICAgIC9eXFxzKig/Oi1cXHMrKT9cXCpcXCooTm91bnxWZXJifEFkamVjdGl2ZXxBZHZlcmJ8UHJlcG9zaXRpb258Q29uanVuY3Rpb258UHJvbm91bnxJbnRlcmplY3Rpb24pOlxcKlxcKlxccyooLispJC9pO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiB0aXRsZUJsb2NrLmNvbnRlbnRMaW5lcykge1xuICAgICAgY29uc3QgbWF0Y2ggPSBsaW5lLm1hdGNoKHBvc1BhdHRlcm4pO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGNvbnN0IHBvcyA9XG4gICAgICAgICAgbWF0Y2hbMV0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBtYXRjaFsxXS5zbGljZSgxKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBjb25zdCBtZWFuaW5nID0gbWF0Y2hbMl0udHJpbSgpO1xuICAgICAgICBpZiAoIXBvc0RlZmluaXRpb25zTWFwLmhhcyhwb3MpKSB7XG4gICAgICAgICAgcG9zRGVmaW5pdGlvbnNNYXAuc2V0KHBvcywgW10pO1xuICAgICAgICB9XG4gICAgICAgIHBvc0RlZmluaXRpb25zTWFwLmdldChwb3MpIS5wdXNoKG1lYW5pbmcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlc3VsdEJsb2Nrczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBUaXRsZSBsaW5lIGJsb2NrXG4gIHJlc3VsdEJsb2Nrcy5wdXNoKGAke3RpdGxlVGV4dH0gIGApO1xuXG4gIC8vIERlZmluaXRpb25zIGJsb2NrXG4gIGlmIChwb3NEZWZpbml0aW9uc01hcC5zaXplID4gMCkge1xuICAgIGNvbnN0IGRlZkJsb2NrTGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBbcG9zLCBkZWZzXSBvZiBwb3NEZWZpbml0aW9uc01hcC5lbnRyaWVzKCkpIHtcbiAgICAgIGRlZnMuZm9yRWFjaCgoZGVmKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuRGVmID0gZGVmLnJlcGxhY2UoL15cXGQrXFwpXFxzKi8sIFwiXCIpLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICBkZWZCbG9ja0xpbmVzLnB1c2goYCoqJHtwb3N9OioqICR7Y2xlYW5EZWZ9ICBgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXN1bHRCbG9ja3MucHVzaChkZWZCbG9ja0xpbmVzLmpvaW4oXCJcXG5cIikpO1xuICB9XG5cbiAgLy8gNC4gUHJvY2VzcyBlYWNoICMjIFNlY3Rpb24gaW4gb3JpZ2luYWwgb3JkZXJcbiAgZm9yIChjb25zdCBoZWFkaW5nTmFtZSBvZiBzZWN0aW9uT3JkZXIpIHtcbiAgICBjb25zdCBzZWN0aW9uRGF0YSA9IHNlY3Rpb25NYXAuZ2V0KGhlYWRpbmdOYW1lKTtcbiAgICBpZiAoIXNlY3Rpb25EYXRhKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGhlYWRpbmdMb3dlciA9IGhlYWRpbmdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgcmF3Q29udGVudExpbmVzID0gc2VjdGlvbkRhdGEuY29udGVudExpbmVzXG4gICAgICAubWFwKChsKSA9PiBsLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoKGwpID0+IGwubGVuZ3RoID4gMCk7XG5cbiAgICBpZiAocmF3Q29udGVudExpbmVzLmxlbmd0aCA9PT0gMCkgY29udGludWU7XG5cbiAgICBpZiAoaGVhZGluZ0xvd2VyID09PSBcImhpbmRpIGVxdWl2YWxlbnRcIikge1xuICAgICAgY29uc3QgbGluZSA9IHJhd0NvbnRlbnRMaW5lcy5qb2luKFwiIFwiKTtcbiAgICAgIHJlc3VsdEJsb2Nrcy5wdXNoKGAqKkhpbmRpIEVxdWl2YWxlbnQ6KiogIFxcbiR7bGluZX1gKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJ3aGVuIHRvIHVzZVwiKSB7XG4gICAgICBjb25zdCBpdGVtcyA9IHJhd0NvbnRlbnRMaW5lcy5tYXAoKGxpbmUpID0+IHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGxpbmUucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICAgIHJldHVybiBgLSAke2NsZWFuZWR9ICBgO1xuICAgICAgfSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipXaGVuIHRvIHVzZToqKiAgXFxuJHtpdGVtcy5qb2luKFwiXFxuXCIpfWApO1xuICAgIH0gZWxzZSBpZiAoaGVhZGluZ0xvd2VyID09PSBcImV4YW1wbGVzXCIpIHtcbiAgICAgIGNvbnN0IGl0ZW1zID0gcmF3Q29udGVudExpbmVzLm1hcCgobGluZSkgPT4ge1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gbGluZS5yZXBsYWNlKC9eLVxccyovLCBcIlwiKTtcbiAgICAgICAgcmV0dXJuIGAtICR7Y2xlYW5lZH0gIGA7XG4gICAgICB9KTtcbiAgICAgIHJlc3VsdEJsb2Nrcy5wdXNoKGAqKkV4YW1wbGVzOioqICBcXG4ke2l0ZW1zLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwic3lub255bXNcIikge1xuICAgICAgY29uc3QgdGV4dCA9IHJhd0NvbnRlbnRMaW5lcy5qb2luKFwiIFwiKS5yZXBsYWNlKC9eLVxccyovLCBcIlwiKTtcbiAgICAgIHJlc3VsdEJsb2Nrcy5wdXNoKGAqKlN5bm9ueW1zOioqICR7dGV4dH0gIGApO1xuICAgIH0gZWxzZSBpZiAoaGVhZGluZ0xvd2VyID09PSBcImFudG9ueW1zXCIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSByYXdDb250ZW50TGluZXMuam9pbihcIiBcIikucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipBbnRvbnltczoqKiAke3RleHR9ICBgKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJ3b3JkIGJyZWFrZG93blwiKSB7XG4gICAgICBjb25zdCBpdGVtcyA9IHJhd0NvbnRlbnRMaW5lcy5tYXAoKGxpbmUpID0+IHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGxpbmUucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICAgIHJldHVybiBgLSAke2NsZWFuZWR9ICBgO1xuICAgICAgfSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipXb3JkIEJyZWFrZG93bjoqKlxcbiR7aXRlbXMuam9pbihcIlxcblwiKX1gKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJmb3JtYXRpb24gZmxvd1wiKSB7XG4gICAgICBjb25zdCBpdGVtcyA9IHJhd0NvbnRlbnRMaW5lcy5tYXAoKGxpbmUpID0+IHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGxpbmUucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICAgIHJldHVybiBgLSAke2NsZWFuZWR9ICBgO1xuICAgICAgfSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipGb3JtYXRpb24gRmxvdzoqKlxcbiR7aXRlbXMuam9pbihcIlxcblwiKX1gKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJldHltb2xvZ3lcIikge1xuICAgICAgbGV0IHRleHQgPSByYXdDb250ZW50TGluZXMuam9pbihcIiBcIik7XG4gICAgICAvLyBDb252ZXJ0IHNpbmdsZS1xdW90ZWQgb3Igc2luZ2xlLWFzdGVyaXNrIG9yaWdpbiB3b3JkcyB0byBfX3dvcmRfX1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvJyhbXiddKyknL2csIFwiX18kMV9fXCIpO1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvKF58XFxzKVxcKihbXipdKylcXCooXFxzfCQpL2csIFwiJDFfXyQyX18kM1wiKTtcbiAgICAgIHJlc3VsdEJsb2Nrcy5wdXNoKGAqKkV0eW1vbG9neToqKiAgXFxuJHt0ZXh0fWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBoZWFkaW5nQ2FwID1cbiAgICAgICAgaGVhZGluZ05hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBoZWFkaW5nTmFtZS5zbGljZSgxKTtcbiAgICAgIHJlc3VsdEJsb2Nrcy5wdXNoKGAqKiR7aGVhZGluZ0NhcH06KiogIFxcbiR7cmF3Q29udGVudExpbmVzLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdEJsb2Nrcy5qb2luKFwiXFxuXFxuXCIpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIFRlbGVncmFtLWZyaWVuZGx5IHRleHQgKCoqYm9sZCoqLCBfX2l0YWxpY19fKSB0byBUZWxlZ3JhbSBIVE1MIGZvcm1hdFxuICogZm9yIHVzZSB3aXRoIFRlbGVncmFtIEJvdCBBUEkgYHNlbmRNZXNzYWdlYCAocGFyc2VfbW9kZTogXCJIVE1MXCIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVsZWdyYW1NYXJrZG93blRvSHRtbCh0ZWxlZ3JhbVRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghdGVsZWdyYW1UZXh0KSByZXR1cm4gXCJcIjtcblxuICAvLyAxLiBFc2NhcGUgSFRNTCBlbnRpdGllc1xuICBsZXQgaHRtbCA9IHRlbGVncmFtVGV4dFxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcbiAgICAucmVwbGFjZSgvPC9nLCBcIiZsdDtcIilcbiAgICAucmVwbGFjZSgvPi9nLCBcIiZndDtcIik7XG5cbiAgLy8gMi4gQ29udmVydCAqKmJvbGQqKiB0byA8Yj5ib2xkPC9iPlxuICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXCpcXCooW14qXSspXFwqXFwqL2csIFwiPGI+JDE8L2I+XCIpO1xuXG4gIC8vIDMuIENvbnZlcnQgX19pdGFsaWNfXyB0byA8aT5pdGFsaWM8L2k+XG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL19fKFteX10rKV9fL2csIFwiPGk+JDE8L2k+XCIpO1xuXG4gIC8vIDQuIENvbnZlcnQgfn5zdHJpa2V0aHJvdWdofn4gdG8gPHM+c3RyaWtldGhyb3VnaDwvcz5cbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvfn4oW15+XSspfn4vZywgXCI8cz4kMTwvcz5cIik7XG5cbiAgLy8gNS4gU3RyaXAgdHJhaWxpbmcgbGluZSBzcGFjZXMgYmVmb3JlIG5ld2xpbmVzIGZvciBjbGVhbiBIVE1MIHJlbmRlcmluZ1xuICBodG1sID0gaHRtbC5yZXBsYWNlKC9bIFxcdF0rXFxuL2csIFwiXFxuXCIpO1xuXG4gIHJldHVybiBodG1sO1xufVxuXG4vKipcbiAqIERpcmVjdGx5IHBvc3RzIGEgVGVsZWdyYW0tZm9ybWF0dGVkIHZvY2FidWxhcnkgZW50cnkgdG8gYSBUZWxlZ3JhbSBjaGFubmVsL2NoYXQgdXNpbmcgVGVsZWdyYW0gQm90IEFQSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBvc3RUb1RlbGVncmFtQ2hhbm5lbChcbiAgYm90VG9rZW46IHN0cmluZyxcbiAgY2hhdElkOiBzdHJpbmcsXG4gIHRlbGVncmFtRm9ybWF0dGVkVGV4dDogc3RyaW5nLFxuKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB0b2tlbiA9IGJvdFRva2VuLnRyaW0oKTtcbiAgY29uc3QgY2hhdCA9IGNoYXRJZC50cmltKCk7XG5cbiAgaWYgKCF0b2tlbikge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIlRlbGVncmFtIEJvdCBUb2tlbiBpcyByZXF1aXJlZC5cIiB9O1xuICB9XG4gIGlmICghY2hhdCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiVGVsZWdyYW0gQ2hhbm5lbCAvIENoYXQgSUQgaXMgcmVxdWlyZWQuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGh0bWxDb250ZW50ID0gdGVsZWdyYW1NYXJrZG93blRvSHRtbCh0ZWxlZ3JhbUZvcm1hdHRlZFRleHQpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLnRlbGVncmFtLm9yZy9ib3Qke3Rva2VufS9zZW5kTWVzc2FnZWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2hhdF9pZDogY2hhdCxcbiAgICAgICAgdGV4dDogaHRtbENvbnRlbnQsXG4gICAgICAgIHBhcnNlX21vZGU6IFwiSFRNTFwiLFxuICAgICAgICBkaXNhYmxlX3dlYl9wYWdlX3ByZXZpZXc6IHRydWUsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIGludGVyZmFjZSBUZWxlZ3JhbVJlc3BvbnNlIHtcbiAgICAgIG9rOiBib29sZWFuO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgICBlcnJvcl9jb2RlPzogbnVtYmVyO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBUZWxlZ3JhbVJlc3BvbnNlO1xuXG4gICAgaWYgKHJlc3BvbnNlLm9rICYmIGRhdGEub2spIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCBlcnJEZXNjID1cbiAgICAgIGRhdGEuZGVzY3JpcHRpb24gfHwgcmVzcG9uc2Uuc3RhdHVzVGV4dCB8fCBgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gO1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgXCJJbnZhbGlkIFRlbGVncmFtIEJvdCBUb2tlbi4gUGxlYXNlIGNoZWNrIGV4dGVuc2lvbiBwcmVmZXJlbmNlcy5cIixcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBUZWxlZ3JhbSBFcnJvcjogJHtlcnJEZXNjfS4gRW5zdXJlIHRoZSBib3QgaXMgYWRkZWQgdG8gdGhlIGNoYW5uZWwuYCxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMyB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBUZWxlZ3JhbSBFcnJvcjogJHtlcnJEZXNjfS4gRW5zdXJlIGJvdCBoYXMgcG9zdGluZyBhZG1pbiBwZXJtaXNzaW9ucy5gLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBgVGVsZWdyYW0gRXJyb3IgKCR7ZGF0YS5lcnJvcl9jb2RlIHx8IHJlc3BvbnNlLnN0YXR1c30pOiAke2VyckRlc2N9YCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQWNPO0FBQ1AsbUJBQXFEO0FBQ3JELHNCQUFlO0FBQ2YsZ0JBQWU7OztBQ2pCUixJQUFNLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFB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
