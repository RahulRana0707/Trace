import { headers } from "next/headers"

import { toApiResult, type ApiResult } from "@/lib/api-result"
import { env } from "@/lib/env"

/** Server-side call to the backend (RSCs, route handlers) — forwards the incoming request's cookie. */
export async function serverApiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const incoming = await headers()
  const cookie = incoming.get("cookie")

  let res: Response
  try {
    res = await fetch(`${env.BACKEND_URL}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    })
  } catch {
    return { ok: false, errorMessage: "Could not reach the server. Check your connection.", data: null, status: 0 }
  }

  return toApiResult<T>(res)
}
