# LifeOps frontend — dependencies and commands

This document lists npm dependencies and the commands to install and run the Next.js app.

## Prerequisites

- **Node.js** 20.x or newer (LTS recommended)
- **npm** 10+ (comes with Node)

Check versions:

```bash
node -v
npm -v
```

## Install dependencies

From this `frontend` folder:

```bash
cd frontend
npm install
```

This reads `package.json` and `package-lock.json` and installs everything into `node_modules/`.

## npm scripts

| Command | What it does |
|--------|----------------|
| `npm run dev` | Start the **development** server (Turbopack). App: [http://localhost:3000](http://localhost:3000) |
| `npm run build` | **Production build** (typecheck + optimized output) |
| `npm run start` | Serve the **production** build (run `build` first) |
| `npm run lint` | Run ESLint on the project |

Typical flow while developing:

```bash
npm install
npm run dev
```

Production-style check locally:

```bash
npm install
npm run build
npm run start
```

## Dependencies (`dependencies`)

These are installed for production/runtime:

| Package | Version (from package.json) |
|---------|-----------------------------|
| `@heroicons/react` | ^2.2.0 |
| `framer-motion` | ^12.38.0 |
| `next` | 16.2.2 |
| `react` | 19.2.4 |
| `react-dom` | 19.2.4 |
| `zustand` | ^5.0.12 |

## Dev dependencies (`devDependencies`)

Used for development and build only:

| Package | Version (from package.json) |
|---------|-----------------------------|
| `@tailwindcss/postcss` | ^4 |
| `@types/node` | ^20 |
| `@types/react` | ^19 |
| `@types/react-dom` | ^19 |
| `eslint` | ^9 |
| `eslint-config-next` | 16.2.2 |
| `tailwindcss` | ^4 |
| `typescript` | ^5 |

## Backend integration (SparkUp API)

The UI keeps the same look whether the API is up or not: `src/lib/api.ts` calls the FastAPI backend and falls back to safe defaults if the request fails.

1. Start the backend from the repo `backend` folder (see that folder’s README / `uvicorn` command). Default API base: `http://localhost:8000/api`.
2. Create `frontend/.env.local` (not committed) with:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. `next.config.ts` rewrites `/api/*` to `http://localhost:8000/api/*` so same-origin requests can be proxied during dev if you use a relative base URL instead.

Run **frontend** and **backend** together for live data (Gmail list, dashboard summary, budget sync, etc.).

## Environment (optional)

- `NEXT_PUBLIC_API_URL` — full URL to the API **including** `/api` path (e.g. `http://localhost:8000/api`). If unset, the client uses the same default.

## Project layout (short)

- `src/app/` — App Router pages (`page.tsx`, layouts)
- `src/components/` — React components (UI, layout, features)
- `src/lib/` — State (Zustand), mock data, helpers
- `src/types/` — Shared TypeScript types
