// Import environment variables.
import dotenv from 'dotenv';

import { runMigrations } from '@/db/migrate';

// Run migrations on startup.
(async () => {
    await runMigrations();
})();

// Import global from third party libraries.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { serve } from '@hono/node-server';

// Import CRON jobs.

// Import routers.
import authRouter from '@/routes/auth';
import usersRouter from '@/routes/users';

// Import models.
// Entities.
// Enums.
// Errors.

// Import utilities.
import { logger } from '@repo/core';

// Import DB.

/**
 * This file is used as the entry point for the backend Hono server.
 *
 * @author Aayush Goyal
 * @created 2026-04-08
 */
/*
 * Initializing app.
 */
const app = new Hono();

/*
 * CORS Settings
 */
app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: [
            'Content-Type',
            'Authorization',
            'X-User-Id',
            'X-Phone-Number',
            'X-Firebase-User-Id'
        ]
    })
);

/*
 * Logging
 */
app.use(
    '*', // Apply logger to all routes
    honoLogger((...args: string[]) => {
        const message = args.join(' ');
        logger.info(message);
    })
);

/*
 * Health Check
 */
app.get('/api/v1/health', (c) => {
    logger.info('Health check endpoint was hit.');
    return c.json({ status: 'ok', message: 'Assertive API is running!' });
});

/*
 * API Routes
 */
app.route('/api/v1/auth', authRouter);
app.route('/api/v1/users', usersRouter);

/*
 * Start the Server
 */
const port: number = 8080;
serve(
    {
        fetch: app.fetch,
        port: port
    },
    (info) => {
        logger.info(
            `✅ assertive server is running and listening on http://localhost:${info.port}`
        );
    }
);

export default app;
