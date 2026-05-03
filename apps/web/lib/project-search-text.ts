type ProjectSearchFields = {
  name: string
  description: string | null
  tags: string[]
  ownerName: string
}

/** Stable string for client-side project search (name, description, tags, owner). */
export function getProjectSearchableText(project: ProjectSearchFields): string {
  return [
    project.name,
    project.description ?? "",
    ...(project.tags ?? []),
    project.ownerName,
  ]
    .join(" ")
    .toLowerCase()
}
