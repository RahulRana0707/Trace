"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { clientApiFetch } from "@/lib/client-api-fetch"
import { toast } from "@trace/ui/components/sonner"

export type ApiKeysPageProject = {
  id: string
  name: string
}

export type ApiKeyRow = {
  id: string
  projectId: string
  keyPrefix: string
  name: string | null
  createdAt: string
  revokedAt: string | null
}

type UseApiKeysPageArgs = {
  projects: ApiKeysPageProject[]
}

export function useApiKeysPage({ projects }: UseApiKeysPageArgs) {
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => projects[0]?.id ?? ""
  )
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [keysError, setKeysError] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  const loadKeys = useCallback(async (projectId: string) => {
    if (!projectId) {
      setKeys([])
      return
    }
    setKeysLoading(true)
    setKeysError(null)
    const result = await clientApiFetch<{ items: ApiKeyRow[] }>(`/projects/${projectId}/api-keys`)
    if (!result.ok) {
      setKeysError(result.errorMessage)
      setKeys([])
      setKeysLoading(false)
      return
    }
    setKeys(result.data.items ?? [])
    setKeysLoading(false)
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      void loadKeys(selectedProjectId)
    }
  }, [selectedProjectId, loadKeys])

  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.some((p) => p.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0]!.id)
    }
  }, [projects, selectedProjectId])

  const handleCreateKey = useCallback(async () => {
    if (!selectedProjectId) return
    setCreating(true)
    const result = await clientApiFetch<{ id: string; projectId: string; secret: string }>(
      `/projects/${selectedProjectId}/api-keys`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || undefined }),
      }
    )
    if (!result.ok) {
      toast.error(result.errorMessage)
      setCreating(false)
      return
    }
    setCreatedSecret(result.data.secret)
    setSuccessOpen(true)
    setNewKeyName("")
    await loadKeys(selectedProjectId)
    setCreating(false)
  }, [selectedProjectId, newKeyName, loadKeys])

  const handleRevoke = useCallback(
    async (keyId: string) => {
      if (!selectedProjectId) return
      if (
        !confirm(
          "Revoke this API key? Agents using it will stop working until you configure a new key."
        )
      ) {
        return
      }
      const result = await clientApiFetch<{ revoked: boolean }>(
        `/projects/${selectedProjectId}/api-keys/${keyId}`,
        { method: "DELETE" }
      )
      if (!result.ok) {
        toast.error(result.errorMessage)
        return
      }
      toast.success("Key revoked")
      await loadKeys(selectedProjectId)
    },
    [selectedProjectId, loadKeys]
  )

  const onSuccessSheetOpenChange = useCallback((open: boolean) => {
    setSuccessOpen(open)
    if (!open) setCreatedSecret(null)
  }, [])

  return {
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
  }
}
