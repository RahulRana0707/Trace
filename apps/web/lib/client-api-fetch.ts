import { toApiResult, type ApiResult } from "@/lib/api-result"
import { env } from "@/lib/env"

/** Client-side (browser) call to the backend — relies on the browser's own cross-origin cookie jar. */
export async function clientApiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(`${env.NEXT_PUBLIC_BACKEND_URL}${path}`, {
      ...init,
      credentials: "include",
    })
  } catch {
    return { ok: false, errorMessage: "Could not reach the server. Check your connection.", data: null, status: 0 }
  }

  return toApiResult<T>(res)
}
