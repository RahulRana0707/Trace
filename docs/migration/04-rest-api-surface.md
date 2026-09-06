# 04 — Build the REST API surface

**Status: Done**

## Goal

Every route currently under `apps/web/app/api/**` gets an equivalent Nest
controller in `packages/backend`, backed by doc 02's repositories and
guarded by either session auth (dashboard calls, organization-scoped) or
API-key auth (agent calls, project-scoped) — mirroring today's
`requireAgentAuth` but as a reusable Nest guard.

## Depends on

Docs 02 (database — repositories are organization-scoped) and 03 (auth —
session guard calls better-auth's session lookup in-process).

## Scope

**In scope:** 1:1 functional ports of the routes below, adapted for the
organization-ownership model from doc 02 (every session-authenticated route
now resolves an `organizationId`, not just a `userId`). **Not** a redesign
of the API shape beyond what the ownership-model change forces — keep
response envelopes (`{status, data, errorMessage}`) and body shapes
compatible with what `apps/web`'s current fetch calls expect, so doc 05 is
close to a mechanical swap of "call local route" → "call backend route."

**Out of scope:** an organization-switcher endpoint/UI. Session-authenticated
routes act on `session.activeOrganizationId` (better-auth's own concept, set
via the Organization plugin's `setActiveOrganization` endpoint, already
wired in doc 03) — there's no per-request org-override header. If a user
needs to act on a different org, the frontend (doc 05+) calls
`authClient.organization.setActive(...)`, better-auth updates the session,
and every subsequent call here automatically follows.

## Corrected route inventory

Doc 04's original draft undercounted two things found only by re-reading the
actual route files: `projects/[projectId]/memories/route.ts` has **both**
GET and POST (dashboard-created memories, not just agent-created), and the
agent search endpoint is **POST with a JSON body**, not GET with query
params.

| Current (`apps/web/app/api/...`) | Auth today | New Nest route |
|---|---|---|
| `projects/route.ts` GET | session | `GET /projects` — list for `activeOrganizationId` |
| `projects/route.ts` POST | session | `POST /projects` — create under `activeOrganizationId` |
| `projects/[projectId]/memories/route.ts` GET | session | `GET /projects/:projectId/memories` |
| `projects/[projectId]/memories/route.ts` POST | session | `POST /projects/:projectId/memories` |
| `projects/[projectId]/api-keys/route.ts` GET | session | `GET /projects/:projectId/api-keys` |
| `projects/[projectId]/api-keys/route.ts` POST | session | `POST /projects/:projectId/api-keys` |
| `projects/[projectId]/api-keys/[keyId]/route.ts` DELETE | session | `DELETE /projects/:projectId/api-keys/:keyId` |
| `agent/ping/route.ts` GET | API key | `GET /agent/ping` |
| `agent/memories/route.ts` GET | API key | `GET /agent/memories` |
| `agent/memories/route.ts` POST | API key | `POST /agent/memories` |
| `agent/memories/[memoryId]/route.ts` GET | API key | `GET /agent/memories/:memoryId` |
| `agent/memories/search/route.ts` POST | API key | `POST /agent/memories/search` |

## Design decisions made while executing this doc

- **Validation library: zod, not class-validator.** The doc originally
  suggested `class-validator`/`class-transformer` as "the idiomatic Nest
  approach," but every existing validation schema in this codebase (Next
  routes, `trace-mcp`'s tool defs) is zod, with a specific error shape
  (`{validation: zodError.flatten()}`) that `apps/web`'s error handling may
  depend on. Reusing the exact same zod schemas verbatim, via a small custom
  `ZodValidationPipe`, gets exact parity for free instead of translating
  constraints into a different validation library's shape. Added `zod` as a
  direct dependency.
- **Response envelope via a global filter + interceptor**, not per-controller
  wrapping. `ResponseWrapperInterceptor` wraps every successful return value
  as `{status: "success", data: <value>}`; `HttpExceptionFilter` catches
  every thrown `HttpException` and renders `{status: "error", data,
  errorMessage}` — matching `apps/web/lib/api-response.ts`'s
  `jsonSuccess`/`jsonServerError` shape exactly. Controllers just return
  plain data or `throw new BadRequestException(...)` etc.; no controller
  hand-builds a response envelope.
- **`SessionAuthGuard` verifies live membership, not just a session field.**
  It reads `session.activeOrganizationId`, then confirms a `member` row still
  exists for `(activeOrganizationId, userId)` before attaching
  `req.organizationId` — a stale/tampered `activeOrganizationId` (e.g. the
  user was removed from the org after the session was issued) must not grant
  access. This is a deliberate, proportionate answer to "make sure
  organization data never crosses tenants" — one extra indexed lookup per
  request, not premature hardening.
- **No `organizationId` override header for session calls.** See "Out of
  scope" above.

## Steps

1. `SessionAuthGuard` (`packages/backend/src/auth/session-auth.guard.ts`):
   calls `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`
   in-process (no HTTP round-trip, unlike doc 03's Next-side workaround).
   401 if no session. 400 if `session.activeOrganizationId` is null (no
   active org yet — a real state for a brand-new user with zero
   organizations). 403 if the membership lookup fails. Attaches
   `req.user` and `req.organizationId`.
2. `ApiKeyAuthGuard` (`packages/backend/src/auth/api-key-auth.guard.ts`):
   ports `apps/web/lib/agent-auth.ts` — `extractBearerToken`,
   `resolveActiveApiKeyToProject` (now returns `{keyId, projectId,
   organizationId}` per doc 02), the `X-Trace-Project-Id` cross-check.
   Attaches `req.agentAuth`.
3. `ProjectsController` (`GET/POST /projects`, `GET/POST
   /projects/:projectId/memories`) and `ApiKeysController` (`POST
   /projects/:projectId/api-keys`, `DELETE .../:keyId`), both behind
   `SessionAuthGuard`, both thin wrappers over doc 02's
   `ProjectRepository`/`MemoryRepository`/`ApiKeyRepository`.
4. `AgentController` (`GET /agent/ping`, `GET/POST /agent/memories`, `GET
   /agent/memories/:memoryId`, `POST /agent/memories/search`), behind
   `ApiKeyAuthGuard`.
5. zod schemas ported verbatim (same `min`/`max` constraints) for: create
   project, create/search memory, create API key.
6. `packages/backend/src/common/response.interceptor.ts` +
   `http-exception.filter.ts`, applied via `@UseInterceptors`/`@UseFilters`
   on each of the three new controllers — **not** `app.useGlobalInterceptors`/
   `app.useGlobalFilters` in `main.ts`. A global registration would also wrap
   `AuthController`'s responses: better-auth's own handler writes the HTTP
   response directly via `@Res()` (see doc 03), so a global interceptor
   trying to transform its "return value" would attempt to write to an
   already-ended response, and would corrupt the response shape `authClient`
   expects verbatim even if it didn't crash.
7. Reuse `serializeMemoryEntry` from doc 02's `memory.repository.ts` for
   memory responses. Projects serialize without an `ownerName` field (the
   old field required a `user` join keyed on `project.userId`, which no
   longer exists — resolving "who created this" from `createdByUserId` is a
   frontend/doc-05 concern, not blocking here).

## Acceptance criteria

- Every endpoint in the table above is reachable on the backend and returns
  the same envelope shape as its `apps/web` predecessor, verified with
  `curl` against both the session-cookie flow and the API-key flow.
- A second organization's `curl` session cannot see the first organization's
  projects/memories/API keys through any of these endpoints.
- `apps/web`'s existing route handlers are **not yet deleted** — that's doc
  05.

## Suggested commit message

```
feat(backend): add organization-scoped REST API (projects, memories, api-keys, agent)
```

## Notes from execution

- **Interceptor/filter scoping bug caught before it shipped**: the original
  plan was `app.useGlobalInterceptors`/`app.useGlobalFilters` in `main.ts`.
  Realized before writing any code that this would also wrap
  `AuthController`'s responses — better-auth's handler writes the response
  directly via `@Res()` (doc 03), so a global interceptor's `map()` over its
  "return value" would try to write to an already-ended response. Applied
  `@UseInterceptors`/`@UseFilters` at the controller level on
  `ProjectsController`/`ApiKeysController`/`AgentController` instead —
  `AuthController` and the default `AppController` are untouched.
- **A real parity bug caught by the verification script, not by reasoning**:
  `POST /agent/memories/search` had no explicit `@HttpCode`, so it defaulted
  to Nest's automatic `201` for POST — but the original Next.js route
  returned `200` (`jsonSuccess` with no status override). Every other POST
  endpoint needed an explicit `@HttpCode(201)` for the opposite reason (the
  originals really did return 201). Fixed with `@HttpCode(200)`; this is
  exactly the kind of one-line mismatch that curl-verifying every endpoint
  (not just typechecking) is for.
- **Full cross-tenant isolation verified end-to-end**, not just at the
  repository-query level from doc 02: created two full organizations (each
  with their own user, project, memories, API key) and confirmed Org B's
  session sees an empty project list, gets `404` fetching Org A's project's
  memories or revoking Org A's API key by ID directly, and that Org A's key
  keeps working unaffected after Org B's failed revoke attempt.
- **Validation error shape verified against a real zod failure**: `POST
  /projects` with `{"name":""}` returned exactly
  `{"status":"error","data":{"validation":{"formErrors":[],"fieldErrors":{"name":[...]}}},"errorMessage":"Validation failed"}`
  — the same shape `apps/web`'s Next routes already produce via
  `parsed.error.flatten()`, confirming the `ZodValidationPipe` port is exact.
- `apps/web`'s existing route handlers were not touched — still calling
  `@trace/database` directly, per this doc's acceptance criteria. That's
  doc 05.
