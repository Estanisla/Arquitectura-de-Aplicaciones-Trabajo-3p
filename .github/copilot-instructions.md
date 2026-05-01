# Copilot instructions for this repository

## Build, test, and lint commands

Use workspace commands from repository root:

- Install dependencies: `npm ci`
- Lint all workspaces: `npm run lint`
- Build all workspaces: `npm run build`
- Run test suite: `npm run test`

Workspace-level commands:

- Frontend dev server: `npm run dev:frontend`
- Backend dev server: `npm run dev:backend`
- Backend typecheck: `npm run typecheck --workspace backend`

Single-test execution is not yet configured because no test runner with spec selection exists in the current codebase.

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
5. No direct SQL exists in frontend/backend code; database logic stays in PostgreSQL functions.

## CI/CD flow expected for this project

Use this quality gate sequence for every incoming change:

1. A developer pushes a change.
2. Environment is prepared automatically (download/install dependencies).
3. Code coherence is validated (logical consistency checks).
4. Code style/order is validated (format and lint consistency).
5. System tests are executed.
6. Security analysis is executed (known dependency vulnerabilities).
7. Final build is generated to confirm compilation succeeds.
8. If any gate fails, reject the change automatically.
9. If all gates pass, integrate the change.

## Product direction and pending user stories

Treat these as approved product goals to implement incrementally (one story at a time, no bundled mega-features):

1. As a customer, I want to leave anonymous reviews so I can help other users without exposing my identity.
2. As a company, I want customers to contact sellers directly through links or phone numbers, avoiding payment-gateway data handling in-platform.
3. As a seller, I want to show my products in my own section/profile so users can differentiate me from other sellers.
4. As a company, I want to moderate reviews and remove inappropriate ones.
5. As a seller, I want to manage my section intuitively by logging into my account, making product selling easier.

## Target app stack for upcoming implementation

- Frontend: React + TypeScript (TSX) with Vite.
- Backend: Node.js API.
- Database (current): Supabase PostgreSQL.
- Database (future candidate): Azure Database for PostgreSQL.
- Keep architecture intentionally simple and easy to operate.

## Role and permission model (approved direction)

- Keep current `users` login functions as baseline seller/vendor auth flow.
- Add separate company-admin capability (not system/platform super-admin).
- Company-admin scope includes business moderation actions (for example: remove users, moderate/remove reviews, edit seller display names).
- Enforce all role-sensitive actions through dedicated database functions exposed via Supabase RPC.
- Do not grant direct table access for app clients; keep `REVOKE` + `GRANT EXECUTE` pattern.

## Database SQL source-of-truth

- SQL definitions live in `database/queries/` split by concern (extensions, tables, triggers, guards, functions, grants).
- Any new Supabase function must be added to a `.sql` file inside `database/queries/` in same PR as code that calls it.
- Do not keep one-off SQL only in chat/messages; repository SQL files are migration source for future move from Supabase to Azure PostgreSQL.

## Copilot execution style for this repository

When implementing requested features, follow these project-specific rules:

1. Solve one objective per task. Do not mix unrelated features in same change.
2. Prefer simple flows and small modules over complex abstractions.
3. Separate responsibilities clearly (UI, business logic, data access, auth, moderation).
4. Use explicit boundaries for roles and auth paths when needed (for example, separate admin login and seller login flows).
5. Add redundancy only where it improves safety/clarity (role-specific checks, duplicated guards at API boundary).
6. Keep code readable and maintainable: predictable naming, low coupling, focused components/services.
7. Preserve backward-compatible behavior unless change request explicitly requires behavior change.
8. In React, keep `App.tsx` as composition/orchestration layer only: route/layout wiring and high-level component calls.
9. Do not place feature-specific business logic in `App.tsx`; keep it inside feature modules (example: `features/login/Login.tsx`, `features/login/*`).
10. Use segmented feature folders so failures are isolated and debugging path is obvious from imports/calls.
11. Follow Principle of Least Astonishment: choose structure and behavior that is intuitive for new maintainers, with clear entry points and predictable module names.
12. If requested implementation conflicts with this architecture/spec, stop and ask Enzo or Fredy for confirmation before coding.
13. For risky or schema-breaking actions (auth flow changes, folder structure changes, API contract changes), request explicit approval from Enzo or Fredy first.
14. SQL queries in app code are strictly forbidden. Never build SQL strings or query tables directly from frontend/backend code.
15. Database operations must go through reviewed database functions and Supabase RPC calls only (for example `rpc('user_login', ...)`).
16. Keep first implementation path simple: scaffold first, then deliver one feature at a time (starting with login).
17. For new admin/vendor capabilities, create explicit RPC functions per use case (`admin_*`, `vendor_*`) instead of generic multipurpose endpoints.
18. Keep company-admin authorization separate from vendor auth path, with clear module boundaries in frontend and backend.
19. If backend/frontend starts calling RPC function not defined in `database/queries/`, stop and request missing SQL file first.

## Key conventions

- Keep changes compatible with `main`-branch CI triggers (`push` and `pull_request` to `main`).
- Preserve Node version matrix compatibility (`18.x`, `20.x`, `22.x`) unless intentionally updated.
- Prefer deterministic installs with `npm ci` (not `npm install`) in CI-facing changes.
- Build is optional by design (`--if-present`), so introducing a `build` script is safe without changing workflow logic.
