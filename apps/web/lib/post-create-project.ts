import { clientApiFetch } from "@/lib/client-api-fetch"

export type PostCreateProjectInput = {
  name: string
  description?: string
  bannerGradientPreset?: string
  tags?: string[]
}

/** Matches `serializeProject` from `POST /projects` (packages/backend/src/projects/serialize-project.ts). */
export type PostCreateProjectResponse = {
  id: string
  organizationId: string
  createdByUserId: string | null
  name: string
  description: string | null
  bannerImageUrl: string | null
  bannerGradientPreset: string | null
  tags: string[]
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type PostCreateProjectResult =
  | { ok: true; project: PostCreateProjectResponse }
  | {
      ok: false
      errorMessage: string
      status: number
      data: unknown
    }

function firstValidationMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const validation = (data as { validation?: { fieldErrors?: Record<string, string[]> } })
    .validation
  const fieldErrors = validation?.fieldErrors
  if (!fieldErrors) return null
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    const first = msgs?.[0]
    if (first) return `${key}: ${first}`
  }
  return null
}

export function formatCreateProjectError(data: unknown, fallback: string): string {
  return firstValidationMessage(data) ?? fallback
}

export async function postCreateProject(
  input: PostCreateProjectInput
): Promise<PostCreateProjectResult> {
  const result = await clientApiFetch<PostCreateProjectResponse>("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      ...(input.bannerGradientPreset
        ? { bannerGradientPreset: input.bannerGradientPreset }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    }),
  })

  if (!result.ok) {
    return {
      ok: false,
      errorMessage: formatCreateProjectError(result.data, result.errorMessage),
      status: result.status,
      data: result.data,
    }
  }

  return { ok: true, project: result.data }
}
