"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { CSSProperties } from "react"

import { getDraftBannerStyle } from "@/lib/project-banner"

export const PROJECT_BANNER_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif" as const

const MAX_BYTES = 5 * 1024 * 1024

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file (JPEG, PNG, WebP, or GIF)."
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5 MB or smaller."
  }
  return null
}

export function useProjectBannerDraft() {
  const fileRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)

  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [gradientPreset, setGradientPreset] = useState<string | null>(null)

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  useEffect(() => () => revokeBlob(), [revokeBlob])

  const applyFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      const err = validateImageFile(file)
      if (err) {
        setBannerError(err)
        return
      }
      setBannerError(null)
      revokeBlob()
      const url = URL.createObjectURL(file)
      blobUrlRef.current = url
      setBannerPreviewUrl(url)
    },
    [revokeBlob]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyFile(e.target.files?.[0])
      e.target.value = ""
    },
    [applyFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      applyFile(e.dataTransfer.files?.[0])
    },
    [applyFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const clearBanner = useCallback(() => {
    revokeBlob()
    setBannerPreviewUrl(null)
    setBannerError(null)
  }, [revokeBlob])

  const openFilePicker = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const bannerStyle: CSSProperties = useMemo(
    () =>
      getDraftBannerStyle({
        localPreviewUrl: bannerPreviewUrl,
        gradientPreset,
      }),
    [bannerPreviewUrl, gradientPreset]
  )

  return {
    fileRef,
    bannerPreviewUrl,
    bannerError,
    isDragging,
    gradientPreset,
    setGradientPreset,
    bannerStyle,
    onFileChange,
    onDrop,
    onDragOver,
    onDragLeave,
    clearBanner,
    openFilePicker,
  }
}
