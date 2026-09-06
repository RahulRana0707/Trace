import * as z from 'zod';

export const createProjectBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
  bannerImageUrl: z
    .union([z.string().url().max(2048), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  bannerGradientPreset: z.string().max(64).optional(),
  tags: z.array(z.string().min(1).max(100)).max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateProjectBody = z.infer<typeof createProjectBody>;

export const createMemoryBody = z.object({
  intent: z.string().min(1).max(50_000),
  alternativesConsidered: z.string().max(50_000).optional(),
  architectureImpact: z.string().max(50_000).optional(),
  filesTouched: z.array(z.string().max(2048)).max(500).optional(),
  gitCommitRef: z.string().max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateMemoryBody = z.infer<typeof createMemoryBody>;

export const createApiKeyBody = z.object({
  name: z.string().min(1).max(120).optional(),
});
export type CreateApiKeyBody = z.infer<typeof createApiKeyBody>;
