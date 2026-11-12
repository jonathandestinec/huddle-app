ALTER TABLE "number_claims" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "number_claims" ADD COLUMN "device_hash" text;--> statement-breakpoint
ALTER TABLE "number_claims" ADD CONSTRAINT "number_claims_function_device" UNIQUE("event_function_id","device_hash");