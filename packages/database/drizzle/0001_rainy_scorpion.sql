CREATE TABLE "memory_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"intent" text NOT NULL,
	"alternatives_considered" text,
	"architecture_impact" text,
	"files_touched" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"git_commit_ref" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"banner_image_url" text,
	"banner_gradient_preset" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memory_entry" ADD CONSTRAINT "memory_entry_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memory_entry_projectId_idx" ON "memory_entry" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "memory_entry_projectId_createdAt_idx" ON "memory_entry" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "project_userId_idx" ON "project" USING btree ("user_id");