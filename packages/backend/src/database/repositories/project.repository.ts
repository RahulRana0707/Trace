import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../database.constants';
import type { Database } from '../drizzle.provider';
import * as schema from '../schema';

export type NewProjectRow = {
  organizationId: string;
  createdByUserId: string | null;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  bannerGradientPreset: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
};

@Injectable()
export class ProjectRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Tenant-scoped lookup — the organizationId check is the tenant isolation guarantee. */
  async getOrgProject(
    projectId: string,
    organizationId: string,
  ): Promise<typeof schema.project.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(schema.project)
      .where(
        and(
          eq(schema.project.id, projectId),
          eq(schema.project.organizationId, organizationId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listProjectsForOrganization(organizationId: string) {
    return this.db
      .select()
      .from(schema.project)
      .where(eq(schema.project.organizationId, organizationId))
      .orderBy(desc(schema.project.updatedAt));
  }

  async insertProject(row: NewProjectRow) {
    const [inserted] = await this.db
      .insert(schema.project)
      .values({
        organizationId: row.organizationId,
        createdByUserId: row.createdByUserId,
        name: row.name,
        description: row.description,
        bannerImageUrl: row.bannerImageUrl,
        bannerGradientPreset: row.bannerGradientPreset,
        tags: row.tags,
        metadata: row.metadata,
      })
      .returning();

    return inserted ?? null;
  }
}

export type ProjectListRow = Awaited<
  ReturnType<ProjectRepository['listProjectsForOrganization']>
>[number];
