import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  getScheduledPosts,
  addScheduledPost,
  deleteScheduledPost,
  getRandomFutureDate,
  processPendingPosts,
} from "./scheduler";
import * as telegramModule from "./telegram";

describe("scheduler", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "scheduler-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
    vi.restoreAllMocks();
  });

  it("should return empty array when no scheduled posts exist", async () => {
    const posts = await getScheduledPosts(tempDir);
    expect(posts).toEqual([]);
  });

  it("should add a new scheduled post to storage", async () => {
    const scheduledDate = new Date(Date.now() + 3600000);
    const post = await addScheduledPost(
      "ephemeral",
      "**Ephemeral** - lasting for a short time",
      scheduledDate,
      tempDir,
    );

    expect(post.wordName).toBe("ephemeral");
    expect(post.status).toBe("pending");
    expect(post.scheduledAt).toBe(scheduledDate.toISOString());

    const posts = await getScheduledPosts(tempDir);
    expect(posts.length).toBe(1);
    expect(posts[0].id).toBe(post.id);
  });

  it("should delete a scheduled post by ID", async () => {
    const scheduledDate = new Date(Date.now() + 3600000);
    const post = await addScheduledPost(
      "serendipity",
      "**Serendipity**",
      scheduledDate,
      tempDir,
    );

    let posts = await getScheduledPosts(tempDir);
    expect(posts.length).toBe(1);

    const deleted = await deleteScheduledPost(post.id, tempDir);
    expect(deleted).toBe(true);

    posts = await getScheduledPosts(tempDir);
    expect(posts.length).toBe(0);
  });

  it("should generate a random future date within daytime hours", () => {
    const now = new Date("2026-08-10T12:00:00Z");
    const randomDate = getRandomFutureDate(1, 3, now);

    expect(randomDate.getTime()).toBeGreaterThan(now.getTime());
    const hours = randomDate.getHours();
    expect(hours).toBeGreaterThanOrEqual(9);
    expect(hours).toBeLessThanOrEqual(21);
  });

  it("should process overdue pending posts and call postToTelegramChannel", async () => {
    const overdueDate = new Date(Date.now() - 60000); // 1 min in past
    const futureDate = new Date(Date.now() + 3600000); // 1 hour in future

    await addScheduledPost("overdueWord", "**Overdue**", overdueDate, tempDir);
    await addScheduledPost("futureWord", "**Future**", futureDate, tempDir);

    const spyPost = vi
      .spyOn(telegramModule, "postToTelegramChannel")
      .mockResolvedValue({ success: true });

    const result = await processPendingPosts(
      "fake-token",
      "@fakechannel",
      tempDir,
    );

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.sentWords).toEqual(["overdueWord"]);
    expect(spyPost).toHaveBeenCalledTimes(1);

    const posts = await getScheduledPosts(tempDir);
    const overduePost = posts.find((p) => p.wordName === "overdueWord");
    const futurePost = posts.find((p) => p.wordName === "futureWord");

    expect(overduePost?.status).toBe("sent");
    expect(futurePost?.status).toBe("pending");
  });
});
