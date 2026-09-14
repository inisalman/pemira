# PEMIRA

Campus e-voting application. Single full-stack Nuxt 4 project (Vue pages in `app/`, Nitro API under `server/api/v1/`, shared types in `shared/types/`). See `docs/SDD.md` for the design.

## Runtime requirements

| Requirement | Version |
| --- | --- |
| Node.js | ^22.19.0 \|\| ^24.11.0 \|\| >=26.0.0 (local dev uses 24.19.0 via nvm) |
| PostgreSQL | 17 target for production; 16.13 for local testing |
| Package manager | npm (>= 11). Do not use yarn/pnpm; corepack is not used for this project |

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (Nitro node-server output in `.output/`) |
| `npm run start` | Run the production server build |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `nuxt typecheck` (vue-tsc) |
| `npm run test` | Vitest run |
| `npm run db:migrate` | Database migrations (stub; implemented in Task P0-04) |

## Configuration

Copy `.env.example` to `.env` and fill in values. Secrets (database URL, session secret) are provided via environment variables and mapped into the private `runtimeConfig` in `nuxt.config.ts`. `runtimeConfig.public` only carries browser-safe values.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NUXT_DATABASE_URL` | private (server-only) | PostgreSQL connection string |
| `NUXT_SESSION_SECRET` | private (server-only) | Session token signing secret |
| `NUXT_PUBLIC_APP_NAME` | public | Browser-safe app name |
| `DATABASE_URL` | tooling only | Used by `npm run db:migrate` / `db:seed` |

MVP renders in the browser (`ssr: false`); Nitro still serves `/api` in production builds.
