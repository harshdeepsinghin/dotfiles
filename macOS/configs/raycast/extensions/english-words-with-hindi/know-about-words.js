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
      const promptText = PROMPT.replace("{word}", wordToLookup);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9rbm93LWFib3V0LXdvcmRzLnRzeCIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3Byb21wdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBBY3Rpb25QYW5lbCxcbiAgTGlzdCxcbiAgc2hvd1RvYXN0LFxuICBUb2FzdCxcbiAgZ2V0UHJlZmVyZW5jZVZhbHVlcyxcbiAgb3BlbixcbiAgc2hvd0luRmluZGVyLFxuICBJY29uLFxuICBDb2xvcixcbiAgQ2xpcGJvYXJkLFxufSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCB7IFBST01QVCB9IGZyb20gXCIuL3Byb21wdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gRGVmaW5lIHRoZSBwcmVmZXJlbmNlcyBpbnRlcmZhY2UgbWF0Y2hpbmcgcGFja2FnZS5qc29uXG5pbnRlcmZhY2UgUHJlZmVyZW5jZXMge1xuICBnZW1pbmlBcGlLZXk6IHN0cmluZztcbiAgd29yZHNEaXJlY3Rvcnk6IHN0cmluZztcbn1cblxuXG5cbmZ1bmN0aW9uIGdldFdvcmRzRGlyKHdvcmRzRGlyZWN0b3J5UHJlZjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcmVzb2x2ZWQgPSB3b3Jkc0RpcmVjdG9yeVByZWYgfHwgXCJ+L3dvcmRzXCI7XG4gIGlmIChyZXNvbHZlZC5zdGFydHNXaXRoKFwifi9cIikpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKG9zLmhvbWVkaXIoKSwgcmVzb2x2ZWQuc2xpY2UoMikpO1xuICB9XG4gIHJldHVybiBwYXRoLnJlc29sdmUocmVzb2x2ZWQpO1xufVxuXG5mdW5jdGlvbiBjYXBpdGFsaXplKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghcykgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKTtcbn1cblxuZnVuY3Rpb24gZ2V0U3VidGl0bGUobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd24uc3BsaXQoXCJcXG5cIik7XG4gIGNvbnN0IGhpbmRpRXF1aXZhbGVudEluZGV4ID0gbGluZXMuZmluZEluZGV4KChsKSA9PlxuICAgIGwuaW5jbHVkZXMoXCIjIyBIaW5kaSBFcXVpdmFsZW50XCIpLFxuICApO1xuICBpZiAoaGluZGlFcXVpdmFsZW50SW5kZXggIT09IC0xICYmIGxpbmVzW2hpbmRpRXF1aXZhbGVudEluZGV4ICsgMV0pIHtcbiAgICBjb25zdCBtZWFuaW5nTGluZSA9IGxpbmVzW2hpbmRpRXF1aXZhbGVudEluZGV4ICsgMV0udHJpbSgpO1xuICAgIGlmIChtZWFuaW5nTGluZSkgcmV0dXJuIG1lYW5pbmdMaW5lO1xuICB9XG5cbiAgLy8gRmFsbGJhY2s6IHNlYXJjaCBmb3IgSGluZGkgcHJvbnVuY2lhdGlvbiBpbiB0aGUgdGl0bGVcbiAgY29uc3QgdGl0bGVNYXRjaCA9IG1hcmtkb3duLm1hdGNoKC9eI1xccytbXihdK1xcKChbXildKylcXCkvbSk7XG4gIGlmICh0aXRsZU1hdGNoICYmIHRpdGxlTWF0Y2hbMV0pIHtcbiAgICByZXR1cm4gdGl0bGVNYXRjaFsxXTtcbiAgfVxuICByZXR1cm4gXCJcIjtcbn1cblxuZnVuY3Rpb24gZ2V0UGFydE9mU3BlZWNoKG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgYm9sZE1hdGNoID0gbGluZS5tYXRjaChcbiAgICAgIC9eXFwqXFwqKE5vdW58VmVyYnxBZGplY3RpdmV8QWR2ZXJifFByZXBvc2l0aW9ufENvbmp1bmN0aW9ufFByb25vdW58SW50ZXJqZWN0aW9uKTpcXCpcXCovaSxcbiAgICApO1xuICAgIGlmIChib2xkTWF0Y2gpIHtcbiAgICAgIHBhcnRzLnB1c2goY2FwaXRhbGl6ZShib2xkTWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkpO1xuICAgIH1cbiAgfVxuICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJ0cy5qb2luKFwiLCBcIik7XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBvbGRlciBoZWFkZXIgZm9ybWF0XG4gIGNvbnN0IG1hdGNoID0gbWFya2Rvd24ubWF0Y2goXG4gICAgL14jI1xccysoTm91bnxWZXJifEFkamVjdGl2ZXxBZHZlcmJ8UHJlcG9zaXRpb258Q29uanVuY3Rpb258UHJvbm91bnxJbnRlcmplY3Rpb24pL2ltLFxuICApO1xuICByZXR1cm4gbWF0Y2ggPyBjYXBpdGFsaXplKG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkpIDogXCJcIjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ29tbWFuZCgpIHtcbiAgY29uc3QgcHJlZmVyZW5jZXMgPSBnZXRQcmVmZXJlbmNlVmFsdWVzPFByZWZlcmVuY2VzPigpO1xuICBjb25zdCB3b3Jkc0RpciA9IHVzZU1lbW8oXG4gICAgKCkgPT4gZ2V0V29yZHNEaXIocHJlZmVyZW5jZXMud29yZHNEaXJlY3RvcnkpLFxuICAgIFtwcmVmZXJlbmNlcy53b3Jkc0RpcmVjdG9yeV0sXG4gICk7XG5cbiAgY29uc3QgW3dvcmRzLCBzZXRXb3Jkc10gPSB1c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+Pih7fSk7XG4gIGNvbnN0IFtsb2FkaW5nSGlzdG9yeSwgc2V0TG9hZGluZ0hpc3RvcnldID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtpc1NlYXJjaGluZywgc2V0SXNTZWFyY2hpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VhcmNoVGV4dCwgc2V0U2VhcmNoVGV4dF0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW3NlbGVjdGVkSWQsIHNldFNlbGVjdGVkSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgdW5kZWZpbmVkPih1bmRlZmluZWQpO1xuICBjb25zdCBwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYgPSB1c2VSZWY8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gQ2xlYW51cCBwcm9ncmFtbWF0aWMgc2VsZWN0aW9uIHJlZiBhZnRlciB0aGUgbGlzdCBsYXlvdXQgdXBkYXRlc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfSwgMjAwKTtcbiAgICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIH1cbiAgfSwgW3NlYXJjaFRleHQsIHNlbGVjdGVkSWRdKTtcblxuICAvLyBMb2FkIHNhdmVkIHdvcmRzIGZyb20gdGhlIGRpcmVjdG9yeVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFzeW5jIGZ1bmN0aW9uIGluaXRBbmRMb2FkKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMubWtkaXIod29yZHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIod29yZHNEaXIpO1xuICAgICAgICBjb25zdCBsb2FkZWRXb3JkczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICAgIGlmIChmaWxlLmVuZHNXaXRoKFwiLm1kXCIpKSB7XG4gICAgICAgICAgICBjb25zdCB3b3JkTmFtZSA9IGZpbGUuc2xpY2UoMCwgLTMpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucmVhZEZpbGUoXG4gICAgICAgICAgICAgIHBhdGguam9pbih3b3Jkc0RpciwgZmlsZSksXG4gICAgICAgICAgICAgIFwidXRmLThcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsb2FkZWRXb3Jkc1t3b3JkTmFtZV0gPSBjb250ZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZXRXb3Jkcyhsb2FkZWRXb3Jkcyk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBsb2FkIHZvY2FidWxhcnkgZmlsZXNcIiwgZXJyKTtcbiAgICAgICAgc2hvd1RvYXN0KHtcbiAgICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgICB0aXRsZTogXCJGYWlsZWQgdG8gbG9hZCBzYXZlZCB2b2NhYnVsYXJ5XCIsXG4gICAgICAgICAgbWVzc2FnZTogU3RyaW5nKGVyciksXG4gICAgICAgIH0pO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgc2V0TG9hZGluZ0hpc3RvcnkoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGluaXRBbmRMb2FkKCk7XG4gIH0sIFt3b3Jkc0Rpcl0pO1xuXG4gIC8vIENsZWFuIGFuZCBmaWx0ZXIgc2VhcmNoIHF1ZXJ5XG4gIGNvbnN0IGNsZWFuU2VhcmNoVGV4dCA9IHNlYXJjaFRleHQudHJpbSgpO1xuXG4gIC8vIEZpbHRlciBsb2NhbCB3b3JkcyBtYXRjaGluZyB0aGUgc2VhcmNoIHRleHRcbiAgY29uc3QgZmlsdGVyZWRXb3JkcyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IHF1ZXJ5ID0gY2xlYW5TZWFyY2hUZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHdvcmRzKS5maWx0ZXIoKFt3b3JkTmFtZSwgY29udGVudF0pID0+IHtcbiAgICAgIGlmICghcXVlcnkpIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgd29yZE5hbWUuaW5jbHVkZXMocXVlcnkpIHx8XG4gICAgICAgIGdldFN1YnRpdGxlKGNvbnRlbnQpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpXG4gICAgICApO1xuICAgIH0pO1xuICB9LCBbd29yZHMsIGNsZWFuU2VhcmNoVGV4dF0pO1xuXG4gIC8vIERldGVybWluZSBpZiB3ZSBzaG91bGQgc2hvdyB0aGUgXCJTZWFyY2ggR2VtaW5pXCIgaXRlbVxuICBjb25zdCBzaG93TG9va3VwSXRlbSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghY2xlYW5TZWFyY2hUZXh0KSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgbG93ZXJRdWVyeSA9IGNsZWFuU2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgIC8vIERvIG5vdCBzaG93IGxvb2t1cCBvcHRpb24gaWYgaXQgbWF0Y2hlcyBhIHNhdmVkIHdvcmQgZXhhY3RseVxuICAgIHJldHVybiAhd29yZHNbbG93ZXJRdWVyeV07XG4gIH0sIFt3b3JkcywgY2xlYW5TZWFyY2hUZXh0XSk7XG5cbiAgLy8gSGFuZGxlIEdlbWluaSBBUEkgbG9va3VwXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUxvb2t1cCh3b3JkVG9Mb29rdXA6IHN0cmluZywgZm9yY2VSZWNyZWF0ZSA9IGZhbHNlKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFdvcmQgPSB3b3JkVG9Mb29rdXAudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCFub3JtYWxpemVkV29yZCkgcmV0dXJuO1xuXG4gICAgaWYgKCFmb3JjZVJlY3JlYXRlICYmIHdvcmRzW25vcm1hbGl6ZWRXb3JkXSkge1xuICAgICAgc2V0U2VsZWN0ZWRJZChub3JtYWxpemVkV29yZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdG9hc3QgPSBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkFuaW1hdGVkLFxuICAgICAgdGl0bGU6IGZvcmNlUmVjcmVhdGVcbiAgICAgICAgPyBcIlJlLWdlbmVyYXRpbmcgd29yZCBlbnRyeS4uLlwiXG4gICAgICAgIDogYExvb2tpbmcgdXAgXCIke3dvcmRUb0xvb2t1cH1cIi4uLmAsXG4gICAgfSk7XG5cbiAgICBzZXRJc1NlYXJjaGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYXBpS2V5ID0gcHJlZmVyZW5jZXMuZ2VtaW5pQXBpS2V5O1xuICAgICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIFwiR2VtaW5pIEFQSSBrZXkgaXMgbm90IGNvbmZpZ3VyZWQgaW4gZXh0ZW5zaW9uIHByZWZlcmVuY2VzLlwiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9tcHRUZXh0ID0gUFJPTVBULnJlcGxhY2UoXCJ7d29yZH1cIiwgd29yZFRvTG9va3VwKTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcbiAgICAgICAgYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvZ2VtaW5pLTMuNS1mbGFzaDpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7YXBpS2V5fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHByb21wdFRleHQsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgKTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgR2VtaW5pIEFQSSBSZXF1ZXN0IGZhaWxlZDogJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1cXG4ke2Vycm9yVGV4dH1gLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpbnRlcmZhY2UgR2VtaW5pUmVzcG9uc2Uge1xuICAgICAgICBjYW5kaWRhdGVzPzogQXJyYXk8e1xuICAgICAgICAgIGNvbnRlbnQ/OiB7XG4gICAgICAgICAgICBwYXJ0cz86IEFycmF5PHtcbiAgICAgICAgICAgICAgdGV4dD86IHN0cmluZztcbiAgICAgICAgICAgIH0+O1xuICAgICAgICAgIH07XG4gICAgICAgIH0+O1xuICAgICAgfVxuICAgICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXNwb25zZS5qc29uKCkpIGFzIEdlbWluaVJlc3BvbnNlO1xuICAgICAgY29uc3QgcmVzdWx0TWFya2Rvd24gPSBkYXRhPy5jYW5kaWRhdGVzPy5bMF0/LmNvbnRlbnQ/LnBhcnRzPy5bMF0/LnRleHQ7XG5cbiAgICAgIGlmIChcbiAgICAgICAgIXJlc3VsdE1hcmtkb3duIHx8XG4gICAgICAgIHJlc3VsdE1hcmtkb3duLnRyaW0oKSA9PT0gXCJObyByZXNwb25zZSByZWNlaXZlZC5cIlxuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIk5vIHJlc3BvbnNlIG9yIGludmFsaWQgZm9ybWF0IHJlY2VpdmVkIGZyb20gR2VtaW5pIEFQSS5cIixcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2F2ZSB3b3JkIHRvIGxvY2FsIGRhdGFiYXNlXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih3b3Jkc0RpciwgYCR7bm9ybWFsaXplZFdvcmR9Lm1kYCk7XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUoZmlsZVBhdGgsIHJlc3VsdE1hcmtkb3duLnRyaW0oKSk7XG5cbiAgICAgIC8vIFVwZGF0ZSBzdGF0ZVxuICAgICAgc2V0V29yZHMoKHByZXYpID0+ICh7XG4gICAgICAgIC4uLnByZXYsXG4gICAgICAgIFtub3JtYWxpemVkV29yZF06IHJlc3VsdE1hcmtkb3duLnRyaW0oKSxcbiAgICAgIH0pKTtcblxuICAgICAgLy8gRm9jdXMgdGhlIG5ld2x5IGxvb2tlZCB1cC9jcmVhdGVkIHdvcmRcbiAgICAgIHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ID0gbm9ybWFsaXplZFdvcmQ7XG4gICAgICBzZXRTZWxlY3RlZElkKG5vcm1hbGl6ZWRXb3JkKTtcbiAgICAgIHNldFNlYXJjaFRleHQoXCJcIik7IC8vIENsZWFyIHNlYXJjaCB0byBzaG93IGluIHRoZSBsaXN0IG9mIHNhdmVkIHdvcmRzXG5cbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJXb3JkIFNhdmVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gYCR7Y2FwaXRhbGl6ZShub3JtYWxpemVkV29yZCl9IGFkZGVkIHRvIGRhdGFiYXNlYDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJMb29rdXAgRmFpbGVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRJc1NlYXJjaGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gT3BlbiBmaWxlIGluIGRlZmF1bHQgYXBwbGljYXRpb25cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlT3BlbkZpbGUod29yZE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBgJHt3b3JkTmFtZS50b0xvd2VyQ2FzZSgpfS5tZGApO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBvcGVuKGZpbGVQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNob3dUb2FzdCh7XG4gICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICB0aXRsZTogXCJDb3VsZCBub3Qgb3BlbiBmaWxlXCIsXG4gICAgICAgIG1lc3NhZ2U6IFN0cmluZyhlcnIpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV2ZWFsIGZpbGUgaW4gZmluZGVyXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJldmVhbEluRmluZGVyKHdvcmROYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih3b3Jkc0RpciwgYCR7d29yZE5hbWUudG9Mb3dlckNhc2UoKX0ubWRgKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2hvd0luRmluZGVyKGZpbGVQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNob3dUb2FzdCh7XG4gICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICB0aXRsZTogXCJDb3VsZCBub3QgcmV2ZWFsIGZpbGVcIixcbiAgICAgICAgbWVzc2FnZTogU3RyaW5nKGVyciksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBEZWxldGUgd29yZCBmaWxlIGFuZCBlbnRyeVxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVEZWxldGUod29yZE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBgJHt3b3JkTmFtZS50b0xvd2VyQ2FzZSgpfS5tZGApO1xuICAgIGNvbnN0IHRvYXN0ID0gYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5BbmltYXRlZCxcbiAgICAgIHRpdGxlOiBgRGVsZXRpbmcgXCIke2NhcGl0YWxpemUod29yZE5hbWUpfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy51bmxpbmsoZmlsZVBhdGgpO1xuICAgICAgc2V0V29yZHMoKHByZXYpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHsgLi4ucHJldiB9O1xuICAgICAgICBkZWxldGUgbmV4dFt3b3JkTmFtZV07XG4gICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgfSk7XG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLlN1Y2Nlc3M7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiV29yZCBEZWxldGVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gYFJlbW92ZWQgJHtjYXBpdGFsaXplKHdvcmROYW1lKX0gZnJvbSBkYXRhYmFzZWA7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiRGVsZXRlIEZhaWxlZFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IFN0cmluZyhlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPExpc3RcbiAgICAgIGlzU2hvd2luZ0RldGFpbD17T2JqZWN0LmtleXMod29yZHMpLmxlbmd0aCA+IDAgfHwgc2hvd0xvb2t1cEl0ZW19XG4gICAgICBzZWFyY2hCYXJQbGFjZWhvbGRlcj1cIlNlYXJjaCBzYXZlZCB3b3JkcyBvciBsb29rIHVwIG5ldyBvbmVzLi4uXCJcbiAgICAgIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0U2VhcmNoVGV4dH1cbiAgICAgIHNlYXJjaFRleHQ9e3NlYXJjaFRleHR9XG4gICAgICBpc0xvYWRpbmc9e2xvYWRpbmdIaXN0b3J5IHx8IGlzU2VhcmNoaW5nfVxuICAgICAgc2VsZWN0ZWRJdGVtSWQ9e3NlbGVjdGVkSWR9XG4gICAgICBvblNlbGVjdGlvbkNoYW5nZT17KGlkKSA9PiB7XG4gICAgICAgIGlmIChwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmIChpZCA9PT0gcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldFNlbGVjdGVkSWQoaWQgfHwgdW5kZWZpbmVkKTtcbiAgICAgIH19XG4gICAgPlxuICAgICAge3Nob3dMb29rdXBJdGVtICYmIChcbiAgICAgICAgPExpc3QuU2VjdGlvbiB0aXRsZT1cIkFJIExvb2t1cFwiPlxuICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgIGlkPVwibG9va3VwLWl0ZW1cIlxuICAgICAgICAgICAgdGl0bGU9e2BTZWFyY2ggR2VtaW5pIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgIGljb249e0ljb24uR2xvYmV9XG4gICAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgIHRpdGxlPVwiTG9va3VwIFdvcmRcIlxuICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5NYWduaWZ5aW5nR2xhc3N9XG4gICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlTG9va3VwKGNsZWFuU2VhcmNoVGV4dCl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRldGFpbD17XG4gICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsXG4gICAgICAgICAgICAgICAgbWFya2Rvd249e2AjIFNlYXJjaCBHZW1pbmkgZm9yIFwiJHtjbGVhblNlYXJjaFRleHR9XCJcXG5cXG5QcmVzcyAqKkVudGVyKiogdG8gbG9vayB1cCB0aGlzIHdvcmQuIEl0IHdpbGwgZ2VuZXJhdGUgYSBzdHJ1Y3R1cmVkIGVudHJ5IHdpdGggZGVmaW5pdGlvbiwgSGluZGkgdHJhbnNsYXRpb24vcHJvbnVuY2lhdGlvbiwgZXhhbXBsZXMsIHN5bm9ueW1zL2FudG9ueW1zLCBhbmQgd29yZCBvcmlnaW4sIHRoZW4gc2F2ZSBpdCB0byB5b3VyIGxvY2FsIGRpcmVjdG9yeS5gfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvTGlzdC5TZWN0aW9uPlxuICAgICAgKX1cblxuICAgICAge2ZpbHRlcmVkV29yZHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgPExpc3QuU2VjdGlvbiB0aXRsZT1cIlNhdmVkIFZvY2FidWxhcnlcIj5cbiAgICAgICAgICB7ZmlsdGVyZWRXb3Jkcy5tYXAoKFt3b3JkTmFtZSwgY29udGVudF0pID0+IChcbiAgICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgICAga2V5PXt3b3JkTmFtZX1cbiAgICAgICAgICAgICAgaWQ9e3dvcmROYW1lfVxuICAgICAgICAgICAgICB0aXRsZT17Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XG4gICAgICAgICAgICAgIHN1YnRpdGxlPXtnZXRTdWJ0aXRsZShjb250ZW50KX1cbiAgICAgICAgICAgICAgYWNjZXNzb3JpZXM9e1tcbiAgICAgICAgICAgICAgICB7IHRhZzogeyB2YWx1ZTogZ2V0UGFydE9mU3BlZWNoKGNvbnRlbnQpLCBjb2xvcjogQ29sb3IuQmx1ZSB9IH0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgIGRldGFpbD17PExpc3QuSXRlbS5EZXRhaWwgbWFya2Rvd249e2NvbnRlbnR9IC8+fVxuICAgICAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBNYXJrZG93blwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uQ29weUNsaXBib2FyZH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249e2FzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDbGlwYm9hcmQuY29weShjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJDb3BpZWQgdG8gQ2xpcGJvYXJkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgJHtjYXBpdGFsaXplKHdvcmROYW1lKX0gbWFya2Rvd24gY29waWVkYCxcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBGaWxlXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5Eb2N1bWVudH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZU9wZW5GaWxlKHdvcmROYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUmV2ZWFsIGluIEZpbmRlclwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uRmluZGVyfVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlUmV2ZWFsSW5GaW5kZXIod29yZE5hbWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJSZWZyZXNoIFdvcmRcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlJlcGVhdH1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIl0sIGtleTogXCJyXCIgfX1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZUxvb2t1cCh3b3JkTmFtZSwgdHJ1ZSl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkRlbGV0ZSBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5UcmFzaH1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e0FjdGlvbi5TdHlsZS5EZXN0cnVjdGl2ZX1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjdHJsXCJdLCBrZXk6IFwieFwiIH19XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVEZWxldGUod29yZE5hbWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L0xpc3QuU2VjdGlvbj5cbiAgICAgICkgOiAoXG4gICAgICAgICFzaG93TG9va3VwSXRlbSAmJlxuICAgICAgICAhbG9hZGluZ0hpc3RvcnkgJiYgKFxuICAgICAgICAgIDxMaXN0LkVtcHR5Vmlld1xuICAgICAgICAgICAgdGl0bGU9XCJZb3VyIHZvY2FidWxhcnkgaXMgZW1wdHlcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJUeXBlIGEgd29yZCBpbiB0aGUgc2VhcmNoIGJhciBhbmQgcHJlc3MgRW50ZXIgdG8gcXVlcnkgR2VtaW5pIEFJLlwiXG4gICAgICAgICAgICBpY29uPXtJY29uLkJvb2t9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuICAgICAgKX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG4iLCAiZXhwb3J0IGNvbnN0IFBST01QVCA9IGBcbllvdSBhcmUgYSB2b2NhYnVsYXJ5IGFzc2lzdGFudC5cblxuV29yZDoge3dvcmR9XG5cbk91dHB1dCBTVFJJQ1QgTWFya2Rvd24uXG5cblJ1bGVzOlxuLSBVc2Ugb25seSBNYXJrZG93blxuLSBObyBIVE1MXG4tIE5vIGVtb2ppc1xuLSBObyB0YWJsZXNcbi0gVXNlIFwiLVwiIGJ1bGxldHMgb25seVxuLSBLZWVwIHNwYWNpbmcgY2xlYW5cbi0gS2VlcCBjb25jaXNlXG4tIE5vIGNvZGUgYmxvY2tzXG4tIERvIG5vdCB3cmFwIHJlc3BvbnNlIGluIG1hcmtkb3duIGZlbmNlc1xuLSBNYXhpbXVtIGNsYXJpdHksIG1pbmltdW0gd29yZHNcblxuRm9ybWF0OlxuXG4jIFdvcmQgKEhpbmRpIFByb251bmNpYXRpb24pXG4qKk5vdW46Kiogc2hvcnQgZGVmaW5pdGlvbiAoXHUyMjY0MjAgd29yZHMpIChpbmNsdWRlIE9OTFkgaWYgdGhlIHdvcmQgY2FuIGJlIHVzZWQgYXMgYSBub3VuKVxuKipWZXJiOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGEgdmVyYilcbioqQWRqZWN0aXZlOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGFuIGFkamVjdGl2ZSlcbioqQWR2ZXJiOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGFuIGFkdmVyYilcbihqdXN0IGxpa2UgdGhhdCBhbGwgb3RoZXIgdHlwZXMgb2YgcGFydCBvZiBzcGVlY2hlcywgYWJvdmUgNCBhcmUganVzdCBleGFtcGxlcykgKGFuZCB3aGVuIG11bHRpcGxlIHBhcnQgb2Ygc3BlZWNoZXMgZXhpc3RzLCB0aGVuIGJyZWFrIGxpbmVzIGZvciBlYWNoIHBhcnQgb2Ygc3BlZWNoKVxuXG4jIyBIaW5kaSBFcXVpdmFsZW50XG5tZWFuaW5nMSwgbWVhbmluZzIsIG1lYW5pbmczXG5cbiMjIFdoZW4gdG8gdXNlXG4tIHBvaW50XG4tIHBvaW50XG4tIHBvaW50XG5cbiMjIEV4YW1wbGVzXG4tIHNlbnRlbmNlXG4tIEhpbmRpIHRyYW5zbGF0aW9uXG4tIHNlbnRlbmNlXG4tIEhpbmRpIHRyYW5zbGF0aW9uXG5cbiMjIFN5bm9ueW1zXG53MSwgdzIsIHczLCB3NFxuXG4jIyBBbnRvbnltc1xudzEsIHcyLCB3MywgdzRcblxuQ29uZGl0aW9uYWw6XG5JbmNsdWRlIG9ubHkgd2hlbiBtZWFuaW5nZnVsLlxuXG4jIyBXb3JkIEJyZWFrZG93blxuLSBwYXJ0IFx1MjE5MiBtZWFuaW5nXG5cbiMjIEZvcm1hdGlvbiBGbG93XG4tIHN0ZXAgXHUyMTkyIG1lYW5pbmdcblxuIyMgRXR5bW9sb2d5XG5icmllZiBvcmlnaW5cblxuQ29uc3RyYWludHM6XG4tIE5vIGV4dHJhIHRleHRcbi0gTm8gZXhwbGFuYXRpb25zXG4tIE5vIGRldmlhdGlvbnNcbi0gT3V0cHV0IG9ubHkgdGhlIGZvcm1hdHRlZCBlbnRyeVxuYDtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFZTztBQUNQLG1CQUFxRDtBQUNyRCxzQkFBZTtBQUNmLGdCQUFlOzs7QUNmUixJQUFNLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QURpQnRCLGtCQUFpQjtBQXdVRDtBQTlUaEIsU0FBUyxZQUFZLG9CQUFvQztBQUN2RCxRQUFNLFdBQVcsc0JBQXNCO0FBQ3ZDLE1BQUksU0FBUyxXQUFXLElBQUksR0FBRztBQUM3QixXQUFPLFlBQUFBLFFBQUssS0FBSyxVQUFBQyxRQUFHLFFBQVEsR0FBRyxTQUFTLE1BQU0sQ0FBQyxDQUFDO0FBQUEsRUFDbEQ7QUFDQSxTQUFPLFlBQUFELFFBQUssUUFBUSxRQUFRO0FBQzlCO0FBRUEsU0FBUyxXQUFXLEdBQW1CO0FBQ3JDLE1BQUksQ0FBQyxFQUFHLFFBQU87QUFDZixTQUFPLEVBQUUsT0FBTyxD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
