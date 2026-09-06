import { ApiKeysPageClient } from "@/components/connect/api-keys-page-client"
import { serverApiFetch } from "@/lib/server-api-fetch"

type ApiProject = {
  id: string
  name: string
}

export default async function ConnectApiKeysPage() {
  let projects: ApiProject[] = []
  let projectsLoadError: string | null = null

  const result = await serverApiFetch<{ items: ApiProject[] }>("/projects")
  if (!result.ok) {
    projectsLoadError = result.errorMessage
  } else {
    projects = (result.data.items ?? []).map((p) => ({ id: p.id, name: p.name }))
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
