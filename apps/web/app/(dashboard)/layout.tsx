import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getUserData } from "@/lib/get-user-data"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getUserData()

  return <DashboardShell user={user}>{children}</DashboardShell>
}
