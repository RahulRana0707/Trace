# 04 — Build the REST API surface

**Status: Not started**

## Goal

Every route currently under `apps/web/app/api/**` gets an equivalent Nest
controller in `packages/backend`, backed by the database module from doc 02
and guarded by either session auth (dashboard calls) or API-key auth (agent
calls) — mirroring today's `requireAgentAuth` but as a reusable Nest guard.

## Depends on

Docs 02 (database) and 03 (auth — session guard needs a working
`get-session` call against the backend's own better-auth instance).

## Scope

**In scope:** 1:1 functional ports of the existing routes below. **Not** a
redesign of the API shape — keep request/response bodies compatible with
what `apps/web`'s current fetch calls expect, so doc 05 is a mechanical
swap of "call local route" → "call backend route," not a rewrite of both
sides at once.

## Route inventory to port

| Current (`apps/web/app/api/...`) | Auth today | New Nest controller (suggested) |
|---|---|---|
| `projects/route.ts` (list/create) | session | `ProjectsController` — `GET /projects`, `POST /projects` |
| `projects/[projectId]/api-keys/route.ts` | session | `ApiKeysController` — `POST /projects/:projectId/api-keys` |
| `projects/[projectId]/api-keys/[keyId]/route.ts` | session | `ApiKeysController` — `DELETE /projects/:projectId/api-keys/:keyId` |
| `projects/[projectId]/memories/route.ts` | session | `ProjectsController` (or `MemoriesController`) — `GET /projects/:projectId/memories` |
| `agent/ping/route.ts` | API key | `AgentController` — `GET /agent/ping` |
| `agent/memories/route.ts` | API key | `AgentController` — `GET/POST /agent/memories` |
| `agent/memories/[memoryId]/route.ts` | API key | `AgentController` — `GET /agent/memories/:memoryId` |
| `agent/memories/search/route.ts` | API key | `AgentController` — `GET /agent/memories/search` |

## Steps

1. **Session guard**: `SessionAuthGuard` — reads the forwarded `Cookie`
   header, calls better-auth's session lookup (in-process now, since auth
   lives in this same backend — no HTTP round-trip needed unlike doc 03's
   Next-side workaround), attaches `req.user`/`req.session`, 401s otherwise.
2. **API-key guard**: `ApiKeyAuthGuard` — port `apps/web/lib/agent-auth.ts`'s
   logic (`extractBearerToken`, `resolveActiveApiKeyToProject`, the
   `X-Trace-Project-Id` cross-check) as a Nest guard that attaches
   `req.agentAuth = { projectId, keyId }`.
3. Build controllers per the table above, each a thin layer over the doc-02
   repositories — no business logic lives in controllers beyond
   validation/auth.
4. Request validation: use `class-validator`/`class-transformer` DTOs (the
   idiomatic Nest approach) for bodies currently validated ad hoc in the
   Next route handlers — port the same constraints (e.g. `intent` required,
   `filesTouched` array of strings, length caps from
   `trace-mcp/src/register-tools.ts`'s zod schemas, which double as the spec
   for valid input shapes even though that package is being removed in doc
   06).
5. Response shape: reuse `serializeMemoryEntry`/similar serializers ported
   in doc 02 so JSON shapes returned to the frontend don't change.
6. Global `ValidationPipe`, a consistent error-response shape (port whatever
   `apps/web/lib/api-response.ts`'s `jsonServerError` convention is, so doc
   05's frontend error handling doesn't need to change).
7. CORS (from doc 03) already covers these routes since it's applied
   globally in `main.ts`.

## Acceptance criteria

- Every endpoint in the table above is reachable on the backend and returns
  the same shape as its `apps/web` predecessor, verified with `curl`
  against both the session-cookie flow and the API-key flow.
- `apps/web`'s existing route handlers are **not yet deleted** — that's doc
  05, once the frontend has been switched to call the new endpoints and
  parity is confirmed.

## Suggested commit message

```
feat(backend): port projects/api-keys/memories/agent REST endpoints from Next.js API routes
```
