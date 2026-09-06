import Link from "next/link"

import { serverApiFetch } from "@/lib/server-api-fetch"
import { Button } from "@trace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trace/ui/components/empty"
import { BrainCircuitIcon } from "lucide-react"

import { MemoryPageClient } from "@/components/memory/memory-page-client"

type ApiProject = {
  id: string
  name: string
}

type ApiMemory = {
  id: string
  projectId: string
  intent: string
  alternativesConsidered: string | null
  architectureImpact: string | null
  filesTouched: string[]
  gitCommitRef: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export default async function MemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const { project: projectIdParam } = await searchParams

  let projects: ApiProject[] = []
  let memories: ApiMemory[] = []
  let loadError: string | null = null
  let activeProjectId: string | null = null

  const projectsResult = await serverApiFetch<{ items: ApiProject[] }>("/projects")
  if (!projectsResult.ok) {
    loadError = projectsResult.errorMessage
  } else {
    projects = projectsResult.data.items ?? []
    const chosen = projects.find((p) => p.id === projectIdParam) ?? projects[0] ?? null
    if (chosen) {
      activeProjectId = chosen.id
      const memoriesResult = await serverApiFetch<{
        items: ApiMemory[]
        nextCursor: string | null
      }>(`/projects/${chosen.id}/memories?limit=25`)
      if (!memoriesResult.ok) {
        loadError = memoriesResult.errorMessage
      } else {
        memories = memoriesResult.data.items ?? []
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Memory</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A readable history of what your agents captured: intent, tradeoffs, and
          links back to the work. Open a project from{" "}
          <Link
            href="/dashboard/projects"
            className="font-medium text-primary hover:underline"
          >
            Projects
          </Link>
          .
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : !activeProjectId ? (
        <div className="flex min-h-[min(50dvh,28rem)] w-full items-center justify-center py-8">
          <Empty className="max-w-lg border border-dashed bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BrainCircuitIcon />
              </EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>
                Create a project first. Memory entries are scoped per workspace,
                then show up here in order.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/projects">Go to Projects</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <MemoryPageClient
          projects={projects}
          activeProjectId={activeProjectId}
          memories={memories}
        />
      )}
    </div>
  )
}
