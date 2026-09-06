import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthFormCard } from "@/components/auth-form-card"
import { AuthMode } from "@/lib/auth-mode"
import { getServerSession } from "@/lib/get-server-session"

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to trace — long-term memory for your AI coding agents.",
}

export default async function LoginPage() {
  const session = await getServerSession()
  if (session) {
    redirect("/dashboard/overview")
  }

  return <AuthFormCard mode={AuthMode.Login} />
}
