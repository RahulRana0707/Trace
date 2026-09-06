import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthFormCard } from "@/components/auth-form-card"
import { AuthMode } from "@/lib/auth-mode"
import { getServerSession } from "@/lib/get-server-session"

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a trace account to store reasoning, connect agents via the API, and scope memory by project.",
}

export default async function SignupPage() {
  const session = await getServerSession()
  if (session) {
    redirect("/dashboard/overview")
  }

  return <AuthFormCard mode={AuthMode.Signup} />
}
