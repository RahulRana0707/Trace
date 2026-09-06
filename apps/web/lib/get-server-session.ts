import { headers } from "next/headers"

import { env } from "@/lib/env"

export type ServerSessionUser = {
  id: string
  name: string
  email: string
  image: string | null
}

export type ServerSession = {
  session: { userId: string; activeOrganizationId: string | null } & Record<string, unknown>
  user: ServerSessionUser
}

/**
 * Server-side session check against the backend's better-auth instance.
 * Auth now lives cross-origin (packages/backend), so there's no in-process
 * `auth.api.getSession` anymore — the incoming request's Cookie header has
 * to be forwarded manually.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const incomingHeaders = await headers()
  const cookie = incomingHeaders.get("cookie")

  const response = await fetch(`${env.BETTER_AUTH_URL}/api/auth/get-session`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  })

  if (!response.ok) return null

  const data = (await response.json()) as ServerSession | null
  return data
}
