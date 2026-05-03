import { headers } from "next/headers"

import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { revokeProjectApiKey } from "@trace/database"

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string; keyId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return jsonServerError("Unauthorized", 401)
  }

  const { projectId, keyId } = await context.params

  const result = await revokeProjectApiKey({
    keyId,
    projectId,
    userId: session.user.id,
  })

  if (!result.ok) {
    if (result.error === "forbidden") {
      return jsonServerError("Not found", 404)
    }
    return jsonServerError("Not found", 404)
  }

  return jsonSuccess({
    revoked: true,
    alreadyRevoked: result.alreadyRevoked,
  })
}
