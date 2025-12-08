CREATE TYPE "public"."paymentMethod" AS ENUM('stripe', 'qr');--> statement-breakpoint
CREATE TYPE "public"."paymentStatus" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."projectionStatus" AS ENUM('scheduled', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reservationStatus" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."videoType" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'JPY' NOT NULL,
	"paymentMethod" "paymentMethod" NOT NULL,
	"stripePaymentIntentId" varchar(255),
	"status" "paymentStatus" DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projectionSchedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"reservationId" integer NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"status" "projectionStatus" DEFAULT 'scheduled' NOT NULL,
	"actualStartTime" timestamp,
	"actualEndTime" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"videoId" integer NOT NULL,
	"paymentId" integer,
	"projectionDate" timestamp NOT NULL,
	"slotNumber" integer NOT NULL,
	"status" "reservationStatus" DEFAULT 'pending' NOT NULL,
	"cancellationReason" text,
	"cancelledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "systemSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "systemSettings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"videoUrl" varchar(512) NOT NULL,
	"videoKey" varchar(512) NOT NULL,
	"thumbnailUrl" varchar(512),
	"duration" integer DEFAULT 10 NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"template1Id" integer NOT NULL,
	"template2Id" integer NOT NULL,
	"template3Id" integer NOT NULL,
	"videoUrl" varchar(512),
	"videoKey" varchar(512),
	"duration" integer NOT NULL,
	"videoType" "videoType" DEFAULT 'free' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
