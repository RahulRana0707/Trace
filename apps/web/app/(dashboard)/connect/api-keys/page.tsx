import { ApiKeysPageClient } from "@/components/connect/api-keys-page-client"
import { parseServerEnvelope } from "@/lib/api-parse"
import { dashboardFetch } from "@/lib/dashboard-fetch"

type ApiProject = {
  id: string
  name: string
}

export default async function ConnectApiKeysPage() {
  let projects: ApiProject[] = []
  let projectsLoadError: string | null = null

  try {
    const res = await dashboardFetch("/api/projects")
    const raw = await res.json()
    const parsed = parseServerEnvelope<{ items: ApiProject[] }>(raw)
    if (!res.ok || !parsed.ok) {
      projectsLoadError =
        parsed.ok === false
          ? parsed.errorMessage
          : `Could not load projects (${res.status}).`
    } else {
      projects = (parsed.data.items ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      }))
    }
  } catch {
    projectsLoadError = "Could not load projects."
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API keys</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Create keys scoped to a project.
        </p>
      </div>

      <ApiKeysPageClient
        projects={projects}
        projectsLoadError={projectsLoadError}
      />
    </div>
  )
}
