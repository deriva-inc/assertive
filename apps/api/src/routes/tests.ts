// Import global from third party libraries.
import express, { Request, Response, Router } from 'express';

// Import use cases.

// Import controllers.

// import middlewares.

// Import models.
// Entities.
// Enums.
// Errors.

// Import Db.

/**
 * This file is used to export all the routers related to the "Test Case" service.
 */
const testsRouter: Router = express.Router();

// TODO: Dummy function (CRUD for test cases)
const isUserLoggedIn = () => async (req: Request, res: Response, next: any) => {
    const userId = req.query.userId as string;

    try {
        const result = true;

        res.status(200).json({
            message: 'OK',
            data: {
                isLoggedIn: result != null,
                sessionDetails: result
            }
        });
    } catch (error: any) {
        // logger.error('Error: ', error.toString());
        return res.status(401).json({
            message: 'Internal server error.',
            data: 'Session check failed. Please try again.'
        });
    }
};

testsRouter.get('/is-user-logged-in', isUserLoggedIn());

export default testsRouter;
