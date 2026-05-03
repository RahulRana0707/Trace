import Link from "next/link"

import { parseServerEnvelope } from "@/lib/api-parse"
import { dashboardFetch } from "@/lib/dashboard-fetch"
import { Button } from "@trace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { BrainCircuitIcon, ScrollTextIcon } from "lucide-react"

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
  let activeProjectName: string | null = null

  try {
    const res = await dashboardFetch("/api/projects")
    const raw = await res.json()
    const parsed = parseServerEnvelope<{ items: ApiProject[] }>(raw)
    if (!res.ok || !parsed.ok) {
      loadError =
        parsed.ok === false
          ? parsed.errorMessage
          : `Could not load projects (${res.status}).`
    } else {
      projects = parsed.data.items ?? []
      const chosen =
        projects.find((p) => p.id === projectIdParam) ?? projects[0] ?? null
      if (chosen) {
        activeProjectId = chosen.id
        activeProjectName = chosen.name
        const mRes = await dashboardFetch(
          `/api/projects/${chosen.id}/memories?limit=25`
        )
        const mRaw = await mRes.json()
        const mParsed = parseServerEnvelope<{
          items: ApiMemory[]
          nextCursor: string | null
        }>(mRaw)
        if (!mRes.ok || !mParsed.ok) {
          loadError =
            mParsed.ok === false
              ? mParsed.errorMessage
              : `Could not load memories (${mRes.status}).`
        } else {
          memories = mParsed.data.items ?? []
        }
      }
    }
  } catch {
    loadError = "Could not load memory."
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Memory</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A readable history of what your agents captured: intent, tradeoffs, and
          links back to the work. Open a project from{" "}
          <Link
            href="/projects"
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
                <Link href="/projects">Go to Projects</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{activeProjectName}</span>
            {projectIdParam ? null : (
              <span className="text-muted-foreground">
                {" "}
                (defaulting to your most recently updated project)
              </span>
            )}
          </p>
          {memories.length === 0 ? (
            <div className="flex min-h-[min(40dvh,22rem)] w-full items-center justify-center py-6">
              <Empty className="max-w-lg border border-dashed bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ScrollTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>No memory entries yet</EmptyTitle>
                  <EmptyDescription>
                    When your agent records intent and tradeoffs for this project,
                    they will appear here in order.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {memories.map((m) => (
                <li key={m.id}>
                  <Card>
                    <CardHeader className="gap-1 pb-2">
                      <CardTitle className="text-base font-medium leading-snug">
                        {m.intent}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {m.createdAt}
                        {m.gitCommitRef ? ` · ${m.gitCommitRef}` : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {m.alternativesConsidered ? (
                        <p>
                          <span className="font-medium text-foreground">
                            Alternatives:{" "}
                          </span>
                          {m.alternativesConsidered}
                        </p>
                      ) : null}
                      {m.architectureImpact ? (
                        <p>
                          <span className="font-medium text-foreground">
                            Architecture:{" "}
                          </span>
                          {m.architectureImpact}
                        </p>
                      ) : null}
                      {m.filesTouched?.length ? (
                        <p className="font-mono text-xs">
                          Files: {m.filesTouched.join(", ")}
                        </p>
                      ) : null}
                      {m.metadata && Object.keys(m.metadata).length > 0 ? (
                        <pre className="max-h-32 overflow-auto rounded-md bg-muted/50 p-2 text-xs">
                          {JSON.stringify(m.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
