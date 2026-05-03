"use client"

import Image from "next/image"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import type { UserData } from "@/lib/get-user-data"
import { Avatar, AvatarFallback } from "@trace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@trace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@trace/ui/components/sidebar"

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "?"
}

function ProfileAvatar({
  name,
  image,
  className,
}: {
  name: string
  image: string | null
  className?: string
}) {
  const initials = initialsFromName(name)

  if (image) {
    return (
      <div
        className={`relative size-8 shrink-0 overflow-hidden rounded-lg ${className ?? ""}`}
      >
        <Image
          src={image}
          alt={name}
          width={32}
          height={32}
          className="size-full object-cover"
          sizes="32px"
          unoptimized={image.startsWith("data:")}
        />
      </div>
    )
  }

  return (
    <Avatar className={`size-8 rounded-lg ${className ?? ""}`}>
      <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
    </Avatar>
  )
}

export function NavUser({ user }: { user: UserData | null }) {
  const { isMobile } = useSidebar()

  const display = user ?? {
    id: "",
    name: "Account",
    email: "",
    image: null,
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <ProfileAvatar name={display.name} image={display.image} />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{display.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {display.email || "—"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <ProfileAvatar name={display.name} image={display.image} />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{display.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {display.email || "—"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
