import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createTemplate } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}-openid`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Video Creation", () => {
  let template1Id: number;
  let template2Id: number;
  let template3Id: number;
  let testVideoId: number;

  beforeAll(async () => {
    // Create test templates for each category
    template1Id = await createTemplate({
      category: 1,
      title: "Test Template 1",
      videoUrl: "https://example.com/template1.mp4",
      videoKey: "template1-key",
      duration: 10,
      displayOrder: 0,
    });

    template2Id = await createTemplate({
      category: 2,
      title: "Test Template 2",
      videoUrl: "https://example.com/template2.mp4",
      videoKey: "template2-key",
      duration: 10,
      displayOrder: 0,
    });

    template3Id = await createTemplate({
      category: 3,
      title: "Test Template 3",
      videoUrl: "https://example.com/template3.mp4",
      videoKey: "template3-key",
      duration: 10,
      displayOrder: 0,
    });
  });

  describe("videos.create", () => {
    it("creates a video from three templates", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.videos.create({
        template1Id,
        template2Id,
        template3Id,
      });

      expect(result).toHaveProperty("videoId");
      expect(typeof result.videoId).toBe("number");
      testVideoId = result.videoId;
    });

    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: undefined,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.videos.create({
          template1Id,
          template2Id,
          template3Id,
        })
      ).rejects.toThrow();
    });
  });

  describe("videos.getUserVideos", () => {
    it("returns user's videos", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const videos = await caller.videos.getUserVideos();

      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0]).toHaveProperty("userId", 1);
    });

    it("does not return other users' videos", async () => {
      const { ctx } = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      const videos = await caller.videos.getUserVideos();

      // User 2 should not see User 1's videos
      const user1Videos = videos.filter((v) => v.userId === 1);
      expect(user1Videos.length).toBe(0);
    });
  });

  describe("videos.getById", () => {
    it("returns video by ID for owner", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const video = await caller.videos.getById({ id: testVideoId });

      expect(video).toBeDefined();
      expect(video.id).toBe(testVideoId);
      expect(video.userId).toBe(1);
    });

    it("denies access to other users' videos", async () => {
      const { ctx } = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.videos.getById({ id: testVideoId })
      ).rejects.toThrow("Video not found");
    });
  });

  describe("videos.delete", () => {
    it("allows owner to delete their video", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create a video to delete
      const { videoId } = await caller.videos.create({
        template1Id,
        template2Id,
        template3Id,
      });

      const result = await caller.videos.delete({ id: videoId });

      expect(result).toEqual({ success: true });

      // Verify video is deleted
      await expect(
        caller.videos.getById({ id: videoId })
      ).rejects.toThrow("Video not found");
    });

    it("denies deletion of other users' videos", async () => {
      const { ctx } = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.videos.delete({ id: testVideoId })
      ).rejects.toThrow("Video not found");
    });
  });
});
