import { parseServerEnvelope } from "@/lib/api-parse"

export type PostCreateProjectInput = {
  name: string
  description?: string
  bannerGradientPreset?: string
  tags?: string[]
}

/** Matches `serializeProject` from `POST /api/projects`. */
export type PostCreateProjectResponse = {
  id: string
  userId: string
  name: string
  description: string | null
  bannerImageUrl: string | null
  bannerGradientPreset: string | null
  tags: string[]
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  ownerName: string
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
  let res: Response
  try {
    res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
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
  } catch {
    return {
      ok: false,
      errorMessage: "Could not reach the server. Check your connection.",
      status: 0,
      data: null,
    }
  }

  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    return {
      ok: false,
      errorMessage: "Invalid response from server.",
      status: res.status,
      data: null,
    }
  }

  const parsed = parseServerEnvelope<PostCreateProjectResponse>(raw)
  if (!parsed.ok) {
    return {
      ok: false,
      errorMessage: formatCreateProjectError(parsed.data, parsed.errorMessage),
      status: res.status,
      data: parsed.data,
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      errorMessage: `Request failed (${res.status}).`,
      status: res.status,
      data: parsed.data,
    }
  }

  return { ok: true, project: parsed.data }
}
