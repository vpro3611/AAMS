# AAMS Backend API Service

AAMS is a TypeScript + Node.js backend implementing authentication, role-based access control (RBAC), audit logging and basic user/role management over a PostgreSQL database.

This README covers:
- Quick start and prerequisites
- Environment variables
- Build, run & migrations
- Docker deployment and docker-compose example
- Authentication setup and how to use tokens
- Complete API reference (endpoints, access rules, request/response examples)
- Database schema (SQL-style + ER overview)
- Architecture overview (layers & dependency flow)
- Testing and development notes
- Pros / Cons, strengths/weaknesses, and trade-offs
- Suggested improvements and troubleshooting

---

Table of contents
1. Quick start
2. Environment variables
3. Build, run, and migrations
4. Docker deployment (example)
5. Authentication
6. API Reference
    - Public endpoints
    - Private endpoints (Users)
    - Roles endpoints
    - Audit endpoints
    - User-role endpoints
7. Database schema
8. Architecture & components
9. Testing
10. Pros / Cons, Strengths / Weaknesses, Trade-offs
11. Further improvements & troubleshooting

---

## 1. Quick start

Prerequisites:
- Node.js (>= 16 recommended)
- npm
- PostgreSQL (or use docker-compose example below)

Clone, install, configure env, run migrations, start:

```bash
git clone https://github.com/vpro3611/AAMS.git
cd AAMS
npm install

# Create .env (example shown below)
cp .env.example .env
# Edit .env to set DATABASE_URL, JWT_SECRET, etc.

# Run DB migrations
npm run migrate:up

# Run in development mode (fast)
npm run dev

# Or build and run compiled JS
npm run build
npm start
```

The server listens on PORT env var (default 3000).

---

## 2. Environment variables

Create a `.env` file at project root. Key variables:

- DATABASE_URL - Postgres connection string (e.g. postgres://user:password@host:5432/dbname)
    - Alternatively, the Pool is configured to read from DATABASE_URL. (Other DB_* options are present as comments but not used.)
- JWT_SECRET - Secret used to sign/verify JWT tokens (required).
- PORT - optional, default 3000.
- NODE_ENV - optional (development/production).

Example `.env`:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/aams_db
JWT_SECRET=your-super-secret-jwt-secret
PORT=3000
NODE_ENV=development
```

Notes:
- Keep JWT_SECRET secret and long in production.
- node-pg-migrate uses dotenv/config in package.json migration commands.

---

## 3. Build, run, and migrations

Scripts (package.json):
- npm run dev — development with ts-node via nodemon (src/main.ts or server bootstrap)
- npm run build — compile TypeScript to `dist/`
- npm start — run compiled code (expects dist files)
- npm run migrate:up — run migrations (node-pg-migrate up -m migrations -r dotenv/config)
- npm run migrate:down — rollback
- npm test — run Jest tests

Recommended workflow:
1. Populate `.env`.
2. npm install
3. npm run migrate:up
4. npm run dev (development) OR npm run build && npm start (production)

---

## 4. Docker deployment (example)

Below is a production-friendly example: a Dockerfile for the app + docker-compose with a Postgres service. At the given moment, the repository does not include these files, so the example is to <copy & adapt>.

Dockerfile (example)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm ci
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY .env .env
EXPOSE 3000
CMD ["node", "dist/main.js"]
# NOTE: entrypoint may be dist/index.js or dist/main.js depending on compiled output, but in here it is main.js.
```

docker-compose.yml (example)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: aams_db
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  app:
    build: .
    restart: on-failure
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/aams_db
      JWT_SECRET: super-secret-jwt
      PORT: 3000
    depends_on:
      - db
    ports:
      - "3000:3000"
    command: sh -c "npm run migrate:up && npm run start"

volumes:
  pg_data:
```

Steps:
1. Put Dockerfile and docker-compose.yml in repo root.
2. Run docker-compose up --build
3. The compose file runs migrations before `start`.

---

## 5. Authentication

- Flow: Register -> Login -> Receive JWT -> Use JWT in Authorization header for private endpoints.
- Passwords are hashed with bcrypt (bcryptjs).
- JWT tokens are signed with the secret from JWT_SECRET; Token payload's subject (`sub`) holds the user id.
- Token verification happens in middleware: Authorization: Bearer <token>

Login response:
```json
{ "token": "<jwt-token>" }
```

Use token in requests:
```
Authorization: Bearer <jwt-token>
```

Middleware behavior:
- Missing/invalid header -> 401 Unauthorized
- Invalid token -> InvalidTokenError
- On success, middleware sets req.userID to the user id in the token payload (payload.sub)
- Additional middlewares attach user status and roles and enforce role checks

---

## 6. API Reference

Base path:
- Public: /
- Private: All private endpoints are mounted under /api and require Authorization header.

Common types (JSON shapes)

Register DTO:
```json
{ "email": "alice@example.com", "password": "supersecret" }
```

Login DTO:
```json
{ "email": "alice@example.com", "password": "supersecret" }
```

User object (from models):
```json
{
  "id": "uuid",
  "email": "string",
  "password_hash": "string",
  "status": "active" | "blocked",
  "created_at": "ISO8601 timestamp"
}
```

Role object:
```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp"
}
```

Audit event:
```json
{
  "id": "uuid",
  "actor_user_id": "uuid",
  "action": "string",
  "created_at": "ISO8601 timestamp"
}
```

### Public endpoints

1. POST /register
- Description: Register a new user (creates user and default role via usecase).
- Auth: none
- Request body:
  ```json
  { "email": "alice@example.com", "password": "P@ssw0rd!" }
  ```
- Response: 201
  ```json
  {
    "id": "uuid",
    "email": "alice@example.com",
    "password_hash": "<hashed>",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

Example:
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"P@ssw0rd!"}'
```

2. POST /login
- Description: Authenticate user and return JWT token.
- Auth: none
- Request:
  ```json
  { "email": "alice@example.com", "password": "P@ssw0rd!" }
  ```
- Response: 200
  ```json
  { "token": "<jwt-token>" }
  ```

Example:
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"P@ssw0rd!"}'
```

### Private endpoints (mounted at /api)
Note: All below endpoints require Authorization: Bearer <token>. Role requirements are listed per route.

User management
- PATCH /api/block_user
    - Roles: ADMIN only
    - Body: { "user_id": "uuid" }
    - Response: { "blockedUser": { <User> } }

- PATCH /api/unblock_user
    - Roles: ADMIN only
    - Body: { "user_id": "uuid" }
    - Response: { "unblockedUser": { <User> } }

- POST /api/user/get_id
    - Roles: ADMIN or MODERATOR
    - Body: { "user_id": "uuid" }
    - Response: { "foundUser": { <User> } }

- POST /api/user/get_email
    - Roles: ADMIN or MODERATOR
    - Body: { "email": "alice@example.com" }
    - Response: { "foundUser": { <User> } }

- GET /api/users
    - Roles: ADMIN or MODERATOR
    - Response: { "allUsers": [ {<User>}, ... ] }

- POST /api/user/delete
    - Roles: ADMIN only
    - Body: { "user_id": "uuid" }
    - Response: { "deletedUser": { <User> } }

Role management
- POST /api/role
    - Roles: ADMIN or MODERATOR
    - Body: { "name": "MODERATOR" }
    - Response: created Role (201)

- POST /api/role/get_name
    - Roles: ADMIN or MODERATOR
    - Body: { "roleName": "ADMIN" }
    - Response: { "foundRole": { <Role> } }

- GET /api/roles
    - Roles: ADMIN or MODERATOR
    - Response: { "allRoles": [ {<Role>}, ... ] }

- PATCH /api/role/update
    - Roles: ADMIN or MODERATOR
    - Body: { "role_id": "uuid", "name": "NEW_NAME" }
    - Response: { "updatedRole": { <Role> } }

- POST /api/role/delete
    - Roles: ADMIN or MODERATOR
    - Body: { "roleId": "uuid" }
    - Response: { "deletedRole": { <Role> } }

Audit endpoints
- GET /api/audit_logs
    - Roles: ADMIN or MODERATOR
    - Response: list of audit events

- POST /api/audit_logs/get_user
    - Roles: ADMIN or MODERATOR
    - Body: { "user_id": "uuid" }
    - Response: filtered audit events

- POST /api/audit_logs/get_action
    - Roles: ADMIN or MODERATOR
    - Body: { "action": "USER_CREATED" }
    - Response: filtered audit events

User-Role management
- POST /api/assign_role
    - Roles: ADMIN only
    - Body: { "userId": "uuid", "roleId": "uuid" }
    - Response: success / assigned relation

- POST /api/get_roles
    - Roles: ADMIN only
    - Body: { "userId": "uuid" }
    - Response: roles for user

- POST /api/remove_role
    - Roles: ADMIN only
    - Body: { "userId": "uuid", "roleId": "uuid" }
    - Response: success / removed relation

Private endpoint example (get all users):
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <jwt-token>"
```

---

## 7. Database schema

The repository contains migrations named:
- migrations/1769442022735_create-users-table.js
- migrations/1769443843934_create-audit-table.js
- migrations/1769463392776_create-role-table.js
- migrations/1769463624803_create-user-roles-table.js

Inferred SQL schema (representative)

```sql
-- users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- or uuid_generate_v4()
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- roles
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles (many-to-many)
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- audit
CREATE TABLE audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

ER diagram (ASCII)
```
[users] 1 --- * [user_roles] * --- 1 [roles]
  |
  * (actor_user_id) --> [audit]
```

Notes:
- Unique constraint on users.email and roles.name.
- Use UUIDs for IDs.
- created_at timestamps default to now().

---

## 8. Architecture & components

High-level layering:
- app.ts / server.ts — express app, route registration, middleware pipeline
- controllers/* — HTTP handlers for resources (UserController, RoleController, UserRoleController, AuditController, Authentication controllers)
- middlewares/* — authMiddleware (JWT verification), roles middleware (requireRole / requireAnyRole), user status check, loggers, error handling
- usecases/* — application-level orchestration (e.g., registering users with default role)
- services/* — domain services (AuthService, UserService, RoleService, JWT token service, AuditService)
- repositories/* — database operations, use pg Pool queries (UserRepository, RoleRepository, UserRoleRepository, AuditRepository)
- models/models.ts — TypeScript types and enums (User, Role, AuditAction, Roles, UserStatus, error codes/messages)
- container.ts — builds dependency graph and wires services, repositories and controllers (DI)

Request flow example (private role-protected endpoint):
1. Client sends Authorization header with Bearer token.
2. auth_middleware verifies token via TokenService -> sets req.userID.
3. attachUserRoles middleware loads user roles and attaches to req.userRoles.
4. setUserStatus middleware fetches user status and attaches req.userStatus.
5. roles_middleware checks required roles for the endpoint.
6. Controller invokes UseCase/Service -> Repository interacts with DB.
7. Response returned. AuditService may persist audit record.

Dependency injection:
- buildContainer centralizes creation of Pool, repositories, services, controllers, and passes them to createApp. This facilitates unit testing (mocking dependencies) and swapable implementations.

Error handling:
- errors_middleware centralizes error-to-response mapping. Custom error classes exist (UnauthorizedError, InvalidTokenError, etc.).

---

## 9. Testing

- Tests are present under `__tests__` (unit, integration, e2e).
- Run `npm test` to execute Jest test suite.
- Tests imply code coverage across services, usecases, repos and controllers.

For integration/e2e tests, ensure a test Postgres instance is available, or tests use test doubles. Review test setup in repository to confirm DB lifecycle before running tests.

---

## 10. Pros / Cons, Strengths / Weaknesses, Trade-offs

Strengths
- Clear separation of concerns (controllers, services, repositories, usecases): easier to test and reason about.
- RBAC implemented using roles table & middleware; flexible and data-driven (roles can be created and assigned).
- Audit logging present for tracing actions — a good compliance feature.
- TypeScript types and enums centralize domain models and error messages.
- Migrations included for database schema.
- Comprehensive test suite present — good for regression protection.

Weaknesses
- No rate-limiting or brute-force protections on login endpoint.
- No refresh token mechanism — JWT revocation or expiration handling unclear (no refresh flow).
- No request validation library (e.g., Joi, Zod) — validation is partly manual; potential for inconsistent validation logic across controllers.
- No pagination for list endpoints (GET /api/users, /api/roles) — may not scale for large data sets.
- No field-level DTO typing in controllers — controllers trust request bodies (although services perform some checks).
- Password complexity is minimal: only length enforced in AuthService.
- Error messages / status codes may be inconsistent in spots (middleware sometimes uses next(err) while other parts send res directly) (architecture compromise).

Trade-offs
- Simplicity vs features: The app favors straightforward code and clear layering over advanced features like refresh tokens, token blacklisting, and input schema validation. This makes it simpler to understand and extend but requires adding these features for production security.
- Custom auth vs external solution: Using JWT + custom middleware gives control and simplicity but pushes responsibility for secure token practices to app maintainers.
- DB access with pg Pool and raw queries provides flexibility and performance but increases chance of duplicate SQL and manual mapping vs using an ORM.

Security considerations
- Ensure JWT_SECRET is strong and stored securely (not in VCS).
- Consider setting reasonable JWT expirations and implement refresh tokens or revocation for compromised tokens.
- Add rate-limiting and account lockouts to mitigate brute-force attacks.
- Use HTTPS and secure cookies where appropriate in production.

---

## 11. Further improvements & roadmap

Recommended short-term improvements:
- Add input validation using a schema validator (Zod, Joi, express-validator).
- Add JWT expiry configuration and refresh tokens.
- Add rate-limiting middleware (express-rate-limit or custom) to the login route.
- Add pagination to list endpoints.
- Harden tests with bootstrapped test DB via docker-compose or testcontainers.

Recommended long-term improvements for future work:
- Add role/permission mapping (more granular permissions instead of only role names).
- Add OpenAPI / Swagger documentation generated from routes and DTOs.
- Add logging to structured logger (pino or winston) and correlation IDs for tracing.
- Add graceful shutdown hooks and readiness/liveness endpoints for Kubernetes.

---

## Troubleshooting

- "Cannot connect to DB": check DATABASE_URL, ensure Postgres running and reachable, run migrations.
- Migration errors: ensure correct DB permissions and that `node-pg-migrate` env loader is configured (migrate commands use dotenv/config).
- JWT verification errors: ensure JWT_SECRET matches the secret used to sign tokens.
- Tests failing: inspect test logs; some tests may require a running test DB or environment variables set.

---