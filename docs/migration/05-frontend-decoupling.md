# 05 — Decouple the frontend

**Status: Not started**

## Goal

`apps/web` has zero server-side database access and zero references to
`@trace/database`. All data reads/writes go through `fetch` calls to the
backend built in doc 04, credentialed for cross-origin cookies.

## Depends on

Doc 04 (backend REST surface live and verified with `curl`).

## Scope

**In scope:** deleting DB-touching code from `apps/web`, adding a small API
client wrapper, rewiring every dashboard data call. **Out of scope:**
visual/UX changes to the dashboard — this should be invisible to the user
if done right.

## Steps

1. Add a thin `apps/web/lib/api-client.ts`: wraps `fetch` with the backend's
   base URL (new env var, e.g. `NEXT_PUBLIC_BACKEND_URL` or reuse
   `BETTER_AUTH_URL`'s origin if it's the same host) and
   `credentials: "include"` baked in, so every call site doesn't have to
   remember the cross-origin cookie flag. Central place to add consistent
   error handling matching `lib/api-response.ts`'s existing shape.
2. Delete server-side DB access:
   - `app/api/agent/memories/[memoryId]/route.ts`
   - `app/api/agent/memories/route.ts`
   - `app/api/agent/memories/search/route.ts`
   - `app/api/agent/ping/route.ts` (if it touches the DB — check; doc 04's
     table lists it as ported regardless)
   - `app/api/projects/[projectId]/api-keys/[keyId]/route.ts`
   - `app/api/projects/[projectId]/api-keys/route.ts`
   - `app/api/projects/[projectId]/memories/route.ts`
   - `app/api/projects/route.ts`
   - `lib/agent-auth.ts` (logic now lives in the backend's `ApiKeyAuthGuard`)
   - `lib/serialize-memory.ts` (now lives in the backend, doc 02/04)
3. Update every dashboard component/server-component/action that currently
   calls these local routes or `lib/dashboard-fetch.ts` to instead call the
   backend via `api-client.ts`. Find call sites: `grep -rn
   "dashboard-fetch\|/api/projects\|/api/agent" apps/web/app
   apps/web/components apps/web/hooks`.
4. Update `lib/post-create-project.ts`, `lib/project-banner.ts`,
   `lib/project-search-text.ts` — check whether these do any DB-adjacent
   work or are pure client-side helpers; only the former needs rewiring.
5. Remove `@trace/database` from `apps/web/package.json` dependencies.
6. Remove `DATABASE_URL` from `apps/web/.env`/`lib/env.ts` — the frontend
   has no business knowing it anymore.
7. Middleware/dashboard-layout session checks: confirm doc 03's forwarded
   `get-session` call (or equivalent) is what's actually gating
   `/dashboard/**` routes now, not a leftover in-process better-auth check.

## Acceptance criteria

- `grep -rn "@trace/database" apps/web` returns nothing.
- `apps/web/app/api/` contains no route that reads/writes Postgres —
  ideally the whole directory is empty or removed, since auth (doc 03) also
  moved out.
- Full dashboard walkthrough works against the backend: login → create
  project → issue API key → view memories → revoke key → logout.

## Suggested commit message

```
refactor(web): remove direct DB access; call backend REST API for all data
```
