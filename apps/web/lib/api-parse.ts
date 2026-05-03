import { ServerResponseType } from "@/types/server"

/** Parse JSON from trace Route Handlers that use the `ServerResponse` envelope. */
export function parseServerEnvelope<T>(body: unknown):
  | { ok: true; data: T }
  | { ok: false; errorMessage: string; data: unknown } {
  if (!body || typeof body !== "object" || !("status" in body)) {
    return { ok: false, errorMessage: "Invalid response", data: null }
  }
  const b = body as {
    status: string
    data?: unknown
    errorMessage?: string
  }
  if (b.status === ServerResponseType.SUCCESS) {
    return { ok: true, data: b.data as T }
  }
  return {
    ok: false,
    errorMessage: b.errorMessage ?? "Request failed",
    data: b.data ?? null,
  }
}
