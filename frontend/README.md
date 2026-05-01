# Frontend workspace

React + TypeScript + Vite frontend for monorepo.

## Current scope

- App composition in `src/app/App.tsx`
- Vendor login flow calling backend `POST /api/auth/login`
- Separate placeholders for vendor and company-admin areas

## Environment

Copy `.env.example` to `.env` and adjust if needed:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
