import {
  Action,
  ActionPanel,
  List,
  showToast,
  Toast,
  getPreferenceValues,
  open,
  showInFinder,
  Icon,
  Color,
  Clipboard,
  environment,
  Keyboard,
} from "@raycast/api";
import { useState, useEffect, useMemo, useRef } from "react";
import fs from "fs/promises";
import os from "os";
import { PROMPT } from "./prompt";
import path from "path";
import { exec, execFile } from "child_process";
import { promisify } from "util";
import { SWIFT_LOOKUP_CODE } from "./lookup-swift";
import { formatForTelegram, postToTelegramChannel } from "./telegram";
import { ScheduleForm } from "./schedule-form";
import { ScheduledList } from "./scheduled-list";
import { processPendingPosts } from "./scheduler";

const execFilePromise = promisify(execFile);
const execPromise = promisify(exec);

// Define the preferences interface matching package.json
interface Preferences {
  geminiApiKey: string;
  wordsDirectory: string;
  geminiModel: string;
  telegramBotToken?: string;
  telegramChatId?: string;
}

interface WordItem {
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

function getWordsDir(wordsDirectoryPref: string): string {
  const resolved = wordsDirectoryPref || "~/words";
  if (resolved.startsWith("~/")) {
    return path.join(os.homedir(), resolved.slice(2));
  }
  return path.resolve(resolved);
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getSubtitle(markdown: string): string {
  const lines = markdown.split("\n");
  const hindiEquivalentIndex = lines.findIndex((l) =>
    l.includes("## Hindi Equivalent"),
  );
  if (hindiEquivalentIndex !== -1 && lines[hindiEquivalentIndex + 1]) {
    const meaningLine = lines[hindiEquivalentIndex + 1].trim();
    if (meaningLine) return meaningLine;
  }

  // Fallback: search for Hindi pronunciation in the title
  const titleMatch = markdown.match(/^#\s+[^(]+\(([^)]+)\)/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1];
  }
  return "";
}

function getPartOfSpeech(markdown: string): string {
  const parts: string[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const boldMatch = line.match(
      /^(?:-\s+)?\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*/i,
    );
    if (boldMatch) {
      parts.push(capitalize(boldMatch[1].toLowerCase()));
    }
  }
  if (parts.length > 0) {
    return parts.join(", ");
  }

  // Fallback to older header format
  const match = markdown.match(
    /^##\s+(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection)/im,
  );
  return match ? capitalize(match[1].toLowerCase()) : "";
}

function getPromptForWord(word: string): string {
  return PROMPT.replace("{word}", word);
}

const supportPath = environment.supportPath;
const swiftFilePath = path.join(supportPath, "lookup.swift");
const binaryPath = path.join(supportPath, "lookup");

let isCompilingPromise: Promise<boolean> | null = null;
let compileSuccess = false;

async function ensureLookupCompiled(): Promise<boolean> {
  if (compileSuccess) return true;
  if (isCompilingPromise) return isCompilingPromise;

  isCompilingPromise = (async () => {
    try {
      await fs.mkdir(supportPath, { recursive: true });
      await fs.writeFile(swiftFilePath, SWIFT_LOOKUP_CODE);

      // Check if binary already exists and works
      try {
        await fs.access(binaryPath);
        compileSuccess = true;
        return true;
      } catch {
        // Binary doesn't exist, let's compile it
        try {
          await execPromise(`swiftc -O "${swiftFilePath}" -o "${binaryPath}"`);
          compileSuccess = true;
          return true;
        } catch (err) {
          console.error(
            "Swift compilation failed, will use fallback runner:",
            err,
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

async function lookupLocalDictionary(word: string): Promise<string | null> {
  const normalizedWord = word.trim();
  if (!normalizedWord) return null;

  // 1. Try compiled binary
  const isCompiled = await ensureLookupCompiled();
  if (isCompiled) {
    try {
      const { stdout } = await execFilePromise(binaryPath, [normalizedWord]);
      if (stdout.trim()) return stdout.trim();
    } catch (err) {
      // Exit code 2 means word not found, other exit codes mean failure
      const error = err as { code?: number };
      if (error.code === 2) {
        return null;
      }
      console.error("Binary execution failed, trying script interpreter:", err);
    }
  }

  // 2. Fallback: Run Swift script directly via `swift` command line interpreter
  try {
    const { stdout } = await execFilePromise("swift", [
      swiftFilePath,
      normalizedWord,
    ]);
    if (stdout.trim()) return stdout.trim();
  } catch (err) {
    const error = err as { code?: number };
    if (error.code === 2) {
      return null;
    }
    console.error("Swift script execution failed, trying API fallback:", err);
  }

  // 3. Fallback: Online Dictionary API
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
    );
    if (response.ok) {
      interface APIResponse {
        word: string;
        phonetic?: string;
        meanings: Array<{
          partOfSpeech: string;
          definitions: Array<{
            definition: string;
            example?: string;
          }>;
        }>;
      }
      const data = (await response.json()) as APIResponse[];
      if (data && data.length > 0) {
        const entry = data[0];
        const phonetic = entry.phonetic || "";
        const partsOfSpeechStrings = entry.meanings.map((m, mIdx) => {
          const defs = m.definitions
            .map((d, dIdx) => `${dIdx + 1} ${d.definition}`)
            .join(" • ");

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

function formatLocalDefinition(word: string, text: string): string {
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
    "abbreviation",
  ];

  const posRegex = new RegExp(
    `\\b(${posList.join("|")})\\b(\\s*\\[[^\\]]+\\])?\\s*(?:\\|\\s*([^|]+)\\s*\\||\\s+([1-9]\\b|\\[no object\\]|\\[with object\\]))`,
    "gi",
  );

  const firstPipe = trimmed.indexOf("|");
  let secondPipe = -1;
  if (firstPipe !== -1) {
    secondPipe = trimmed.indexOf("|", firstPipe + 1);
  }

  if (firstPipe === -1 || secondPipe === -1) {
    let formatted = trimmed.replace(/•/g, "\n• ");
    formatted = formatted.replace(/\s+([1-9])\s+(?=[a-zA-Z])/g, "\n\n**$1.** ");
    formatted = formatted.replace(
      /\b(PHRASES|ORIGIN|DERIVATIVES|USAGE|PHRASAL VERBS)\b/g,
      "\n\n### $1\n",
    );
    return `# ${capitalize(word)}\n\n${formatted}`;
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

  const matches: {
    index: number;
    length: number;
    partOfSpeech: string;
    details: string;
    pronunciation: string;
    defStartToken: string;
  }[] = [];

  let match;
  posRegex.lastIndex = 0;
  while ((match = posRegex.exec(rest)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      partOfSpeech: match[1],
      details: match[2] || "",
      pronunciation: match[3] || "",
      defStartToken: match[4] || "",
    });
  }

  interface Segment {
    pos: string;
    details: string;
    pron: string;
    text: string;
  }
  const segments: Segment[] = [];

  const firstSegEnd = matches.length > 0 ? matches[0].index : rest.length;
  segments.push({
    pos: firstPos || "definition",
    details: firstDetails,
    pron: pron,
    text: rest.substring(0, firstSegEnd).trim(),
  });

  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    const endPos =
      idx + 1 < matches.length ? matches[idx + 1].index : rest.length;

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
      text: defText,
    });
  }

  const formattedTitle = head ? capitalize(head) : capitalize(word);
  let result = `# ${formattedTitle}\n`;

  for (const seg of segments) {
    const posLabel = capitalize(seg.pos.toLowerCase());
    const detailsLabel = seg.details ? ` *${seg.details.trim()}*` : "";
    const pronLabel = seg.pron.trim() ? ` *| ${seg.pron.trim()} |*` : "";

    let text = seg.text;
    text = text.replace(/•/g, "\n• ");
    text = text.replace(/\s+([1-9])\s+(?=[a-zA-Z])/g, "\n\n**$1.** ");
    text = text.replace(
      /\b(PHRASES|ORIGIN|DERIVATIVES|USAGE|PHRASAL VERBS)\b/g,
      "\n\n### $1\n",
    );

    result += `\n**${posLabel}**${detailsLabel}${pronLabel}\n${text}\n`;
  }

  return result;
}

class RateLimitError extends Error {
  status = 429;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const wordsDir = useMemo(
    () => getWordsDir(preferences.wordsDirectory),
    [preferences.wordsDirectory],
  );

  const [words, setWords] = useState<Record<string, WordItem>>({});
  const [sortBy, setSortBy] = useState<string>("date-newest");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const programmaticSelectionRef = useRef<string | null>(null);
  const [lookupError, setLookupError] = useState<{
    word: string;
    type: "rate-limit" | "network" | "other";
    message: string;
  } | null>(null);

  const [localDefinition, setLocalDefinition] = useState<string | null>(null);
  const [loadingLocalDefinition, setLoadingLocalDefinition] = useState(false);

  // Clear lookup error when search text changes to something different
  useEffect(() => {
    if (lookupError && lookupError.word !== searchText.trim()) {
      setLookupError(null);
    }
  }, [searchText, lookupError]);

  // Cleanup programmatic selection ref after the list layout updates
  useEffect(() => {
    if (programmaticSelectionRef.current !== null) {
      const timer = setTimeout(() => {
        programmaticSelectionRef.current = null;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchText, selectedId]);

  // Load saved words from the directory
  useEffect(() => {
    async function initAndLoad() {
      try {
        if (preferences.telegramBotToken && preferences.telegramChatId) {
          processPendingPosts(
            preferences.telegramBotToken.trim(),
            preferences.telegramChatId.trim(),
          ).catch((err) =>
            console.error("Background scheduled check error:", err),
          );
        }

        await fs.mkdir(wordsDir, { recursive: true });
        const files = await fs.readdir(wordsDir);
        const mdFiles = files.filter((file) => file.endsWith(".md"));

        const filePromises = mdFiles.map(async (file) => {
          const wordName = file.slice(0, -3).toLowerCase();
          const filePath = path.join(wordsDir, file);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, "utf-8");
          return {
            wordName,
            wordItem: {
              name: wordName,
              content,
              createdAt: stat.birthtimeMs || stat.mtimeMs || Date.now(),
              updatedAt: stat.mtimeMs || Date.now(),
            },
          };
        });

        const results = await Promise.all(filePromises);
        const loadedWords: Record<string, WordItem> = {};
        for (const res of results) {
          loadedWords[res.wordName] = res.wordItem;
        }
        setWords(loadedWords);
      } catch (err) {
        console.error("Failed to load vocabulary files", err);
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load saved vocabulary",
          message: String(err),
        });
      } finally {
        setLoadingHistory(false);
      }
    }

    initAndLoad();
  }, [wordsDir]);

  // Clean and filter search query
  const cleanSearchText = searchText.trim();

  // Fetch local dictionary definition for new words with debounce
  useEffect(() => {
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
    }, 250); // Debounce lookup by 250ms to optimize process spawning

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [cleanSearchText, words]);

  // Filter and sort local words matching the search text
  const sortedAndFilteredWords = useMemo(() => {
    const query = cleanSearchText.toLowerCase();

    // 1. Filter
    const filtered = Object.values(words).filter((wordItem) => {
      if (!query) return true;
      return (
        wordItem.name.includes(query) ||
        getSubtitle(wordItem.content).toLowerCase().includes(query)
      );
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === "alphabetical-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "alphabetical-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "date-oldest") {
        return a.createdAt - b.createdAt;
      } else {
        // Default: date-newest
        return b.createdAt - a.createdAt;
      }
    });
  }, [words, cleanSearchText, sortBy]);

  // Determine if we should show the "Search Gemini" item
  const showLookupItem = useMemo(() => {
    if (!cleanSearchText) return false;
    const lowerQuery = cleanSearchText.toLowerCase();
    // Do not show lookup option if it matches a saved word exactly
    return !words[lowerQuery];
  }, [words, cleanSearchText]);

  // Handle Gemini API lookup
  async function handleLookup(wordToLookup: string, forceRecreate = false) {
    const normalizedWord = wordToLookup.trim().toLowerCase();
    if (!normalizedWord) return;

    if (!forceRecreate && words[normalizedWord]) {
      setSelectedId(normalizedWord);
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: forceRecreate
        ? "Re-generating word entry..."
        : `Looking up "${wordToLookup}"...`,
    });

    setIsSearching(true);
    setLookupError(null);
    try {
      const apiKey = preferences.geminiApiKey;
      if (!apiKey) {
        throw new Error(
          "Gemini API key is not configured in extension preferences.",
        );
      }

      const model = preferences.geminiModel || "gemini-3.5-flash";
      const promptText = getPromptForWord(wordToLookup);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          throw new RateLimitError("Rate limit reached");
        }
        throw new Error(
          `Gemini API Request failed: ${response.status} ${response.statusText}\n${errorText}`,
        );
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      }
      const data = (await response.json()) as GeminiResponse;
      const resultMarkdown = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (
        !resultMarkdown ||
        resultMarkdown.trim() === "No response received."
      ) {
        throw new Error(
          "No response or invalid format received from Gemini API.",
        );
      }

      // Save word to local database
      // Use the word name from the AI's markdown heading (correctly spelled, lowercase)
      // rather than what the user typed, so typos like "rapot" save as "rapport.md"
      const headingMatch = resultMarkdown.trim().match(/^#\s+([^(\n]+)/);
      const aiWordName = headingMatch
        ? headingMatch[1].trim().toLowerCase()
        : normalizedWord;

      const filePath = path.join(wordsDir, `${aiWordName}.md`);
      await fs.writeFile(filePath, resultMarkdown.trim());
      const stat = await fs.stat(filePath);

      // Update state
      setWords((prev) => ({
        ...prev,
        [aiWordName]: {
          name: aiWordName,
          content: resultMarkdown.trim(),
          createdAt:
            prev[aiWordName]?.createdAt ||
            stat.birthtimeMs ||
            stat.mtimeMs ||
            Date.now(),
          updatedAt: stat.mtimeMs || Date.now(),
        },
      }));

      // Focus the newly looked up/created word
      programmaticSelectionRef.current = aiWordName;
      setSelectedId(aiWordName);
      setSearchText(""); // Clear search to show in the list of saved words

      toast.style = Toast.Style.Success;
      toast.title = "Word Saved";
      toast.message = `${capitalize(aiWordName)} added to database`;
    } catch (err: unknown) {
      console.error(err);

      const errMsg = err instanceof Error ? err.message : String(err);
      const isNetworkError =
        errMsg.includes("ENOTFOUND") ||
        errMsg.includes("fetch failed") ||
        errMsg.includes("network") ||
        (err instanceof Error && err.name === "TypeError"); // standard fetch failure online/offline is a TypeError

      if (isNetworkError) {
        setLookupError({
          word: wordToLookup,
          type: "network",
          message:
            "Internet is not connected. Please check your network connection and try again.",
        });
        toast.style = Toast.Style.Failure;
        toast.title = "No Internet Connection";
        toast.message =
          "Internet is not connected. Please check your network and try again.";
      } else if (
        err instanceof RateLimitError ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("rate limit")
      ) {
        setLookupError({
          word: wordToLookup,
          type: "rate-limit",
          message:
            "Rate limit reached. This rate limit will take some time, please try again later.",
        });
        toast.style = Toast.Style.Failure;
        toast.title = "Rate Limit Reached";
        toast.message = "Rate limit reached. Try again later.";
      } else {
        setLookupError({
          word: wordToLookup,
          type: "other",
          message: errMsg,
        });
        toast.style = Toast.Style.Failure;
        toast.title = "Lookup Failed";
        toast.message = errMsg;
      }
    } finally {
      setIsSearching(false);
    }
  }

  // Open file in default application
  async function handleOpenFile(wordName: string) {
    const filePath = path.join(wordsDir, `${wordName.toLowerCase()}.md`);
    try {
      await open(filePath);
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Could not open file",
        message: String(err),
      });
    }
  }

  // Reveal file in finder
  async function handleRevealInFinder(wordName: string) {
    const filePath = path.join(wordsDir, `${wordName.toLowerCase()}.md`);
    try {
      await showInFinder(filePath);
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Could not reveal file",
        message: String(err),
      });
    }
  }

  // Delete word file and entry
  async function handleDelete(wordName: string) {
    const filePath = path.join(wordsDir, `${wordName.toLowerCase()}.md`);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Deleting "${capitalize(wordName)}"...`,
    });

    try {
      await fs.unlink(filePath);
      setWords((prev) => {
        const next = { ...prev };
        delete next[wordName];
        return next;
      });
      toast.style = Toast.Style.Success;
      toast.title = "Word Deleted";
      toast.message = `Removed ${capitalize(wordName)} from database`;
    } catch (err) {
      toast.style = Toast.Style.Failure;
      toast.title = "Delete Failed";
      toast.message = String(err);
    }
  }

  // Copy word formatted in Telegram-friendly markdown to clipboard
  async function handleCopyTelegramText(wordName: string, content: string) {
    const telegramText = formatForTelegram(content);
    await Clipboard.copy(telegramText);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied Telegram Text",
      message: `${capitalize(wordName)} copied in Telegram-friendly format`,
    });
  }

  // Post word directly to Telegram channel via Telegram Bot API
  async function handlePostToTelegramChannel(
    wordName: string,
    content: string,
  ) {
    const botToken = preferences.telegramBotToken;
    const chatId = preferences.telegramChatId;

    if (!botToken || !chatId) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Telegram Credentials Missing",
        message:
          "Please configure Telegram Bot Token and Chat ID in Extension Preferences.",
      });
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Posting "${capitalize(wordName)}" to Telegram...`,
    });

    const telegramText = formatForTelegram(content);
    const res = await postToTelegramChannel(botToken, chatId, telegramText);

    if (res.success) {
      toast.style = Toast.Style.Success;
      toast.title = "Posted to Telegram Channel";
      toast.message = `${capitalize(wordName)} sent to ${chatId}`;
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to Post to Telegram";
      toast.message = res.message || "Unknown error";
    }
  }

  return (
    <List
      isShowingDetail={Object.keys(words).length > 0 || showLookupItem}
      searchBarPlaceholder="Search saved words or look up new ones..."
      onSearchTextChange={setSearchText}
      searchText={searchText}
      isLoading={loadingHistory || isSearching}
      selectedItemId={selectedId}
      onSelectionChange={(id) => {
        if (programmaticSelectionRef.current !== null) {
          if (id === programmaticSelectionRef.current) {
            programmaticSelectionRef.current = null;
          }
          return;
        }
        setSelectedId(id || undefined);
      }}
      searchBarAccessory={
        Object.keys(words).length > 0 ? (
          <List.Dropdown
            tooltip="Sort Words"
            onChange={setSortBy}
            value={sortBy}
          >
            <List.Dropdown.Item title="Recently Added" value="date-newest" />
            <List.Dropdown.Item title="Oldest Added" value="date-oldest" />
            <List.Dropdown.Item
              title="Alphabetical (A-Z)"
              value="alphabetical-asc"
            />
            <List.Dropdown.Item
              title="Alphabetical (Z-A)"
              value="alphabetical-desc"
            />
          </List.Dropdown>
        ) : undefined
      }
    >
      {showLookupItem && (
        <List.Section title="AI Lookup">
          {lookupError &&
          lookupError.word.toLowerCase() === cleanSearchText.toLowerCase() ? (
            <List.Item
              id="lookup-item-error"
              title={`Lookup Failed for "${cleanSearchText}"`}
              subtitle={
                lookupError.type === "rate-limit"
                  ? "Rate Limit Reached"
                  : lookupError.type === "network"
                    ? "No Internet"
                    : "Error"
              }
              icon={{ source: Icon.ExclamationMark, color: Color.Red }}
              actions={
                <ActionPanel>
                  <Action
                    title="Retry Lookup"
                    icon={Icon.Repeat}
                    onAction={() => handleLookup(cleanSearchText)}
                  />
                  {lookupError.type === "rate-limit" && (
                    <>
                      <Action.OpenInBrowser
                        title="Search on Google"
                        icon={Icon.Globe}
                        url={`https://www.google.com/search?q=${encodeURIComponent(cleanSearchText + " meaning")}`}
                      />
                      <Action.OpenInBrowser
                        title="Open ChatGPT"
                        icon={Icon.Message}
                        url={`https://chatgpt.com/?q=${encodeURIComponent(getPromptForWord(cleanSearchText))}`}
                      />
                      <Action
                        title="Copy Prompt"
                        icon={Icon.CopyClipboard}
                        onAction={async () => {
                          await Clipboard.copy(
                            getPromptForWord(cleanSearchText),
                          );
                          await showToast({
                            style: Toast.Style.Success,
                            title: "Prompt Copied",
                            message:
                              "Designated ChatGPT prompt copied to clipboard",
                          });
                        }}
                      />
                    </>
                  )}
                </ActionPanel>
              }
              detail={
                <List.Item.Detail
                  markdown={`# Lookup Failed for "${cleanSearchText}"\n\n${
                    lookupError.type === "rate-limit"
                      ? `⚠️ **Rate limit reached.** This rate limit will take some time, please try again later.\n\n### Alternatives:\n1. **Google Search**: Search for this word directly on Google.\n2. **Open ChatGPT**: Open ChatGPT with the designated prompt already embedded.\n3. **Copy Prompt**: Copy the prompt to clipboard to manually paste it in any AI.`
                      : lookupError.type === "network"
                        ? `📡 **Internet is not connected.** Please check your network connection and try again.`
                        : `❌ **Error**: ${lookupError.message}`
                  }`}
                />
              }
            />
          ) : (
            <List.Item
              id="lookup-item"
              title={`Search Gemini for "${cleanSearchText}"`}
              icon={Icon.Globe}
              actions={
                <ActionPanel>
                  <Action
                    title="Lookup Word"
                    icon={Icon.MagnifyingGlass}
                    onAction={() => handleLookup(cleanSearchText)}
                  />
                </ActionPanel>
              }
              detail={
                <List.Item.Detail
                  markdown={
                    loadingLocalDefinition
                      ? `# ${capitalize(cleanSearchText)}\n\n*Searching local dictionary...*`
                      : localDefinition
                        ? `${formatLocalDefinition(cleanSearchText, localDefinition)}\n\n---\n\n💡 *Press **Enter** to look up on Gemini AI and save this word with Hindi meaning, examples, etymology, etc.*`
                        : `# ${capitalize(cleanSearchText)}\n\n*Definition not found in local dictionary.*\n\n---\n\n💡 *Press **Enter** to look up on Gemini AI and save this word with Hindi meaning, examples, etymology, etc.*`
                  }
                />
              }
            />
          )}
        </List.Section>
      )}

      {sortedAndFilteredWords.length > 0 ? (
        <List.Section title="Saved Vocabulary">
          {sortedAndFilteredWords.map((wordItem) => (
            <List.Item
              key={wordItem.name}
              id={wordItem.name}
              title={capitalize(wordItem.name)}
              subtitle={getSubtitle(wordItem.content)}
              accessories={[
                {
                  tag: {
                    value: getPartOfSpeech(wordItem.content),
                    color: Color.Blue,
                  },
                },
              ]}
              detail={<List.Item.Detail markdown={wordItem.content} />}
              actions={
                <ActionPanel>
                  <Action
                    title="Copy Telegram Text"
                    icon={Icon.CopyClipboard}
                    shortcut={Keyboard.Shortcut.Common.Copy}
                    onAction={() =>
                      handleCopyTelegramText(wordItem.name, wordItem.content)
                    }
                  />
                  <Action
                    title="Post to Telegram Channel"
                    icon={Icon.Paperplane}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
                    onAction={() =>
                      handlePostToTelegramChannel(
                        wordItem.name,
                        wordItem.content,
                      )
                    }
                  />
                  <Action.Push
                    title="Schedule for Telegram…"
                    icon={Icon.Calendar}
                    shortcut={Keyboard.Shortcut.Common.Save}
                    target={
                      <ScheduleForm
                        wordName={wordItem.name}
                        markdownContent={wordItem.content}
                      />
                    }
                  />
                  <Action.Push
                    title="View Scheduled Posts"
                    icon={Icon.Clock}
                    shortcut={{ modifiers: ["ctrl"], key: "l" }}
                    target={<ScheduledList />}
                  />
                  <Action
                    title="Copy Markdown"
                    icon={Icon.CopyClipboard}
                    onAction={async () => {
                      await Clipboard.copy(wordItem.content);
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Copied to Clipboard",
                        message: `${capitalize(wordItem.name)} markdown copied`,
                      });
                    }}
                  />
                  <Action
                    title="Open File"
                    icon={Icon.Document}
                    onAction={() => handleOpenFile(wordItem.name)}
                  />
                  <Action
                    title="Reveal in Finder"
                    icon={Icon.Finder}
                    onAction={() => handleRevealInFinder(wordItem.name)}
                  />
                  <Action
                    title="Refresh Word"
                    icon={Icon.Repeat}
                    shortcut={Keyboard.Shortcut.Common.Refresh}
                    onAction={() => handleLookup(wordItem.name, true)}
                  />
                  <Action
                    title="Delete Word"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={() => handleDelete(wordItem.name)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        !showLookupItem &&
        !loadingHistory && (
          <List.EmptyView
            title="Your vocabulary is empty"
            description="Type a word in the search bar and press Enter to query Gemini AI."
            icon={Icon.Book}
          />
        )
      )}
    </List>
  );
}
