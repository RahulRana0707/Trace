import * as z from 'zod';

export const searchMemoryBody = z.object({
  query: z.string().min(1).max(2000),
  limit: z.number().int().min(1).max(25).optional(),
});
export type SearchMemoryBody = z.infer<typeof searchMemoryBody>;
