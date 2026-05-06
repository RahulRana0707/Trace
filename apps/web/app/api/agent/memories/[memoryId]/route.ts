import { requireAgentAuth } from "@/lib/agent-auth"
import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { serializeMemory } from "@/lib/serialize-memory"
import { getMemoryEntryForProject } from "@trace/database"

export async function GET(
  request: Request,
  context: { params: Promise<{ memoryId: string }> }
) {
  const auth = await requireAgentAuth(request)
  if ("error" in auth) return auth.error

  const { memoryId } = await context.params
  const row = await getMemoryEntryForProject(auth.projectId, memoryId)
  if (!row) {
    return jsonServerError("Not found", 404)
  }

  return jsonSuccess(serializeMemory(row))
}
