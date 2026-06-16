# Agents instructions for this repository

## Build, test, and lint commands

Use workspace commands from repository root:

- Install dependencies: `npm ci` (both workspaces)
- Lint all workspaces: `npm run lint`
- Build all workspaces: `npm run build`
- Run test suite: `npm run test`
- Run test suite with coverage: `npm run test:coverage`
- Run vulnerability audit: `npm run audit`
- Run full manual gate: `npm run check`

Workspace-level commands:

- Frontend dev server: `npm run dev:frontend`
- Backend dev server: `npm run dev:backend`
- Frontend lint: `npm run lint --workspace frontend`
- Backend typecheck: `npm run typecheck --workspace backend`
- Frontend typecheck: `npx tsc -b --noEmit` (from `frontend/`)

Single-test execution (backend): `node --import tsx --test "backend/src/modules/<module>/<file>.test.ts"`
Single-test execution (frontend): `npx vitest run "frontend/src/**/<file>.test.ts" --config vitest.config.ts`

Note: Root `npm run test` and `npm run build` are not yet wired since the root `package.json` has no scripts. Run from workspace directories directly.

## High-level architecture

The repository uses a simple workspace split:

1. `frontend/` is a React + TypeScript + Vite app.
2. `backend/` is a Node.js + Express API.
3. Root `package.json` orchestrates lint/build/test across both workspaces.

Current implemented flow:

1. `frontend/src/app/App.tsx` only composes routes.
2. Login UI lives under `frontend/src/features/auth/*`.
3. Frontend calls backend endpoint `POST /api/auth/login`.
4. Backend auth module (`modules/auth`) validates input and calls Supabase RPC `user_login`.
5. Auth routes are protected by an in-memory IP-based rate limiter (`auth.rate-limit.ts`) that allows 5 attempts per 30-minute window per IP.
6. No direct SQL exists in frontend/backend code; database logic stays in PostgreSQL functions.
7. Vendor storefronts are public and accessible without authentication via `GET /api/vendors` (returns up to 4 product previews per vendor) and `GET /api/vendors/:vendorId` (returns full product list).

## Database schema (current source of truth)

SQL files live in `database/queries/` and are numbered in execution order:

```
00_extensions.sql              — pgcrypto extension
01_tables.sql                  — public.users, public.user_logs
02_helpers_and_triggers.sql    — current_actor(), set_updated_at(), updated_at trigger for users
03_audit_triggers.sql          — log_users_changes(), audit trigger for users
04_safety_guards.sql           — block direct DELETE and TRUNCATE on users
05_business_functions_and_grants.sql  — user_create, user_login, user_soft_delete, user_hard_delete + grants
06_admins.sql                  — public.admins, public.admin_logs, triggers, guards, admin_create, admin_login, admin_soft_delete, admin_hard_delete + grants
07_vendors_and_products.sql    — public.vendors, public.vendor_logs, public.products, public.product_logs, triggers, guards
08_vendor_product_functions_and_grants.sql — get_vendor_list_with_products, get_vendor_profile, vendor_create + grants
```

### Table summary

`public.users` — vendor/seller accounts. Columns: `id uuid`, `username text`, `password_hash text`, `is_deleted boolean`, `deleted_at`, `created_at`, `updated_at`.

`public.admins` — company-admin accounts. Same column shape as `users`.

`public.vendors` — public storefront profile for a seller. Columns: `id uuid`, `user_id uuid → public.users(id)`, `display_name text`, `description text`, `is_active boolean`, `created_at`, `updated_at`. One vendor per user (`unique` on `user_id`).

`public.products` — products belonging to a vendor. Columns: `id uuid`, `vendor_id uuid → public.vendors(id)`, `name text`, `description text`, `image_url text`, `is_visible boolean`, `created_at`, `updated_at`.

`public.user_logs`, `public.admin_logs`, `public.vendor_logs`, `public.product_logs` — audit log tables, same shape: `id bigserial`, `event_time`, `action text`, `table_name text`, `row_id uuid`, `actor text`, `reason text`, `before_data jsonb`, `after_data jsonb`, `txid bigint`.

### SQL conventions (mandatory)

Every new SQL function must follow this pattern without exception:

```sql
create or replace function public.function_name(...)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
...
  return jsonb_build_object('ok', true, 'message', '...', 'data', ...);
...
$$;
```

All functions return `jsonb` with at minimum `{ ok: boolean, message: text }`. Read functions add a `data` key.

Every new table must have:
- An `updated_at` trigger reusing `public.set_updated_at()`.
- An audit trigger function (e.g. `log_<table>_changes()`) that writes INSERT/UPDATE/DELETE to the corresponding `<table>_logs`.
- A safety guard blocking direct DELETE (`block_direct_<table>_delete`) controlled by `app.allow_<table>_delete` session variable.
- A safety guard blocking TRUNCATE (`block_<table>_truncate`).
- `REVOKE ALL ON TABLE public.<table> FROM anon, authenticated` at the end of the file.

Every new RPC function must have explicit grants:
- `REVOKE ALL ON FUNCTION ... FROM anon, authenticated` before granting.
- `GRANT EXECUTE ON FUNCTION ... TO <role>` after.
- Public read functions: grant to `anon, authenticated`.
- Write/admin functions: grant only to `authenticated` or `service_role` as appropriate.

`public.current_actor()` is available in all SQL functions and returns the JWT sub or the current DB user.

### RPC naming convention

- Public read: `get_<entity>_<action>` (e.g. `get_vendor_list_with_products`, `get_vendor_profile`).
- Vendor-scoped write: `vendor_<action>` (e.g. `vendor_create`, `vendor_update_profile`).
- Admin-scoped write: `admin_<action>` (e.g. `admin_login`, `admin_soft_delete`).
- User auth: `user_<action>` (e.g. `user_login`, `user_create`).

## Backend module structure

Each feature lives in its own module under `backend/src/modules/<module>/`:

```
<module>.types.ts
<module>.repository.ts     — only supabase.rpc() calls, no SQL
<module>.service.ts        — business logic, validation, error wrapping
<module>.controller.ts     — Express request/response handling
<module>.routes.ts         — Router definition, registered in main routes file
<module>.repository.test.ts
<module>.service.test.ts
<module>.controller.test.ts
```

Shared utilities live in `backend/src/shared/`. `AppError` (with `message` and `status`) must be placed there if not already present.

### Implemented backend modules

- `modules/auth` — `user_login`, `user_create`, `admin_login`, session cookie management.
- `modules/vendors` — `GET /api/vendors`, `GET /api/vendors/:vendorId`. Public, no auth required.

### Backend rules

- Never build SQL strings. Never call `supabase.from(...)`. Only `supabase.rpc(name, params)`.
- Services validate input before calling repositories. UUID format validated with `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` before any RPC call that takes a UUID.
- Services throw `AppError` for expected failures (400, 403, 404). Controllers catch `AppError` and respond with `error.status`. Unexpected errors respond with 500.
- No field from `public.users` (especially `user_id`, `password_hash`, `is_deleted`) may appear in any API response.
- If a backend module calls an RPC not yet defined in `database/queries/`, stop and request the SQL file first.

## Frontend module structure

Each feature lives under `frontend/src/features/<feature>/`:

```
<feature>.types.ts
api/
  fetch<Entity>.ts          — fetch() wrappers, throw typed errors
  fetch<Entity>.test.ts     — unit tests mocking fetch globally
components/
  <Component>.tsx
  <Component>.test.tsx      — unit tests with React Testing Library + vitest
pages/
  <Page>.tsx
  <Page>.test.tsx           — unit tests with mock useParams, mock API
```

App-level concerns live in `frontend/src/app/`:
- `App.tsx` — route wiring only, no business logic, no fetch calls.
- `guards/RequireRoleRoute.tsx` — role-based route protection.

### Implemented frontend features

- `features/auth` — `VendorLoginForm`, `VendorRegisterForm`, `AuthSessionProvider`, `parseAuthResponse`.
- `features/vendors` — `fetchVendorList`, `fetchVendorProfile`, `VendorCard`, `VendorProductPreview`, `VendorProductGrid`, `VendorList`, `VendorStorePage`.
- `features/home` — `HomePage` (existing marketing landing with hardcoded stores), `VendorList` (dynamic vendor list component).

### Current routes

```
/                        — HomePage: marketing landing with hero + hardcoded stores
/tiendas                 — VendorListPage: all active vendor storefronts with product previews
/tiendas/:vendorId       — VendorStorePage: full product list for one vendor
/auth/login              — VendorLoginForm
/auth/register           — VendorRegisterForm
/auth/lg-admin           — AdminLoginForm (placeholder or implemented)
/vendor                  — protected by RequireRoleRoute (role: vendor)
/admin                   — protected by RequireRoleRoute (role: admin)
```

### Frontend rules

- `App.tsx` contains only route wiring. No fetch, no state, no business logic.
- Feature-specific logic stays inside its feature folder.
- API helpers (`fetch*.ts`) throw descriptive errors for non-ok responses. Never return raw `Response` objects.
- Components handle three states explicitly: loading, error, and empty. Never render nothing silently.
- No `user_id`, `password_hash`, or internal fields may be rendered in the DOM or logged to console.
- Mock `fetch` globally in tests. Never call real endpoints in unit tests.
- Mock `useParams`, `useNavigate`, and `AuthSessionProvider` context when testing pages.

## Testing

### Tools

- Backend: Node.js built-in test runner (`node:test`), no real database.
- Frontend: Vitest + React Testing Library + jsdom.

### Rules

- Mock `supabase.rpc` when testing repositories (use `mock.method(supabase, "rpc", ...)` from `node:test`).
- Mock the repository when testing services (use `mock.method(repository, "method", ...)`).
- Mock the service when testing controllers (using mock `req`/`res` objects, no HTTP server).
- Mock `fetch` globally when testing frontend API helpers.
- Mock `fetchVendorList` / `fetchVendorProfile` when testing components that call them.
- Every module must have tests for: success path, validation errors, not-found, unexpected errors, and permission boundaries.
- Coverage threshold: 80% minimum globally. Auth and session modules target 90%. Reviews and moderation target 85%.

### Test file locations

```
backend/src/modules/<module>/<module>.<layer>.test.ts
frontend/src/features/<feature>/<Component>.test.tsx
frontend/src/features/<feature>/<api>/<helper>.test.ts
frontend/src/features/<feature>/<pages>/<Page>.test.tsx
```

### Coverage scripts

```bash
npm run test             # run all unit tests
npm run test:coverage    # run all tests + generate coverage report
```

Coverage reports are generated per workspace:
- `backend/coverage/index.html`
- `frontend/coverage/index.html`

A task is not done if coverage drops below 80% or if error/permission/edge cases are untested.

## CI/CD pipeline

Use `.github/workflows/node.js.yml` as the canonical CI behavior.

Current pipeline sequence:

1. Trigger: `push` to any branch (`'**'`).
2. Runtime: `ubuntu-latest` + Node.js `20` in every job.
3. `prepare` job: checkout repository and setup Node.
4. `backend` job (needs `prepare`): `backend/` → `npm install`, `npm run typecheck`, `npm run build`.
5. `frontend` job (needs `prepare`): `frontend/` → `npm install`, `npm run lint`, `npm run build`.
6. `security` job (needs `prepare`): `backend/` → `npm audit --audit-level=moderate` (reports without failing).
7. `result` job (needs `backend`, `frontend`, `security`, `if: always()`): fails if backend or frontend failed.

CI rules:
- All commands must be Linux-compatible (bash/Ubuntu).
- Keep `working-directory` explicit per workspace job.
- Do not change CI trigger or runtime without approval from Enzo or Fredy.

## Role and permission model

Two authenticated roles exist:

- `vendor` — a seller who owns a storefront. Authenticated via `public.users` + `user_login` RPC. Can manage their own products and profile (future).
- `admin` — company-admin. Authenticated via `public.admins` + `admin_login` RPC. Can moderate reviews and manage vendor display names (future).

Public (unauthenticated) access is allowed for:
- Reading vendor storefronts (`get_vendor_list_with_products`, `get_vendor_profile`).
- Reading products within a storefront.

Rules:
- A vendor may never read or write another vendor's data.
- An admin may never be authenticated through the vendor login path and vice versa.
- All role-sensitive actions go through dedicated RPC functions, never generic endpoints.
- Session cookies are the auth mechanism. No JWT passed from frontend manually.

## Product direction and pending user stories

Treat these as approved goals. Implement one story at a time. No bundled features.

| # | Story | Status |
|---|-------|--------|
| 1 | As a customer, I want to leave anonymous reviews. | Pending |
| 2 | As a company, I want customers to contact sellers directly via links or phone. | Pending |
| 3 | As a seller, I want to show my products in my own storefront. | **Done (public read)** |
| 4 | As a company, I want to moderate and remove inappropriate reviews. | Pending |
| 5 | As a seller, I want to manage my storefront after logging in. | Pending |

Story 3 is done for public read (home preview + full storefront page). The private management side (vendor CRUD for products) is part of Story 5.

## Execution rules for AI agents

1. Implement one story or one sub-task at a time. Never mix unrelated features in the same change.
2. Read the existing SQL files before writing any new SQL. Match the exact patterns: `security definer`, `set search_path = public`, `jsonb_build_object('ok', ...)`, audit logs, safety guards, `REVOKE` + `GRANT`.
3. Never write SQL in backend or frontend code. Only `supabase.rpc(name, params)`.
4. Any new RPC function must have its SQL file committed in the same PR as the code that calls it.
5. Do not modify `00_extensions.sql` through `06_admins.sql`. Add new SQL in new numbered files only.
6. Keep `App.tsx` as route wiring only. No logic, no fetch, no state.
7. Do not expose `user_id`, `password_hash`, `is_deleted`, `deleted_at`, or any internal field in API responses or the DOM.
8. If the task requires an RPC that does not yet exist in `database/queries/`, stop and request the SQL file before proceeding.
9. If the task conflicts with this architecture, stop and ask Enzo or Fredy for confirmation before coding.
10. For schema-breaking changes (new auth flows, folder restructures, API contract changes), request explicit approval from Enzo or Fredy first.
11. After completing a task, verify: `npm run test` passes, coverage stays at or above 80%, and `npm run build` succeeds in both workspaces.