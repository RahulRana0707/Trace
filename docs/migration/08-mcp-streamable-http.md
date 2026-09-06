# 08 — Bring MCP back as a thin Streamable HTTP endpoint

**Status: Done**

## Goal

`packages/backend` exposes `POST /mcp`, a Streamable HTTP MCP server
(`@modelcontextprotocol/sdk`), authenticated the same way as `/agent/*`
(`Authorization: Bearer trace_sk_...`, doc 04's `ApiKeyAuthGuard`), whose
tool handlers call the **exact same repositories** the REST `AgentController`
uses. Agents that speak MCP natively (Cursor's "Add MCP Server", Claude
Desktop, etc.) can connect directly; REST stays for everything else. No
separate package, no direct database access outside the repositories.

## Why this doc exists — read this before touching code

Doc 06 removed MCP entirely, saying "no MCP adapter, thin or otherwise."
Revisiting that after doc 06 shipped surfaced a factual correction: the
*original* `trace-mcp` (deleted in doc 06, recoverable at git commit
`8c89e98~1`) already used **Streamable HTTP transport**
(`StreamableHTTPServerTransport`, `POST /mcp`, Bearer-token auth) — not
stdio. So "switch to the right transport" was never the actual problem.

The real objection, on reflection, was narrower: `packages/trace-mcp` was a
**separate package that queried Postgres directly** via `@trace/database`,
duplicating logic that now lives in `packages/backend`'s repositories. That
objection is fully addressed by putting MCP *inside* the backend as a thin
transport — which is exactly the "thin proxy" alternative doc 03's original
planning offered and this project didn't take at the time. This doc takes
it now, scoped correctly: not a proxy calling the backend's own REST API
over HTTP (which would be a pointless round-trip within the same process),
but a second transport in the same Nest app sharing the same injected
repositories as the REST controllers.

## Depends on

Doc 04 (repositories + `ApiKeyAuthGuard` already exist and are reusable
as-is). Independent of doc 07 — can land before or after it.

## Scope

**In scope:** the `/mcp` endpoint, its 5 tools (ported from the deleted
`trace-mcp`, calling doc-04 repositories instead of `@trace/database`), and
end-to-end verification with a real MCP client (not just curl).

**Out of scope (explicitly deferred, not forgotten):** restoring the
dashboard's "Connect → MCP" page, sidebar entry, and hosted-MCP-JSON
snippet generator that doc 06 removed. The user's request that produced
this doc was scoped to the backend endpoint ("add a /mcp route back into
packages/backend"). Once this doc is verified, restoring discoverable
dashboard UI for it is the natural next step — flag it back to the user
rather than doing it silently.

## Tool → repository mapping

Ported from `trace-mcp/src/register-tools.ts` (see git history), adapted
from `@trace/database`'s free functions to doc-04's injected
`MemoryRepository`, and updated to pass `organizationId` everywhere per
doc 02's schema (the original predates organizations entirely):

| Tool | Repository call | Notes |
|---|---|---|
| `trace_ping` | — | Returns `{ ok: true, projectId }` from MCP context, no DB call |
| `trace_store_memory` | `MemoryRepository.insertMemoryEntry` | Same zod input shape as `POST /agent/memories`'s body |
| `trace_search_memory` | `MemoryRepository.searchMemoryEntriesForProject` | Same snippet-shaping as `POST /agent/memories/search` |
| `trace_get_memory` | `MemoryRepository.getMemoryEntryForProject` | Same as `GET /agent/memories/:memoryId` |
| `trace_list_recent` / `trace_list_memories` | `MemoryRepository.listMemoryEntriesForProject` | Two tool names, identical behavior — matches the original (kept for naming-convention compatibility with existing agent rules/configs that may reference either name) |

## Design decisions

- **Context propagation via `AsyncLocalStorage`**, same pattern as the
  original — MCP SDK's tool handlers run detached from the Express
  `req`/`res` objects (they execute inside the SDK's own JSON-RPC dispatch),
  so there's no other way to get `{projectId, organizationId, keyId}` into a
  tool handler. `packages/backend/src/mcp/mcp-context.ts` mirrors the old
  `mcp-db-context.ts`, extended with `organizationId`.
- **Auth reuses `ApiKeyAuthGuard` as-is** (doc 04) — same Bearer resolution,
  same `X-Trace-Project-Id` cross-check, now also carrying `organizationId`
  (already returned by `resolveActiveApiKeyToProject`, doc 02). No new auth
  code.
- **Auth-failure response shape uses Nest's default exception body**, not
  the original's hand-rolled JSON-RPC-shaped `{jsonrpc, error, id: null}`
  envelope. `McpController` doesn't get `@UseFilters(HttpExceptionFilter)`
  (that filter's envelope is for the REST controllers; wrapping MCP's own
  transport responses in it would be as wrong as it would be for
  `AuthController` — see doc 04's reasoning) — so a 401/403 from the guard
  falls through to Nest's plain `{statusCode, message, error}` body instead.
  This is a deliberate simplification: transport-level auth failures happen
  before any JSON-RPC message is accepted, and MCP clients generally key off
  the HTTP status code here, not a parsed error envelope. Noted here so it
  doesn't read as an oversight.
- **No new dependency on `@trace/database`.** The whole point is that MCP
  tool handlers call injected `MemoryRepository` methods — the same
  instances Nest's DI already wires into `AgentController`.
- **No new env vars.** MCP now lives on the backend's existing `PORT`, not
  a separate process with its own `PORT`/`.env` like the old `trace-mcp`.

## Steps

1. Add `@modelcontextprotocol/sdk` to `packages/backend`.
2. `packages/backend/src/mcp/mcp-context.ts` — `AsyncLocalStorage<{
   projectId, organizationId, keyId }>` + `requireMcpContext()`.
3. `packages/backend/src/mcp/mcp-tools.service.ts` — injectable service
   with a `createServer(): McpServer` method registering the 5 tools from
   the mapping table above, injecting `MemoryRepository` via the
   constructor.
4. `packages/backend/src/mcp/mcp.controller.ts` — `@Controller('mcp')`,
   `@UseGuards(ApiKeyAuthGuard)`:
   - `@Post()`: `mcpContext.run({ projectId, organizationId, keyId }, async
     () => { const server = this.mcpTools.createServer(); const transport =
     new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
     await server.connect(transport); await transport.handleRequest(req,
     res, req.body); })` — matches the original's per-request
     server+transport lifecycle exactly.
   - `@Get()`/`@Delete()`: explicit 405 handlers (some MCP clients probe
     these for SSE/session-termination semantics; a real 405 is more
     correct than Nest's default 404).
5. `packages/backend/src/mcp/mcp.module.ts` — wires the controller +
   service, imports `AuthModule` for `ApiKeyAuthGuard`. Add to `AppModule`.
6. Verify with a **real MCP client** (`@modelcontextprotocol/sdk`'s
   `Client` + `StreamableHTTPClientTransport`), not hand-crafted curl
   JSON-RPC: connect, list tools, call each of the 5 tools, confirm
   responses match the equivalent REST calls' data. Also verify
   organization isolation the same way doc 04 did for REST — a second
   org's API key must not be able to reach the first org's memories through
   any tool.

## Acceptance criteria

- `POST /mcp` performs a full MCP handshake (initialize → tools/list →
  tools/call) with a real MCP client library, not just raw HTTP calls.
- All 5 tools return data identical in shape to their REST equivalents
  (`serializeMemoryEntry` output, or the same snippet shape for search).
- An invalid/missing Bearer token gets a 401 before any MCP protocol
  exchange happens.
- Cross-organization isolation holds for MCP the same way it does for REST
  (verified in doc 04).
- `pnpm turbo build typecheck lint --filter=@trace/backend` all pass.

## Suggested commit message

```
feat(backend): bring MCP back as a thin Streamable HTTP endpoint sharing REST's repositories
```

## Notes from execution

- **Ported cleanly on the first try** — typecheck/build/lint all passed
  without a single fix needed, because the design reused three things
  already proven correct: `ApiKeyAuthGuard` (doc 04, unmodified), the
  `MemoryRepository` methods (doc 02/04, unmodified), and the
  per-request-server-and-transport lifecycle from the original `trace-mcp`
  (unchanged — create a fresh `McpServer` + `StreamableHTTPServerTransport`
  per request, matching the SDK's expected usage for stateless HTTP).
- **Verified with a real MCP client**, not hand-crafted JSON-RPC over curl:
  a throwaway script using `@modelcontextprotocol/sdk`'s `Client` +
  `StreamableHTTPClientTransport` did a full handshake (initialize →
  tools/list → tools/call) against two real organizations created via the
  actual REST signup/org/project/key flow. Caught one bug — in the test
  script, not the product: it JSON-parsed a tool's error-text response
  before checking `isError`, which crashed on Org B's correctly-rejected
  `trace_get_memory` call. Once fixed, all checks passed: all 6 tools
  present, each returns data shaped identically to its REST equivalent, and
  Org B's key can neither list nor fetch-by-id Org A's memory through any
  tool — cross-tenant isolation holds for MCP exactly as it does for REST
  (doc 04).
- **Confirmed the auth-failure response shape is nonstandard but
  functional**: an invalid key gets Nest's default `{statusCode, message,
  error}` body with a 401 (not the original's JSON-RPC-shaped envelope) —
  the MCP client library treated this as a connection failure correctly,
  which is what actually matters. See "Design decisions" above for why
  this wasn't matched exactly.
- **Reminder for whoever picks up the deferred dashboard-UI piece**: the
  MCP endpoint now lives at `{BACKEND_URL}/mcp` (e.g.
  `http://localhost:4000/mcp` in dev) — not a separate host/port like the
  old `trace-mcp` (which defaulted to `:8080`). Any restored "Connect →
  MCP" snippet needs to point at the backend's own URL, and the old
  `NEXT_PUBLIC_TRACE_MCP_HTTP_URL` env var convention doesn't need
  reviving — `NEXT_PUBLIC_BACKEND_URL` (doc 05) already covers it.
