import { and, desc, eq, isNull } from "drizzle-orm"

import {
  apiKeyDisplayPrefix,
  generateApiKeyPlaintext,
  hashApiKeyPlaintext,
} from "../crypto-api-key"
import * as schema from "../db/schema"
import { db } from "../db"
import { getOwnedProject } from "./projects-memory"

export type ProjectApiKeyListRow = {
  id: string
  projectId: string
  keyPrefix: string
  name: string | null
  createdAt: Date
  revokedAt: Date | null
}

export async function listApiKeysForProject(
  projectId: string,
  userId: string
): Promise<ProjectApiKeyListRow[] | "forbidden"> {
  const project = await getOwnedProject(projectId, userId)
  if (!project) return "forbidden"

  return db
    .select({
      id: schema.projectApiKey.id,
      projectId: schema.projectApiKey.projectId,
      keyPrefix: schema.projectApiKey.keyPrefix,
      name: schema.projectApiKey.name,
      createdAt: schema.projectApiKey.createdAt,
      revokedAt: schema.projectApiKey.revokedAt,
    })
    .from(schema.projectApiKey)
    .where(eq(schema.projectApiKey.projectId, projectId))
    .orderBy(desc(schema.projectApiKey.createdAt))
}

export type CreateApiKeyResult =
  | {
      ok: true
      id: string
      projectId: string
      plaintextSecret: string
    }
  | { ok: false; error: "forbidden" }

export async function createApiKeyForProject(options: {
  projectId: string
  userId: string
  name: string | null
}): Promise<CreateApiKeyResult> {
  const { projectId, userId, name } = options
  const project = await getOwnedProject(projectId, userId)
  if (!project) return { ok: false, error: "forbidden" }

  const plaintextSecret = generateApiKeyPlaintext()
  const keyHash = hashApiKeyPlaintext(plaintextSecret)
  const keyPrefix = apiKeyDisplayPrefix(plaintextSecret)

  const [inserted] = await db
    .insert(schema.projectApiKey)
    .values({
      projectId,
      keyHash,
      keyPrefix,
      name,
    })
    .returning({
      id: schema.projectApiKey.id,
    })

  if (!inserted) {
    return { ok: false, error: "forbidden" }
  }

  return {
    ok: true,
    id: inserted.id,
    projectId,
    plaintextSecret,
  }
}

export type RevokeApiKeyResult =
  | { ok: true; alreadyRevoked: boolean }
  | { ok: false; error: "forbidden" | "not_found" }

export async function revokeProjectApiKey(options: {
  keyId: string
  projectId: string
  userId: string
}): Promise<RevokeApiKeyResult> {
  const { keyId, projectId, userId } = options
  const project = await getOwnedProject(projectId, userId)
  if (!project) return { ok: false, error: "forbidden" }

  const [existing] = await db
    .select({
      id: schema.projectApiKey.id,
      revokedAt: schema.projectApiKey.revokedAt,
    })
    .from(schema.projectApiKey)
    .where(
      and(
        eq(schema.projectApiKey.id, keyId),
        eq(schema.projectApiKey.projectId, projectId)
      )
    )
    .limit(1)

  if (!existing) return { ok: false, error: "not_found" }
  if (existing.revokedAt) {
    return { ok: true, alreadyRevoked: true }
  }

  await db
    .update(schema.projectApiKey)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.projectApiKey.id, keyId),
        eq(schema.projectApiKey.projectId, projectId),
        isNull(schema.projectApiKey.revokedAt)
      )
    )

  return { ok: true, alreadyRevoked: false }
}
