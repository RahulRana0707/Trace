import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, lt, or } from 'drizzle-orm';

import { DRIZZLE } from '../database.constants';
import type { Database } from '../drizzle.provider';
import * as schema from '../schema';

export type NewMemoryRow = {
  projectId: string;
  organizationId: string;
  intent: string;
  alternativesConsidered: string | null;
  architectureImpact: string | null;
  filesTouched: string[];
  gitCommitRef: string | null;
  metadata: Record<string, unknown> | null;
};

function decodeCursor(s: string): { at: string; id: string } | null {
  try {
    const raw = Buffer.from(s, 'base64url').toString('utf8');
    const o = JSON.parse(raw) as { at?: string; id?: string };
    if (typeof o.at !== 'string' || typeof o.id !== 'string') return null;
    return { at: o.at, id: o.id };
  } catch {
    return null;
  }
}

@Injectable()
export class MemoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async insertMemoryEntry(row: NewMemoryRow) {
    const [inserted] = await this.db
      .insert(schema.memoryEntry)
      .values({
        projectId: row.projectId,
        organizationId: row.organizationId,
        intent: row.intent,
        alternativesConsidered: row.alternativesConsidered,
        architectureImpact: row.architectureImpact,
        filesTouched: row.filesTouched,
        gitCommitRef: row.gitCommitRef,
        metadata: row.metadata,
      })
      .returning();

    return inserted ?? null;
  }

  /** organizationId is checked directly (denormalized column), not via a join through project. */
  async listMemoryEntriesForProject(options: {
    projectId: string;
    organizationId: string;
    limit: number;
    cursor: string | null | undefined;
  }) {
    const { projectId, organizationId, limit, cursor: cursorRaw } = options;
    const cursorParam = cursorRaw && cursorRaw.length > 0 ? cursorRaw : null;
    const cursor = cursorParam ? decodeCursor(cursorParam) : null;
    if (cursorParam && !cursor) {
      return { error: 'invalid_cursor' as const };
    }

    const base = and(
      eq(schema.memoryEntry.projectId, projectId),
      eq(schema.memoryEntry.organizationId, organizationId),
    );
    const whereClause =
      cursor && cursor.at && cursor.id
        ? and(
            base,
            or(
              lt(schema.memoryEntry.createdAt, new Date(cursor.at)),
              and(
                eq(schema.memoryEntry.createdAt, new Date(cursor.at)),
                lt(schema.memoryEntry.id, cursor.id),
              ),
            ),
          )
        : base;

    const rows = await this.db
      .select()
      .from(schema.memoryEntry)
      .where(whereClause)
      .orderBy(desc(schema.memoryEntry.createdAt), desc(schema.memoryEntry.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? Buffer.from(
            JSON.stringify({ at: last.createdAt.toISOString(), id: last.id }),
            'utf8',
          ).toString('base64url')
        : null;

    return { items, nextCursor };
  }

  async getMemoryEntryForProject(
    projectId: string,
    organizationId: string,
    memoryId: string,
  ): Promise<typeof schema.memoryEntry.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(schema.memoryEntry)
      .where(
        and(
          eq(schema.memoryEntry.id, memoryId),
          eq(schema.memoryEntry.projectId, projectId),
          eq(schema.memoryEntry.organizationId, organizationId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  /** Keyword search across text fields (Phase 1; replace with vector search later). */
  async searchMemoryEntriesForProject(options: {
    projectId: string;
    organizationId: string;
    query: string;
    limit: number;
  }) {
    const raw = options.query.trim();
    if (!raw) {
      return { items: [] as (typeof schema.memoryEntry.$inferSelect)[] };
    }

    const escaped = raw
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    const pattern = `%${escaped}%`;
    const cap = Math.min(Math.max(1, options.limit), 25);

    const rows = await this.db
      .select()
      .from(schema.memoryEntry)
      .where(
        and(
          eq(schema.memoryEntry.projectId, options.projectId),
          eq(schema.memoryEntry.organizationId, options.organizationId),
          or(
            ilike(schema.memoryEntry.intent, pattern),
            ilike(schema.memoryEntry.alternativesConsidered, pattern),
            ilike(schema.memoryEntry.architectureImpact, pattern),
          ),
        ),
      )
      .orderBy(desc(schema.memoryEntry.createdAt), desc(schema.memoryEntry.id))
      .limit(cap);

    return { items: rows };
  }
}

/** JSON shape shared by dashboard and agent API for a memory row. */
export function serializeMemoryEntry(
  row: typeof schema.memoryEntry.$inferSelect,
) {
  return {
    id: row.id,
    projectId: row.projectId,
    organizationId: row.organizationId,
    intent: row.intent,
    alternativesConsidered: row.alternativesConsidered,
    architectureImpact: row.architectureImpact,
    filesTouched: row.filesTouched,
    gitCommitRef: row.gitCommitRef,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
