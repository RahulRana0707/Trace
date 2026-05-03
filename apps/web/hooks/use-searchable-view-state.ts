"use client"

import { useMemo, useState } from "react"

/** Layout for collections that support a dense table or a card grid. */
export type SearchableViewMode = "grid" | "table"

export type UseSearchableViewStateOptions = {
  initialView?: SearchableViewMode
  initialQuery?: string
}

export type UseSearchableViewStateResult<T> = {
  query: string
  setQuery: (value: string) => void
  view: SearchableViewMode
  setView: (value: SearchableViewMode) => void
  filteredItems: T[]
  hasActiveFilters: boolean
}

/**
 * Client-side search + view mode for list pages (projects, integrations, etc.).
 * Pass a stable `getSearchableText` (e.g. `useCallback` or a module-level function)
 * so filtering does not churn on every render.
 */
export function useSearchableViewState<T>(
  items: readonly T[],
  getSearchableText: (item: T) => string,
  options?: UseSearchableViewStateOptions
): UseSearchableViewStateResult<T> {
  const [query, setQuery] = useState(options?.initialQuery ?? "")
  const [view, setView] = useState<SearchableViewMode>(
    options?.initialView ?? "grid"
  )

  const normalizedQuery = query.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return [...items]
    }
    return items.filter((item) =>
      getSearchableText(item).toLowerCase().includes(normalizedQuery)
    )
  }, [getSearchableText, items, normalizedQuery])

  const hasActiveFilters = normalizedQuery.length > 0

  return {
    query,
    setQuery,
    view,
    setView,
    filteredItems,
    hasActiveFilters,
  }
}
