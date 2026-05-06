import { NextResponse } from "next/server"
import * as z from "zod"

import { requireAgentAuth } from "@/lib/agent-auth"
import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { serializeMemory } from "@/lib/serialize-memory"
import { ServerResponseType } from "@/types/server"
import {
  insertMemoryEntry,
  listMemoryEntriesForProject,
} from "@trace/database"

const createMemoryBody = z.object({
  intent: z.string().min(1).max(50_000),
  alternativesConsidered: z.string().max(50_000).optional(),
  architectureImpact: z.string().max(50_000).optional(),
  filesTouched: z.array(z.string().max(2048)).max(500).optional(),
  gitCommitRef: z.string().max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: Request) {
  const auth = await requireAgentAuth(request)
  if ("error" in auth) return auth.error

  const url = new URL(request.url)
  const limitRaw = url.searchParams.get("limit")
  const limit = Math.min(
    50,
    Math.max(1, limitRaw ? Number.parseInt(limitRaw, 10) || 20 : 20)
  )
  const cursorParam = url.searchParams.get("cursor")

  const result = await listMemoryEntriesForProject({
    projectId: auth.projectId,
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

export async function POST(request: Request) {
  const auth = await requireAgentAuth(request)
  if ("error" in auth) return auth.error

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
    projectId: auth.projectId,
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
