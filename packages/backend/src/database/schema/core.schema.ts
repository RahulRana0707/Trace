import { relations, sql } from 'drizzle-orm';
import {
  pgSchema,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { organization, user } from './auth.schema';

/** Trace's own product data: projects, memories, API keys. Every table is organization-scoped. */
export const coreSchema = pgSchema('core');

export const project = coreSchema.table(
  'project',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(gen_random_uuid())::text`),
    /** Tenancy boundary — every query against this table must filter by this. */
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    /** Audit only, not used for access control — nullable so deleting the creator never deletes the project. */
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    description: text('description'),
    bannerImageUrl: text('banner_image_url'),
    bannerGradientPreset: text('banner_gradient_preset'),
    tags: jsonb('tags')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('project_organizationId_idx').on(table.organizationId)],
);

export const memoryEntry = coreSchema.table(
  'memory_entry',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(gen_random_uuid())::text`),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    /** Denormalized from project.organizationId so every query can filter on it directly, no join required. */
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    intent: text('intent').notNull(),
    alternativesConsidered: text('alternatives_considered'),
    architectureImpact: text('architecture_impact'),
    filesTouched: jsonb('files_touched')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    gitCommitRef: text('git_commit_ref'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('memory_entry_organizationId_idx').on(table.organizationId),
    index('memory_entry_projectId_idx').on(table.projectId),
    index('memory_entry_projectId_createdAt_idx').on(
      table.projectId,
      table.createdAt,
    ),
  ],
);

export const projectApiKey = coreSchema.table(
  'project_api_key',
  {
    id: text('id')
      .primaryKey()
      .default(sql`(gen_random_uuid())::text`),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    /** Denormalized from project.organizationId so every query can filter on it directly, no join required. */
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    revokedAt: timestamp('revoked_at'),
  },
  (table) => [
    index('project_api_key_organizationId_idx').on(table.organizationId),
    index('project_api_key_projectId_idx').on(table.projectId),
    uniqueIndex('project_api_key_keyHash_unique').on(table.keyHash),
  ],
);

export const projectRelations = relations(project, ({ one, many }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [project.createdByUserId],
    references: [user.id],
  }),
  memoryEntries: many(memoryEntry),
  apiKeys: many(projectApiKey),
}));

export const memoryEntryRelations = relations(memoryEntry, ({ one }) => ({
  project: one(project, {
    fields: [memoryEntry.projectId],
    references: [project.id],
  }),
  organization: one(organization, {
    fields: [memoryEntry.organizationId],
    references: [organization.id],
  }),
}));

export const projectApiKeyRelations = relations(projectApiKey, ({ one }) => ({
  project: one(project, {
    fields: [projectApiKey.projectId],
    references: [project.id],
  }),
  organization: one(organization, {
    fields: [projectApiKey.organizationId],
    references: [organization.id],
  }),
}));
