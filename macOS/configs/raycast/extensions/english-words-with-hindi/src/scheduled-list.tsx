import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  showToast,
  Toast,
  getPreferenceValues,
  Keyboard,
} from "@raycast/api";
import { useState, useEffect } from "react";
import {
  getScheduledPosts,
  deleteScheduledPost,
  saveAllScheduledPosts,
  processPendingPosts,
  ScheduledPost,
} from "./scheduler";
import { postToTelegramChannel } from "./telegram";

interface Preferences {
  telegramBotToken?: string;
  telegramChatId?: string;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ScheduledList() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadPosts() {
    setIsLoading(true);
    try {
      const prefs = getPreferenceValues<Preferences>();
      if (prefs.telegramBotToken && prefs.telegramChatId) {
        await processPendingPosts(
          prefs.telegramBotToken.trim(),
          prefs.telegramChatId.trim(),
        );
      }
      const data = await getScheduledPosts();
      // Sort newest scheduled first
      data.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      setPosts(data);
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load scheduled posts",
        message: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleDelete(id: string, wordName: string) {
    const success = await deleteScheduledPost(id);
    if (success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      await showToast({
        style: Toast.Style.Success,
        title: "Schedule Cancelled",
        message: `Cancelled schedule for "${capitalize(wordName)}"`,
      });
    }
  }

  async function handlePostNow(post: ScheduledPost) {
    const prefs = getPreferenceValues<Preferences>();
    const botToken = prefs.telegramBotToken?.trim();
    const chatId = prefs.telegramChatId?.trim();

    if (!botToken || !chatId) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Telegram Credentials Missing",
        message:
          "Please configure Telegram Bot Token and Chat ID in preferences.",
      });
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Posting "${capitalize(post.wordName)}" now...`,
    });

    const res = await postToTelegramChannel(
      botToken,
      chatId,
      post.formattedText,
    );
    if (res.success) {
      post.status = "sent";
      post.sentAt = new Date().toISOString();
      const updated = posts.map((p) => (p.id === post.id ? post : p));
      await saveAllScheduledPosts(updated);
      setPosts(updated);
      toast.style = Toast.Style.Success;
      toast.title = "Posted to Telegram";
    } else {
      post.status = "failed";
      post.error = res.message;
      const updated = posts.map((p) => (p.id === post.id ? post : p));
      await saveAllScheduledPosts(updated);
      setPosts(updated);
      toast.style = Toast.Style.Failure;
      toast.title = "Posting Failed";
      toast.message = res.message;
    }
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Filter scheduled words..."
    >
      {posts.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Calendar}
          title="No Scheduled Posts"
          description="Use 'Schedule for Telegram' when inspecting a word to queue posts."
        />
      ) : (
        posts.map((post) => {
          const dateObj = new Date(post.scheduledAt);
          const dateStr = dateObj.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          let tagColor = Color.Yellow;
          let tagText = "Pending";
          if (post.status === "sent") {
            tagColor = Color.Green;
            tagText = "Sent";
          } else if (post.status === "processing") {
            tagColor = Color.Blue;
            tagText = "Posting...";
          } else if (post.status === "failed") {
            tagColor = Color.Red;
            tagText = "Failed";
          }

          return (
            <List.Item
              key={post.id}
              title={capitalize(post.wordName)}
              subtitle={dateStr}
              keywords={[post.wordName, tagText, post.status]}
              accessories={[{ tag: { value: tagText, color: tagColor } }]}
              detail={
                <List.Item.Detail
                  markdown={post.formattedText}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label
                        title="Scheduled Date & Time"
                        text={dateStr}
                      />
                      <List.Item.Detail.Metadata.TagList title="Status">
                        <List.Item.Detail.Metadata.TagList.Item
                          text={tagText}
                          color={tagColor}
                        />
                      </List.Item.Detail.Metadata.TagList>
                      {post.sentAt && (
                        <List.Item.Detail.Metadata.Label
                          title="Sent At"
                          text={new Date(post.sentAt).toLocaleString()}
                        />
                      )}
                      {post.error && (
                        <List.Item.Detail.Metadata.Label
                          title="Error"
                          text={post.error}
                        />
                      )}
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  {post.status !== "sent" && (
                    <Action
                      title="Post to Telegram Now"
                      icon={Icon.Paperplane}
                      onAction={() => handlePostNow(post)}
                    />
                  )}
                  <Action
                    title="Cancel / Delete Schedule"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={Keyboard.Shortcut.Common.Remove}
                    onAction={() => handleDelete(post.id, post.wordName)}
                  />
                  <Action
                    title="Refresh List"
                    icon={Icon.ArrowClockwise}
                    shortcut={Keyboard.Shortcut.Common.Refresh}
                    onAction={loadPosts}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}

export default ScheduledList;
