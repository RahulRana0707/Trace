import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';

import {
  apiKeyDisplayPrefix,
  generateApiKeyPlaintext,
  hashApiKeyPlaintext,
} from '../crypto-api-key';
import { DRIZZLE } from '../database.constants';
import type { Database } from '../drizzle.provider';
import * as schema from '../schema';
import { ProjectRepository } from './project.repository';

export type ProjectApiKeyListRow = {
  id: string;
  projectId: string;
  organizationId: string;
  keyPrefix: string;
  name: string | null;
  createdAt: Date;
  revokedAt: Date | null;
};

export type CreateApiKeyResult =
  | { ok: true; id: string; projectId: string; plaintextSecret: string }
  | { ok: false; error: 'forbidden' };

export type RevokeApiKeyResult =
  | { ok: true; alreadyRevoked: boolean }
  | { ok: false; error: 'forbidden' | 'not_found' };

@Injectable()
export class ApiKeyRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly projects: ProjectRepository,
  ) {}

  /** Resolve a plaintext API key to its project + organization (active keys only). Used by agent HTTP auth. */
  async resolveActiveApiKeyToProject(plaintextKey: string): Promise<{
    keyId: string;
    projectId: string;
    organizationId: string;
  } | null> {
    const trimmed = plaintextKey.trim();
    if (!trimmed) return null;

    const keyHash = hashApiKeyPlaintext(trimmed);
    const [row] = await this.db
      .select({
        id: schema.projectApiKey.id,
        projectId: schema.projectApiKey.projectId,
        organizationId: schema.projectApiKey.organizationId,
      })
      .from(schema.projectApiKey)
      .where(
        and(
          eq(schema.projectApiKey.keyHash, keyHash),
          isNull(schema.projectApiKey.revokedAt),
        ),
      )
      .limit(1);

    if (!row) return null;
    return {
      keyId: row.id,
      projectId: row.projectId,
      organizationId: row.organizationId,
    };
  }

  async listApiKeysForProject(
    projectId: string,
    organizationId: string,
  ): Promise<ProjectApiKeyListRow[] | 'forbidden'> {
    const project = await this.projects.getOrgProject(
      projectId,
      organizationId,
    );
    if (!project) return 'forbidden';

    return this.db
      .select({
        id: schema.projectApiKey.id,
        projectId: schema.projectApiKey.projectId,
        organizationId: schema.projectApiKey.organizationId,
        keyPrefix: schema.projectApiKey.keyPrefix,
        name: schema.projectApiKey.name,
        createdAt: schema.projectApiKey.createdAt,
        revokedAt: schema.projectApiKey.revokedAt,
      })
      .from(schema.projectApiKey)
      .where(
        and(
          eq(schema.projectApiKey.projectId, projectId),
          eq(schema.projectApiKey.organizationId, organizationId),
        ),
      )
      .orderBy(desc(schema.projectApiKey.createdAt));
  }

  async createApiKeyForProject(options: {
    projectId: string;
    organizationId: string;
    name: string | null;
  }): Promise<CreateApiKeyResult> {
    const { projectId, organizationId, name } = options;
    const project = await this.projects.getOrgProject(
      projectId,
      organizationId,
    );
    if (!project) return { ok: false, error: 'forbidden' };

    const plaintextSecret = generateApiKeyPlaintext();
    const keyHash = hashApiKeyPlaintext(plaintextSecret);
    const keyPrefix = apiKeyDisplayPrefix(plaintextSecret);

    const [inserted] = await this.db
      .insert(schema.projectApiKey)
      .values({ projectId, organizationId, keyHash, keyPrefix, name })
      .returning({ id: schema.projectApiKey.id });

    if (!inserted) {
      return { ok: false, error: 'forbidden' };
    }

    return { ok: true, id: inserted.id, projectId, plaintextSecret };
  }

  async revokeProjectApiKey(options: {
    keyId: string;
    projectId: string;
    organizationId: string;
  }): Promise<RevokeApiKeyResult> {
    const { keyId, projectId, organizationId } = options;
    const project = await this.projects.getOrgProject(
      projectId,
      organizationId,
    );
    if (!project) return { ok: false, error: 'forbidden' };

    const [existing] = await this.db
      .select({
        id: schema.projectApiKey.id,
        revokedAt: schema.projectApiKey.revokedAt,
      })
      .from(schema.projectApiKey)
      .where(
        and(
          eq(schema.projectApiKey.id, keyId),
          eq(schema.projectApiKey.projectId, projectId),
          eq(schema.projectApiKey.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!existing) return { ok: false, error: 'not_found' };
    if (existing.revokedAt) {
      return { ok: true, alreadyRevoked: true };
    }

    await this.db
      .update(schema.projectApiKey)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.projectApiKey.id, keyId),
          eq(schema.projectApiKey.projectId, projectId),
          eq(schema.projectApiKey.organizationId, organizationId),
          isNull(schema.projectApiKey.revokedAt),
        ),
      );

    return { ok: true, alreadyRevoked: false };
  }
}
