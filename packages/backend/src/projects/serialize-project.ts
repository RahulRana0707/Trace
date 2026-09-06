import type { project } from '../database/schema';

/** No `ownerName` field — the old join was keyed on the now-removed project.userId; resolving "who created this" is a frontend concern (doc 05). */
export function serializeProject(row: typeof project.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    description: row.description,
    bannerImageUrl: row.bannerImageUrl,
    bannerGradientPreset: row.bannerGradientPreset,
    tags: row.tags,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
