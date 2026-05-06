import type { NextResponse } from "next/server"

import { resolveActiveApiKeyToProject } from "@trace/database"

import { jsonServerError } from "@/lib/api-response"

export function extractBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization")
  if (!h || !h.toLowerCase().startsWith("bearer ")) return null
  const token = h.slice(7).trim()
  return token.length > 0 ? token : null
}

export type AgentAuthContext = {
  projectId: string
  keyId: string
}

/** Authenticate agent/MCP HTTP calls via `Authorization: Bearer <trace_sk_...>`. */
export async function requireAgentAuth(
  request: Request
): Promise<AgentAuthContext | { error: NextResponse }> {
  const token = extractBearerToken(request)
  if (!token) {
    return { error: jsonServerError("Unauthorized", 401) }
  }

  const resolved = await resolveActiveApiKeyToProject(token)
  if (!resolved) {
    return { error: jsonServerError("Invalid or revoked API key", 401) }
  }

  const projectHeader = request.headers.get("x-trace-project-id")?.trim()
  if (projectHeader && projectHeader !== resolved.projectId) {
    return {
      error: jsonServerError(
        "X-Trace-Project-Id does not match this API key’s project",
        403
      ),
    }
  }

  return resolved
}
