import { createAuthClient } from "better-auth/react"
import { env } from "@/lib/env"

// BETTER_AUTH_URL now points at the backend (packages/backend), a different
// origin than this app — credentials: "include" is required so the browser
// sends/receives the cross-origin session cookie.
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
    baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
    fetchOptions: {
        credentials: "include",
    },
});