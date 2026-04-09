// SECTION: Imports
import { z } from 'zod';
import {
    // Enums
    SYNC_STATE_ENUM,
    TEST_STATUS_ENUM,
    TEST_TYPE_ENUM,
    PRIORITY_ENUM,
    ORG_ROLE_ENUM,
    HISTORY_ACTION_ENUM,
    TRIGGER_TYPE_ENUM,
    // Tables
    UserSchema,
    OrganizationSchema,
    OrgMemberSchema,
    ProjectSchema,
    TestSuiteSchema,
    TestCaseSchema,
    RunBatchSchema,
    TestRunSchema,
    TagSchema,
    TestCaseTagSchema
} from '@/zod-schema';
// !SECTION: Imports

// SECTION: Types
// Enums
export type SYNC_STATE = z.infer<typeof SYNC_STATE_ENUM>;
export type TEST_STATUS = z.infer<typeof TEST_STATUS_ENUM>;
export type TEST_TYPE = z.infer<typeof TEST_TYPE_ENUM>;
export type PRIORITY = z.infer<typeof PRIORITY_ENUM>;
export type ORG_ROLE = z.infer<typeof ORG_ROLE_ENUM>;
export type HISTORY_ACTION = z.infer<typeof HISTORY_ACTION_ENUM>;
export type TRIGGER_TYPE = z.infer<typeof TRIGGER_TYPE_ENUM>;
// Tables
export type User = z.infer<typeof UserSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrgMember = z.infer<typeof OrgMemberSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type RunBatch = z.infer<typeof RunBatchSchema>;
export type TestRun = z.infer<typeof TestRunSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type TestCaseTag = z.infer<typeof TestCaseTagSchema>;
// !SECTION: Types
