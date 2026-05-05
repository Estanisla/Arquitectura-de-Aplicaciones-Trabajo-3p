# Arquitectura de Aplicaciones - Trabajo 3P

Repositorio monorepo con frontend y backend para un marketplace en desarrollo.  
El estado actual incluye onboarding de vendedores (registro y login), sesiones con JWT en cookie HttpOnly, landing publica y acceso admin separado por ruta.

## Estado funcional actual

### Landing publica
- Ruta: `/`
- Disponible para cualquier usuario.
- Header con render condicional segun sesion:
  - sin sesion: `Login` (`/auth/login`) y `Create account` (`/auth/register`)
  - con sesion activa: boton unico `Perfil` (`/profile`)
- El acceso admin es separado en `/auth/lg-admin` y no permite auto-registro desde la landing.
- El `user_id` no se expone en home.

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
- **Perfil vendedor**:
  - Ruta `/profile` (placeholder protegido).
  - Aqui se expone `user_id` de la sesion activa.

### Flujo company-admin
- Ruta separada: `/auth/lg-admin`
- Estado actual: interfaz de login separada (UI) sin endpoint backend admin todavia.
- Registro admin desde landing: **no habilitado**.

## Estructura del repositorio

```text
/
├─ frontend/                # React + TypeScript + Vite
│  └─ src/
│     ├─ app/               # Composicion de rutas y layout
│     ├─ features/auth/     # Login/registro vendedor, sesion JWT y login admin UI
│     ├─ features/home/     # Landing publica
│     ├─ features/profile/  # Placeholder perfil vendedor
│     ├─ features/vendor/   # Placeholder area vendedor
│     └─ features/admin/    # Placeholder area company-admin
├─ backend/                 # Node.js + Express + Supabase client
│  └─ src/
│     └─ modules/auth/      # Controller/service/repository de auth
└─ database/queries/        # SQL source-of-truth (funciones y grants)
```

## Endpoints backend vigentes

Base URL local por defecto: `http://localhost:3001`

| Metodo | Ruta | Uso actual |
| --- | --- | --- |
| GET | `/api/health` | Healthcheck del backend |
| POST | `/api/auth/register` | Registro vendedor via RPC `user_create` |
| POST | `/api/auth/login` | Login vendedor via RPC `user_login` |
| GET | `/api/auth/session` | Estado de sesion JWT actual (cookie HttpOnly) |
| POST | `/api/auth/logout` | Cierre de sesion (limpia cookie) |

## SQL y reglas de acceso a datos

- Toda logica de base de datos vive en `database/queries/`.
- El codigo de app no ejecuta SQL directo; usa Supabase RPC.
- Funciones SQL presentes en `05_business_functions_and_grants.sql`:
  - `user_create` (usada)
  - `user_login` (usada)
  - `user_soft_delete` (definida, no integrada en frontend/backend actual)
  - `user_hard_delete` (definida, no integrada en frontend/backend actual)

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
```

Scripts utiles de desarrollo:

```bash
npm run dev:frontend
npm run dev:backend
npm run typecheck --workspace backend
```

## Flujo de ejecucion local

1. Instalar dependencias con `npm ci`.
2. Configurar `.env` en frontend y backend.
3. Levantar backend con `npm run dev:backend`.
4. Levantar frontend con `npm run dev:frontend`.
5. Abrir la URL de Vite mostrada en consola.

## Limitaciones actuales (intencionales)

- Login admin aun no tiene integracion backend ni tabla admin dedicada.
- Areas `/vendor` y `/admin` siguen como placeholders.
- No hay suite de tests funcionales completa; backend actualmente reporta placeholder de test.
