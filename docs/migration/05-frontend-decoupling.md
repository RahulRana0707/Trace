# 05 — Decouple the frontend

**Status: Done**

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

## Notes from execution

- **`api-client.ts` had to be two files, not one.** The plan called for a
  single "thin API client wrapper," but a server-only helper (using
  `next/headers` to forward the incoming request's cookie) and a
  client-only helper (browser `credentials: "include"`) can't safely live
  in the same module — `hooks/use-api-keys-page.ts` (a `"use client"` hook)
  importing anything from that file pulls `next/headers` into the browser
  bundle, and webpack fails the build outright ("You're importing a
  component that needs next/headers"). Split into `lib/api-result.ts`
  (shared `ApiResult<T>` type + envelope parsing, no server/client-only
  imports), `lib/server-api-fetch.ts` (`serverApiFetch`, RSCs/route
  handlers), and `lib/client-api-fetch.ts` (`clientApiFetch`, browser).
- **New env vars, kept separate from the doc-03 auth ones on purpose**:
  `BACKEND_URL`/`NEXT_PUBLIC_BACKEND_URL` for this REST client, alongside
  the existing `BETTER_AUTH_URL`/`NEXT_PUBLIC_BETTER_AUTH_URL` for
  `authClient`/`get-server-session.ts`/`proxy.ts`. Same value today (one
  Nest app serves both), but named for what each caller actually needs —
  and it meant zero risk to the already-verified doc-03 auth code.
- **`ownerName` couldn't be preserved — it's not a UX choice, it's a data
  model fact.** The old `serializeProject` joined `user` on
  `project.userId` for a display name; that join is gone because projects
  are organization-owned now (doc 02). Removed the "Owner · {name}" line
  from the project card and the "Owner" column from the project table
  (`components/projects/projects-page-client.tsx`), and dropped `ownerName`
  from `lib/project-search-text.ts` and the `PostCreateProjectResponse`
  type. Showing raw `createdByUserId` instead would have been worse UX than
  removing the field.
- **A real gap the migration surfaced, not something this doc caused or
  fixes**: a brand-new signup now lands on a dashboard with **no active
  organization and no UI anywhere to create one** — `SessionAuthGuard`
  (doc 04) correctly 400s with "No active organization," but there is no
  "create your first organization" flow in `apps/web`, because that UI
  never existed before doc 02 introduced organizations at all. Verified
  the rest of this doc's walkthrough by bootstrapping a test user's
  organization directly via SQL (`auth.organization` + `auth.member` +
  setting `auth.session.active_organization_id`), then driving project
  creation, API key issuance, agent-created memory visibility, key
  revocation, and logout through the real UI from that point. **This gap
  needs its own follow-up** (an organization-creation/switching UI) before
  the app is usable end-to-end by a real new user — it isn't covered by
  any doc in this migration folder and should be scoped separately.
- **Full walkthrough verified in a real browser** against both dev servers:
  signup → (SQL-bootstrapped org) → create project → issue API key → agent
  API call using that key creates a memory → memory visible on the
  dashboard's Memory page (proving the RSC path and the agent-API path
  read/write the same organization-scoped data) → key revoked via the same
  `DELETE` endpoint the UI's "Revoke" button calls (verified via curl, not
  by clicking through the UI's native `confirm()` dialog, which browser
  automation should never trigger) → confirmed the revoked key is rejected
  → logout, redirected away from the dashboard. No console errors during
  the walkthrough.
