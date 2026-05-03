CREATE TABLE "project_api_key" (
	"id" text PRIMARY KEY DEFAULT (gen_random_uuid())::text NOT NULL,
	"project_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_api_key_projectId_idx" ON "project_api_key" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_api_key_keyHash_unique" ON "project_api_key" USING btree ("key_hash");