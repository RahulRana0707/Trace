/** Placeholder when copying MCP JSON from the key list (secret is not stored). */
export const TRACE_API_KEY_PLACEHOLDER = "REPLACE_WITH_TRACE_API_KEY"

const DEFAULT_MCP_PACKAGE = "@trace/mcp@latest"

export function getTraceMcpNpxSpecifier(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_TRACE_MCP_NPX_PACKAGE
      : undefined
  const trimmed = fromEnv?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_MCP_PACKAGE
}

/** Cursor / Claude Desktop style `mcp.json` fragment under `mcpServers`. */
export function buildMcpServerJsonFragment(options: {
  apiKey: string
  projectId: string
}): string {
  const pkg = getTraceMcpNpxSpecifier()
  return JSON.stringify(
    {
      mcpServers: {
        trace: {
          command: "npx",
          args: ["-y", pkg],
          env: {
            TRACE_API_KEY: options.apiKey,
            TRACE_PROJECT_ID: options.projectId,
          },
        },
      },
    },
    null,
    2
  )
}
