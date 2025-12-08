import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createVideo } from "./db";

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

describe("Reservation System", () => {
  let testVideoId: number;
  let testReservationId: number;

  beforeAll(async () => {
    // Create a test video for reservations
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
  });

  describe("reservations.create", () => {
    it("creates a reservation", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(10, 0, 0, 0);

      const result = await caller.reservations.create({
        videoId: testVideoId,
        projectionDate: tomorrow,
        slotNumber: 5,
      });

      expect(result).toHaveProperty("reservationId");
      expect(typeof result.reservationId).toBe("number");
      testReservationId = result.reservationId;
    });

    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: undefined,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      await expect(
        caller.reservations.create({
          videoId: testVideoId,
          projectionDate: tomorrow,
          slotNumber: 5,
        })
      ).rejects.toThrow();
    });
  });

  describe("reservations.getUserReservations", () => {
    it("returns user's reservations", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const reservations = await caller.reservations.getUserReservations();

      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);
      expect(reservations[0]).toHaveProperty("userId", 1);
    });

    it("does not return other users' reservations", async () => {
      const { ctx } = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      const reservations = await caller.reservations.getUserReservations();

      // User 2 should not see User 1's reservations
      const user1Reservations = reservations.filter((r) => r.userId === 1);
      expect(user1Reservations.length).toBe(0);
    });
  });

  describe("reservations.getAvailableSlots", () => {
    it("returns available time slots for a date", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const availableSlots = await caller.reservations.getAvailableSlots({
        date: tomorrow,
      });

      expect(Array.isArray(availableSlots)).toBe(true);
      // Should have 36 slots (9:00-18:00, every 15 minutes)
      // Minus the one we booked (slot 5)
      expect(availableSlots.length).toBeLessThan(36);
      expect(availableSlots).not.toContain(5); // Slot 5 is booked
    });
  });

  describe("reservations.update", () => {
    it("allows updating reservation more than 1 day before", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reservations.update({
        id: testReservationId,
        slotNumber: 10,
      });

      expect(result).toEqual({ success: true });

      // Verify the update
      const reservation = await caller.reservations.getById({
        id: testReservationId,
      });
      expect(reservation.slotNumber).toBe(10);
    });

    it("denies updating other users' reservations", async () => {
      const { ctx } = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.reservations.update({
          id: testReservationId,
          slotNumber: 15,
        })
      ).rejects.toThrow("Reservation not found");
    });
  });

  describe("reservations.cancel", () => {
    it("allows cancelling reservation more than 1 day before", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reservations.cancel({
        id: testReservationId,
      });

      expect(result).toEqual({ success: true });

      // Verify the cancellation
      const reservation = await caller.reservations.getById({
        id: testReservationId,
      });
      expect(reservation.status).toBe("cancelled");
    });

    it("denies cancelling other users' reservations", async () => {
      const { ctx } = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create another reservation for user 1
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const { reservationId } = await caller.reservations.create({
        videoId: testVideoId,
        projectionDate: tomorrow,
        slotNumber: 20,
      });

      // Try to cancel as user 2
      const { ctx: ctx2 } = createUserContext(2);
      const caller2 = appRouter.createCaller(ctx2);

      await expect(
        caller2.reservations.cancel({
          id: reservationId,
        })
      ).rejects.toThrow("Reservation not found");
    });
  });
});
