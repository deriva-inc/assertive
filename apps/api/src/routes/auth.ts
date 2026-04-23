import { LoginUserBodySchema, RegisterUserBodySchema } from '@repo/core';
import { logger } from '@repo/core';
import { db, users } from '@repo/db';
import { zValidator } from '@hono/zod-validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

/**
 * This file defines the routes related to auth service.
 *
 * @author Aayush Goyal
 * @created 2026-04-08
 */
const authRouter = new Hono();

/**
 * This function generates both an Access Token (JWT) and a Refresh Token (opaque) for a given user.
 *
 * @param userId - The unique identifier of the user.
 * @param email - The email address of the user.
 * @returns An object containing the access token and refresh token.
 */
const generateTokens = async (
    userId: string,
    email: string
): Promise<Record<string, string>> => {
    // Generate a JWT Access Token for the new user session.
    const payload = {
        sub: userId,
        email: email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // Expires in 1 hour
    };
    const secret = process.env.JWT_ACCESS_SECRET;
    const jwtToken = await sign(payload, secret);

    // Generate Refresh Token (long-lived, opaque)
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

    return { accessToken: jwtToken, refreshToken, hashedRefreshToken };
};

/**
 * @route POST /api/v1/auth/register
 * @desc Registers a new user, creates their account, and returns a session token.
 * @access Public
 */
authRouter.post(
    '/register',
    zValidator('json', RegisterUserBodySchema),
    async (c) => {
        logger.info(
            '[POST] /api/v1/auth/register - Starting user registration...'
        );

        const { name, email, password, avatarUrl } = c.req.valid('json');

        try {
            // Check if a user with this email already exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email)
            });

            if (existingUser) {
                logger.error('A user with this email already exists: ' + email);
                return c.json(
                    { error: 'A user with this email already exists.' },
                    409
                );
            }

            // Securely hash the user's password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Create the new user record in the database
            const newUser = {
                name,
                email,
                passwordHash,
                avatarUrl:
                    avatarUrl ||
                    `https://api.dicebear.com/9.x/notionists/svg?seed=${name.split(' ').join('-')}`
            };

            const insertedUsers = await db
                .insert(users)
                .values(newUser)
                .returning();

            const createdUser = insertedUsers[0];
            if (!createdUser) {
                logger.error(
                    'Failed to create user in the database for email: ' + email
                );
                return c.json({ error: 'Failed to create user.' }, 500);
            }

            const { accessToken, refreshToken, hashedRefreshToken } =
                await generateTokens(createdUser.id, createdUser.email);

            // Store the hashed refresh token in the database
            await db
                .update(users)
                .set({ refreshToken: hashedRefreshToken })
                .where(eq(users.id, createdUser.id));

            // Send Refresh Token in a secure, httpOnly cookie
            setCookie(c, 'rt', refreshToken as string, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/api/v1/auth',
                maxAge: 60 * 60 * 24 * 7
            });

            // Return the newly created user and their session token
            logger.debug('User registration successful for email: ' + email);
            return c.json(
                {
                    message: 'User registration successful',
                    data: { user: createdUser, accessToken }
                },
                201
            );
        } catch (error: any) {
            logger.error('Registration error:', error.toString());
            return c.json({ error: 'An unexpected error occurred.' }, 500);
        }
    }
);

/**
 * @route POST /api/v1/auth/login
 * @desc Logs in a user and returns a session token.
 * @access Public
 */
authRouter.post(
    '/login',
    zValidator('json', LoginUserBodySchema),
    async (c) => {
        logger.info('[POST] /api/v1/auth/login - Logging in the user...');

        const { email, password } = c.req.valid('json');

        try {
            // Find the user by their email address
            const user = await db.query.users.findFirst({
                where: eq(users.email, email)
            });

            // If no user is found, or if they don't have a password (e.g., social login in future)
            if (!user || !user.passwordHash) {
                logger.error('No user found with email: ' + email);
                return c.json({ error: 'Invalid email or password.' }, 401);
            }

            // Verify the submitted password against the stored hash
            const isPasswordValid = await bcrypt.compare(
                password,
                user.passwordHash
            );

            if (!isPasswordValid) {
                logger.error('Invalid password for email: ' + email);
                return c.json({ error: 'Invalid email or password.' }, 401);
            }

            // If password is valid, generate a new set of tokens.
            const { accessToken, refreshToken, hashedRefreshToken } =
                await generateTokens(user.id, user.email);

            // Store the hashed refresh token in the database
            await db
                .update(users)
                .set({ refreshToken: hashedRefreshToken })
                .where(eq(users.id, user.id));

            setCookie(c, 'rt', refreshToken as string, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/api/v1/auth',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            logger.debug('User login successful for email: ' + email);
            return c.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                accessToken
            });
        } catch (error: any) {
            logger.error('Login error:', error.toString());
            return c.json({ error: 'An unexpected error occurred.' }, 500);
        }
    }
);

/**
 * Route: POST /api/v1/auth/refresh
 * Description: Refreshes a user's session using a refresh token.
 * It issues a new access token and a new refresh token.
 */
authRouter.post('/refresh', async (c) => {
    logger.info(
        '[POST] /api/v1/auth/refresh - Attempting to refresh session...'
    );
    // Get the refresh token from the httpOnly cookie
    const refreshToken = getCookie(c, 'rt');

    if (!refreshToken) {
        logger.error('Refresh token not found in cookies.');
        return c.json({ error: 'Refresh token not found.' }, 401);
    }

    try {
        const authHeader = c.req.header('Authorization');
        const expiredToken = authHeader?.split(' ')[1];
        if (!expiredToken) {
            logger.error('Expired access token not provided.');
            return c.json({ error: 'Expired access token not provided.' }, 401);
        }

        // Decode the expired token to get the user ID ('sub') WITHOUT verifying expiry
        const decodedPayload = await verify(
            expiredToken,
            process.env.JWT_ACCESS_SECRET!,
            { alg: 'HS256', exp: false }
        );
        const userId = decodedPayload.sub;

        // Find the user in the database
        const user = await db.query.users.findFirst({
            columns: { id: true, email: true, refreshToken: true },
            where: eq(users.id, userId as string)
        });

        if (!user || !user.refreshToken) {
            logger.error('User not found or no refresh token stored.');
            return c.json({ error: 'Invalid refresh token.' }, 403);
        }

        // Compare the submitted refresh token with the stored hash
        const isRefreshTokenValid = await bcrypt.compare(
            refreshToken,
            user.refreshToken
        );

        // This is a security event. Someone might be trying to use a stolen/old refresh token.
        // For added security, you could clear the refresh token in the DB here.
        if (!isRefreshTokenValid) {
            await db
                .update(users)
                .set({ refreshToken: null })
                .where(eq(users.id, user.id));
            logger.warn(
                `Invalid refresh token attempt for user ID: ${user.id}`
            );
            logger.warn(
                'Cleared stored refresh token for this user as a security measure.'
            );
            return c.json({ error: 'Invalid refresh token.' }, 403);
        }

        // If valid, generate a new set of tokens (Token Rotation)
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await generateTokens(user.id, user.email);

        // Send the new refresh token in a new httpOnly cookie
        setCookie(c, 'rt', newRefreshToken as string, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/api/v1/auth',
            maxAge: 60 * 60 * 24 * 7
        });

        // Send the new access token in the response body
        logger.debug('Session refresh successful for user ID: ' + user.id);
        return c.json({ accessToken: newAccessToken });
    } catch (error: any) {
        // This catches errors from JWT verification (e.g., malformed token) or DB issues.
        logger.error('Refresh token error:', error.toString());
        return c.json({ error: 'Invalid token or server error.' }, 403);
    }
});

export default authRouter;
