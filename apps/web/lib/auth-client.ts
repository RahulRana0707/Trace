import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { env } from "@/lib/env"

type AuthResult<T = unknown> = { data: T; error: null } | { data: null; error: { message?: string } | null }

/**
 * better-auth's `createAuthClient` return type is too deep to be "named" by
 * TypeScript once the organization plugin is added (a `path-to-object.mjs`
 * internal, not something this app can fix) — `next build`'s typecheck fails
 * with TS2742 regardless of whether the export is annotated or left to
 * infer. This hand-written interface covers exactly what this app calls;
 * widen it if a new authClient call site needs something not listed here.
 */
interface AppAuthClient {
  signIn: {
    email: (args: { email: string; password: string }) => Promise<AuthResult>
    social: (args: { provider: string; callbackURL?: string; errorCallbackURL?: string }) => Promise<AuthResult>
  }
  signUp: {
    email: (args: { name: string; email: string; password: string }) => Promise<AuthResult>
  }
  signOut: () => Promise<AuthResult>
  organization: {
    create: (args: {
      name: string
      slug: string
      metadata?: Record<string, unknown>
    }) => Promise<AuthResult<{ id: string }>>
    setActive: (args: { organizationId: string }) => Promise<AuthResult>
  }
}

// BETTER_AUTH_URL now points at the backend (packages/backend), a different
// origin than this app — credentials: "include" is required so the browser
// sends/receives the cross-origin session cookie.
export const authClient = createAuthClient({
    baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
    fetchOptions: {
        credentials: "include",
    },
    plugins: [organizationClient()],
}) as unknown as AppAuthClient
