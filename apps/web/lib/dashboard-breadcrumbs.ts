export type DashboardBreadcrumbSegment = {
  label: string
  /** Omit for non-link segments (e.g. section labels without a route) */
  href?: string
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/"
  return pathname.replace(/\/+$/, "") || "/"
}

const OVERVIEW: DashboardBreadcrumbSegment = {
  label: "Overview",
  href: "/dashboard/overview",
}

/**
 * Breadcrumb trail for each dashboard route. Last segment is always the current page (no href).
 */
const ROUTE_BREADCRUMBS: Record<string, DashboardBreadcrumbSegment[]> = {
  "/dashboard/overview": [{ label: "Overview" }],
  "/dashboard/projects": [OVERVIEW, { label: "Projects" }],
  "/dashboard/memory": [OVERVIEW, { label: "Memory" }],
  "/dashboard/connect/mcp": [OVERVIEW, { label: "Connect" }, { label: "MCP" }],
  "/dashboard/connect/api-keys": [
    OVERVIEW,
    { label: "Connect" },
    { label: "API keys" },
  ],
  "/dashboard/connect/rules": [
    OVERVIEW,
    { label: "Connect" },
    { label: "Rules" },
  ],
  "/dashboard/analytics": [OVERVIEW, { label: "Analytics" }],
  "/dashboard/settings": [OVERVIEW, { label: "Settings" }],
}

export function getDashboardBreadcrumbs(
  pathname: string
): DashboardBreadcrumbSegment[] {
  const path = normalizePathname(pathname)
  return (
    ROUTE_BREADCRUMBS[path] ?? [
      OVERVIEW,
      { label: "Not found" },
    ]
  )
}
