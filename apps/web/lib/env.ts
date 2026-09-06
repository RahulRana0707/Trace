

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  // Points at the backend (packages/backend) now that auth lives there.
  // Server-side use only (RSCs, route handlers, proxy.ts) — Next.js does not
  // inline unprefixed vars into the browser bundle. lib/auth-client.ts (which
  // runs in the browser) needs NEXT_PUBLIC_BETTER_AUTH_URL instead.
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
  NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
}
