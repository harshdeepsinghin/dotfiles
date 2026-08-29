import { environment } from "@raycast/api";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { postToTelegramChannel } from "./telegram";

export interface ScheduledPost {
  id: string;
  wordName: string;
  formattedText: string;
  scheduledAt: string; // ISO 8601 string
  status: "pending" | "processing" | "sent" | "failed";
  createdAt: string; // ISO 8601 string
  sentAt?: string;
  messageId?: number;
  error?: string;
}

/**
 * Resolves storage path for scheduled-posts.json.
 * Uses environment.supportPath if available, or fallback directory for testing.
 */
export function getStorageDir(customDir?: string): string {
  if (customDir) return customDir;
  if (typeof environment !== "undefined" && environment.supportPath) {
    return environment.supportPath;
  }
  return path.join(os.tmpdir(), "english-words-with-hindi");
}

export function getStorageFilePath(customDir?: string): string {
  return path.join(getStorageDir(customDir), "scheduled-posts.json");
}

/**
 * Loads all scheduled posts from storage.
 */
export async function getScheduledPosts(
  customDir?: string,
): Promise<ScheduledPost[]> {
  const filePath = getStorageFilePath(customDir);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed as ScheduledPost[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves the array of scheduled posts back to storage.
 */
export async function saveAllScheduledPosts(
  posts: ScheduledPost[],
  customDir?: string,
): Promise<void> {
  const dirPath = getStorageDir(customDir);
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = getStorageFilePath(customDir);
  await fs.writeFile(filePath, JSON.stringify(posts, null, 2), "utf-8");
}

/**
 * Schedules a new vocabulary word post for Telegram.
 */
export async function addScheduledPost(
  wordName: string,
  formattedText: string,
  scheduledAt: Date,
  customDir?: string,
): Promise<ScheduledPost> {
  const posts = await getScheduledPosts(customDir);
  const newPost: ScheduledPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    wordName,
    formattedText,
    scheduledAt: scheduledAt.toISOString(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);
  await saveAllScheduledPosts(posts, customDir);
  return newPost;
}

/**
 * Cancels/deletes a scheduled post by ID.
 */
export async function deleteScheduledPost(
  id: string,
  customDir?: string,
): Promise<boolean> {
  const posts = await getScheduledPosts(customDir);
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length !== posts.length) {
    await saveAllScheduledPosts(filtered, customDir);
    return true;
  }
  return false;
}

/**
 * Generates a random future date between minHoursAhead and maxDaysAhead.
 * Prefers daytime hours (between 09:00 and 21:00).
 */
export function getRandomFutureDate(
  minHoursAhead = 2,
  maxDaysAhead = 3,
  now = new Date(),
): Date {
  const target = new Date(now.getTime());

  // Pick a random day offset (1 to maxDaysAhead)
  const minDays = Math.max(0, Math.floor(minHoursAhead / 24));
  const dayOffset =
    Math.floor(Math.random() * (maxDaysAhead - minDays + 1)) + minDays;
  target.setDate(target.getDate() + dayOffset);

  // Pick a random hour between 9 AM (9) and 9 PM (21)
  const randomHour = Math.floor(Math.random() * 13) + 9; // 9..21
  const randomMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45

  target.setHours(randomHour, randomMinute, 0, 0);

  // Fallback if target is in past
  if (target.getTime() <= now.getTime()) {
    target.setTime(now.getTime() + minHoursAhead * 60 * 60 * 1000);
  }

  return target;
}

/**
 * Process overdue pending scheduled posts and post them to Telegram.
 * Uses atomic file lock (marking items as "processing") to prevent duplicate posting.
 */
export async function processPendingPosts(
  botToken: string,
  chatId: string,
  customDir?: string,
): Promise<{
  processed: number;
  sent: number;
  failed: number;
  sentWords: string[];
}> {
  if (!botToken || !chatId) {
    return { processed: 0, sent: 0, failed: 0, sentWords: [] };
  }

  // 1. Reload latest posts from storage
  const posts = await getScheduledPosts(customDir);
  const nowISO = new Date().toISOString();

  // 2. Identify overdue pending posts
  const pendingItems = posts.filter(
    (post) => post.status === "pending" && post.scheduledAt <= nowISO,
  );

  if (pendingItems.length === 0) {
    return { processed: 0, sent: 0, failed: 0, sentWords: [] };
  }

  // 3. Mark items as "processing" IMMEDIATELY and write to storage.
  // This locks the items so any concurrent process skips them.
  for (const post of pendingItems) {
    post.status = "processing";
  }
  await saveAllScheduledPosts(posts, customDir);

  // 4. Process each locked post
  let sentCount = 0;
  let failedCount = 0;
  const sentWords: string[] = [];

  for (const post of pendingItems) {
    const res = await postToTelegramChannel(
      botToken,
      chatId,
      post.formattedText,
    );
    if (res.success) {
      post.status = "sent";
      post.sentAt = new Date().toISOString();
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

  // 5. Write final status ("sent" or "failed") back to disk
  await saveAllScheduledPosts(posts, customDir);

  return {
    processed: pendingItems.length,
    sent: sentCount,
    failed: failedCount,
    sentWords,
  };
}
