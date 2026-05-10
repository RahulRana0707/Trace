import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthFormCard } from "@/components/auth-form-card"
import { AuthMode } from "@/lib/auth-mode"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a trace account to store reasoning, connect MCP, and scope memory by project.",
}

export default async function SignupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session) {
    redirect("/dashboard/overview")
  }

  return <AuthFormCard mode={AuthMode.Signup} />
}
