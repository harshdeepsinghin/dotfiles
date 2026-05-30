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
**Noun:** short definition (\u226420 words) (include ONLY if the word can be used as a noun)
**Verb:** short definition (\u226420 words) (include ONLY if the word can be used as a verb)
**Adjective:** short definition (\u226420 words) (include ONLY if the word can be used as an adjective)
**Adverb:** short definition (\u226420 words) (include ONLY if the word can be used as an adverb)
(just like that all other types of part of speeches, above 4 are just examples) (and when multiple part of speeches exists, then break lines for each part of speech)

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
var import_jsx_runtime = require("react/jsx-runtime");
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
      /^\*\*(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection):\*\*/i
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
  const [loadingHistory, setLoadingHistory] = (0, import_react.useState)(true);
  const [isSearching, setIsSearching] = (0, import_react.useState)(false);
  const [searchText, setSearchText] = (0, import_react.useState)("");
  const [selectedId, setSelectedId] = (0, import_react.useState)(void 0);
  const programmaticSelectionRef = (0, import_react.useRef)(null);
  const [lookupError, setLookupError] = (0, import_react.useState)(null);
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
        const loadedWords = {};
        for (const file of files) {
          if (file.endsWith(".md")) {
            const wordName = file.slice(0, -3).toLowerCase();
            const content = await import_promises.default.readFile(
              import_path.default.join(wordsDir, file),
              "utf-8"
            );
            loadedWords[wordName] = content;
          }
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
  const filteredWords = (0, import_react.useMemo)(() => {
    const query = cleanSearchText.toLowerCase();
    return Object.entries(words).filter(([wordName, content]) => {
      if (!query) return true;
      return wordName.includes(query) || getSubtitle(content).toLowerCase().includes(query);
    });
  }, [words, cleanSearchText]);
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
      const filePath = import_path.default.join(wordsDir, `${normalizedWord}.md`);
      await import_promises.default.writeFile(filePath, resultMarkdown.trim());
      setWords((prev) => ({
        ...prev,
        [normalizedWord]: resultMarkdown.trim()
      }));
      programmaticSelectionRef.current = normalizedWord;
      setSelectedId(normalizedWord);
      setSearchText("");
      toast.style = import_api.Toast.Style.Success;
      toast.title = "Word Saved";
      toast.message = `${capitalize(normalizedWord)} added to database`;
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
                markdown: `# Search Gemini for "${cleanSearchText}"

Press **Enter** to look up this word. It will generate a structured entry with definition, Hindi translation/pronunciation, examples, synonyms/antonyms, and word origin, then save it to your local directory.`
              }
            )
          }
        ) }),
        filteredWords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Section, { title: "Saved Vocabulary", children: filteredWords.map(([wordName, content]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.List.Item,
          {
            id: wordName,
            title: capitalize(wordName),
            subtitle: getSubtitle(content),
            accessories: [
              { tag: { value: getPartOfSpeech(content), color: import_api.Color.Blue } }
            ],
            detail: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Item.Detail, { markdown: content }),
            actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Copy Markdown",
                  icon: import_api.Icon.CopyClipboard,
                  onAction: async () => {
                    await import_api.Clipboard.copy(content);
                    await (0, import_api.showToast)({
                      style: import_api.Toast.Style.Success,
                      title: "Copied to Clipboard",
                      message: `${capitalize(wordName)} markdown copied`
                    });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Open File",
                  icon: import_api.Icon.Document,
                  onAction: () => handleOpenFile(wordName)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Reveal in Finder",
                  icon: import_api.Icon.Finder,
                  onAction: () => handleRevealInFinder(wordName)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Refresh Word",
                  icon: import_api.Icon.Repeat,
                  shortcut: { modifiers: ["cmd"], key: "r" },
                  onAction: () => handleLookup(wordName, true)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api.Action,
                {
                  title: "Delete Word",
                  icon: import_api.Icon.Trash,
                  style: import_api.Action.Style.Destructive,
                  shortcut: { modifiers: ["ctrl"], key: "x" },
                  onAction: () => handleDelete(wordName)
                }
              )
            ] })
          },
          wordName
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9rbm93LWFib3V0LXdvcmRzLnRzeCIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3Byb21wdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBBY3Rpb25QYW5lbCxcbiAgTGlzdCxcbiAgc2hvd1RvYXN0LFxuICBUb2FzdCxcbiAgZ2V0UHJlZmVyZW5jZVZhbHVlcyxcbiAgb3BlbixcbiAgc2hvd0luRmluZGVyLFxuICBJY29uLFxuICBDb2xvcixcbiAgQ2xpcGJvYXJkLFxufSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCB7IFBST01QVCB9IGZyb20gXCIuL3Byb21wdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gRGVmaW5lIHRoZSBwcmVmZXJlbmNlcyBpbnRlcmZhY2UgbWF0Y2hpbmcgcGFja2FnZS5qc29uXG5pbnRlcmZhY2UgUHJlZmVyZW5jZXMge1xuICBnZW1pbmlBcGlLZXk6IHN0cmluZztcbiAgd29yZHNEaXJlY3Rvcnk6IHN0cmluZztcbiAgZ2VtaW5pTW9kZWw6IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0V29yZHNEaXIod29yZHNEaXJlY3RvcnlQcmVmOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXNvbHZlZCA9IHdvcmRzRGlyZWN0b3J5UHJlZiB8fCBcIn4vd29yZHNcIjtcbiAgaWYgKHJlc29sdmVkLnN0YXJ0c1dpdGgoXCJ+L1wiKSkge1xuICAgIHJldHVybiBwYXRoLmpvaW4ob3MuaG9tZWRpcigpLCByZXNvbHZlZC5zbGljZSgyKSk7XG4gIH1cbiAgcmV0dXJuIHBhdGgucmVzb2x2ZShyZXNvbHZlZCk7XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFzKSByZXR1cm4gXCJcIjtcbiAgcmV0dXJuIHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpO1xufVxuXG5mdW5jdGlvbiBnZXRTdWJ0aXRsZShtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgaGluZGlFcXVpdmFsZW50SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGwpID0+XG4gICAgbC5pbmNsdWRlcyhcIiMjIEhpbmRpIEVxdWl2YWxlbnRcIiksXG4gICk7XG4gIGlmIChoaW5kaUVxdWl2YWxlbnRJbmRleCAhPT0gLTEgJiYgbGluZXNbaGluZGlFcXVpdmFsZW50SW5kZXggKyAxXSkge1xuICAgIGNvbnN0IG1lYW5pbmdMaW5lID0gbGluZXNbaGluZGlFcXVpdmFsZW50SW5kZXggKyAxXS50cmltKCk7XG4gICAgaWYgKG1lYW5pbmdMaW5lKSByZXR1cm4gbWVhbmluZ0xpbmU7XG4gIH1cblxuICAvLyBGYWxsYmFjazogc2VhcmNoIGZvciBIaW5kaSBwcm9udW5jaWF0aW9uIGluIHRoZSB0aXRsZVxuICBjb25zdCB0aXRsZU1hdGNoID0gbWFya2Rvd24ubWF0Y2goL14jXFxzK1teKF0rXFwoKFteKV0rKVxcKS9tKTtcbiAgaWYgKHRpdGxlTWF0Y2ggJiYgdGl0bGVNYXRjaFsxXSkge1xuICAgIHJldHVybiB0aXRsZU1hdGNoWzFdO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJ0T2ZTcGVlY2gobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBib2xkTWF0Y2ggPSBsaW5lLm1hdGNoKFxuICAgICAgL15cXCpcXCooTm91bnxWZXJifEFkamVjdGl2ZXxBZHZlcmJ8UHJlcG9zaXRpb258Q29uanVuY3Rpb258UHJvbm91bnxJbnRlcmplY3Rpb24pOlxcKlxcKi9pLFxuICAgICk7XG4gICAgaWYgKGJvbGRNYXRjaCkge1xuICAgICAgcGFydHMucHVzaChjYXBpdGFsaXplKGJvbGRNYXRjaFsxXS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgfVxuICB9XG4gIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIG9sZGVyIGhlYWRlciBmb3JtYXRcbiAgY29uc3QgbWF0Y2ggPSBtYXJrZG93bi5tYXRjaChcbiAgICAvXiMjXFxzKyhOb3VufFZlcmJ8QWRqZWN0aXZlfEFkdmVyYnxQcmVwb3NpdGlvbnxDb25qdW5jdGlvbnxQcm9ub3VufEludGVyamVjdGlvbikvaW0sXG4gICk7XG4gIHJldHVybiBtYXRjaCA/IGNhcGl0YWxpemUobWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkgOiBcIlwiO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9tcHRGb3JXb3JkKHdvcmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBQUk9NUFQucmVwbGFjZShcInt3b3JkfVwiLCB3b3JkKTtcbn1cblxuY2xhc3MgUmF0ZUxpbWl0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHN0YXR1cyA9IDQyOTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ29tbWFuZCgpIHtcbiAgY29uc3QgcHJlZmVyZW5jZXMgPSBnZXRQcmVmZXJlbmNlVmFsdWVzPFByZWZlcmVuY2VzPigpO1xuICBjb25zdCB3b3Jkc0RpciA9IHVzZU1lbW8oXG4gICAgKCkgPT4gZ2V0V29yZHNEaXIocHJlZmVyZW5jZXMud29yZHNEaXJlY3RvcnkpLFxuICAgIFtwcmVmZXJlbmNlcy53b3Jkc0RpcmVjdG9yeV0sXG4gICk7XG5cbiAgY29uc3QgW3dvcmRzLCBzZXRXb3Jkc10gPSB1c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+Pih7fSk7XG4gIGNvbnN0IFtsb2FkaW5nSGlzdG9yeSwgc2V0TG9hZGluZ0hpc3RvcnldID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtpc1NlYXJjaGluZywgc2V0SXNTZWFyY2hpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoVGV4dCwgc2V0U2VhcmNoVGV4dF0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW3NlbGVjdGVkSWQsIHNldFNlbGVjdGVkSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgdW5kZWZpbmVkPih1bmRlZmluZWQpO1xuICBjb25zdCBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYgPSB1c2VSZWY8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtsb29rdXBFcnJvciwgc2V0TG9va3VwRXJyb3JdID0gdXNlU3RhdGU8e1xuICAgIHdvcmQ6IHN0cmluZztcbiAgICB0eXBlOiBcInJhdGUtbGltaXRcIiB8IFwibmV0d29ya1wiIHwgXCJvdGhlclwiO1xuICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgfSB8IG51bGw+KG51bGwpO1xuXG4gIC8vIENsZWFyIGxvb2t1cCBlcnJvciB3aGVuIHNlYXJjaCB0ZXh0IGNoYW5nZXMgdG8gc29tZXRoaW5nIGRpZmZlcmVudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChsb29rdXBFcnJvciAmJiBsb29rdXBFcnJvci53b3JkICE9PSBzZWFyY2hUZXh0LnRyaW0oKSkge1xuICAgICAgc2V0TG9va3VwRXJyb3IobnVsbCk7XG4gICAgfVxuICB9LCBbc2VhcmNoVGV4dCwgbG9va3VwRXJyb3JdKTtcblxuICAvLyBDbGVhbnVwIHByb2dyYW1tYXRpYyBzZWxlY3Rpb24gcmVmIGFmdGVyIHRoZSBsaXN0IGxheW91dCB1cGRhdGVzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAyMDApO1xuICAgICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgfVxuICB9LCBbc2VhcmNoVGV4dCwgc2VsZWN0ZWRJZF0pO1xuXG4gIC8vIExvYWQgc2F2ZWQgd29yZHMgZnJvbSB0aGUgZGlyZWN0b3J5XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gaW5pdEFuZExvYWQoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih3b3Jkc0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucmVhZGRpcih3b3Jkc0Rpcik7XG4gICAgICAgIGNvbnN0IGxvYWRlZFdvcmRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICAgICAgaWYgKGZpbGUuZW5kc1dpdGgoXCIubWRcIikpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmROYW1lID0gZmlsZS5zbGljZSgwLCAtMykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShcbiAgICAgICAgICAgICAgcGF0aC5qb2luKHdvcmRzRGlyLCBmaWxlKSxcbiAgICAgICAgICAgICAgXCJ1dGYtOFwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxvYWRlZFdvcmRzW3dvcmROYW1lXSA9IGNvbnRlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNldFdvcmRzKGxvYWRlZFdvcmRzKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdm9jYWJ1bGFyeSBmaWxlc1wiLCBlcnIpO1xuICAgICAgICBzaG93VG9hc3Qoe1xuICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICAgIHRpdGxlOiBcIkZhaWxlZCB0byBsb2FkIHNhdmVkIHZvY2FidWxhcnlcIixcbiAgICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRMb2FkaW5nSGlzdG9yeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5pdEFuZExvYWQoKTtcbiAgfSwgW3dvcmRzRGlyXSk7XG5cbiAgLy8gQ2xlYW4gYW5kIGZpbHRlciBzZWFyY2ggcXVlcnlcbiAgY29uc3QgY2xlYW5TZWFyY2hUZXh0ID0gc2VhcmNoVGV4dC50cmltKCk7XG5cbiAgLy8gRmlsdGVyIGxvY2FsIHdvcmRzIG1hdGNoaW5nIHRoZSBzZWFyY2ggdGV4dFxuICBjb25zdCBmaWx0ZXJlZFdvcmRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcXVlcnkgPSBjbGVhblNlYXJjaFRleHQudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMod29yZHMpLmZpbHRlcigoW3dvcmROYW1lLCBjb250ZW50XSkgPT4ge1xuICAgICAgaWYgKCFxdWVyeSkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB3b3JkTmFtZS5pbmNsdWRlcyhxdWVyeSkgfHxcbiAgICAgICAgZ2V0U3VidGl0bGUoY29udGVudCkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0sIFt3b3JkcywgY2xlYW5TZWFyY2hUZXh0XSk7XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHdlIHNob3VsZCBzaG93IHRoZSBcIlNlYXJjaCBHZW1pbmlcIiBpdGVtXG4gIGNvbnN0IHNob3dMb29rdXBJdGVtID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFjbGVhblNlYXJjaFRleHQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBsb3dlclF1ZXJ5ID0gY2xlYW5TZWFyY2hUZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gRG8gbm90IHNob3cgbG9va3VwIG9wdGlvbiBpZiBpdCBtYXRjaGVzIGEgc2F2ZWQgd29yZCBleGFjdGx5XG4gICAgcmV0dXJuICF3b3Jkc1tsb3dlclF1ZXJ5XTtcbiAgfSwgW3dvcmRzLCBjbGVhblNlYXJjaFRleHRdKTtcblxuICAvLyBIYW5kbGUgR2VtaW5pIEFQSSBsb29rdXBcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTG9va3VwKHdvcmRUb0xvb2t1cDogc3RyaW5nLCBmb3JjZVJlY3JlYXRlID0gZmFsc2UpIHtcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmRUb0xvb2t1cC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWRXb3JkKSByZXR1cm47XG5cbiAgICBpZiAoIWZvcmNlUmVjcmVhdGUgJiYgd29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICBzZXRTZWxlY3RlZElkKG5vcm1hbGl6ZWRXb3JkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogZm9yY2VSZWNyZWF0ZVxuICAgICAgICA/IFwiUmUtZ2VuZXJhdGluZyB3b3JkIGVudHJ5Li4uXCJcbiAgICAgICAgOiBgTG9va2luZyB1cCBcIiR7d29yZFRvTG9va3VwfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIHNldElzU2VhcmNoaW5nKHRydWUpO1xuICAgIHNldExvb2t1cEVycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcGlLZXkgPSBwcmVmZXJlbmNlcy5nZW1pbmlBcGlLZXk7XG4gICAgICBpZiAoIWFwaUtleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJHZW1pbmkgQVBJIGtleSBpcyBub3QgY29uZmlndXJlZCBpbiBleHRlbnNpb24gcHJlZmVyZW5jZXMuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZGVsID0gcHJlZmVyZW5jZXMuZ2VtaW5pTW9kZWwgfHwgXCJnZW1pbmktMy41LWZsYXNoXCI7XG4gICAgICBjb25zdCBwcm9tcHRUZXh0ID0gZ2V0UHJvbXB0Rm9yV29yZCh3b3JkVG9Mb29rdXApO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgICBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy8ke21vZGVsfTpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7YXBpS2V5fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHByb21wdFRleHQsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgKTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgIHRocm93IG5ldyBSYXRlTGltaXRFcnJvcihcIlJhdGUgbGltaXQgcmVhY2hlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEdlbWluaSBBUEkgUmVxdWVzdCBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9XFxuJHtlcnJvclRleHR9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaW50ZXJmYWNlIEdlbWluaVJlc3BvbnNlIHtcbiAgICAgICAgY2FuZGlkYXRlcz86IEFycmF5PHtcbiAgICAgICAgICBjb250ZW50Pzoge1xuICAgICAgICAgICAgcGFydHM/OiBBcnJheTx7XG4gICAgICAgICAgICAgIHRleHQ/OiBzdHJpbmc7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICB9O1xuICAgICAgICB9PjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBHZW1pbmlSZXNwb25zZTtcbiAgICAgIGNvbnN0IHJlc3VsdE1hcmtkb3duID0gZGF0YT8uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xuXG4gICAgICBpZiAoXG4gICAgICAgICFyZXN1bHRNYXJrZG93biB8fFxuICAgICAgICByZXN1bHRNYXJrZG93bi50cmltKCkgPT09IFwiTm8gcmVzcG9uc2UgcmVjZWl2ZWQuXCJcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJObyByZXNwb25zZSBvciBpbnZhbGlkIGZvcm1hdCByZWNlaXZlZCBmcm9tIEdlbWluaSBBUEkuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgd29yZCB0byBsb2NhbCBkYXRhYmFzZVxuICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke25vcm1hbGl6ZWRXb3JkfS5tZGApO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKGZpbGVQYXRoLCByZXN1bHRNYXJrZG93bi50cmltKCkpO1xuXG4gICAgICAvLyBVcGRhdGUgc3RhdGVcbiAgICAgIHNldFdvcmRzKChwcmV2KSA9PiAoe1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICBbbm9ybWFsaXplZFdvcmRdOiByZXN1bHRNYXJrZG93bi50cmltKCksXG4gICAgICB9KSk7XG5cbiAgICAgIC8vIEZvY3VzIHRoZSBuZXdseSBsb29rZWQgdXAvY3JlYXRlZCB3b3JkXG4gICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG5vcm1hbGl6ZWRXb3JkO1xuICAgICAgc2V0U2VsZWN0ZWRJZChub3JtYWxpemVkV29yZCk7XG4gICAgICBzZXRTZWFyY2hUZXh0KFwiXCIpOyAvLyBDbGVhciBzZWFyY2ggdG8gc2hvdyBpbiB0aGUgbGlzdCBvZiBzYXZlZCB3b3Jkc1xuXG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLlN1Y2Nlc3M7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiV29yZCBTYXZlZFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGAke2NhcGl0YWxpemUobm9ybWFsaXplZFdvcmQpfSBhZGRlZCB0byBkYXRhYmFzZWA7XG4gICAgfSBjYXRjaCAoZXJyOiB1bmtub3duKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG5cbiAgICAgIGNvbnN0IGVyck1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgIGNvbnN0IGlzTmV0d29ya0Vycm9yID1cbiAgICAgICAgZXJyTXNnLmluY2x1ZGVzKFwiRU5PVEZPVU5EXCIpIHx8XG4gICAgICAgIGVyck1zZy5pbmNsdWRlcyhcImZldGNoIGZhaWxlZFwiKSB8fFxuICAgICAgICBlcnJNc2cuaW5jbHVkZXMoXCJuZXR3b3JrXCIpIHx8XG4gICAgICAgIChlcnIgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnIubmFtZSA9PT0gXCJUeXBlRXJyb3JcIik7IC8vIHN0YW5kYXJkIGZldGNoIGZhaWx1cmUgb25saW5lL29mZmxpbmUgaXMgYSBUeXBlRXJyb3JcblxuICAgICAgaWYgKGlzTmV0d29ya0Vycm9yKSB7XG4gICAgICAgIHNldExvb2t1cEVycm9yKHtcbiAgICAgICAgICB3b3JkOiB3b3JkVG9Mb29rdXAsXG4gICAgICAgICAgdHlwZTogXCJuZXR3b3JrXCIsXG4gICAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICAgIFwiSW50ZXJuZXQgaXMgbm90IGNvbm5lY3RlZC4gUGxlYXNlIGNoZWNrIHlvdXIgbmV0d29yayBjb25uZWN0aW9uIGFuZCB0cnkgYWdhaW4uXCIsXG4gICAgICAgIH0pO1xuICAgICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICAgIHRvYXN0LnRpdGxlID0gXCJObyBJbnRlcm5ldCBDb25uZWN0aW9uXCI7XG4gICAgICAgIHRvYXN0Lm1lc3NhZ2UgPVxuICAgICAgICAgIFwiSW50ZXJuZXQgaXMgbm90IGNvbm5lY3RlZC4gUGxlYXNlIGNoZWNrIHlvdXIgbmV0d29yayBhbmQgdHJ5IGFnYWluLlwiO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgZXJyIGluc3RhbmNlb2YgUmF0ZUxpbWl0RXJyb3IgfHxcbiAgICAgICAgZXJyTXNnLmluY2x1ZGVzKFwiNDI5XCIpIHx8XG4gICAgICAgIGVyck1zZy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwicmF0ZSBsaW1pdFwiKVxuICAgICAgKSB7XG4gICAgICAgIHNldExvb2t1cEVycm9yKHtcbiAgICAgICAgICB3b3JkOiB3b3JkVG9Mb29rdXAsXG4gICAgICAgICAgdHlwZTogXCJyYXRlLWxpbWl0XCIsXG4gICAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICAgIFwiUmF0ZSBsaW1pdCByZWFjaGVkLiBUaGlzIHJhdGUgbGltaXQgd2lsbCB0YWtlIHNvbWUgdGltZSwgcGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cIixcbiAgICAgICAgfSk7XG4gICAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgICAgdG9hc3QudGl0bGUgPSBcIlJhdGUgTGltaXQgUmVhY2hlZFwiO1xuICAgICAgICB0b2FzdC5tZXNzYWdlID0gXCJSYXRlIGxpbWl0IHJlYWNoZWQuIFRyeSBhZ2FpbiBsYXRlci5cIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldExvb2t1cEVycm9yKHtcbiAgICAgICAgICB3b3JkOiB3b3JkVG9Mb29rdXAsXG4gICAgICAgICAgdHlwZTogXCJvdGhlclwiLFxuICAgICAgICAgIG1lc3NhZ2U6IGVyck1zZyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgICAgdG9hc3QudGl0bGUgPSBcIkxvb2t1cCBGYWlsZWRcIjtcbiAgICAgICAgdG9hc3QubWVzc2FnZSA9IGVyck1zZztcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNTZWFyY2hpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE9wZW4gZmlsZSBpbiBkZWZhdWx0IGFwcGxpY2F0aW9uXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZU9wZW5GaWxlKHdvcmROYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih3b3Jkc0RpciwgYCR7d29yZE5hbWUudG9Mb3dlckNhc2UoKX0ubWRgKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgb3BlbihmaWxlUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiQ291bGQgbm90IG9wZW4gZmlsZVwiLFxuICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldmVhbCBmaWxlIGluIGZpbmRlclxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVSZXZlYWxJbkZpbmRlcih3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke3dvcmROYW1lLnRvTG93ZXJDYXNlKCl9Lm1kYCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNob3dJbkZpbmRlcihmaWxlUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiQ291bGQgbm90IHJldmVhbCBmaWxlXCIsXG4gICAgICAgIG1lc3NhZ2U6IFN0cmluZyhlcnIpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGVsZXRlIHdvcmQgZmlsZSBhbmQgZW50cnlcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlRGVsZXRlKHdvcmROYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih3b3Jkc0RpciwgYCR7d29yZE5hbWUudG9Mb3dlckNhc2UoKX0ubWRgKTtcbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogYERlbGV0aW5nIFwiJHtjYXBpdGFsaXplKHdvcmROYW1lKX1cIi4uLmAsXG4gICAgfSk7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMudW5saW5rKGZpbGVQYXRoKTtcbiAgICAgIHNldFdvcmRzKChwcmV2KSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHQgPSB7IC4uLnByZXYgfTtcbiAgICAgICAgZGVsZXRlIG5leHRbd29yZE5hbWVdO1xuICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgIH0pO1xuICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5TdWNjZXNzO1xuICAgICAgdG9hc3QudGl0bGUgPSBcIldvcmQgRGVsZXRlZFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGBSZW1vdmVkICR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9IGZyb20gZGF0YWJhc2VgO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5GYWlsdXJlO1xuICAgICAgdG9hc3QudGl0bGUgPSBcIkRlbGV0ZSBGYWlsZWRcIjtcbiAgICAgIHRvYXN0Lm1lc3NhZ2UgPSBTdHJpbmcoZXJyKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxMaXN0XG4gICAgICBpc1Nob3dpbmdEZXRhaWw9e09iamVjdC5rZXlzKHdvcmRzKS5sZW5ndGggPiAwIHx8IHNob3dMb29rdXBJdGVtfVxuICAgICAgc2VhcmNoQmFyUGxhY2Vob2xkZXI9XCJTZWFyY2ggc2F2ZWQgd29yZHMgb3IgbG9vayB1cCBuZXcgb25lcy4uLlwiXG4gICAgICBvblNlYXJjaFRleHRDaGFuZ2U9e3NldFNlYXJjaFRleHR9XG4gICAgICBzZWFyY2hUZXh0PXtzZWFyY2hUZXh0fVxuICAgICAgaXNMb2FkaW5nPXtsb2FkaW5nSGlzdG9yeSB8fCBpc1NlYXJjaGluZ31cbiAgICAgIHNlbGVjdGVkSXRlbUlkPXtzZWxlY3RlZElkfVxuICAgICAgb25TZWxlY3Rpb25DaGFuZ2U9eyhpZCkgPT4ge1xuICAgICAgICBpZiAocHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoaWQgPT09IHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZXRTZWxlY3RlZElkKGlkIHx8IHVuZGVmaW5lZCk7XG4gICAgICB9fVxuICAgID5cbiAgICAgIHtzaG93TG9va3VwSXRlbSAmJiAoXG4gICAgICAgIDxMaXN0LlNlY3Rpb24gdGl0bGU9XCJBSSBMb29rdXBcIj5cbiAgICAgICAgICB7bG9va3VwRXJyb3IgJiZcbiAgICAgICAgICBsb29rdXBFcnJvci53b3JkLnRvTG93ZXJDYXNlKCkgPT09IGNsZWFuU2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpID8gKFxuICAgICAgICAgICAgPExpc3QuSXRlbVxuICAgICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtLWVycm9yXCJcbiAgICAgICAgICAgICAgdGl0bGU9e2BMb29rdXAgRmFpbGVkIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgICAgc3VidGl0bGU9e1xuICAgICAgICAgICAgICAgIGxvb2t1cEVycm9yLnR5cGUgPT09IFwicmF0ZS1saW1pdFwiXG4gICAgICAgICAgICAgICAgICA/IFwiUmF0ZSBMaW1pdCBSZWFjaGVkXCJcbiAgICAgICAgICAgICAgICAgIDogbG9va3VwRXJyb3IudHlwZSA9PT0gXCJuZXR3b3JrXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcIk5vIEludGVybmV0XCJcbiAgICAgICAgICAgICAgICAgICAgOiBcIkVycm9yXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpY29uPXt7IHNvdXJjZTogSWNvbi5FeGNsYW1hdGlvbk1hcmssIGNvbG9yOiBDb2xvci5SZWQgfX1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJldHJ5IExvb2t1cFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uUmVwZWF0fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlTG9va3VwKGNsZWFuU2VhcmNoVGV4dCl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAge2xvb2t1cEVycm9yLnR5cGUgPT09IFwicmF0ZS1saW1pdFwiICYmIChcbiAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiU2VhcmNoIG9uIEdvb2dsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkdsb2JlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsPXtgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChjbGVhblNlYXJjaFRleHQgKyBcIiBtZWFuaW5nXCIpfWB9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBDaGF0R1BUXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uTWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybD17YGh0dHBzOi8vY2hhdGdwdC5jb20vP3E9JHtlbmNvZGVVUklDb21wb25lbnQoZ2V0UHJvbXB0Rm9yV29yZChjbGVhblNlYXJjaFRleHQpKX1gfVxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDb3B5IFByb21wdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNvcHlDbGlwYm9hcmR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDbGlwYm9hcmQuY29weShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRQcm9tcHRGb3JXb3JkKGNsZWFuU2VhcmNoVGV4dCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiUHJvbXB0IENvcGllZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkRlc2lnbmF0ZWQgQ2hhdEdQVCBwcm9tcHQgY29waWVkIHRvIGNsaXBib2FyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGV0YWlsPXtcbiAgICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbFxuICAgICAgICAgICAgICAgICAgbWFya2Rvd249e2AjIExvb2t1cCBGYWlsZWQgZm9yIFwiJHtjbGVhblNlYXJjaFRleHR9XCJcXG5cXG4ke1xuICAgICAgICAgICAgICAgICAgICBsb29rdXBFcnJvci50eXBlID09PSBcInJhdGUtbGltaXRcIlxuICAgICAgICAgICAgICAgICAgICAgID8gYFx1MjZBMFx1RkUwRiAqKlJhdGUgbGltaXQgcmVhY2hlZC4qKiBUaGlzIHJhdGUgbGltaXQgd2lsbCB0YWtlIHNvbWUgdGltZSwgcGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cXG5cXG4jIyMgQWx0ZXJuYXRpdmVzOlxcbjEuICoqR29vZ2xlIFNlYXJjaCoqOiBTZWFyY2ggZm9yIHRoaXMgd29yZCBkaXJlY3RseSBvbiBHb29nbGUuXFxuMi4gKipPcGVuIENoYXRHUFQqKjogT3BlbiBDaGF0R1BUIHdpdGggdGhlIGRlc2lnbmF0ZWQgcHJvbXB0IGFscmVhZHkgZW1iZWRkZWQuXFxuMy4gKipDb3B5IFByb21wdCoqOiBDb3B5IHRoZSBwcm9tcHQgdG8gY2xpcGJvYXJkIHRvIG1hbnVhbGx5IHBhc3RlIGl0IGluIGFueSBBSS5gXG4gICAgICAgICAgICAgICAgICAgICAgOiBsb29rdXBFcnJvci50eXBlID09PSBcIm5ldHdvcmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPyBgXHVEODNEXHVEQ0UxICoqSW50ZXJuZXQgaXMgbm90IGNvbm5lY3RlZC4qKiBQbGVhc2UgY2hlY2sgeW91ciBuZXR3b3JrIGNvbm5lY3Rpb24gYW5kIHRyeSBhZ2Fpbi5gXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGBcdTI3NEMgKipFcnJvcioqOiAke2xvb2t1cEVycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPExpc3QuSXRlbVxuICAgICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtXCJcbiAgICAgICAgICAgICAgdGl0bGU9e2BTZWFyY2ggR2VtaW5pIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgICAgaWNvbj17SWNvbi5HbG9iZX1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxvb2t1cCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5NYWduaWZ5aW5nR2xhc3N9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVMb29rdXAoY2xlYW5TZWFyY2hUZXh0KX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZXRhaWw9e1xuICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsXG4gICAgICAgICAgICAgICAgICBtYXJrZG93bj17YCMgU2VhcmNoIEdlbWluaSBmb3IgXCIke2NsZWFuU2VhcmNoVGV4dH1cIlxcblxcblByZXNzICoqRW50ZXIqKiB0byBsb29rIHVwIHRoaXMgd29yZC4gSXQgd2lsbCBnZW5lcmF0ZSBhIHN0cnVjdHVyZWQgZW50cnkgd2l0aCBkZWZpbml0aW9uLCBIaW5kaSB0cmFuc2xhdGlvbi9wcm9udW5jaWF0aW9uLCBleGFtcGxlcywgc3lub255bXMvYW50b255bXMsIGFuZCB3b3JkIG9yaWdpbiwgdGhlbiBzYXZlIGl0IHRvIHlvdXIgbG9jYWwgZGlyZWN0b3J5LmB9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApfVxuICAgICAgICA8L0xpc3QuU2VjdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHtmaWx0ZXJlZFdvcmRzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgIDxMaXN0LlNlY3Rpb24gdGl0bGU9XCJTYXZlZCBWb2NhYnVsYXJ5XCI+XG4gICAgICAgICAge2ZpbHRlcmVkV29yZHMubWFwKChbd29yZE5hbWUsIGNvbnRlbnRdKSA9PiAoXG4gICAgICAgICAgICA8TGlzdC5JdGVtXG4gICAgICAgICAgICAgIGtleT17d29yZE5hbWV9XG4gICAgICAgICAgICAgIGlkPXt3b3JkTmFtZX1cbiAgICAgICAgICAgICAgdGl0bGU9e2NhcGl0YWxpemUod29yZE5hbWUpfVxuICAgICAgICAgICAgICBzdWJ0aXRsZT17Z2V0U3VidGl0bGUoY29udGVudCl9XG4gICAgICAgICAgICAgIGFjY2Vzc29yaWVzPXtbXG4gICAgICAgICAgICAgICAgeyB0YWc6IHsgdmFsdWU6IGdldFBhcnRPZlNwZWVjaChjb250ZW50KSwgY29sb3I6IENvbG9yLkJsdWUgfSB9LFxuICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICBkZXRhaWw9ezxMaXN0Lkl0ZW0uRGV0YWlsIG1hcmtkb3duPXtjb250ZW50fSAvPn1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNvcHkgTWFya2Rvd25cIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNvcHlDbGlwYm9hcmR9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2xpcGJvYXJkLmNvcHkoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5TdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQ29waWVkIHRvIENsaXBib2FyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYCR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9IG1hcmtkb3duIGNvcGllZGAsXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIk9wZW4gRmlsZVwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uRG9jdW1lbnR9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVPcGVuRmlsZSh3b3JkTmFtZSl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJldmVhbCBpbiBGaW5kZXJcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkZpbmRlcn1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZVJldmVhbEluRmluZGVyKHdvcmROYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUmVmcmVzaCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5SZXBlYXR9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCJdLCBrZXk6IFwiclwiIH19XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVMb29rdXAod29yZE5hbWUsIHRydWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgV29yZFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uVHJhc2h9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXtBY3Rpb24uU3R5bGUuRGVzdHJ1Y3RpdmV9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY3RybFwiXSwga2V5OiBcInhcIiB9fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlRGVsZXRlKHdvcmROYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9MaXN0LlNlY3Rpb24+XG4gICAgICApIDogKFxuICAgICAgICAhc2hvd0xvb2t1cEl0ZW0gJiZcbiAgICAgICAgIWxvYWRpbmdIaXN0b3J5ICYmIChcbiAgICAgICAgICA8TGlzdC5FbXB0eVZpZXdcbiAgICAgICAgICAgIHRpdGxlPVwiWW91ciB2b2NhYnVsYXJ5IGlzIGVtcHR5XCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiVHlwZSBhIHdvcmQgaW4gdGhlIHNlYXJjaCBiYXIgYW5kIHByZXNzIEVudGVyIHRvIHF1ZXJ5IEdlbWluaSBBSS5cIlxuICAgICAgICAgICAgaWNvbj17SWNvbi5Cb29rfVxuICAgICAgICAgIC8+XG4gICAgICAgIClcbiAgICAgICl9XG4gICAgPC9MaXN0PlxuICApO1xufVxuIiwgImV4cG9ydCBjb25zdCBQUk9NUFQgPSBgXG5Zb3UgYXJlIGEgdm9jYWJ1bGFyeSBhc3Npc3RhbnQuXG5cbldvcmQ6IHt3b3JkfVxuXG5PdXRwdXQgU1RSSUNUIE1hcmtkb3duLlxuXG5SdWxlczpcbi0gVXNlIG9ubHkgTWFya2Rvd25cbi0gTm8gSFRNTFxuLSBObyBlbW9qaXNcbi0gTm8gdGFibGVzXG4tIFVzZSBcIi1cIiBidWxsZXRzIG9ubHlcbi0gS2VlcCBzcGFjaW5nIGNsZWFuXG4tIEtlZXAgY29uY2lzZVxuLSBObyBjb2RlIGJsb2Nrc1xuLSBEbyBub3Qgd3JhcCByZXNwb25zZSBpbiBtYXJrZG93biBmZW5jZXNcbi0gTWF4aW11bSBjbGFyaXR5LCBtaW5pbXVtIHdvcmRzXG5cbkZvcm1hdDpcblxuIyBXb3JkIChIaW5kaSBQcm9udW5jaWF0aW9uKVxuKipOb3VuOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGEgbm91bilcbioqVmVyYjoqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhIHZlcmIpXG4qKkFkamVjdGl2ZToqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhbiBhZGplY3RpdmUpXG4qKkFkdmVyYjoqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhbiBhZHZlcmIpXG4oanVzdCBsaWtlIHRoYXQgYWxsIG90aGVyIHR5cGVzIG9mIHBhcnQgb2Ygc3BlZWNoZXMsIGFib3ZlIDQgYXJlIGp1c3QgZXhhbXBsZXMpIChhbmQgd2hlbiBtdWx0aXBsZSBwYXJ0IG9mIHNwZWVjaGVzIGV4aXN0cywgdGhlbiBicmVhayBsaW5lcyBmb3IgZWFjaCBwYXJ0IG9mIHNwZWVjaClcblxuIyMgSGluZGkgRXF1aXZhbGVudFxubWVhbmluZzEsIG1lYW5pbmcyLCBtZWFuaW5nM1xuXG4jIyBXaGVuIHRvIHVzZVxuLSBwb2ludFxuLSBwb2ludFxuLSBwb2ludFxuXG4jIyBFeGFtcGxlc1xuLSBzZW50ZW5jZVxuLSBIaW5kaSB0cmFuc2xhdGlvblxuLSBzZW50ZW5jZVxuLSBIaW5kaSB0cmFuc2xhdGlvblxuXG4jIyBTeW5vbnltc1xudzEsIHcyLCB3MywgdzRcblxuIyMgQW50b255bXNcbncxLCB3MiwgdzMsIHc0XG5cbkNvbmRpdGlvbmFsOlxuSW5jbHVkZSBvbmx5IHdoZW4gbWVhbmluZ2Z1bC5cblxuIyMgV29yZCBCcmVha2Rvd25cbi0gcGFydCBcdTIxOTIgbWVhbmluZ1xuXG4jIyBGb3JtYXRpb24gRmxvd1xuLSBzdGVwIFx1MjE5MiBtZWFuaW5nXG5cbiMjIEV0eW1vbG9neVxuYnJpZWYgb3JpZ2luXG5cbkNvbnN0cmFpbnRzOlxuLSBObyBleHRyYSB0ZXh0XG4tIE5vIGV4cGxhbmF0aW9uc1xuLSBObyBkZXZpYXRpb25zXG4tIE91dHB1dCBvbmx5IHRoZSBmb3JtYXR0ZWQgZW50cnlcbmA7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBWU87QUFDUCxtQkFBcUQ7QUFDckQsc0JBQWU7QUFDZixnQkFBZTs7O0FDZlIsSUFBTSxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FEaUJ0QixrQkFBaUI7QUFpWkM7QUF4WWxCLFNBQVMsWUFBWSxvQkFBb0M7QUFDdkQsUUFBTSxXQUFXLHNCQUFzQjtBQUN2QyxNQUFJLFNBQVMsV0FBVyxJQUFJLEdBQUc7QUFDN0IsV0FBTyxZQUFBQSxRQUFLLEtBQUssVUFBQUMsUUFBRyxRQUFRLEdBQUcsU0FBUyxNQUFNLENBQUMsQ0FBQztBQUFBLEVBQ2xEO0FBQ0EsU0FBTyxZQUFBRCxRQUFLLFFBQVEsUUFBUTtB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RUFBRSxPQUFPLGdCQUFnQixPQUFPLEdBQUcsT0FBTyxpQkFBTSxLQUFLLEVBQUU7QUFBQSxZQUNoRTtBQUFBLFlBQ0EsUUFBUSw0Q0FBQyxnQkFBSyxLQUFLLFFBQVYsRUFBaUIsVUFBVSxTQUFTO0FBQUEsWUFDN0MsU0FDRSw2Q0FBQywwQkFDQztBQUFBO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU07QUFBQSxrQkFDTixNQUFNLGdCQUFLO0FBQUEsa0JBQ1gsVUFBVSxZQUFZO0FBQ3BCLDBCQUFNLHFCQUFVLEtBQUssT0FBTztBQUM1Qiw4QkFBTSxzQkFBVTtBQUFBLHNCQUNkLE9BQU8saUJBQU0sTUFBTTtBQUFBLHNCQUNuQixPQUFPO0FBQUEsc0JBQ1AsU0FBUyxHQUFHLFdBQVcsUUFBUSxDQUFDO0FBQUEsb0JBQ2xDLENBQUM7QUFBQSxrQkFDSDtBQUFBO0FBQUEsY0FDRjtBQUFBLGNBQ0E7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsT0FBTTtBQUFBLGtCQUNOLE1BQU0sZ0JBQUs7QUFBQSxrQkFDWCxVQUFVLE1BQU0sZUFBZSxRQUFRO0FBQUE7QUFBQSxjQUN6QztBQUFBLGNBQ0E7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsT0FBTTtBQUFBLGtCQUNOLE1BQU0sZ0JBQUs7QUFBQSxrQkFDWCxVQUFVLE1BQU0scUJBQXFCLFFBQVE7QUFBQTtBQUFBLGNBQy9DO0FBQUEsY0FDQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFNO0FBQUEsa0JBQ04sTUFBTSxnQkFBSztBQUFBLGtCQUNYLFVBQVUsRUFBRSxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSTtBQUFBLGtCQUN6QyxVQUFVLE1BQU0sYUFBYSxVQUFVLElBQUk7QUFBQTtBQUFBLGNBQzdDO0FBQUEsY0FDQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFNO0FBQUEsa0JBQ04sTUFBTSxnQkFBSztBQUFBLGtCQUNYLE9BQU8sa0JBQU8sTUFBTTtBQUFBLGtCQUNwQixVQUFVLEVBQUUsV0FBVyxDQUFDLE1BQU0sR0FBRyxLQUFLLElBQUk7QUFBQSxrQkFDMUMsVUFBVSxNQUFNLGFBQWEsUUFBUTtBQUFBO0FBQUEsY0FDdkM7QUFBQSxlQUNGO0FBQUE7QUFBQSxVQTdDRztBQUFBLFFBK0NQLENBQ0QsR0FDSCxJQUVBLENBQUMsa0JBQ0QsQ0FBQyxrQkFDQztBQUFBLFVBQUMsZ0JBQUs7QUFBQSxVQUFMO0FBQUEsWUFDQyxPQUFNO0FBQUEsWUFDTixhQUFZO0FBQUEsWUFDWixNQUFNLGdCQUFLO0FBQUE7QUFBQSxRQUNiO0FBQUE7QUFBQTtBQUFBLEVBR047QUFFSjsiLAogICJuYW1lcyI6IFsicGF0aCIsICJvcyIsICJmcyJdCn0K
