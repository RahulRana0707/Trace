# trace

**Your AI agents finally have memory.**

trace is the memory layer for AI coding agents: it stores *why* decisions were made—not just *what* changed in git—so agents can retrieve real context instead of guessing.

---

## Contents

- [Problem](#problem)
- [What trace does](#what-trace-does)
- [Branding](#branding)
- [MVP roadmap](#mvp-roadmap)
- [Pricing (directional)](#pricing-directional)
- [Vision](#vision)
- [MVP success metric](#mvp-success-metric)
- [Monorepo development](#monorepo-development)

---

## Problem

AI coding agents (Cursor, Windsurf, Claude, and others) lose context constantly—not only between sessions, but the *reasoning*: tradeoffs, intent, and architecture choices from weeks or months ago.

- **Git** records *what* changed.
- **Agents** often behave like a new hire with no onboarding: they contradict earlier decisions and repeat mistakes.

trace captures that **reasoning layer** so agents can pull relevant past context when it matters.

---

## What trace does

### For the agent (via MCP)

- Receives structured reasoning after significant changes.
- Stores intent, alternatives considered, architecture impact, goals, and related metadata.
- Returns relevant past reasoning via RAG when the agent queries it.
- Works with MCP-compatible agents.

### For the developer (via dashboard)

- Searchable, filterable timeline of project decisions.
- Visibility into what the agent was “thinking” at a point in time.
- Architecture snapshots (e.g. folder structure tied to history).
- Query / usage signals (how often context is retrieved and whether it helps).

---

## Branding

| | |
| --- | --- |
| **Name** | trace — evokes memory, reasoning, and decision-making (the “why” trail). |
| **Tagline** | Your AI agents finally have memory. |
| **Voice** | Sharp, technical, no fluff. Built by developers for developers. |
| **Visual (product UI)** | **Dark mode first.** Cool **slate / near-black** surfaces (`--background` in dark theme), **teal–emerald primary** (`--primary`, chart greens)—aligned with the **Trace logo** accent (emerald `#10B981`). **Not** “electric indigo cyberpunk”; keep contrast calm and readable. Monospace-friendly, minimal chrome. |
| **Logo direction** | Geometric “brain node”: circuit meets cognition—not clinical/medical. |

### Marketing / hero imagery

- **Role of the photo:** Atmospheric backdrop only. It should **not fight** the teal primary buttons and emerald logo; scenes that are **only warm tungsten / orange** read off-brand next to the UI.
- **Current asset:** [`packages/ui/src/public/landing-bg.png`](packages/ui/src/public/landing-bg.png) — moody editorial still life. **Usable** if the page adds a **cool + subtle teal wash** over the image (done on `/landing`) so the scene harmonizes with tokens. For a tighter match long-term, **regenerate** with the prompt below (4K, cool-neutral shadows, **hint of teal** in light or bokeh only—still not sci-fi).

#### AI image prompt (4K hero, on-brand for trace)

Use **3840×2160** (or **3840×1600**) PNG/WebP export from a high-bitrate master.

**Main prompt:**

> 4K UHD, 3840×2160, ultra-sharp, photoreal, natural color grading, **no upscale artifacts**.  
> **Not futuristic, not sci-fi:** no holograms, neon grids, circuit boards, wireframe cities, robots, “AI brain,” lens-flare overload, CGI toy look.  
>  
> **Quiet editorial hero background** for a developer product named **trace** — *long-term memory and reasoning for AI coding agents* (intent, tradeoffs, architecture—not flashy tech).  
> **Mood:** dark **slate and charcoal** shadows, **cool-neutral** overall; **one soft light** (moonlight or cool desk lamp, **not** dominant orange tungsten). Optional **very subtle teal or cyan** only in **rim light, edge bloom, or out-of-focus bokeh**—must stay **restrained** so **emerald/teal UI buttons** (hex ~#0d9488–#10b981 family) feel at home; **do not** flood the frame with green.  
> **Subject:** extremely shallow depth of field — **matte paper, linen, or closed notebook** suggested, **no readable text**, no logos, no people, no hands. **Asymmetrical composition** with **clear negative space in the center third** for centered headline typography. Soft vignette at edges. Fine film grain, high micro-contrast.

**Negative prompt:**

> warm orange cast only, tungsten-only interior, futuristic, sci-fi, cyberpunk, purple laser, holographic UI, stock photo people, cluttered desk in sharp focus, watermark, text, logo, cartoon, low resolution, JPEG blocking

---

## MVP roadmap

### Phase 1 — Core (months 1–2)

- MCP server agents can connect to.
- Structured schema after each change (e.g. intent, `files_touched`, `git_commit_ref`, alternatives, architecture impact).
- Storage: Postgres (+ pgvector for RAG when needed).
- Basic RAG: agent queries → relevant past reasoning.
- User auth + project creation in the dashboard.
- Cursor rules / system prompt template for agent config.

### Phase 2 — Dashboard (month 3)

- Decision timeline UI (scrollable project history).
- Search across stored reasoning.
- Architecture snapshot viewer (e.g. folder state at a past git ref).
- Basic analytics: entries stored, queries, retrieval frequency.

### Phase 3 — Polish + growth (month 4)

- Slack / email digest (“what your agent decided this week”).
- Optional public / shared project memory.
- Onboarding improvements.
- Waitlist → freemium launch.

---

## Pricing (directional)

| Tier | Price | Highlights |
| --- | --- | --- |
| **Free — Hobbyist** | $0 | 1 project · 500 memory entries/month · 7-day history · community support — enough to feel value, not to run a serious long-term project alone. |
| **Pro — Builder** | $19/mo | 5 projects · 10k entries/month · full history · RAG analytics · priority support — solo devs / indie hackers shipping often. |
| **Studio — Team** | $59/mo | Unlimited projects · 50k entries/month · team dashboard (post-MVP) · API · dedicated support — small teams; ship after Phase 2 is solid. |

---

## Vision

Opening a project after weeks away shouldn’t mean the agent undoes decisions you spent days on. Agents are strong at execution but weak at **institutional memory** for *your* repo.

trace exists so agents can decide from **recorded reasoning**, not guesses: capture the “why,” store it, retrieve it when queries fire—**Git remembers what; trace remembers why.**

---

## MVP success metric

**Did the agent retrieve past context and make a better decision because of it?**

Other metrics (signups, pageviews, raw entry counts) are secondary until that loop is provably working. Prefer a tight feedback path (e.g. in MCP responses) so agents or users can signal when retrieved context helped.

---

## Monorepo development

### Prerequisites

- **Node.js** ≥ 20  
- **pnpm** 9 (`packageManager` is pinned in `package.json`)

### Install

```bash
pnpm install
```

### Common scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start dev tasks via Turborepo (e.g. Next.js app). |
| `pnpm build` | Production build (sets `dependsOn` and env expectations per `turbo.json`). |
| `pnpm lint` | ESLint across the workspace. |
| `pnpm format` | Prettier write for supported files. |
| `pnpm typecheck` | TypeScript `tsc --noEmit` where configured. |

### Layout

| Path | Role |
| --- | --- |
| `apps/web` | Next.js dashboard and API routes. |
| `packages/database` | Drizzle schema, queries, migrations. |
| `packages/ui` | Shared UI components and styles. |
| `packages/eslint-config` / `packages/typescript-config` | Shared tooling configs. |

### Environment

Build-related env vars are declared in `turbo.json` (e.g. `DATABASE_URL`, `BETTER_AUTH_URL`, OAuth client IDs/secrets). Configure `.env` locally for `apps/web` and database tooling as needed.

Database scripts (`db:generate`, `db:migrate`, `db:push`, `db:studio`) live in `packages/database/package.json`.
