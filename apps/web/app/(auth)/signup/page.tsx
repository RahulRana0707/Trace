import type { Metadata } from "next"

import { AuthFormCard } from "@/components/auth-form-card"
import { AuthMode } from "@/lib/auth-mode"

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a trace account to store reasoning, connect MCP, and scope memory by project.",
}

export default function SignupPage() {
  return <AuthFormCard mode={AuthMode.Signup} />
}
