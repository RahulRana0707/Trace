const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
})

export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return formatter.format(d)
}
