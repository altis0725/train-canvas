import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as schema from "../drizzle/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!pool) {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
      }
      _db = drizzle(pool, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as any, // Type cast might be needed if updateSet inference is strict
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Template Queries ============

import { templates, videos, reservations, payments, projectionSchedules, systemSettings } from "../drizzle/schema";
import type { InsertTemplate, InsertVideo, InsertReservation, InsertPayment, InsertProjectionSchedule, InsertSystemSetting } from "../drizzle/schema";
import { and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * Get all active templates by category
 */
export async function getTemplatesByCategory(category: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(templates)
    .where(and(eq(templates.category, category), eq(templates.isActive, 1)))
    .orderBy(templates.displayOrder, templates.id);
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new template
 */
export async function createTemplate(template: InsertTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(templates).values(template).returning({ id: templates.id });
  return Number(result[0].id);
}

/**
 * Update a template
 */
export async function updateTemplate(id: number, template: Partial<InsertTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(templates).set(template).where(eq(templates.id, id));
}

/**
 * Delete a template (soft delete by setting isActive to 0)
 */
export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(templates).set({ isActive: 0 }).where(eq(templates.id, id));
}

// ============ Video Queries ============

/**
 * Create a new video
 */
export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videos).values(video).returning({ id: videos.id });
  return Number(result[0].id);
}

/**
 * Get video by ID
 */
export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get videos by user ID
 */
export async function getVideosByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
}

/**
 * Get videos by user ID (alias for consistency)
 */
export async function getUserVideos(userId: number) {
  return getVideosByUserId(userId);
}

/**
 * Delete a video
 */
export async function deleteVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(videos).where(eq(videos.id, id));
}

/**
 * Update video status
 */
export async function updateVideoStatus(id: number, status: "pending" | "processing" | "completed" | "failed", videoUrl?: string, videoKey?: string, errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (videoUrl) updateData.videoUrl = videoUrl;
  if (videoKey) updateData.videoKey = videoKey;
  if (errorMessage) updateData.errorMessage = errorMessage;

  await db.update(videos).set(updateData).where(eq(videos.id, id));
}

// ============ Reservation Queries ============

/**
 * Create a new reservation
 */
export async function createReservation(reservation: InsertReservation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reservations).values(reservation).returning({ id: reservations.id });
  return Number(result[0].id);
}

/**
 * Get reservation by ID
 */
export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get reservations by user ID
 */
export async function getReservationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reservations).where(eq(reservations.userId, userId)).orderBy(desc(reservations.projectionDate));
}

/**
 * Get reservations by date range
 */
export async function getReservationsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(reservations)
    .where(
      and(
        gte(reservations.projectionDate, startDate),
        lte(reservations.projectionDate, endDate),
        sql`${reservations.status} != 'cancelled'`
      )
    )
    .orderBy(reservations.projectionDate, reservations.slotNumber);
}

/**
 * Update reservation data
 */
export async function updateReservationData(id: number, data: { projectionDate?: Date; slotNumber?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reservations).set(data).where(eq(reservations.id, id));
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed", cancellationReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === "cancelled") {
    updateData.cancelledAt = new Date();
    if (cancellationReason) updateData.cancellationReason = cancellationReason;
  }

  await db.update(reservations).set(updateData).where(eq(reservations.id, id));
}

// ============ Payment Queries ============

/**
 * Create a new payment
 */
export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(payment).returning({ id: payments.id });
  return Number(result[0].id);
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get payments by user ID
 */
export async function getPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

/**
 * Update payment status by Stripe Payment Intent ID
 */
export async function updatePaymentStatus(stripePaymentIntentId: string, status: "pending" | "succeeded" | "failed" | "refunded", errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (errorMessage) updateData.errorMessage = errorMessage;

  await db.update(payments).set(updateData).where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
}

/**
 * Get payment by Stripe Payment Intent ID
 */
export async function getPaymentByStripeIntentId(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, stripePaymentIntentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Projection Schedule Queries ============

/**
 * Create a new projection schedule
 */
export async function createProjectionSchedule(schedule: InsertProjectionSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectionSchedules).values(schedule).returning({ id: projectionSchedules.id });
  return Number(result[0].id);
}

/**
 * Get projection schedules by date range
 */
export async function getProjectionSchedulesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(projectionSchedules)
    .where(
      and(
        gte(projectionSchedules.startTime, startDate),
        lte(projectionSchedules.startTime, endDate)
      )
    )
    .orderBy(projectionSchedules.startTime);
}

/**
 * Update projection schedule status
 */
export async function updateProjectionScheduleStatus(
  id: number,
  status: "scheduled" | "in_progress" | "completed" | "failed",
  actualStartTime?: Date,
  actualEndTime?: Date,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (actualStartTime) updateData.actualStartTime = actualStartTime;
  if (actualEndTime) updateData.actualEndTime = actualEndTime;
  if (errorMessage) updateData.errorMessage = errorMessage;

  await db.update(projectionSchedules).set(updateData).where(eq(projectionSchedules.id, id));
}

// ============ System Settings Queries ============

/**
 * Get system setting by key
 */
export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Set system setting
 */
export async function setSystemSetting(key: string, value: string, description?: string, category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSystemSetting(key);

  if (existing) {
    await db.update(systemSettings).set({ value, description, category }).where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({ key, value, description, category });
  }
}

/**
 * Get all system settings by category
 */
export async function getSystemSettingsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(systemSettings).where(eq(systemSettings.category, category));
}
