import {
  getPreferenceValues,
  showNotification,
  Notification,
} from "@raycast/api";
import { processPendingPosts } from "./scheduler";

interface Preferences {
  telegramBotToken?: string;
  telegramChatId?: string;
}

export default async function Command() {
  let prefs: Preferences;
  try {
    prefs = getPreferenceValues<Preferences>();
  } catch {
    return;
  }

  const botToken = prefs.telegramBotToken?.trim();
  const chatId = prefs.telegramChatId?.trim();

  if (!botToken || !chatId) {
    return;
  }

  const result = await processPendingPosts(botToken, chatId);

  if (result.sent > 0) {
    const wordList = result.sentWords
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(", ");
    await showNotification({
      style: Notification.Style.Success,
      title: "Telegram Vocabulary Published",
      message: `Posted ${result.sent} word(s) to Telegram: ${wordList}`,
    });
  }

  if (result.failed > 0) {
    await showNotification({
      style: Notification.Style.Failure,
      title: "Telegram Scheduled Post Failed",
      message: `Failed to post ${result.failed} word(s). Check token and channel permissions.`,
    });
  }
}
