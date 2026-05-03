export type DashboardBreadcrumbSegment = {
  label: string
  /** Omit for non-link segments (e.g. section labels without a route) */
  href?: string
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/"
  return pathname.replace(/\/+$/, "") || "/"
}

/**
 * Breadcrumb trail for each dashboard route. Last segment is always the current page (no href).
 */
const ROUTE_BREADCRUMBS: Record<string, DashboardBreadcrumbSegment[]> = {
  "/": [{ label: "Overview" }],
  "/projects": [
    { label: "Overview", href: "/" },
    { label: "Projects" },
  ],
  "/memory": [
    { label: "Overview", href: "/" },
    { label: "Memory" },
  ],
  "/connect/mcp": [
    { label: "Overview", href: "/" },
    { label: "Connect" },
    { label: "MCP" },
  ],
  "/connect/api-keys": [
    { label: "Overview", href: "/" },
    { label: "Connect" },
    { label: "API keys" },
  ],
  "/connect/cursor": [
    { label: "Overview", href: "/" },
    { label: "Connect" },
    { label: "Cursor rules" },
  ],
  "/analytics": [
    { label: "Overview", href: "/" },
    { label: "Analytics" },
  ],
  "/settings": [
    { label: "Overview", href: "/" },
    { label: "Settings" },
  ],
}

export function getDashboardBreadcrumbs(
  pathname: string
): DashboardBreadcrumbSegment[] {
  const path = normalizePathname(pathname)
  return (
    ROUTE_BREADCRUMBS[path] ?? [
      { label: "Overview", href: "/" },
      { label: "Not found" },
    ]
  )
}
