import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { auth } from "@/lib/auth"
import { getUserData } from "@/lib/get-user-data"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const user = await getUserData()

  return <DashboardShell user={user}>{children}</DashboardShell>
}
