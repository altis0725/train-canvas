ALTER TYPE "public"."reservationStatus" ADD VALUE 'pending_payment' BEFORE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."reservationStatus" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "holdExpiresAt" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_projection_slot_idx" ON "reservations" USING btree ("projectionDate","slotNumber");