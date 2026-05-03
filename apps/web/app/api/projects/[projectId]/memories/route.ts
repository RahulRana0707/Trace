import { headers } from "next/headers"
import { NextResponse } from "next/server"
import * as z from "zod"

import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { ServerResponseType } from "@/types/server"
import { auth } from "@/lib/auth"
import {
  getOwnedProject,
  insertMemoryEntry,
  listMemoryEntriesForProject,
} from "@trace/database"
import * as dbSchema from "@trace/database/schema"

const createMemoryBody = z.object({
  intent: z.string().min(1).max(50_000),
  alternativesConsidered: z.string().max(50_000).optional(),
  architectureImpact: z.string().max(50_000).optional(),
  filesTouched: z.array(z.string().max(2048)).max(500).optional(),
  gitCommitRef: z.string().max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

function serializeMemory(row: typeof dbSchema.memoryEntry.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    intent: row.intent,
    alternativesConsidered: row.alternativesConsidered,
    architectureImpact: row.architectureImpact,
    filesTouched: row.filesTouched,
    gitCommitRef: row.gitCommitRef,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function GET(
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
  const project = await getOwnedProject(projectId, session.user.id)
  if (!project) {
    return jsonServerError("Not found", 404)
  }

  const url = new URL(request.url)
  const limitRaw = url.searchParams.get("limit")
  const limit = Math.min(
    50,
    Math.max(1, limitRaw ? Number.parseInt(limitRaw, 10) || 20 : 20)
  )
  const cursorParam = url.searchParams.get("cursor")

  const result = await listMemoryEntriesForProject({
    projectId,
    limit,
    cursor: cursorParam,
  })

  if ("error" in result && result.error === "invalid_cursor") {
    return jsonServerError("Invalid cursor", 400)
  }

  if (!("items" in result)) {
    return jsonServerError("Unexpected error", 500)
  }

  return jsonSuccess({
    items: result.items.map(serializeMemory),
    nextCursor: result.nextCursor,
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
  const project = await getOwnedProject(projectId, session.user.id)
  if (!project) {
    return jsonServerError("Not found", 404)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonServerError("Invalid JSON body", 400)
  }

  const parsed = createMemoryBody.safeParse(body)
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

  const {
    intent,
    alternativesConsidered,
    architectureImpact,
    filesTouched,
    gitCommitRef,
    metadata,
  } = parsed.data

  const inserted = await insertMemoryEntry({
    projectId,
    intent,
    alternativesConsidered: alternativesConsidered ?? null,
    architectureImpact: architectureImpact ?? null,
    filesTouched: filesTouched ?? [],
    gitCommitRef: gitCommitRef ?? null,
    metadata: metadata ?? null,
  })

  if (!inserted) {
    return jsonServerError("Could not create memory", 500)
  }

  return jsonSuccess(serializeMemory(inserted), { status: 201 })
}
