"use client"

import { useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"

import { formatShortDate } from "@/lib/format-short-date"
import { Label } from "@trace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trace/ui/components/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trace/ui/components/empty"
import { ScrollTextIcon } from "lucide-react"

export type MemoryPageProject = {
  id: string
  name: string
}

export type MemoryPageRow = {
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

type MemoryPageClientProps = {
  projects: MemoryPageProject[]
  activeProjectId: string
  memories: MemoryPageRow[]
}

function summarize(text: string, maxChars: number) {
  const t = text.trim()
  if (t.length <= maxChars) return t
  return `${t.slice(0, maxChars)}…`
}

export function MemoryPageClient({
  projects,
  activeProjectId,
  memories,
}: MemoryPageClientProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const activeProjectName = useMemo(
    () => projects.find((p) => p.id === activeProjectId)?.name ?? null,
    [projects, activeProjectId]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="memory-project">Project</Label>
          <Select
            value={activeProjectId}
            onValueChange={(nextId) => {
              startTransition(() => {
                router.push(`/dashboard/memory?project=${encodeURIComponent(nextId)}`)
              })
            }}
            disabled={pending}
          >
            <SelectTrigger
              id="memory-project"
              size="default"
              className="h-9 w-full max-w-md shadow-xs"
            >
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeProjectName ? (
            <p className="text-xs text-muted-foreground">
              Showing memory for{" "}
              <span className="font-medium text-foreground">{activeProjectName}</span>
              .
            </p>
          ) : null}
        </div>
      </div>

      {memories.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScrollTextIcon />
            </EmptyMedia>
            <EmptyTitle>No memory entries yet</EmptyTitle>
            <EmptyDescription>
              Once agents record structured reasoning for this project, it will show up here as a
              chronological table.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border border-border bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10rem]" scope="col">
                  When
                </TableHead>
                <TableHead className="min-w-[22rem]" scope="col">
                  Intent
                </TableHead>
                <TableHead className="hidden xl:table-cell xl:w-[22rem]" scope="col">
                  Tradeoffs / architecture
                </TableHead>
                <TableHead className="hidden lg:table-cell lg:w-[12rem]" scope="col">
                  Files
                </TableHead>
                <TableHead className="hidden md:table-cell md:w-[11rem]" scope="col">
                  Git ref
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memories.map((m) => {
                const tradeoff =
                  m.alternativesConsidered?.trim() ||
                  m.architectureImpact?.trim() ||
                  ""
                const filesCount = m.filesTouched?.length ?? 0

                return (
                  <TableRow key={m.id}>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>{formatShortDate(m.createdAt)}</span>
                        <span className="font-mono text-[10px] leading-snug text-muted-foreground/80">
                          {m.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-2">
                        <p className="text-sm leading-snug">{summarize(m.intent, 520)}</p>
                        <div className="xl:hidden">
                          {tradeoff ? (
                            <p className="text-xs leading-snug text-muted-foreground">
                              {summarize(tradeoff, 260)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">—</p>
                          )}
                        </div>
                        <div className="lg:hidden">
                          <p className="text-xs text-muted-foreground">
                            Files:{" "}
                            <span className="font-medium text-foreground">{filesCount}</span>
                          </p>
                        </div>
                        <div className="md:hidden">
                          <p className="font-mono text-[11px] text-muted-foreground break-all">
                            {m.gitCommitRef ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden align-top xl:table-cell">
                      {tradeoff ? (
                        <p className="text-sm leading-snug text-muted-foreground">
                          {summarize(tradeoff, 420)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden align-top lg:table-cell">
                      <p className="text-sm tabular-nums">{filesCount}</p>
                    </TableCell>
                    <TableCell className="hidden align-top md:table-cell">
                      <code className="font-mono text-xs break-all">
                        {m.gitCommitRef ?? "—"}
                      </code>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
