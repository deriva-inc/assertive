import { z } from 'zod';

export const APIResponseSchema = z.object({
    error: z.string().optional(),
    message: z.string(),
    data: z.any()
});

// [POST] /api/v1/auth/login
export const LoginUserBodySchema = z.object({
    email: z.email({ message: 'Please enter a valid email address' }),
    password: z.string().min(1, { message: 'Password cannot be empty' })
});

// [POST] /api/v1/auth/register
export const RegisterUserBodySchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long' }),
    email: z.email({ message: 'Please enter a valid email address' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' }),
    avatarUrl: z.url().optional()
});

export type APIResponse = z.infer<typeof APIResponseSchema>;
export type LoginUserBody = z.infer<typeof LoginUserBodySchema>;
export type RegisterUserBody = z.infer<typeof RegisterUserBodySchema>;
