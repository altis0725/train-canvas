import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createTemplate, getDb } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-openid",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-openid",
    email: "user@example.com",
    name: "Regular User",
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

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Template Management", () => {
  let testTemplateId: number;

  beforeAll(async () => {
    // Create a test template
    const db = await getDb();
    if (db) {
      testTemplateId = await createTemplate({
        category: 1,
        title: "Test Template",
        description: "Test description",
        videoUrl: "https://example.com/video.mp4",
        videoKey: "test-video-key",
        thumbnailUrl: "https://example.com/thumb.jpg",
        duration: 10,
        displayOrder: 0,
      });
    }
  });

  describe("templates.getByCategory", () => {
    it("allows public access to get templates by category", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.getByCategory({ category: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("videoUrl");
    });

    it("validates category range (1-3)", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.templates.getByCategory({ category: 0 })
      ).rejects.toThrow();

      await expect(
        caller.templates.getByCategory({ category: 4 })
      ).rejects.toThrow();
    });
  });

  describe("templates.getAll", () => {
    it("allows admin to get all templates", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.getAll();

      expect(Array.isArray(result)).toBe(true);
    });

    it("denies regular users from getting all templates", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.templates.getAll()).rejects.toThrow("Admin access required");
    });
  });

  describe("templates.create", () => {
    it("allows admin to create templates", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.create({
        category: 2,
        title: "New Template",
        description: "New template description",
        videoUrl: "https://example.com/new-video.mp4",
        videoKey: "new-video-key",
        thumbnailUrl: "https://example.com/new-thumb.jpg",
        duration: 10,
        displayOrder: 1,
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    });

    it("denies regular users from creating templates", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.templates.create({
          category: 2,
          title: "Unauthorized Template",
          videoUrl: "https://example.com/video.mp4",
          videoKey: "video-key",
        })
      ).rejects.toThrow("Admin access required");
    });
  });

  describe("templates.update", () => {
    it("allows admin to update templates", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.update({
        id: testTemplateId,
        title: "Updated Template Title",
      });

      expect(result).toEqual({ success: true });
    });

    it("denies regular users from updating templates", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.templates.update({
          id: testTemplateId,
          title: "Unauthorized Update",
        })
      ).rejects.toThrow("Admin access required");
    });
  });

  describe("templates.delete", () => {
    it("allows admin to delete templates (soft delete)", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.delete({ id: testTemplateId });

      expect(result).toEqual({ success: true });
    });

    it("denies regular users from deleting templates", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.templates.delete({ id: testTemplateId })
      ).rejects.toThrow("Admin access required");
    });
  });
});
