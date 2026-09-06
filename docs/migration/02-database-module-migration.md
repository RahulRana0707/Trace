# 02 — Move the database into the backend

**Status: Not started**

## Goal

`packages/database` stops existing as a separate workspace package. Its
Drizzle schema, queries, migrations, and API-key crypto helpers move
directly into `packages/backend`, as the only place that touches Postgres.

## Depends on

Doc 01 (Dockerized Postgres reachable at the backend's `DATABASE_URL`).

## Scope

**In scope:** moving schema/queries/migrations/crypto helpers, wiring
Drizzle into Nest as an injectable module, running migrations against the
fresh Docker Postgres.

**Out of scope:** auth (doc 03), HTTP controllers/routes (doc 04). At the
end of this doc, the backend can read/write the DB but exposes no auth and
no REST endpoints yet beyond the default Nest hello-world.

## Steps

1. Add deps to `packages/backend`: `drizzle-orm`, `pg`, `drizzle-kit` (dev),
   `dotenv` if not already pulled in by Nest's config module — prefer
   `@nestjs/config` for env loading instead of raw `dotenv`, since it's the
   idiomatic Nest way and doc 03/04 will want `ConfigService` anyway.
2. Create `packages/backend/src/database/`:
   - `schema/` — port `packages/database/src/db/schema.ts` over verbatim
     (table defs + relations for `user`, `session`, `account`,
     `verification`, `project`, `memoryEntry`, `projectApiKey`). No shape
     changes — this is a move, not a redesign.
   - `database.module.ts` — a Nest `@Global()` (or explicitly imported)
     module that provides a `DRIZZLE` token via `useFactory`, built from
     `ConfigService.get('DATABASE_URL')`.
   - `drizzle.provider.ts` — the `drizzle(pool, { schema })` construction,
     ported from `packages/database/src/db.ts`.
3. Port query helpers as injectable Nest services (one service per current
   query file, or one `DatabaseService`/repository per entity — pick
   whichever keeps doc 04's controllers thin):
   - `packages/database/src/queries/projects-memory.ts` →
     e.g. `src/database/memory.repository.ts` / `project.repository.ts`
   - `packages/database/src/queries/project-api-keys.ts` →
     `src/database/api-key.repository.ts`
   - `packages/database/src/queries/serialize-memory.ts` → keep as a plain
     function, doesn't need to be a Nest provider.
   - `packages/database/src/crypto-api-key.ts` → move as-is (plain crypto
     helpers, e.g. `src/database/crypto-api-key.ts`), no Nest-specific
     changes needed.
4. Move migrations: `packages/database/drizzle/*.sql` and
   `packages/database/drizzle/meta/` → `packages/backend/drizzle/`. Move
   `packages/database/drizzle.config.ts` → `packages/backend/drizzle.config.ts`,
   updating its schema path and reading `DATABASE_URL` from the backend's
   `.env`.

   Note: at the time of this plan, `packages/database/drizzle/meta/` has an
   uncommitted `_journal.json` change and an untracked `0005_snapshot.json`
   with no corresponding `0005_*.sql` — a pending `drizzle-kit generate` diff
   that was never turned into a migration. Resolve that (run
   `drizzle-kit generate` cleanly, or discard the stray snapshot) *before*
   copying migrations over, so the backend starts from a consistent
   migration history, not a half-generated one.
5. Add scripts to `packages/backend/package.json`:
   `db:generate` / `db:migrate` / `db:push` / `db:studio` → `drizzle-kit
   <cmd>` (same pattern `packages/database` used).
6. Run `pnpm --filter backend db:migrate` against the Docker Postgres from
   doc 01. Confirm all 7 tables exist (`psql ... -c '\dt'`).
7. Delete `packages/database` entirely (`rm -rf packages/database`) **only
   after** doc 05 has removed the last `apps/web` reference to
   `@trace/database` — until then, leave it in place but stop adding to it.
   (Tracking note for doc 07's cleanup, not something to do mid-doc-02.)

## Acceptance criteria

- `packages/backend` can run a query against every table via a quick Nest
  test/script (e.g. a temporary `AppService` method that does
  `db.select().from(project)` and logs the count) with zero dependency on
  `@trace/database`.
- Migrations applied cleanly to the fresh Docker Postgres from doc 01 with
  no manual SQL patching.
- `packages/database`'s code is untouched/still present (not yet deleted —
  `apps/web` and `packages/trace-mcp` still depend on it until docs 05/06).

## Suggested commit message

```
feat(backend): add Drizzle database module (schema, queries, migrations) ported from @trace/database
```
