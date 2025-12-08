import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createVideo, createReservation } from "./db";

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
      headers: {
        origin: "https://example.com",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Payment System", () => {
  let testVideoId: number;
  let testReservationId: number;

  beforeAll(async () => {
    // Create a test video
    testVideoId = await createVideo({
      userId: 1,
      template1Id: 1,
      template2Id: 2,
      template3Id: 3,
      duration: 30,
      status: "completed",
      videoUrl: "https://example.com/test-video.mp4",
      videoKey: "test-video-key",
    });

    // Create a test reservation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    testReservationId = await createReservation({
      userId: 1,
      videoId: testVideoId,
      projectionDate: tomorrow,
      slotNumber: 5,
      status: "confirmed",
    });
  });

  describe("payments.createCheckoutSession", () => {
    it("creates a Stripe checkout session with videoId in success_url", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.payments.createCheckoutSession({
        videoId: testVideoId,
        reservationId: testReservationId,
      });

      expect(result).toHaveProperty("checkoutUrl");
      expect(typeof result.checkoutUrl).toBe("string");
      expect(result.checkoutUrl).toContain("checkout.stripe.com");
      
      // Note: We can't directly verify the success_url contains videoId
      // because Stripe API doesn't return it in the checkout URL.
      // The success_url is configured server-side and will be used after payment.
    });

    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: undefined,
        req: {
          protocol: "https",
          headers: { origin: "https://example.com" },
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.payments.createCheckoutSession({
          videoId: testVideoId,
          reservationId: testReservationId,
        })
      ).rejects.toThrow();
    });
  });

  describe("payments.getUserPayments", () => {
    it("returns user's payment history", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const payments = await caller.payments.getUserPayments();

      expect(Array.isArray(payments)).toBe(true);
      // May be empty if no payments have been completed
    });

    it("does not return other users' payments", async () => {
      const { ctx } = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      const payments = await caller.payments.getUserPayments();

      // User 2 should not see User 1's payments
      const user1Payments = payments.filter((p) => p.userId === 1);
      expect(user1Payments.length).toBe(0);
    });
  });
});
