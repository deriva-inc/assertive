// Import global from third party libraries.

import cors from 'cors';
import morgan from 'morgan';
import express, { Express } from 'express';

// Import CRON jobs.
import dotenv from 'dotenv';

// Import routers.
import authRouter from './routes/tests';

// Import models.
// Entities.
// Enums.
// Errors.

// Import utilities.

// Import DB.

/**
 * This file is used as the entry point for all REST APIs.
 *
 * @version 1.4.0
 * @author Aayush Goyal
 * @created 2024-11-29
 * @modifier Aayush Goyal
 * @modified 2025-04-03
 * @since 0.4.0
 */
/*
 * Initializing app.
 */
const app: Express = express();
const port: number = 8080;
const morganFormat =
    ':remote-addr :method :url :req[header] :res[header] :status :response-time';

// logger.info(process.env.NODE_ENV + " " + process.env.DB_CLIENT_NAME);
const envFile = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envFile });
console.log('NAME:', process.env.DB_CLIENT_NAME);

app.use(
    morgan(morganFormat, {
        stream: {
            write: (message: any) => {
                const logObject = {
                    address: message.split(' ')[0],
                    method: message.split(' ')[1],
                    url: message.split(' ')[2],
                    reqHeader: message.split(' ')[3],
                    resHeader: message.split(' ')[4],
                    status: message.split(' ')[5],
                    responseTime: message.split(' ')[6]
                };
                // logger.info(JSON.stringify(logObject));
            }
        }
    })
);

/*
 * CORS Settings
 */
const corsOpts = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-User-Id',
        'X-Phone-Number',
        'X-Firebase-User-Id'
    ]
};

/*
 * Body Parser Settings
 */
// const jsonParser = bodyParser.json();

/*
 * Middlewares
 */
// app.use(jsonParser);
app.use(cors(corsOpts));

/*
 * Url Routes
 */
app.use('/auth', authRouter);

/*
 * No API end-point.
 */
app.get('/', (req, res, next) => {
    res.status(404).send('No API end-point');
});

/*
 * 404 Error
 */
app.use((req, res, next) => {
    res.status(404).send('404. API endpoint not found.');
});

process.on('uncaughtException', (error) => {
    //   logger.error("Uncaught Exception:", error);
    process.exit(1); // Exit the process to prevent an unstable state
});

export default app;
