import { NextResponse } from "next/server"
import * as z from "zod"

import { requireAgentAuth } from "@/lib/agent-auth"
import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { ServerResponseType } from "@/types/server"
import { searchMemoryEntriesForProject } from "@trace/database"

const searchBody = z.object({
  query: z.string().min(1).max(2000),
  limit: z.number().int().min(1).max(25).optional(),
})

export async function POST(request: Request) {
  const auth = await requireAgentAuth(request)
  if ("error" in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonServerError("Invalid JSON body", 400)
  }

  const parsed = searchBody.safeParse(body)
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

  const { query, limit } = parsed.data
  const { items } = await searchMemoryEntriesForProject({
    projectId: auth.projectId,
    query,
    limit: limit ?? 15,
  })

  const results = items.map((row) => {
    const snippetSource =
      row.intent ||
      row.alternativesConsidered ||
      row.architectureImpact ||
      ""
    return {
      id: row.id,
      snippet:
        snippetSource.length > 320
          ? `${snippetSource.slice(0, 320)}…`
          : snippetSource,
      createdAt: row.createdAt.toISOString(),
    }
  })

  return jsonSuccess({ items: results })
}
