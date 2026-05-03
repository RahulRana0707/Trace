import { headers } from "next/headers"
import { NextResponse } from "next/server"
import * as z from "zod"

import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { ServerResponseType } from "@/types/server"
import { auth } from "@/lib/auth"
import {
  createApiKeyForProject,
  listApiKeysForProject,
} from "@trace/database"

const createApiKeyBody = z.object({
  name: z.string().min(1).max(120).optional(),
})

function serializeKey(row: {
  id: string
  projectId: string
  keyPrefix: string
  name: string | null
  createdAt: Date
  revokedAt: Date | null
}) {
  return {
    id: row.id,
    projectId: row.projectId,
    keyPrefix: row.keyPrefix,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return jsonServerError("Unauthorized", 401)
  }

  const { projectId } = await context.params
  const rows = await listApiKeysForProject(projectId, session.user.id)
  if (rows === "forbidden") {
    return jsonServerError("Not found", 404)
  }

  return jsonSuccess({
    items: rows.map(serializeKey),
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return jsonServerError("Unauthorized", 401)
  }

  const { projectId } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const parsed = createApiKeyBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: ServerResponseType.ERROR,
        data: { validation: parsed.error.flatten() },
        errorMessage: "Validation failed",
      },
      { status: 400 }
    )
  }

  const name =
    parsed.data.name && parsed.data.name.trim().length > 0
      ? parsed.data.name.trim()
      : null

  const created = await createApiKeyForProject({
    projectId,
    userId: session.user.id,
    name,
  })

  if (!created.ok) {
    return jsonServerError("Not found", 404)
  }

  return jsonSuccess(
    {
      id: created.id,
      projectId: created.projectId,
      secret: created.plaintextSecret,
    },
    { status: 201 }
  )
}
