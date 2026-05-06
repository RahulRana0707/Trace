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

You are working in a repo that uses **trace** for long-term **decision memory** (intent, tradeoffs, architecture—not just diffs). Connect the **trace MCP** so you can call the tools below.

### MCP setup

Use **Hosted MCP (Streamable HTTP)**.

Copy the configuration snippet from the trace dashboard (**Connect → MCP**) into Cursor MCP settings. It includes the MCP endpoint URL and an **Authorization: Bearer …** header using your API key (**Connect → API keys**).

Some setups include optional headers such as **\`X-Trace-Project-Id\`**. If present, it must match the project bound to your API key.

### MCP tools (exact names)

Use only these tool names:

| Tool | Purpose |
|------|---------|
| \`trace_ping\` | Cheap health check; confirms API key context and returns bound \`projectId\`. |
| \`trace_store_memory\` | **Write** memory: required \`intent\`; optional \`alternativesConsidered\`, \`architectureImpact\`, \`filesTouched\`, \`gitCommitRef\`, \`metadata\`. |
| \`trace_search_memory\` | **Search** (keyword): \`query\`, optional \`limit\` (≤25). |
| \`trace_get_memory\` | **Get** one entry by \`id\`. |
| \`trace_list_recent\` | **List** newest first: optional \`limit\`, \`cursor\`. |
| \`trace_list_memories\` | Same list as \`trace_list_recent\`; project comes from the API key. |

### When to write memory

After **meaningful** changes—not every tiny edit—call **\`trace_store_memory\`**. Include intent, alternatives, architecture impact, important paths, git ref when useful. Skip trivial edits.

### When to read memory

Before large refactors, API changes, dependency upgrades, or when the user asks what was decided before, use **\`trace_search_memory\`**, **\`trace_list_recent\`**, **\`trace_list_memories\`**, or **\`trace_get_memory\`** and **summarize** in your reply. Do not paste huge payloads unless the user needs them.

### Tone and safety

- Do **not** put unrelated secrets, tokens, or API keys into trace payload fields.
- Prefer concise, durable phrasing.

### Cursor rules file

Add this content under **Cursor → Rules** (e.g. \`.cursor/rules/trace.mdc\` in the **client** repo, or Project Rules) so it applies in every session for that workspace.

`,

  windsurf: COMING_SOON_COPY,
  vscode: COMING_SOON_COPY,
  claude_code: COMING_SOON_COPY,
  antigravity: COMING_SOON_COPY,
}

export function getRuleMarkdown(toolId: RuleToolId): string {
  return RULE_MARKDOWN_BY_TOOL[toolId] ?? ""
}
