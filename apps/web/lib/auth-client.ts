import { createAuthClient } from "better-auth/react"
import { env } from "@/lib/env"


export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
    baseURL: env.BETTER_AUTH_URL
});