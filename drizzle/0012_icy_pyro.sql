ALTER TABLE "color_form_submissions" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "color_verification_requests" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;