import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { getServerSession } from "@/lib/get-server-session"

export const metadata: Metadata = {
  title: "Set up your workspace",
  description: "Create your organization and tell us a bit about how you work.",
}

export default async function OnboardingPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }
  if (session.session.activeOrganizationId) {
    redirect("/dashboard/overview")
  }

  return <OnboardingWizard />
}
