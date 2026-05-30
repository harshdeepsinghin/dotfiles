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
} from "@raycast/api";
import { useState, useEffect, useMemo, useRef } from "react";
import fs from "fs/promises";
import os from "os";
import { PROMPT } from "./prompt";
import path from "path";

// Define the preferences interface matching package.json
interface Preferences {
  geminiApiKey: string;
  wordsDirectory: string;
  geminiModel: string;
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
      /^\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*/i,
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

class RateLimitError extends Error {
  status = 429;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const wordsDir = useMemo(
    () => getWordsDir(preferences.wordsDirectory),
    [preferences.wordsDirectory],
  );

  const [words, setWords] = useState<Record<string, string>>({});
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
        await fs.mkdir(wordsDir, { recursive: true });
        const files = await fs.readdir(wordsDir);
        const loadedWords: Record<string, string> = {};

        for (const file of files) {
          if (file.endsWith(".md")) {
            const wordName = file.slice(0, -3).toLowerCase();
            const content = await fs.readFile(
              path.join(wordsDir, file),
              "utf-8",
            );
            loadedWords[wordName] = content;
          }
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

  // Filter local words matching the search text
  const filteredWords = useMemo(() => {
    const query = cleanSearchText.toLowerCase();
    return Object.entries(words).filter(([wordName, content]) => {
      if (!query) return true;
      return (
        wordName.includes(query) ||
        getSubtitle(content).toLowerCase().includes(query)
      );
    });
  }, [words, cleanSearchText]);

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
      const filePath = path.join(wordsDir, `${normalizedWord}.md`);
      await fs.writeFile(filePath, resultMarkdown.trim());

      // Update state
      setWords((prev) => ({
        ...prev,
        [normalizedWord]: resultMarkdown.trim(),
      }));

      // Focus the newly looked up/created word
      programmaticSelectionRef.current = normalizedWord;
      setSelectedId(normalizedWord);
      setSearchText(""); // Clear search to show in the list of saved words

      toast.style = Toast.Style.Success;
      toast.title = "Word Saved";
      toast.message = `${capitalize(normalizedWord)} added to database`;
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
                  markdown={`# Search Gemini for "${cleanSearchText}"\n\nPress **Enter** to look up this word. It will generate a structured entry with definition, Hindi translation/pronunciation, examples, synonyms/antonyms, and word origin, then save it to your local directory.`}
                />
              }
            />
          )}
        </List.Section>
      )}

      {filteredWords.length > 0 ? (
        <List.Section title="Saved Vocabulary">
          {filteredWords.map(([wordName, content]) => (
            <List.Item
              key={wordName}
              id={wordName}
              title={capitalize(wordName)}
              subtitle={getSubtitle(content)}
              accessories={[
                { tag: { value: getPartOfSpeech(content), color: Color.Blue } },
              ]}
              detail={<List.Item.Detail markdown={content} />}
              actions={
                <ActionPanel>
                  <Action
                    title="Copy Markdown"
                    icon={Icon.CopyClipboard}
                    onAction={async () => {
                      await Clipboard.copy(content);
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Copied to Clipboard",
                        message: `${capitalize(wordName)} markdown copied`,
                      });
                    }}
                  />
                  <Action
                    title="Open File"
                    icon={Icon.Document}
                    onAction={() => handleOpenFile(wordName)}
                  />
                  <Action
                    title="Reveal in Finder"
                    icon={Icon.Finder}
                    onAction={() => handleRevealInFinder(wordName)}
                  />
                  <Action
                    title="Refresh Word"
                    icon={Icon.Repeat}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={() => handleLookup(wordName, true)}
                  />
                  <Action
                    title="Delete Word"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={() => handleDelete(wordName)}
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
