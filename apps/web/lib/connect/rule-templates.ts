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

You are working in a repo that uses **trace** for long-term **decision memory** (intent, tradeoffs, architecture—not just diffs). Call trace's **REST API** directly (e.g. via \`curl\`) using the endpoints below.

### REST API setup

Get your API key from the trace dashboard (**Connect → API keys**) and your project's base URL from the same page. Send it as an **Authorization: Bearer …** header on every request below.

Some setups also accept an optional **\`X-Trace-Project-Id\`** header. If present, it must match the project bound to your API key.

### Endpoints (exact paths)

Use only these endpoints:

| Method & path | Purpose |
|------|---------|
| \`GET /agent/ping\` | Cheap health check; confirms API key context and returns bound \`projectId\`. |
| \`POST /agent/memories\` | **Write** memory: body \`{ intent }\` required; optional \`alternativesConsidered\`, \`architectureImpact\`, \`filesTouched\`, \`gitCommitRef\`, \`metadata\`. |
| \`POST /agent/memories/search\` | **Search** (keyword): body \`{ query }\` required, optional \`limit\` (≤25). |
| \`GET /agent/memories/:memoryId\` | **Get** one entry by id. |
| \`GET /agent/memories?limit=&cursor=\` | **List** newest first: optional \`limit\`, \`cursor\`. |

### When to write memory

After **meaningful** changes—not every tiny edit—call **\`POST /agent/memories\`**. Include intent, alternatives, architecture impact, important paths, git ref when useful. Skip trivial edits.

### When to read memory

Before large refactors, API changes, dependency upgrades, or when the user asks what was decided before, use **\`POST /agent/memories/search\`**, **\`GET /agent/memories\`**, or **\`GET /agent/memories/:memoryId\`** and **summarize** in your reply. Do not paste huge payloads unless the user needs them.

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
