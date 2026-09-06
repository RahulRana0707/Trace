

// Server-only vars (RSCs, route handlers, proxy.ts) are unprefixed — Next.js
// never inlines those into the browser bundle. Anything read from a "use
// client" component (lib/auth-client.ts, lib/client-api-fetch.ts)
// needs the NEXT_PUBLIC_ variant instead.
export const env = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
  NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  BACKEND_URL: process.env.BACKEND_URL!,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL!,
}
