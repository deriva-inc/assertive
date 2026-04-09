import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePGLite } from 'drizzle-orm/pglite';

import * as schema from '@/schema';
import { logger } from '@repo/core';

/**
 * This function creates a PGLite client for local development when DATABASE_URL is not set.
 *
 * @returns A Drizzle client instance connected to a local PGLite database.
 */
function createPGLiteClient(): ReturnType<typeof drizzlePGLite> {
    const pgliteClient = new PGlite('./local.db');
    logger.info('🪶 Using PGLite as the database driver.');
    return drizzlePGLite(pgliteClient, { schema, casing: 'camelCase' });
}

/**
 * This function creates a Neon client for remote PostgreSQL databases.
 *
 * @param url - The connection URL for the remote PostgreSQL database.
 * @returns A Drizzle client instance connected to the remote PostgreSQL database.
 */
function createRemoteDBClient(url: string): ReturnType<typeof drizzle> {
    const sql = neon(url);
    logger.info('🐘 Using remote PostgreSQL as the database driver.');
    return drizzle(sql, { schema, casing: 'camelCase' });
}

/**
 * This function checks for the presence of the DATABASE_URL environment variable.
 * If it exists, it creates a client for the remote PostgreSQL database.
 * If it does not exist, it falls back to creating a client for the local PGLite database.
 *
 * This allows developers to seamlessly switch between local and remote databases without changing any code.
 */
const db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePGLite> =
    process.env.DATABASE_URL
        ? createRemoteDBClient(process.env.DATABASE_URL)
        : createPGLiteClient();

export default db;
