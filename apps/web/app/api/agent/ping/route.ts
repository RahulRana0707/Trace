import { requireAgentAuth } from "@/lib/agent-auth"
import { jsonSuccess } from "@/lib/api-response"

export async function GET(request: Request) {
  const auth = await requireAgentAuth(request)
  if ("error" in auth) return auth.error

  return jsonSuccess({
    ok: true,
    projectId: auth.projectId,
  })
}
