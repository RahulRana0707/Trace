import type { Metadata } from "next"

import { AuthFormCard } from "@/components/auth-form-card"
import { AuthMode } from "@/lib/auth-mode"

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to trace — long-term memory for your AI coding agents.",
}

export default function LoginPage() {
  return <AuthFormCard mode={AuthMode.Login} />
}
