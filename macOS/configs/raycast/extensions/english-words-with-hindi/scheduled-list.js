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

// src/scheduled-list.tsx
var scheduled_list_exports = {};
__export(scheduled_list_exports, {
  ScheduledList: () => ScheduledList,
  default: () => scheduled_list_default
});
module.exports = __toCommonJS(scheduled_list_exports);
var import_api2 = require("@raycast/api");
var import_react = require("react");

// src/scheduler.ts
var import_api = require("@raycast/api");
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var import_os = __toESM(require("os"));

// src/telegram.ts
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

// src/scheduler.ts
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
async function deleteScheduledPost(id, customDir) {
  const posts = await getScheduledPosts(customDir);
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length !== posts.length) {
    await saveAllScheduledPosts(filtered, customDir);
    return true;
  }
  return false;
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

// src/scheduled-list.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function ScheduledList() {
  const [posts, setPosts] = (0, import_react.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  async function loadPosts() {
    setIsLoading(true);
    try {
      const prefs = (0, import_api2.getPreferenceValues)();
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
      (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Failure,
        title: "Failed to load scheduled posts",
        message: String(err)
      });
    } finally {
      setIsLoading(false);
    }
  }
  (0, import_react.useEffect)(() => {
    loadPosts();
  }, []);
  async function handleDelete(id, wordName) {
    const success = await deleteScheduledPost(id);
    if (success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      await (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Success,
        title: "Schedule Cancelled",
        message: `Cancelled schedule for "${capitalize(wordName)}"`
      });
    }
  }
  async function handlePostNow(post) {
    const prefs = (0, import_api2.getPreferenceValues)();
    const botToken = prefs.telegramBotToken?.trim();
    const chatId = prefs.telegramChatId?.trim();
    if (!botToken || !chatId) {
      await (0, import_api2.showToast)({
        style: import_api2.Toast.Style.Failure,
        title: "Telegram Credentials Missing",
        message: "Please configure Telegram Bot Token and Chat ID in preferences."
      });
      return;
    }
    const toast = await (0, import_api2.showToast)({
      style: import_api2.Toast.Style.Animated,
      title: `Posting "${capitalize(post.wordName)}" now...`
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
      toast.style = import_api2.Toast.Style.Success;
      toast.title = "Posted to Telegram";
    } else {
      post.status = "failed";
      post.error = res.message;
      const updated = posts.map((p) => p.id === post.id ? post : p);
      await saveAllScheduledPosts(updated);
      setPosts(updated);
      toast.style = import_api2.Toast.Style.Failure;
      toast.title = "Posting Failed";
      toast.message = res.message;
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_api2.List,
    {
      isLoading,
      isShowingDetail: true,
      searchBarPlaceholder: "Filter scheduled words...",
      children: posts.length === 0 && !isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_api2.List.EmptyView,
        {
          icon: import_api2.Icon.Calendar,
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
        let tagColor = import_api2.Color.Yellow;
        let tagText = "Pending";
        if (post.status === "sent") {
          tagColor = import_api2.Color.Green;
          tagText = "Sent";
        } else if (post.status === "processing") {
          tagColor = import_api2.Color.Blue;
          tagText = "Posting...";
        } else if (post.status === "failed") {
          tagColor = import_api2.Color.Red;
          tagText = "Failed";
        }
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api2.List.Item,
          {
            title: capitalize(post.wordName),
            subtitle: dateStr,
            keywords: [post.wordName, tagText, post.status],
            accessories: [{ tag: { value: tagText, color: tagColor } }],
            detail: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_api2.List.Item.Detail,
              {
                markdown: post.formattedText,
                metadata: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api2.List.Item.Detail.Metadata, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_api2.List.Item.Detail.Metadata.Label,
                    {
                      title: "Scheduled Date & Time",
                      text: dateStr
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api2.List.Item.Detail.Metadata.TagList, { title: "Status", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_api2.List.Item.Detail.Metadata.TagList.Item,
                    {
                      text: tagText,
                      color: tagColor
                    }
                  ) }),
                  post.sentAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_api2.List.Item.Detail.Metadata.Label,
                    {
                      title: "Sent At",
                      text: new Date(post.sentAt).toLocaleString()
                    }
                  ),
                  post.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_api2.List.Item.Detail.Metadata.Label,
                    {
                      title: "Error",
                      text: post.error
                    }
                  )
                ] })
              }
            ),
            actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api2.ActionPanel, { children: [
              post.status !== "sent" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api2.Action,
                {
                  title: "Post to Telegram Now",
                  icon: import_api2.Icon.Paperplane,
                  onAction: () => handlePostNow(post)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api2.Action,
                {
                  title: "Cancel / Delete Schedule",
                  icon: import_api2.Icon.Trash,
                  style: import_api2.Action.Style.Destructive,
                  shortcut: import_api2.Keyboard.Shortcut.Common.Remove,
                  onAction: () => handleDelete(post.id, post.wordName)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_api2.Action,
                {
                  title: "Refresh List",
                  icon: import_api2.Icon.ArrowClockwise,
                  shortcut: import_api2.Keyboard.Shortcut.Common.Refresh,
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
var scheduled_list_default = ScheduledList;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScheduledList
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9zY2hlZHVsZWQtbGlzdC50c3giLCAiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy9zY2hlZHVsZXIudHMiLCAiLi4vLi4vLi4vLi4vZ2l0cmVwb3MvZG90ZmlsZXMvbWFjT1MvY29uZmlncy9yYXljYXN0L2V4dGVuc2lvbnMvZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpL3NyYy90ZWxlZ3JhbS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgTGlzdCxcbiAgQWN0aW9uUGFuZWwsXG4gIEFjdGlvbixcbiAgSWNvbixcbiAgQ29sb3IsXG4gIHNob3dUb2FzdCxcbiAgVG9hc3QsXG4gIGdldFByZWZlcmVuY2VWYWx1ZXMsXG4gIEtleWJvYXJkLFxufSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQge1xuICBnZXRTY2hlZHVsZWRQb3N0cyxcbiAgZGVsZXRlU2NoZWR1bGVkUG9zdCxcbiAgc2F2ZUFsbFNjaGVkdWxlZFBvc3RzLFxuICBwcm9jZXNzUGVuZGluZ1Bvc3RzLFxuICBTY2hlZHVsZWRQb3N0LFxufSBmcm9tIFwiLi9zY2hlZHVsZXJcIjtcbmltcG9ydCB7IHBvc3RUb1RlbGVncmFtQ2hhbm5lbCB9IGZyb20gXCIuL3RlbGVncmFtXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIHRlbGVncmFtQm90VG9rZW4/OiBzdHJpbmc7XG4gIHRlbGVncmFtQ2hhdElkPzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBjYXBpdGFsaXplKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghcykgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNjaGVkdWxlZExpc3QoKSB7XG4gIGNvbnN0IFtwb3N0cywgc2V0UG9zdHNdID0gdXNlU3RhdGU8U2NoZWR1bGVkUG9zdFtdPihbXSk7XG4gIGNvbnN0IFtpc0xvYWRpbmcsIHNldElzTG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcblxuICBhc3luYyBmdW5jdGlvbiBsb2FkUG9zdHMoKSB7XG4gICAgc2V0SXNMb2FkaW5nKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcmVmcyA9IGdldFByZWZlcmVuY2VWYWx1ZXM8UHJlZmVyZW5jZXM+KCk7XG4gICAgICBpZiAocHJlZnMudGVsZWdyYW1Cb3RUb2tlbiAmJiBwcmVmcy50ZWxlZ3JhbUNoYXRJZCkge1xuICAgICAgICBhd2FpdCBwcm9jZXNzUGVuZGluZ1Bvc3RzKFxuICAgICAgICAgIHByZWZzLnRlbGVncmFtQm90VG9rZW4udHJpbSgpLFxuICAgICAgICAgIHByZWZzLnRlbGVncmFtQ2hhdElkLnRyaW0oKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZXRTY2hlZHVsZWRQb3N0cygpO1xuICAgICAgLy8gU29ydCBuZXdlc3Qgc2NoZWR1bGVkIGZpcnN0XG4gICAgICBkYXRhLnNvcnQoXG4gICAgICAgIChhLCBiKSA9PlxuICAgICAgICAgIG5ldyBEYXRlKGEuc2NoZWR1bGVkQXQpLmdldFRpbWUoKSAtIG5ldyBEYXRlKGIuc2NoZWR1bGVkQXQpLmdldFRpbWUoKSxcbiAgICAgICk7XG4gICAgICBzZXRQb3N0cyhkYXRhKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNob3dUb2FzdCh7XG4gICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5GYWlsdXJlLFxuICAgICAgICB0aXRsZTogXCJGYWlsZWQgdG8gbG9hZCBzY2hlZHVsZWQgcG9zdHNcIixcbiAgICAgICAgbWVzc2FnZTogU3RyaW5nKGVyciksXG4gICAgICB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxvYWRQb3N0cygpO1xuICB9LCBbXSk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlRGVsZXRlKGlkOiBzdHJpbmcsIHdvcmROYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgZGVsZXRlU2NoZWR1bGVkUG9zdChpZCk7XG4gICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgIHNldFBvc3RzKChwcmV2KSA9PiBwcmV2LmZpbHRlcigocCkgPT4gcC5pZCAhPT0gaWQpKTtcbiAgICAgIGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICAgIHN0eWxlOiBUb2FzdC5TdHlsZS5TdWNjZXNzLFxuICAgICAgICB0aXRsZTogXCJTY2hlZHVsZSBDYW5jZWxsZWRcIixcbiAgICAgICAgbWVzc2FnZTogYENhbmNlbGxlZCBzY2hlZHVsZSBmb3IgXCIke2NhcGl0YWxpemUod29yZE5hbWUpfVwiYCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVBvc3ROb3cocG9zdDogU2NoZWR1bGVkUG9zdCkge1xuICAgIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgICBjb25zdCBib3RUb2tlbiA9IHByZWZzLnRlbGVncmFtQm90VG9rZW4/LnRyaW0oKTtcbiAgICBjb25zdCBjaGF0SWQgPSBwcmVmcy50ZWxlZ3JhbUNoYXRJZD8udHJpbSgpO1xuXG4gICAgaWYgKCFib3RUb2tlbiB8fCAhY2hhdElkKSB7XG4gICAgICBhd2FpdCBzaG93VG9hc3Qoe1xuICAgICAgICBzdHlsZTogVG9hc3QuU3R5bGUuRmFpbHVyZSxcbiAgICAgICAgdGl0bGU6IFwiVGVsZWdyYW0gQ3JlZGVudGlhbHMgTWlzc2luZ1wiLFxuICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgIFwiUGxlYXNlIGNvbmZpZ3VyZSBUZWxlZ3JhbSBCb3QgVG9rZW4gYW5kIENoYXQgSUQgaW4gcHJlZmVyZW5jZXMuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0b2FzdCA9IGF3YWl0IHNob3dUb2FzdCh7XG4gICAgICBzdHlsZTogVG9hc3QuU3R5bGUuQW5pbWF0ZWQsXG4gICAgICB0aXRsZTogYFBvc3RpbmcgXCIke2NhcGl0YWxpemUocG9zdC53b3JkTmFtZSl9XCIgbm93Li4uYCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBvc3RUb1RlbGVncmFtQ2hhbm5lbChcbiAgICAgIGJvdFRva2VuLFxuICAgICAgY2hhdElkLFxuICAgICAgcG9zdC5mb3JtYXR0ZWRUZXh0LFxuICAgICk7XG4gICAgaWYgKHJlcy5zdWNjZXNzKSB7XG4gICAgICBwb3N0LnN0YXR1cyA9IFwic2VudFwiO1xuICAgICAgcG9zdC5zZW50QXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICBjb25zdCB1cGRhdGVkID0gcG9zdHMubWFwKChwKSA9PiAocC5pZCA9PT0gcG9zdC5pZCA/IHBvc3QgOiBwKSk7XG4gICAgICBhd2FpdCBzYXZlQWxsU2NoZWR1bGVkUG9zdHModXBkYXRlZCk7XG4gICAgICBzZXRQb3N0cyh1cGRhdGVkKTtcbiAgICAgIHRvYXN0LnN0eWxlID0gVG9hc3QuU3R5bGUuU3VjY2VzcztcbiAgICAgIHRvYXN0LnRpdGxlID0gXCJQb3N0ZWQgdG8gVGVsZWdyYW1cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zdC5zdGF0dXMgPSBcImZhaWxlZFwiO1xuICAgICAgcG9zdC5lcnJvciA9IHJlcy5tZXNzYWdlO1xuICAgICAgY29uc3QgdXBkYXRlZCA9IHBvc3RzLm1hcCgocCkgPT4gKHAuaWQgPT09IHBvc3QuaWQgPyBwb3N0IDogcCkpO1xuICAgICAgYXdhaXQgc2F2ZUFsbFNjaGVkdWxlZFBvc3RzKHVwZGF0ZWQpO1xuICAgICAgc2V0UG9zdHModXBkYXRlZCk7XG4gICAgICB0b2FzdC5zdHlsZSA9IFRvYXN0LlN0eWxlLkZhaWx1cmU7XG4gICAgICB0b2FzdC50aXRsZSA9IFwiUG9zdGluZyBGYWlsZWRcIjtcbiAgICAgIHRvYXN0Lm1lc3NhZ2UgPSByZXMubWVzc2FnZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxMaXN0XG4gICAgICBpc0xvYWRpbmc9e2lzTG9hZGluZ31cbiAgICAgIGlzU2hvd2luZ0RldGFpbFxuICAgICAgc2VhcmNoQmFyUGxhY2Vob2xkZXI9XCJGaWx0ZXIgc2NoZWR1bGVkIHdvcmRzLi4uXCJcbiAgICA+XG4gICAgICB7cG9zdHMubGVuZ3RoID09PSAwICYmICFpc0xvYWRpbmcgPyAoXG4gICAgICAgIDxMaXN0LkVtcHR5Vmlld1xuICAgICAgICAgIGljb249e0ljb24uQ2FsZW5kYXJ9XG4gICAgICAgICAgdGl0bGU9XCJObyBTY2hlZHVsZWQgUG9zdHNcIlxuICAgICAgICAgIGRlc2NyaXB0aW9uPVwiVXNlICdTY2hlZHVsZSBmb3IgVGVsZWdyYW0nIHdoZW4gaW5zcGVjdGluZyBhIHdvcmQgdG8gcXVldWUgcG9zdHMuXCJcbiAgICAgICAgLz5cbiAgICAgICkgOiAoXG4gICAgICAgIHBvc3RzLm1hcCgocG9zdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRhdGVPYmogPSBuZXcgRGF0ZShwb3N0LnNjaGVkdWxlZEF0KTtcbiAgICAgICAgICBjb25zdCBkYXRlU3RyID0gZGF0ZU9iai50b0xvY2FsZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgICAgICAgIG1vbnRoOiBcInNob3J0XCIsXG4gICAgICAgICAgICBkYXk6IFwibnVtZXJpY1wiLFxuICAgICAgICAgICAgaG91cjogXCJudW1lcmljXCIsXG4gICAgICAgICAgICBtaW51dGU6IFwiMi1kaWdpdFwiLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgbGV0IHRhZ0NvbG9yID0gQ29sb3IuWWVsbG93O1xuICAgICAgICAgIGxldCB0YWdUZXh0ID0gXCJQZW5kaW5nXCI7XG4gICAgICAgICAgaWYgKHBvc3Quc3RhdHVzID09PSBcInNlbnRcIikge1xuICAgICAgICAgICAgdGFnQ29sb3IgPSBDb2xvci5HcmVlbjtcbiAgICAgICAgICAgIHRhZ1RleHQgPSBcIlNlbnRcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvc3Quc3RhdHVzID09PSBcInByb2Nlc3NpbmdcIikge1xuICAgICAgICAgICAgdGFnQ29sb3IgPSBDb2xvci5CbHVlO1xuICAgICAgICAgICAgdGFnVGV4dCA9IFwiUG9zdGluZy4uLlwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAocG9zdC5zdGF0dXMgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgICAgICAgIHRhZ0NvbG9yID0gQ29sb3IuUmVkO1xuICAgICAgICAgICAgdGFnVGV4dCA9IFwiRmFpbGVkXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxMaXN0Lkl0ZW1cbiAgICAgICAgICAgICAga2V5PXtwb3N0LmlkfVxuICAgICAgICAgICAgICB0aXRsZT17Y2FwaXRhbGl6ZShwb3N0LndvcmROYW1lKX1cbiAgICAgICAgICAgICAgc3VidGl0bGU9e2RhdGVTdHJ9XG4gICAgICAgICAgICAgIGtleXdvcmRzPXtbcG9zdC53b3JkTmFtZSwgdGFnVGV4dCwgcG9zdC5zdGF0dXNdfVxuICAgICAgICAgICAgICBhY2Nlc3Nvcmllcz17W3sgdGFnOiB7IHZhbHVlOiB0YWdUZXh0LCBjb2xvcjogdGFnQ29sb3IgfSB9XX1cbiAgICAgICAgICAgICAgZGV0YWlsPXtcbiAgICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbFxuICAgICAgICAgICAgICAgICAgbWFya2Rvd249e3Bvc3QuZm9ybWF0dGVkVGV4dH1cbiAgICAgICAgICAgICAgICAgIG1ldGFkYXRhPXtcbiAgICAgICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGE+XG4gICAgICAgICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGEuTGFiZWxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiU2NoZWR1bGVkIERhdGUgJiBUaW1lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ9e2RhdGVTdHJ9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbC5NZXRhZGF0YS5UYWdMaXN0IHRpdGxlPVwiU3RhdHVzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8TGlzdC5JdGVtLkRldGFpbC5NZXRhZGF0YS5UYWdMaXN0Lkl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dD17dGFnVGV4dH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I9e3RhZ0NvbG9yfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L0xpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGEuVGFnTGlzdD5cbiAgICAgICAgICAgICAgICAgICAgICB7cG9zdC5zZW50QXQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGEuTGFiZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJTZW50IEF0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dD17bmV3IERhdGUocG9zdC5zZW50QXQpLnRvTG9jYWxlU3RyaW5nKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAge3Bvc3QuZXJyb3IgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPExpc3QuSXRlbS5EZXRhaWwuTWV0YWRhdGEuTGFiZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJFcnJvclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ9e3Bvc3QuZXJyb3J9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvTGlzdC5JdGVtLkRldGFpbC5NZXRhZGF0YT5cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGFjdGlvbnM9e1xuICAgICAgICAgICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgICAgIHtwb3N0LnN0YXR1cyAhPT0gXCJzZW50XCIgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJQb3N0IHRvIFRlbGVncmFtIE5vd1wiXG4gICAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5QYXBlcnBsYW5lfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQWN0aW9uPXsoKSA9PiBoYW5kbGVQb3N0Tm93KHBvc3QpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCJDYW5jZWwgLyBEZWxldGUgU2NoZWR1bGVcIlxuICAgICAgICAgICAgICAgICAgICBpY29uPXtJY29uLlRyYXNofVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17QWN0aW9uLlN0eWxlLkRlc3RydWN0aXZlfVxuICAgICAgICAgICAgICAgICAgICBzaG9ydGN1dD17S2V5Ym9hcmQuU2hvcnRjdXQuQ29tbW9uLlJlbW92ZX1cbiAgICAgICAgICAgICAgICAgICAgb25BY3Rpb249eygpID0+IGhhbmRsZURlbGV0ZShwb3N0LmlkLCBwb3N0LndvcmROYW1lKX1cbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8QWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiUmVmcmVzaCBMaXN0XCJcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17SWNvbi5BcnJvd0Nsb2Nrd2lzZX1cbiAgICAgICAgICAgICAgICAgICAgc2hvcnRjdXQ9e0tleWJvYXJkLlNob3J0Y3V0LkNvbW1vbi5SZWZyZXNofVxuICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbj17bG9hZFBvc3RzfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICApfVxuICAgIDwvTGlzdD5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgU2NoZWR1bGVkTGlzdDtcbiIsICJpbXBvcnQgeyBlbnZpcm9ubWVudCB9IGZyb20gXCJAcmF5Y2FzdC9hcGlcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgb3MgZnJvbSBcIm9zXCI7XG5pbXBvcnQgeyBwb3N0VG9UZWxlZ3JhbUNoYW5uZWwgfSBmcm9tIFwiLi90ZWxlZ3JhbVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNjaGVkdWxlZFBvc3Qge1xuICBpZDogc3RyaW5nO1xuICB3b3JkTmFtZTogc3RyaW5nO1xuICBmb3JtYXR0ZWRUZXh0OiBzdHJpbmc7XG4gIHNjaGVkdWxlZEF0OiBzdHJpbmc7IC8vIElTTyA4NjAxIHN0cmluZ1xuICBzdGF0dXM6IFwicGVuZGluZ1wiIHwgXCJwcm9jZXNzaW5nXCIgfCBcInNlbnRcIiB8IFwiZmFpbGVkXCI7XG4gIGNyZWF0ZWRBdDogc3RyaW5nOyAvLyBJU08gODYwMSBzdHJpbmdcbiAgc2VudEF0Pzogc3RyaW5nO1xuICBtZXNzYWdlSWQ/OiBudW1iZXI7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFJlc29sdmVzIHN0b3JhZ2UgcGF0aCBmb3Igc2NoZWR1bGVkLXBvc3RzLmpzb24uXG4gKiBVc2VzIGVudmlyb25tZW50LnN1cHBvcnRQYXRoIGlmIGF2YWlsYWJsZSwgb3IgZmFsbGJhY2sgZGlyZWN0b3J5IGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmFnZURpcihjdXN0b21EaXI/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoY3VzdG9tRGlyKSByZXR1cm4gY3VzdG9tRGlyO1xuICBpZiAodHlwZW9mIGVudmlyb25tZW50ICE9PSBcInVuZGVmaW5lZFwiICYmIGVudmlyb25tZW50LnN1cHBvcnRQYXRoKSB7XG4gICAgcmV0dXJuIGVudmlyb25tZW50LnN1cHBvcnRQYXRoO1xuICB9XG4gIHJldHVybiBwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiZW5nbGlzaC13b3Jkcy13aXRoLWhpbmRpXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmFnZUZpbGVQYXRoKGN1c3RvbURpcj86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4oZ2V0U3RvcmFnZURpcihjdXN0b21EaXIpLCBcInNjaGVkdWxlZC1wb3N0cy5qc29uXCIpO1xufVxuXG4vKipcbiAqIExvYWRzIGFsbCBzY2hlZHVsZWQgcG9zdHMgZnJvbSBzdG9yYWdlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2NoZWR1bGVkUG9zdHMoXG4gIGN1c3RvbURpcj86IHN0cmluZyxcbik6IFByb21pc2U8U2NoZWR1bGVkUG9zdFtdPiB7XG4gIGNvbnN0IGZpbGVQYXRoID0gZ2V0U3RvcmFnZUZpbGVQYXRoKGN1c3RvbURpcik7XG4gIHRyeSB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyc2VkKSkge1xuICAgICAgcmV0dXJuIHBhcnNlZCBhcyBTY2hlZHVsZWRQb3N0W107XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGFycmF5IG9mIHNjaGVkdWxlZCBwb3N0cyBiYWNrIHRvIHN0b3JhZ2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYXZlQWxsU2NoZWR1bGVkUG9zdHMoXG4gIHBvc3RzOiBTY2hlZHVsZWRQb3N0W10sXG4gIGN1c3RvbURpcj86IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBkaXJQYXRoID0gZ2V0U3RvcmFnZURpcihjdXN0b21EaXIpO1xuICBhd2FpdCBmcy5ta2RpcihkaXJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRTdG9yYWdlRmlsZVBhdGgoY3VzdG9tRGlyKTtcbiAgYXdhaXQgZnMud3JpdGVGaWxlKGZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShwb3N0cywgbnVsbCwgMiksIFwidXRmLThcIik7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgbmV3IHZvY2FidWxhcnkgd29yZCBwb3N0IGZvciBUZWxlZ3JhbS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFNjaGVkdWxlZFBvc3QoXG4gIHdvcmROYW1lOiBzdHJpbmcsXG4gIGZvcm1hdHRlZFRleHQ6IHN0cmluZyxcbiAgc2NoZWR1bGVkQXQ6IERhdGUsXG4gIGN1c3RvbURpcj86IHN0cmluZyxcbik6IFByb21pc2U8U2NoZWR1bGVkUG9zdD4ge1xuICBjb25zdCBwb3N0cyA9IGF3YWl0IGdldFNjaGVkdWxlZFBvc3RzKGN1c3RvbURpcik7XG4gIGNvbnN0IG5ld1Bvc3Q6IFNjaGVkdWxlZFBvc3QgPSB7XG4gICAgaWQ6IGBwb3N0XyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgNyl9YCxcbiAgICB3b3JkTmFtZSxcbiAgICBmb3JtYXR0ZWRUZXh0LFxuICAgIHNjaGVkdWxlZEF0OiBzY2hlZHVsZWRBdC50b0lTT1N0cmluZygpLFxuICAgIHN0YXR1czogXCJwZW5kaW5nXCIsXG4gICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gIH07XG5cbiAgcG9zdHMucHVzaChuZXdQb3N0KTtcbiAgYXdhaXQgc2F2ZUFsbFNjaGVkdWxlZFBvc3RzKHBvc3RzLCBjdXN0b21EaXIpO1xuICByZXR1cm4gbmV3UG9zdDtcbn1cblxuLyoqXG4gKiBDYW5jZWxzL2RlbGV0ZXMgYSBzY2hlZHVsZWQgcG9zdCBieSBJRC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZVNjaGVkdWxlZFBvc3QoXG4gIGlkOiBzdHJpbmcsXG4gIGN1c3RvbURpcj86IHN0cmluZyxcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBwb3N0cyA9IGF3YWl0IGdldFNjaGVkdWxlZFBvc3RzKGN1c3RvbURpcik7XG4gIGNvbnN0IGZpbHRlcmVkID0gcG9zdHMuZmlsdGVyKChwKSA9PiBwLmlkICE9PSBpZCk7XG4gIGlmIChmaWx0ZXJlZC5sZW5ndGggIT09IHBvc3RzLmxlbmd0aCkge1xuICAgIGF3YWl0IHNhdmVBbGxTY2hlZHVsZWRQb3N0cyhmaWx0ZXJlZCwgY3VzdG9tRGlyKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIGZ1dHVyZSBkYXRlIGJldHdlZW4gbWluSG91cnNBaGVhZCBhbmQgbWF4RGF5c0FoZWFkLlxuICogUHJlZmVycyBkYXl0aW1lIGhvdXJzIChiZXR3ZWVuIDA5OjAwIGFuZCAyMTowMCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYW5kb21GdXR1cmVEYXRlKFxuICBtaW5Ib3Vyc0FoZWFkID0gMixcbiAgbWF4RGF5c0FoZWFkID0gMyxcbiAgbm93ID0gbmV3IERhdGUoKSxcbik6IERhdGUge1xuICBjb25zdCB0YXJnZXQgPSBuZXcgRGF0ZShub3cuZ2V0VGltZSgpKTtcblxuICAvLyBQaWNrIGEgcmFuZG9tIGRheSBvZmZzZXQgKDEgdG8gbWF4RGF5c0FoZWFkKVxuICBjb25zdCBtaW5EYXlzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcihtaW5Ib3Vyc0FoZWFkIC8gMjQpKTtcbiAgY29uc3QgZGF5T2Zmc2V0ID1cbiAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4RGF5c0FoZWFkIC0gbWluRGF5cyArIDEpKSArIG1pbkRheXM7XG4gIHRhcmdldC5zZXREYXRlKHRhcmdldC5nZXREYXRlKCkgKyBkYXlPZmZzZXQpO1xuXG4gIC8vIFBpY2sgYSByYW5kb20gaG91ciBiZXR3ZWVuIDkgQU0gKDkpIGFuZCA5IFBNICgyMSlcbiAgY29uc3QgcmFuZG9tSG91ciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEzKSArIDk7IC8vIDkuLjIxXG4gIGNvbnN0IHJhbmRvbU1pbnV0ZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQpICogMTU7IC8vIDAsIDE1LCAzMCwgNDVcblxuICB0YXJnZXQuc2V0SG91cnMocmFuZG9tSG91ciwgcmFuZG9tTWludXRlLCAwLCAwKTtcblxuICAvLyBGYWxsYmFjayBpZiB0YXJnZXQgaXMgaW4gcGFzdFxuICBpZiAodGFyZ2V0LmdldFRpbWUoKSA8PSBub3cuZ2V0VGltZSgpKSB7XG4gICAgdGFyZ2V0LnNldFRpbWUobm93LmdldFRpbWUoKSArIG1pbkhvdXJzQWhlYWQgKiA2MCAqIDYwICogMTAwMCk7XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG4vKipcbiAqIFByb2Nlc3Mgb3ZlcmR1ZSBwZW5kaW5nIHNjaGVkdWxlZCBwb3N0cyBhbmQgcG9zdCB0aGVtIHRvIFRlbGVncmFtLlxuICogVXNlcyBhdG9taWMgZmlsZSBsb2NrIChtYXJraW5nIGl0ZW1zIGFzIFwicHJvY2Vzc2luZ1wiKSB0byBwcmV2ZW50IGR1cGxpY2F0ZSBwb3N0aW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1BlbmRpbmdQb3N0cyhcbiAgYm90VG9rZW46IHN0cmluZyxcbiAgY2hhdElkOiBzdHJpbmcsXG4gIGN1c3RvbURpcj86IHN0cmluZyxcbik6IFByb21pc2U8e1xuICBwcm9jZXNzZWQ6IG51bWJlcjtcbiAgc2VudDogbnVtYmVyO1xuICBmYWlsZWQ6IG51bWJlcjtcbiAgc2VudFdvcmRzOiBzdHJpbmdbXTtcbn0+IHtcbiAgaWYgKCFib3RUb2tlbiB8fCAhY2hhdElkKSB7XG4gICAgcmV0dXJuIHsgcHJvY2Vzc2VkOiAwLCBzZW50OiAwLCBmYWlsZWQ6IDAsIHNlbnRXb3JkczogW10gfTtcbiAgfVxuXG4gIC8vIDEuIFJlbG9hZCBsYXRlc3QgcG9zdHMgZnJvbSBzdG9yYWdlXG4gIGNvbnN0IHBvc3RzID0gYXdhaXQgZ2V0U2NoZWR1bGVkUG9zdHMoY3VzdG9tRGlyKTtcbiAgY29uc3Qgbm93SVNPID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuXG4gIC8vIDIuIElkZW50aWZ5IG92ZXJkdWUgcGVuZGluZyBwb3N0c1xuICBjb25zdCBwZW5kaW5nSXRlbXMgPSBwb3N0cy5maWx0ZXIoXG4gICAgKHBvc3QpID0+IHBvc3Quc3RhdHVzID09PSBcInBlbmRpbmdcIiAmJiBwb3N0LnNjaGVkdWxlZEF0IDw9IG5vd0lTTyxcbiAgKTtcblxuICBpZiAocGVuZGluZ0l0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IHByb2Nlc3NlZDogMCwgc2VudDogMCwgZmFpbGVkOiAwLCBzZW50V29yZHM6IFtdIH07XG4gIH1cblxuICAvLyAzLiBNYXJrIGl0ZW1zIGFzIFwicHJvY2Vzc2luZ1wiIElNTUVESUFURUxZIGFuZCB3cml0ZSB0byBzdG9yYWdlLlxuICAvLyBUaGlzIGxvY2tzIHRoZSBpdGVtcyBzbyBhbnkgY29uY3VycmVudCBwcm9jZXNzIHNraXBzIHRoZW0uXG4gIGZvciAoY29uc3QgcG9zdCBvZiBwZW5kaW5nSXRlbXMpIHtcbiAgICBwb3N0LnN0YXR1cyA9IFwicHJvY2Vzc2luZ1wiO1xuICB9XG4gIGF3YWl0IHNhdmVBbGxTY2hlZHVsZWRQb3N0cyhwb3N0cywgY3VzdG9tRGlyKTtcblxuICAvLyA0LiBQcm9jZXNzIGVhY2ggbG9ja2VkIHBvc3RcbiAgbGV0IHNlbnRDb3VudCA9IDA7XG4gIGxldCBmYWlsZWRDb3VudCA9IDA7XG4gIGNvbnN0IHNlbnRXb3Jkczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHBvc3Qgb2YgcGVuZGluZ0l0ZW1zKSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcG9zdFRvVGVsZWdyYW1DaGFubmVsKFxuICAgICAgYm90VG9rZW4sXG4gICAgICBjaGF0SWQsXG4gICAgICBwb3N0LmZvcm1hdHRlZFRleHQsXG4gICAgKTtcbiAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgIHBvc3Quc3RhdHVzID0gXCJzZW50XCI7XG4gICAgICBwb3N0LnNlbnRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIGlmIChyZXMubWVzc2FnZUlkKSB7XG4gICAgICAgIHBvc3QubWVzc2FnZUlkID0gcmVzLm1lc3NhZ2VJZDtcbiAgICAgIH1cbiAgICAgIHNlbnRDb3VudCsrO1xuICAgICAgc2VudFdvcmRzLnB1c2gocG9zdC53b3JkTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvc3Quc3RhdHVzID0gXCJmYWlsZWRcIjtcbiAgICAgIHBvc3QuZXJyb3IgPSByZXMubWVzc2FnZSB8fCBcIkZhaWxlZCB0byBwb3N0IHRvIFRlbGVncmFtXCI7XG4gICAgICBmYWlsZWRDb3VudCsrO1xuICAgIH1cbiAgfVxuXG4gIC8vIDUuIFdyaXRlIGZpbmFsIHN0YXR1cyAoXCJzZW50XCIgb3IgXCJmYWlsZWRcIikgYmFjayB0byBkaXNrXG4gIGF3YWl0IHNhdmVBbGxTY2hlZHVsZWRQb3N0cyhwb3N0cywgY3VzdG9tRGlyKTtcblxuICByZXR1cm4ge1xuICAgIHByb2Nlc3NlZDogcGVuZGluZ0l0ZW1zLmxlbmd0aCxcbiAgICBzZW50OiBzZW50Q291bnQsXG4gICAgZmFpbGVkOiBmYWlsZWRDb3VudCxcbiAgICBzZW50V29yZHMsXG4gIH07XG59XG4iLCAiLyoqXG4gKiBUZWxlZ3JhbSBmb3JtYXR0aW5nIGFuZCBCb3QgQVBJIHV0aWxpdHkgbW9kdWxlLlxuICovXG5cbi8qKlxuICogRm9ybWF0cyBhIHZvY2FidWxhcnkgZW50cnkncyByYXcgbWFya2Rvd24gY29udGVudCBpbnRvIFRlbGVncmFtLWZyaWVuZGx5IHRleHQuXG4gKlxuICogRm9ybWF0dGluZyBydWxlczpcbiAqIC0gVGl0bGU6ICoqV29yZCAoUHJvbnVuY2lhdGlvbikqKiB3aXRoIDIgc3BhY2VzIGxpbmUgZW5kXG4gKiAtIERlZmluaXRpb25zOiBHcm91cGVkIGJ5IFBPUyAoKipOb3VuOioqKSB3aXRoIDEpIC4uLiAyKSAuLi4gbnVtYmVyZWQgbGlzdFxuICogLSBTZWN0aW9ucyAoKipIaW5kaSBFcXVpdmFsZW50OioqLCAqKldoZW4gdG8gdXNlOioqLCAqKkV4YW1wbGVzOioqLCBldGMuKVxuICogLSBMaXN0czogQnVsbGV0cyBmb3JtYXR0ZWQgd2l0aCBgLSBpdGVtYCBhbmQgMiBzcGFjZXMgbGluZSBlbmRcbiAqIC0gRXR5bW9sb2d5OiBPcmlnaW4gdGVybXMgZm9ybWF0dGVkIHdpdGggYF9fdGVybV9fYCAoVGVsZWdyYW0gZG91YmxlIHVuZGVyc2NvcmUgaXRhbGljKVxuICogLSBNYWluIHNlY3Rpb25zIHNlcGFyYXRlZCBieSBkb3VibGUgbmV3bGluZXMgYFxcblxcbmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEZvclRlbGVncmFtKG1hcmtkb3duQ29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFtYXJrZG93bkNvbnRlbnQgfHwgIW1hcmtkb3duQ29udGVudC50cmltKCkpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd25Db250ZW50LnRyaW0oKS5zcGxpdChcIlxcblwiKTtcblxuICAvLyAxLiBGaW5kIEgxIFRpdGxlIGxpbmUgKCMgV29yZCAuLi4pXG4gIGxldCB0aXRsZUluZGV4ID0gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoL14jXFxzKy8udGVzdChsaW5lc1tpXSkpIHtcbiAgICAgIHRpdGxlSW5kZXggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRpdGxlSW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIG1hcmtkb3duQ29udGVudDtcbiAgfVxuXG4gIGNvbnN0IHJhd1RpdGxlTGluZSA9IGxpbmVzW3RpdGxlSW5kZXhdO1xuICBjb25zdCB0aXRsZU1hdGNoID0gcmF3VGl0bGVMaW5lLm1hdGNoKC9eI1xccysoW14oXSs/KSg/OlxccypcXCgoW14pXSopXFwpKT9cXHMqJC8pO1xuICBsZXQgdGl0bGVUZXh0ID0gXCJcIjtcbiAgaWYgKHRpdGxlTWF0Y2gpIHtcbiAgICBjb25zdCByYXdXb3JkID0gdGl0bGVNYXRjaFsxXS50cmltKCk7XG4gICAgY29uc3QgY2FwaXRhbGl6ZWRXb3JkID0gcmF3V29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJhd1dvcmQuc2xpY2UoMSk7XG4gICAgY29uc3QgcHJvbiA9IHRpdGxlTWF0Y2hbMl0gPyB0aXRsZU1hdGNoWzJdLnRyaW0oKSA6IFwiXCI7XG4gICAgdGl0bGVUZXh0ID0gcHJvblxuICAgICAgPyBgKioke2NhcGl0YWxpemVkV29yZH0gKCR7cHJvbn0pKipgXG4gICAgICA6IGAqKiR7Y2FwaXRhbGl6ZWRXb3JkfSoqYDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjbGVhbmVkVGl0bGUgPSByYXdUaXRsZUxpbmUucmVwbGFjZSgvXiNcXHMrLywgXCJcIikudHJpbSgpO1xuICAgIGNvbnN0IGNhcGl0YWxpemVkVGl0bGUgPVxuICAgICAgY2xlYW5lZFRpdGxlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2xlYW5lZFRpdGxlLnNsaWNlKDEpO1xuICAgIHRpdGxlVGV4dCA9IGAqKiR7Y2FwaXRhbGl6ZWRUaXRsZX0qKmA7XG4gIH1cblxuICAvLyAyLiBUb2tlbml6ZSBjb250ZW50IGludG8gVGl0bGUgQmxvY2sgYW5kICMjIFNlY3Rpb25zXG4gIGxldCBjdXJyZW50SGVhZGluZyA9IFwiX190aXRsZV9fXCI7XG4gIGxldCBjdXJyZW50TGluZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlY3Rpb25NYXAgPSBuZXcgTWFwPFxuICAgIHN0cmluZyxcbiAgICB7IG9yaWdpbmFsSGVhZGluZzogc3RyaW5nOyBjb250ZW50TGluZXM6IHN0cmluZ1tdIH1cbiAgPigpO1xuICBjb25zdCBzZWN0aW9uT3JkZXI6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IHRpdGxlSW5kZXggKyAxOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBsaW5lID0gbGluZXNbaV07XG4gICAgY29uc3QgaDJNYXRjaCA9IGxpbmUubWF0Y2goL14jI1xccysoLispJC8pO1xuICAgIGlmIChoMk1hdGNoKSB7XG4gICAgICBpZiAoY3VycmVudEhlYWRpbmcgPT09IFwiX190aXRsZV9fXCIpIHtcbiAgICAgICAgc2VjdGlvbk1hcC5zZXQoXCJfX3RpdGxlX19cIiwge1xuICAgICAgICAgIG9yaWdpbmFsSGVhZGluZzogXCJfX3RpdGxlX19cIixcbiAgICAgICAgICBjb250ZW50TGluZXM6IGN1cnJlbnRMaW5lcyxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWN0aW9uTWFwLnNldChjdXJyZW50SGVhZGluZywge1xuICAgICAgICAgIG9yaWdpbmFsSGVhZGluZzogY3VycmVudEhlYWRpbmcsXG4gICAgICAgICAgY29udGVudExpbmVzOiBjdXJyZW50TGluZXMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY3VycmVudEhlYWRpbmcgPSBoMk1hdGNoWzFdLnRyaW0oKTtcbiAgICAgIGN1cnJlbnRMaW5lcyA9IFtdO1xuICAgICAgc2VjdGlvbk9yZGVyLnB1c2goY3VycmVudEhlYWRpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50TGluZXMucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudEhlYWRpbmcgPT09IFwiX190aXRsZV9fXCIpIHtcbiAgICBzZWN0aW9uTWFwLnNldChcIl9fdGl0bGVfX1wiLCB7XG4gICAgICBvcmlnaW5hbEhlYWRpbmc6IFwiX190aXRsZV9fXCIsXG4gICAgICBjb250ZW50TGluZXM6IGN1cnJlbnRMaW5lcyxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZWN0aW9uTWFwLnNldChjdXJyZW50SGVhZGluZywge1xuICAgICAgb3JpZ2luYWxIZWFkaW5nOiBjdXJyZW50SGVhZGluZyxcbiAgICAgIGNvbnRlbnRMaW5lczogY3VycmVudExpbmVzLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gMy4gUHJvY2VzcyBEZWZpbml0aW9ucyBpbiBUaXRsZSBCbG9ja1xuICBjb25zdCB0aXRsZUJsb2NrID0gc2VjdGlvbk1hcC5nZXQoXCJfX3RpdGxlX19cIik7XG4gIGNvbnN0IHBvc0RlZmluaXRpb25zTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZ1tdPigpO1xuXG4gIGlmICh0aXRsZUJsb2NrKSB7XG4gICAgY29uc3QgcG9zUGF0dGVybiA9XG4gICAgICAvXlxccyooPzotXFxzKyk/XFwqXFwqKE5vdW58VmVyYnxBZGplY3RpdmV8QWR2ZXJifFByZXBvc2l0aW9ufENvbmp1bmN0aW9ufFByb25vdW58SW50ZXJqZWN0aW9uKTpcXCpcXCpcXHMqKC4rKSQvaTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgdGl0bGVCbG9jay5jb250ZW50TGluZXMpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gbGluZS5tYXRjaChwb3NQYXR0ZXJuKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBjb25zdCBwb3MgPVxuICAgICAgICAgIG1hdGNoWzFdLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbWF0Y2hbMV0uc2xpY2UoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgbWVhbmluZyA9IG1hdGNoWzJdLnRyaW0oKTtcbiAgICAgICAgaWYgKCFwb3NEZWZpbml0aW9uc01hcC5oYXMocG9zKSkge1xuICAgICAgICAgIHBvc0RlZmluaXRpb25zTWFwLnNldChwb3MsIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBwb3NEZWZpbml0aW9uc01hcC5nZXQocG9zKSEucHVzaChtZWFuaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCByZXN1bHRCbG9ja3M6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gVGl0bGUgbGluZSBibG9ja1xuICByZXN1bHRCbG9ja3MucHVzaChgJHt0aXRsZVRleHR9ICBgKTtcblxuICAvLyBEZWZpbml0aW9ucyBibG9ja1xuICBpZiAocG9zRGVmaW5pdGlvbnNNYXAuc2l6ZSA+IDApIHtcbiAgICBjb25zdCBkZWZCbG9ja0xpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW3BvcywgZGVmc10gb2YgcG9zRGVmaW5pdGlvbnNNYXAuZW50cmllcygpKSB7XG4gICAgICBkZWZzLmZvckVhY2goKGRlZikgPT4ge1xuICAgICAgICBjb25zdCBjbGVhbkRlZiA9IGRlZi5yZXBsYWNlKC9eXFxkK1xcKVxccyovLCBcIlwiKS5yZXBsYWNlKC9eLVxccyovLCBcIlwiKTtcbiAgICAgICAgZGVmQmxvY2tMaW5lcy5wdXNoKGAqKiR7cG9zfToqKiAke2NsZWFuRGVmfSAgYCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmVzdWx0QmxvY2tzLnB1c2goZGVmQmxvY2tMaW5lcy5qb2luKFwiXFxuXCIpKTtcbiAgfVxuXG4gIC8vIDQuIFByb2Nlc3MgZWFjaCAjIyBTZWN0aW9uIGluIG9yaWdpbmFsIG9yZGVyXG4gIGZvciAoY29uc3QgaGVhZGluZ05hbWUgb2Ygc2VjdGlvbk9yZGVyKSB7XG4gICAgY29uc3Qgc2VjdGlvbkRhdGEgPSBzZWN0aW9uTWFwLmdldChoZWFkaW5nTmFtZSk7XG4gICAgaWYgKCFzZWN0aW9uRGF0YSkgY29udGludWU7XG5cbiAgICBjb25zdCBoZWFkaW5nTG93ZXIgPSBoZWFkaW5nTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHJhd0NvbnRlbnRMaW5lcyA9IHNlY3Rpb25EYXRhLmNvbnRlbnRMaW5lc1xuICAgICAgLm1hcCgobCkgPT4gbC50cmltKCkpXG4gICAgICAuZmlsdGVyKChsKSA9PiBsLmxlbmd0aCA+IDApO1xuXG4gICAgaWYgKHJhd0NvbnRlbnRMaW5lcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG4gICAgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJoaW5kaSBlcXVpdmFsZW50XCIpIHtcbiAgICAgIGNvbnN0IGxpbmUgPSByYXdDb250ZW50TGluZXMuam9pbihcIiBcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipIaW5kaSBFcXVpdmFsZW50OioqICBcXG4ke2xpbmV9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwid2hlbiB0byB1c2VcIikge1xuICAgICAgY29uc3QgaXRlbXMgPSByYXdDb250ZW50TGluZXMubWFwKChsaW5lKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBsaW5lLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICByZXR1cm4gYC0gJHtjbGVhbmVkfSAgYDtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqV2hlbiB0byB1c2U6KiogIFxcbiR7aXRlbXMuam9pbihcIlxcblwiKX1gKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJleGFtcGxlc1wiKSB7XG4gICAgICBjb25zdCBpdGVtcyA9IHJhd0NvbnRlbnRMaW5lcy5tYXAoKGxpbmUpID0+IHtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGxpbmUucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICAgIHJldHVybiBgLSAke2NsZWFuZWR9ICBgO1xuICAgICAgfSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipFeGFtcGxlczoqKiAgXFxuJHtpdGVtcy5qb2luKFwiXFxuXCIpfWApO1xuICAgIH0gZWxzZSBpZiAoaGVhZGluZ0xvd2VyID09PSBcInN5bm9ueW1zXCIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSByYXdDb250ZW50TGluZXMuam9pbihcIiBcIikucmVwbGFjZSgvXi1cXHMqLywgXCJcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipTeW5vbnltczoqKiAke3RleHR9ICBgKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRpbmdMb3dlciA9PT0gXCJhbnRvbnltc1wiKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gcmF3Q29udGVudExpbmVzLmpvaW4oXCIgXCIpLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqQW50b255bXM6KiogJHt0ZXh0fSAgYCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwid29yZCBicmVha2Rvd25cIikge1xuICAgICAgY29uc3QgaXRlbXMgPSByYXdDb250ZW50TGluZXMubWFwKChsaW5lKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBsaW5lLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICByZXR1cm4gYC0gJHtjbGVhbmVkfSAgYDtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqV29yZCBCcmVha2Rvd246KipcXG4ke2l0ZW1zLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwiZm9ybWF0aW9uIGZsb3dcIikge1xuICAgICAgY29uc3QgaXRlbXMgPSByYXdDb250ZW50TGluZXMubWFwKChsaW5lKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBsaW5lLnJlcGxhY2UoL14tXFxzKi8sIFwiXCIpO1xuICAgICAgICByZXR1cm4gYC0gJHtjbGVhbmVkfSAgYDtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0QmxvY2tzLnB1c2goYCoqRm9ybWF0aW9uIEZsb3c6KipcXG4ke2l0ZW1zLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfSBlbHNlIGlmIChoZWFkaW5nTG93ZXIgPT09IFwiZXR5bW9sb2d5XCIpIHtcbiAgICAgIGxldCB0ZXh0ID0gcmF3Q29udGVudExpbmVzLmpvaW4oXCIgXCIpO1xuICAgICAgLy8gQ29udmVydCBzaW5nbGUtcXVvdGVkIG9yIHNpbmdsZS1hc3RlcmlzayBvcmlnaW4gd29yZHMgdG8gX193b3JkX19cbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLycoW14nXSspJy9nLCBcIl9fJDFfX1wiKTtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFxccylcXCooW14qXSspXFwqKFxcc3wkKS9nLCBcIiQxX18kMl9fJDNcIik7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKipFdHltb2xvZ3k6KiogIFxcbiR7dGV4dH1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaGVhZGluZ0NhcCA9XG4gICAgICAgIGhlYWRpbmdOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgaGVhZGluZ05hbWUuc2xpY2UoMSk7XG4gICAgICByZXN1bHRCbG9ja3MucHVzaChgKioke2hlYWRpbmdDYXB9OioqICBcXG4ke3Jhd0NvbnRlbnRMaW5lcy5qb2luKFwiXFxuXCIpfWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRCbG9ja3Muam9pbihcIlxcblxcblwiKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBUZWxlZ3JhbS1mcmllbmRseSB0ZXh0ICgqKmJvbGQqKiwgX19pdGFsaWNfXykgdG8gVGVsZWdyYW0gSFRNTCBmb3JtYXRcbiAqIGZvciB1c2Ugd2l0aCBUZWxlZ3JhbSBCb3QgQVBJIGBzZW5kTWVzc2FnZWAgKHBhcnNlX21vZGU6IFwiSFRNTFwiKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbGVncmFtTWFya2Rvd25Ub0h0bWwodGVsZWdyYW1UZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRlbGVncmFtVGV4dCkgcmV0dXJuIFwiXCI7XG5cbiAgLy8gMS4gRXNjYXBlIEhUTUwgZW50aXRpZXNcbiAgbGV0IGh0bWwgPSB0ZWxlZ3JhbVRleHRcbiAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG4gICAgLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpO1xuXG4gIC8vIDIuIENvbnZlcnQgKipib2xkKiogdG8gPGI+Ym9sZDwvYj5cbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFwqXFwqKFteKl0rKVxcKlxcKi9nLCBcIjxiPiQxPC9iPlwiKTtcblxuICAvLyAzLiBDb252ZXJ0IF9faXRhbGljX18gdG8gPGk+aXRhbGljPC9pPlxuICBodG1sID0gaHRtbC5yZXBsYWNlKC9fXyhbXl9dKylfXy9nLCBcIjxpPiQxPC9pPlwiKTtcblxuICAvLyA0LiBDb252ZXJ0IH5+c3RyaWtldGhyb3VnaH5+IHRvIDxzPnN0cmlrZXRocm91Z2g8L3M+XG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL35+KFtefl0rKX5+L2csIFwiPHM+JDE8L3M+XCIpO1xuXG4gIC8vIDUuIFN0cmlwIHRyYWlsaW5nIGxpbmUgc3BhY2VzIGJlZm9yZSBuZXdsaW5lcyBmb3IgY2xlYW4gSFRNTCByZW5kZXJpbmdcbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvWyBcXHRdK1xcbi9nLCBcIlxcblwiKTtcblxuICByZXR1cm4gaHRtbDtcbn1cblxuLyoqXG4gKiBEaXJlY3RseSBwb3N0cyBhIFRlbGVncmFtLWZvcm1hdHRlZCB2b2NhYnVsYXJ5IGVudHJ5IHRvIGEgVGVsZWdyYW0gY2hhbm5lbC9jaGF0IHVzaW5nIFRlbGVncmFtIEJvdCBBUEkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwb3N0VG9UZWxlZ3JhbUNoYW5uZWwoXG4gIGJvdFRva2VuOiBzdHJpbmcsXG4gIGNoYXRJZDogc3RyaW5nLFxuICB0ZWxlZ3JhbUZvcm1hdHRlZFRleHQ6IHN0cmluZyxcbik6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBtZXNzYWdlSWQ/OiBudW1iZXI7IG1lc3NhZ2U/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB0b2tlbiA9IGJvdFRva2VuLnRyaW0oKTtcbiAgY29uc3QgY2hhdCA9IGNoYXRJZC50cmltKCk7XG5cbiAgaWYgKCF0b2tlbikge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIlRlbGVncmFtIEJvdCBUb2tlbiBpcyByZXF1aXJlZC5cIiB9O1xuICB9XG4gIGlmICghY2hhdCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IFwiVGVsZWdyYW0gQ2hhbm5lbCAvIENoYXQgSUQgaXMgcmVxdWlyZWQuXCIsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGh0bWxDb250ZW50ID0gdGVsZWdyYW1NYXJrZG93blRvSHRtbCh0ZWxlZ3JhbUZvcm1hdHRlZFRleHQpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLnRlbGVncmFtLm9yZy9ib3Qke3Rva2VufS9zZW5kTWVzc2FnZWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2hhdF9pZDogY2hhdCxcbiAgICAgICAgdGV4dDogaHRtbENvbnRlbnQsXG4gICAgICAgIHBhcnNlX21vZGU6IFwiSFRNTFwiLFxuICAgICAgICBkaXNhYmxlX3dlYl9wYWdlX3ByZXZpZXc6IHRydWUsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIGludGVyZmFjZSBUZWxlZ3JhbVJlc3BvbnNlIHtcbiAgICAgIG9rOiBib29sZWFuO1xuICAgICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgICBlcnJvcl9jb2RlPzogbnVtYmVyO1xuICAgICAgcmVzdWx0Pzoge1xuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXI7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyBUZWxlZ3JhbVJlc3BvbnNlO1xuXG4gICAgaWYgKHJlc3BvbnNlLm9rICYmIGRhdGEub2spIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2VJZDogZGF0YS5yZXN1bHQ/Lm1lc3NhZ2VfaWQgfTtcbiAgICB9XG5cbiAgICBjb25zdCBlcnJEZXNjID1cbiAgICAgIGRhdGEuZGVzY3JpcHRpb24gfHwgcmVzcG9uc2Uuc3RhdHVzVGV4dCB8fCBgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gO1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgXCJJbnZhbGlkIFRlbGVncmFtIEJvdCBUb2tlbi4gUGxlYXNlIGNoZWNrIGV4dGVuc2lvbiBwcmVmZXJlbmNlcy5cIixcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMCB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBUZWxlZ3JhbSBFcnJvcjogJHtlcnJEZXNjfS4gRW5zdXJlIHRoZSBib3QgaXMgYWRkZWQgdG8gdGhlIGNoYW5uZWwuYCxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMyB8fCBkYXRhLmVycm9yX2NvZGUgPT09IDQwMykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBUZWxlZ3JhbSBFcnJvcjogJHtlcnJEZXNjfS4gRW5zdXJlIGJvdCBoYXMgcG9zdGluZyBhZG1pbiBwZXJtaXNzaW9ucy5gLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBgVGVsZWdyYW0gRXJyb3IgKCR7ZGF0YS5lcnJvcl9jb2RlIHx8IHJlc3BvbnNlLnN0YXR1c30pOiAke2VyckRlc2N9YCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVyciksXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGV0ZXMgYSBtZXNzYWdlIGZyb20gYSBUZWxlZ3JhbSBjaGFubmVsL2NoYXQgdXNpbmcgVGVsZWdyYW0gQm90IEFQSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZVRlbGVncmFtTWVzc2FnZShcbiAgYm90VG9rZW46IHN0cmluZyxcbiAgY2hhdElkOiBzdHJpbmcsXG4gIG1lc3NhZ2VJZDogbnVtYmVyLFxuKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB0b2tlbiA9IGJvdFRva2VuLnRyaW0oKTtcbiAgY29uc3QgY2hhdCA9IGNoYXRJZC50cmltKCk7XG5cbiAgaWYgKCF0b2tlbiB8fCAhY2hhdCB8fCAhbWVzc2FnZUlkKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTWlzc2luZyByZXF1aXJlZCBwYXJhbWV0ZXJzLlwiIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovL2FwaS50ZWxlZ3JhbS5vcmcvYm90JHt0b2tlbn0vZGVsZXRlTWVzc2FnZWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2hhdF9pZDogY2hhdCxcbiAgICAgICAgbWVzc2FnZV9pZDogbWVzc2FnZUlkLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXRhID0gKGF3YWl0IHJlc3BvbnNlLmpzb24oKSkgYXMge1xuICAgICAgb2s6IGJvb2xlYW47XG4gICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB9O1xuXG4gICAgaWYgKHJlc3BvbnNlLm9rICYmIGRhdGEub2spIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiBkYXRhLmRlc2NyaXB0aW9uIHx8IGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWAsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpLFxuICAgIH07XG4gIH1cbn1cbiJd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Z0JBQ2YsVUFDRSw2Q0FBQyxpQkFBSyxLQUFLLE9BQU8sVUFBakIsRUFDQztBQUFBO0FBQUEsb0JBQUMsaUJBQUssS0FBSyxPQUFPLFNBQVM7QUFBQSxvQkFBMUI7QUFBQSxzQkFDQyxPQUFNO0FBQUEsc0JBQ04sTUFBTTtBQUFBO0FBQUEsa0JBQ1I7QUFBQSxrQkFDQSw0Q0FBQyxpQkFBSyxLQUFLLE9BQU8sU0FBUyxTQUExQixFQUFrQyxPQUFNLFVBQ3ZDO0FBQUEsb0JBQUMsaUJBQUssS0FBSyxPQUFPLFNBQVMsUUFBUTtBQUFBLG9CQUFsQztBQUFBLHNCQUNDLE1BQU07QUFBQSxzQkFDTixPQUFPO0FBQUE7QUFBQSxrQkFDVCxHQUNGO0FBQUEsa0JBQ0MsS0FBSyxVQUNKO0FBQUEsb0JBQUMsaUJBQUssS0FBSyxPQUFPLFNBQVM7QUFBQSxvQkFBMUI7QUFBQSxzQkFDQyxPQUFNO0FBQUEsc0JBQ04sTUFBTSxJQUFJLEtBQUssS0FBSyxNQUFNLEVBQUUsZUFBZTtBQUFBO0FBQUEsa0JBQzdDO0FBQUEsa0JBRUQsS0FBSyxTQUNKO0FBQUEsb0JBQUMsaUJBQUssS0FBSyxPQUFPLFNBQVM7QUFBQSxvQkFBMUI7QUFBQSxzQkFDQyxPQUFNO0FBQUEsc0JBQ04sTUFBTSxLQUFLO0FBQUE7QUFBQSxrQkFDYjtBQUFBLG1CQUVKO0FBQUE7QUFBQSxZQUVKO0FBQUEsWUFFRixTQUNFLDZDQUFDLDJCQUNFO0FBQUEsbUJBQUssV0FBVyxVQUNmO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU07QUFBQSxrQkFDTixNQUFNLGlCQUFLO0FBQUEsa0JBQ1gsVUFBVSxNQUFNLGNBQWMsSUFBSTtBQUFBO0FBQUEsY0FDcEM7QUFBQSxjQUVGO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU07QUFBQSxrQkFDTixNQUFNLGlCQUFLO0FBQUEsa0JBQ1gsT0FBTyxtQkFBTyxNQUFNO0FBQUEsa0JBQ3BCLFVBQVUscUJBQVMsU0FBUyxPQUFPO0FBQUEsa0JBQ25DLFVBQVUsTUFBTSxhQUFhLEtBQUssSUFBSSxLQUFLLFFBQVE7QUFBQTtBQUFBLGNBQ3JEO0FBQUEsY0FDQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFNO0FBQUEsa0JBQ04sTUFBTSxpQkFBSztBQUFBLGtCQUNYLFVBQVUscUJBQVMsU0FBUyxPQUFPO0FBQUEsa0JBQ25DLFVBQVU7QUFBQTtBQUFBLGNBQ1o7QUFBQSxlQUNGO0FBQUE7QUFBQSxVQTFERyxLQUFLO0FBQUEsUUE0RFo7QUFBQSxNQUVKLENBQUM7QUFBQTtBQUFBLEVBRUw7QUFFSjtBQUVBLElBQU8seUJBQVE7IiwKICAibmFtZXMiOiBbImltcG9ydF9hcGkiLCAicGF0aCIsICJvcyIsICJmcyJdCn0K
