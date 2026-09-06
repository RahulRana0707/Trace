# 09 — Organization onboarding journey

**Status: Done**

## Goal

Every new signup goes through a short, mostly-optional wizard that creates
their organization (closing the doc-05 "known gap" — new users currently
land on a dashboard with no org and no way to create one) and captures a
few product-shaping answers along the way, before landing in the dashboard.

## Depends on

Doc 04 (backend REST + guards), doc 03 (better-auth + Organization plugin).
Independent of doc 07/08.

## Where this came from

Designed collaboratively as a clickable prototype first (published as an
Artifact, not committed to the repo) before any code was written. Locked-in
decisions from that process:

- **One continuous wizard upfront**, not deferred to a dismissible dashboard
  prompt — momentum from signup carries users through 3-4 quick steps.
- **Real bundled SVG logos**, not hotlinked or generic icons.
- **No box/card chrome.** Content floats centered directly on the page — no
  bordered panel, no shadow, no background fill around the step content.
- **Only 3 explicit tool options** (Cursor, Claude Code, Codex) **+ "Other"
  with a free-text input** — not a large preset grid. Reviewed and cut down
  from an earlier 9-tile draft.
- **Real brand logos in their actual brand color**, not monochrome/tinted
  to match our UI's neutral palette. Verified official hex values (Simple
  Icons dataset): Cursor `#000000`, Claude/Anthropic `#D97757`, OpenAI
  (used for Codex, which has no distinct public mark of its own)
  `#000000`. Cursor and OpenAI's marks are monochrome brand marks — render
  black in light mode, white in dark mode (standard practice for
  single-color marks, not a color change). Claude's orange stays the same
  in both themes; it has enough contrast on both.
- **Wider centered column** than the first prototype pass (~27rem felt
  narrow) — target ~32–34rem.

These two visual refinements were flagged during review but **deliberately
not re-applied to the prototype artifact** (per explicit instruction) —
they're captured here as requirements for the real build instead. Both are
implemented in the real build (see Execution notes).

## Scope

**In scope:** the wizard UI in `apps/web`, wiring it to better-auth's
Organization plugin (already fully functional server-side since doc 03/08),
redirect logic so it actually gets shown to the right users at the right
time, and real bundled logo assets.

**Out of scope:** auto-creating a first project at the end of onboarding.
The dashboard's Projects page already has a clean, tested "no projects yet
→ Create project" empty state (verified in doc 05) — onboarding should end
by landing there, not by duplicating project-creation UI or inventing a
default project name. Also out of scope: an org-switcher UI for users who
belong to multiple organizations — that's a separate feature with its own
design questions, not part of first-run onboarding.

## Key technical findings (verified against better-auth's installed source, not assumed)

- `POST /api/auth/organization/create` accepts `metadata` as a **plain JS
  object** (`z.record(z.string(), z.any()).optional()`), not a
  pre-stringified JSON string — better-auth handles serialization to/from
  the `text` column itself. So the wizard's profiling answers (role, tools,
  custom tool text, goal) can go straight into `metadata` on the same call
  that creates the organization — no new backend endpoint needed.
- `POST /api/auth/organization/set-active` takes `{ organizationId }`,
  checks membership, and calls `setSessionCookie` — the session's
  `activeOrganizationId` (and its cookie) update in one round trip. Must be
  called explicitly after `create`; creating an org does **not**
  auto-activate it.
- `apps/web/lib/auth-client.ts` does not yet have the `organizationClient()`
  plugin registered (deliberately deferred in doc 03/05) — needs adding for
  `authClient.organization.create/setActive` to exist at all.

## Design decisions for this doc

- **Onboarding answers live in `organization.metadata`**, not a new table.
  It's an existing jsonb-backed field (doc 02), it's queryable, and it
  requires zero migration. If this data ever needs its own lifecycle
  independent of organization settings (e.g. per-user rather than
  per-organization profiling), split it out then — not speculatively now.
- **Redirect logic lives in one place: `proxy.ts`**, not scattered across
  every sign-up/sign-in entry point. There are at least four ways a session
  can end up authenticated (email signup, email login, GitHub OAuth, Google
  OAuth), and OAuth's `callbackURL` can't easily distinguish "first time,
  no org yet" from "returning user" at the point the redirect target is
  chosen. Checking `session.activeOrganizationId` centrally in `proxy.ts`
  (which already gates every dashboard route) handles all four paths
  identically and can't drift out of sync as new entry points get added:
  - Session exists, no `activeOrganizationId`, path isn't `/onboarding` →
    redirect to `/onboarding`.
  - Session exists, `activeOrganizationId` already set, path is
    `/onboarding` → redirect to `/dashboard/overview` (returning users
    don't see onboarding again).
  - No session → existing behavior (redirect to `/login`), unchanged.

## Steps

1. Add `organizationClient()` to `apps/web/lib/auth-client.ts`.
2. Source and bundle real logo SVGs (Cursor, Claude, OpenAI) into
   `packages/ui` as local files — fetched from Simple Icons (the standard
   open source for verified current brand marks), not hand-drawn.
3. Build `apps/web/app/onboarding/page.tsx` + a client component
   implementing the wizard: name (required) → role (optional) → tools
   (optional, Cursor/Claude/Codex/Other-with-text) → goal (optional) →
   completion, matching the approved prototype's layout (centered,
   borderless, wider column) and copy.
   - Server-side guard at the top of the page: no session → redirect
     `/login`; session with `activeOrganizationId` already set → redirect
     `/dashboard/overview`.
   - On finish: `authClient.organization.create({ name, slug, metadata:
     {...} })` → `authClient.organization.setActive({ organizationId })` →
     `router.replace('/dashboard/overview')`.
4. Update `apps/web/proxy.ts` per the redirect logic above.
5. Verify end-to-end in a real browser: fresh signup lands on `/onboarding`
   (not a dashboard 400), completing it lands on the dashboard with a real
   organization and project-creation available, skipping every optional
   step still creates the organization correctly, and revisiting
   `/onboarding` after completion redirects away instead of showing it
   again.

## Acceptance criteria

- A brand-new signup (email or OAuth) is redirected to `/onboarding`
  automatically — no manual API call or SQL needed, closing doc 05's known
  gap for real.
- Completing onboarding (with all steps filled, and separately with all
  optional steps skipped) results in a working organization, an active
  session pointed at it, and a normal dashboard landing.
- The "Other" tool option's typed text is captured in
  `organization.metadata`, not discarded.
- Visiting `/onboarding` with an already-active organization redirects to
  the dashboard instead of re-showing the wizard.
- `pnpm turbo build typecheck lint --filter=web` passes.

## Suggested commit message

```
feat(web): add organization onboarding wizard for new signups
```

## Execution notes

- **Wider column**: built at `max-w-xl` (36rem), centered, no card/border/
  shadow — matches the approved prototype direction.
- **Real brand logos**: `CursorIcon`/`ClaudeIcon`/`CodexIcon` added to
  `apps/web/components/icons.tsx`. Cursor and Codex (OpenAI mark) use
  `currentColor` so they render black in light mode / white in dark mode,
  the standard treatment for their monochrome brand marks. Claude renders
  fixed at its brand hex `#D97757` in both themes. Verified visually in a
  real browser — all three render correctly on the tools step.
- **`authClient` typing (TS2742)**: adding `organizationClient()` to
  `createAuthClient(...)` makes the inferred client type unnameable by
  TypeScript (`path-to-object.mjs`, an unexported better-auth internal) —
  `next build`'s typecheck fails regardless of whether the export is
  annotated or left to infer. This is unrelated to the `@types/pg`
  duplicate-package issue hit earlier in the migration (only one copy of
  `@better-auth/core` exists here). Fixed by hand-writing a minimal
  `AppAuthClient` interface in `lib/auth-client.ts` covering only the
  actual call sites in this app, and casting:
  `createAuthClient({...}) as unknown as AppAuthClient`. Widen that
  interface, not the cast, if a new call site is added.
- **Two logic bugs caught in self-review before user testing**:
  1. The completion screen's copy is past-tense ("we've created your
     workspace"), but the org-create/set-active calls were originally
     wired to fire on the completion screen's own button click — meaning
     the copy would lie for the whole time the screen was visible before
     the click. Fixed by moving the `organization.create` →
     `organization.setActive` calls to the transition *into* the
     completion screen (i.e. leaving the last question step), so the org
     genuinely exists before the completion copy is ever shown. The
     completion screen's button is pure navigation.
  2. The "Setting up…" loading label checked `step === TOTAL_STEPS`, but
     `submitting` is true while still on the *previous* step during the
     async call (per fix 1's timing) — so the label would never actually
     show. Fixed by checking `submitting` first in the label ternary,
     independent of `step`.
- **End-to-end browser verification** (two full runs, both against a live
  Postgres + backend, cleaned up after):
  - Full-answers run: signup → auto-redirect to `/onboarding` → name
    "Acme Robotics" (slug auto-generated `acme-robotics`) → role "Solo
    developer" → tools Cursor + Claude Code + Other ("Windsurf" free
    text) → goal "My agent forgets past decisions" → completion screen
    (shown only after the org actually existed) → "Enter workspace" →
    landed on `/dashboard/overview`. Confirmed in Postgres:
    `organization.metadata = {"role":"solo","tools":["cursor","claude","Windsurf"],"goal":"forgets"}`.
  - All-optional-skipped run: signup → name "Skip Test Org" (name has no
    skip option, by design, since it's required) → "Skip this step" on
    role, tools, and goal → completion screen ("Skip Test Org is ready",
    no summary pills since nothing was collected) → "Enter workspace" →
    landed on `/dashboard/overview`. Confirmed in Postgres:
    `organization.metadata = {"role":null,"tools":[],"goal":null}`.
  - Revisiting `/onboarding` after either run's completion redirected
    straight to `/dashboard/overview` (proxy.ts + page.tsx guard both
    verified working).
  - Test users/orgs/sessions deleted afterward (cascading deletes cleaned
    up `member`/`session`/`account` automatically); dev servers stopped.
- `pnpm turbo build typecheck lint --filter=web` passed before this
  verification pass.
- Not done in this doc (tracked separately, not forgotten): restoring a
  dashboard "Connect → MCP" page now that MCP is back (deferred in doc
  08), and doc 07's cleanup of `packages/database`.
