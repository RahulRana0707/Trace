import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"

const PUBLIC_ROUTES = ["/login", "/signup"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Auth lives cross-origin (packages/backend) now — forward the incoming
  // request's cookie directly rather than going through next/headers.
  const cookie = request.headers.get("cookie")
  const response = await fetch(`${env.BETTER_AUTH_URL}/api/auth/get-session`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  })
  const session = response.ok ? await response.json() : null

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
}
