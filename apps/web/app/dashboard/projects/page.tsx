import { ProjectsPageClient } from "@/components/projects/projects-page-client"
import { serverApiFetch } from "@/lib/server-api-fetch"

type ApiProject = {
  id: string
  name: string
  description: string | null
  bannerImageUrl: string | null
  bannerGradientPreset: string | null
  tags: string[]
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export default async function ProjectsPage() {
  let items: ApiProject[] = []
  let loadError: string | null = null

  const result = await serverApiFetch<{ items: ApiProject[] }>("/projects")
  if (!result.ok) {
    loadError = result.errorMessage
  } else {
    items = result.data.items ?? []
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Organize agent memory by workspace or repo. Each project keeps its own
          timeline of decisions and context—so retrieval stays accurate as you
          scale.
        </p>
      </div>

      <ProjectsPageClient items={items} loadError={loadError} />
    </div>
  )
}
