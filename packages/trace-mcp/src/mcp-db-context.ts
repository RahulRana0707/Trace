import { AsyncLocalStorage } from "node:async_hooks"

export type McpDbContext = {
  projectId: string
  keyId: string
}

export const mcpDbContext = new AsyncLocalStorage<McpDbContext>()

export function requireMcpDbContext(): McpDbContext {
  const ctx = mcpDbContext.getStore()
  if (!ctx) {
    throw new Error("Internal error: MCP request missing DB context")
  }
  return ctx
}
