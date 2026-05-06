"use client"

import type { ComponentProps } from "react"
import Link from "next/link"
import { CopyIcon, KeyRoundIcon, PlusIcon } from "lucide-react"

import {
  type ApiKeysPageProject,
  useApiKeysPage,
} from "@/hooks/use-api-keys-page"
import { formatShortDate } from "@/lib/format-short-date"
import { Button } from "@trace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trace/ui/components/empty"
import { Input } from "@trace/ui/components/input"
import { Label } from "@trace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trace/ui/components/select"
import { Separator } from "@trace/ui/components/separator"
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
import { toast } from "@trace/ui/components/sonner"
import { cn } from "@trace/ui/lib/utils"

export type { ApiKeysPageProject }

type ApiKeysPageClientProps = {
  projects: ApiKeysPageProject[]
  projectsLoadError: string | null
}

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  } catch {
    toast.error("Could not copy to clipboard")
  }
}

function CopyButton({
  label,
  text,
  variant = "outline",
  size = "sm",
  className,
  children,
}: {
  label: string
  text: string
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("shrink-0 gap-1.5", className)}
      onClick={() => void copyText(label, text)}
    >
      <CopyIcon className="size-3.5" aria-hidden />
      {children ?? "Copy"}
    </Button>
  )
}

export function ApiKeysPageClient({
  projects,
  projectsLoadError,
}: ApiKeysPageClientProps) {
  const {
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    keys,
    keysLoading,
    keysError,
    newKeyName,
    setNewKeyName,
    creating,
    successOpen,
    onSuccessSheetOpenChange,
    createdSecret,
    handleCreateKey,
    handleRevoke,
    hostedMcpSnippetAvailable,
    hostedMcpJsonWithRealSecret,
    hostedMcpJsonPlaceholder,
  } = useApiKeysPage({ projects })

  if (projectsLoadError) {
    return <p className="text-sm text-destructive">{projectsLoadError}</p>
  }

  if (projects.length === 0) {
    return (
      <Empty className="border border-dashed border-border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRoundIcon />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Create a project first. API keys are scoped to a single project so
            agents always read and write the right memory.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/projects">Go to projects</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-2">
            <Label htmlFor="api-keys-project">Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger
                id="api-keys-project"
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
          </div>

          {selectedProject ? (
            <div className="space-y-2">
              <Label>Project ID</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                <code className="min-h-9 flex-1 rounded-lg border border-input bg-muted/30 px-3 py-2 font-mono text-[11px] leading-snug break-all text-foreground sm:max-w-none">
                  {selectedProject.id}
                </code>
                <CopyButton
                  label="project ID"
                  text={selectedProject.id}
                  className="min-h-9 sm:self-start"
                />
              </div>
            </div>
          ) : null}
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Label htmlFor="api-key-name">Key label (optional)</Label>
            <Input
              id="api-key-name"
              placeholder="e.g. MacBook, CI"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              maxLength={120}
              className="max-w-md"
            />
          </div>
          <Button
            onClick={() => void handleCreateKey()}
            disabled={creating || !selectedProjectId}
          >
            <PlusIcon className="mr-2 size-4" aria-hidden />
            {creating ? "Creating…" : "Create API key"}
          </Button>
        </div>
      </section>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">API keys</h2>
        {keysError ? (
          <p className="mt-2 text-sm text-destructive">{keysError}</p>
        ) : null}

        <div className="mt-4">
          {keysLoading ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Loading keys…
            </div>
          ) : keys.length === 0 ? (
            <Empty className="rounded-lg border border-dashed border-border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <KeyRoundIcon />
                </EmptyMedia>
                <EmptyTitle>No API keys for this project</EmptyTitle>
                <EmptyDescription>Create a key above.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-xl border border-border bg-card ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Key</TableHead>
                    <TableHead scope="col">Label</TableHead>
                    <TableHead scope="col">Project</TableHead>
                    <TableHead scope="col" className="whitespace-nowrap">
                      Created
                    </TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => {
                    const active = k.revokedAt === null
                    return (
                      <TableRow key={k.id}>
                        <TableCell className="font-mono text-xs">
                          {k.keyPrefix}
                        </TableCell>
                        <TableCell className="text-sm">
                          {k.name ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate text-sm text-muted-foreground">
                          {selectedProject?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatShortDate(k.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {active ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Revoked
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {active && selectedProjectId ? (
                              <>
                                {hostedMcpSnippetAvailable ? (
                                  <CopyButton
                                    label="hosted MCP JSON"
                                    text={hostedMcpJsonPlaceholder}
                                    variant="secondary"
                                  >
                                    Copy hosted MCP JSON
                                  </CopyButton>
                                ) : null}
                              </>
                            ) : null}
                            {active ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => void handleRevoke(k.id)}
                              >
                                Revoke
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Sheet open={successOpen} onOpenChange={onSuccessSheetOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader className="text-left">
            <SheetTitle>Save your API key</SheetTitle>
            <SheetDescription>
              This is the only time we show the secret. Copy it now, then store
              it somewhere safe.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pt-2 pb-6">
            <div className="flex flex-col gap-2">
              <Label>Secret</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <code className="min-w-0 flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
                  {createdSecret}
                </code>
                {createdSecret ? (
                  <CopyButton label="API key" text={createdSecret} />
                ) : null}
              </div>
            </div>
            {selectedProjectId ? (
              <div className="flex flex-col gap-2">
                <Label>Project ID</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <code className="min-w-0 flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
                    {selectedProjectId}
                  </code>
                  <CopyButton label="project ID" text={selectedProjectId} />
                </div>
              </div>
            ) : null}
            {hostedMcpSnippetAvailable && hostedMcpJsonWithRealSecret ? (
              <div className="flex flex-col gap-2">
                <Label>MCP JSON (hosted URL)</Label>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                  {hostedMcpJsonWithRealSecret}
                </pre>
                <CopyButton
                  label="MCP JSON (hosted)"
                  text={hostedMcpJsonWithRealSecret}
                  variant="default"
                >
                  Copy hosted MCP JSON
                </CopyButton>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
