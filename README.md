# Arquitectura de Aplicaciones - Trabajo 3P

Repositorio monorepo con frontend y backend para un marketplace en desarrollo.
El estado actual incluye onboarding de vendedores, sesiones con JWT en cookie HttpOnly, panel company-admin funcional para gestion de vendedores, dashboard de vendedor, marketplace publico de tiendas y reseñas de productos.

## Estado funcional actual

### Landing publica
- Ruta: `/`
- Disponible para cualquier usuario.
- Header con render condicional segun sesion:
  - sin sesion: `Login` (`/auth/login`)
  - con sesion activa: boton `Perfil` (`/profile`) y `Cerrar sesión`
- El acceso admin es separado en `/auth/lg-admin` y no permite auto-registro desde la landing.
- El `user_id` no se expone en home.

### Marketplace publico
- Listado publico de tiendas en `/tiendas`.
- Ficha publica de tienda en `/tiendas/:vendorId`.
- Ambas rutas consumen `/api/vendors` sin sesion.

### Flujo vendedor
- **Registro vendedor**:
  - Frontend: formulario en `/auth/register`
  - Backend: `POST /api/auth/register`
  - DB RPC: `user_create`
- **Login vendedor**:
  - Frontend: formulario en `/auth/login`
  - Backend: `POST /api/auth/login`
  - DB RPC: `user_login`
- **Sesion vendedor**:
  - Backend emite JWT en cookie HttpOnly al hacer login.
  - Frontend consulta sesion con `GET /api/auth/session`.
  - Cierre de sesion con `POST /api/auth/logout`.
- **Cambio de contraseña**:
  - Frontend: formulario en `/auth/change-password`.
  - Backend: `POST /api/auth/change-password`.
  - Requerido cuando el admin creo la cuenta con `must_change_password = true`.
- **Perfil vendedor**:
  - Ruta `/profile` (placeholder protegido), expone `user_id` de la sesion activa.
- **Dashboard vendedor**:
  - Ruta `/vendor` protegida por rol `vendor` (guard `RequireRoleRoute`).
  - Backend: `GET /api/vendor/me` (requiere sesion vendedor).

### Flujo company-admin
- **Login admin**: ruta separada `/auth/lg-admin`.
  - Backend: `POST /api/auth/admin/login`.
  - DB RPC: `admin_login`.
  - JWT distingue rol `admin` vs `vendor` en la cookie de sesion.
- **Panel admin** (`/admin`, protegido por rol `admin`):
  - Listar vendedores con estado (activo, eliminado, cambio de password pendiente).
  - Crear vendedor con password temporal (fuerza `must_change_password`).
  - Desactivar tienda (soft-delete).
- Registro admin desde landing: **no habilitado**.

### Reseñas de productos
- Backend expone `GET`/`POST /api/products/:productId/reviews` (persistidas en MongoDB).
- Frontend aun no integra la vista.

## Estructura del repositorio

```text
/
├─ frontend/                          # React + TypeScript + Vite
│  └─ src/
│     ├─ app/                         # Composicion de rutas, layout y guards
│     ├─ features/auth/               # Login/registro vendedor, login admin, cambio password, sesion
│     ├─ features/home/               # Landing publica
│     ├─ features/vendors/            # Marketplace publico (listado y ficha de tienda)
│     ├─ features/profile/            # Placeholder perfil vendedor
│     ├─ features/vendor/             # Placeholder area vendedor (dashboard en construccion)
│     └─ features/admin/              # Panel company-admin (listar, crear, desactivar)
├─ backend/                           # Node.js + Express + Supabase + MongoDB (reviews)
│  └─ src/
│     └─ modules/
│        ├─ auth/                     # Auth vendor + admin, session, rate-limit
│        ├─ vendors/                  # Marketplace publico (list / getProfile)
│        ├─ admin-panel/              # Gestion de vendedores (require admin)
│        ├─ vendor-dashboard/         # Dashboard vendedor (require sesion vendor)
│        └─ reviews/                  # Reseñas de productos (MongoDB)
└─ database/queries/                  # SQL source-of-truth (funciones y grants)
```

## Endpoints backend vigentes

Base URL local por defecto: `http://localhost:3001`

| Metodo | Ruta | Uso actual |
| --- | --- | --- |
| GET | `/api/health` | Healthcheck del backend |
| POST | `/api/auth/register` | Registro vendedor via RPC `user_create` |
| POST | `/api/auth/login` | Login vendedor via RPC `user_login` |
| POST | `/api/auth/admin/login` | Login admin via RPC `admin_login` |
| POST | `/api/auth/change-password` | Cambio de contraseña del vendedor autenticado |
| GET | `/api/auth/session` | Estado de sesion JWT actual (cookie HttpOnly) |
| POST | `/api/auth/logout` | Cierre de sesion (limpia cookie) |
| GET | `/api/vendors` | Listado publico de tiendas |
| GET | `/api/vendors/:vendorId` | Ficha publica de una tienda |
| GET | `/api/admin/vendors` | Listado de vendedores (requiere admin) |
| POST | `/api/admin/vendors` | Crear vendedor con password temporal (requiere admin) |
| PATCH | `/api/admin/vendors/:vendorId/deactivate` | Soft-delete de una tienda (requiere admin) |
| GET | `/api/vendor/me` | Perfil del vendedor autenticado |
| GET | `/api/products/:productId/reviews` | Listar reseñas de un producto |
| POST | `/api/products/:productId/reviews` | Crear reseña de un producto |

## SQL y reglas de acceso a datos

- Toda logica de base de datos vive en `database/queries/`.
- El codigo de app no ejecuta SQL directo; usa Supabase RPC.
- Archivos SQL (aplicar en orden numerico):

| Archivo | Contenido |
| --- | --- |
| `00_extensions.sql` | Extensiones requeridas (`pgcrypto`, etc.) |
| `01_tables.sql` | Tablas base (`users`, `admins`, `vendors`, `products`, logs) |
| `02_helpers_and_triggers.sql` | Helpers comunes y triggers de `updated_at` |
| `03_audit_triggers.sql` | Triggers de auditoria hacia tablas `*_logs` |
| `04_safety_guards.sql` | Bloqueos de DELETE/TRUNCATE directos |
| `05_business_functions_and_grants.sql` | RPC vendedor: `user_create`, `user_login`, `user_soft_delete`, `user_hard_delete` |
| `06_admins.sql` | Tabla `admins`, RPC `admin_login`, `admin_create`, `admin_soft_delete`, `admin_hard_delete` |
| `07_vendors_and_products.sql` | Tablas y triggers de tiendas y productos |
| `08_vendor_product_functions_and_grants.sql` | RPC publicas para marketplace |
| `09_must_change_password.sql` | Flag `must_change_password` y RPC de cambio |
| `10_admin_panel_functions_and_grants.sql` | RPC admin: `admin_create_vendor`, `admin_list_vendors`, `admin_deactivate_vendor` |
| `11_vendor_dashboard_functions_and_grants.sql` | RPC del dashboard vendedor |
| `12_product_crud.sql` | CRUD de productos |

- `user_hard_delete` y `admin_hard_delete` estan definidas pero **no integradas** en backend/frontend.

## Variables de entorno

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
```

### Backend (`backend/.env`)

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=<tu-url-supabase>
SUPABASE_ANON_KEY=<tu-anon-key>
JWT_SECRET=<secreto-largo-aleatorio>
JWT_EXPIRES_IN=12h
SESSION_COOKIE_NAME=vendor_session
COOKIE_SECURE=false
MONGODB_URI=mongodb+srv://<user>:<password>@<host>/<db>?retryWrites=true&w=majority
MONGODB_DB_NAME=<db-de-reviews>
```

Archivos de referencia incluidos:
- `frontend/.env.example`
- `backend/.env.example`

## Scripts principales

Desde la raiz del repositorio:

```bash
npm ci
npm run lint
npm run build
npm run test
npm run test:coverage
npm run audit
npm run check    # build + test + audit
```

Scripts utiles de desarrollo:

```bash
npm run dev:frontend
npm run dev:backend
npm run typecheck --workspace backend
```

## Cobertura de tests actual

- Backend: `auth/*`, `vendors/*`, `admin-panel/*`, `vendor-dashboard/*` (unit tests con `node --test`). `reviews/*` aun sin tests.
- Frontend: componentes y flujos criticos con Vitest + Testing Library (`AdminPanelPage`, `VendorTable`, `CreateVendorForm`, `ChangePasswordForm`, etc.).

## Flujo de ejecucion local

1. Instalar dependencias con `npm ci`.
2. Configurar `.env` en `frontend/` y `backend/` (usar los `.env.example` como base).
3. Aplicar los archivos SQL de `database/queries/` en orden en la base Supabase.
4. Levantar backend con `npm run dev:backend`.
5. Levantar frontend con `npm run dev:frontend`.
6. Abrir la URL de Vite mostrada en consola.

## Limitaciones actuales (intencionales)

- `/vendor` sigue siendo placeholder visual mientras se integra el dashboard completo.
- `user_hard_delete` y `admin_hard_delete` no tienen endpoint ni UI expuestos.
- Frontend aun no integra la vista de reseñas de productos.
- Modulo `reviews` (backend) no tiene tests todavia.
