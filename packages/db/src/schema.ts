import {
    boolean,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uuid
} from 'drizzle-orm/pg-core';

// SECTION: Enums
export const syncStateEnum = pgEnum('sync_state_enum', [
    'synced',
    'stale',
    'new'
]);
export const testStatusEnum = pgEnum('test_status_enum', [
    'passed',
    'failed',
    'skipped',
    'timed_out',
    'not_run'
]);
export const testTypeEnum = pgEnum('test_type_enum', [
    'happy-path',
    'negative-path',
    'edge-case',
    'a11y',
    'performance'
]);
export const priorityEnum = pgEnum('priority_enum', [
    'low',
    'medium',
    'high',
    'critical'
]);
export const orgRoleEnum = pgEnum('org_role_enum', [
    'owner',
    'admin',
    'member',
    'viewer'
]);
export const historyActionEnum = pgEnum('history_action_enum', [
    'created',
    'updated',
    'status_override',
    'synced',
    'marked_stale',
    'archived'
]);
export const triggerTypeEnum = pgEnum('trigger_type_enum', [
    'ci',
    'local',
    'manual'
]);
// !SECTION: Enums

/*
 * SECTION: `users` table - Represents a user account (local or team member)
 */
export const users = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow()
});
// !SECTION: `users` table

/*
 * SECTION: `organizations` table - Enterprise container: teams, billing, SSO, org-wide settings.
 */
export const organizations = pgTable(
    'organizations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: text('name').notNull(),
        slug: text('slug').notNull().unique(),
        logoUrl: text('logo_url'),
        defaultIdPrefix: text('default_id_prefix').notNull().default('TST'),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id, {
                onDelete: 'cascade'
            }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [index('idx_orgs_slug').on(table.slug)]
);
// !SECTION: `organizations` table

/*
 * SECTION: `org_members` table - Enterprise container: teams, billing, SSO, org-wide settings.
 */
export const orgMembers = pgTable(
    'org_members',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, {
                onDelete: 'cascade'
            }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, {
                onDelete: 'cascade'
            }),
        role: orgRoleEnum('role').notNull().default('member'),
        invitedBy: uuid('invited_by').references(() => users.id, {
            onDelete: 'set null'
        }),
        joinedAt: timestamp('joined_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [
        index('idx_org_members_org').on(table.orgId),
        index('idx_org_members_user').on(table.userId),
        unique('uq_org_user').on(table.orgId, table.userId)
    ]
);
// !SECTION: `org_members` table

/*
 * SECTION: `projects` table - Enterprise container: teams, billing, SSO, org-wide settings.
 */
export const projects = pgTable(
    'projects',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, {
                onDelete: 'cascade'
            }),
        name: text('name').notNull(),
        description: text('description'),
        repositoryUrl: text('repository_url'),
        idPrefix: text('id_prefix')
            .notNull()
            .default('TST')
            .references(() => organizations.defaultIdPrefix),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id, {
                onDelete: 'cascade'
            }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [index('idx_projects_org').on(table.orgId)]
);
// !SECTION: `projects` table

/*
 * SECTION: `test_suites` table - Logical grouping of test cases.
 * Supports nesting via self-referencing parent_id
 */
export const testSuites = pgTable(
    'test_suites',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, {
                onDelete: 'cascade'
            }),
        name: text('name').notNull(),
        description: text('description'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [index('idx_test_suites_project').on(table.projectId)]
);
// !SECTION: `test_suites` table

/*
 * SECTION: `test_cases` table - The core entity: a single test case, synced from a code file.
 */
export const testCases = pgTable(
    'test_cases',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        uniqueId: text('unique_id').notNull(), // Human-readable: "TST-001"
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, {
                onDelete: 'cascade'
            }),
        suiteId: uuid('suite_id').references(() => testSuites.id, {
            onDelete: 'set null'
        }),
        title: text('title').notNull(),
        description: text('description'),
        filePath: text('file_path'),
        testType: testTypeEnum('test_type').notNull().default('happy-path'),
        priority: priorityEnum('priority').notNull().default('medium'),
        syncState: syncStateEnum('sync_state').notNull().default('new'),
        isManualOverride: boolean('is_manual_override')
            .notNull()
            .default(false),
        overrideComment: text('override_comment'),
        flakyScore: integer('flaky_score').notNull().default(0),
        isFlaky: boolean('is_flaky').notNull().default(false),
        customFields: jsonb('custom_fields').notNull().default('{}'),
        owner: uuid('owner')
            .notNull()
            .references(() => users.id, {
                onDelete: 'set null'
            }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [
        index('idx_test_cases_project').on(table.projectId),
        index('idx_test_cases_unique_id').on(table.uniqueId),
        index('idx_test_cases_suite').on(table.suiteId),
        index('idx_test_cases_status').on(table.syncState),
        index('idx_test_cases_owner').on(table.owner),
        index('idx_test_cases_type').on(table.testType),
        index('idx_test_cases_flaky').on(table.isFlaky),
        index('idx_test_cases_custom').using('gin', table.customFields),
        unique('uq_project_unique_id').on(table.projectId, table.uniqueId)
    ]
);
// !SECTION: `test_cases` table

// CREATE INDEX idx_test_cases_custom    ON test_cases USING GIN (custom_fields);
/*
 * SECTION: `run_batches` table - Groups all test runs from a single execution.
 */
export const runBatches = pgTable(
    'run_batches',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, {
                onDelete: 'cascade'
            }),
        totalTests: integer('total_tests').notNull().default(0),
        passed: integer('passed').notNull().default(0),
        failed: integer('failed').notNull().default(0),
        skipped: integer('skipped').notNull().default(0),
        timedOut: integer('timed_out').notNull().default(0),
        totalDurationMs: integer('total_duration_ms').notNull().default(0),
        environment: text('environment'),
        branch: text('branch'),
        commitSha: text('commit_sha'),
        ciBuildId: text('ci_build_id'),
        ciBuildUrl: text('ci_build_url'),
        triggeredBy: triggerTypeEnum('triggered_by').notNull().default('local'),
        startedAt: timestamp('started_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        finishedAt: timestamp('finished_at', { withTimezone: true })
    },
    (table) => [
        index('idx_run_batches_project').on(table.projectId),
        index('idx_run_batches_started').on(table.startedAt),
        index('idx_run_batches_branch').on(table.branch)
    ]
);
// !SECTION: `run_batches` table

/*
 * SECTION: `test_runs` table - A single execution of a test case (created by the reporter).
 */
export const testRuns = pgTable(
    'test_runs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        testCaseId: uuid('test_case_id')
            .notNull()
            .references(() => testCases.id, {
                onDelete: 'cascade'
            }),
        runBatchId: uuid('run_batch_id').references(() => runBatches.id, {
            onDelete: 'set null'
        }),
        status: testStatusEnum('status').notNull(),
        durationMs: integer('duration_ms'),
        environment: text('environment'),
        browser: text('browser'),
        os: text('os'),
        traceUrl: text('trace_url'),
        errorMessage: text('error_message'),
        errorStack: text('error_stack'),
        isManualOverride: boolean('is_manual_override')
            .notNull()
            .default(false),
        overrideComment: text('override_comment'),
        overriddenBy: uuid('overridden_by').references(() => users.id, {
            onDelete: 'set null'
        }),
        commitSha: text('commit_sha'),
        branch: text('branch'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [
        index('idx_test_runs_case').on(table.testCaseId),
        index('idx_test_runs_batch').on(table.runBatchId),
        index('idx_test_runs_status').on(table.status),
        index('idx_test_runs_created').on(table.createdAt),
        index('idx_test_runs_env').on(table.environment),
        index('idx_test_runs_commit').on(table.commitSha),
        index('idx_test_runs_branch').on(table.branch)
    ]
);
// !SECTION: `test_runs` table

/*
 * SECTION: `tags` table - Reusable tags for categorization (e.g., "smoke", "regression").
 */
export const tags = pgTable(
    'tags',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, {
                onDelete: 'cascade'
            }),
        name: text('name').notNull(),
        bgColor: text('bg_color').notNull().default('#cccccc'),
        textColor: text('text_color').notNull().default('#000000'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [index('idx_tags_project').on(table.projectId)]
);
// !SECTION: `tags` table

/*
 * SECTION: `test_cases_tags` table - Many-to-Many relationship between test cases and tags.
 */
export const testCasesTags = pgTable(
    'test_cases_tags',
    {
        testCaseId: uuid('test_case_id')
            .notNull()
            .references(() => testCases.id, {
                onDelete: 'cascade'
            }),
        tagId: uuid('tag_id')
            .notNull()
            .references(() => tags.id, {
                onDelete: 'cascade'
            }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow()
    },
    (table) => [
        index('idx_tct_test_case').on(table.testCaseId),
        index('idx_tct_tag').on(table.tagId),
        primaryKey({ columns: [table.testCaseId, table.tagId] })
    ]
);
// !SECTION: `test_cases_tags` table
