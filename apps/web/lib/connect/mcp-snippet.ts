/** Placeholder when copying MCP JSON from the key list (secret is not stored). */
export const TRACE_API_KEY_PLACEHOLDER = "REPLACE_WITH_TRACE_API_KEY"

function trimTrailingSlashes(input: string): string {
  return input.replace(/\/+$/, "")
}

function normalizeHostedMcpHttpUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Use env value as-is; just normalize trailing slashes and ensure it ends with `/mcp`.
  // Example:
  // - https://trace.example.com          -> https://trace.example.com/mcp
  // - https://trace.example.com/mcp/     -> https://trace.example.com/mcp
  const noTrailing = trimTrailingSlashes(trimmed)
  if (noTrailing.toLowerCase().endsWith("/mcp")) return noTrailing
  return `${noTrailing}/mcp`
}

/**
 * Public MCP HTTP endpoint shown in the dashboard snippets.
 *
 * Configure via `NEXT_PUBLIC_TRACE_MCP_HTTP_URL`.
 */
export function getConfiguredTraceMcpHostedEndpoint(): string | null {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_TRACE_MCP_HTTP_URL
      : undefined
  const normalized = fromEnv ? normalizeHostedMcpHttpUrl(fromEnv) : null
  return normalized
}

/** MCP endpoint URL used for Connect/dashboard snippets. */
export function getHostedMcpHttpUrlForSnippets(): string | null {
  return getConfiguredTraceMcpHostedEndpoint()
}

/** Full MCP HTTP endpoint for `mcp.json` `url` (Streamable HTTP POST). */
export function getTraceMcpHostedEndpoint(): string {
  return getHostedMcpHttpUrlForSnippets() ?? ""
}

/** MCP server origin without path (for display). */
export function getTraceMcpHostedBaseUrl(): string {
  const endpoint = getHostedMcpHttpUrlForSnippets()
  if (!endpoint) return ""
  return endpoint.replace(/\/mcp\/?$/, "")
}

/**
 * Remote MCP (`url` + `headers`). The bearer key resolves the project server-side;
 * optional `X-Trace-Project-Id` is echoed for clients that want an explicit project id in config
 * (must match the key’s project when sent to trace web).
 */
export function buildHostedMcpServerJsonFragment(options: {
  mcpUrl: string
  apiKey: string
  /** When set, included as `X-Trace-Project-Id` (must match the API key’s project). */
  projectId?: string
}): string {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.apiKey}`,
  }
  const pid = options.projectId?.trim()
  if (pid) {
    headers["X-Trace-Project-Id"] = pid
  }
  return JSON.stringify(
    {
      mcpServers: {
        trace: {
          url: options.mcpUrl,
          headers,
        },
      },
    },
    null,
    2
  )
}
