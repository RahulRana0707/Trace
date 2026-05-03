import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

const PUBLIC_ROUTES = ["/login", "/signup"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
}
