"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { parseServerEnvelope } from "@/lib/api-parse"
import { buildMcpServerJsonFragment } from "@/lib/connect/mcp-snippet"
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
    try {
      const res = await fetch(`/api/projects/${projectId}/api-keys`, {
        credentials: "same-origin",
      })
      const raw: unknown = await res.json()
      const parsed = parseServerEnvelope<{ items: ApiKeyRow[] }>(raw)
      if (!res.ok || !parsed.ok) {
        setKeysError(
          parsed.ok === false
            ? parsed.errorMessage
            : `Could not load keys (${res.status}).`
        )
        setKeys([])
        return
      }
      setKeys(parsed.data.items ?? [])
    } catch {
      setKeysError("Could not load keys.")
      setKeys([])
    } finally {
      setKeysLoading(false)
    }
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
    try {
      const res = await fetch(
        `/api/projects/${selectedProjectId}/api-keys`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newKeyName.trim() || undefined,
          }),
        }
      )
      const raw: unknown = await res.json()
      const parsed = parseServerEnvelope<{
        id: string
        projectId: string
        secret: string
      }>(raw)
      if (!res.ok || !parsed.ok) {
        toast.error(
          parsed.ok === false
            ? parsed.errorMessage
            : `Could not create key (${res.status}).`
        )
        return
      }
      setCreatedSecret(parsed.data.secret)
      setSuccessOpen(true)
      setNewKeyName("")
      await loadKeys(selectedProjectId)
    } catch {
      toast.error("Could not create key.")
    } finally {
      setCreating(false)
    }
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
      try {
        const res = await fetch(
          `/api/projects/${selectedProjectId}/api-keys/${keyId}`,
          { method: "DELETE", credentials: "same-origin" }
        )
        const raw: unknown = await res.json()
        const parsed = parseServerEnvelope<{ revoked: boolean }>(raw)
        if (!res.ok || !parsed.ok) {
          toast.error(
            parsed.ok === false
              ? parsed.errorMessage
              : `Could not revoke (${res.status}).`
          )
          return
        }
        toast.success("Key revoked")
        await loadKeys(selectedProjectId)
      } catch {
        toast.error("Could not revoke key.")
      }
    },
    [selectedProjectId, loadKeys]
  )

  const mcpJsonWithRealSecret = useMemo(
    () =>
      createdSecret && selectedProjectId
        ? buildMcpServerJsonFragment({
            apiKey: createdSecret,
            projectId: selectedProjectId,
          })
        : "",
    [createdSecret, selectedProjectId]
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
    mcpJsonWithRealSecret,
  }
}
