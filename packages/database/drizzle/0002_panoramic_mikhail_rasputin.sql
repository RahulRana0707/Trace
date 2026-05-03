ALTER TABLE "memory_entry" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;