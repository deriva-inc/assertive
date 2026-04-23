# CHANGELOG
### [0.11.0] - 2026-04-23
---
#### Added
- Add Auth service API endpoints to:
    - `/api/v1/auth/register` - Register a new user.
    - `/api/v1/auth/login` - Login a new user.
    - `/api/v1/auth/refresh` - Get a new refresh token for a user.

### [0.10.0] - 2026-04-23
---
#### Updated
- Update SQL migration to match DB schema.

### [0.9.0] - 2026-04-09
---
#### Updated
- Update SQL migration to `pg` from `@neonserverless`.

### [0.8.0] - 2026-04-09
---
#### Added
- Run SQL migrations on server start-up.

### [0.7.0] - 2026-04-09
---
#### Added
- Implement and export PostgreSQL DB instance using drizzle.

### [0.6.0] - 2026-04-09
---
#### Added
- Implement drizzle schema based on DB schema.

### [0.5.0] - 2026-04-08
---
#### Added
- Add Hono support to serve backend APIs and server.

#### Deleted
- Remove Express.js support.
- Remove redundant dependencies from `apps/api` package.

### [0.4.0] - 2026-04-08
---
#### Added
- Add logger utility for better log management.

### [0.3.0] - 2026-03-05
---
#### Added
- Finalized turbo-repo structure.
- Added support for `ESLint`, `TypeScript`, and `Prettier`.
- Add [Satoshi](https://www.fontshare.com/fonts/satoshi) and [Fraunces](https://fonts.google.com/specimen/Fraunces) font.

### [0.2.0] - 2026-02-18 
---
#### Added
- add LICENSE to the project

### [0.1.0] - 2026-02-18
---
#### Added
- Initial commit from create-turbo
