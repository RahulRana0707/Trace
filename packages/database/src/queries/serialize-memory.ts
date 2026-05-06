import * as schema from "../db/schema.js"

/** JSON shape shared by dashboard and MCP for a memory row. */
export function serializeMemoryEntry(
  row: typeof schema.memoryEntry.$inferSelect
) {
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
