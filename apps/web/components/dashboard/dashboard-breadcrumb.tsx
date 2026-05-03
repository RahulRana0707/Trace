"use client"

import * as React from "react"
import Link from "next/link"

import { useDashboardBreadcrumbs } from "@/hooks/use-dashboard-breadcrumbs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@trace/ui/components/breadcrumb"

export function DashboardBreadcrumb() {
  const segments = useDashboardBreadcrumbs()

  if (segments.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1

          return (
            <React.Fragment key={`${segment.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{segment.label}</span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
