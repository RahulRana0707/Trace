# 07 — Cleanup + verification

**Status: Not started**

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

- [ ] `docker compose -f packages/backend/docker-compose.yml up -d` starts
      clean on a machine with no prior state.
- [ ] `pnpm turbo dev` starts `apps/web` (3000) and `packages/backend` (4000)
      with no errors.
- [ ] Sign up a new user (email/password) — session cookie set correctly
      cross-origin.
- [ ] Log out, log back in.
- [ ] GitHub OAuth login round-trips correctly.
- [ ] Google OAuth login round-trips correctly.
- [ ] Create a project from the dashboard.
- [ ] Issue an API key for that project; confirm the plaintext is shown once
      and never retrievable again.
- [ ] Using that API key, `curl` the backend's `agent/ping`,
      `agent/memories` (POST to store, GET to list), `agent/memories/search`,
      `agent/memories/:id` — confirm all work without any cookie, Bearer
      token only.
- [ ] Revoke the API key from the dashboard; confirm the same `curl` calls
      now 401.
- [ ] Dashboard's memory view shows memories created via the API-key path
      (proves both auth paths hit the same data).
- [ ] `packages/trace-mcp` directory does not exist; no MCP references
      remain in the dashboard.
- [ ] `packages/database` directory does not exist; `pnpm install` and
      `pnpm turbo build` succeed from a clean clone.

## Suggested commit message

```
chore: remove @trace/database package, finish backend consolidation cleanup
```

## Rollback note

Every doc in this folder maps to roughly one commit. If something in docs
02–06 turns out wrong after doc 07's verification fails, revert the specific
commit(s) for the doc that regressed rather than the whole migration — the
docs were ordered so each one is independently revertible as long as nothing
later already deleted what it depended on (e.g. don't revert doc 02 after
doc 07 has already deleted `packages/database`; restore doc 02's Nest module
instead).
