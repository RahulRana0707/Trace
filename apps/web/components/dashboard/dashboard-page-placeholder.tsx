export function DashboardPagePlaceholder({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description ??
          "Placeholder content for this page. Replace with real UI when ready."}
      </p>
    </div>
  )
}
