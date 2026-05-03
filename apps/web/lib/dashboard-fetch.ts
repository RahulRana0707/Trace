import { headers } from "next/headers"

/** Server-side fetch to this app's Route Handlers with the incoming request cookies. */
export async function dashboardFetch(path: string): Promise<Response> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  if (!host) {
    throw new Error("Missing Host header for dashboard fetch")
  }
  const url = `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`
  return fetch(url, {
    headers: {
      cookie: h.get("cookie") ?? "",
    },
    cache: "no-store",
  })
}
