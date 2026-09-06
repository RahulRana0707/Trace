# 00 — Current state (reference only, no changes)

**Status: Reference — nothing to execute here.**

Snapshot of the architecture as it existed right before this migration
started, so later docs can say "move X out of here" without re-deriving it.

## Packages

- `apps/web` — Next.js 16 app. Dashboard UI, marketing pages, and **also**
  the API layer: `app/api/**/route.ts` handlers call `@trace/database`
  directly, and `actions/auth.ts` / `lib/auth.ts` run better-auth in-process
  via `better-auth`'s Next.js integration (`nextCookies()` plugin).
- `packages/database` — Drizzle ORM + `pg`, schema (`user`, `session`,
  `account`, `verification`, `project`, `memoryEntry`, `projectApiKey`),
  query helpers, API-key hashing (`crypto-api-key.ts`). Consumed directly by
  both `apps/web` and `packages/trace-mcp`. Has its own `.env` with
  `DATABASE_URL` pointing at a native local Postgres (`localhost:5432`, not
  Dockerized).
- `packages/trace-mcp` — standalone Express server exposing an MCP endpoint
  (`POST /mcp`, Streamable HTTP) authenticated by `Authorization: Bearer
  trace_sk_...`, resolved to a project via `resolveActiveApiKeyToProject`
  from `@trace/database`. Registers tools: `trace_ping`,
  `trace_store_memory`, `trace_search_memory`, `trace_get_memory`,
  `trace_list_memories` / `trace_list_recent`.
- `packages/backend` — **new, just scaffolded.** Fresh `nest new` output
  (`@nestjs/common` v11, one `AppController`/`AppService`), no business logic
  yet. Has its own nested `.git` (zero commits) from `nest new`'s
  auto-`git init` — not yet tracked by the monorepo.
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` —
  shared tooling/components, out of scope for this migration.

## Auth (better-auth) today

`apps/web/lib/auth.ts` configures `betterAuth()` with the Drizzle adapter
pointed at `@trace/database`'s `db`, email/password + GitHub/Google OAuth,
and the `nextCookies()` plugin (sets cookies via Next's `cookies()` API —
only works because auth runs inside the Next.js process). Exposed via the
Next.js catch-all route `app/api/auth/[...all]/route.ts`. The browser client
(`apps/web/lib/auth-client.ts`) already takes a configurable `baseURL`
(`env.BETTER_AUTH_URL`), which is what makes the cross-origin move in doc 03
possible without a client rewrite.

## REST-ish surface today (all inside `apps/web`, all touch `@trace/database` directly)

- `app/api/projects/route.ts` — list/create projects (session auth)
- `app/api/projects/[projectId]/api-keys/route.ts` +
  `.../[keyId]/route.ts` — create/revoke API keys (session auth)
- `app/api/projects/[projectId]/memories/route.ts` — project memories
  (session auth, dashboard view)
- `app/api/agent/ping/route.ts`,
  `app/api/agent/memories/route.ts`,
  `app/api/agent/memories/[memoryId]/route.ts`,
  `app/api/agent/memories/search/route.ts` — agent-facing, authenticated via
  `lib/agent-auth.ts` (`requireAgentAuth`, Bearer API key →
  `resolveActiveApiKeyToProject`)

## Database schema (unchanged by this migration — see prior conversation turn for the full ER diagram)

`user`, `session`, `account`, `verification` (better-auth tables) +
`project`, `memoryEntry`, `projectApiKey` (app tables). This migration moves
*where* the schema and queries live, not the schema shape itself. If the
shape needs to change, do that as a separate, deliberate change — not
smuggled into this restructure.

## Env files that exist today

- `apps/web/.env` — `DATABASE_URL`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID/SECRET`,
  `GOOGLE_CLIENT_ID/SECRET`, `NEXT_PUBLIC_TRACE_MCP_HTTP_URL`
- `packages/database/.env` — `DATABASE_URL`
- `packages/trace-mcp/.env` — `DATABASE_URL`, `PORT`

All three currently point at the same native local Postgres.
