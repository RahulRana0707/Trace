# 03 — Move auth into the backend

**Status: Done**

Dev cookie strategy (the fork flagged in step 6 below): **env-gated** —
`SameSite=Lax`, no `Secure`, when `NODE_ENV !== "production"`; `SameSite=None`
+ `Secure` in production. No mkcert/local-HTTPS setup.

## Goal

better-auth runs entirely inside `packages/backend`, owning the `user`,
`session`, `account`, `verification` tables via the database module from doc
02, **plus its Organization plugin** (organization/member/invitation, per
doc 02's schema — this doc is where that plugin actually gets configured).
`apps/web` becomes a pure client of the backend's auth endpoints —
cross-origin, with cookies flowing over CORS (per the locked-in decision:
**true cross-origin, not a Next.js proxy**).

## Depends on

Doc 02 (backend owns the DB).

## Scope

**In scope:** better-auth config + mounting in Nest, CORS setup, updating
the frontend's `authClient`/env to point at the backend origin.

**Out of scope:** the `project`/`memoryEntry`/`projectApiKey` REST endpoints
— that's doc 04. This doc only needs auth working (signup, login, session
check, logout) end-to-end across the two origins.

## Steps

1. Add `better-auth` to `packages/backend`.
2. Create `packages/backend/src/auth/auth.ts` (or `auth.config.ts`): port
   `apps/web/lib/auth.ts`'s `betterAuth()` call, pointed at the backend's own
   `db` from the database module. **Drop the `nextCookies()` plugin** — that
   plugin only exists to integrate with Next's server-action cookie API,
   which is meaningless in a plain Express/Nest process. better-auth's
   default Node handler sets cookies via normal `Set-Cookie` headers, which
   is what you want here.
3. Mount better-auth's handler in Nest. better-auth exposes a
   framework-agnostic handler (`auth.handler`, a `(request: Request) =>
   Promise<Response>` using the Fetch API `Request`/`Response`). The clean
   way in Nest: a catch-all controller (e.g. `AuthController` with
   `@All('*')` under `/auth`) that adapts Express's `req`/`res` to/from
   Fetch `Request`/`Response` and calls `auth.handler`. (better-auth's own
   docs have a Node/Express adapter snippet — follow that rather than
   hand-rolling the Fetch conversion from scratch.)
4. Env/config on the backend: `GITHUB_CLIENT_ID/SECRET`,
   `GOOGLE_CLIENT_ID/SECRET`, `BETTER_AUTH_URL` (now the **backend's** own
   public URL, e.g. `http://localhost:4000`), `BETTER_AUTH_SECRET` if not
   already set. Move these out of `apps/web/.env` and into
   `packages/backend/.env` — the frontend no longer needs the OAuth
   client secrets at all.
5. CORS: enable Nest's CORS with
   `origin: process.env.CORS_ORIGIN` (from doc 01, `http://localhost:3000`)
   and `credentials: true`. This must be configured before mounting the auth
   controller so preflight `OPTIONS` requests succeed.
6. Cookie attributes: since frontend and backend are different origins,
   better-auth's session cookie needs `sameSite: "none"` and `secure: true`
   in its cookie config. **Caveat for local dev over plain `http://`:**
   `Secure` cookies are normally rejected by browsers on non-HTTPS origins.
   Two ways to handle this, pick one before writing code:
   - Run both `apps/web` and `packages/backend` dev servers over HTTPS
     locally (self-signed cert / `mkcert`), so `Secure` cookies actually work
     in dev the same way they will in prod.
   - Or accept `sameSite: "lax"` + non-`Secure` cookies in local dev only
     (env-gated), and switch to `sameSite: "none"` + `Secure` in
     prod/staging. This diverges dev from prod slightly — flag it in the
     backend's README so nobody "fixes" it into breaking prod.

   This wasn't part of the original 4 decisions and is a genuine fork — pick
   one and note the choice at the top of this doc's Status line before
   starting the auth work; don't let it get decided implicitly by whatever
   happens to work first.
7. Update `apps/web`:
   - `lib/auth.ts` (the server-side `betterAuth()` instance) gets **deleted**
     — no more in-process auth in the Next app.
   - `lib/auth-client.ts` — point `baseURL` at the backend's public URL
     (reuse `BETTER_AUTH_URL`, now meaning "where the backend's auth lives",
     set in `apps/web/.env`). Add `fetchOptions: { credentials: "include"
     }` to `createAuthClient(...)` so the cross-origin session cookie is
     sent on every request.
   - `app/api/auth/[...all]/route.ts` — **delete**. Auth no longer lives in
     the Next app at all; the browser talks to the backend's `/auth/*`
     directly via `authClient`.
   - `actions/auth.ts` — check what it does (likely wraps sign-out /
     redirect behavior mentioned in the recent "auth.api sign-out" commit);
     port any logic that isn't just calling `authClient` methods.
8. Any server-side "get current user" checks in `apps/web` (dashboard
   layout/middleware doing session validation) need to call the backend
   instead of using better-auth's server API in-process — e.g. a
   `fetch(`${BETTER_AUTH_URL}/auth/get-session`, { headers: { cookie:
   forwardedCookieHeader } })` from a Next server component/middleware,
   forwarding the incoming request's `Cookie` header. Find these call sites
   before writing code — `grep -rn "auth\.api\|getSession" apps/web`.

## Acceptance criteria

- Signup, login (email/password), GitHub OAuth, Google OAuth, and logout all
  work end-to-end with `apps/web` on `localhost:3000` and
  `packages/backend` on `localhost:4000`.
- Browser dev tools show the session cookie set with the correct
  `SameSite`/`Secure` attributes for whichever dev-cookie approach was
  chosen in step 6, and it's actually sent on subsequent cross-origin
  requests.
- `apps/web` has zero references to `better-auth`'s server-side APIs — only
  `better-auth/react` (`authClient`) remains as a dependency.

## Suggested commit message

```
feat(backend): move better-auth into the Nest backend; frontend becomes a cross-origin auth client
```

## Notes from execution

**Organization plugin wiring.** `packages/backend/src/auth/auth.ts` configures
`organization({ creatorRole: 'owner' })` alongside the base `betterAuth()`
call, with `schema` in `drizzleAdapter` extended to include `organization`,
`member`, `invitation` (doc 02's tables). Added a `databaseHooks.session.create.before`
hook (pattern borrowed from a prior project of the user's,
`contract-validator/backend`) that looks up the new session's user's oldest
`member` row and sets `activeOrganizationId` on the session automatically —
without it, every session would start with no active org and nothing in the
UI/agent API could resolve "which organization is this request for" until a
manual org-switch feature existed. Verified via curl: signing up, creating an
org (`POST /api/auth/organization/create`), signing out, and signing back in
correctly auto-populated `activeOrganizationId` on the new session.

**Mounting mechanism.** Used better-auth's own `toNodeHandler` (from
`better-auth/node`) inside a plain `@Controller('api/auth') @All('*path')`
Nest controller — no need to disable Nest's default body parser. Confirmed
by reading `better-call`'s node adapter source
(`getRequest` in `better-call/dist/adapters/node/request.mjs`): it already
falls back to Express's pre-parsed `req.body` when the raw request stream
has already been consumed by Nest's global `express.json()` middleware, so
the two don't conflict.

**A real bug this exposed, not scope creep: `NEXT_PUBLIC_` env prefix.**
`lib/auth-client.ts` runs in the browser, but originally read the unprefixed
`env.BETTER_AUTH_URL` — Next.js only inlines `NEXT_PUBLIC_*` vars into the
client bundle, so this silently resolved to `undefined` in the browser and
`createAuthClient` fell back to same-origin requests. This was invisible
before the migration only because "same origin" happened to be the correct
target (auth lived in the same Next app); once the backend became genuinely
cross-origin, every browser-side auth call 404'd against the frontend's own
origin instead of reaching the backend. Fixed by adding
`NEXT_PUBLIC_BETTER_AUTH_URL` (browser-safe) alongside the existing
server-only `BETTER_AUTH_URL`, and pointing `auth-client.ts` at the new one.
Caught by driving an actual signup through the browser, not just by curling
the backend directly — the backend-only tests all passed and gave no signal
of this bug.

**`actions/auth.ts` became client-side, not a mechanical port.** The file was
Next.js Server Actions (`"use server"`) calling `authClient.signIn.email()` /
`authClient.signUp.email()` server-side, plus a special-cased `signOut` that
called `auth.api.signOut()` in-process (fixed in commit `8cba2cb` specifically
because a server-action-mediated `authClient.signOut()` call couldn't
propagate the resulting `Set-Cookie` back to the browser — same-origin
loopback fetch, separate request context). Once auth moved to the backend,
`auth.api` no longer exists in `apps/web` at all, and the underlying problem
gets strictly worse for a genuinely cross-origin backend: a cookie set on a
server-to-server fetch's response has no path back to the browser's cookie
jar without manually parsing and relaying `Set-Cookie`, and even then the
cookie would be scoped to whichever origin's response carried it — not
reliably reattachable across two different app processes. The fix: removed
`"use server"` and rewrote all three functions (`signIn`, `signUp`, `signOut`)
to call `authClient` directly, so the **browser itself** makes the request to
the backend and its own cookie jar handles storage/clearing — the same
pattern `SocialButtons` in `auth-form-card.tsx` was already using for OAuth.
Call sites (`auth-form-card.tsx`, `nav-user.tsx`) needed zero changes since
the exported function signatures/return shapes didn't change.

**Every server-side session check needed the same treatment, including ones
outside doc 03's nominal scope.** `grep -rn "auth\.api\|getSession"` (per
step 8) turned up 9 call sites, not just the login/signup/dashboard pages:
`lib/get-user-data.ts`, `app/dashboard/layout.tsx`, `app/(auth)/login/page.tsx`,
`app/(auth)/signup/page.tsx`, `app/(marketing)/page.tsx`, all 4
`app/api/projects/**` route handlers, and — found only by grepping, not
anticipated in this doc's original text — `apps/web/proxy.ts` (Next 16's
renamed `middleware.ts`), which gates nearly every route in the app. All were
switched to a new shared `apps/web/lib/get-server-session.ts` (RSC/route
handlers) or an inlined equivalent in `proxy.ts` (Edge runtime, uses
`request.headers.get("cookie")` directly instead of `next/headers`). The
`app/api/projects/**` routes still call `@trace/database` directly for
everything else — that part is untouched, staying in scope for doc 05 — only
their session-check mechanism changed, because leaving `lib/auth.ts` in place
until doc 05 would have meant running two competing `betterAuth()` instances
against the same tables from two different processes.

**Unrelated fix required to keep the workspace green.** Adding `@types/pg` to
`packages/backend` (needed for `packages/backend/src/database/drizzle.provider.ts`'s
inferred type to be nameable) changed how pnpm resolves `@types/pg` across
the workspace, which broke `packages/database`'s own typecheck with the same
"inferred type... cannot be named" error on its `db.ts`. Fixed by adding
`@types/pg` there too. `packages/database` is still a live dependency of
`apps/web` and `packages/trace-mcp` until docs 05/06, so this couldn't be
deferred.

**Verified end-to-end in a real browser** (not just curl): signup → landed on
`/dashboard/overview` → logout → redirected away from the dashboard → login
with the same credentials → back on the dashboard. Confirmed the session
cookie is `HttpOnly` (invisible to `document.cookie`, as expected) and that
`SameSite=Lax` + non-`Secure` cookies work correctly across `localhost:3001`
↔ `localhost:4000` in dev because the `SameSite` mechanism treats different
ports on `localhost` as the same site (site = scheme + registrable domain,
not including port) — this is *specific to same-hostname/different-port dev*
and is exactly why prod needs the `SameSite=None; Secure` branch once the
frontend and backend are on genuinely different hostnames.
Did not live-test GitHub/Google OAuth — `GITHUB_CLIENT_ID`/`GOOGLE_CLIENT_ID`
etc. are empty in this environment (no real OAuth app credentials
configured), so the social sign-in code path is wired correctly but
unverified beyond "better-auth loads it without error and logs the expected
'missing clientId' warning."
