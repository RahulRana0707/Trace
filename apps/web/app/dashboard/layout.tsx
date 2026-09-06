import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getServerSession } from "@/lib/get-server-session"
import { getUserData } from "@/lib/get-user-data"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  const user = await getUserData()

  return <DashboardShell user={user}>{children}</DashboardShell>
}
