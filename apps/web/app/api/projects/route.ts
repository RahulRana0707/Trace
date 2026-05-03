import { headers } from "next/headers"
import { NextResponse } from "next/server"
import * as z from "zod"

import { jsonServerError, jsonSuccess } from "@/lib/api-response"
import { ServerResponseType } from "@/types/server"
import { auth } from "@/lib/auth"
import {
  insertProject,
  listProjectsForUser,
  type ProjectListRow,
} from "@trace/database"

const createProjectBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
  bannerImageUrl: z
    .union([z.string().url().max(2048), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bannerGradientPreset: z.string().max(64).optional(),
  tags: z.array(z.string().min(1).max(100)).max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

type InsertedProject = NonNullable<Awaited<ReturnType<typeof insertProject>>>

function serializeProject(
  row: ProjectListRow | InsertedProject,
  ownerFallback?: string
) {
  const ownerName =
    "ownerName" in row && typeof row.ownerName === "string" && row.ownerName.length > 0
      ? row.ownerName
      : (ownerFallback ?? "Unknown")

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    bannerImageUrl: row.bannerImageUrl,
    bannerGradientPreset: row.bannerGradientPreset,
    tags: row.tags,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ownerName,
  }
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return jsonServerError("Unauthorized", 401)
  }

  const rows = await listProjectsForUser(session.user.id)

  return jsonSuccess({
    items: rows.map((row) => serializeProject(row)),
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return jsonServerError("Unauthorized", 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonServerError("Invalid JSON body", 400)
  }

  const parsed = createProjectBody.safeParse(body)
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
    name,
    description,
    bannerImageUrl,
    bannerGradientPreset,
    tags,
    metadata,
  } = parsed.data

  const inserted = await insertProject({
    userId: session.user.id,
    name,
    description: description ?? null,
    bannerImageUrl: bannerImageUrl ?? null,
    bannerGradientPreset: bannerGradientPreset ?? null,
    tags: tags ?? [],
    metadata: metadata ?? null,
  })

  if (!inserted) {
    return jsonServerError("Could not create project", 500)
  }

  return jsonSuccess(serializeProject(inserted, session.user.name), {
    status: 201,
  })
}
