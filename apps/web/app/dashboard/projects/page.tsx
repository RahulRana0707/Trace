import { ProjectsPageClient } from "@/components/projects/projects-page-client"
import { parseServerEnvelope } from "@/lib/api-parse"
import { dashboardFetch } from "@/lib/dashboard-fetch"

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
  ownerName: string
}

export default async function ProjectsPage() {
  let items: ApiProject[] = []
  let loadError: string | null = null

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
      items = parsed.data.items ?? []
    }
  } catch {
    loadError = "Could not load projects."
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
