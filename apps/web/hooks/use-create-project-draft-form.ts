"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { postCreateProject } from "@/lib/post-create-project"
import { toast } from "@trace/ui/components/sonner"

export function parseProjectDraftTags(raw: string): string[] {
  return raw
    .split(/[,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

export type CreateProjectBannerContext = {
  gradientPreset: string | null
  hasLocalBannerImage: boolean
}

type UseCreateProjectDraftFormOptions = {
  /** Runs after a successful create, form reset, and `router.refresh()`. Use to close sheets or clear local banner state. */
  onSuccess?: () => void
}

export function useCreateProjectDraftForm(
  options: UseCreateProjectDraftFormOptions = {}
) {
  const { onSuccess } = options
  const router = useRouter()
  const submitLockRef = useRef(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tagsRaw, setTagsRaw] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tagCount = useMemo(() => parseProjectDraftTags(tagsRaw).length, [tagsRaw])

  const summaryHint = useMemo(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      return "Enter a name to create this project."
    }
    return `Creates “${trimmed}” with ${tagCount} tag(s).`
  }, [name, tagCount])

  const submitCreateProject = useCallback(
    async (banner: CreateProjectBannerContext) => {
      if (submitLockRef.current) return

      const trimmedName = name.trim()
      if (!trimmedName) {
        toast.error("Add a project name")
        return
      }

      const trimmedDesc = description.trim()
      const tags = parseProjectDraftTags(tagsRaw)

      submitLockRef.current = true
      setIsSubmitting(true)
      try {
        const result = await postCreateProject({
          name: trimmedName,
          ...(trimmedDesc ? { description: trimmedDesc } : {}),
          ...(banner.gradientPreset
            ? { bannerGradientPreset: banner.gradientPreset }
            : {}),
          tags,
        })

        if (!result.ok) {
          toast.error(result.errorMessage)
          return
        }

        toast.success(`Created “${result.project.name}”.`)
        if (banner.hasLocalBannerImage) {
          toast.message("Cover image not saved yet", {
            description:
              "Only the theme gradient was stored in the database. Uploads will follow in a later step.",
          })
        }

        setName("")
        setDescription("")
        setTagsRaw("")
        router.refresh()
        onSuccess?.()
      } catch {
        toast.error("Something went wrong. Try again.")
      } finally {
        submitLockRef.current = false
        setIsSubmitting(false)
      }
    },
    [description, name, onSuccess, router, tagsRaw]
  )

  return {
    name,
    setName,
    description,
    setDescription,
    tagsRaw,
    setTagsRaw,
    tagCount,
    summaryHint,
    isSubmitting,
    submitCreateProject,
  }
}
