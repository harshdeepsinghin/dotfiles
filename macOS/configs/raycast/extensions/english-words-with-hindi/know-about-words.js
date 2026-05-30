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
    try {
      const apiKey = preferences.geminiApiKey;
      if (!apiKey) {
        throw new Error(
          "Gemini API key is not configured in extension preferences."
        );
      }
      const model = preferences.geminiModel || "gemini-3.5-flash";
      const promptText = PROMPT.replace("{word}", wordToLookup);
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
      toast.style = import_api.Toast.Style.Failure;
      toast.title = "Lookup Failed";
      toast.message = err instanceof Error ? err.message : String(err);
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
        showLookupItem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List.Section, { title: "AI Lookup", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9rbm93LWFib3V0LXdvcmRzLnRzeCIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3Byb21wdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBBY3Rpb25QYW5lbCxcbiAgTGlzdCxcbiAgc2hvd1RvYXN0LFxuICBUb2FzdCxcbiAgZ2V0UHJlZmVyZW5jZVZhbHVlcyxcbiAgb3BlbixcbiAgc2hvd0luRmluZGVyLFxuICBJY29uLFxuICBDb2xvcixcbiAgQ2xpcGJvYXJkLFxufSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCB7IFBST01QVCB9IGZyb20gXCIuL3Byb21wdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gRGVmaW5lIHRoZSBwcmVmZXJlbmNlcyBpbnRlcmZhY2UgbWF0Y2hpbmcgcGFja2FnZS5qc29uXG5pbnRlcmZhY2UgUHJlZmVyZW5jZXMge1xuICBnZW1pbmlBcGlLZXk6IHN0cmluZztcbiAgd29yZHNEaXJlY3Rvcnk6IHN0cmluZztcbiAgZ2VtaW5pTW9kZWw6IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0V29yZHNEaXIod29yZHNEaXJlY3RvcnlQcmVmOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXNvbHZlZCA9IHdvcmRzRGlyZWN0b3J5UHJlZiB8fCBcIn4vd29yZHNcIjtcbiAgaWYgKHJlc29sdmVkLnN0YXJ0c1dpdGgoXCJ+L1wiKSkge1xuICAgIHJldHVybiBwYXRoLmpvaW4ob3MuaG9tZWRpcigpLCByZXNvbHZlZC5zbGljZSgyKSk7XG4gIH1cbiAgcmV0dXJuIHBhdGgucmVzb2x2ZShyZXNvbHZlZCk7XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFzKSByZXR1cm4gXCJcIjtcbiAgcmV0dXJuIHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpO1xufVxuXG5mdW5jdGlvbiBnZXRTdWJ0aXRsZShtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgaGluZGlFcXVpdmFsZW50SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGwpID0+XG4gICAgbC5pbmNsdWRlcyhcIiMjIEhpbmRpIEVxdWl2YWxlbnRcIiksXG4gICk7XG4gIGlmIChoaW5kaUVxdWl2YWxlbnRJbmRleCAhPT0gLTEgJiYgbGluZXNbaGluZGlFcXVpdmFsZW50SW5kZXggKyAxXSkge1xuICAgIGNvbnN0IG1lYW5pbmdMaW5lID0gbGluZXNbaGluZGlFcXVpdmFsZW50SW5kZXggKyAxXS50cmltKCk7XG4gICAgaWYgKG1lYW5pbmdMaW5lKSByZXR1cm4gbWVhbmluZ0xpbmU7XG4gIH1cblxuICAvLyBGYWxsYmFjazogc2VhcmNoIGZvciBIaW5kaSBwcm9udW5jaWF0aW9uIGluIHRoZSB0aXRsZVxuICBjb25zdCB0aXRsZU1hdGNoID0gbWFya2Rvd24ubWF0Y2goL14jXFxzK1teKF0rXFwoKFteKV0rKVxcKS9tKTtcbiAgaWYgKHRpdGxlTWF0Y2ggJiYgdGl0bGVNYXRjaFsxXSkge1xuICAgIHJldHVybiB0aXRsZU1hdGNoWzFdO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJ0T2ZTcGVlY2gobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBib2xkTWF0Y2ggPSBsaW5lLm1hdGNoKFxuICAgICAgL15cXCpcXCooTm91bnxWZXJifEFkamVjdGl2ZXxBZHZlcmJ8UHJlcG9zaXRpb258Q29uanVuY3Rpb258UHJvbm91bnxJbnRlcmplY3Rpb24pOlxcKlxcKi9pLFxuICAgICk7XG4gICAgaWYgKGJvbGRNYXRjaCkge1xuICAgICAgcGFydHMucHVzaChjYXBpdGFsaXplKGJvbGRNYXRjaFsxXS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgfVxuICB9XG4gIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIG9sZGVyIGhlYWRlciBmb3JtYXRcbiAgY29uc3QgbWF0Y2ggPSBtYXJrZG93bi5tYXRjaChcbiAgICAvXiMjXFxzKyhOb3VufFZlcmJ8QWRqZWN0aXZlfEFkdmVyYnxQcmVwb3NpdGlvbnxDb25qdW5jdGlvbnxQcm9ub3VufEludGVyamVjdGlvbikvaW0sXG4gICk7XG4gIHJldHVybiBtYXRjaCA/IGNhcGl0YWxpemUobWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkgOiBcIlwiO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDb21tYW5kKCkge1xuICBjb25zdCBwcmVmZXJlbmNlcyA9IGdldFByZWZlcmVuY2VWYWx1ZXM8UHJlZmVyZW5jZXM+KCk7XG4gIGNvbnN0IHdvcmRzRGlyID0gdXNlTWVtbyhcbiAgICAoKSA9PiBnZXRXb3Jkc0RpcihwcmVmZXJlbmNlcy53b3Jkc0RpcmVjdG9yeSksXG4gICAgW3ByZWZlcmVuY2VzLndvcmRzRGlyZWN0b3J5XSxcbiAgKTtcblxuICBjb25zdCBbd29yZHMsIHNldFdvcmRzXSA9IHVzZVN0YXRlPFJlY29yZDxzdHJpbmcsIHN0cmluZz4+KHt9KTtcbiAgY29uc3QgW2xvYWRpbmdIaXN0b3J5LCBzZXRMb2FkaW5nSGlzdG9yeV0gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW2lzU2VhcmNoaW5nLCBzZXRJc1NlYXJjaGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzZWFyY2hUZXh0LCBzZXRTZWFyY2hUZXh0XSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbc2VsZWN0ZWRJZCwgc2V0U2VsZWN0ZWRJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCB1bmRlZmluZWQ+KHVuZGVmaW5lZCk7XG4gIGNvbnN0IHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZiA9IHVzZVJlZjxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICAvLyBDbGVhbnVwIHByb2dyYW1tYXRpYyBzZWxlY3Rpb24gcmVmIGFmdGVyIHRoZSBsaXN0IGxheW91dCB1cGRhdGVzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAyMDApO1xuICAgICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgfVxuICB9LCBbc2VhcmNoVGV4dCwgc2VsZWN0ZWRJZF0pO1xuXG4gIC8vIExvYWQgc2F2ZWQgd29yZHMgZnJvbSB0aGUgZGlyZWN0b3J5XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gaW5pdEFuZExvYWQoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5ta2Rpcih3b3Jkc0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucmVhZGRpcih3b3Jkc0Rpcik7XG4gICAgICAgIGNvbnN0IGxvYWRlZFdvcmRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICAgICAgaWYgKGZpbGUuZW5kc1dpdGgoXCIubWRcIikpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmROYW1lID0gZmlsZS5zbGljZSgwLCAtMykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShcbiAgICAgICAgICAgICAgcGF0aC5qb2luKHdvcmRzRGlyLCBmaWxlKSxcbiAgICAgICAgICAgICAgXCJ1dGYtOFwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxvYWRlZFdvcmRzW3dvcmROYW1lXSA9IGNvbnRlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNldFdvcmRzKGxvYWRlZFdvcmRzKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdm9jYWJ1bGFyeSBmaWxlc1wiLCBlcnIpO1xuICAgICAgICBzaG93VG9hc3Qoe1xuICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICAgIHRpdGxlOiBcIkZhaWxlZCB0byBsb2FkIHNhdmVkIHZvY2FidWxhcnlcIixcbiAgICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRMb2FkaW5nSGlzdG9yeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5pdEFuZExvYWQoKTtcbiAgfSwgW3dvcmRzRGlyXSk7XG5cbiAgLy8gQ2xlYW4gYW5kIGZpbHRlciBzZWFyY2ggcXVlcnlcbiAgY29uc3QgY2xlYW5TZWFyY2hUZXh0ID0gc2VhcmNoVGV4dC50cmltKCk7XG5cbiAgLy8gRmlsdGVyIGxvY2FsIHdvcmRzIG1hdGNoaW5nIHRoZSBzZWFyY2ggdGV4dFxuICBjb25zdCBmaWx0ZXJlZFdvcmRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcXVlcnkgPSBjbGVhblNlYXJjaFRleHQudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMod29yZHMpLmZpbHRlcigoW3dvcmROYW1lLCBjb250ZW50XSkgPT4ge1xuICAgICAgaWYgKCFxdWVyeSkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB3b3JkTmFtZS5pbmNsdWRlcyhxdWVyeSkgfHxcbiAgICAgICAgZ2V0U3VidGl0bGUoY29udGVudCkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0sIFt3b3JkcywgY2xlYW5TZWFyY2hUZXh0XSk7XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHdlIHNob3VsZCBzaG93IHRoZSBcIlNlYXJjaCBHZW1pbmlcIiBpdGVtXG4gIGNvbnN0IHNob3dMb29rdXBJdGVtID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFjbGVhblNlYXJjaFRleHQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBsb3dlclF1ZXJ5ID0gY2xlYW5TZWFyY2hUZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gRG8gbm90IHNob3cgbG9va3VwIG9wdGlvbiBpZiBpdCBtYXRjaGVzIGEgc2F2ZWQgd29yZCBleGFjdGx5XG4gICAgcmV0dXJuICF3b3Jkc1tsb3dlclF1ZXJ5XTtcbiAgfSwgW3dvcmRzLCBjbGVhblNlYXJjaFRleHRdKTtcblxuICAvLyBIYW5kbGUgR2VtaW5pIEFQSSBsb29rdXBcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTG9va3VwKHdvcmRUb0xvb2t1cDogc3RyaW5nLCBmb3JjZVJlY3JlYXRlID0gZmFsc2UpIHtcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmRUb0xvb2t1cC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWRXb3JkKSByZXR1cm47XG5cbiAgICBpZiAoIWZvcmNlUmVjcmVhdGUgJiYgd29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICBzZXRTZWxlY3RlZElkKG5vcm1hbGl6ZWRXb3JkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogZm9yY2VSZWNyZWF0ZVxuICAgICAgICA/IFwiUmUtZ2VuZXJhdGluZyB3b3JkIGVudHJ5Li4uXCJcbiAgICAgICAgOiBgTG9va2luZyB1cCBcIiR7d29yZFRvTG9va3VwfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIHNldElzU2VhcmNoaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcGlLZXkgPSBwcmVmZXJlbmNlcy5nZW1pbmlBcGlLZXk7XG4gICAgICBpZiAoIWFwaUtleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJHZW1pbmkgQVBJIGtleSBpcyBub3QgY29uZmlndXJlZCBpbiBleHRlbnNpb24gcHJlZmVyZW5jZXMuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZGVsID0gcHJlZmVyZW5jZXMuZ2VtaW5pTW9kZWwgfHwgXCJnZW1pbmktMy41LWZsYXNoXCI7XG4gICAgICBjb25zdCBwcm9tcHRUZXh0ID0gUFJPTVBULnJlcGxhY2UoXCJ7d29yZH1cIiwgd29yZFRvTG9va3VwKTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcbiAgICAgICAgYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvJHttb2RlbH06Z2VuZXJhdGVDb250ZW50P2tleT0ke2FwaUtleX1gLFxuICAgICAgICB7XG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJ0czogW1xuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBwcm9tcHRUZXh0LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICk7XG5cbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEdlbWluaSBBUEkgUmVxdWVzdCBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9XFxuJHtlcnJvclRleHR9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaW50ZXJmYWNlIEdlbWluaVJlc3BvbnNlIHtcbiAgICAgICAgY2FuZGlkYXRlcz86IEFycmF5PHtcbiAgICAgICAgICBjb250ZW50Pzoge1xuICAgICAgICAgICAgcGFydHM/OiBBcnJheTx7XG4gICAgICAgICAgICAgIHRleHQ/OiBzdHJpbmc7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICB9O1xuICAgICAgICB9PjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBHZW1pbmlSZXNwb25zZTtcbiAgICAgIGNvbnN0IHJlc3VsdE1hcmtkb3duID0gZGF0YT8uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xuXG4gICAgICBpZiAoXG4gICAgICAgICFyZXN1bHRNYXJrZG93biB8fFxuICAgICAgICByZXN1bHRNYXJrZG93bi50cmltKCkgPT09IFwiTm8gcmVzcG9uc2UgcmVjZWl2ZWQuXCJcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJObyByZXNwb25zZSBvciBpbnZhbGlkIGZvcm1hdCByZWNlaXZlZCBmcm9tIEdlbWluaSBBUEkuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgd29yZCB0byBsb2NhbCBkYXRhYmFzZVxuICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke25vcm1hbGl6ZWRXb3JkfS5tZGApO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKGZpbGVQYXRoLCByZXN1bHRNYXJrZG93bi50cmltKCkpO1xuXG4gICAgICAvLyBVcGRhdGUgc3RhdGVcbiAgICAgIHNldFdvcmRzKChwcmV2KSA9PiAoe1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICBbbm9ybWFsaXplZFdvcmRdOiByZXN1bHRNYXJrZG93bi50cmltKCksXG4gICAgICB9KSk7XG5cbiAgICAgIC8vIEZvY3VzIHRoZSBuZXdseSBsb29rZWQgdXAvY3JlYXRlZCB3b3JkXG4gICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG5vcm1hbGl6ZWRXb3JkO1xuICAgICAgc2V0U2VsZWN0ZWRJZChub3JtYWxpemVkV29yZCk7XG4gICAgICBzZXRTZWFyY2hUZXh0KFwiXCIpOyAvLyBDbGVhciBzZWFyY2ggdG8gc2hvdyBpbiB0aGUgbGlzdCBvZiBzYXZlZCB3b3Jkc1xuXG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLlN1Y2Nlc3M7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiV29yZCBTYXZlZFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGAke2NhcGl0YWxpemUobm9ybWFsaXplZFdvcmQpfSBhZGRlZCB0byBkYXRhYmFzZWA7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiTG9va3VwIEZhaWxlZFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNTZWFyY2hpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE9wZW4gZmlsZSBpbiBkZWZhdWx0IGFwcGxpY2F0aW9uXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZU9wZW5GaWxlKHdvcmROYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih3b3Jkc0RpciwgYCR7d29yZE5hbWUudG9Mb3dlckNhc2UoKX0ubWRgKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgb3BlbihmaWxlUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiQ291bGQgbm90IG9wZW4gZmlsZVwiLFxuICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldmVhbCBmaWxlIGluIGZpbmRlclxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVSZXZlYWxJbkZpbmRlcih3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke3dvcmROYW1lLnRvTG93ZXJDYXNlKCl9Lm1kYCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNob3dJbkZpbmRlcihmaWxlUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiQ291bGQgbm90IHJldmVhbCBmaWxlXCIsXG4gICAgICAgIG1lc3NhZ2U6IFN0cmluZyhlcnIpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGVsZXRlIHdvcmQgZmlsZSBhbmQgZW50cnlcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlRGVsZXRlKHdvcmROYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih3b3Jkc0RpciwgYCR7d29yZE5hbWUudG9Mb3dlckNhc2UoKX0ubWRgKTtcbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogYERlbGV0aW5nIFwiJHtjYXBpdGFsaXplKHdvcmROYW1lKX1cIi4uLmAsXG4gICAgfSk7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMudW5saW5rKGZpbGVQYXRoKTtcbiAgICAgIHNldFdvcmRzKChwcmV2KSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHQgPSB7IC4uLnByZXYgfTtcbiAgICAgICAgZGVsZXRlIG5leHRbd29yZE5hbWVdO1xuICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgIH0pO1xuICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5TdWNjZXNzO1xuICAgICAgdG9hc3QudGl0bGUgPSBcIldvcmQgRGVsZXRlZFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGBSZW1vdmVkICR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9IGZyb20gZGF0YWJhc2VgO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5GYWlsdXJlO1xuICAgICAgdG9hc3QudGl0bGUgPSBcIkRlbGV0ZSBGYWlsZWRcIjtcbiAgICAgIHRvYXN0Lm1lc3NhZ2UgPSBTdHJpbmcoZXJyKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxMaXN0XG4gICAgICBpc1Nob3dpbmdEZXRhaWw9e09iamVjdC5rZXlzKHdvcmRzKS5sZW5ndGggPiAwIHx8IHNob3dMb29rdXBJdGVtfVxuICAgICAgc2VhcmNoQmFyUGxhY2Vob2xkZXI9XCJTZWFyY2ggc2F2ZWQgd29yZHMgb3IgbG9vayB1cCBuZXcgb25lcy4uLlwiXG4gICAgICBvblNlYXJjaFRleHRDaGFuZ2U9e3NldFNlYXJjaFRleHR9XG4gICAgICBzZWFyY2hUZXh0PXtzZWFyY2hUZXh0fVxuICAgICAgaXNMb2FkaW5nPXtsb2FkaW5nSGlzdG9yeSB8fCBpc1NlYXJjaGluZ31cbiAgICAgIHNlbGVjdGVkSXRlbUlkPXtzZWxlY3RlZElkfVxuICAgICAgb25TZWxlY3Rpb25DaGFuZ2U9eyhpZCkgPT4ge1xuICAgICAgICBpZiAocHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoaWQgPT09IHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZXRTZWxlY3RlZElkKGlkIHx8IHVuZGVmaW5lZCk7XG4gICAgICB9fVxuICAgID5cbiAgICAgIHtzaG93TG9va3VwSXRlbSAmJiAoXG4gICAgICAgIDxMaXN0LlNlY3Rpb24gdGl0bGU9XCJBSSBMb29rdXBcIj5cbiAgICAgICAgICA8TGlzdC5JdGVtXG4gICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtXCJcbiAgICAgICAgICAgIHRpdGxlPXtgU2VhcmNoIEdlbWluaSBmb3IgXCIke2NsZWFuU2VhcmNoVGV4dH1cImB9XG4gICAgICAgICAgICBpY29uPXtJY29uLkdsb2JlfVxuICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICB0aXRsZT1cIkxvb2t1cCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgIGljb249e0ljb24uTWFnbmlmeWluZ0dsYXNzfVxuICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZUxvb2t1cChjbGVhblNlYXJjaFRleHQpfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZXRhaWw9e1xuICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbFxuICAgICAgICAgICAgICAgIG1hcmtkb3duPXtgIyBTZWFyY2ggR2VtaW5pIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiXFxuXFxuUHJlc3MgKipFbnRlcioqIHRvIGxvb2sgdXAgdGhpcyB3b3JkLiBJdCB3aWxsIGdlbmVyYXRlIGEgc3RydWN0dXJlZCBlbnRyeSB3aXRoIGRlZmluaXRpb24sIEhpbmRpIHRyYW5zbGF0aW9uL3Byb251bmNpYXRpb24sIGV4YW1wbGVzLCBzeW5vbnltcy9hbnRvbnltcywgYW5kIHdvcmQgb3JpZ2luLCB0aGVuIHNhdmUgaXQgdG8geW91ciBsb2NhbCBkaXJlY3RvcnkuYH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvPlxuICAgICAgICA8L0xpc3QuU2VjdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHtmaWx0ZXJlZFdvcmRzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgIDxMaXN0LlNlY3Rpb24gdGl0bGU9XCJTYXZlZCBWb2NhYnVsYXJ5XCI+XG4gICAgICAgICAge2ZpbHRlcmVkV29yZHMubWFwKChbd29yZE5hbWUsIGNvbnRlbnRdKSA9PiAoXG4gICAgICAgICAgICA8TGlzdC5JdGVtXG4gICAgICAgICAgICAgIGtleT17d29yZE5hbWV9XG4gICAgICAgICAgICAgIGlkPXt3b3JkTmFtZX1cbiAgICAgICAgICAgICAgdGl0bGU9e2NhcGl0YWxpemUod29yZE5hbWUpfVxuICAgICAgICAgICAgICBzdWJ0aXRsZT17Z2V0U3VidGl0bGUoY29udGVudCl9XG4gICAgICAgICAgICAgIGFjY2Vzc29yaWVzPXtbXG4gICAgICAgICAgICAgICAgeyB0YWc6IHsgdmFsdWU6IGdldFBhcnRPZlNwZWVjaChjb250ZW50KSwgY29sb3I6IENvbG9yLkJsdWUgfSB9LFxuICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICBkZXRhaWw9ezxMaXN0Lkl0ZW0uRGV0YWlsIG1hcmtkb3duPXtjb250ZW50fSAvPn1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNvcHkgTWFya2Rvd25cIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNvcHlDbGlwYm9hcmR9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2xpcGJvYXJkLmNvcHkoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5TdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQ29waWVkIHRvIENsaXBib2FyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYCR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9IG1hcmtkb3duIGNvcGllZGAsXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIk9wZW4gRmlsZVwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uRG9jdW1lbnR9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVPcGVuRmlsZSh3b3JkTmFtZSl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJldmVhbCBpbiBGaW5kZXJcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkZpbmRlcn1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZVJldmVhbEluRmluZGVyKHdvcmROYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUmVmcmVzaCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5SZXBlYXR9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCJdLCBrZXk6IFwiclwiIH19XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVMb29rdXAod29yZE5hbWUsIHRydWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgV29yZFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uVHJhc2h9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXtBY3Rpb24uU3R5bGUuRGVzdHJ1Y3RpdmV9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY3RybFwiXSwga2V5OiBcInhcIiB9fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlRGVsZXRlKHdvcmROYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9MaXN0LlNlY3Rpb24+XG4gICAgICApIDogKFxuICAgICAgICAhc2hvd0xvb2t1cEl0ZW0gJiZcbiAgICAgICAgIWxvYWRpbmdIaXN0b3J5ICYmIChcbiAgICAgICAgICA8TGlzdC5FbXB0eVZpZXdcbiAgICAgICAgICAgIHRpdGxlPVwiWW91ciB2b2NhYnVsYXJ5IGlzIGVtcHR5XCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiVHlwZSBhIHdvcmQgaW4gdGhlIHNlYXJjaCBiYXIgYW5kIHByZXNzIEVudGVyIHRvIHF1ZXJ5IEdlbWluaSBBSS5cIlxuICAgICAgICAgICAgaWNvbj17SWNvbi5Cb29rfVxuICAgICAgICAgIC8+XG4gICAgICAgIClcbiAgICAgICl9XG4gICAgPC9MaXN0PlxuICApO1xufVxuIiwgImV4cG9ydCBjb25zdCBQUk9NUFQgPSBgXG5Zb3UgYXJlIGEgdm9jYWJ1bGFyeSBhc3Npc3RhbnQuXG5cbldvcmQ6IHt3b3JkfVxuXG5PdXRwdXQgU1RSSUNUIE1hcmtkb3duLlxuXG5SdWxlczpcbi0gVXNlIG9ubHkgTWFya2Rvd25cbi0gTm8gSFRNTFxuLSBObyBlbW9qaXNcbi0gTm8gdGFibGVzXG4tIFVzZSBcIi1cIiBidWxsZXRzIG9ubHlcbi0gS2VlcCBzcGFjaW5nIGNsZWFuXG4tIEtlZXAgY29uY2lzZVxuLSBObyBjb2RlIGJsb2Nrc1xuLSBEbyBub3Qgd3JhcCByZXNwb25zZSBpbiBtYXJrZG93biBmZW5jZXNcbi0gTWF4aW11bSBjbGFyaXR5LCBtaW5pbXVtIHdvcmRzXG5cbkZvcm1hdDpcblxuIyBXb3JkIChIaW5kaSBQcm9udW5jaWF0aW9uKVxuKipOb3VuOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGEgbm91bilcbioqVmVyYjoqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhIHZlcmIpXG4qKkFkamVjdGl2ZToqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhbiBhZGplY3RpdmUpXG4qKkFkdmVyYjoqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhbiBhZHZlcmIpXG4oanVzdCBsaWtlIHRoYXQgYWxsIG90aGVyIHR5cGVzIG9mIHBhcnQgb2Ygc3BlZWNoZXMsIGFib3ZlIDQgYXJlIGp1c3QgZXhhbXBsZXMpIChhbmQgd2hlbiBtdWx0aXBsZSBwYXJ0IG9mIHNwZWVjaGVzIGV4aXN0cywgdGhlbiBicmVhayBsaW5lcyBmb3IgZWFjaCBwYXJ0IG9mIHNwZWVjaClcblxuIyMgSGluZGkgRXF1aXZhbGVudFxubWVhbmluZzEsIG1lYW5pbmcyLCBtZWFuaW5nM1xuXG4jIyBXaGVuIHRvIHVzZVxuLSBwb2ludFxuLSBwb2ludFxuLSBwb2ludFxuXG4jIyBFeGFtcGxlc1xuLSBzZW50ZW5jZVxuLSBIaW5kaSB0cmFuc2xhdGlvblxuLSBzZW50ZW5jZVxuLSBIaW5kaSB0cmFuc2xhdGlvblxuXG4jIyBTeW5vbnltc1xudzEsIHcyLCB3MywgdzRcblxuIyMgQW50b255bXNcbncxLCB3MiwgdzMsIHc0XG5cbkNvbmRpdGlvbmFsOlxuSW5jbHVkZSBvbmx5IHdoZW4gbWVhbmluZ2Z1bC5cblxuIyMgV29yZCBCcmVha2Rvd25cbi0gcGFydCBcdTIxOTIgbWVhbmluZ1xuXG4jIyBGb3JtYXRpb24gRmxvd1xuLSBzdGVwIFx1MjE5MiBtZWFuaW5nXG5cbiMjIEV0eW1vbG9neVxuYnJpZWYgb3JpZ2luXG5cbkNvbnN0cmFpbnRzOlxuLSBObyBleHRyYSB0ZXh0XG4tIE5vIGV4cGxhbmF0aW9uc1xuLSBObyBkZXZpYXRpb25zXG4tIE91dHB1dCBvbmx5IHRoZSBmb3JtYXR0ZWQgZW50cnlcbmA7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBWU87QUFDUCxtQkFBcUQ7QUFDckQsc0JBQWU7QUFDZixnQkFBZTs7O0FDZlIsSUFBTSxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FEaUJ0QixrQkFBaUI7QUF3VUQ7QUEvVGhCLFNBQVMsWUFBWSxvQkFBb0M7QUFDdkQsUUFBTSxXQUFXLHNCQUFzQjtBQUN2QyxNQUFJLFNBQVMsV0FBVyxJQUFJLEdBQUc7QUFDN0IsV0FBTyxZQUFBQSxRQUFLLEtBQUssVUFBQUMsUUFBRyxRQUFRLEdBQUcsU0FBUyxNQUFNLENBQUMsQ0FBQztBQUFBLEVBQ2xEO0FBQ0EsU0FBTyxZQUFBRCxRQUFLLFFB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
