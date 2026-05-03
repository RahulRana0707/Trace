import type { CSSProperties } from "react"

/** Named presets when there is no `bannerImageUrl` (keys for UI pickers). */
const GRADIENT_PRESETS: Record<string, string> = {
  ember: "linear-gradient(135deg, oklch(0.62 0.22 25) 0%, oklch(0.45 0.18 300) 100%)",
  ocean: "linear-gradient(135deg, oklch(0.55 0.14 240) 0%, oklch(0.45 0.12 200) 100%)",
  forest: "linear-gradient(135deg, oklch(0.55 0.14 150) 0%, oklch(0.42 0.1 180) 100%)",
  slate: "linear-gradient(135deg, oklch(0.45 0.04 260) 0%, oklch(0.35 0.03 260) 100%)",
  dawn: "linear-gradient(135deg, oklch(0.72 0.14 60) 0%, oklch(0.58 0.18 320) 100%)",
}

export const BANNER_GRADIENT_PRESET_KEYS: string[] =
  Object.keys(GRADIENT_PRESETS)

const DEFAULT_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.58 0.18 280) 0%, oklch(0.52 0.16 220) 100%)",
  "linear-gradient(135deg, oklch(0.55 0.16 160) 0%, oklch(0.48 0.12 200) 100%)",
  "linear-gradient(135deg, oklch(0.6 0.2 30) 0%, oklch(0.5 0.16 300) 100%)",
  "linear-gradient(135deg, oklch(0.5 0.12 250) 0%, oklch(0.42 0.1 270) 100%)",
  "linear-gradient(135deg, oklch(0.62 0.14 40) 0%, oklch(0.48 0.12 20) 100%)",
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export type ProjectBannerInput = {
  id: string
  bannerImageUrl: string | null
  bannerGradientPreset: string | null
}

/**
 * Style for project cover: image URL, named preset, or deterministic gradient from `id` (Notion-like).
 */
/**
 * Live preview for the create-project flow: local `blob:` URL wins; otherwise same as saved projects using a stable draft id.
 */
export function getDraftBannerStyle(opts: {
  localPreviewUrl: string | null
  gradientPreset: string | null
}): CSSProperties {
  if (opts.localPreviewUrl) {
    return {
      backgroundImage: `url(${opts.localPreviewUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
  }
  return getProjectBannerStyle({
    id: "draft-preview",
    bannerImageUrl: null,
    bannerGradientPreset: opts.gradientPreset,
  })
}

export function getProjectBannerStyle(
  project: ProjectBannerInput
): CSSProperties {
  if (project.bannerImageUrl) {
    return {
      backgroundImage: `url(${project.bannerImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
  }
  const named = project.bannerGradientPreset
    ? GRADIENT_PRESETS[project.bannerGradientPreset]
    : undefined
  const gradient =
    named ?? DEFAULT_GRADIENTS[hashId(project.id) % DEFAULT_GRADIENTS.length]
  return { background: gradient }
}
