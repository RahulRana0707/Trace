"use client"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb"
import type { UserData } from "@/lib/get-user-data"
import { Separator } from "@trace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@trace/ui/components/sidebar"

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: UserData | null
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-6"
            />
            <DashboardBreadcrumb />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="flex flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
            <div className="mx-auto w-full max-w-7xl 2xl:max-w-[90rem]">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
