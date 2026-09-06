# 06 — Remove trace-mcp

**Status: Done**

## Goal

`packages/trace-mcp` is deleted. Agents integrate exclusively through the
backend's `agent/*` REST endpoints from doc 04 (Bearer API key). No MCP
protocol support remains anywhere in the codebase.

## Depends on

Doc 04 (agent REST endpoints must already cover everything trace-mcp's
tools did: ping, store, search, get, list).

## Scope

**In scope:** deleting the package, and updating every place in the
dashboard/docs that currently tells users to configure an MCP client.

## Steps

1. Confirm feature parity before deleting anything — trace-mcp's tools vs.
   doc 04's endpoints:
   - `trace_ping` → `GET /agent/ping`
   - `trace_store_memory` → `POST /agent/memories`
   - `trace_search_memory` → `GET /agent/memories/search`
   - `trace_get_memory` → `GET /agent/memories/:memoryId`
   - `trace_list_memories` / `trace_list_recent` → `GET /agent/memories`
     (with `limit`/`cursor`)
2. `rm -rf packages/trace-mcp`.
3. Remove it from any workspace references — it shouldn't have any inbound
   ones (nothing else imports `@trace/trace-mcp`), but grep to confirm:
   `grep -rn "trace-mcp\|trace_mcp" --include="*.json" --include="*.ts"
   --include="*.tsx" .` outside of this `docs/migration` folder.
4. Dashboard "Connect" section — this is the part users actually see, don't
   skip it:
   - `apps/web/app/dashboard/connect/mcp/page.tsx` — this entire page was
     MCP setup instructions. Delete the page and its nav entry, or repurpose
     it into a generic "Connect via REST API" page (recommended: fold it
     into whatever `connect/api-keys` already shows, since both are really
     "here's your key, here's how to call the API").
   - `apps/web/app/dashboard/connect/cursor/page.tsx` — check its content;
     if it's Cursor-specific MCP config (likely, given the name), same
     treatment as above — replace MCP JSON snippets with REST usage examples
     (`curl`/fetch snippet using the API key) or delete if there's no
     non-MCP Cursor story worth keeping.
   - `apps/web/lib/connect/mcp-snippet.ts` — delete
     (`getConfiguredTraceMcpHostedEndpoint`, `buildHostedMcpServerJsonFragment`,
     etc. — all MCP-JSON-snippet generation, no longer needed).
   - `apps/web/lib/connect/rule-templates.ts` — check whether "rules" (the
     `connect/rules` page) reference MCP setup or are a separate concept
     (e.g. AI assistant "rules files" like `.cursorrules`); only touch if it
     actually mentions MCP.
5. Remove `NEXT_PUBLIC_TRACE_MCP_HTTP_URL` from `apps/web/.env` and any
   `lib/env.ts` reference.
6. Update root-level docs/READMEs that mention trace-mcp or MCP setup
   instructions for end users.

## Acceptance criteria

- `packages/trace-mcp` no longer exists.
- No dashboard page references MCP, `mcp.json`, or an MCP endpoint.
- `grep -rn "mcp" apps/web packages --include="*.ts" --include="*.tsx" -i`
  (excluding `docs/migration` and `node_modules`) turns up nothing
  MCP-protocol-related — unrelated hits (e.g. a variable that happens to
  contain "mcp" as a substring) are fine to leave.

## Suggested commit message

```
chore: remove trace-mcp and MCP-based agent integration in favor of REST-only
```

## Notes from execution

- **The Rules page needed a real content rewrite, not just word-swaps.**
  `lib/connect/rule-templates.ts`'s Cursor markdown told the agent to
  connect via MCP and call specific tool names (`trace_store_memory`,
  `trace_search_memory`, etc.). Rewrote the "MCP setup"/"MCP tools" sections
  into "REST API setup"/"Endpoints (exact paths)", replacing each tool name
  with its doc-04 REST equivalent (`POST /agent/memories`, `POST
  /agent/memories/search`, `GET /agent/memories/:memoryId`, `GET
  /agent/memories`) and telling the agent to call them directly (e.g. via
  `curl`) instead of through MCP tool-calling.
- **Deleted, not just unlinked**: `app/dashboard/connect/mcp/` (page +
  breadcrumb + sidebar entry), `components/connect/mcp-setup-snippets.tsx`,
  `lib/connect/mcp-snippet.ts`, and every place that consumed them
  (`hooks/use-api-keys-page.ts`'s `hostedMcp*` return values,
  `components/connect/api-keys-page-client.tsx`'s "Copy hosted MCP JSON"
  button and the success sheet's MCP JSON block). Verified in a real
  browser: the API-key success panel now shows only Secret + Project ID,
  and the key-list row's Actions column shows only Revoke.
- **Marketing/dashboard copy swept for stray mentions** beyond the Connect
  pages themselves: the login/signup card descriptions, the dashboard
  Overview page description, and a project-tags input placeholder all said
  "MCP" somewhere. Updated to describe API-based agent connection instead.
- **Root `README.md` had a full "Hosted MCP" section** (env vars, run
  instructions) describing the now-deleted package, plus a stale line
  claiming `apps/web/app/api/agent/*` "remains available" — false since doc
  05 deleted that path too. Fixed the MCP-specific content now (in scope for
  this doc); a fuller README pass reflecting the entire migration (backend
  layout, organization model) is left for doc 07, so it isn't updated
  piecemeal at every step.
- **Found, not acted on**: `packages/database` now has zero consumers
  anywhere in the workspace (`grep -rln "@trace/database" .` outside the
  package itself returns nothing) — both `apps/web` (doc 05) and
  `packages/trace-mcp` (this doc) were its last two consumers. It's not
  deleted here since that's explicitly doc 07's job, but doc 07 can delete
  it immediately without further checks.
- **Full grep sweep clean**: no `trace-mcp`/`trace_mcp` outside
  `docs/migration` (which correctly keeps historical references), and the
  only remaining case-insensitive `mcp` hits are two harmless comments
  inside `packages/database` (dead package, doc 07) — fixed the one live
  comment in `packages/backend`'s `api-key-auth.guard.ts`.
- **Verified in a real browser**: signed up a fresh user, bootstrapped an
  org via SQL (same known gap as doc 05), confirmed the sidebar's Connect
  submenu shows only API keys/Rules, the Rules page renders the new REST
  content, and creating an API key shows no MCP artifacts anywhere in the
  UI.
