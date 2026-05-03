"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

import {
  getDashboardBreadcrumbs,
  type DashboardBreadcrumbSegment,
} from "@/lib/dashboard-breadcrumbs"

export function useDashboardBreadcrumbs(): DashboardBreadcrumbSegment[] {
  const pathname = usePathname()

  return useMemo(
    () => getDashboardBreadcrumbs(pathname ?? "/"),
    [pathname]
  )
}
