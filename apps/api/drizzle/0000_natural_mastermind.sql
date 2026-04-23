CREATE TYPE "public"."history_action_enum" AS ENUM('created', 'updated', 'status_override', 'synced', 'marked_stale', 'archived');--> statement-breakpoint
CREATE TYPE "public"."org_role_enum" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."priority_enum" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."sync_state_enum" AS ENUM('synced', 'stale', 'new');--> statement-breakpoint
CREATE TYPE "public"."test_status_enum" AS ENUM('passed', 'failed', 'skipped', 'timed_out', 'not_run');--> statement-breakpoint
CREATE TYPE "public"."test_type_enum" AS ENUM('happy-path', 'negative-path', 'edge-case', 'a11y', 'performance');--> statement-breakpoint
CREATE TYPE "public"."trigger_type_enum" AS ENUM('ci', 'local', 'manual');--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role_enum" DEFAULT 'member' NOT NULL,
	"invited_by" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_org_user" UNIQUE("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"default_id_prefix" text DEFAULT 'TST' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_default_id_prefix_unique" UNIQUE("default_id_prefix")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"repository_url" text,
	"id_prefix" text DEFAULT 'TST' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"total_tests" integer DEFAULT 0 NOT NULL,
	"passed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"timed_out" integer DEFAULT 0 NOT NULL,
	"total_duration_ms" integer DEFAULT 0 NOT NULL,
	"environment" text,
	"branch" text,
	"commit_sha" text,
	"ci_build_id" text,
	"ci_build_url" text,
	"triggered_by" "trigger_type_enum" DEFAULT 'local' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"bg_color" text DEFAULT '#cccccc' NOT NULL,
	"text_color" text DEFAULT '#000000' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unique_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"suite_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"file_path" text,
	"test_type" "test_type_enum" DEFAULT 'happy-path' NOT NULL,
	"priority" "priority_enum" DEFAULT 'medium' NOT NULL,
	"sync_state" "sync_state_enum" DEFAULT 'new' NOT NULL,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"override_comment" text,
	"flaky_score" integer DEFAULT 0 NOT NULL,
	"is_flaky" boolean DEFAULT false NOT NULL,
	"custom_fields" jsonb DEFAULT '{}' NOT NULL,
	"owner" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_project_unique_id" UNIQUE("project_id","unique_id")
);
--> statement-breakpoint
CREATE TABLE "test_cases_tags" (
	"test_case_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_cases_tags_test_case_id_tag_id_pk" PRIMARY KEY("test_case_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "test_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_case_id" uuid NOT NULL,
	"run_batch_id" uuid,
	"status" "test_status_enum" NOT NULL,
	"duration_ms" integer,
	"environment" text,
	"browser" text,
	"os" text,
	"trace_url" text,
	"error_message" text,
	"error_stack" text,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"override_comment" text,
	"overridden_by" uuid,
	"commit_sha" text,
	"branch" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_suites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"refresh_token" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_id_prefix_organizations_default_id_prefix_fk" FOREIGN KEY ("id_prefix") REFERENCES "public"."organizations"("default_id_prefix") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_batches" ADD CONSTRAINT "run_batches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_suite_id_test_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."test_suites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases_tags" ADD CONSTRAINT "test_cases_tags_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases_tags" ADD CONSTRAINT "test_cases_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_run_batch_id_run_batches_id_fk" FOREIGN KEY ("run_batch_id") REFERENCES "public"."run_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_overridden_by_users_id_fk" FOREIGN KEY ("overridden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_members_org" ON "org_members" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orgs_slug" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_projects_org" ON "projects" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_run_batches_project" ON "run_batches" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_run_batches_started" ON "run_batches" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_run_batches_branch" ON "run_batches" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "idx_tags_project" ON "tags" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_test_cases_project" ON "test_cases" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_test_cases_unique_id" ON "test_cases" USING btree ("unique_id");--> statement-breakpoint
CREATE INDEX "idx_test_cases_suite" ON "test_cases" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "idx_test_cases_status" ON "test_cases" USING btree ("sync_state");--> statement-breakpoint
CREATE INDEX "idx_test_cases_owner" ON "test_cases" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "idx_test_cases_type" ON "test_cases" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "idx_test_cases_flaky" ON "test_cases" USING btree ("is_flaky");--> statement-breakpoint
CREATE INDEX "idx_test_cases_custom" ON "test_cases" USING gin ("custom_fields");--> statement-breakpoint
CREATE INDEX "idx_tct_test_case" ON "test_cases_tags" USING btree ("test_case_id");--> statement-breakpoint
CREATE INDEX "idx_tct_tag" ON "test_cases_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_test_runs_case" ON "test_runs" USING btree ("test_case_id");--> statement-breakpoint
CREATE INDEX "idx_test_runs_batch" ON "test_runs" USING btree ("run_batch_id");--> statement-breakpoint
CREATE INDEX "idx_test_runs_status" ON "test_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_test_runs_created" ON "test_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_test_runs_env" ON "test_runs" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_test_runs_commit" ON "test_runs" USING btree ("commit_sha");--> statement-breakpoint
CREATE INDEX "idx_test_runs_branch" ON "test_runs" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "idx_test_suites_project" ON "test_suites" USING btree ("project_id");