import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { migrate as migrateNeon } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';

import { logger } from '@repo/core';

/**
 * This function determines the environment (remote DB vs. local PGLite)
 * and runs the appropriate Drizzle migrations.
 */
export const runMigrations = async (): Promise<void> => {
    // Check for the DATABASE_URL environment variable to decide the migration strategy.
    if (process.env.DATABASE_URL) {
        logger.info(
            '🐘 Checking for pending migrations on remote PostgreSQL...'
        );
        try {
            const sql = neon(process.env.DATABASE_URL);
            const db = drizzleNeon(sql);
            await migrateNeon(db, { migrationsFolder: 'drizzle' });
            logger.info('✅ Remote migrations are up to date.');
        } catch (error: any) {
            logger.error('❌ Remote migration failed:', error.toString());
            process.exit(1);
        }
    } else {
        logger.info(
            '🪶 Checking for pending migrations on local PGLite database...'
        );
        try {
            const pglite = new PGlite('file:local.db');
            const db = drizzlePglite(pglite);
            await migratePglite(db, { migrationsFolder: 'drizzle' });
            logger.info('✅ Local migrations are up to date.');
        } catch (error: any) {
            logger.error('❌ Local migration failed:', error.toString());
            process.exit(1);
        }
    }
};
