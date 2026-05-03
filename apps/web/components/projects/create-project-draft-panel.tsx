"use client"

import { useId } from "react"
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { useCreateProjectDraftForm } from "@/hooks/use-create-project-draft-form"
import {
  PROJECT_BANNER_ACCEPT,
  useProjectBannerDraft,
} from "@/hooks/use-project-banner-draft"
import { BANNER_GRADIENT_PRESET_KEYS } from "@/lib/project-banner"
import { Button } from "@trace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@trace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@trace/ui/components/field"
import { Input } from "@trace/ui/components/input"
import { Label } from "@trace/ui/components/label"
import { Separator } from "@trace/ui/components/separator"
import { cn } from "@trace/ui/lib/utils"

type CreateProjectDraftPanelProps = {
  /** `card` = dashed card on Projects page. `sheet` = body only (title lives in Sheet header). */
  variant?: "card" | "sheet"
  /** Called after a successful create, refresh, and form reset (e.g. close sheet, clear banner). */
  onProjectCreated?: () => void
}

export function CreateProjectDraftPanel({
  variant = "card",
  onProjectCreated,
}: CreateProjectDraftPanelProps) {
  const inputId = useId()
  const {
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
  } = useProjectBannerDraft()

  const {
    name,
    setName,
    description,
    setDescription,
    tagsRaw,
    setTagsRaw,
    summaryHint,
    isSubmitting,
    submitCreateProject,
  } = useCreateProjectDraftForm({
    onSuccess: () => {
      clearBanner()
      onProjectCreated?.()
    },
  })

  const preview = (
    <div
      className={cn(
        "relative h-28 w-full shrink-0 border-b border-border",
        variant === "sheet" && "rounded-t-lg"
      )}
      style={bannerStyle}
    >
      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
      <p className="absolute bottom-2 left-3 text-xs font-medium text-white drop-shadow">
        Cover preview
      </p>
    </div>
  )

  const body = (
    <>
      <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${inputId}-name`}>Name</FieldLabel>
            <Input
              id={`${inputId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. trace web"
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${inputId}-desc`}>Description</FieldLabel>
            <textarea
              id={`${inputId}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this workspace is for…"
              rows={3}
              className={cn(
                "min-h-18 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm",
                "placeholder:text-muted-foreground outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "dark:bg-input/30"
              )}
            />
            <FieldDescription>Optional. Shown on the project card.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${inputId}-tags`}>Tags</FieldLabel>
            <Input
              id={`${inputId}-tags`}
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="agent, mcp, frontend"
            />
            <FieldDescription>Comma-separated labels.</FieldDescription>
          </Field>
        </FieldGroup>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Cover image</Label>
          <input
            ref={fileRef}
            id={`${inputId}-file`}
            type="file"
            accept={PROJECT_BANNER_ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />
          <label
            htmlFor={`${inputId}-file`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50"
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <UploadIcon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drop an image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF · up to 5 MB · preview only for now
              </p>
            </div>
          </label>
          {bannerError ? (
            <p className="text-sm text-destructive" role="alert">
              {bannerError}
            </p>
          ) : null}
          {bannerPreviewUrl ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openFilePicker}
              >
                <ImageIcon className="size-3.5" aria-hidden />
                Replace image
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={clearBanner}
              >
                <Trash2Icon className="size-3.5" aria-hidden />
                Remove cover
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Or pick a theme (no upload)</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={gradientPreset === null ? "secondary" : "outline"}
              size="sm"
              onClick={() => setGradientPreset(null)}
            >
              Auto
            </Button>
            {BANNER_GRADIENT_PRESET_KEYS.map((key) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={gradientPreset === key ? "secondary" : "outline"}
                className="capitalize"
                onClick={() => setGradientPreset(key)}
              >
                {key}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            If you add a photo, it replaces the theme until you remove it.
          </p>
        </div>

      <Separator />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{summaryHint}</p>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() =>
            void submitCreateProject({
              gradientPreset,
              hasLocalBannerImage: Boolean(bannerPreviewUrl),
            })
          }
        >
          {isSubmitting ? "Creating…" : "Create project"}
        </Button>
      </div>
    </>
  )

  if (variant === "sheet") {
    return (
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
        {preview}
        <div className="space-y-6 p-4 sm:p-6">{body}</div>
      </div>
    )
  }

  return (
    <Card className="max-w-xl overflow-hidden border-dashed pt-0">
      {preview}
      <CardHeader className="gap-1">
        <CardTitle className="text-base">New project</CardTitle>
        <CardDescription>
          Set up how the card will look—cover image or a color theme. Creating
          saves the project to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">{body}</CardContent>
    </Card>
  )
}
