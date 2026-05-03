export type RuleToolId =
  | "cursor"
  | "windsurf"
  | "vscode"
  | "claude_code"
  | "antigravity"

export type RuleToolMeta = {
  id: RuleToolId
  label: string
  comingSoon: boolean
}

export const RULE_TOOLS: RuleToolMeta[] = [
  { id: "cursor", label: "Cursor", comingSoon: false },
  { id: "windsurf", label: "Windsurf", comingSoon: true },
  { id: "vscode", label: "VS Code (Copilot)", comingSoon: true },
  { id: "claude_code", label: "Claude Code", comingSoon: true },
  { id: "antigravity", label: "Antigravity", comingSoon: true },
]

const COMING_SOON_COPY = `## Coming soon

Rules and install snippets for this editor are not available yet. Use **Cursor** for now, or copy the Cursor markdown as a starting point for your own system prompt.

---

`

export const RULE_MARKDOWN_BY_TOOL: Record<RuleToolId, string> = {
  cursor: `## trace — agent rules (Cursor)

You are working in a repo that uses **trace** for long-term **decision memory** (intent, tradeoffs, architecture—not just diffs). When the trace **MCP server** is connected and configured with \`TRACE_API_KEY\` and \`TRACE_PROJECT_ID\`, use it as follows.

### When to write memory

After **meaningful** changes—not every tiny edit—call the trace tool that **stores structured reasoning** (exact tool name will match the MCP server, e.g. a \`store\` / \`remember\` / \`log_decision\`-style tool). Include:

- **Intent** — what you were trying to achieve.
- **Alternatives considered** — options you rejected and why (short).
- **Architecture impact** — how this affects structure, boundaries, or future work.
- **Files touched** — important paths (project-relative).
- **Git** — commit ref or branch when available.

Skip logging for trivial refactors, formatting-only edits, or when you have nothing substantive to add.

### When to read memory

Before large refactors, API changes, dependency upgrades, or when the user asks “what did we decide before?”, **query trace** (search / recall tool provided by MCP) and **summarize** relevant past decisions in your reply. Prefer recent, project-scoped context; do not paste huge payloads back unless the user needs them.

### Tone and safety

- Do **not** put secrets, tokens, or API keys into trace payloads.
- Prefer concise, durable phrasing so future sessions can scan results quickly.

### Cursor setup

Add this file under **Cursor rules** (e.g. \`.cursor/rules/trace.mdc\` or Project Rules) so it applies in every session for this workspace.

`,

  windsurf: COMING_SOON_COPY,
  vscode: COMING_SOON_COPY,
  claude_code: COMING_SOON_COPY,
  antigravity: COMING_SOON_COPY,
}

export function getRuleMarkdown(toolId: RuleToolId): string {
  return RULE_MARKDOWN_BY_TOOL[toolId] ?? ""
}
