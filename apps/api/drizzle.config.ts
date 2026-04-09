import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export default {
    schema: '../../packages/db/src/schema.ts',

    out: './drizzle',

    dialect: 'postgresql',
    schemaFilter: 'public',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
} satisfies Config;
