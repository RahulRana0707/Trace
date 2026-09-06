# 06 — Remove trace-mcp

**Status: Not started**

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
