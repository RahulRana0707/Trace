TRACE
Your AI agents finally have memory.

The One-Line Pitch
trace gives your AI coding agents long-term memory — storing not what changed, but why.

The Problem We're Solving
Every AI coding agent — Cursor, Windsurf, Claude, any of them — suffers from the same fundamental flaw: they forget. Not just between sessions. They forget the reasoning. The psychology. The tradeoffs you considered three months ago when you restructured your auth system. The architectural decision you made at 2am that saved the project.
Git remembers what changed. Nobody remembers why.
When your agent picks up a project weeks later, it's essentially a new hire with no onboarding. It guesses. It makes decisions that contradict earlier ones. It repeats mistakes. It breaks things that were intentionally built a certain way.
trace fixes this. It sits between your agent and your project — silently capturing the reasoning layer behind every significant change. So when your agent needs context from months ago, it can actually get it.

What trace Does
For the Agent (via MCP)

Receives structured reasoning after every significant change
Stores intent, alternatives considered, architecture impact, user goal
Returns relevant past reasoning via RAG when agent queries it
Works with any MCP-compatible agent out of the box

For the Developer (via Dashboard)

Full timeline of project decisions — searchable, filterable
See what your agent was "thinking" at any point in the project
Architecture snapshots — what did the folder structure look like in January?
Query history — how often is your agent pulling old context, and is it helping?


Branding
ElementDirectionNametraceTaglineYour AI agents finally have memoryPersonalitySharp, technical, no fluff. Built by developers for developers.Visual directionDark mode first. Deep navy + electric indigo accent. Monospace typography. Minimal.Logo conceptA stylized brain node — but geometric, not medical. Think circuit meets cognition.
The name trace is intentional — it's the part of the brain responsible for memory, reasoning, and decision making. Exactly what you're giving agents.

MVP Scope (What You Build First)
Phase 1 — Core (Months 1–2)

MCP server that agents can connect to
Structured schema agents send after each change (intent, files_touched, git_commit_ref, alternatives_considered, architecture_impact)
Storage layer (Postgres + pgvector for RAG)
Basic RAG retrieval — agent queries, trace returns relevant past reasoning
User auth + project creation dashboard
Cursor rules template — copy-paste system prompt users drop into their agent config

Phase 2 — Dashboard (Month 3)

Decision timeline UI — scrollable project history
Search across all stored reasoning
Architecture snapshot viewer — folder state at any past date (pulled from git ref)
Basic analytics — entries stored, queries made, retrieval frequency

Phase 3 — Polish + Growth (Month 4)

Slack/email digest — weekly "what your agent decided this week"
Public project memory (optional) — share your decision history with collaborators
Onboarding flow improvements
Waitlist → open freemium launch


Pricing
Free — Hobbyist

1 project
500 memory entries/month
7-day history access
Community support

$0 forever — enough to feel the value, not enough to run a real project long-term

Pro — Builder — $19/month

5 projects
10,000 memory entries/month
Full history access
RAG query analytics
Priority support

Target: solo developers and indie hackers actively shipping products

Studio — Team — $59/month

Unlimited projects
50,000 memory entries/month
Team dashboard (coming post-MVP)
API access
Dedicated support

Target: small teams — hold this tier back until Phase 2 is solid

The "Why We're Building This" Narrative
(This is your landing page hero copy, your Twitter bio, your Product Hunt launch story)

We've all been there. You open a project you haven't touched in two months. Your AI agent starts making changes — and immediately starts undoing decisions you spent days thinking through. It's not the agent's fault. It has no memory. It doesn't know what you were trying to build, what you already tried, or what you explicitly decided not to do.
We're building trace because AI agents are getting incredibly good at executing — but they have no institutional memory. No context. No wisdom about your specific project. Every session is day one.
trace is the memory layer that agents have always needed. It captures the reasoning behind every decision, stores it, and makes it instantly retrievable — so your agent can make smarter decisions based on real context, not wild guesses.
Git remembers what. trace remembers why.


The One Metric That Matters for MVP
Did the agent retrieve past context and make a better decision because of it?
Everything else — entries stored, users signed up, dashboard pageviews — is noise until you can show this is actually working. Build a feedback loop into the MCP response so agents can confirm when retrieved context was useful.