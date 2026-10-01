# SVBL Planungstool – Backend

NestJS backend using TypeORM and PostgreSQL.

## Getting started

```bash
cp .env.example .env   # adjust if needed
pnpm install
pnpm db:up             # starts Postgres 17 in Docker on localhost:5434
pnpm migration:run
pnpm start:dev         # http://localhost:3001
```

`GET /health` checks that the database is reachable.

## Database

| Command | What it does |
| --- | --- |
| `pnpm db:up` / `pnpm db:down` | Start / stop the local Postgres container (data lives in the `svbl-postgres-data` volume) |
| `pnpm migration:generate src/database/migrations/<Name>` | Diff entities against the DB and write a migration |
| `pnpm migration:create src/database/migrations/<Name>` | Create an empty migration |
| `pnpm migration:run` / `pnpm migration:revert` | Apply / roll back migrations |
| `pnpm seed` | Wipe all domain tables and load the prototype's demo data (development only) |

`synchronize` is off, so schema changes always go through migrations. Entities are picked up automatically from any `*.entity.ts` file under `src/`. Connection settings are shared between the app and the TypeORM CLI in `src/database/database.options.ts`.

The schema is described in `docs/superpowers/specs/2026-10-01-data-model-design.md` (47 tables, one Nest module per cluster: `users`, `locations`, `devices`, `instructors`, `courses`, `curriculum`, `apprentices`, `customers`, `planning`, `system`). Table and column names are snake_case through `SnakeNamingStrategy`; shared enums live in `src/database/enums.ts`.

After `migration:generate`, check the file for duplicate `CREATE TYPE` / `DROP TYPE` statements: TypeORM emits one per table that uses a shared enum (`enumName`), and the second one fails at run time. Keep the first `CREATE TYPE` and the last `DROP TYPE` per enum. `pnpm test:e2e` contains a round-trip test that fails when entities and migrations drift apart.

## Auth

Authentication uses [Clerk](https://clerk.com). The web app sends the Clerk session token as `Authorization: Bearer <token>`, and the global `ClerkAuthGuard` (`src/auth/`) verifies it on **every** route.

- Mark routes that must stay open with `@Public()` (e.g. `/health`).
- Read the signed-in user's Clerk id with `@CurrentUser() userId: string`.
- `GET /me` returns `{ userId }`, which is handy for checking the setup.
- `CLERK_AUTHORIZED_PARTIES` lists the frontend origins allowed to call the API.

## Deploying to Heroku

The backend lives in `backend/` of the monorepo and deploys as its own Heroku app.

- `Procfile`: the **release** phase runs the pending migrations (`migration:run:prod`, against the compiled `dist/`), then the **web** dyno runs `node dist/main`.
- Heroku runs `pnpm build` during the build and uses Node 22 and pnpm 10, as pinned by `engines` and `packageManager` in `package.json`.
- The database is Neon Postgres. Set its connection string as `DATABASE_URL`; it overrides the `DB_*` variables. Use `sslmode=verify-full` in the URL (plain `require` works too, but the `pg` driver prints a warning). Without an `sslmode` in the URL, SSL is still on by default whenever `DATABASE_URL` is set (`DB_SSL=false` turns it off).
- Heroku sets `PORT` itself.

One-time setup (the app name is an example):

```bash
heroku create svbl-planungstool-api
# Build only the backend/ folder of the monorepo:
heroku buildpacks:add -i 1 https://github.com/lstoll/heroku-buildpack-monorepo -a svbl-planungstool-api
heroku buildpacks:add heroku/nodejs -a svbl-planungstool-api
heroku config:set -a svbl-planungstool-api \
  APP_BASE=backend \
  DATABASE_URL='postgresql://<user>:<password>@<host>/neondb?sslmode=verify-full&channel_binding=require' \
  CLERK_SECRET_KEY=sk_live_xxx \
  CLERK_AUTHORIZED_PARTIES=https://<web-app-domain> \
  CORS_ORIGIN=https://<web-app-domain>
```

Then either connect the GitHub repo in the Heroku dashboard (Deploy → GitHub) or push directly:

```bash
heroku git:remote -a svbl-planungstool-api -r heroku
git push heroku main
```

Check the deploy with `curl https://<app>.herokuapp.com/health`.

## Tests

```bash
pnpm test       # unit
pnpm test:e2e   # needs the database running
```
