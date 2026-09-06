import { AsyncLocalStorage } from 'node:async_hooks';

export type McpContext = {
  projectId: string;
  organizationId: string;
  keyId: string;
};

export const mcpContext = new AsyncLocalStorage<McpContext>();

export function requireMcpContext(): McpContext {
  const ctx = mcpContext.getStore();
  if (!ctx) {
    throw new Error('Internal error: MCP request missing context');
  }
  return ctx;
}
