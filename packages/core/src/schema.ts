import { z } from 'zod';

import { createSelectSchema } from 'drizzle-zod';
import {
    // Enums
    syncStateEnum,
    testStatusEnum,
    testTypeEnum,
    priorityEnum,
    orgRoleEnum,
    historyActionEnum,
    triggerTypeEnum,
    // Tables
    users,
    organizations,
    orgMembers,
    projects,
    testSuites,
    testCases,
    runBatches,
    testRuns,
    tags,
    testCasesTags
} from '@repo/db/src/schema';

// Enums
export const SYNC_STATE_ENUM = z.enum(syncStateEnum.enumValues);
export const TEST_STATUS_ENUM = z.enum(testStatusEnum.enumValues);
export const TEST_TYPE_ENUM = z.enum(testTypeEnum.enumValues);
export const PRIORITY_ENUM = z.enum(priorityEnum.enumValues);
export const ORG_ROLE_ENUM = z.enum(orgRoleEnum.enumValues);
export const HISTORY_ACTION_ENUM = z.enum(historyActionEnum.enumValues);
export const TRIGGER_TYPE_ENUM = z.enum(triggerTypeEnum.enumValues);

// Tables
export const UserSchema = createSelectSchema(users, {
    email: z.email()
});

export const OrganizationSchema = createSelectSchema(organizations, {
    defaultIdPrefix: z.string().default('TST')
});

export const OrgMemberSchema = createSelectSchema(orgMembers, {
    role: ORG_ROLE_ENUM.default('member')
});

export const ProjectSchema = createSelectSchema(projects, {
    idPrefix: z.string().default('TST')
});

export const TestSuiteSchema = createSelectSchema(testSuites);

export const TestCaseSchema = createSelectSchema(testCases, {
    testType: TEST_TYPE_ENUM.default('happy-path'),
    priority: PRIORITY_ENUM.default('medium'),
    syncState: SYNC_STATE_ENUM.default('new')
});

export const RunBatchSchema = createSelectSchema(runBatches, {
    triggeredBy: TRIGGER_TYPE_ENUM.default('local')
});

export const TestRunSchema = createSelectSchema(testRuns);

export const TagSchema = createSelectSchema(tags);

export const TestCaseTagSchema = createSelectSchema(testCasesTags);
