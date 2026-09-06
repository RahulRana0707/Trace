# 03 — Move auth into the backend

**Status: Not started**

## Goal

better-auth runs entirely inside `packages/backend`, owning the `user`,
`session`, `account`, `verification` tables via the database module from doc
02. `apps/web` becomes a pure client of the backend's auth endpoints —
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
