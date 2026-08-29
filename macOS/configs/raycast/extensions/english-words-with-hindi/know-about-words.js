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
var import_api4 = require("@raycast/api");
var import_react3 = require("react");
var import_promises2 = __toESM(require("fs/promises"));
var import_os2 = __toESM(require("os"));

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
var import_path2 = __toESM(require("path"));
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
      return { success: true, messageId: data.result?.message_id };
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

// src/schedule-form.tsx
var import_api2 = require("@raycast/api");
var import_react = require("react");

// src/scheduler.ts
var import_api = require("@raycast/api");
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var import_os = __toESM(require("os"));
function getStorageDir(customDir) {
  if (customDir) return customDir;
  if (typeof import_api.environment !== "undefined" && import_api.environment.supportPath) {
    return import_api.environment.supportPath;
  }
  return import_path.default.join(import_os.default.tmpdir(), "english-words-with-hindi");
}
function getStorageFilePath(customDir) {
  return import_path.default.join(getStorageDir(customDir), "scheduled-posts.json");
}
async function getScheduledPosts(customDir) {
  const filePath = getStorageFilePath(customDir);
  try {
    const data = await import_promises.default.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}
async function saveAllScheduledPosts(posts, customDir) {
  const dirPath = getStorageDir(customDir);
  await import_promises.default.mkdir(dirPath, { recursive: true });
  const filePath = getStorageFilePath(customDir);
  await import_promises.default.writeFile(filePath, JSON.stringify(posts, null, 2), "utf-8");
}
async function addScheduledPost(wordName, formattedText, scheduledAt, customDir) {
  const posts = await getScheduledPosts(customDir);
  const newPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    wordName,
    formattedText,
    scheduledAt: scheduledAt.toISOString(),
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  posts.push(newPost);
  await saveAllScheduledPosts(posts, customDir);
  return newPost;
}
async function deleteScheduledPost(id, customDir) {
  const posts = await getScheduledPosts(customDir);
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length !== posts.length) {
    await saveAllScheduledPosts(filtered, customDir);
    return true;
  }
  return false;
}
function getRandomFutureDate(minHoursAhead = 2, maxDaysAhead = 3, now = /* @__PURE__ */ new Date()) {
  const target = new Date(now.getTime());
  const minDays = Math.max(0, Math.floor(minHoursAhead / 24));
  const dayOffset = Math.floor(Math.random() * (maxDaysAhead - minDays + 1)) + minDays;
  target.setDate(target.getDate() + dayOffset);
  const randomHour = Math.floor(Math.random() * 13) + 9;
  const randomMinute = Math.floor(Math.random() * 4) * 15;
  target.setHours(randomHour, randomMinute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setTime(now.getTime() + minHoursAhead * 60 * 60 * 1e3);
  }
  return target;
}
async function processPendingPosts(botToken, chatId, customDir) {
  if (!botToken || !chatId) {
    return { processed: 0, sent: 0, failed: 0, sentWords: [] };
  }
  const posts = await getScheduledPosts(customDir);
  const nowISO = (/* @__PURE__ */ new Date()).toISOString();
  const pendingItems = posts.filter(
    (post) => post.status === "pending" && post.scheduledAt <= nowISO
  );
  if (pendingItems.length === 0) {
    return { processed: 0, sent: 0, failed: 0, sentWords: [] };
  }
  for (const post of pendingItems) {
    post.status = "processing";
  }
  await saveAllScheduledPosts(posts, customDir);
  let sentCount = 0;
  let failedCount = 0;
  const sentWords = [];
  for (const post of pendingItems) {
    const res = await postToTelegramChannel(
      botToken,
      chatId,
      post.formattedText
    );
    if (res.success) {
      post.status = "sent";
      post.sentAt = (/* @__PURE__ */ new Date()).toISOString();
      if (res.messageId) {
        post.messageId = res.messageId;
      }
      sentCount++;
      sentWords.push(post.wordName);
    } else {
      post.status = "failed";
      post.error = res.message || "Failed to post to Telegram";
      failedCount++;
    }
  }
  await saveAllScheduledPosts(posts, customDir);
  return {
    processed: pendingItems.length,
    sent: sentCount,
    failed: failedCount,
    sentWords
  };
}

// src/schedule-form.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function ScheduleForm({
  wordName,
  markdownContent,
  onScheduled
}) {
  const { pop } = (0, import_api2.useNavigation)();
  const defaultDate = new Date(Date.now() + 60 * 60 * 1e3);
  defaultDate.setSeconds(0, 0);
  const [scheduledDate, setScheduledDate] = (0, import_react.useState)(defaultDate);
  const formattedText = formatForTelegram(markdownContent);
  function handleRandomTime() {
    const randomDate = getRandomFutureDate(2, 4);
    setScheduledDate(randomDate);
    (0, import_api2.showToast)({
      style: import_api2.Toast.Style.Success,
      title: "Random Time Picked",
      message: randomDate.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    });
  }
  async function handleSubmit(values) {
    const targetDate = values.scheduledDate || scheduledDate;
    if (!targetDate) {
      await (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Failure,
        title: "Date Required",
        message: "Please select a valid date and time."
      });
      return;
    }
    if (targetDate.getTime() <= Date.now()) {
      await (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Failure,
        title: "Invalid Scheduled Time",
        message: "Please pick a time in the future."
      });
      return;
    }
    try {
      await addScheduledPost(wordName, formattedText, targetDate);
      await (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Success,
        title: "Message Scheduled",
        message: `"${capitalize(wordName)}" scheduled for ${targetDate.toLocaleString()}`
      });
      if (onScheduled) onScheduled();
      pop();
    } catch (err) {
      await (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Failure,
        title: "Scheduling Failed",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_api2.Form,
    {
      actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api2.ActionPanel, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.Action.SubmitForm,
          {
            title: "Confirm Schedule",
            icon: import_api2.Icon.Calendar,
            onSubmit: handleSubmit
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.Action,
          {
            title: "Set Random Time",
            icon: import_api2.Icon.Shuffle,
            shortcut: import_api2.Keyboard.Shortcut.Common.Refresh,
            onAction: handleRandomTime
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.Form.Description,
          {
            title: "Word",
            text: `Scheduling "${capitalize(wordName)}" to post to Telegram`
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.Form.DatePicker,
          {
            id: "scheduledDate",
            title: "Scheduled Date & Time",
            type: import_api2.Form.DatePicker.Type.DateTime,
            value: scheduledDate,
            onChange: setScheduledDate
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api2.Form.Separator, {}),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.Form.Description,
          {
            title: "Random Time Generator",
            text: "Press \u2318R or choose 'Set Random Time' from actions to automatically pick a random future daytime slot."
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api2.Form.Separator, {}),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.Form.Description,
          {
            title: "Telegram Preview",
            text: formattedText || "No content available to format."
          }
        )
      ]
    }
  );
}

// src/scheduled-list.tsx
var import_api3 = require("@raycast/api");
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function capitalize2(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function ScheduledList() {
  const [posts, setPosts] = (0, import_react2.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react2.useState)(true);
  async function loadPosts() {
    setIsLoading(true);
    try {
      const prefs = (0, import_api3.getPreferenceValues)();
      if (prefs.telegramBotToken && prefs.telegramChatId) {
        await processPendingPosts(
          prefs.telegramBotToken.trim(),
          prefs.telegramChatId.trim()
        );
      }
      const data = await getScheduledPosts();
      data.sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setPosts(data);
    } catch (err) {
      (0, import_api3.showToast)({
        style: import_api3.Toast.Style.Failure,
        title: "Failed to load scheduled posts",
        message: String(err)
      });
    } finally {
      setIsLoading(false);
    }
  }
  (0, import_react2.useEffect)(() => {
    loadPosts();
  }, []);
  async function handleDelete(id, wordName) {
    const success = await deleteScheduledPost(id);
    if (success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      await (0, import_api3.showToast)({
        style: import_api3.Toast.Style.Success,
        title: "Schedule Cancelled",
        message: `Cancelled schedule for "${capitalize2(wordName)}"`
      });
    }
  }
  async function handlePostNow(post) {
    const prefs = (0, import_api3.getPreferenceValues)();
    const botToken = prefs.telegramBotToken?.trim();
    const chatId = prefs.telegramChatId?.trim();
    if (!botToken || !chatId) {
      await (0, import_api3.showToast)({
        style: import_api3.Toast.Style.Failure,
        title: "Telegram Credentials Missing",
        message: "Please configure Telegram Bot Token and Chat ID in preferences."
      });
      return;
    }
    const toast = await (0, import_api3.showToast)({
      style: import_api3.Toast.Style.Animated,
      title: `Posting "${capitalize2(post.wordName)}" now...`
    });
    const res = await postToTelegramChannel(
      botToken,
      chatId,
      post.formattedText
    );
    if (res.success) {
      post.status = "sent";
      post.sentAt = (/* @__PURE__ */ new Date()).toISOString();
      const updated = posts.map((p) => p.id === post.id ? post : p);
      await saveAllScheduledPosts(updated);
      setPosts(updated);
      toast.style = import_api3.Toast.Style.Success;
      toast.title = "Posted to Telegram";
    } else {
      post.status = "failed";
      post.error = res.message;
      const updated = posts.map((p) => p.id === post.id ? post : p);
      await saveAllScheduledPosts(updated);
      setPosts(updated);
      toast.style = import_api3.Toast.Style.Failure;
      toast.title = "Posting Failed";
      toast.message = res.message;
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_api3.List,
    {
      isLoading,
      isShowingDetail: true,
      searchBarPlaceholder: "Filter scheduled words...",
      children: posts.length === 0 && !isLoading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_api3.List.EmptyView,
        {
          icon: import_api3.Icon.Calendar,
          title: "No Scheduled Posts",
          description: "Use 'Schedule for Telegram' when inspecting a word to queue posts."
        }
      ) : posts.map((post) => {
        const dateObj = new Date(post.scheduledAt);
        const dateStr = dateObj.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        });
        let tagColor = import_api3.Color.Yellow;
        let tagText = "Pending";
        if (post.status === "sent") {
          tagColor = import_api3.Color.Green;
          tagText = "Sent";
        } else if (post.status === "processing") {
          tagColor = import_api3.Color.Blue;
          tagText = "Posting...";
        } else if (post.status === "failed") {
          tagColor = import_api3.Color.Red;
          tagText = "Failed";
        }
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_api3.List.Item,
          {
            title: capitalize2(post.wordName),
            subtitle: dateStr,
            keywords: [post.wordName, tagText, post.status],
            accessories: [{ tag: { value: tagText, color: tagColor } }],
            detail: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              import_api3.List.Item.Detail,
              {
                markdown: post.formattedText,
                metadata: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_api3.List.Item.Detail.Metadata, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    import_api3.List.Item.Detail.Metadata.Label,
                    {
                      title: "Scheduled Date & Time",
                      text: dateStr
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_api3.List.Item.Detail.Metadata.TagList, { title: "Status", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    import_api3.List.Item.Detail.Metadata.TagList.Item,
                    {
                      text: tagText,
                      color: tagColor
                    }
                  ) }),
                  post.sentAt && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    import_api3.List.Item.Detail.Metadata.Label,
                    {
                      title: "Sent At",
                      text: new Date(post.sentAt).toLocaleString()
                    }
                  ),
                  post.error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    import_api3.List.Item.Detail.Metadata.Label,
                    {
                      title: "Error",
                      text: post.error
                    }
                  )
                ] })
              }
            ),
            actions: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_api3.ActionPanel, { children: [
              post.status !== "sent" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                import_api3.Action,
                {
                  title: "Post to Telegram Now",
                  icon: import_api3.Icon.Paperplane,
                  onAction: () => handlePostNow(post)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                import_api3.Action,
                {
                  title: "Cancel / Delete Schedule",
                  icon: import_api3.Icon.Trash,
                  style: import_api3.Action.Style.Destructive,
                  shortcut: import_api3.Keyboard.Shortcut.Common.Remove,
                  onAction: () => handleDelete(post.id, post.wordName)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                import_api3.Action,
                {
                  title: "Refresh List",
                  icon: import_api3.Icon.ArrowClockwise,
                  shortcut: import_api3.Keyboard.Shortcut.Common.Refresh,
                  onAction: loadPosts
                }
              )
            ] })
          },
          post.id
        );
      })
    }
  );
}

// src/know-about-words.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var execFilePromise = (0, import_util.promisify)(import_child_process.execFile);
var execPromise = (0, import_util.promisify)(import_child_process.exec);
function getWordsDir(wordsDirectoryPref) {
  const resolved = wordsDirectoryPref || "~/words";
  if (resolved.startsWith("~/")) {
    return import_path2.default.join(import_os2.default.homedir(), resolved.slice(2));
  }
  return import_path2.default.resolve(resolved);
}
function capitalize3(s) {
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
      parts.push(capitalize3(boldMatch[1].toLowerCase()));
    }
  }
  if (parts.length > 0) {
    return parts.join(", ");
  }
  const match = markdown.match(
    /^##\s+(Noun|Verb|Adjective|Adverb|Preposition|Conjunction|Pronoun|Interjection)/im
  );
  return match ? capitalize3(match[1].toLowerCase()) : "";
}
function getPromptForWord(word) {
  return PROMPT.replace("{word}", word);
}
var supportPath = import_api4.environment.supportPath;
var swiftFilePath = import_path2.default.join(supportPath, "lookup.swift");
var binaryPath = import_path2.default.join(supportPath, "lookup");
var isCompilingPromise = null;
var compileSuccess = false;
async function ensureLookupCompiled() {
  if (compileSuccess) return true;
  if (isCompilingPromise) return isCompilingPromise;
  isCompilingPromise = (async () => {
    try {
      await import_promises2.default.mkdir(supportPath, { recursive: true });
      await import_promises2.default.writeFile(swiftFilePath, SWIFT_LOOKUP_CODE);
      try {
        await import_promises2.default.access(binaryPath);
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
    return `# ${capitalize3(word)}

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
  const formattedTitle = head ? capitalize3(head) : capitalize3(word);
  let result = `# ${formattedTitle}
`;
  for (const seg of segments) {
    const posLabel = capitalize3(seg.pos.toLowerCase());
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
  const preferences = (0, import_api4.getPreferenceValues)();
  const wordsDir = (0, import_react3.useMemo)(
    () => getWordsDir(preferences.wordsDirectory),
    [preferences.wordsDirectory]
  );
  const [words, setWords] = (0, import_react3.useState)({});
  const [sortBy, setSortBy] = (0, import_react3.useState)("date-newest");
  const [loadingHistory, setLoadingHistory] = (0, import_react3.useState)(true);
  const [isSearching, setIsSearching] = (0, import_react3.useState)(false);
  const [searchText, setSearchText] = (0, import_react3.useState)("");
  const [selectedId, setSelectedId] = (0, import_react3.useState)(void 0);
  const programmaticSelectionRef = (0, import_react3.useRef)(null);
  const [lookupError, setLookupError] = (0, import_react3.useState)(null);
  const [localDefinition, setLocalDefinition] = (0, import_react3.useState)(null);
  const [loadingLocalDefinition, setLoadingLocalDefinition] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    if (lookupError && lookupError.word !== searchText.trim()) {
      setLookupError(null);
    }
  }, [searchText, lookupError]);
  (0, import_react3.useEffect)(() => {
    if (programmaticSelectionRef.current !== null) {
      const timer = setTimeout(() => {
        programmaticSelectionRef.current = null;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchText, selectedId]);
  (0, import_react3.useEffect)(() => {
    async function initAndLoad() {
      try {
        if (preferences.telegramBotToken && preferences.telegramChatId) {
          processPendingPosts(
            preferences.telegramBotToken.trim(),
            preferences.telegramChatId.trim()
          ).catch(
            (err) => console.error("Background scheduled check error:", err)
          );
        }
        await import_promises2.default.mkdir(wordsDir, { recursive: true });
        const files = await import_promises2.default.readdir(wordsDir);
        const mdFiles = files.filter((file) => file.endsWith(".md"));
        const filePromises = mdFiles.map(async (file) => {
          const wordName = file.slice(0, -3).toLowerCase();
          const filePath = import_path2.default.join(wordsDir, file);
          const stat = await import_promises2.default.stat(filePath);
          const content = await import_promises2.default.readFile(filePath, "utf-8");
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
        (0, import_api4.showToast)({
          style: import_api4.Toast.Style.Failure,
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
  (0, import_react3.useEffect)(() => {
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
  const sortedAndFilteredWords = (0, import_react3.useMemo)(() => {
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
  const showLookupItem = (0, import_react3.useMemo)(() => {
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
    const toast = await (0, import_api4.showToast)({
      style: import_api4.Toast.Style.Animated,
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
      const filePath = import_path2.default.join(wordsDir, `${aiWordName}.md`);
      await import_promises2.default.writeFile(filePath, resultMarkdown.trim());
      const stat = await import_promises2.default.stat(filePath);
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
      toast.style = import_api4.Toast.Style.Success;
      toast.title = "Word Saved";
      toast.message = `${capitalize3(aiWordName)} added to database`;
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
        toast.style = import_api4.Toast.Style.Failure;
        toast.title = "No Internet Connection";
        toast.message = "Internet is not connected. Please check your network and try again.";
      } else if (err instanceof RateLimitError || errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit")) {
        setLookupError({
          word: wordToLookup,
          type: "rate-limit",
          message: "Rate limit reached. This rate limit will take some time, please try again later."
        });
        toast.style = import_api4.Toast.Style.Failure;
        toast.title = "Rate Limit Reached";
        toast.message = "Rate limit reached. Try again later.";
      } else {
        setLookupError({
          word: wordToLookup,
          type: "other",
          message: errMsg
        });
        toast.style = import_api4.Toast.Style.Failure;
        toast.title = "Lookup Failed";
        toast.message = errMsg;
      }
    } finally {
      setIsSearching(false);
    }
  }
  async function handleOpenFile(wordName) {
    const filePath = import_path2.default.join(wordsDir, `${wordName.toLowerCase()}.md`);
    try {
      await (0, import_api4.open)(filePath);
    } catch (err) {
      (0, import_api4.showToast)({
        style: import_api4.Toast.Style.Failure,
        title: "Could not open file",
        message: String(err)
      });
    }
  }
  async function handleRevealInFinder(wordName) {
    const filePath = import_path2.default.join(wordsDir, `${wordName.toLowerCase()}.md`);
    try {
      await (0, import_api4.showInFinder)(filePath);
    } catch (err) {
      (0, import_api4.showToast)({
        style: import_api4.Toast.Style.Failure,
        title: "Could not reveal file",
        message: String(err)
      });
    }
  }
  async function handleDelete(wordName) {
    const filePath = import_path2.default.join(wordsDir, `${wordName.toLowerCase()}.md`);
    const toast = await (0, import_api4.showToast)({
      style: import_api4.Toast.Style.Animated,
      title: `Deleting "${capitalize3(wordName)}"...`
    });
    try {
      await import_promises2.default.unlink(filePath);
      setWords((prev) => {
        const next = { ...prev };
        delete next[wordName];
        return next;
      });
      toast.style = import_api4.Toast.Style.Success;
      toast.title = "Word Deleted";
      toast.message = `Removed ${capitalize3(wordName)} from database`;
    } catch (err) {
      toast.style = import_api4.Toast.Style.Failure;
      toast.title = "Delete Failed";
      toast.message = String(err);
    }
  }
  async function handleCopyTelegramText(wordName, content) {
    const telegramText = formatForTelegram(content);
    await import_api4.Clipboard.copy(telegramText);
    await (0, import_api4.showToast)({
      style: import_api4.Toast.Style.Success,
      title: "Copied Telegram Text",
      message: `${capitalize3(wordName)} copied in Telegram-friendly format`
    });
  }
  async function handlePostToTelegramChannel(wordName, content) {
    const botToken = preferences.telegramBotToken;
    const chatId = preferences.telegramChatId;
    if (!botToken || !chatId) {
      await (0, import_api4.showToast)({
        style: import_api4.Toast.Style.Failure,
        title: "Telegram Credentials Missing",
        message: "Please configure Telegram Bot Token and Chat ID in Extension Preferences."
      });
      return;
    }
    const toast = await (0, import_api4.showToast)({
      style: import_api4.Toast.Style.Animated,
      title: `Posting "${capitalize3(wordName)}" to Telegram...`
    });
    const telegramText = formatForTelegram(content);
    const res = await postToTelegramChannel(botToken, chatId, telegramText);
    if (res.success) {
      toast.style = import_api4.Toast.Style.Success;
      toast.title = "Posted to Telegram Channel";
      toast.message = `${capitalize3(wordName)} sent to ${chatId}`;
    } else {
      toast.style = import_api4.Toast.Style.Failure;
      toast.title = "Failed to Post to Telegram";
      toast.message = res.message || "Unknown error";
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    import_api4.List,
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
      searchBarAccessory: Object.keys(words).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        import_api4.List.Dropdown,
        {
          tooltip: "Sort Words",
          onChange: setSortBy,
          value: sortBy,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_api4.List.Dropdown.Item, { title: "Recently Added", value: "date-newest" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_api4.List.Dropdown.Item, { title: "Oldest Added", value: "date-oldest" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_api4.List.Dropdown.Item,
              {
                title: "Alphabetical (A-Z)",
                value: "alphabetical-asc"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_api4.List.Dropdown.Item,
              {
                title: "Alphabetical (Z-A)",
                value: "alphabetical-desc"
              }
            )
          ]
        }
      ) : void 0,
      children: [
        showLookupItem && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_api4.List.Section, { title: "AI Lookup", children: lookupError && lookupError.word.toLowerCase() === cleanSearchText.toLowerCase() ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_api4.List.Item,
          {
            id: "lookup-item-error",
            title: `Lookup Failed for "${cleanSearchText}"`,
            subtitle: lookupError.type === "rate-limit" ? "Rate Limit Reached" : lookupError.type === "network" ? "No Internet" : "Error",
            icon: { source: import_api4.Icon.ExclamationMark, color: import_api4.Color.Red },
            actions: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_api4.ActionPanel, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Retry Lookup",
                  icon: import_api4.Icon.Repeat,
                  onAction: () => handleLookup(cleanSearchText)
                }
              ),
              lookupError.type === "rate-limit" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  import_api4.Action.OpenInBrowser,
                  {
                    title: "Search on Google",
                    icon: import_api4.Icon.Globe,
                    url: `https://www.google.com/search?q=${encodeURIComponent(cleanSearchText + " meaning")}`
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  import_api4.Action.OpenInBrowser,
                  {
                    title: "Open ChatGPT",
                    icon: import_api4.Icon.Message,
                    url: `https://chatgpt.com/?q=${encodeURIComponent(getPromptForWord(cleanSearchText))}`
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  import_api4.Action,
                  {
                    title: "Copy Prompt",
                    icon: import_api4.Icon.CopyClipboard,
                    onAction: async () => {
                      await import_api4.Clipboard.copy(
                        getPromptForWord(cleanSearchText)
                      );
                      await (0, import_api4.showToast)({
                        style: import_api4.Toast.Style.Success,
                        title: "Prompt Copied",
                        message: "Designated ChatGPT prompt copied to clipboard"
                      });
                    }
                  }
                )
              ] })
            ] }),
            detail: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_api4.List.Item.Detail,
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
        ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_api4.List.Item,
          {
            id: "lookup-item",
            title: `Search Gemini for "${cleanSearchText}"`,
            icon: import_api4.Icon.Globe,
            actions: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_api4.ActionPanel, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_api4.Action,
              {
                title: "Lookup Word",
                icon: import_api4.Icon.MagnifyingGlass,
                onAction: () => handleLookup(cleanSearchText)
              }
            ) }),
            detail: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_api4.List.Item.Detail,
              {
                markdown: loadingLocalDefinition ? `# ${capitalize3(cleanSearchText)}

*Searching local dictionary...*` : localDefinition ? `${formatLocalDefinition(cleanSearchText, localDefinition)}

---

\u{1F4A1} *Press **Enter** to look up on Gemini AI and save this word with Hindi meaning, examples, etymology, etc.*` : `# ${capitalize3(cleanSearchText)}

*Definition not found in local dictionary.*

---

\u{1F4A1} *Press **Enter** to look up on Gemini AI and save this word with Hindi meaning, examples, etymology, etc.*`
              }
            )
          }
        ) }),
        sortedAndFilteredWords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_api4.List.Section, { title: "Saved Vocabulary", children: sortedAndFilteredWords.map((wordItem) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_api4.List.Item,
          {
            id: wordItem.name,
            title: capitalize3(wordItem.name),
            subtitle: getSubtitle(wordItem.content),
            accessories: [
              {
                tag: {
                  value: getPartOfSpeech(wordItem.content),
                  color: import_api4.Color.Blue
                }
              }
            ],
            detail: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_api4.List.Item.Detail, { markdown: wordItem.content }),
            actions: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_api4.ActionPanel, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Copy Telegram Text",
                  icon: import_api4.Icon.CopyClipboard,
                  shortcut: import_api4.Keyboard.Shortcut.Common.Copy,
                  onAction: () => handleCopyTelegramText(wordItem.name, wordItem.content)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Post to Telegram Channel",
                  icon: import_api4.Icon.Paperplane,
                  shortcut: { modifiers: ["cmd", "shift"], key: "return" },
                  onAction: () => handlePostToTelegramChannel(
                    wordItem.name,
                    wordItem.content
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action.Push,
                {
                  title: "Schedule for Telegram\u2026",
                  icon: import_api4.Icon.Calendar,
                  shortcut: import_api4.Keyboard.Shortcut.Common.Save,
                  target: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    ScheduleForm,
                    {
                      wordName: wordItem.name,
                      markdownContent: wordItem.content
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action.Push,
                {
                  title: "View Scheduled Posts",
                  icon: import_api4.Icon.Clock,
                  shortcut: { modifiers: ["ctrl"], key: "l" },
                  target: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ScheduledList, {})
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Copy Markdown",
                  icon: import_api4.Icon.CopyClipboard,
                  onAction: async () => {
                    await import_api4.Clipboard.copy(wordItem.content);
                    await (0, import_api4.showToast)({
                      style: import_api4.Toast.Style.Success,
                      title: "Copied to Clipboard",
                      message: `${capitalize3(wordItem.name)} markdown copied`
                    });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Open File",
                  icon: import_api4.Icon.Document,
                  onAction: () => handleOpenFile(wordItem.name)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Reveal in Finder",
                  icon: import_api4.Icon.Finder,
                  onAction: () => handleRevealInFinder(wordItem.name)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Refresh Word",
                  icon: import_api4.Icon.Repeat,
                  shortcut: import_api4.Keyboard.Shortcut.Common.Refresh,
                  onAction: () => handleLookup(wordItem.name, true)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                import_api4.Action,
                {
                  title: "Delete Word",
                  icon: import_api4.Icon.Trash,
                  style: import_api4.Action.Style.Destructive,
                  shortcut: { modifiers: ["ctrl"], key: "x" },
                  onAction: () => handleDelete(wordItem.name)
                }
              )
            ] })
          },
          wordItem.name
        )) }) : !showLookupItem && !loadingHistory && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_api4.List.EmptyView,
          {
            title: "Your vocabulary is empty",
            description: "Type a word in the search bar and press Enter to query Gemini AI.",
            icon: import_api4.Icon.Book
          }
        )
      ]
    }
  );
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9rbm93LWFib3V0LXdvcmRzLnRzeCIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3Byb21wdC50cyIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL2xvb2t1cC1zd2lmdC50cyIsICIuLi8uLi8uLi8uLi9naXRyZXBvcy9kb3RmaWxlcy9tYWNPUy9jb25maWdzL3JheWNhc3QvZXh0ZW5zaW9ucy9lbmdsaXNoLXdvcmRzLXdpdGgtaGluZGkvc3JjL3RlbGVncmFtLnRzIiwgIi4uLy4uLy4uLy4uL2dpdHJlcG9zL2RvdGZpbGVzL21hY09TL2NvbmZpZ3MvcmF5Y2FzdC9leHRlbnNpb25zL2VuZ2xpc2gtd29yZHMtd2l0aC1oaW5kaS9zcmMvc2NoZWR1bGUtZm9ybS50c3giLCAiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9zY2hlZHVsZXIudHMiLCAiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9zY2hlZHVsZWQtbGlzdC50c3giXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7XG4gIEFjdGlvbixcbiAgQWN0aW9uUGFuZWwsXG4gIExpc3QsXG4gIHNob3dUb2FzdCxcbiAgVG9hc3QsXG4gIGdldFByZWZlcmVuY2VWYWx1ZXMsXG4gIG9wZW4sXG4gIHNob3dJbkZpbmRlcixcbiAgSWNvbixcbiAgQ29sb3IsXG4gIENsaXBib2FyZCxcbiAgZW52aXJvbm1lbnQsXG4gIEtleWJvYXJkLFxufSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCBvcyBmcm9tIFwib3NcIjtcbmltcG9ydCB7IFBST01QVCB9IGZyb20gXCIuL3Byb21wdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGV4ZWMsIGV4ZWNGaWxlIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gXCJ1dGlsXCI7XG5pbXBvcnQgeyBTV0lGVF9MT09LVVBfQ09ERSB9IGZyb20gXCIuL2xvb2t1cC1zd2lmdFwiO1xuaW1wb3J0IHsgZm9ybWF0Rm9yVGVsZWdyYW0sIHBvc3RUb1RlbGVncmFtQ2hhbm5lbCB9IGZyb20gXCIuL3RlbGVncmFtXCI7XG5pbXBvcnQgeyBTY2hlZHVsZUZvcm0gfSBmcm9tIFwiLi9zY2hlZHVsZS1mb3JtXCI7XG5pbXBvcnQgeyBTY2hlZHVsZWRMaXN0IH0gZnJvbSBcIi4vc2NoZWR1bGVkLWxpc3RcIjtcbmltcG9ydCB7IHByb2Nlc3NQZW5kaW5nUG9zdHMgfSBmcm9tIFwiLi9zY2hlZHVsZXJcIjtcblxuY29uc3QgZXhlY0ZpbGVQcm9taXNlID0gcHJvbWlzaWZ5KGV4ZWNGaWxlKTtcbmNvbnN0IGV4ZWNQcm9taXNlID0gcHJvbWlzaWZ5KGV4ZWMpO1xuXG4vLyBEZWZpbmUgdGhlIHByZWZlcmVuY2VzIGludGVyZmFjZSBtYXRjaGluZyBwYWNrYWdlLmpzb25cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIGdlbWluaUFwaUtleTogc3RyaW5nO1xuICB3b3Jkc0RpcmVjdG9yeTogc3RyaW5nO1xuICBnZW1pbmlNb2RlbDogc3RyaW5nO1xuICB0ZWxlZ3JhbUJvdFRva2VuPzogc3RyaW5nO1xuICB0ZWxlZ3JhbUNoYXRJZD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFdvcmRJdGVtIHtcbiAgbmFtZTogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogbnVtYmVyO1xuICB1cGRhdGVkQXQ6IG51bWJlcjtcbn1cblxuZnVuY3Rpb24gZ2V0V29yZHNEaXIod29yZHNEaXJlY3RvcnlQcmVmOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXNvbHZlZCA9IHdvcmRzRGlyZWN0b3J5UHJlZiB8fCBcIn4vd29yZHNcIjtcbiAgaWYgKHJlc29sdmVkLnN0YXJ0c1dpdGgoXCJ+L1wiKSkge1xuICAgIHJldHVybiBwYXRoLmpvaW4ob3MuaG9tZWRpcigpLCByZXNvbHZlZC5zbGljZSgyKSk7XG4gIH1cbiAgcmV0dXJuIHBhdGgucmVzb2x2ZShyZXNvbHZlZCk7XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFzKSByZXR1cm4gXCJcIjtcbiAgcmV0dXJuIHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpO1xufVxuXG5mdW5jdGlvbiBnZXRTdWJ0aXRsZShtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5zcGxpdChcIlxcblwiKTtcbiAgY29uc3QgaGluZGlFcXVpdmFsZW50SW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGwpID0+XG4gICAgbC5pbmNsdWRlcyhcIiMjIEhpbmRpIEVxdWl2YWxlbnRcIiksXG4gICk7XG4gIGlmIChoaW5kaUVxdWl2YWxlbnRJbmRleCAhPT0gLTEgJiYgbGluZXNbaGluZGlFcXVpdmFsZW50SW5kZXggKyAxXSkge1xuICAgIGNvbnN0IG1lYW5pbmdMaW5lID0gbGluZXNbaGluZGlFcXVpdmFsZW50SW5kZXggKyAxXS50cmltKCk7XG4gICAgaWYgKG1lYW5pbmdMaW5lKSByZXR1cm4gbWVhbmluZ0xpbmU7XG4gIH1cblxuICAvLyBGYWxsYmFjazogc2VhcmNoIGZvciBIaW5kaSBwcm9udW5jaWF0aW9uIGluIHRoZSB0aXRsZVxuICBjb25zdCB0aXRsZU1hdGNoID0gbWFya2Rvd24ubWF0Y2goL14jXFxzK1teKF0rXFwoKFteKV0rKVxcKS9tKTtcbiAgaWYgKHRpdGxlTWF0Y2ggJiYgdGl0bGVNYXRjaFsxXSkge1xuICAgIHJldHVybiB0aXRsZU1hdGNoWzFdO1xuICB9XG4gIHJldHVybiBcIlwiO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJ0T2ZTcGVlY2gobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBib2xkTWF0Y2ggPSBsaW5lLm1hdGNoKFxuICAgICAgL14oPzotXFxzKyk/XFwqXFwqKE5vdW58VmVyYnxBZGplY3RpdmV8QWR2ZXJifFByZXBvc2l0aW9ufENvbmp1bmN0aW9ufFByb25vdW58SW50ZXJqZWN0aW9uKTpcXCpcXCovaSxcbiAgICApO1xuICAgIGlmIChib2xkTWF0Y2gpIHtcbiAgICAgIHBhcnRzLnB1c2goY2FwaXRhbGl6ZShib2xkTWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkpO1xuICAgIH1cbiAgfVxuICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJ0cy5qb2luKFwiLCBcIik7XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBvbGRlciBoZWFkZXIgZm9ybWF0XG4gIGNvbnN0IG1hdGNoID0gbWFya2Rvd24ubWF0Y2goXG4gICAgL14jI1xccysoTm91bnxWZXJifEFkamVjdGl2ZXxBZHZlcmJ8UHJlcG9zaXRpb258Q29uanVuY3Rpb258UHJvbm91bnxJbnRlcmplY3Rpb24pL2ltLFxuICApO1xuICByZXR1cm4gbWF0Y2ggPyBjYXBpdGFsaXplKG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkpIDogXCJcIjtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvbXB0Rm9yV29yZCh3b3JkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gUFJPTVBULnJlcGxhY2UoXCJ7d29yZH1cIiwgd29yZCk7XG59XG5cbmNvbnN0IHN1cHBvcnRQYXRoID0gZW52aXJvbm1lbnQuc3VwcG9ydFBhdGg7XG5jb25zdCBzd2lmdEZpbGVQYXRoID0gcGF0aC5qb2luKHN1cHBvcnRQYXRoLCBcImxvb2t1cC5zd2lmdFwiKTtcbmNvbnN0IGJpbmFyeVBhdGggPSBwYXRoLmpvaW4oc3VwcG9ydFBhdGgsIFwibG9va3VwXCIpO1xuXG5sZXQgaXNDb21waWxpbmdQcm9taXNlOiBQcm9taXNlPGJvb2xlYW4+IHwgbnVsbCA9IG51bGw7XG5sZXQgY29tcGlsZVN1Y2Nlc3MgPSBmYWxzZTtcblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlTG9va3VwQ29tcGlsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGlmIChjb21waWxlU3VjY2VzcykgcmV0dXJuIHRydWU7XG4gIGlmIChpc0NvbXBpbGluZ1Byb21pc2UpIHJldHVybiBpc0NvbXBpbGluZ1Byb21pc2U7XG5cbiAgaXNDb21waWxpbmdQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMubWtkaXIoc3VwcG9ydFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHN3aWZ0RmlsZVBhdGgsIFNXSUZUX0xPT0tVUF9DT0RFKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgYmluYXJ5IGFscmVhZHkgZXhpc3RzIGFuZCB3b3Jrc1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuYWNjZXNzKGJpbmFyeVBhdGgpO1xuICAgICAgICBjb21waWxlU3VjY2VzcyA9IHRydWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIEJpbmFyeSBkb2Vzbid0IGV4aXN0LCBsZXQncyBjb21waWxlIGl0XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZXhlY1Byb21pc2UoYHN3aWZ0YyAtTyBcIiR7c3dpZnRGaWxlUGF0aH1cIiAtbyBcIiR7YmluYXJ5UGF0aH1cImApO1xuICAgICAgICAgIGNvbXBpbGVTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIFwiU3dpZnQgY29tcGlsYXRpb24gZmFpbGVkLCB3aWxsIHVzZSBmYWxsYmFjayBydW5uZXI6XCIsXG4gICAgICAgICAgICBlcnIsXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZXR0aW5nIHVwIGxvb2t1cCBmaWxlczpcIiwgZXJyKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pKCk7XG5cbiAgcmV0dXJuIGlzQ29tcGlsaW5nUHJvbWlzZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9va3VwTG9jYWxEaWN0aW9uYXJ5KHdvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmQudHJpbSgpO1xuICBpZiAoIW5vcm1hbGl6ZWRXb3JkKSByZXR1cm4gbnVsbDtcblxuICAvLyAxLiBUcnkgY29tcGlsZWQgYmluYXJ5XG4gIGNvbnN0IGlzQ29tcGlsZWQgPSBhd2FpdCBlbnN1cmVMb29rdXBDb21waWxlZCgpO1xuICBpZiAoaXNDb21waWxlZCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHN0ZG91dCB9ID0gYXdhaXQgZXhlY0ZpbGVQcm9taXNlKGJpbmFyeVBhdGgsIFtub3JtYWxpemVkV29yZF0pO1xuICAgICAgaWYgKHN0ZG91dC50cmltKCkpIHJldHVybiBzdGRvdXQudHJpbSgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gRXhpdCBjb2RlIDIgbWVhbnMgd29yZCBub3QgZm91bmQsIG90aGVyIGV4aXQgY29kZXMgbWVhbiBmYWlsdXJlXG4gICAgICBjb25zdCBlcnJvciA9IGVyciBhcyB7IGNvZGU/OiBudW1iZXIgfTtcbiAgICAgIGlmIChlcnJvci5jb2RlID09PSAyKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc29sZS5lcnJvcihcIkJpbmFyeSBleGVjdXRpb24gZmFpbGVkLCB0cnlpbmcgc2NyaXB0IGludGVycHJldGVyOlwiLCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIDIuIEZhbGxiYWNrOiBSdW4gU3dpZnQgc2NyaXB0IGRpcmVjdGx5IHZpYSBgc3dpZnRgIGNvbW1hbmQgbGluZSBpbnRlcnByZXRlclxuICB0cnkge1xuICAgIGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBleGVjRmlsZVByb21pc2UoXCJzd2lmdFwiLCBbXG4gICAgICBzd2lmdEZpbGVQYXRoLFxuICAgICAgbm9ybWFsaXplZFdvcmQsXG4gICAgXSk7XG4gICAgaWYgKHN0ZG91dC50cmltKCkpIHJldHVybiBzdGRvdXQudHJpbSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBlcnJvciA9IGVyciBhcyB7IGNvZGU/OiBudW1iZXIgfTtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gMikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoXCJTd2lmdCBzY3JpcHQgZXhlY3V0aW9uIGZhaWxlZCwgdHJ5aW5nIEFQSSBmYWxsYmFjazpcIiwgZXJyKTtcbiAgfVxuXG4gIC8vIDMuIEZhbGxiYWNrOiBPbmxpbmUgRGljdGlvbmFyeSBBUElcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgYGh0dHBzOi8vYXBpLmRpY3Rpb25hcnlhcGkuZGV2L2FwaS92Mi9lbnRyaWVzL2VuLyR7ZW5jb2RlVVJJQ29tcG9uZW50KG5vcm1hbGl6ZWRXb3JkKX1gLFxuICAgICk7XG4gICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICBpbnRlcmZhY2UgQVBJUmVzcG9uc2Uge1xuICAgICAgICB3b3JkOiBzdHJpbmc7XG4gICAgICAgIHBob25ldGljPzogc3RyaW5nO1xuICAgICAgICBtZWFuaW5nczogQXJyYXk8e1xuICAgICAgICAgIHBhcnRPZlNwZWVjaDogc3RyaW5nO1xuICAgICAgICAgIGRlZmluaXRpb25zOiBBcnJheTx7XG4gICAgICAgICAgICBkZWZpbml0aW9uOiBzdHJpbmc7XG4gICAgICAgICAgICBleGFtcGxlPzogc3RyaW5nO1xuICAgICAgICAgIH0+O1xuICAgICAgICB9PjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBBUElSZXNwb25zZVtdO1xuICAgICAgaWYgKGRhdGEgJiYgZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGVudHJ5ID0gZGF0YVswXTtcbiAgICAgICAgY29uc3QgcGhvbmV0aWMgPSBlbnRyeS5waG9uZXRpYyB8fCBcIlwiO1xuICAgICAgICBjb25zdCBwYXJ0c09mU3BlZWNoU3RyaW5ncyA9IGVudHJ5Lm1lYW5pbmdzLm1hcCgobSwgbUlkeCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRlZnMgPSBtLmRlZmluaXRpb25zXG4gICAgICAgICAgICAubWFwKChkLCBkSWR4KSA9PiBgJHtkSWR4ICsgMX0gJHtkLmRlZmluaXRpb259YClcbiAgICAgICAgICAgIC5qb2luKFwiIFx1MjAyMiBcIik7XG5cbiAgICAgICAgICBpZiAobUlkeCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGAke2VudHJ5LndvcmR9ICR7bS5wYXJ0T2ZTcGVlY2h9IHwgJHtwaG9uZXRpY30gfCAke2RlZnN9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGAgJHttLnBhcnRPZlNwZWVjaH0gfCAke3Bob25ldGljfSB8ICR7ZGVmc31gO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwYXJ0c09mU3BlZWNoU3RyaW5ncy5qb2luKFwiXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihcIk9ubGluZSBBUEkgZmFsbGJhY2sgZmFpbGVkOlwiLCBlcnIpO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdExvY2FsRGVmaW5pdGlvbih3b3JkOiBzdHJpbmcsIHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghdGV4dCkgcmV0dXJuIFwiXCI7XG5cbiAgY29uc3QgdHJpbW1lZCA9IHRleHQudHJpbSgpLnJlcGxhY2UoL1sgXFx0XSsvZywgXCIgXCIpO1xuXG4gIGNvbnN0IHBvc0xpc3QgPSBbXG4gICAgXCJub3VuXCIsXG4gICAgXCJ2ZXJiXCIsXG4gICAgXCJhZGplY3RpdmVcIixcbiAgICBcImFkdmVyYlwiLFxuICAgIFwicHJvbm91blwiLFxuICAgIFwicHJlcG9zaXRpb25cIixcbiAgICBcImNvbmp1bmN0aW9uXCIsXG4gICAgXCJpbnRlcmplY3Rpb25cIixcbiAgICBcInBsdXJhbCBub3VuXCIsXG4gICAgXCJpbnRyYW5zaXRpdmUgdmVyYlwiLFxuICAgIFwidHJhbnNpdGl2ZSB2ZXJiXCIsXG4gICAgXCJhZGplY3RpdmUgJiBhZHZlcmJcIixcbiAgICBcImRldGVybWluZXJcIixcbiAgICBcImV4Y2xhbWF0aW9uXCIsXG4gICAgXCJhYmJyZXZpYXRpb25cIixcbiAgXTtcblxuICBjb25zdCBwb3NSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgYFxcXFxiKCR7cG9zTGlzdC5qb2luKFwifFwiKX0pXFxcXGIoXFxcXHMqXFxcXFtbXlxcXFxdXStcXFxcXSk/XFxcXHMqKD86XFxcXHxcXFxccyooW158XSspXFxcXHMqXFxcXHx8XFxcXHMrKFsxLTldXFxcXGJ8XFxcXFtubyBvYmplY3RcXFxcXXxcXFxcW3dpdGggb2JqZWN0XFxcXF0pKWAsXG4gICAgXCJnaVwiLFxuICApO1xuXG4gIGNvbnN0IGZpcnN0UGlwZSA9IHRyaW1tZWQuaW5kZXhPZihcInxcIik7XG4gIGxldCBzZWNvbmRQaXBlID0gLTE7XG4gIGlmIChmaXJzdFBpcGUgIT09IC0xKSB7XG4gICAgc2Vjb25kUGlwZSA9IHRyaW1tZWQuaW5kZXhPZihcInxcIiwgZmlyc3RQaXBlICsgMSk7XG4gIH1cblxuICBpZiAoZmlyc3RQaXBlID09PSAtMSB8fCBzZWNvbmRQaXBlID09PSAtMSkge1xuICAgIGxldCBmb3JtYXR0ZWQgPSB0cmltbWVkLnJlcGxhY2UoL1x1MjAyMi9nLCBcIlxcblx1MjAyMiBcIik7XG4gICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UoL1xccysoWzEtOV0pXFxzKyg/PVthLXpBLVpdKS9nLCBcIlxcblxcbioqJDEuKiogXCIpO1xuICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKFxuICAgICAgL1xcYihQSFJBU0VTfE9SSUdJTnxERVJJVkFUSVZFU3xVU0FHRXxQSFJBU0FMIFZFUkJTKVxcYi9nLFxuICAgICAgXCJcXG5cXG4jIyMgJDFcXG5cIixcbiAgICApO1xuICAgIHJldHVybiBgIyAke2NhcGl0YWxpemUod29yZCl9XFxuXFxuJHtmb3JtYXR0ZWR9YDtcbiAgfVxuXG4gIGxldCBoZWFkID0gdHJpbW1lZC5zdWJzdHJpbmcoMCwgZmlyc3RQaXBlKS50cmltKCk7XG4gIGNvbnN0IHByb24gPSB0cmltbWVkLnN1YnN0cmluZyhmaXJzdFBpcGUgKyAxLCBzZWNvbmRQaXBlKS50cmltKCk7XG4gIGxldCByZXN0ID0gdHJpbW1lZC5zdWJzdHJpbmcoc2Vjb25kUGlwZSArIDEpLnRyaW0oKTtcblxuICBsZXQgZmlyc3RQb3MgPSBcIlwiO1xuICBsZXQgZmlyc3REZXRhaWxzID0gXCJcIjtcbiAgZm9yIChjb25zdCBwb3Mgb2YgcG9zTGlzdCkge1xuICAgIGNvbnN0IHBhdHRlcm4gPSBuZXcgUmVnRXhwKGBcXFxcYiR7cG9zfShcXFxccytcXFxcW1teXFxcXF1dK1xcXFxdKT8kYCwgXCJpXCIpO1xuICAgIGNvbnN0IG0gPSBoZWFkLm1hdGNoKHBhdHRlcm4pO1xuICAgIGlmIChtKSB7XG4gICAgICBmaXJzdFBvcyA9IHBvcztcbiAgICAgIGZpcnN0RGV0YWlscyA9IG1bMV0gfHwgXCJcIjtcbiAgICAgIGhlYWQgPSBoZWFkLnN1YnN0cmluZygwLCBtLmluZGV4KS50cmltKCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoIWZpcnN0UG9zKSB7XG4gICAgZm9yIChjb25zdCBwb3Mgb2YgcG9zTGlzdCkge1xuICAgICAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoYF4ke3Bvc31cXFxcYihcXFxccytcXFxcW1teXFxcXF1dK1xcXFxdKT9gLCBcImlcIik7XG4gICAgICBjb25zdCBtID0gcmVzdC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtKSB7XG4gICAgICAgIGZpcnN0UG9zID0gcG9zO1xuICAgICAgICBmaXJzdERldGFpbHMgPSBtWzFdIHx8IFwiXCI7XG4gICAgICAgIHJlc3QgPSByZXN0LnN1YnN0cmluZyhtWzBdLmxlbmd0aCkudHJpbSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBtYXRjaGVzOiB7XG4gICAgaW5kZXg6IG51bWJlcjtcbiAgICBsZW5ndGg6IG51bWJlcjtcbiAgICBwYXJ0T2ZTcGVlY2g6IHN0cmluZztcbiAgICBkZXRhaWxzOiBzdHJpbmc7XG4gICAgcHJvbnVuY2lhdGlvbjogc3RyaW5nO1xuICAgIGRlZlN0YXJ0VG9rZW46IHN0cmluZztcbiAgfVtdID0gW107XG5cbiAgbGV0IG1hdGNoO1xuICBwb3NSZWdleC5sYXN0SW5kZXggPSAwO1xuICB3aGlsZSAoKG1hdGNoID0gcG9zUmVnZXguZXhlYyhyZXN0KSkgIT09IG51bGwpIHtcbiAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgaW5kZXg6IG1hdGNoLmluZGV4LFxuICAgICAgbGVuZ3RoOiBtYXRjaFswXS5sZW5ndGgsXG4gICAgICBwYXJ0T2ZTcGVlY2g6IG1hdGNoWzFdLFxuICAgICAgZGV0YWlsczogbWF0Y2hbMl0gfHwgXCJcIixcbiAgICAgIHByb251bmNpYXRpb246IG1hdGNoWzNdIHx8IFwiXCIsXG4gICAgICBkZWZTdGFydFRva2VuOiBtYXRjaFs0XSB8fCBcIlwiLFxuICAgIH0pO1xuICB9XG5cbiAgaW50ZXJmYWNlIFNlZ21lbnQge1xuICAgIHBvczogc3RyaW5nO1xuICAgIGRldGFpbHM6IHN0cmluZztcbiAgICBwcm9uOiBzdHJpbmc7XG4gICAgdGV4dDogc3RyaW5nO1xuICB9XG4gIGNvbnN0IHNlZ21lbnRzOiBTZWdtZW50W10gPSBbXTtcblxuICBjb25zdCBmaXJzdFNlZ0VuZCA9IG1hdGNoZXMubGVuZ3RoID4gMCA/IG1hdGNoZXNbMF0uaW5kZXggOiByZXN0Lmxlbmd0aDtcbiAgc2VnbWVudHMucHVzaCh7XG4gICAgcG9zOiBmaXJzdFBvcyB8fCBcImRlZmluaXRpb25cIixcbiAgICBkZXRhaWxzOiBmaXJzdERldGFpbHMsXG4gICAgcHJvbjogcHJvbixcbiAgICB0ZXh0OiByZXN0LnN1YnN0cmluZygwLCBmaXJzdFNlZ0VuZCkudHJpbSgpLFxuICB9KTtcblxuICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBtYXRjaGVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICBjb25zdCBtID0gbWF0Y2hlc1tpZHhdO1xuICAgIGNvbnN0IGVuZFBvcyA9XG4gICAgICBpZHggKyAxIDwgbWF0Y2hlcy5sZW5ndGggPyBtYXRjaGVzW2lkeCArIDFdLmluZGV4IDogcmVzdC5sZW5ndGg7XG5cbiAgICBsZXQgbWF0Y2hMZW4gPSBtLmxlbmd0aDtcbiAgICBpZiAobS5kZWZTdGFydFRva2VuKSB7XG4gICAgICBjb25zdCBtYXRjaFN0ciA9IHJlc3Quc3Vic3RyaW5nKG0uaW5kZXgsIG0uaW5kZXggKyBtLmxlbmd0aCk7XG4gICAgICBjb25zdCB0b2tlbkluZGV4ID0gbWF0Y2hTdHIuaW5kZXhPZihtLmRlZlN0YXJ0VG9rZW4pO1xuICAgICAgaWYgKHRva2VuSW5kZXggIT09IC0xKSB7XG4gICAgICAgIG1hdGNoTGVuID0gdG9rZW5JbmRleDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBkZWZUZXh0ID0gcmVzdC5zdWJzdHJpbmcobS5pbmRleCArIG1hdGNoTGVuLCBlbmRQb3MpLnRyaW0oKTtcbiAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgIHBvczogbS5wYXJ0T2ZTcGVlY2gsXG4gICAgICBkZXRhaWxzOiBtLmRldGFpbHMsXG4gICAgICBwcm9uOiBtLnByb251bmNpYXRpb24gfHwgcHJvbixcbiAgICAgIHRleHQ6IGRlZlRleHQsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBmb3JtYXR0ZWRUaXRsZSA9IGhlYWQgPyBjYXBpdGFsaXplKGhlYWQpIDogY2FwaXRhbGl6ZSh3b3JkKTtcbiAgbGV0IHJlc3VsdCA9IGAjICR7Zm9ybWF0dGVkVGl0bGV9XFxuYDtcblxuICBmb3IgKGNvbnN0IHNlZyBvZiBzZWdtZW50cykge1xuICAgIGNvbnN0IHBvc0xhYmVsID0gY2FwaXRhbGl6ZShzZWcucG9zLnRvTG93ZXJDYXNlKCkpO1xuICAgIGNvbnN0IGRldGFpbHNMYWJlbCA9IHNlZy5kZXRhaWxzID8gYCAqJHtzZWcuZGV0YWlscy50cmltKCl9KmAgOiBcIlwiO1xuICAgIGNvbnN0IHByb25MYWJlbCA9IHNlZy5wcm9uLnRyaW0oKSA/IGAgKnwgJHtzZWcucHJvbi50cmltKCl9IHwqYCA6IFwiXCI7XG5cbiAgICBsZXQgdGV4dCA9IHNlZy50ZXh0O1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1x1MjAyMi9nLCBcIlxcblx1MjAyMiBcIik7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxzKyhbMS05XSlcXHMrKD89W2EtekEtWl0pL2csIFwiXFxuXFxuKiokMS4qKiBcIik7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZShcbiAgICAgIC9cXGIoUEhSQVNFU3xPUklHSU58REVSSVZBVElWRVN8VVNBR0V8UEhSQVNBTCBWRVJCUylcXGIvZyxcbiAgICAgIFwiXFxuXFxuIyMjICQxXFxuXCIsXG4gICAgKTtcblxuICAgIHJlc3VsdCArPSBgXFxuKioke3Bvc0xhYmVsfSoqJHtkZXRhaWxzTGFiZWx9JHtwcm9uTGFiZWx9XFxuJHt0ZXh0fVxcbmA7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5jbGFzcyBSYXRlTGltaXRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzID0gNDI5O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDb21tYW5kKCkge1xuICBjb25zdCBwcmVmZXJlbmNlcyA9IGdldFByZWZlcmVuY2VWYWx1ZXM8UHJlZmVyZW5jZXM+KCk7XG4gIGNvbnN0IHdvcmRzRGlyID0gdXNlTWVtbyhcbiAgICAoKSA9PiBnZXRXb3Jkc0RpcihwcmVmZXJlbmNlcy53b3Jkc0RpcmVjdG9yeSksXG4gICAgW3ByZWZlcmVuY2VzLndvcmRzRGlyZWN0b3J5XSxcbiAgKTtcblxuICBjb25zdCBbd29yZHMsIHNldFdvcmRzXSA9IHVzZVN0YXRlPFJlY29yZDxzdHJpbmcsIFdvcmRJdGVtPj4oe30pO1xuICBjb25zdCBbc29ydEJ5LCBzZXRTb3J0QnldID0gdXNlU3RhdGU8c3RyaW5nPihcImRhdGUtbmV3ZXN0XCIpO1xuICBjb25zdCBbbG9hZGluZ0hpc3RvcnksIHNldExvYWRpbmdIaXN0b3J5XSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbaXNTZWFyY2hpbmcsIHNldElzU2VhcmNoaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3NlYXJjaFRleHQsIHNldFNlYXJjaFRleHRdID0gdXNlU3RhdGUoXCJcIik7XG4gIGNvbnN0IFtzZWxlY3RlZElkLCBzZXRTZWxlY3RlZElkXSA9IHVzZVN0YXRlPHN0cmluZyB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKTtcbiAgY29uc3QgcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmID0gdXNlUmVmPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbbG9va3VwRXJyb3IsIHNldExvb2t1cEVycm9yXSA9IHVzZVN0YXRlPHtcbiAgICB3b3JkOiBzdHJpbmc7XG4gICAgdHlwZTogXCJyYXRlLWxpbWl0XCIgfCBcIm5ldHdvcmtcIiB8IFwib3RoZXJcIjtcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gIH0gfCBudWxsPihudWxsKTtcblxuICBjb25zdCBbbG9jYWxEZWZpbml0aW9uLCBzZXRMb2NhbERlZmluaXRpb25dID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtsb2FkaW5nTG9jYWxEZWZpbml0aW9uLCBzZXRMb2FkaW5nTG9jYWxEZWZpbml0aW9uXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAvLyBDbGVhciBsb29rdXAgZXJyb3Igd2hlbiBzZWFyY2ggdGV4dCBjaGFuZ2VzIHRvIHNvbWV0aGluZyBkaWZmZXJlbnRcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAobG9va3VwRXJyb3IgJiYgbG9va3VwRXJyb3Iud29yZCAhPT0gc2VhcmNoVGV4dC50cmltKCkpIHtcbiAgICAgIHNldExvb2t1cEVycm9yKG51bGwpO1xuICAgIH1cbiAgfSwgW3NlYXJjaFRleHQsIGxvb2t1cEVycm9yXSk7XG5cbiAgLy8gQ2xlYW51cCBwcm9ncmFtbWF0aWMgc2VsZWN0aW9uIHJlZiBhZnRlciB0aGUgbGlzdCBsYXlvdXQgdXBkYXRlc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfSwgMjAwKTtcbiAgICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIH1cbiAgfSwgW3NlYXJjaFRleHQsIHNlbGVjdGVkSWRdKTtcblxuICAvLyBMb2FkIHNhdmVkIHdvcmRzIGZyb20gdGhlIGRpcmVjdG9yeVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFzeW5jIGZ1bmN0aW9uIGluaXRBbmRMb2FkKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHByZWZlcmVuY2VzLnRlbGVncmFtQm90VG9rZW4gJiYgcHJlZmVyZW5jZXMudGVsZWdyYW1DaGF0SWQpIHtcbiAgICAgICAgICBwcm9jZXNzUGVuZGluZ1Bvc3RzKFxuICAgICAgICAgICAgcHJlZmVyZW5jZXMudGVsZWdyYW1Cb3RUb2tlbi50cmltKCksXG4gICAgICAgICAgICBwcmVmZXJlbmNlcy50ZWxlZ3JhbUNoYXRJZC50cmltKCksXG4gICAgICAgICAgKS5jYXRjaCgoZXJyKSA9PlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkJhY2tncm91bmQgc2NoZWR1bGVkIGNoZWNrIGVycm9yOlwiLCBlcnIpLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBmcy5ta2Rpcih3b3Jkc0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucmVhZGRpcih3b3Jkc0Rpcik7XG4gICAgICAgIGNvbnN0IG1kRmlsZXMgPSBmaWxlcy5maWx0ZXIoKGZpbGUpID0+IGZpbGUuZW5kc1dpdGgoXCIubWRcIikpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVQcm9taXNlcyA9IG1kRmlsZXMubWFwKGFzeW5jIChmaWxlKSA9PiB7XG4gICAgICAgICAgY29uc3Qgd29yZE5hbWUgPSBmaWxlLnNsaWNlKDAsIC0zKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBmaWxlKTtcbiAgICAgICAgICBjb25zdCBzdGF0ID0gYXdhaXQgZnMuc3RhdChmaWxlUGF0aCk7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3b3JkTmFtZSxcbiAgICAgICAgICAgIHdvcmRJdGVtOiB7XG4gICAgICAgICAgICAgIG5hbWU6IHdvcmROYW1lLFxuICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICBjcmVhdGVkQXQ6IHN0YXQuYmlydGh0aW1lTXMgfHwgc3RhdC5tdGltZU1zIHx8IERhdGUubm93KCksXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogc3RhdC5tdGltZU1zIHx8IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChmaWxlUHJvbWlzZXMpO1xuICAgICAgICBjb25zdCBsb2FkZWRXb3JkczogUmVjb3JkPHN0cmluZywgV29yZEl0ZW0+ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgcmVzIG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICBsb2FkZWRXb3Jkc1tyZXMud29yZE5hbWVdID0gcmVzLndvcmRJdGVtO1xuICAgICAgICB9XG4gICAgICAgIHNldFdvcmRzKGxvYWRlZFdvcmRzKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdm9jYWJ1bGFyeSBmaWxlc1wiLCBlcnIpO1xuICAgICAgICBzaG93VG9hc3Qoe1xuICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICAgIHRpdGxlOiBcIkZhaWxlZCB0byBsb2FkIHNhdmVkIHZvY2FidWxhcnlcIixcbiAgICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRMb2FkaW5nSGlzdG9yeShmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW5pdEFuZExvYWQoKTtcbiAgfSwgW3dvcmRzRGlyXSk7XG5cbiAgLy8gQ2xlYW4gYW5kIGZpbHRlciBzZWFyY2ggcXVlcnlcbiAgY29uc3QgY2xlYW5TZWFyY2hUZXh0ID0gc2VhcmNoVGV4dC50cmltKCk7XG5cbiAgLy8gRmV0Y2ggbG9jYWwgZGljdGlvbmFyeSBkZWZpbml0aW9uIGZvciBuZXcgd29yZHMgd2l0aCBkZWJvdW5jZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgY29uc3QgbG93ZXJRdWVyeSA9IGNsZWFuU2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghbG93ZXJRdWVyeSB8fCB3b3Jkc1tsb3dlclF1ZXJ5XSkge1xuICAgICAgc2V0TG9jYWxEZWZpbml0aW9uKG51bGwpO1xuICAgICAgc2V0TG9hZGluZ0xvY2FsRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0TG9hZGluZ0xvY2FsRGVmaW5pdGlvbih0cnVlKTtcbiAgICBzZXRMb2NhbERlZmluaXRpb24obnVsbCk7XG5cbiAgICBjb25zdCBoYW5kbGVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZWYgPSBhd2FpdCBsb29rdXBMb2NhbERpY3Rpb25hcnkobG93ZXJRdWVyeSk7XG4gICAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgICBzZXRMb2NhbERlZmluaXRpb24oZGVmKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJMb2NhbCBsb29rdXAgZmFpbGVkXCIsIGVycik7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoYWN0aXZlKSB7XG4gICAgICAgICAgc2V0TG9hZGluZ0xvY2FsRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAyNTApOyAvLyBEZWJvdW5jZSBsb29rdXAgYnkgMjUwbXMgdG8gb3B0aW1pemUgcHJvY2VzcyBzcGF3bmluZ1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgY2xlYXJUaW1lb3V0KGhhbmRsZXIpO1xuICAgIH07XG4gIH0sIFtjbGVhblNlYXJjaFRleHQsIHdvcmRzXSk7XG5cbiAgLy8gRmlsdGVyIGFuZCBzb3J0IGxvY2FsIHdvcmRzIG1hdGNoaW5nIHRoZSBzZWFyY2ggdGV4dFxuICBjb25zdCBzb3J0ZWRBbmRGaWx0ZXJlZFdvcmRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcXVlcnkgPSBjbGVhblNlYXJjaFRleHQudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIDEuIEZpbHRlclxuICAgIGNvbnN0IGZpbHRlcmVkID0gT2JqZWN0LnZhbHVlcyh3b3JkcykuZmlsdGVyKCh3b3JkSXRlbSkgPT4ge1xuICAgICAgaWYgKCFxdWVyeSkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gKFxuICAgICAgICB3b3JkSXRlbS5uYW1lLmluY2x1ZGVzKHF1ZXJ5KSB8fFxuICAgICAgICBnZXRTdWJ0aXRsZSh3b3JkSXRlbS5jb250ZW50KS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIDIuIFNvcnRcbiAgICByZXR1cm4gZmlsdGVyZWQuc29ydCgoYSwgYikgPT4ge1xuICAgICAgaWYgKHNvcnRCeSA9PT0gXCJhbHBoYWJldGljYWwtYXNjXCIpIHtcbiAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICB9IGVsc2UgaWYgKHNvcnRCeSA9PT0gXCJhbHBoYWJldGljYWwtZGVzY1wiKSB7XG4gICAgICAgIHJldHVybiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUpO1xuICAgICAgfSBlbHNlIGlmIChzb3J0QnkgPT09IFwiZGF0ZS1vbGRlc3RcIikge1xuICAgICAgICByZXR1cm4gYS5jcmVhdGVkQXQgLSBiLmNyZWF0ZWRBdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlZmF1bHQ6IGRhdGUtbmV3ZXN0XG4gICAgICAgIHJldHVybiBiLmNyZWF0ZWRBdCAtIGEuY3JlYXRlZEF0O1xuICAgICAgfVxuICAgIH0pO1xuICB9LCBbd29yZHMsIGNsZWFuU2VhcmNoVGV4dCwgc29ydEJ5XSk7XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHdlIHNob3VsZCBzaG93IHRoZSBcIlNlYXJjaCBHZW1pbmlcIiBpdGVtXG4gIGNvbnN0IHNob3dMb29rdXBJdGVtID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFjbGVhblNlYXJjaFRleHQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBsb3dlclF1ZXJ5ID0gY2xlYW5TZWFyY2hUZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gRG8gbm90IHNob3cgbG9va3VwIG9wdGlvbiBpZiBpdCBtYXRjaGVzIGEgc2F2ZWQgd29yZCBleGFjdGx5XG4gICAgcmV0dXJuICF3b3Jkc1tsb3dlclF1ZXJ5XTtcbiAgfSwgW3dvcmRzLCBjbGVhblNlYXJjaFRleHRdKTtcblxuICAvLyBIYW5kbGUgR2VtaW5pIEFQSSBsb29rdXBcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTG9va3VwKHdvcmRUb0xvb2t1cDogc3RyaW5nLCBmb3JjZVJlY3JlYXRlID0gZmFsc2UpIHtcbiAgICBjb25zdCBub3JtYWxpemVkV29yZCA9IHdvcmRUb0xvb2t1cC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWRXb3JkKSByZXR1cm47XG5cbiAgICBpZiAoIWZvcmNlUmVjcmVhdGUgJiYgd29yZHNbbm9ybWFsaXplZFdvcmRdKSB7XG4gICAgICBzZXRTZWxlY3RlZElkKG5vcm1hbGl6ZWRXb3JkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogZm9yY2VSZWNyZWF0ZVxuICAgICAgICA/IFwiUmUtZ2VuZXJhdGluZyB3b3JkIGVudHJ5Li4uXCJcbiAgICAgICAgOiBgTG9va2luZyB1cCBcIiR7d29yZFRvTG9va3VwfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIHNldElzU2VhcmNoaW5nKHRydWUpO1xuICAgIHNldExvb2t1cEVycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcGlLZXkgPSBwcmVmZXJlbmNlcy5nZW1pbmlBcGlLZXk7XG4gICAgICBpZiAoIWFwaUtleSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJHZW1pbmkgQVBJIGtleSBpcyBub3QgY29uZmlndXJlZCBpbiBleHRlbnNpb24gcHJlZmVyZW5jZXMuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZGVsID0gcHJlZmVyZW5jZXMuZ2VtaW5pTW9kZWwgfHwgXCJnZW1pbmktMy41LWZsYXNoXCI7XG4gICAgICBjb25zdCBwcm9tcHRUZXh0ID0gZ2V0UHJvbXB0Rm9yV29yZCh3b3JkVG9Mb29rdXApO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgICBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy8ke21vZGVsfTpnZW5lcmF0ZUNvbnRlbnQ/a2V5PSR7YXBpS2V5fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHByb21wdFRleHQsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgKTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgIHRocm93IG5ldyBSYXRlTGltaXRFcnJvcihcIlJhdGUgbGltaXQgcmVhY2hlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEdlbWluaSBBUEkgUmVxdWVzdCBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9XFxuJHtlcnJvclRleHR9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaW50ZXJmYWNlIEdlbWluaVJlc3BvbnNlIHtcbiAgICAgICAgY2FuZGlkYXRlcz86IEFycmF5PHtcbiAgICAgICAgICBjb250ZW50Pzoge1xuICAgICAgICAgICAgcGFydHM/OiBBcnJheTx7XG4gICAgICAgICAgICAgIHRleHQ/OiBzdHJpbmc7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICB9O1xuICAgICAgICB9PjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBHZW1pbmlSZXNwb25zZTtcbiAgICAgIGNvbnN0IHJlc3VsdE1hcmtkb3duID0gZGF0YT8uY2FuZGlkYXRlcz8uWzBdPy5jb250ZW50Py5wYXJ0cz8uWzBdPy50ZXh0O1xuXG4gICAgICBpZiAoXG4gICAgICAgICFyZXN1bHRNYXJrZG93biB8fFxuICAgICAgICByZXN1bHRNYXJrZG93bi50cmltKCkgPT09IFwiTm8gcmVzcG9uc2UgcmVjZWl2ZWQuXCJcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJObyByZXNwb25zZSBvciBpbnZhbGlkIGZvcm1hdCByZWNlaXZlZCBmcm9tIEdlbWluaSBBUEkuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgd29yZCB0byBsb2NhbCBkYXRhYmFzZVxuICAgICAgLy8gVXNlIHRoZSB3b3JkIG5hbWUgZnJvbSB0aGUgQUkncyBtYXJrZG93biBoZWFkaW5nIChjb3JyZWN0bHkgc3BlbGxlZCwgbG93ZXJjYXNlKVxuICAgICAgLy8gcmF0aGVyIHRoYW4gd2hhdCB0aGUgdXNlciB0eXBlZCwgc28gdHlwb3MgbGlrZSBcInJhcG90XCIgc2F2ZSBhcyBcInJhcHBvcnQubWRcIlxuICAgICAgY29uc3QgaGVhZGluZ01hdGNoID0gcmVzdWx0TWFya2Rvd24udHJpbSgpLm1hdGNoKC9eI1xccysoW14oXFxuXSspLyk7XG4gICAgICBjb25zdCBhaVdvcmROYW1lID0gaGVhZGluZ01hdGNoXG4gICAgICAgID8gaGVhZGluZ01hdGNoWzFdLnRyaW0oKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIDogbm9ybWFsaXplZFdvcmQ7XG5cbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBgJHthaVdvcmROYW1lfS5tZGApO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKGZpbGVQYXRoLCByZXN1bHRNYXJrZG93bi50cmltKCkpO1xuICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IGZzLnN0YXQoZmlsZVBhdGgpO1xuXG4gICAgICAvLyBVcGRhdGUgc3RhdGVcbiAgICAgIHNldFdvcmRzKChwcmV2KSA9PiAoe1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICBbYWlXb3JkTmFtZV06IHtcbiAgICAgICAgICBuYW1lOiBhaVdvcmROYW1lLFxuICAgICAgICAgIGNvbnRlbnQ6IHJlc3VsdE1hcmtkb3duLnRyaW0oKSxcbiAgICAgICAgICBjcmVhdGVkQXQ6XG4gICAgICAgICAgICBwcmV2W2FpV29yZE5hbWVdPy5jcmVhdGVkQXQgfHxcbiAgICAgICAgICAgIHN0YXQuYmlydGh0aW1lTXMgfHxcbiAgICAgICAgICAgIHN0YXQubXRpbWVNcyB8fFxuICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICB1cGRhdGVkQXQ6IHN0YXQubXRpbWVNcyB8fCBEYXRlLm5vdygpLFxuICAgICAgICB9LFxuICAgICAgfSkpO1xuXG4gICAgICAvLyBGb2N1cyB0aGUgbmV3bHkgbG9va2VkIHVwL2NyZWF0ZWQgd29yZFxuICAgICAgcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQgPSBhaVdvcmROYW1lO1xuICAgICAgc2V0U2VsZWN0ZWRJZChhaVdvcmROYW1lKTtcbiAgICAgIHNldFNlYXJjaFRleHQoXCJcIik7IC8vIENsZWFyIHNlYXJjaCB0byBzaG93IGluIHRoZSBsaXN0IG9mIHNhdmVkIHdvcmRzXG5cbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJXb3JkIFNhdmVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gYCR7Y2FwaXRhbGl6ZShhaVdvcmROYW1lKX0gYWRkZWQgdG8gZGF0YWJhc2VgO1xuICAgIH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuXG4gICAgICBjb25zdCBlcnJNc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICBjb25zdCBpc05ldHdvcmtFcnJvciA9XG4gICAgICAgIGVyck1zZy5pbmNsdWRlcyhcIkVOT1RGT1VORFwiKSB8fFxuICAgICAgICBlcnJNc2cuaW5jbHVkZXMoXCJmZXRjaCBmYWlsZWRcIikgfHxcbiAgICAgICAgZXJyTXNnLmluY2x1ZGVzKFwibmV0d29ya1wiKSB8fFxuICAgICAgICAoZXJyIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyLm5hbWUgPT09IFwiVHlwZUVycm9yXCIpOyAvLyBzdGFuZGFyZCBmZXRjaCBmYWlsdXJlIG9ubGluZS9vZmZsaW5lIGlzIGEgVHlwZUVycm9yXG5cbiAgICAgIGlmIChpc05ldHdvcmtFcnJvcikge1xuICAgICAgICBzZXRMb29rdXBFcnJvcih7XG4gICAgICAgICAgd29yZDogd29yZFRvTG9va3VwLFxuICAgICAgICAgIHR5cGU6IFwibmV0d29ya1wiLFxuICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICBcIkludGVybmV0IGlzIG5vdCBjb25uZWN0ZWQuIFBsZWFzZSBjaGVjayB5b3VyIG5ldHdvcmsgY29ubmVjdGlvbiBhbmQgdHJ5IGFnYWluLlwiLFxuICAgICAgICB9KTtcbiAgICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5GYWlsdXJlO1xuICAgICAgICB0b2FzdC50aXRsZSA9IFwiTm8gSW50ZXJuZXQgQ29ubmVjdGlvblwiO1xuICAgICAgICB0b2FzdC5tZXNzYWdlID1cbiAgICAgICAgICBcIkludGVybmV0IGlzIG5vdCBjb25uZWN0ZWQuIFBsZWFzZSBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIHRyeSBhZ2Fpbi5cIjtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGVyciBpbnN0YW5jZW9mIFJhdGVMaW1pdEVycm9yIHx8XG4gICAgICAgIGVyck1zZy5pbmNsdWRlcyhcIjQyOVwiKSB8fFxuICAgICAgICBlcnJNc2cudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcInJhdGUgbGltaXRcIilcbiAgICAgICkge1xuICAgICAgICBzZXRMb29rdXBFcnJvcih7XG4gICAgICAgICAgd29yZDogd29yZFRvTG9va3VwLFxuICAgICAgICAgIHR5cGU6IFwicmF0ZS1saW1pdFwiLFxuICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICBcIlJhdGUgbGltaXQgcmVhY2hlZC4gVGhpcyByYXRlIGxpbWl0IHdpbGwgdGFrZSBzb21lIHRpbWUsIHBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuXCIsXG4gICAgICAgIH0pO1xuICAgICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICAgIHRvYXN0LnRpdGxlID0gXCJSYXRlIExpbWl0IFJlYWNoZWRcIjtcbiAgICAgICAgdG9hc3QubWVzc2FnZSA9IFwiUmF0ZSBsaW1pdCByZWFjaGVkLiBUcnkgYWdhaW4gbGF0ZXIuXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb29rdXBFcnJvcih7XG4gICAgICAgICAgd29yZDogd29yZFRvTG9va3VwLFxuICAgICAgICAgIHR5cGU6IFwib3RoZXJcIixcbiAgICAgICAgICBtZXNzYWdlOiBlcnJNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICAgIHRvYXN0LnRpdGxlID0gXCJMb29rdXAgRmFpbGVkXCI7XG4gICAgICAgIHRvYXN0Lm1lc3NhZ2UgPSBlcnJNc2c7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzU2VhcmNoaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICAvLyBPcGVuIGZpbGUgaW4gZGVmYXVsdCBhcHBsaWNhdGlvblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVPcGVuRmlsZSh3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke3dvcmROYW1lLnRvTG93ZXJDYXNlKCl9Lm1kYCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG9wZW4oZmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIkNvdWxkIG5vdCBvcGVuIGZpbGVcIixcbiAgICAgICAgbWVzc2FnZTogU3RyaW5nKGVyciksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXZlYWwgZmlsZSBpbiBmaW5kZXJcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlUmV2ZWFsSW5GaW5kZXIod29yZE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmRzRGlyLCBgJHt3b3JkTmFtZS50b0xvd2VyQ2FzZSgpfS5tZGApO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzaG93SW5GaW5kZXIoZmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIkNvdWxkIG5vdCByZXZlYWwgZmlsZVwiLFxuICAgICAgICBtZXNzYWdlOiBTdHJpbmcoZXJyKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIERlbGV0ZSB3b3JkIGZpbGUgYW5kIGVudHJ5XG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZURlbGV0ZSh3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4od29yZHNEaXIsIGAke3dvcmROYW1lLnRvTG93ZXJDYXNlKCl9Lm1kYCk7XG4gICAgY29uc3QgdG9hc3QgPSBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkFuaW1hdGVkLFxuICAgICAgdGl0bGU6IGBEZWxldGluZyBcIiR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XCIuLi5gLFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlUGF0aCk7XG4gICAgICBzZXRXb3JkcygocHJldikgPT4ge1xuICAgICAgICBjb25zdCBuZXh0ID0geyAuLi5wcmV2IH07XG4gICAgICAgIGRlbGV0ZSBuZXh0W3dvcmROYW1lXTtcbiAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICB9KTtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJXb3JkIERlbGV0ZWRcIjtcbiAgICAgIHRvYXN0Lm1lc3NhZ2UgPSBgUmVtb3ZlZCAke2NhcGl0YWxpemUod29yZE5hbWUpfSBmcm9tIGRhdGFiYXNlYDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJEZWxldGUgRmFpbGVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gU3RyaW5nKGVycik7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29weSB3b3JkIGZvcm1hdHRlZCBpbiBUZWxlZ3JhbS1mcmllbmRseSBtYXJrZG93biB0byBjbGlwYm9hcmRcbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQ29weVRlbGVncmFtVGV4dCh3b3JkTmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0ZWxlZ3JhbVRleHQgPSBmb3JtYXRGb3JUZWxlZ3JhbShjb250ZW50KTtcbiAgICBhd2FpdCBDbGlwYm9hcmQuY29weSh0ZWxlZ3JhbVRleHQpO1xuICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuU3VjY2VzcyxcbiAgICAgIHRpdGxlOiBcIkNvcGllZCBUZWxlZ3JhbSBUZXh0XCIsXG4gICAgICBtZXNzYWdlOiBgJHtjYXBpdGFsaXplKHdvcmROYW1lKX0gY29waWVkIGluIFRlbGVncmFtLWZyaWVuZGx5IGZvcm1hdGAsXG4gICAgfSk7XG4gIH1cblxuICAvLyBQb3N0IHdvcmQgZGlyZWN0bHkgdG8gVGVsZWdyYW0gY2hhbm5lbCB2aWEgVGVsZWdyYW0gQm90IEFQSVxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVQb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gICAgd29yZE5hbWU6IHN0cmluZyxcbiAgICBjb250ZW50OiBzdHJpbmcsXG4gICkge1xuICAgIGNvbnN0IGJvdFRva2VuID0gcHJlZmVyZW5jZXMudGVsZWdyYW1Cb3RUb2tlbjtcbiAgICBjb25zdCBjaGF0SWQgPSBwcmVmZXJlbmNlcy50ZWxlZ3JhbUNoYXRJZDtcblxuICAgIGlmICghYm90VG9rZW4gfHwgIWNoYXRJZCkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIlRlbGVncmFtIENyZWRlbnRpYWxzIE1pc3NpbmdcIixcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcIlBsZWFzZSBjb25maWd1cmUgVGVsZWdyYW0gQm90IFRva2VuIGFuZCBDaGF0IElEIGluIEV4dGVuc2lvbiBQcmVmZXJlbmNlcy5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRvYXN0ID0gYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5BbmltYXRlZCxcbiAgICAgIHRpdGxlOiBgUG9zdGluZyBcIiR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XCIgdG8gVGVsZWdyYW0uLi5gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGVsZWdyYW1UZXh0ID0gZm9ybWF0Rm9yVGVsZWdyYW0oY29udGVudCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcG9zdFRvVGVsZWdyYW1DaGFubmVsKGJvdFRva2VuLCBjaGF0SWQsIHRlbGVncmFtVGV4dCk7XG5cbiAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJQb3N0ZWQgdG8gVGVsZWdyYW0gQ2hhbm5lbFwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IGAke2NhcGl0YWxpemUod29yZE5hbWUpfSBzZW50IHRvICR7Y2hhdElkfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuRmFpbHVyZTtcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJGYWlsZWQgdG8gUG9zdCB0byBUZWxlZ3JhbVwiO1xuICAgICAgdG9hc3QubWVzc2FnZSA9IHJlcy5tZXNzYWdlIHx8IFwiVW5rbm93biBlcnJvclwiO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPExpc3RcbiAgICAgIGlzU2hvd2luZ0RldGFpbD17T2JqZWN0LmtleXMod29yZHMpLmxlbmd0aCA+IDAgfHwgc2hvd0xvb2t1cEl0ZW19XG4gICAgICBzZWFyY2hCYXJQbGFjZWhvbGRlcj1cIlNlYXJjaCBzYXZlZCB3b3JkcyBvciBsb29rIHVwIG5ldyBvbmVzLi4uXCJcbiAgICAgIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0U2VhcmNoVGV4dH1cbiAgICAgIHNlYXJjaFRleHQ9e3NlYXJjaFRleHR9XG4gICAgICBpc0xvYWRpbmc9e2xvYWRpbmdIaXN0b3J5IHx8IGlzU2VhcmNoaW5nfVxuICAgICAgc2VsZWN0ZWRJdGVtSWQ9e3NlbGVjdGVkSWR9XG4gICAgICBvblNlbGVjdGlvbkNoYW5nZT17KGlkKSA9PiB7XG4gICAgICAgIGlmIChwcm9ncmFtbWF0aWNTZWxlY3Rpb25SZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmIChpZCA9PT0gcHJvZ3JhbW1hdGljU2VsZWN0aW9uUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHByb2dyYW1tYXRpY1NlbGVjdGlvblJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldFNlbGVjdGVkSWQoaWQgfHwgdW5kZWZpbmVkKTtcbiAgICAgIH19XG4gICAgICBzZWFyY2hCYXJBY2Nlc3Nvcnk9e1xuICAgICAgICBPYmplY3Qua2V5cyh3b3JkcykubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICA8TGlzdC5Ecm9wZG93blxuICAgICAgICAgICAgdG9vbHRpcD1cIlNvcnQgV29yZHNcIlxuICAgICAgICAgICAgb25DaGFuZ2U9e3NldFNvcnRCeX1cbiAgICAgICAgICAgIHZhbHVlPXtzb3J0Qnl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPExpc3QuRHJvcGRvd24uSXRlbSB0aXRsZT1cIlJlY2VudGx5IEFkZGVkXCIgdmFsdWU9XCJkYXRlLW5ld2VzdFwiIC8+XG4gICAgICAgICAgICA8TGlzdC5Ecm9wZG93bi5JdGVtIHRpdGxlPVwiT2xkZXN0IEFkZGVkXCIgdmFsdWU9XCJkYXRlLW9sZGVzdFwiIC8+XG4gICAgICAgICAgICA8TGlzdC5Ecm9wZG93bi5JdGVtXG4gICAgICAgICAgICAgIHRpdGxlPVwiQWxwaGFiZXRpY2FsIChBLVopXCJcbiAgICAgICAgICAgICAgdmFsdWU9XCJhbHBoYWJldGljYWwtYXNjXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8TGlzdC5Ecm9wZG93bi5JdGVtXG4gICAgICAgICAgICAgIHRpdGxlPVwiQWxwaGFiZXRpY2FsIChaLUEpXCJcbiAgICAgICAgICAgICAgdmFsdWU9XCJhbHBoYWJldGljYWwtZGVzY1wiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvTGlzdC5Ecm9wZG93bj5cbiAgICAgICAgKSA6IHVuZGVmaW5lZFxuICAgICAgfVxuICAgID5cbiAgICAgIHtzaG93TG9va3VwSXRlbSAmJiAoXG4gICAgICAgIDxMaXN0LlNlY3Rpb24gdGl0bGU9XCJBSSBMb29rdXBcIj5cbiAgICAgICAgICB7bG9va3VwRXJyb3IgJiZcbiAgICAgICAgICBsb29rdXBFcnJvci53b3JkLnRvTG93ZXJDYXNlKCkgPT09IGNsZWFuU2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpID8gKFxuICAgICAgICAgICAgPExpc3QuSXRlbVxuICAgICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtLWVycm9yXCJcbiAgICAgICAgICAgICAgdGl0bGU9e2BMb29rdXAgRmFpbGVkIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgICAgc3VidGl0bGU9e1xuICAgICAgICAgICAgICAgIGxvb2t1cEVycm9yLnR5cGUgPT09IFwicmF0ZS1saW1pdFwiXG4gICAgICAgICAgICAgICAgICA/IFwiUmF0ZSBMaW1pdCBSZWFjaGVkXCJcbiAgICAgICAgICAgICAgICAgIDogbG9va3VwRXJyb3IudHlwZSA9PT0gXCJuZXR3b3JrXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcIk5vIEludGVybmV0XCJcbiAgICAgICAgICAgICAgICAgICAgOiBcIkVycm9yXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpY29uPXt7IHNvdXJjZTogSWNvbi5FeGNsYW1hdGlvbk1hcmssIGNvbG9yOiBDb2xvci5SZWQgfX1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJldHJ5IExvb2t1cFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uUmVwZWF0fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlTG9va3VwKGNsZWFuU2VhcmNoVGV4dCl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAge2xvb2t1cEVycm9yLnR5cGUgPT09IFwicmF0ZS1saW1pdFwiICYmIChcbiAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiU2VhcmNoIG9uIEdvb2dsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkdsb2JlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsPXtgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChjbGVhblNlYXJjaFRleHQgKyBcIiBtZWFuaW5nXCIpfWB9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uLk9wZW5JbkJyb3dzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBDaGF0R1BUXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uTWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybD17YGh0dHBzOi8vY2hhdGdwdC5jb20vP3E9JHtlbmNvZGVVUklDb21wb25lbnQoZ2V0UHJvbXB0Rm9yV29yZChjbGVhblNlYXJjaFRleHQpKX1gfVxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDb3B5IFByb21wdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNvcHlDbGlwYm9hcmR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17YXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBDbGlwYm9hcmQuY29weShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRQcm9tcHRGb3JXb3JkKGNsZWFuU2VhcmNoVGV4dCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiUHJvbXB0IENvcGllZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkRlc2lnbmF0ZWQgQ2hhdEdQVCBwcm9tcHQgY29waWVkIHRvIGNsaXBib2FyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvQWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZGV0YWlsPXtcbiAgICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbFxuICAgICAgICAgICAgICAgICAgbWFya2Rvd249e2AjIExvb2t1cCBGYWlsZWQgZm9yIFwiJHtjbGVhblNlYXJjaFRleHR9XCJcXG5cXG4ke1xuICAgICAgICAgICAgICAgICAgICBsb29rdXBFcnJvci50eXBlID09PSBcInJhdGUtbGltaXRcIlxuICAgICAgICAgICAgICAgICAgICAgID8gYFx1MjZBMFx1RkUwRiAqKlJhdGUgbGltaXQgcmVhY2hlZC4qKiBUaGlzIHJhdGUgbGltaXQgd2lsbCB0YWtlIHNvbWUgdGltZSwgcGxlYXNlIHRyeSBhZ2FpbiBsYXRlci5cXG5cXG4jIyMgQWx0ZXJuYXRpdmVzOlxcbjEuICoqR29vZ2xlIFNlYXJjaCoqOiBTZWFyY2ggZm9yIHRoaXMgd29yZCBkaXJlY3RseSBvbiBHb29nbGUuXFxuMi4gKipPcGVuIENoYXRHUFQqKjogT3BlbiBDaGF0R1BUIHdpdGggdGhlIGRlc2lnbmF0ZWQgcHJvbXB0IGFscmVhZHkgZW1iZWRkZWQuXFxuMy4gKipDb3B5IFByb21wdCoqOiBDb3B5IHRoZSBwcm9tcHQgdG8gY2xpcGJvYXJkIHRvIG1hbnVhbGx5IHBhc3RlIGl0IGluIGFueSBBSS5gXG4gICAgICAgICAgICAgICAgICAgICAgOiBsb29rdXBFcnJvci50eXBlID09PSBcIm5ldHdvcmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPyBgXHVEODNEXHVEQ0UxICoqSW50ZXJuZXQgaXMgbm90IGNvbm5lY3RlZC4qKiBQbGVhc2UgY2hlY2sgeW91ciBuZXR3b3JrIGNvbm5lY3Rpb24gYW5kIHRyeSBhZ2Fpbi5gXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGBcdTI3NEMgKipFcnJvcioqOiAke2xvb2t1cEVycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPExpc3QuSXRlbVxuICAgICAgICAgICAgICBpZD1cImxvb2t1cC1pdGVtXCJcbiAgICAgICAgICAgICAgdGl0bGU9e2BTZWFyY2ggR2VtaW5pIGZvciBcIiR7Y2xlYW5TZWFyY2hUZXh0fVwiYH1cbiAgICAgICAgICAgICAgaWNvbj17SWNvbi5HbG9iZX1cbiAgICAgICAgICAgICAgYWN0aW9ucz17XG4gICAgICAgICAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkxvb2t1cCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5NYWduaWZ5aW5nR2xhc3N9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVMb29rdXAoY2xlYW5TZWFyY2hUZXh0KX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkZXRhaWw9e1xuICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsXG4gICAgICAgICAgICAgICAgICBtYXJrZG93bj17XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdMb2NhbERlZmluaXRpb25cbiAgICAgICAgICAgICAgICAgICAgICA/IGAjICR7Y2FwaXRhbGl6ZShjbGVhblNlYXJjaFRleHQpfVxcblxcbipTZWFyY2hpbmcgbG9jYWwgZGljdGlvbmFyeS4uLipgXG4gICAgICAgICAgICAgICAgICAgICAgOiBsb2NhbERlZmluaXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgID8gYCR7Zm9ybWF0TG9jYWxEZWZpbml0aW9uKGNsZWFuU2VhcmNoVGV4dCwgbG9jYWxEZWZpbml0aW9uKX1cXG5cXG4tLS1cXG5cXG5cdUQ4M0RcdURDQTEgKlByZXNzICoqRW50ZXIqKiB0byBsb29rIHVwIG9uIEdlbWluaSBBSSBhbmQgc2F2ZSB0aGlzIHdvcmQgd2l0aCBIaW5kaSBtZWFuaW5nLCBleGFtcGxlcywgZXR5bW9sb2d5LCBldGMuKmBcbiAgICAgICAgICAgICAgICAgICAgICAgIDogYCMgJHtjYXBpdGFsaXplKGNsZWFuU2VhcmNoVGV4dCl9XFxuXFxuKkRlZmluaXRpb24gbm90IGZvdW5kIGluIGxvY2FsIGRpY3Rpb25hcnkuKlxcblxcbi0tLVxcblxcblx1RDgzRFx1RENBMSAqUHJlc3MgKipFbnRlcioqIHRvIGxvb2sgdXAgb24gR2VtaW5pIEFJIGFuZCBzYXZlIHRoaXMgd29yZCB3aXRoIEhpbmRpIG1lYW5pbmcsIGV4YW1wbGVzLCBldHltb2xvZ3ksIGV0Yy4qYFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9MaXN0LlNlY3Rpb24+XG4gICAgICApfVxuXG4gICAgICB7c29ydGVkQW5kRmlsdGVyZWRXb3Jkcy5sZW5ndGggPiAwID8gKFxuICAgICAgICA8TGlzdC5TZWN0aW9uIHRpdGxlPVwiU2F2ZWQgVm9jYWJ1bGFyeVwiPlxuICAgICAgICAgIHtzb3J0ZWRBbmRGaWx0ZXJlZFdvcmRzLm1hcCgod29yZEl0ZW0pID0+IChcbiAgICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgICAga2V5PXt3b3JkSXRlbS5uYW1lfVxuICAgICAgICAgICAgICBpZD17d29yZEl0ZW0ubmFtZX1cbiAgICAgICAgICAgICAgdGl0bGU9e2NhcGl0YWxpemUod29yZEl0ZW0ubmFtZSl9XG4gICAgICAgICAgICAgIHN1YnRpdGxlPXtnZXRTdWJ0aXRsZSh3b3JkSXRlbS5jb250ZW50KX1cbiAgICAgICAgICAgICAgYWNjZXNzb3JpZXM9e1tcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGdldFBhcnRPZlNwZWVjaCh3b3JkSXRlbS5jb250ZW50KSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IENvbG9yLkJsdWUsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgIGRldGFpbD17PExpc3QuSXRlbS5EZXRhaWwgbWFya2Rvd249e3dvcmRJdGVtLmNvbnRlbnR9IC8+fVxuICAgICAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBUZWxlZ3JhbSBUZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5Db3B5Q2xpcGJvYXJkfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17S2V5Ym9hcmQuU2hvcnRjdXQuQ29tbW9uLkNvcHl9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNvcHlUZWxlZ3JhbVRleHQod29yZEl0ZW0ubmFtZSwgd29yZEl0ZW0uY29udGVudClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJQb3N0IHRvIFRlbGVncmFtIENoYW5uZWxcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlBhcGVycGxhbmV9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXt7IG1vZGlmaWVyczogW1wiY21kXCIsIFwic2hpZnRcIl0sIGtleTogXCJyZXR1cm5cIiB9fVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVQb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JkSXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgd29yZEl0ZW0uY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uLlB1c2hcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJTY2hlZHVsZSBmb3IgVGVsZWdyYW1cdTIwMjZcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNhbGVuZGFyfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17S2V5Ym9hcmQuU2hvcnRjdXQuQ29tbW9uLlNhdmV9XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldD17XG4gICAgICAgICAgICAgICAgICAgICAgPFNjaGVkdWxlRm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgd29yZE5hbWU9e3dvcmRJdGVtLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZG93bkNvbnRlbnQ9e3dvcmRJdGVtLmNvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb24uUHVzaFxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlZpZXcgU2NoZWR1bGVkIFBvc3RzXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5DbG9ja31cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjdHJsXCJdLCBrZXk6IFwibFwiIH19XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldD17PFNjaGVkdWxlZExpc3QgLz59XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIkNvcHkgTWFya2Rvd25cIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLkNvcHlDbGlwYm9hcmR9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXthc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgQ2xpcGJvYXJkLmNvcHkod29yZEl0ZW0uY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5TdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQ29waWVkIHRvIENsaXBib2FyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYCR7Y2FwaXRhbGl6ZSh3b3JkSXRlbS5uYW1lKX0gbWFya2Rvd24gY29waWVkYCxcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBGaWxlXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5Eb2N1bWVudH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZU9wZW5GaWxlKHdvcmRJdGVtLm5hbWUpfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJSZXZlYWwgaW4gRmluZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5GaW5kZXJ9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVSZXZlYWxJbkZpbmRlcih3b3JkSXRlbS5uYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUmVmcmVzaCBXb3JkXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5SZXBlYXR9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXtLZXlib2FyZC5TaG9ydGN1dC5Db21tb24uUmVmcmVzaH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZUxvb2t1cCh3b3JkSXRlbS5uYW1lLCB0cnVlKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiRGVsZXRlIFdvcmRcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlRyYXNofVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17QWN0aW9uLlN0eWxlLkRlc3RydWN0aXZlfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17eyBtb2RpZmllcnM6IFtcImN0cmxcIl0sIGtleTogXCJ4XCIgfX1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZURlbGV0ZSh3b3JkSXRlbS5uYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9MaXN0LlNlY3Rpb24+XG4gICAgICApIDogKFxuICAgICAgICAhc2hvd0xvb2t1cEl0ZW0gJiZcbiAgICAgICAgIWxvYWRpbmdIaXN0b3J5ICYmIChcbiAgICAgICAgICA8TGlzdC5FbXB0eVZpZXdcbiAgICAgICAgICAgIHRpdGxlPVwiWW91ciB2b2NhYnVsYXJ5IGlzIGVtcHR5XCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiVHlwZSBhIHdvcmQgaW4gdGhlIHNlYXJjaCBiYXIgYW5kIHByZXNzIEVudGVyIHRvIHF1ZXJ5IEdlbWluaSBBSS5cIlxuICAgICAgICAgICAgaWNvbj17SWNvbi5Cb29rfVxuICAgICAgICAgIC8+XG4gICAgICAgIClcbiAgICAgICl9XG4gICAgPC9MaXN0PlxuICApO1xufVxuIiwgImV4cG9ydCBjb25zdCBQUk9NUFQgPSBgXG5Zb3UgYXJlIGEgdm9jYWJ1bGFyeSBhc3Npc3RhbnQuXG5cbldvcmQ6IHt3b3JkfVxuXG5PdXRwdXQgU1RSSUNUIE1hcmtkb3duLlxuXG5SdWxlczpcbi0gVXNlIG9ubHkgTWFya2Rvd25cbi0gTm8gSFRNTFxuLSBObyBlbW9qaXNcbi0gTm8gdGFibGVzXG4tIFVzZSBcIi1cIiBidWxsZXRzIG9ubHlcbi0gS2VlcCBzcGFjaW5nIGNsZWFuXG4tIEtlZXAgY29uY2lzZVxuLSBObyBjb2RlIGJsb2Nrc1xuLSBEbyBub3Qgd3JhcCByZXNwb25zZSBpbiBtYXJrZG93biBmZW5jZXNcbi0gTWF4aW11bSBjbGFyaXR5LCBtaW5pbXVtIHdvcmRzXG5cbkZvcm1hdDpcblxuIyBXb3JkIChIaW5kaSBQcm9udW5jaWF0aW9uKVxuLSAqKk5vdW46Kiogc2hvcnQgZGVmaW5pdGlvbiAoXHUyMjY0MjAgd29yZHMpIChpbmNsdWRlIE9OTFkgaWYgdGhlIHdvcmQgY2FuIGJlIHVzZWQgYXMgYSBub3VuKVxuLSAqKlZlcmI6Kiogc2hvcnQgZGVmaW5pdGlvbiAoXHUyMjY0MjAgd29yZHMpIChpbmNsdWRlIE9OTFkgaWYgdGhlIHdvcmQgY2FuIGJlIHVzZWQgYXMgYSB2ZXJiKVxuLSAqKkFkamVjdGl2ZToqKiBzaG9ydCBkZWZpbml0aW9uIChcdTIyNjQyMCB3b3JkcykgKGluY2x1ZGUgT05MWSBpZiB0aGUgd29yZCBjYW4gYmUgdXNlZCBhcyBhbiBhZGplY3RpdmUpXG4tICoqQWR2ZXJiOioqIHNob3J0IGRlZmluaXRpb24gKFx1MjI2NDIwIHdvcmRzKSAoaW5jbHVkZSBPTkxZIGlmIHRoZSB3b3JkIGNhbiBiZSB1c2VkIGFzIGFuIGFkdmVyYilcbihqdXN0IGxpa2UgdGhhdCBhbGwgb3RoZXIgdHlwZXMgb2YgcGFydCBvZiBzcGVlY2hlcywgYWJvdmUgNCBhcmUganVzdCBleGFtcGxlcykgKGFuZCB3aGVuIG11bHRpcGxlIHBhcnQgb2Ygc3BlZWNoZXMgZXhpc3RzLCB0aGVuIHVzZSBhIGxpc3QgaXRlbSBcIi1cIiBmb3IgZWFjaCBwYXJ0IG9mIHNwZWVjaCwgc28gdGhleSBhcmUgY2xlYW5seSBzZXBhcmF0ZWQgYXMgbGlzdCBpdGVtcy4gbWVhbnMgbm8gdHdvIHBhcnQgb2Ygc3BlZWNoIG9uIHNhbWUgbGluZSlcblxuIyMgSGluZGkgRXF1aXZhbGVudFxubWVhbmluZzEsIG1lYW5pbmcyLCBtZWFuaW5nM1xuXG4jIyBXaGVuIHRvIHVzZVxuLSBwb2ludFxuLSBwb2ludFxuLSBwb2ludFxuXG4jIyBFeGFtcGxlc1xuLSBzZW50ZW5jZVxuLSBIaW5kaSB0cmFuc2xhdGlvblxuLSBzZW50ZW5jZVxuLSBIaW5kaSB0cmFuc2xhdGlvblxuXG4jIyBTeW5vbnltc1xudzEsIHcyLCB3MywgdzRcblxuIyMgQW50b255bXNcbncxLCB3MiwgdzMsIHc0XG5cbkNvbmRpdGlvbmFsOlxuSW5jbHVkZSBvbmx5IHdoZW4gbWVhbmluZ2Z1bC5cblxuIyMgV29yZCBCcmVha2Rvd25cbi0gcGFydCBcdTIxOTIgbWVhbmluZ1xuXG4jIyBGb3JtYXRpb24gRmxvd1xuLSBzdGVwIFx1MjE5MiBtZWFuaW5nXG5cbiMjIEV0eW1vbG9neVxuYnJpZWYgb3JpZ2luXG5cbkNvbnN0cmFpbnRzOlxuLSBObyBleHRyYSB0ZXh0XG4tIE5vIGV4cGxhbmF0aW9uc1xuLSBObyBkZXZpYXRpb25zXG4tIE91dHB1dCBvbmx5IHRoZSBmb3JtYXR0ZWQgZW50cnlcbmA7XG4iLCAiZXhwb3J0IGNvbnN0IFNXSUZUX0xPT0tVUF9DT0RFID0gYFxuaW1wb3J0IEZvdW5kYXRpb25cbmltcG9ydCBDb3JlU2VydmljZXMuRGljdGlvbmFyeVNlcnZpY2VzXG5cbmZ1bmMgZ2V0RGVmaW5pdGlvbihmb3Igd29yZDogU3RyaW5nKSAtPiBTdHJpbmc/IHtcbiAgICBsZXQgbnNTdHJpbmcgPSB3b3JkIGFzIE5TU3RyaW5nXG4gICAgbGV0IHJhbmdlID0gQ0ZSYW5nZShsb2NhdGlvbjogMCwgbGVuZ3RoOiBuc1N0cmluZy5sZW5ndGgpXG4gICAgXG4gICAgZ3VhcmQgbGV0IGRlZmluaXRpb24gPSBEQ1NDb3B5VGV4dERlZmluaXRpb24obmlsLCBuc1N0cmluZywgcmFuZ2UpIGVsc2Uge1xuICAgICAgICByZXR1cm4gbmlsXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBkZWZpbml0aW9uLnRha2VVbnJldGFpbmVkVmFsdWUoKSBhcyBTdHJpbmdcbn1cblxubGV0IGFyZ3MgPSBDb21tYW5kTGluZS5hcmd1bWVudHNcbmlmIGFyZ3MuY291bnQgPCAyIHtcbiAgICBleGl0KDEpXG59XG5cbmxldCB3b3JkID0gYXJnc1sxXVxuaWYgbGV0IGRlZmluaXRpb24gPSBnZXREZWZpbml0aW9uKGZvcjogd29yZCkge1xuICAgIHByaW50KGRlZmluaXRpb24pXG59IGVsc2Uge1xuICAgIGV4aXQoMilcbn1cbmA7XG4iLCAiLyoqXG4gKiBUZWxlZ3JhbSBmb3JtYXR0aW5nIGFuZCBCb3QgQVBJIHV0aWxpdHkgbW9kdWxlLlxuICovXG5cbi8qKlxuICogRm9ybWF0cyBhIHZvY2FidWxhcnkgZW50cnkncyByYXcgbWFya2Rvd24gY29udGVudCBpbnRvIFRlbGVncmFtLWZyaWVuZGx5IHRleHQuXG4gKlxuICogRm9ybWF0dGluZyBydWxlczpcbiAqIC0gVGl0bGU6ICoqV29yZCAoUHJvbnVuY2lhdGlvbikqKiB3aXRoIDIgc3BhY2VzIGxpbmUgZW5kXG4gKiAtIERlZmluaXRpb25zOiBHcm91cGVkIGJ5IFBPUyAoKipOb3VuOioqKSB3aXRoIDEpIC4uLiAyKSAuLi4gbnVtYmVyZWQgbGlzdFxuICogLSBTZWN0aW9ucyAoKipIaW5kaSBFcXVpdmFsZW50OioqLCAqKldoZW4gdG8gdXNlOioqLCAqKkV4YW1wbGVzOioqLCBldGMuKVxuICogLSBMaXN0czogQnVsbGV0cyBmb3JtYXR0ZWQgd2l0aCBgLSBpdGVtYCBhbmQgMiBzcGFjZXMgbGluZSBlbmRcbiAqIC0gRXR5bW9sb2d5OiBPcmlnaW4gdGVybXMgZm9ybWF0dGVkIHdpdGggYF9fdGVybV9fYCAoVGVsZWdyYW0gZG91YmxlIHVuZGVyc2NvcmUgaXRhbGljKVxuICogLSBNYWluIHNlY3Rpb25zIHNlcGFyYXRlZCBieSBkb3VibGUgbmV3bGluZXMgYFxcblxcbmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEZvclRlbGVncmFtKG1hcmtkb3duQ29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFtYXJrZG93bkNvbnRlbnQgfHwgIW1hcmtkb3duQ29udGVudC50cmltKCkpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd25Db250ZW50LnRyaW0oKS5zcGxpdChcIlxcblwiKTtcblxuICAvLyAxLiBGaW5kIEgxIFRpdGxlIGxpbmUgKCMgV29yZCAuLi4pXG4gIGxldCB0aXRsZUluZGV4ID0gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoL14jXFxzKy8udGVzdChsaW5lc1tpXSkpIHtcbiAgICAgIHRpdGxlSW5kZXggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRpdGxlSW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIG1hcmtkb3duQ29udGVudDtcbiAgfVxuXG4gIGNvbnN0IHJhd1RpdGxlTGluZSA9IGxpbmVzW3RpdGxlSW5kZXhdO1xuICBjb25zdCB0aXRsZU1hdGNoID0gcmF3VGl0bGVMaW5lLm1hdGNoKC9eI1xccysoW14oXSs/KSg/OlxccypcXCgoW14pXSopXFwpKT9cXHMqJC8pO1xuICBsZXQgdGl0bGVUZXh0ID0gXCJcIjtcbiAgaWYgKHRpdGxlTWF0Y2gpIHtcbiAgICBjb25zdCByYXdXb3JkID0gdGl0bGVNYXRjaFsxXS50cmltKCk7XG4gICAgY29uc3QgY2FwaXRhbGl6ZWRXb3JkID0gcmF3V29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJhd1dvcmQuc2xpY2UoMSk7XG4gICAgY29uc3QgcHJvbiA9IHRpdGxlTWF0Y2hbMl0gPyB0aXRsZU1hdGNoWzJdLnRyaW0oKSA6IFwiXCI7XG4gICAgdGl0bGVUZXh0ID0gcHJvblxuICAgICAgPyBgKioke2NhcGl0YWxpemVkV29yZH0gKCR7cHJvbn0pKipgXG4gICAgICA6IGAqKiR7Y2FwaXRhbGl6ZWRXb3JkfSoqYDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjbGVhbmVkVGl0bGUgPSByYXdUaXRsZUxpbmUucmVwbGFjZSgvXiNcXHMrLywgXCJcIikudHJpbSgpO1xuICAgIGNvbnN0IGNhcGl0YWxpemVkVGl0bGUgPVxuICAgICAgY2xlYW5lZFRpdGxlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2xlYW5lZFRpdGxlLnNsaWNlKDEpO1xuICAgIHRpdGxlVGV4dCA9IGAqKiR7Y2FwaXRhbGl6ZWRUaXRsZX0qKmA7XG4gIH1cblxuICAvLyAyLiBUb2tlbml6ZSBjb250ZW50IGludG8gVGl0bGUgQmxvY2sgYW5kICMjIFNlY3Rpb25zXG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiX190aXRsZV9fXCI7XG4gIGxldCBjdXJyZW50TGluZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlY3Rpb25NYXAgPSBuZXcgTWFwPFxuICAgIHN0cmluZyxcbiAgICB7IG9yaWdpbmFsSGVhZGluZzogc3RyaW5nOyBjb250ZW50TGluZXM6IHN0cmluZ1tdIH1cbiAgPigpO1xuICBjb25zdCBzZWN0aW9uT3JkZXI6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IHRpdGxlSW5kZXggKyAxOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaV07XG4gICAgY29uc3QgaDJNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoMk1hdGNoKSB7XG4gICAgICBpZiAoY3VycmVudEhlYWRpbmcgPT09IFwiX190aXRsZV9fXCIpIHtcbiAgICAgICAgc2VjdGlvbk1hcC5zZXQoXCJfX3RpdGxlX19cIiwge1xuICAgICAgICAgIG9yaWdpbmFsSGVhZGluZzogXCJfX3RpdGxlX19cIixcbiAgICAgICAgICBjb250ZW50TGluZXM6IGN1cnJlbnRMaW5lcyxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWN0aW9uTWFwLnNldChjdXJyZW50SGVhZGluZywge1xuICAgICAgICAgIG9yaWdpbmFsSGVhZGluZzogY3VycmVudEhlYWRpbmcsXG4gICAgICAgICAgY29udGVudExpbmVzOiBjdXJyZW50TGluZXMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY3VycmVudEhlYWRpbmcgPSBoMk1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGN1cnJlbnRMaW5lcyA9IFtdO1xuICAgICAgc2VjdGlvbk9yZGVyLnB1c2goY3VycmVudEhlYWRpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50TGluZXMucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudEhlYWRpbmcgPT09IFwiX190aXRsZV9fXCIpIHtcbiAgICBzZWN0aW9uTWFwLnNldChcIl9fdGl0bGVfX1wiLCB7XG4gICAgICBvcmlnaW5hbEhlYWRpbmc6IFwiX190aXRsZV9fXCIsXG4gICAgICBjb250ZW50TGluZXM6IGN1cnJlbnRMaW5lcyxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZWN0aW9uTWFwLnNldChjdXJyZW50SGVhZGluZywge1xuICAgICAgb3JpZ2luYWxIZWFkaW5nOiBjdXJyZW50SGVhZGluZyxcbiAgICAgIGNvbnRlbnRMaW5lczogY3VycmVudExpbmVzLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gMy4gUHJvY2VzcyBEZWZpbml0aW9ucyBpbiBUaXRsZSBCbG9ja1xuICBjb25zdCB0aXRsZUJsb2NrID0gc2VjdGlvbk1hcC5nZXQoXCJfX3RpdGxlX19cIik7XG4gIGNvbnN0IHBvc0RlZmluaXRpb25zTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZ1tdPigpO1xuXG4gIGlmICh0aXRsZUJsb2NrKSB7XG4gICAgY29uc3QgcG9zUGF0dGVybiA9XG4gICAgICAvXlxccyooPzotXFxzKyk/XFwqXFwqKE5vdW58VmVyYnxBZGplY3RpdmV8QWR2ZXJifFByZXBvc2l0aW9ufENvbmp1bmN0aW9ufFByb25vdW58SW50ZXJqZWN0aW9uKTpcXCpcXCpcXHMqKC4rKSQvaTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgdGl0bGVCbG9jay5jb250ZW50TGluZXMpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gbGluZS5tYXRjaChwb3NQYXR0ZXJuKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBjb25zdCBwb3MgPVxuICAgICAgICAgIG1hdGNoWzFdLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbWF0Y2hbMV0uc2xpY2UoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgbWVhbmluZyA9IG1hdGNoWzJdLnRyaW0oKTtcbiAgICAgICAgaWYgKCFwb3NEZWZpbml0aW9uc01hcC5oYXMocG9zKSkge1xuICAgICAgICAgIHBvc0RlZmluaXRpb25zTWFwLnNldChwb3MsIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBwb3NEZWZpbml0aW9uc01hcC5nZXQocG9zKSEucHVzaChtZWFuaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCByZXN1bHRCbG9ja3M6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gVGl0bGUgbGluZSBibG9ja1xuICByZXN1bHRCbG9ja3MucHVzaChgJHt0aXRsZVRleHR9ICBgKTtcblxuICAvLyBEZWZpbml0aW9ucyBibG9ja1xuICBpZiAocG9zRGVmaW5pdGlvbnNNYXAuc2l6ZSA+IDApIHtcbiAgICBjb25zdCBkZWZCbG9ja0xpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW3BvcywgZGVmc10gb2YgcG9zRGVmaW5pdGlvbnNNYXAuZW50cmllcygpKSB7XG4gICAgICBkZWZzLmZvckVhY2goKGRlZikgPT4ge1xuICAgICAgICBjb25zdCBjbGVhbkRlZiA9IGRlZi5yZXBsYWNlKC9eXFxkK1xcKVxccyovLCBcIlwiKS5yZXBsYWNlKC9eLVxccyovLCBcIlwiKTtcbiAgICAgICAgZGVmQmxvY2tMaW5lcy5wdXNoKGAqKiR7cG9zfToqKiAke2NsZWFuRGVmfSAgYCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmVzdWx0QmxvY2tzLnB1c2goZGVmQmxvY2tMaW5lcy5qb2luKFwiXFxuXCIpKTtcbiAgfVxuXG4gIC8vIDQuIFByb2Nlc3MgZWFjaCAjIyBTZWN0aW9uIGluIG9yaWdpbmFsIG9yZGVyXG4gIGZvciAoY29uc3QgaGVhZGluZ05hbWUgb2Ygc2VjdGlvbk9yZGVyKSB7XG4gICAgY29uc3Qgc2VjdGlvbkRhdGEgPSBzZWN0aW9uTWFwLmdldChoZWFkaW5nTmFtZSk7XG4gICAgaWYgKCFzZWN0aW9uRGF0YSkgY29udGludWU7XG5cbiAgICBjb25zdCBoZWFkaW5nTG93ZXIgPSBoZWFkaW5nTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHJhd0NvbnRlbnRMaW5lcyA9IHNlY3Rpb25EYXRhLmNvbnRlbnRMaW5lc1xuICAgICAgLm1hcCgobCkgPT4gbC50cmltKCkpXG4gICAgICAuZmlsdGVyKChsKSA9PiBsLmxlbmd0aCA+IDApO1xuXG4gICAgaWYgKHJhd0NvbnRlbnRMaW5lcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG4gICAgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJoaW5kaSBlcXVpdmFsZW50XCIpIHtcbiAgICAgIGNvbnN0IGxpbmUgPSByYXdDb250ZW50TGluZXMuam9pbihcIiBcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipIaW5kaSBFcXVpdmFsZW50OioqICBcXG4ke2xpbmV9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwid2hlbiB0byB1c2VcIikge1xuICAgICAgY29uc3QgaXRlbXMgPSByYXdDb250ZW50TGluZXMubWFwKChsaW5lKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBsaW5lLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICByZXR1cm4gYC0gJHtjbGVhbmVkfSAgYDtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqV2hlbiB0byB1c2U6KiogIFxcbiR7aXRlbXMuam9pbihcIlxcblwiKX1gKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJleGFtcGxlc1wiKSB7XG4gICAgICBjb25zdCBpdGVtcyA9IHJhd0NvbnRlbnRMaW5lcy5tYXAoKGxpbmUpID0+IHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGxpbmUucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICAgIHJldHVybiBgLSAke2NsZWFuZWR9ICBgO1xuICAgICAgfSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipFeGFtcGxlczoqKiAgXFxuJHtpdGVtcy5qb2luKFwiXFxuXCIpfWApO1xuICAgIH0gZWxzZSBpZiAoaGVhZGluZ0xvd2VyID09PSBcInN5bm9ueW1zXCIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSByYXdDb250ZW50TGluZXMuam9pbihcIiBcIikucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipTeW5vbnltczoqKiAke3RleHR9ICBgKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJhbnRvbnltc1wiKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gcmF3Q29udGVudExpbmVzLmpvaW4oXCIgXCIpLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqQW50b255bXM6KiogJHt0ZXh0fSAgYCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwid29yZCBicmVha2Rvd25cIikge1xuICAgICAgY29uc3QgaXRlbXMgPSByYXdDb250ZW50TGluZXMubWFwKChsaW5lKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBsaW5lLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICByZXR1cm4gYC0gJHtjbGVhbmVkfSAgYDtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqV29yZCBCcmVha2Rvd246KipcXG4ke2l0ZW1zLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwiZm9ybWF0aW9uIGZsb3dcIikge1xuICAgICAgY29uc3QgaXRlbXMgPSByYXdDb250ZW50TGluZXMubWFwKChsaW5lKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBsaW5lLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICByZXR1cm4gYC0gJHtjbGVhbmVkfSAgYDtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqRm9ybWF0aW9uIEZsb3c6KipcXG4ke2l0ZW1zLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwiZXR5bW9sb2d5XCIpIHtcbiAgICAgIGxldCB0ZXh0ID0gcmF3Q29udGVudExpbmVzLmpvaW4oXCIgXCIpO1xuICAgICAgLy8gQ29udmVydCBzaW5nbGUtcXVvdGVkIG9yIHNpbmdsZS1hc3RlcmlzayBvcmlnaW4gd29yZHMgdG8gX193b3JkX19cbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLycoW14nXSspJy9nLCBcIl9fJDFfX1wiKTtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFxccylcXCooW14qXSspXFwqKFxcc3wkKS9nLCBcIiQxX18kMl9fJDNcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipFdHltb2xvZ3k6KiogIFxcbiR7dGV4dH1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaGVhZGluZ0NhcCA9XG4gICAgICAgIGhlYWRpbmdOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgaGVhZGluZ05hbWUuc2xpY2UoMSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKioke2hlYWRpbmdDYXB9OioqICBcXG4ke3Jhd0NvbnRlbnRMaW5lcy5qb2luKFwiXFxuXCIpfWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRCbG9ja3Muam9pbihcIlxcblxcblwiKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBUZWxlZ3JhbS1mcmllbmRseSB0ZXh0ICgqKmJvbGQqKiwgX19pdGFsaWNfXykgdG8gVGVsZWdyYW0gSFRNTCBmb3JtYXRcbiAqIGZvciB1c2Ugd2l0aCBUZWxlZ3JhbSBCb3QgQVBJIGBzZW5kTWVzc2FnZWAgKHBhcnNlX21vZGU6IFwiSFRNTFwiKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbGVncmFtTWFya2Rvd25Ub0h0bWwodGVsZWdyYW1UZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRlbGVncmFtVGV4dCkgcmV0dXJuIFwiXCI7XG5cbiAgLy8gMS4gRXNjYXBlIEhUTUwgZW50aXRpZXNcbiAgbGV0IGh0bWwgPSB0ZWxlZ3JhbVRleHRcbiAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG4gICAgLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpO1xuXG4gIC8vIDIuIENvbnZlcnQgKipib2xkKiogdG8gPGI+Ym9sZDwvYj5cbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFwqXFwqKFteKl0rKVxcKlxcKi9nLCBcIjxiPiQxPC9iPlwiKTtcblxuICAvLyAzLiBDb252ZXJ0IF9faXRhbGljX18gdG8gPGk+aXRhbGljPC9pPlxuICBodG1sID0gaHRtbC5yZXBsYWNlKC9fXyhbXl9dKylfXy9nLCBcIjxpPiQxPC9pPlwiKTtcblxuICAvLyA0LiBDb252ZXJ0IH5+c3RyaWtldGhyb3VnaH5+IHRvIDxzPnN0cmlrZXRocm91Z2g8L3M+XG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL35+KFtefl0rKX5+L2csIFwiPHM+JDE8L3M+XCIpO1xuXG4gIC8vIDUuIFN0cmlwIHRyYWlsaW5nIGxpbmUgc3BhY2VzIGJlZm9yZSBuZXdsaW5lcyBmb3IgY2xlYW4gSFRNTCByZW5kZXJpbmdcbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvWyBcXHRdK1xcbi9nLCBcIlxcblwiKTtcblxuICByZXR1cm4gaHRtbDtcbn1cblxuLyoqXG4gKiBEaXJlY3RseSBwb3N0cyBhIFRlbGVncmFtLWZvcm1hdHRlZCB2b2NhYnVsYXJ5IGVudHJ5IHRvIGEgVGVsZWdyYW0gY2hhbm5lbC9jaGF0IHVzaW5nIFRlbGVncmFtIEJvdCBBUEkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gIGJvdFRva2VuOiBzdHJpbmcsXG4gIGNoYXRJZDogc3RyaW5nLFxuICB0ZWxlZ3JhbUZvcm1hdHRlZFRleHQ6IHN0cmluZyxcbik6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBtZXNzYWdlSWQ/OiBudW1iZXI7IG1lc3NhZ2U/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB0b2tlbiA9IGJvdFRva2VuLnRyaW0oKTtcbiAgY29uc3QgY2hhdCA9IGNoYXRJZC50cmltKCk7XG5cbiAgaWYgKCF0b2tlbikge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIlRlbGVncmFtIEJvdCBUb2tlbiBpcyByZXF1aXJlZC5cIiB9O1xuICB9XG4gIGlmICghY2hhdCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiVGVsZWdyYW0gQ2hhbm5lbCAvIENoYXQgSUQgaXMgcmVxdWlyZWQuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGh0bWxDb250ZW50ID0gdGVsZWdyYW1NYXJrZG93blRvSHRtbCh0ZWxlZ3JhbUZvcm1hdHRlZFRleHQpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLnRlbGVncmFtLm9yZy9ib3Qke3Rva2VufS9zZW5kTWVzc2FnZWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2hhdF9pZDogY2hhdCxcbiAgICAgICAgdGV4dDogaHRtbENvbnRlbnQsXG4gICAgICAgIHBhcnNlX21vZGU6IFwiSFRNTFwiLFxuICAgICAgICBkaXNhYmxlX3dlYl9wYWdlX3ByZXZpZXc6IHRydWUsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIGludGVyZmFjZSBUZWxlZ3JhbVJlc3BvbnNlIHtcbiAgICAgIG9rOiBib29sZWFuO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgICBlcnJvcl9jb2RlPzogbnVtYmVyO1xuICAgICAgcmVzdWx0Pzoge1xuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXI7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBUZWxlZ3JhbVJlc3BvbnNlO1xuXG4gICAgaWYgKHJlc3BvbnNlLm9rICYmIGRhdGEub2spIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2VJZDogZGF0YS5yZXN1bHQ/Lm1lc3NhZ2VfaWQgfTtcbiAgICB9XG5cbiAgICBjb25zdCBlcnJEZXNjID1cbiAgICAgIGRhdGEuZGVzY3JpcHRpb24gfHwgcmVzcG9uc2Uuc3RhdHVzVGV4dCB8fCBgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gO1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgXCJJbnZhbGlkIFRlbGVncmFtIEJvdCBUb2tlbi4gUGxlYXNlIGNoZWNrIGV4dGVuc2lvbiBwcmVmZXJlbmNlcy5cIixcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBUZWxlZ3JhbSBFcnJvcjogJHtlcnJEZXNjfS4gRW5zdXJlIHRoZSBib3QgaXMgYWRkZWQgdG8gdGhlIGNoYW5uZWwuYCxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMyB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBUZWxlZ3JhbSBFcnJvcjogJHtlcnJEZXNjfS4gRW5zdXJlIGJvdCBoYXMgcG9zdGluZyBhZG1pbiBwZXJtaXNzaW9ucy5gLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBgVGVsZWdyYW0gRXJyb3IgKCR7ZGF0YS5lcnJvcl9jb2RlIHx8IHJlc3BvbnNlLnN0YXR1c30pOiAke2VyckRlc2N9YCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGV0ZXMgYSBtZXNzYWdlIGZyb20gYSBUZWxlZ3JhbSBjaGFubmVsL2NoYXQgdXNpbmcgVGVsZWdyYW0gQm90IEFQSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZVRlbGVncmFtTWVzc2FnZShcbiAgYm90VG9rZW46IHN0cmluZyxcbiAgY2hhdElkOiBzdHJpbmcsXG4gIG1lc3NhZ2VJZDogbnVtYmVyLFxuKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB0b2tlbiA9IGJvdFRva2VuLnRyaW0oKTtcbiAgY29uc3QgY2hhdCA9IGNoYXRJZC50cmltKCk7XG5cbiAgaWYgKCF0b2tlbiB8fCAhY2hhdCB8fCAhbWVzc2FnZUlkKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTWlzc2luZyByZXF1aXJlZCBwYXJhbWV0ZXJzLlwiIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovL2FwaS50ZWxlZ3JhbS5vcmcvYm90JHt0b2tlbn0vZGVsZXRlTWVzc2FnZWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2hhdF9pZDogY2hhdCxcbiAgICAgICAgbWVzc2FnZV9pZDogbWVzc2FnZUlkLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXRhID0gKGF3YWl0IHJlc3BvbnNlLmpzb24oKSkgYXMge1xuICAgICAgb2s6IGJvb2xlYW47XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9O1xuXG4gICAgaWYgKHJlc3BvbnNlLm9rICYmIGRhdGEub2spIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBkYXRhLmRlc2NyaXB0aW9uIHx8IGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWAsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpLFxuICAgIH07XG4gIH1cbn1cbiIsICJpbXBvcnQge1xuICBGb3JtLFxuICBBY3Rpb25QYW5lbCxcbiAgQWN0aW9uLFxuICBzaG93VG9hc3QsXG4gIFRvYXN0LFxuICB1c2VOYXZpZ2F0aW9uLFxuICBJY29uLFxuICBLZXlib2FyZCxcbn0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IGZvcm1hdEZvclRlbGVncmFtIH0gZnJvbSBcIi4vdGVsZWdyYW1cIjtcbmltcG9ydCB7IGFkZFNjaGVkdWxlZFBvc3QsIGdldFJhbmRvbUZ1dHVyZURhdGUgfSBmcm9tIFwiLi9zY2hlZHVsZXJcIjtcblxuaW50ZXJmYWNlIFNjaGVkdWxlRm9ybVByb3BzIHtcbiAgd29yZE5hbWU6IHN0cmluZztcbiAgbWFya2Rvd25Db250ZW50OiBzdHJpbmc7XG4gIG9uU2NoZWR1bGVkPzogKCkgPT4gdm9pZDtcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXMpIHJldHVybiBcIlwiO1xuICByZXR1cm4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSk7XG59XG5cbmludGVyZmFjZSBGb3JtVmFsdWVzIHtcbiAgc2NoZWR1bGVkRGF0ZTogRGF0ZSB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTY2hlZHVsZUZvcm0oe1xuICB3b3JkTmFtZSxcbiAgbWFya2Rvd25Db250ZW50LFxuICBvblNjaGVkdWxlZCxcbn06IFNjaGVkdWxlRm9ybVByb3BzKSB7XG4gIGNvbnN0IHsgcG9wIH0gPSB1c2VOYXZpZ2F0aW9uKCk7XG5cbiAgLy8gRGVmYXVsdCBpbml0aWFsIHNjaGVkdWxlZCBkYXRlOiAxIGhvdXIgZnJvbSBub3dcbiAgY29uc3QgZGVmYXVsdERhdGUgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgNjAgKiA2MCAqIDEwMDApO1xuICBkZWZhdWx0RGF0ZS5zZXRTZWNvbmRzKDAsIDApO1xuXG4gIGNvbnN0IFtzY2hlZHVsZWREYXRlLCBzZXRTY2hlZHVsZWREYXRlXSA9IHVzZVN0YXRlPERhdGUgfCBudWxsPihkZWZhdWx0RGF0ZSk7XG4gIGNvbnN0IGZvcm1hdHRlZFRleHQgPSBmb3JtYXRGb3JUZWxlZ3JhbShtYXJrZG93bkNvbnRlbnQpO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZVJhbmRvbVRpbWUoKSB7XG4gICAgY29uc3QgcmFuZG9tRGF0ZSA9IGdldFJhbmRvbUZ1dHVyZURhdGUoMiwgNCk7XG4gICAgc2V0U2NoZWR1bGVkRGF0ZShyYW5kb21EYXRlKTtcbiAgICBzaG93VG9hc3Qoe1xuICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICB0aXRsZTogXCJSYW5kb20gVGltZSBQaWNrZWRcIixcbiAgICAgIG1lc3NhZ2U6IHJhbmRvbURhdGUudG9Mb2NhbGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICAgIHdlZWtkYXk6IFwic2hvcnRcIixcbiAgICAgICAgbW9udGg6IFwic2hvcnRcIixcbiAgICAgICAgZGF5OiBcIm51bWVyaWNcIixcbiAgICAgICAgaG91cjogXCJudW1lcmljXCIsXG4gICAgICAgIG1pbnV0ZTogXCIyLWRpZ2l0XCIsXG4gICAgICB9KSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdCh2YWx1ZXM6IEZvcm1WYWx1ZXMpIHtcbiAgICBjb25zdCB0YXJnZXREYXRlID0gdmFsdWVzLnNjaGVkdWxlZERhdGUgfHwgc2NoZWR1bGVkRGF0ZTtcblxuICAgIGlmICghdGFyZ2V0RGF0ZSkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIkRhdGUgUmVxdWlyZWRcIixcbiAgICAgICAgbWVzc2FnZTogXCJQbGVhc2Ugc2VsZWN0IGEgdmFsaWQgZGF0ZSBhbmQgdGltZS5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXREYXRlLmdldFRpbWUoKSA8PSBEYXRlLm5vdygpKSB7XG4gICAgICBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiSW52YWxpZCBTY2hlZHVsZWQgVGltZVwiLFxuICAgICAgICBtZXNzYWdlOiBcIlBsZWFzZSBwaWNrIGEgdGltZSBpbiB0aGUgZnV0dXJlLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGFkZFNjaGVkdWxlZFBvc3Qod29yZE5hbWUsIGZvcm1hdHRlZFRleHQsIHRhcmdldERhdGUpO1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLlN1Y2Nlc3MsXG4gICAgICAgIHRpdGxlOiBcIk1lc3NhZ2UgU2NoZWR1bGVkXCIsXG4gICAgICAgIG1lc3NhZ2U6IGBcIiR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XCIgc2NoZWR1bGVkIGZvciAke3RhcmdldERhdGUudG9Mb2NhbGVTdHJpbmcoKX1gLFxuICAgICAgfSk7XG4gICAgICBpZiAob25TY2hlZHVsZWQpIG9uU2NoZWR1bGVkKCk7XG4gICAgICBwb3AoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICB0aXRsZTogXCJTY2hlZHVsaW5nIEZhaWxlZFwiLFxuICAgICAgICBtZXNzYWdlOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxGb3JtXG4gICAgICBhY3Rpb25zPXtcbiAgICAgICAgPEFjdGlvblBhbmVsPlxuICAgICAgICAgIDxBY3Rpb24uU3VibWl0Rm9ybVxuICAgICAgICAgICAgdGl0bGU9XCJDb25maXJtIFNjaGVkdWxlXCJcbiAgICAgICAgICAgIGljb249e0ljb24uQ2FsZW5kYXJ9XG4gICAgICAgICAgICBvblN1Ym1pdD17aGFuZGxlU3VibWl0fVxuICAgICAgICAgIC8+XG4gICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgdGl0bGU9XCJTZXQgUmFuZG9tIFRpbWVcIlxuICAgICAgICAgICAgaWNvbj17SWNvbi5TaHVmZmxlfVxuICAgICAgICAgICAgc2hvcnRjdXQ9e0tleWJvYXJkLlNob3J0Y3V0LkNvbW1vbi5SZWZyZXNofVxuICAgICAgICAgICAgb25BY3Rpb249e2hhbmRsZVJhbmRvbVRpbWV9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgIH1cbiAgICA+XG4gICAgICA8Rm9ybS5EZXNjcmlwdGlvblxuICAgICAgICB0aXRsZT1cIldvcmRcIlxuICAgICAgICB0ZXh0PXtgU2NoZWR1bGluZyBcIiR7Y2FwaXRhbGl6ZSh3b3JkTmFtZSl9XCIgdG8gcG9zdCB0byBUZWxlZ3JhbWB9XG4gICAgICAvPlxuXG4gICAgICA8Rm9ybS5EYXRlUGlja2VyXG4gICAgICAgIGlkPVwic2NoZWR1bGVkRGF0ZVwiXG4gICAgICAgIHRpdGxlPVwiU2NoZWR1bGVkIERhdGUgJiBUaW1lXCJcbiAgICAgICAgdHlwZT17Rm9ybS5EYXRlUGlja2VyLlR5cGUuRGF0ZVRpbWV9XG4gICAgICAgIHZhbHVlPXtzY2hlZHVsZWREYXRlfVxuICAgICAgICBvbkNoYW5nZT17c2V0U2NoZWR1bGVkRGF0ZX1cbiAgICAgIC8+XG5cbiAgICAgIDxGb3JtLlNlcGFyYXRvciAvPlxuXG4gICAgICA8Rm9ybS5EZXNjcmlwdGlvblxuICAgICAgICB0aXRsZT1cIlJhbmRvbSBUaW1lIEdlbmVyYXRvclwiXG4gICAgICAgIHRleHQ9XCJQcmVzcyBcdTIzMThSIG9yIGNob29zZSAnU2V0IFJhbmRvbSBUaW1lJyBmcm9tIGFjdGlvbnMgdG8gYXV0b21hdGljYWxseSBwaWNrIGEgcmFuZG9tIGZ1dHVyZSBkYXl0aW1lIHNsb3QuXCJcbiAgICAgIC8+XG5cbiAgICAgIDxGb3JtLlNlcGFyYXRvciAvPlxuXG4gICAgICA8Rm9ybS5EZXNjcmlwdGlvblxuICAgICAgICB0aXRsZT1cIlRlbGVncmFtIFByZXZpZXdcIlxuICAgICAgICB0ZXh0PXtmb3JtYXR0ZWRUZXh0IHx8IFwiTm8gY29udGVudCBhdmFpbGFibGUgdG8gZm9ybWF0LlwifVxuICAgICAgLz5cbiAgICA8L0Zvcm0+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgZW52aXJvbm1lbnQgfSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzL3Byb21pc2VzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG9zIGZyb20gXCJvc1wiO1xuaW1wb3J0IHsgcG9zdFRvVGVsZWdyYW1DaGFubmVsIH0gZnJvbSBcIi4vdGVsZWdyYW1cIjtcblxuZXhwb3J0IGludGVyZmFjZSBTY2hlZHVsZWRQb3N0IHtcbiAgaWQ6IHN0cmluZztcbiAgd29yZE5hbWU6IHN0cmluZztcbiAgZm9ybWF0dGVkVGV4dDogc3RyaW5nO1xuICBzY2hlZHVsZWRBdDogc3RyaW5nOyAvLyBJU08gODYwMSBzdHJpbmdcbiAgc3RhdHVzOiBcInBlbmRpbmdcIiB8IFwicHJvY2Vzc2luZ1wiIHwgXCJzZW50XCIgfCBcImZhaWxlZFwiO1xuICBjcmVhdGVkQXQ6IHN0cmluZzsgLy8gSVNPIDg2MDEgc3RyaW5nXG4gIHNlbnRBdD86IHN0cmluZztcbiAgbWVzc2FnZUlkPzogbnVtYmVyO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBzdG9yYWdlIHBhdGggZm9yIHNjaGVkdWxlZC1wb3N0cy5qc29uLlxuICogVXNlcyBlbnZpcm9ubWVudC5zdXBwb3J0UGF0aCBpZiBhdmFpbGFibGUsIG9yIGZhbGxiYWNrIGRpcmVjdG9yeSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0b3JhZ2VEaXIoY3VzdG9tRGlyPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGN1c3RvbURpcikgcmV0dXJuIGN1c3RvbURpcjtcbiAgaWYgKHR5cGVvZiBlbnZpcm9ubWVudCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBlbnZpcm9ubWVudC5zdXBwb3J0UGF0aCkge1xuICAgIHJldHVybiBlbnZpcm9ubWVudC5zdXBwb3J0UGF0aDtcbiAgfVxuICByZXR1cm4gcGF0aC5qb2luKG9zLnRtcGRpcigpLCBcImVuZ2xpc2gtd29yZHMtd2l0aC1oaW5kaVwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0b3JhZ2VGaWxlUGF0aChjdXN0b21EaXI/OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKGdldFN0b3JhZ2VEaXIoY3VzdG9tRGlyKSwgXCJzY2hlZHVsZWQtcG9zdHMuanNvblwiKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBhbGwgc2NoZWR1bGVkIHBvc3RzIGZyb20gc3RvcmFnZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNjaGVkdWxlZFBvc3RzKFxuICBjdXN0b21EaXI/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFNjaGVkdWxlZFBvc3RbXT4ge1xuICBjb25zdCBmaWxlUGF0aCA9IGdldFN0b3JhZ2VGaWxlUGF0aChjdXN0b21EaXIpO1xuICB0cnkge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhcnNlZCkpIHtcbiAgICAgIHJldHVybiBwYXJzZWQgYXMgU2NoZWR1bGVkUG9zdFtdO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBhcnJheSBvZiBzY2hlZHVsZWQgcG9zdHMgYmFjayB0byBzdG9yYWdlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZUFsbFNjaGVkdWxlZFBvc3RzKFxuICBwb3N0czogU2NoZWR1bGVkUG9zdFtdLFxuICBjdXN0b21EaXI/OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZGlyUGF0aCA9IGdldFN0b3JhZ2VEaXIoY3VzdG9tRGlyKTtcbiAgYXdhaXQgZnMubWtkaXIoZGlyUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0U3RvcmFnZUZpbGVQYXRoKGN1c3RvbURpcik7XG4gIGF3YWl0IGZzLndyaXRlRmlsZShmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkocG9zdHMsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhIG5ldyB2b2NhYnVsYXJ5IHdvcmQgcG9zdCBmb3IgVGVsZWdyYW0uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRTY2hlZHVsZWRQb3N0KFxuICB3b3JkTmFtZTogc3RyaW5nLFxuICBmb3JtYXR0ZWRUZXh0OiBzdHJpbmcsXG4gIHNjaGVkdWxlZEF0OiBEYXRlLFxuICBjdXN0b21EaXI/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFNjaGVkdWxlZFBvc3Q+IHtcbiAgY29uc3QgcG9zdHMgPSBhd2FpdCBnZXRTY2hlZHVsZWRQb3N0cyhjdXN0b21EaXIpO1xuICBjb25zdCBuZXdQb3N0OiBTY2hlZHVsZWRQb3N0ID0ge1xuICAgIGlkOiBgcG9zdF8ke0RhdGUubm93KCl9XyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDcpfWAsXG4gICAgd29yZE5hbWUsXG4gICAgZm9ybWF0dGVkVGV4dCxcbiAgICBzY2hlZHVsZWRBdDogc2NoZWR1bGVkQXQudG9JU09TdHJpbmcoKSxcbiAgICBzdGF0dXM6IFwicGVuZGluZ1wiLFxuICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICB9O1xuXG4gIHBvc3RzLnB1c2gobmV3UG9zdCk7XG4gIGF3YWl0IHNhdmVBbGxTY2hlZHVsZWRQb3N0cyhwb3N0cywgY3VzdG9tRGlyKTtcbiAgcmV0dXJuIG5ld1Bvc3Q7XG59XG5cbi8qKlxuICogQ2FuY2Vscy9kZWxldGVzIGEgc2NoZWR1bGVkIHBvc3QgYnkgSUQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVTY2hlZHVsZWRQb3N0KFxuICBpZDogc3RyaW5nLFxuICBjdXN0b21EaXI/OiBzdHJpbmcsXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgY29uc3QgcG9zdHMgPSBhd2FpdCBnZXRTY2hlZHVsZWRQb3N0cyhjdXN0b21EaXIpO1xuICBjb25zdCBmaWx0ZXJlZCA9IHBvc3RzLmZpbHRlcigocCkgPT4gcC5pZCAhPT0gaWQpO1xuICBpZiAoZmlsdGVyZWQubGVuZ3RoICE9PSBwb3N0cy5sZW5ndGgpIHtcbiAgICBhd2FpdCBzYXZlQWxsU2NoZWR1bGVkUG9zdHMoZmlsdGVyZWQsIGN1c3RvbURpcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSBmdXR1cmUgZGF0ZSBiZXR3ZWVuIG1pbkhvdXJzQWhlYWQgYW5kIG1heERheXNBaGVhZC5cbiAqIFByZWZlcnMgZGF5dGltZSBob3VycyAoYmV0d2VlbiAwOTowMCBhbmQgMjE6MDApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFuZG9tRnV0dXJlRGF0ZShcbiAgbWluSG91cnNBaGVhZCA9IDIsXG4gIG1heERheXNBaGVhZCA9IDMsXG4gIG5vdyA9IG5ldyBEYXRlKCksXG4pOiBEYXRlIHtcbiAgY29uc3QgdGFyZ2V0ID0gbmV3IERhdGUobm93LmdldFRpbWUoKSk7XG5cbiAgLy8gUGljayBhIHJhbmRvbSBkYXkgb2Zmc2V0ICgxIHRvIG1heERheXNBaGVhZClcbiAgY29uc3QgbWluRGF5cyA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IobWluSG91cnNBaGVhZCAvIDI0KSk7XG4gIGNvbnN0IGRheU9mZnNldCA9XG4gICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heERheXNBaGVhZCAtIG1pbkRheXMgKyAxKSkgKyBtaW5EYXlzO1xuICB0YXJnZXQuc2V0RGF0ZSh0YXJnZXQuZ2V0RGF0ZSgpICsgZGF5T2Zmc2V0KTtcblxuICAvLyBQaWNrIGEgcmFuZG9tIGhvdXIgYmV0d2VlbiA5IEFNICg5KSBhbmQgOSBQTSAoMjEpXG4gIGNvbnN0IHJhbmRvbUhvdXIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMykgKyA5OyAvLyA5Li4yMVxuICBjb25zdCByYW5kb21NaW51dGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA0KSAqIDE1OyAvLyAwLCAxNSwgMzAsIDQ1XG5cbiAgdGFyZ2V0LnNldEhvdXJzKHJhbmRvbUhvdXIsIHJhbmRvbU1pbnV0ZSwgMCwgMCk7XG5cbiAgLy8gRmFsbGJhY2sgaWYgdGFyZ2V0IGlzIGluIHBhc3RcbiAgaWYgKHRhcmdldC5nZXRUaW1lKCkgPD0gbm93LmdldFRpbWUoKSkge1xuICAgIHRhcmdldC5zZXRUaW1lKG5vdy5nZXRUaW1lKCkgKyBtaW5Ib3Vyc0FoZWFkICogNjAgKiA2MCAqIDEwMDApO1xuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBQcm9jZXNzIG92ZXJkdWUgcGVuZGluZyBzY2hlZHVsZWQgcG9zdHMgYW5kIHBvc3QgdGhlbSB0byBUZWxlZ3JhbS5cbiAqIFVzZXMgYXRvbWljIGZpbGUgbG9jayAobWFya2luZyBpdGVtcyBhcyBcInByb2Nlc3NpbmdcIikgdG8gcHJldmVudCBkdXBsaWNhdGUgcG9zdGluZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NQZW5kaW5nUG9zdHMoXG4gIGJvdFRva2VuOiBzdHJpbmcsXG4gIGNoYXRJZDogc3RyaW5nLFxuICBjdXN0b21EaXI/OiBzdHJpbmcsXG4pOiBQcm9taXNlPHtcbiAgcHJvY2Vzc2VkOiBudW1iZXI7XG4gIHNlbnQ6IG51bWJlcjtcbiAgZmFpbGVkOiBudW1iZXI7XG4gIHNlbnRXb3Jkczogc3RyaW5nW107XG59PiB7XG4gIGlmICghYm90VG9rZW4gfHwgIWNoYXRJZCkge1xuICAgIHJldHVybiB7IHByb2Nlc3NlZDogMCwgc2VudDogMCwgZmFpbGVkOiAwLCBzZW50V29yZHM6IFtdIH07XG4gIH1cblxuICAvLyAxLiBSZWxvYWQgbGF0ZXN0IHBvc3RzIGZyb20gc3RvcmFnZVxuICBjb25zdCBwb3N0cyA9IGF3YWl0IGdldFNjaGVkdWxlZFBvc3RzKGN1c3RvbURpcik7XG4gIGNvbnN0IG5vd0lTTyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAvLyAyLiBJZGVudGlmeSBvdmVyZHVlIHBlbmRpbmcgcG9zdHNcbiAgY29uc3QgcGVuZGluZ0l0ZW1zID0gcG9zdHMuZmlsdGVyKFxuICAgIChwb3N0KSA9PiBwb3N0LnN0YXR1cyA9PT0gXCJwZW5kaW5nXCIgJiYgcG9zdC5zY2hlZHVsZWRBdCA8PSBub3dJU08sXG4gICk7XG5cbiAgaWYgKHBlbmRpbmdJdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyBwcm9jZXNzZWQ6IDAsIHNlbnQ6IDAsIGZhaWxlZDogMCwgc2VudFdvcmRzOiBbXSB9O1xuICB9XG5cbiAgLy8gMy4gTWFyayBpdGVtcyBhcyBcInByb2Nlc3NpbmdcIiBJTU1FRElBVEVMWSBhbmQgd3JpdGUgdG8gc3RvcmFnZS5cbiAgLy8gVGhpcyBsb2NrcyB0aGUgaXRlbXMgc28gYW55IGNvbmN1cnJlbnQgcHJvY2VzcyBza2lwcyB0aGVtLlxuICBmb3IgKGNvbnN0IHBvc3Qgb2YgcGVuZGluZ0l0ZW1zKSB7XG4gICAgcG9zdC5zdGF0dXMgPSBcInByb2Nlc3NpbmdcIjtcbiAgfVxuICBhd2FpdCBzYXZlQWxsU2NoZWR1bGVkUG9zdHMocG9zdHMsIGN1c3RvbURpcik7XG5cbiAgLy8gNC4gUHJvY2VzcyBlYWNoIGxvY2tlZCBwb3N0XG4gIGxldCBzZW50Q291bnQgPSAwO1xuICBsZXQgZmFpbGVkQ291bnQgPSAwO1xuICBjb25zdCBzZW50V29yZHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwb3N0IG9mIHBlbmRpbmdJdGVtcykge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBvc3RUb1RlbGVncmFtQ2hhbm5lbChcbiAgICAgIGJvdFRva2VuLFxuICAgICAgY2hhdElkLFxuICAgICAgcG9zdC5mb3JtYXR0ZWRUZXh0LFxuICAgICk7XG4gICAgaWYgKHJlcy5zdWNjZXNzKSB7XG4gICAgICBwb3N0LnN0YXR1cyA9IFwic2VudFwiO1xuICAgICAgcG9zdC5zZW50QXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICBpZiAocmVzLm1lc3NhZ2VJZCkge1xuICAgICAgICBwb3N0Lm1lc3NhZ2VJZCA9IHJlcy5tZXNzYWdlSWQ7XG4gICAgICB9XG4gICAgICBzZW50Q291bnQrKztcbiAgICAgIHNlbnRXb3Jkcy5wdXNoKHBvc3Qud29yZE5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwb3N0LnN0YXR1cyA9IFwiZmFpbGVkXCI7XG4gICAgICBwb3N0LmVycm9yID0gcmVzLm1lc3NhZ2UgfHwgXCJGYWlsZWQgdG8gcG9zdCB0byBUZWxlZ3JhbVwiO1xuICAgICAgZmFpbGVkQ291bnQrKztcbiAgICB9XG4gIH1cblxuICAvLyA1LiBXcml0ZSBmaW5hbCBzdGF0dXMgKFwic2VudFwiIG9yIFwiZmFpbGVkXCIpIGJhY2sgdG8gZGlza1xuICBhd2FpdCBzYXZlQWxsU2NoZWR1bGVkUG9zdHMocG9zdHMsIGN1c3RvbURpcik7XG5cbiAgcmV0dXJuIHtcbiAgICBwcm9jZXNzZWQ6IHBlbmRpbmdJdGVtcy5sZW5ndGgsXG4gICAgc2VudDogc2VudENvdW50LFxuICAgIGZhaWxlZDogZmFpbGVkQ291bnQsXG4gICAgc2VudFdvcmRzLFxuICB9O1xufVxuIiwgImltcG9ydCB7XG4gIExpc3QsXG4gIEFjdGlvblBhbmVsLFxuICBBY3Rpb24sXG4gIEljb24sXG4gIENvbG9yLFxuICBzaG93VG9hc3QsXG4gIFRvYXN0LFxuICBnZXRQcmVmZXJlbmNlVmFsdWVzLFxuICBLZXlib2FyZCxcbn0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHtcbiAgZ2V0U2NoZWR1bGVkUG9zdHMsXG4gIGRlbGV0ZVNjaGVkdWxlZFBvc3QsXG4gIHNhdmVBbGxTY2hlZHVsZWRQb3N0cyxcbiAgcHJvY2Vzc1BlbmRpbmdQb3N0cyxcbiAgU2NoZWR1bGVkUG9zdCxcbn0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyBwb3N0VG9UZWxlZ3JhbUNoYW5uZWwgfSBmcm9tIFwiLi90ZWxlZ3JhbVwiO1xuXG5pbnRlcmZhY2UgUHJlZmVyZW5jZXMge1xuICB0ZWxlZ3JhbUJvdFRva2VuPzogc3RyaW5nO1xuICB0ZWxlZ3JhbUNoYXRJZD86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXMpIHJldHVybiBcIlwiO1xuICByZXR1cm4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTY2hlZHVsZWRMaXN0KCkge1xuICBjb25zdCBbcG9zdHMsIHNldFBvc3RzXSA9IHVzZVN0YXRlPFNjaGVkdWxlZFBvc3RbXT4oW10pO1xuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gbG9hZFBvc3RzKCkge1xuICAgIHNldElzTG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcHJlZnMgPSBnZXRQcmVmZXJlbmNlVmFsdWVzPFByZWZlcmVuY2VzPigpO1xuICAgICAgaWYgKHByZWZzLnRlbGVncmFtQm90VG9rZW4gJiYgcHJlZnMudGVsZWdyYW1DaGF0SWQpIHtcbiAgICAgICAgYXdhaXQgcHJvY2Vzc1BlbmRpbmdQb3N0cyhcbiAgICAgICAgICBwcmVmcy50ZWxlZ3JhbUJvdFRva2VuLnRyaW0oKSxcbiAgICAgICAgICBwcmVmcy50ZWxlZ3JhbUNoYXRJZC50cmltKCksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2V0U2NoZWR1bGVkUG9zdHMoKTtcbiAgICAgIC8vIFNvcnQgbmV3ZXN0IHNjaGVkdWxlZCBmaXJzdFxuICAgICAgZGF0YS5zb3J0KFxuICAgICAgICAoYSwgYikgPT5cbiAgICAgICAgICBuZXcgRGF0ZShhLnNjaGVkdWxlZEF0KS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShiLnNjaGVkdWxlZEF0KS5nZXRUaW1lKCksXG4gICAgICApO1xuICAgICAgc2V0UG9zdHMoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiRmFpbGVkIHRvIGxvYWQgc2NoZWR1bGVkIHBvc3RzXCIsXG4gICAgICAgIG1lc3NhZ2U6IFN0cmluZyhlcnIpLFxuICAgICAgfSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsb2FkUG9zdHMoKTtcbiAgfSwgW10pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZURlbGV0ZShpZDogc3RyaW5nLCB3b3JkTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IGRlbGV0ZVNjaGVkdWxlZFBvc3QoaWQpO1xuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICBzZXRQb3N0cygocHJldikgPT4gcHJldi5maWx0ZXIoKHApID0+IHAuaWQgIT09IGlkKSk7XG4gICAgICBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuU3VjY2VzcyxcbiAgICAgICAgdGl0bGU6IFwiU2NoZWR1bGUgQ2FuY2VsbGVkXCIsXG4gICAgICAgIG1lc3NhZ2U6IGBDYW5jZWxsZWQgc2NoZWR1bGUgZm9yIFwiJHtjYXBpdGFsaXplKHdvcmROYW1lKX1cImAsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVQb3N0Tm93KHBvc3Q6IFNjaGVkdWxlZFBvc3QpIHtcbiAgICBjb25zdCBwcmVmcyA9IGdldFByZWZlcmVuY2VWYWx1ZXM8UHJlZmVyZW5jZXM+KCk7XG4gICAgY29uc3QgYm90VG9rZW4gPSBwcmVmcy50ZWxlZ3JhbUJvdFRva2VuPy50cmltKCk7XG4gICAgY29uc3QgY2hhdElkID0gcHJlZnMudGVsZWdyYW1DaGF0SWQ/LnRyaW0oKTtcblxuICAgIGlmICghYm90VG9rZW4gfHwgIWNoYXRJZCkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHtcbiAgICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsXG4gICAgICAgIHRpdGxlOiBcIlRlbGVncmFtIENyZWRlbnRpYWxzIE1pc3NpbmdcIixcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcIlBsZWFzZSBjb25maWd1cmUgVGVsZWdyYW0gQm90IFRva2VuIGFuZCBDaGF0IElEIGluIHByZWZlcmVuY2VzLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdG9hc3QgPSBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgc3R5bGU6IFRvYXN0LlN0eWxlLkFuaW1hdGVkLFxuICAgICAgdGl0bGU6IGBQb3N0aW5nIFwiJHtjYXBpdGFsaXplKHBvc3Qud29yZE5hbWUpfVwiIG5vdy4uLmAsXG4gICAgfSk7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBwb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gICAgICBib3RUb2tlbixcbiAgICAgIGNoYXRJZCxcbiAgICAgIHBvc3QuZm9ybWF0dGVkVGV4dCxcbiAgICApO1xuICAgIGlmIChyZXMuc3VjY2Vzcykge1xuICAgICAgcG9zdC5zdGF0dXMgPSBcInNlbnRcIjtcbiAgICAgIHBvc3Quc2VudEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgY29uc3QgdXBkYXRlZCA9IHBvc3RzLm1hcCgocCkgPT4gKHAuaWQgPT09IHBvc3QuaWQgPyBwb3N0IDogcCkpO1xuICAgICAgYXdhaXQgc2F2ZUFsbFNjaGVkdWxlZFBvc3RzKHVwZGF0ZWQpO1xuICAgICAgc2V0UG9zdHModXBkYXRlZCk7XG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLlN1Y2Nlc3M7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiUG9zdGVkIHRvIFRlbGVncmFtXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvc3Quc3RhdHVzID0gXCJmYWlsZWRcIjtcbiAgICAgIHBvc3QuZXJyb3IgPSByZXMubWVzc2FnZTtcbiAgICAgIGNvbnN0IHVwZGF0ZWQgPSBwb3N0cy5tYXAoKHApID0+IChwLmlkID09PSBwb3N0LmlkID8gcG9zdCA6IHApKTtcbiAgICAgIGF3YWl0IHNhdmVBbGxTY2hlZHVsZWRQb3N0cyh1cGRhdGVkKTtcbiAgICAgIHNldFBvc3RzKHVwZGF0ZWQpO1xuICAgICAgdG9hc3Quc3R5bGUgPSBUb2FzdC5TdHlsZS5GYWlsdXJlO1xuICAgICAgdG9hc3QudGl0bGUgPSBcIlBvc3RpbmcgRmFpbGVkXCI7XG4gICAgICB0b2FzdC5tZXNzYWdlID0gcmVzLm1lc3NhZ2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8TGlzdFxuICAgICAgaXNMb2FkaW5nPXtpc0xvYWRpbmd9XG4gICAgICBpc1Nob3dpbmdEZXRhaWxcbiAgICAgIHNlYXJjaEJhclBsYWNlaG9sZGVyPVwiRmlsdGVyIHNjaGVkdWxlZCB3b3Jkcy4uLlwiXG4gICAgPlxuICAgICAge3Bvc3RzLmxlbmd0aCA9PT0gMCAmJiAhaXNMb2FkaW5nID8gKFxuICAgICAgICA8TGlzdC5FbXB0eVZpZXdcbiAgICAgICAgICBpY29uPXtJY29uLkNhbGVuZGFyfVxuICAgICAgICAgIHRpdGxlPVwiTm8gU2NoZWR1bGVkIFBvc3RzXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbj1cIlVzZSAnU2NoZWR1bGUgZm9yIFRlbGVncmFtJyB3aGVuIGluc3BlY3RpbmcgYSB3b3JkIHRvIHF1ZXVlIHBvc3RzLlwiXG4gICAgICAgIC8+XG4gICAgICApIDogKFxuICAgICAgICBwb3N0cy5tYXAoKHBvc3QpID0+IHtcbiAgICAgICAgICBjb25zdCBkYXRlT2JqID0gbmV3IERhdGUocG9zdC5zY2hlZHVsZWRBdCk7XG4gICAgICAgICAgY29uc3QgZGF0ZVN0ciA9IGRhdGVPYmoudG9Mb2NhbGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICAgICAgICBtb250aDogXCJzaG9ydFwiLFxuICAgICAgICAgICAgZGF5OiBcIm51bWVyaWNcIixcbiAgICAgICAgICAgIGhvdXI6IFwibnVtZXJpY1wiLFxuICAgICAgICAgICAgbWludXRlOiBcIjItZGlnaXRcIixcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxldCB0YWdDb2xvciA9IENvbG9yLlllbGxvdztcbiAgICAgICAgICBsZXQgdGFnVGV4dCA9IFwiUGVuZGluZ1wiO1xuICAgICAgICAgIGlmIChwb3N0LnN0YXR1cyA9PT0gXCJzZW50XCIpIHtcbiAgICAgICAgICAgIHRhZ0NvbG9yID0gQ29sb3IuR3JlZW47XG4gICAgICAgICAgICB0YWdUZXh0ID0gXCJTZW50XCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb3N0LnN0YXR1cyA9PT0gXCJwcm9jZXNzaW5nXCIpIHtcbiAgICAgICAgICAgIHRhZ0NvbG9yID0gQ29sb3IuQmx1ZTtcbiAgICAgICAgICAgIHRhZ1RleHQgPSBcIlBvc3RpbmcuLi5cIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvc3Quc3RhdHVzID09PSBcImZhaWxlZFwiKSB7XG4gICAgICAgICAgICB0YWdDb2xvciA9IENvbG9yLlJlZDtcbiAgICAgICAgICAgIHRhZ1RleHQgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8TGlzdC5JdGVtXG4gICAgICAgICAgICAgIGtleT17cG9zdC5pZH1cbiAgICAgICAgICAgICAgdGl0bGU9e2NhcGl0YWxpemUocG9zdC53b3JkTmFtZSl9XG4gICAgICAgICAgICAgIHN1YnRpdGxlPXtkYXRlU3RyfVxuICAgICAgICAgICAgICBrZXl3b3Jkcz17W3Bvc3Qud29yZE5hbWUsIHRhZ1RleHQsIHBvc3Quc3RhdHVzXX1cbiAgICAgICAgICAgICAgYWNjZXNzb3JpZXM9e1t7IHRhZzogeyB2YWx1ZTogdGFnVGV4dCwgY29sb3I6IHRhZ0NvbG9yIH0gfV19XG4gICAgICAgICAgICAgIGRldGFpbD17XG4gICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWxcbiAgICAgICAgICAgICAgICAgIG1hcmtkb3duPXtwb3N0LmZvcm1hdHRlZFRleHR9XG4gICAgICAgICAgICAgICAgICBtZXRhZGF0YT17XG4gICAgICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsLk1ldGFkYXRhPlxuICAgICAgICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsLk1ldGFkYXRhLkxhYmVsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlNjaGVkdWxlZCBEYXRlICYgVGltZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0PXtkYXRlU3RyfVxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGEuVGFnTGlzdCB0aXRsZT1cIlN0YXR1c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGEuVGFnTGlzdC5JdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ9e3RhZ1RleHR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yPXt0YWdDb2xvcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9MaXN0Lkl0ZW0uRGV0YWlsLk1ldGFkYXRhLlRhZ0xpc3Q+XG4gICAgICAgICAgICAgICAgICAgICAge3Bvc3Quc2VudEF0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsLk1ldGFkYXRhLkxhYmVsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiU2VudCBBdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ9e25ldyBEYXRlKHBvc3Quc2VudEF0KS50b0xvY2FsZVN0cmluZygpfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgIHtwb3N0LmVycm9yICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxMaXN0Lkl0ZW0uRGV0YWlsLk1ldGFkYXRhLkxhYmVsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiRXJyb3JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0PXtwb3N0LmVycm9yfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L0xpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGE+XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgICAgICAgICB7cG9zdC5zdGF0dXMgIT09IFwic2VudFwiICYmIChcbiAgICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUG9zdCB0byBUZWxlZ3JhbSBOb3dcIlxuICAgICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uUGFwZXJwbGFuZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17KCkgPT4gaGFuZGxlUG9zdE5vdyhwb3N0KX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2FuY2VsIC8gRGVsZXRlIFNjaGVkdWxlXCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5UcmFzaH1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e0FjdGlvbi5TdHlsZS5EZXN0cnVjdGl2ZX1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e0tleWJvYXJkLlNob3J0Y3V0LkNvbW1vbi5SZW1vdmV9XG4gICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVEZWxldGUocG9zdC5pZCwgcG9zdC53b3JkTmFtZSl9XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPEFjdGlvblxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIlJlZnJlc2ggTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIGljb249e0ljb24uQXJyb3dDbG9ja3dpc2V9XG4gICAgICAgICAgICAgICAgICAgIHNob3J0Y3V0PXtLZXlib2FyZC5TaG9ydGN1dC5Db21tb24uUmVmcmVzaH1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249e2xvYWRQb3N0c31cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgKX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjaGVkdWxlZExpc3Q7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsY0FjTztBQUNQLElBQUFDLGdCQUFxRDtBQUNyRCxJQUFBQyxtQkFBZTtB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LFNBQVMsSUFBSTtBQUFBO0FBQUEsY0FDOUM7QUFBQSxjQUNBO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU07QUFBQSxrQkFDTixNQUFNLGlCQUFLO0FBQUEsa0JBQ1gsVUFBVSxNQUFNLHFCQUFxQixTQUFTLElBQUk7QUFBQTtBQUFBLGNBQ3BEO0FBQUEsY0FDQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFNO0FBQUEsa0JBQ04sTUFBTSxpQkFBSztBQUFBLGtCQUNYLFVBQVUscUJBQVMsU0FBUyxPQUFPO0FBQUEsa0JBQ25DLFVBQVUsTUFBTSxhQUFhLFNBQVMsTUFBTSxJQUFJO0FBQUE7QUFBQSxjQUNsRDtBQUFBLGNBQ0E7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsT0FBTTtBQUFBLGtCQUNOLE1BQU0saUJBQUs7QUFBQSxrQkFDWCxPQUFPLG1CQUFPLE1BQU07QUFBQSxrQkFDcEIsVUFBVSxFQUFFLFdBQVcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxJQUFJO0FBQUEsa0JBQzFDLFVBQVUsTUFBTSxhQUFhLFNBQVMsSUFBSTtBQUFBO0FBQUEsY0FDNUM7QUFBQSxlQUNGO0FBQUE7QUFBQSxVQXRGRyxTQUFTO0FBQUEsUUF3RmhCLENBQ0QsR0FDSCxJQUVBLENBQUMsa0JBQ0QsQ0FBQyxrQkFDQztBQUFBLFVBQUMsaUJBQUs7QUFBQSxVQUFMO0FBQUEsWUFDQyxPQUFNO0FBQUEsWUFDTixhQUFZO0FBQUEsWUFDWixNQUFNLGlCQUFLO0FBQUE7QUFBQSxRQUNiO0FBQUE7QUFBQTtBQUFBLEVBR047QUFFSjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2FwaSIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X3Byb21pc2VzIiwgImltcG9ydF9vcyIsICJpbXBvcnRfcGF0aCIsICJpbXBvcnRfYXBpIiwgInBhdGgiLCAib3MiLCAiZnMiLCAiaW1wb3J0X2FwaSIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgImNhcGl0YWxpemUiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgInBhdGgiLCAib3MiLCAiY2FwaXRhbGl6ZSIsICJmcyIsICJ0ZXh0Il0KfQo=
