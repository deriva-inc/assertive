import * as dotenv from 'dotenv';
import path from 'path';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePGLite, PgliteDatabase } from 'drizzle-orm/pglite';

import * as schema from './schema';
import { logger } from '@repo/core';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * This function creates a PGLite client for local development when DATABASE_URL is not set.
 *
 * @returns A Drizzle client instance connected to a local PGLite database.
 */
function createPGLiteClient(): PgliteDatabase<typeof schema> {
    const pgliteClient = new PGlite('./local.db');
    logger.info('🪶 Using PGLite as the database driver.');
    return drizzlePGLite(pgliteClient, { schema, casing: 'camelCase' });
}

/**
 * This function creates a Neon client for remote PostgreSQL databases.
 *
 * @param connectionString - The connection URL for the remote PostgreSQL database.
 * @returns A Drizzle client instance connected to the remote PostgreSQL database.
 */
function createRemoteDBClient(
    connectionString: string
): NodePgDatabase<typeof schema> {
    const pool = new Pool({ connectionString });
    logger.info('DATABASE URL: ', connectionString);
    logger.info('🐘 Using node-postgres driver for PostgreSQL database.');
    // The standard 'node-postgres' driver does not support the 'casing' option.
    // We use the `relations()` API and schema design to handle camelCase naming.
    return drizzle(pool, { schema });
}

/**
 * This function checks for the presence of the DATABASE_URL environment variable.
 * If it exists, it creates a client for the remote PostgreSQL database.
 * If it does not exist, it falls back to creating a client for the local PGLite database.
 *
 * This allows developers to seamlessly switch between local and remote databases without changing any code.
 */
const db: NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema> =
    process.env.DATABASE_URL
        ? createRemoteDBClient(process.env.DATABASE_URL)
        : createPGLiteClient();

export { db };

export {
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
} from './schema';
