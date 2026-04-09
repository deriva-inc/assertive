import path from 'path';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';

import { logger } from '@repo/core';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

/**
 * This function determines the environment (remote DB vs. local PGLite)
 * and runs the appropriate Drizzle migrations.
 */
export const runMigrations = async (): Promise<void> => {
    if (process.env.DATABASE_URL) {
        logger.info('DATABASE URL: ', process.env.DATABASE_URL);
        logger.info(
            '🐘 Checking for pending migrations on remote PostgreSQL...'
        );
        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL
            });
            const db = drizzle(pool);
            try {
                await migrate(db, { migrationsFolder: 'drizzle' });
                logger.info('✅ PostgreSQL migrations are up to date.');
            } catch (error: any) {
                logger.error(
                    '❌ PostgreSQL migration failed:',
                    error.toString()
                );
                pool.end();
                process.exit(1);
            } finally {
                await pool.end();
            }
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
