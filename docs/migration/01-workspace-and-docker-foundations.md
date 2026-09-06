# 01 — Workspace + Docker foundations

**Status: Done**

Notes from execution:
- Renamed `packages/backend`'s package name to `@trace/backend` for
  consistency with the rest of the workspace (`@trace/database`,
  `@trace/trace-mcp`, `@trace/ui`) — not explicitly called out in the
  original plan but a natural fit while wiring it in. Use
  `--filter=@trace/backend` for turbo commands going forward.
- Added `dotenv` as a direct dependency and `import 'dotenv/config'` at the
  top of `main.ts` (matching `trace-mcp`'s existing pattern) so `PORT` from
  `.env` is picked up without pulling in `@nestjs/config` yet — that's left
  for doc 02/03 when there's more config surface to justify it.
- Fixed a pre-existing `no-floating-promises` lint warning on `bootstrap()`
  in the default Nest scaffold (`void bootstrap()`), matching trace-mcp's
  `void main()` convention, while touching that file anyway.

## Goal

Get `packages/backend` properly tracked by the monorepo and runnable
end-to-end (build/dev/lint/typecheck via turbo), and get a Dockerized
Postgres running for it — before any real code moves in. This is pure
plumbing; no business logic yet.

## Depends on

Nothing — this is the first step.

## Scope

**In scope:**
- De-git the nested repo so `packages/backend` is a normal tracked directory.
- Wire `packages/backend` into turbo (`build`/`lint`/`format`/`typecheck`/`dev`
  tasks already apply via the `packages/*` glob in `pnpm-workspace.yaml`, but
  the Nest scripts need to match what turbo expects, and `turbo.json`'s env
  passthrough list needs the backend's new env vars).
- `docker-compose.yml` in `packages/backend` with a `postgres` service only.
- `packages/backend/.env` (+ `.env.example`) with a fresh `DATABASE_URL`
  pointing at the Dockerized instance, plus a port for the Nest app itself.

**Out of scope:** moving Drizzle schema, auth, or any routes — that's docs
02–04. Don't add `drizzle-orm`/`pg`/`better-auth` dependencies yet.

## Steps

1. Remove the nested git repo so it doesn't become a gitlink once it has
   commits: `rm -rf packages/backend/.git`. Confirm with `git status` that
   `packages/backend/` now shows as a normal untracked directory tree, not a
   single gitlink entry.
2. Pick ports (avoid clashing with Next.js's default 3000 and the existing
   local Postgres's 5432):
   - Nest backend HTTP: `4000` (suggested)
   - Dockerized Postgres: `55432` on the host, mapped to `5432` in the
     container (host port avoids colliding with your existing native
     Postgres, which stays on `5432`; container-internal traffic is
     unaffected)
3. Add `packages/backend/docker-compose.yml`:
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       restart: unless-stopped
       environment:
         POSTGRES_USER: trace
         POSTGRES_PASSWORD: trace
         POSTGRES_DB: trace
       ports:
         - "55432:5432"
       volumes:
         - trace_backend_pgdata:/var/lib/postgresql/data
   volumes:
     trace_backend_pgdata:
   ```
4. Add `packages/backend/.env.example` (commit this one) and
   `packages/backend/.env` (gitignored, real values):
   ```
   PORT=4000
   DATABASE_URL=postgres://trace:trace@localhost:55432/trace
   CORS_ORIGIN=http://localhost:3000
   ```
5. Confirm `packages/backend/.gitignore` covers `.env`, `node_modules`,
   `dist` (default Nest `.gitignore` already does — just verify).
6. Align Nest's `package.json` scripts with turbo's expectations
   (`build`, `dev` → map to `start:dev` or add a `dev` alias, `lint`,
   `format`, `typecheck` → add `"typecheck": "tsc --noEmit -p tsconfig.json"`
   since Nest's default scripts don't include one).
7. Add `packages/backend`'s env vars to `turbo.json`'s `build.env` list
   (`DATABASE_URL` already there; add `PORT`, `CORS_ORIGIN` if you want turbo
   cache to key on them — optional, low stakes for a `dev`-only var).
8. `docker compose -f packages/backend/docker-compose.yml up -d` and confirm
   `psql postgres://trace:trace@localhost:55432/trace -c '\dt'` connects
   (empty table list is expected — no schema yet).
9. `pnpm turbo dev --filter=backend` (or whatever the workspace package name
   resolves to — check `name` in `packages/backend/package.json`, currently
   `"backend"`) boots the default Nest app on port 4000.

## Acceptance criteria

- `git status` shows `packages/backend` as normal tracked/untracked files,
  no gitlink.
- `docker compose up -d` in `packages/backend` starts Postgres and it's
  reachable on `localhost:55432`.
- `pnpm turbo build` and `pnpm turbo dev` both succeed with `backend`
  included, without touching `apps/web` or `packages/database` behavior.

## Suggested commit message

```
chore(backend): untrack nested repo, wire into turbo, add Postgres via Docker Compose
```
