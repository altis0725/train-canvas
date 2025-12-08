import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { mergeVideos, getRenderStatus } from "./_core/shotstack";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import {
  getTemplatesByCategory,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createVideo,
  getUserVideos,
  getVideoById,
  deleteVideo,
  createReservation,
  getReservationById,
  getReservationsByUserId,
  getReservationsByDateRange,
  updateReservationData,
  updateReservationStatus,
  getPaymentsByUserId,
  getPaymentById,
  getProjectionSchedulesByDateRange,
  createProjectionSchedule,
  updateProjectionScheduleStatus,
  getDb,
} from "./db";
import { templates, users, reservations, payments, videos } from "../drizzle/schema";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  payments: router({
    // Create Stripe checkout session
    createCheckoutSession: protectedProcedure
      .input(
        z.object({
          videoId: z.number().optional(),
          reservationId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-10-29.clover",
        });

        const { PRODUCTS } = await import("./products");

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "jpy",
                product_data: {
                  name: PRODUCTS.PAID_SERVICE.name,
                  description: PRODUCTS.PAID_SERVICE.description,
                },
                unit_amount: PRODUCTS.PAID_SERVICE.price,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${ctx.req.headers.origin}/reservations?payment=success${input.videoId ? `&videoId=${input.videoId}` : ''}`,
          cancel_url: `${ctx.req.headers.origin}/mypage?payment=cancelled`,
          client_reference_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            video_id: input.videoId?.toString() || "",
            reservation_id: input.reservationId?.toString() || "",
          },
          allow_promotion_codes: true,
        });

        return { checkoutUrl: session.url };
      }),

    // Get user's payment history
    getUserPayments: protectedProcedure.query(async ({ ctx }) => {
      const payments = await getPaymentsByUserId(ctx.user.id);
      return payments;
    }),

    // Get payment by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const payment = await getPaymentById(input.id);
        if (!payment || payment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }
        return payment;
      }),
  }),

  reservations: router({
    // Create a new reservation
    create: protectedProcedure
      .input(
        z.object({
          videoId: z.number(),
          projectionDate: z.date(),
          slotNumber: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const reservationId = await createReservation({
          userId: ctx.user.id,
          videoId: input.videoId,
          projectionDate: input.projectionDate,
          slotNumber: input.slotNumber,
          status: "confirmed",
        });
        return { reservationId };
      }),

    // Get user's reservations
    getUserReservations: protectedProcedure.query(async ({ ctx }) => {
      const reservations = await getReservationsByUserId(ctx.user.id);
      return reservations;
    }),

    // Get reservation by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const reservation = await getReservationById(input.id);
        if (!reservation || reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
        }
        return reservation;
      }),

    // Get available time slots for a date
    getAvailableSlots: publicProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const startDate = new Date(input.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(input.date);
        endDate.setHours(23, 59, 59, 999);

        const existingReservations = await getReservationsByDateRange(startDate, endDate);
        const bookedSlots = existingReservations.map((r) => r.slotNumber);

        // Generate time slots (36 slots per day: 9:00-18:00, every 15 minutes)
        // Each slot is 15 minutes, numbered 1-36
        const allSlots: number[] = [];
        for (let i = 1; i <= 36; i++) {
          allSlots.push(i);
        }

        const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));
        return availableSlots;
      }),

    // Update reservation (only allowed 1 day before projection)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          projectionDate: z.date().optional(),
          slotNumber: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const reservation = await getReservationById(input.id);
        if (!reservation || reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
        }

        // Check if modification is allowed (1 day before)
        const oneDayBefore = new Date(reservation.projectionDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        if (new Date() > oneDayBefore) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot modify reservation less than 1 day before projection",
          });
        }

        await updateReservationData(input.id, {
          projectionDate: input.projectionDate,
          slotNumber: input.slotNumber,
        });
        return { success: true };
      }),

    // Cancel reservation (only allowed 1 day before projection)
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const reservation = await getReservationById(input.id);
        if (!reservation || reservation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
        }

        // Check if cancellation is allowed (1 day before)
        const oneDayBefore = new Date(reservation.projectionDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        if (new Date() > oneDayBefore) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot cancel reservation less than 1 day before projection",
          });
        }

        await updateReservationStatus(input.id, "cancelled");
        return { success: true };
      }),
  }),

  projection: router({
    // Get projection schedules for a specific date
    getSchedulesByDate: publicProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const startDate = new Date(input.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(input.date);
        endDate.setHours(23, 59, 59, 999);

        const schedules = await getProjectionSchedulesByDateRange(startDate, endDate);
        return schedules;
      }),

    // Create projection schedule (admin only)
    createSchedule: protectedProcedure
      .input(
        z.object({
          reservationId: z.number(),
          scheduledTime: z.date(),
          repeatCount: z.number().default(5),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        // Calculate end time (15 minutes projection session)
        const endTime = new Date(input.scheduledTime);
        endTime.setMinutes(endTime.getMinutes() + 15);

        const scheduleId = await createProjectionSchedule({
          reservationId: input.reservationId,
          startTime: input.scheduledTime,
          endTime: endTime,
          status: "scheduled",
        });

        return { scheduleId };
      }),

    // Update projection schedule status
    updateScheduleStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["scheduled", "in_progress", "completed", "failed"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        await updateProjectionScheduleStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  admin: router({
    // Get all users (admin only)
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await getDb();
      if (!db) return [];
      return db.select().from(users).orderBy(desc(users.createdAt));
    }),

    // Get all reservations (admin only)
    getAllReservations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await getDb();
      if (!db) return [];
      return db.select().from(reservations).orderBy(desc(reservations.createdAt));
    }),

    // Get all payments (admin only)
    getAllPayments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await getDb();
      if (!db) return [];
      return db.select().from(payments).orderBy(desc(payments.createdAt));
    }),
  }),

  videos: router({
    // Create video from templates
    create: protectedProcedure
      .input(
        z.object({
          template1Id: z.number(),
          template2Id: z.number(),
          template3Id: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get template URLs from database
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const [template1, template2, template3] = await Promise.all([
          db.select().from(templates).where(eq(templates.id, input.template1Id)).limit(1),
          db.select().from(templates).where(eq(templates.id, input.template2Id)).limit(1),
          db.select().from(templates).where(eq(templates.id, input.template3Id)).limit(1),
        ]);

        if (!template1[0] || !template2[0] || !template3[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "One or more templates not found" });
        }

        // Create video record with processing status
        const videoId = await createVideo({
          userId: ctx.user.id,
          template1Id: input.template1Id,
          template2Id: input.template2Id,
          template3Id: input.template3Id,
          duration: 30, // Estimated duration
          status: "processing",
          videoUrl: "", // Will be updated when render completes
          videoKey: "",
        });

        // Start Shotstack render in background
        mergeVideos(
          template1[0].videoUrl,
          template2[0].videoUrl,
          template3[0].videoUrl
        )
          .then(async ({ renderId }) => {
            // Poll for completion (background process)
            const pollInterval = setInterval(async () => {
              try {
                const status = await getRenderStatus(renderId);
                
                if (status.status === "done" && status.url) {
                  clearInterval(pollInterval);
                  // Update video record with final URL
                  const db = await getDb();
                  if (db) {
                    await db
                      .update(videos)
                      .set({
                        status: "completed",
                        videoUrl: status.url,
                        videoKey: `shotstack/${renderId}`,
                        updatedAt: new Date(),
                      })
                      .where(eq(videos.id, videoId));
                  }
                } else if (status.status === "failed") {
                  clearInterval(pollInterval);
                  // Update video record with failed status
                  const db = await getDb();
                  if (db) {
                    await db
                      .update(videos)
                      .set({
                        status: "failed",
                        updatedAt: new Date(),
                      })
                      .where(eq(videos.id, videoId));
                  }
                }
              } catch (error) {
                console.error("[Shotstack] Polling error:", error);
                clearInterval(pollInterval);
              }
            }, 5000); // Poll every 5 seconds

            // Stop polling after 5 minutes
            setTimeout(() => clearInterval(pollInterval), 300000);
          })
          .catch(async (error) => {
            console.error("[Shotstack] Render failed:", error);
            // Update video record with failed status
            const db = await getDb();
            if (db) {
              await db
                .update(videos)
                .set({
                  status: "failed",
                  updatedAt: new Date(),
                })
                .where(eq(videos.id, videoId));
            }
          });

        return { videoId };
      }),

    // Get user's videos
    getUserVideos: protectedProcedure.query(async ({ ctx }) => {
      const videos = await getUserVideos(ctx.user.id);
      return videos;
    }),

    // Get video by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const video = await getVideoById(input.id);
        if (!video || video.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        }
        return video;
      }),

    // Delete video
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const video = await getVideoById(input.id);
        if (!video || video.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        }
        await deleteVideo(input.id);
        return { success: true };
      }),
  }),

  templates: router({
    // Get all templates by category
    getByCategory: publicProcedure
      .input(z.object({ category: z.number().min(1).max(3) }))
      .query(async ({ input }) => {
        const templates = await getTemplatesByCategory(input.category);
        return templates;
      }),

    // Get all templates (for admin)
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await getDb();
      if (!db) return [];
      return db.select().from(templates).orderBy(templates.category, templates.displayOrder);
    }),

    // Create template (admin only)
    create: protectedProcedure
      .input(
        z.object({
          category: z.number().min(1).max(3),
          title: z.string().min(1),
          description: z.string().optional(),
          videoUrl: z.string().url(),
          videoKey: z.string(),
          thumbnailUrl: z.string().url().optional(),
          duration: z.number().default(10),
          displayOrder: z.number().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const id = await createTemplate(input);
        return { id };
      }),

    // Update template (admin only)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          category: z.number().min(1).max(3).optional(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          videoUrl: z.string().url().optional(),
          videoKey: z.string().optional(),
          thumbnailUrl: z.string().url().optional(),
          duration: z.number().optional(),
          displayOrder: z.number().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { id, ...updateData } = input;
        await updateTemplate(id, updateData);
        return { success: true };
      }),

    // Delete template (admin only, soft delete)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await deleteTemplate(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
