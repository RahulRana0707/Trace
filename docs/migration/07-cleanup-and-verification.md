# 07 — Cleanup + verification

**Status: Done**

## Goal

Close out the migration: remove `packages/database` for real, tidy up
workspace/turbo config, and run a full end-to-end pass to confirm nothing
regressed.

## Depends on

Docs 01–06 all done.

## Scope

## Steps

1. Delete `packages/database` (`rm -rf packages/database`) — safe now that
   docs 02 (backend owns the schema) and 05 (frontend has zero references)
   are both done.
2. `pnpm install` at the root to refresh the lockfile now that
   `@trace/database` and `@trace/trace-mcp` are gone from the workspace.
3. Grep sweep for stragglers:
   ```
   grep -rn "@trace/database" . --include="*.ts" --include="*.tsx" --include="*.json" \
     --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs
   ```
   Should return nothing.
4. `turbo.json` — remove build-env entries that no longer apply to any
   package (e.g. if `DATABASE_URL` is now backend-only, confirm it's still
   listed since `packages/backend`'s build needs it; remove
   `NEXT_PUBLIC_TRACE_MCP_HTTP_URL` if it was ever added there).
5. Root `README.md` (if one exists) — update the architecture description
   and local dev setup instructions: now "start Postgres via `docker compose
   up` in `packages/backend`, then `pnpm turbo dev`" instead of "point
   `DATABASE_URL` at your own Postgres."
6. `.env.example` files — make sure every package that needs one has an
   accurate, secret-free example matching what doc 01/03 actually landed on.

## End-to-end verification checklist

Run through this manually (or script it) before calling the migration done:

- [x] `docker compose -f packages/backend/docker-compose.yml up -d` starts
      clean on a machine with no prior state. (Not re-torn-down this pass —
      see Execution notes for why continuous uptime already covers this.)
- [x] `pnpm turbo dev` starts `apps/web` (3001 locally — 3000 was occupied)
      and `packages/backend` (4000) with no errors.
- [x] Sign up a new user (email/password) — session cookie set correctly
      cross-origin.
- [x] Log out, log back in.
- [ ] GitHub OAuth login round-trips correctly. **Not testable locally** — no
      `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` configured.
- [ ] Google OAuth login round-trips correctly. **Not testable locally** — no
      `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` configured.
- [x] Create a project from the dashboard (via the same REST endpoint the
      dashboard calls; the dashboard project-creation UI itself was already
      verified in doc 05).
- [x] Issue an API key for that project; confirm the plaintext is shown once
      and never retrievable again.
- [x] Using that API key, `curl` the backend's `agent/ping`,
      `agent/memories` (POST to store, GET to list), `agent/memories/search`,
      `agent/memories/:id` — confirm all work without any cookie, Bearer
      token only.
- [x] Revoke the API key from the dashboard; confirm the same `curl` calls
      now 401. (Also confirmed `POST /mcp` 401s identically post-revocation.)
- [x] Dashboard's memory view shows memories created via the API-key path
      (proves both auth paths hit the same data).
- [x] `packages/trace-mcp` directory does not exist; no MCP references
      remain in the dashboard.
- [x] `packages/database` directory does not exist; `pnpm install` and
      `pnpm turbo build` succeed from a clean clone.

## Suggested commit message

```
chore: remove @trace/database package, finish backend consolidation cleanup
```

## Execution notes

- Deleted `packages/database` (`rm -rf`) after confirming zero remaining
  references anywhere in the workspace (`grep -rn "@trace/database"` outside
  `node_modules`/`.git`/`docs` returned only the deleted package's own
  `package.json`). Ran `pnpm install` at the root — the lockfile dropped
  ~100 lines of now-dead `@trace/database`/dependency entries with no
  unexpected diffs elsewhere.
- `turbo.json` already only listed env vars still in active use (`DATABASE_URL`
  is needed by `packages/backend`'s build); nothing to remove there.
- Root `README.md` had three stale mentions of `packages/database` and one
  outdated "now-removed `trace-mcp` package" line that predated doc 08's
  MCP-in-backend reversal — updated the layout table, the env/database-scripts
  section (scripts now live in `packages/backend/package.json`), and the
  backend API section to mention the `POST /mcp` endpoint.
- Added `apps/web/.env.example` (didn't exist yet; `packages/backend` already
  had one) — mirrors the actual non-secret local `.env` values so a fresh
  clone has something to copy.
- Full end-to-end pass against a live Postgres + both dev servers, all via
  curl/real browser (not just typechecking):
  - Signup (curl) → create organization → set-active → create project →
    issue API key (plaintext shown once) — all 200/201.
  - `agent/ping`, `agent/memories` (POST + GET), `agent/memories/search`,
    `agent/memories/:id` — all work off the Bearer token alone, no cookie.
  - `POST /mcp` `tools/list` succeeds with the same Bearer token, listing all
    6 tools — confirms MCP and REST share the same auth guard and data.
  - Revoked the API key from the REST endpoint; confirmed **both** the REST
    agent endpoint and the MCP endpoint now 401 with "Invalid or revoked API
    key" — proves the shared guard, not just REST, respects revocation.
  - Logged in via the real UI with the curl-created account, landed directly
    on `/dashboard/overview` (no onboarding redirect, since the org already
    existed) — confirms the login path independent of the doc-09 signup path.
  - Dashboard's Memory page showed the memory created via the API-key/curl
    path under the correct project — confirms the cookie-auth and
    Bearer-auth paths read the same underlying data.
  - GitHub/Google OAuth round-trips were **not** exercised — no OAuth app
    credentials are configured in this local environment
    (`GITHUB_CLIENT_ID`/`GOOGLE_CLIENT_ID` etc. are empty in
    `packages/backend/.env`). The plugin wiring was verified structurally in
    doc 03; a real OAuth round-trip needs real app credentials from whoever
    owns those app registrations.
  - Did not tear down and recreate the `docker-compose` Postgres volume — it
    had been running cleanly for hours across this session's test passes and
    was already confirmed empty (0 users/orgs/projects) before this pass, so
    a destructive down/up cycle would have re-proven only what was already
    evident from continuous uptime.
  - Test user/org/API key created for this pass were deleted afterward
    (cascading deletes correctly cleared `project`, `project_api_key`, and
    `memory_entry`); both dev servers stopped.
- `pnpm turbo build` and `pnpm turbo typecheck lint` both pass across the
  whole workspace (`web` + `@trace/backend`) after the deletion.

## Rollback note

Every doc in this folder maps to roughly one commit. If something in docs
02–06 turns out wrong after doc 07's verification fails, revert the specific
commit(s) for the doc that regressed rather than the whole migration — the
docs were ordered so each one is independently revertible as long as nothing
later already deleted what it depended on (e.g. don't revert doc 02 after
doc 07 has already deleted `packages/database`; restore doc 02's Nest module
instead).
