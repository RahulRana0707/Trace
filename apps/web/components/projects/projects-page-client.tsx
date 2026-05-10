"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FolderOpenIcon,
  LayoutGridIcon,
  SearchIcon,
  Table2Icon,
} from "lucide-react"

import { CreateProjectDraftPanel } from "@/components/projects/create-project-draft-panel"
import { formatShortDate } from "@/lib/format-short-date"
import { getProjectSearchableText } from "@/lib/project-search-text"
import { getProjectBannerStyle } from "@/lib/project-banner"
import { useSearchableViewState } from "@/hooks/use-searchable-view-state"
import { Button } from "@trace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@trace/ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trace/ui/components/empty"
import { Input } from "@trace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@trace/ui/components/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trace/ui/components/table"
import { cn } from "@trace/ui/lib/utils"

export type ProjectsPageClientProject = {
  id: string
  name: string
  description: string | null
  bannerImageUrl: string | null
  bannerGradientPreset: string | null
  tags: string[]
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  ownerName: string
}

type ProjectsPageClientProps = {
  items: ProjectsPageClientProject[]
  loadError: string | null
}

function CreateProjectSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border p-4 pb-4">
          <SheetTitle>New project</SheetTitle>
          <SheetDescription>
            Set up how the card will look—cover image or a color theme. Create
            saves the project to your account.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
          <CreateProjectDraftPanel
            variant="sheet"
            onProjectCreated={onCreated}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ProjectsToolbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  onNewProject,
}: {
  query: string
  onQueryChange: (value: string) => void
  view: "grid" | "table"
  onViewChange: (value: "grid" | "table") => void
  onNewProject: () => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full max-w-md min-w-0">
        <SearchIcon
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, description, tags, or owner…"
          className="pl-9"
          aria-label="Search projects"
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div
          className="flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Project layout"
        >
          <Button
            type="button"
            size="icon-sm"
            variant={view === "grid" ? "secondary" : "ghost"}
            className="rounded-md"
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            aria-label="Grid view"
          >
            <LayoutGridIcon />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={view === "table" ? "secondary" : "ghost"}
            className="rounded-md"
            onClick={() => onViewChange("table")}
            aria-pressed={view === "table"}
            aria-label="Table view"
          >
            <Table2Icon />
          </Button>
        </div>
        <Button type="button" onClick={onNewProject}>
          New project
        </Button>
      </div>
    </div>
  )
}

function ProjectGrid({ projects }: { projects: ProjectsPageClientProject[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Card className="h-full overflow-hidden pt-0">
            <div
              className="h-24 w-full shrink-0"
              style={getProjectBannerStyle({
                id: project.id,
                bannerImageUrl: project.bannerImageUrl,
                bannerGradientPreset: project.bannerGradientPreset,
              })}
              aria-hidden
            />
            <CardHeader className="gap-1">
              <CardTitle className="text-base">
                <Link
                  href={`/dashboard/memory?project=${project.id}`}
                  className="hover:underline"
                >
                  {project.name}
                </Link>
              </CardTitle>
              {project.description ? (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 pt-0">
              {project.tags?.length
                ? project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))
                : null}
            </CardContent>
            <CardFooter className="mt-auto flex-col items-stretch gap-1 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:py-3">
              <span>Created {formatShortDate(project.createdAt)}</span>
              <span className="text-foreground/80">
                Owner · {project.ownerName}
              </span>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  )
}

function ProjectTable({ projects }: { projects: ProjectsPageClientProject[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 pl-4" scope="col">
            <span className="sr-only">Cover</span>
          </TableHead>
          <TableHead scope="col">Name</TableHead>
          <TableHead scope="col" className="hidden lg:table-cell">
            Description
          </TableHead>
          <TableHead scope="col" className="hidden md:table-cell">
            Tags
          </TableHead>
          <TableHead scope="col" className="whitespace-nowrap">
            Created
          </TableHead>
          <TableHead scope="col" className="whitespace-nowrap">
            Owner
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="w-14 pl-4">
              <div
                className="size-10 shrink-0 rounded-md ring-1 ring-border"
                style={getProjectBannerStyle({
                  id: project.id,
                  bannerImageUrl: project.bannerImageUrl,
                  bannerGradientPreset: project.bannerGradientPreset,
                })}
                aria-hidden
              />
            </TableCell>
            <TableCell className="font-medium">
              <Link
                href={`/dashboard/memory?project=${project.id}`}
                className="hover:underline"
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell className="hidden max-w-xs truncate text-muted-foreground lg:table-cell">
              {project.description ?? "—"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex max-w-48 flex-wrap gap-1">
                {project.tags?.length
                  ? project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))
                  : (
                      <span className="text-muted-foreground">—</span>
                    )}
              </div>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatShortDate(project.createdAt)}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {project.ownerName}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function ProjectsPageClient({ items, loadError }: ProjectsPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const { query, setQuery, view, setView, filteredItems, hasActiveFilters } =
    useSearchableViewState(items, getProjectSearchableText)

  const handleProjectCreated = () => {
    setCreateOpen(false)
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>
  }

  if (items.length === 0) {
    return (
      <>
        <div className="flex min-h-[min(50dvh,28rem)] w-full items-center justify-center py-8">
          <Empty className="max-w-lg border border-dashed bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpenIcon />
              </EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>
                Create a workspace so agent memory stays scoped and retrievable as
                you grow.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Create project
              </Button>
            </EmptyContent>
          </Empty>
        </div>
        <CreateProjectSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleProjectCreated}
        />
      </>
    )
  }

  return (
    <>
      <ProjectsToolbar
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        onNewProject={() => setCreateOpen(true)}
      />

      {filteredItems.length === 0 ? (
        <div className="flex min-h-56 w-full items-center justify-center py-10">
          <Empty className="max-w-md border border-dashed bg-muted/15">
            <EmptyHeader>
              <EmptyTitle>No matching projects</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? "Try another search term, or clear the filter to see everything."
                  : "No projects to show."}
              </EmptyDescription>
            </EmptyHeader>
            {hasActiveFilters ? (
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        </div>
      ) : (
        <div
          className={cn(
            view === "table" &&
              "rounded-xl border border-border bg-card ring-1 ring-foreground/10"
          )}
        >
          {view === "grid" ? (
            <ProjectGrid projects={filteredItems} />
          ) : (
            <ProjectTable projects={filteredItems} />
          )}
        </div>
      )}

      <CreateProjectSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleProjectCreated}
      />
    </>
  )
}
