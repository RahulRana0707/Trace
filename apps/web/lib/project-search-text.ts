type ProjectSearchFields = {
  name: string
  description: string | null
  tags: string[]
}

/** Stable string for client-side project search (name, description, tags). */
export function getProjectSearchableText(project: ProjectSearchFields): string {
  return [project.name, project.description ?? "", ...(project.tags ?? [])]
    .join(" ")
    .toLowerCase()
}
