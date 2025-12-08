import { pgTable, serial, text, varchar, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";

// Define Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const videoTypeEnum = pgEnum("videoType", ["free", "paid"]);
export const videoStatusEnum = pgEnum("status", ["pending", "processing", "completed", "failed"]);
export const reservationStatusEnum = pgEnum("reservationStatus", ["pending", "confirmed", "cancelled", "completed"]);
export const paymentMethodEnum = pgEnum("paymentMethod", ["stripe", "qr"]);
export const paymentStatusEnum = pgEnum("paymentStatus", ["pending", "succeeded", "failed", "refunded"]);
export const projectionStatusEnum = pgEnum("projectionStatus", ["scheduled", "in_progress", "completed", "failed"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Template categories for video generation
 */
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  category: integer("category").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 512 }).notNull(),
  videoKey: varchar("videoKey", { length: 512 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  duration: integer("duration").notNull().default(10),
  displayOrder: integer("displayOrder").notNull().default(0),
  isActive: integer("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Generated videos from template combinations
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  template1Id: integer("template1Id").notNull(),
  template2Id: integer("template2Id").notNull(),
  template3Id: integer("template3Id").notNull(),
  videoUrl: varchar("videoUrl", { length: 512 }),
  videoKey: varchar("videoKey", { length: 512 }),
  duration: integer("duration").notNull(),
  videoType: videoTypeEnum("videoType").notNull().default("free"),
  status: videoStatusEnum("status").notNull().default("pending"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Projection reservations
 */
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  videoId: integer("videoId").notNull(),
  paymentId: integer("paymentId"),
  projectionDate: timestamp("projectionDate").notNull(),
  slotNumber: integer("slotNumber").notNull(),
  status: reservationStatusEnum("status").notNull().default("pending"),
  cancellationReason: text("cancellationReason"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * Payment records
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("JPY"),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  status: paymentStatusEnum("status").notNull().default("pending"),
  errorMessage: text("errorMessage"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Projection schedules for the projection system
 */
export const projectionSchedules = pgTable("projectionSchedules", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservationId").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: projectionStatusEnum("status").notNull().default("scheduled"),
  actualStartTime: timestamp("actualStartTime"),
  actualEndTime: timestamp("actualEndTime"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type ProjectionSchedule = typeof projectionSchedules.$inferSelect;
export type InsertProjectionSchedule = typeof projectionSchedules.$inferInsert;

/**
 * System settings and parameters
 */
export const systemSettings = pgTable("systemSettings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;