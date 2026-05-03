"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3,
  FolderKanban,
  History,
  LayoutDashboard,
  Plug2,
  Settings,
} from "lucide-react"
import { TraceLogo } from "@trace/ui/components/logo"

import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import type { NavMainGroup } from "@/components/dashboard/nav-main"
import type { UserData } from "@/lib/get-user-data"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@trace/ui/components/sidebar"

const data = {
  navGroups: [
    {
      label: "Product",
      items: [
        {
          title: "Overview",
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "Projects",
          url: "/projects",
          icon: FolderKanban,
        },
        {
          title: "Memory",
          url: "/memory",
          icon: History,
        },
        {
          title: "Connect",
          icon: Plug2,
          isActive: true,
          items: [
            { title: "MCP", url: "/connect/mcp" },
            { title: "API keys", url: "/connect/api-keys" },
            { title: "Rules", url: "/connect/rules" },
          ],
        },
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ] satisfies NavMainGroup[],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserData | null }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="gap-2">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
                  <TraceLogo showText={false} size={26} />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    trace
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Agent memory
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
