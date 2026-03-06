// Import global from third party libraries.
import app from '@/app';

// Import use cases.

// Import controllers.

// Import middlewares.

// Import models.
// Entities.
// Enums.
// Errors.

// Import utilities.

// Import DB.

// Import utilities.
// import logger from "./utils/log/logger";

/**
 * This file starts the server.
 */
const port: number = 8080;

app.listen(port, () => {
    return console.log(`Server started @ port:${port}`);
});
