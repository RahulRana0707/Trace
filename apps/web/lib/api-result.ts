import { parseServerEnvelope } from "@/lib/api-parse"

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; errorMessage: string; data: unknown; status: number }

/** Shared by server-api-fetch.ts and client-api-fetch.ts — has no server-only or client-only imports. */
export async function toApiResult<T>(res: Response): Promise<ApiResult<T>> {
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    return { ok: false, errorMessage: "Invalid response from server.", data: null, status: res.status }
  }

  const parsed = parseServerEnvelope<T>(raw)
  if (!parsed.ok) {
    return { ok: false, errorMessage: parsed.errorMessage, data: parsed.data, status: res.status }
  }
  if (!res.ok) {
    return { ok: false, errorMessage: `Request failed (${res.status}).`, data: parsed.data, status: res.status }
  }
  return { ok: true, data: parsed.data, status: res.status }
}
