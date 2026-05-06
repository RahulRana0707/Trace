import { and, desc, eq, ilike, lt, or } from "drizzle-orm"

import * as schema from "../db/schema.js"
import { db } from "../db.js"

export async function getOwnedProject(
  projectId: string,
  userId: string
): Promise<typeof schema.project.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(schema.project)
    .where(
      and(
        eq(schema.project.id, projectId),
        eq(schema.project.userId, userId)
      )
    )
    .limit(1)

  return row ?? null
}

export async function listProjectsForUser(userId: string) {
  return db
    .select({
      id: schema.project.id,
      userId: schema.project.userId,
      name: schema.project.name,
      description: schema.project.description,
      bannerImageUrl: schema.project.bannerImageUrl,
      bannerGradientPreset: schema.project.bannerGradientPreset,
      tags: schema.project.tags,
      metadata: schema.project.metadata,
      createdAt: schema.project.createdAt,
      updatedAt: schema.project.updatedAt,
      ownerName: schema.user.name,
    })
    .from(schema.project)
    .innerJoin(schema.user, eq(schema.project.userId, schema.user.id))
    .where(eq(schema.project.userId, userId))
    .orderBy(desc(schema.project.updatedAt))
}

export type ProjectListRow = Awaited<
  ReturnType<typeof listProjectsForUser>
>[number]

export type NewProjectRow = {
  userId: string
  name: string
  description: string | null
  bannerImageUrl: string | null
  bannerGradientPreset: string | null
  tags: string[]
  metadata: Record<string, unknown> | null
}

export async function insertProject(row: NewProjectRow) {
  const [inserted] = await db
    .insert(schema.project)
    .values({
      userId: row.userId,
      name: row.name,
      description: row.description,
      bannerImageUrl: row.bannerImageUrl,
      bannerGradientPreset: row.bannerGradientPreset,
      tags: row.tags,
      metadata: row.metadata,
    })
    .returning()

  return inserted ?? null
}

export type NewMemoryRow = {
  projectId: string
  intent: string
  alternativesConsidered: string | null
  architectureImpact: string | null
  filesTouched: string[]
  gitCommitRef: string | null
  metadata: Record<string, unknown> | null
}

export async function insertMemoryEntry(row: NewMemoryRow) {
  const [inserted] = await db
    .insert(schema.memoryEntry)
    .values({
      projectId: row.projectId,
      intent: row.intent,
      alternativesConsidered: row.alternativesConsidered,
      architectureImpact: row.architectureImpact,
      filesTouched: row.filesTouched,
      gitCommitRef: row.gitCommitRef,
      metadata: row.metadata,
    })
    .returning()

  return inserted ?? null
}

function decodeCursor(s: string): { at: string; id: string } | null {
  try {
    const raw = Buffer.from(s, "base64url").toString("utf8")
    const o = JSON.parse(raw) as { at?: string; id?: string }
    if (typeof o.at !== "string" || typeof o.id !== "string") return null
    return { at: o.at, id: o.id }
  } catch {
    return null
  }
}

export async function listMemoryEntriesForProject(options: {
  projectId: string
  limit: number
  cursor: string | null | undefined
}) {
  const { projectId, limit, cursor: cursorRaw } = options
  const cursorParam =
    cursorRaw && cursorRaw.length > 0 ? cursorRaw : null
  const cursor = cursorParam ? decodeCursor(cursorParam) : null
  if (cursorParam && !cursor) {
    return { error: "invalid_cursor" as const }
  }

  const base = eq(schema.memoryEntry.projectId, projectId)
  const whereClause =
    cursor && cursor.at && cursor.id
      ? and(
          base,
          or(
            lt(schema.memoryEntry.createdAt, new Date(cursor.at)),
            and(
              eq(schema.memoryEntry.createdAt, new Date(cursor.at)),
              lt(schema.memoryEntry.id, cursor.id)
            )
          )
        )
      : base

  const rows = await db
    .select()
    .from(schema.memoryEntry)
    .where(whereClause)
    .orderBy(
      desc(schema.memoryEntry.createdAt),
      desc(schema.memoryEntry.id)
    )
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items[items.length - 1]
  const nextCursor =
    hasMore && last
      ? Buffer.from(
          JSON.stringify({
            at: last.createdAt.toISOString(),
            id: last.id,
          }),
          "utf8"
        ).toString("base64url")
      : null

  return { items, nextCursor }
}

export async function getMemoryEntryForProject(
  projectId: string,
  memoryId: string
): Promise<typeof schema.memoryEntry.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(schema.memoryEntry)
    .where(
      and(
        eq(schema.memoryEntry.id, memoryId),
        eq(schema.memoryEntry.projectId, projectId)
      )
    )
    .limit(1)

  return row ?? null
}

/** Keyword search across text fields (Phase 1; replace with vector search later). */
export async function searchMemoryEntriesForProject(options: {
  projectId: string
  query: string
  limit: number
}) {
  const raw = options.query.trim()
  if (!raw) {
    return { items: [] as typeof schema.memoryEntry.$inferSelect[] }
  }

  const escaped = raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
  const pattern = `%${escaped}%`
  const cap = Math.min(Math.max(1, options.limit), 25)

  const rows = await db
    .select()
    .from(schema.memoryEntry)
    .where(
      and(
        eq(schema.memoryEntry.projectId, options.projectId),
        or(
          ilike(schema.memoryEntry.intent, pattern),
          ilike(schema.memoryEntry.alternativesConsidered, pattern),
          ilike(schema.memoryEntry.architectureImpact, pattern)
        )
      )
    )
    .orderBy(
      desc(schema.memoryEntry.createdAt),
      desc(schema.memoryEntry.id)
    )
    .limit(cap)

  return { items: rows }
}
