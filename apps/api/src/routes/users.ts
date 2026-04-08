// Import global from third party libraries.
import { Hono } from 'hono';

// Import use cases.

// Import controllers.

// Import middlewares.

// Import types.
// Entities.
// Enums.
// Errors.
// Responses.

// Import utilities.
import { logger } from '@repo/core'; // Assuming you have your shared logger

// Import DB.

/**
 * This file defines the routes related to user service.
 *
 * @author Aayush Goyal
 * @created 2026-04-08
 */
const usersRouter = new Hono();

usersRouter.get('/', (c) => {
    logger.info('Fetching list of all projects');
    // In a real app, you would fetch this from your database
    const projects = [
        { id: 'proj_123', name: 'Assertive Main' },
        { id: 'proj_456', name: 'Personal Website' }
    ];
    return c.json(projects);
});

export default usersRouter;
