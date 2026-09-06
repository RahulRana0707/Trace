"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, PlusIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { CodexIcon, ClaudeIcon, CursorIcon } from "@/components/icons"
import { TraceLogo } from "@trace/ui/components/logo"
import { Button } from "@trace/ui/components/button"
import { Input } from "@trace/ui/components/input"
import { toast } from "@trace/ui/components/sonner"
import { cn } from "@trace/ui/lib/utils"

type Role = "solo" | "lead" | "manager" | "other-role"
type ToolId = "cursor" | "claude" | "codex" | "other-tool"
type Goal = "forgets" | "team" | "audit" | "exploring"

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "solo", label: "Solo developer" },
  { value: "lead", label: "Team lead" },
  { value: "manager", label: "Engineering manager" },
  { value: "other-role", label: "Something else" },
]

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "forgets", label: "My agent forgets past decisions" },
  { value: "team", label: "Sharing context across a team" },
  { value: "audit", label: "An audit trail for AI-driven changes" },
  { value: "exploring", label: "Just exploring" },
]

const TOOL_OPTIONS: { value: ToolId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { value: "cursor", label: "Cursor", Icon: CursorIcon },
  { value: "claude", label: "Claude Code", Icon: ClaudeIcon },
  { value: "codex", label: "Codex", Icon: CodexIcon },
  { value: "other-tool", label: "Other", Icon: PlusIcon },
]

const TOTAL_STEPS = 4

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
}

function RadioTile({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-[0.9375rem] transition-colors",
        selected ? "border-primary bg-primary/10" : "border-border hover:border-border/80 hover:bg-muted/40"
      )}
    >
      <span
        className={cn(
          "relative size-[1.05rem] shrink-0 rounded-full border-[1.5px]",
          selected ? "border-primary" : "border-input"
        )}
      >
        {selected && <span className="absolute inset-[0.2rem] rounded-full bg-primary" />}
      </span>
      {label}
    </button>
  )
}

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [orgName, setOrgName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugCustom, setSlugCustom] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)

  const [role, setRole] = useState<Role | null>(null)
  const [tools, setTools] = useState<Set<ToolId>>(new Set())
  const [otherTool, setOtherTool] = useState("")
  const [goal, setGoal] = useState<Goal | null>(null)

  const canContinue = step === 0 ? orgName.trim().length > 0 : true

  function handleOrgNameChange(value: string) {
    setOrgName(value)
    if (!slugCustom) setSlug(slugify(value))
  }

  function toggleTool(value: ToolId) {
    setTools((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      if (value === "other-tool" && !next.has("other-tool")) setOtherTool("")
      return next
    })
  }

  // Creates the org for real and shows the completion screen — not deferred to
  // the "Enter workspace" click, since that screen's copy ("we've created
  // your workspace") should already be true by the time it's shown.
  async function createWorkspaceAndShowCompletion() {
    setSubmitting(true)
    try {
      const metadata = {
        role,
        tools: Array.from(tools).map((t) => (t === "other-tool" ? otherTool.trim() || "Other" : t)),
        goal,
      }

      const created = await authClient.organization.create({
        name: orgName.trim(),
        slug: slug || slugify(orgName),
        metadata,
      })
      if (created.error || !created.data) {
        toast.error(created.error?.message ?? "Could not create your workspace.")
        return
      }

      const activated = await authClient.organization.setActive({
        organizationId: created.data.id,
      })
      if (activated.error) {
        toast.error(activated.error.message ?? "Workspace created, but could not activate it.")
        return
      }

      setStep(TOTAL_STEPS)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function enterWorkspace() {
    router.replace("/dashboard/overview")
    router.refresh()
  }

  function next() {
    if (step === 0 && orgName.trim().length === 0) return
    if (step === TOTAL_STEPS) {
      enterWorkspace()
      return
    }
    if (step === TOTAL_STEPS - 1) {
      void createWorkspaceAndShowCompletion()
      return
    }
    setStep((s) => s + 1)
  }
  function back() {
    if (step > 0) setStep((s) => s - 1)
  }
  function skipToEnd() {
    void createWorkspaceAndShowCompletion()
  }

  const summaryChips = useMemo(() => {
    const chips: string[] = []
    if (role) chips.push(ROLE_OPTIONS.find((r) => r.value === role)!.label)
    if (tools.size) {
      chips.push(
        Array.from(tools)
          .map((t) => (t === "other-tool" ? otherTool.trim() || "Other" : TOOL_OPTIONS.find((o) => o.value === t)!.label))
          .join(", ")
      )
    }
    if (goal) chips.push(GOAL_OPTIONS.find((g) => g.value === goal)!.label)
    return chips
  }, [role, tools, otherTool, goal])

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-5 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_32rem_at_50%_8%,oklch(0.432_0.095_166.913/0.14),transparent_62%)] dark:bg-[radial-gradient(46rem_32rem_at_50%_8%,oklch(0.432_0.095_166.913/0.14),transparent_62%)]"
      />

      {step > 0 && step < TOTAL_STEPS && (
        <button
          type="button"
          onClick={skipToEnd}
          disabled={submitting}
          className="absolute top-7 right-7 z-10 text-sm text-muted-foreground/70 hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          Skip setup
        </button>
      )}

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-10 flex items-center gap-2">
          <TraceLogo variant="brand" size={26} showText={false} />
          <span className="text-base font-semibold tracking-tight">trace</span>
        </div>

        <div className="mb-8 flex w-32 gap-1.5" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <i
              key={i}
              className={cn(
                "h-[3px] flex-1 overflow-hidden rounded-full bg-border",
                (i < step || i === step) && "relative"
              )}
            >
              <span
                className={cn(
                  "absolute inset-0 origin-left bg-primary transition-transform duration-500 ease-out",
                  i < step ? "scale-x-100" : i === step ? "scale-x-100" : "scale-x-0"
                )}
              />
            </i>
          ))}
        </div>

        <div className="flex min-h-80 w-full flex-col items-center">
          {step === 0 && (
            <div className="flex w-full flex-col items-center">
              <p className="mb-4 font-mono text-[0.6875rem] text-muted-foreground/70">Step 1 of {TOTAL_STEPS}</p>
              <h1 className="mb-2.5 text-2xl font-semibold tracking-tight text-balance">Name your workspace</h1>
              <p className="mb-8 max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                This is where your projects and memory will live. You can invite teammates later.
              </p>
              <div className="w-full max-w-sm">
                <Input
                  autoFocus
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="Acme Inc."
                  maxLength={60}
                  className="h-11 rounded-none border-x-0 border-t-0 border-b-[1.5px] border-input bg-transparent px-1 text-center text-[1.0625rem] shadow-none focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canContinue) next()
                  }}
                />
              </div>
              <div className="mt-3.5 flex min-h-5 items-center justify-center gap-1.5 text-[0.8125rem] text-muted-foreground/70">
                <span>Identifier:</span>
                {editingSlug ? (
                  <input
                    autoFocus
                    defaultValue={slug}
                    maxLength={40}
                    className="w-40 rounded-md border border-input bg-card px-1.5 py-0.5 text-center font-mono text-[0.8125rem] text-foreground outline-none focus-visible:border-primary"
                    onBlur={(e) => {
                      setSlug(slugify(e.target.value) || slugify(orgName))
                      setSlugCustom(true)
                      setEditingSlug(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur()
                    }}
                  />
                ) : (
                  <>
                    <span className="font-mono text-muted-foreground">{slug || "—"}</span>
                    <button
                      type="button"
                      onClick={() => setEditingSlug(true)}
                      className="underline decoration-dotted underline-offset-2 hover:text-muted-foreground"
                    >
                      edit
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex w-full flex-col items-center">
              <p className="mb-4 font-mono text-[0.6875rem] text-muted-foreground/70">
                Step 2 of {TOTAL_STEPS} &middot; optional
              </p>
              <h1 className="mb-2.5 text-2xl font-semibold tracking-tight text-balance">What best describes you?</h1>
              <p className="mb-8 max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                Helps us tailor a few defaults. Nothing else changes.
              </p>
              <div className="flex w-full max-w-sm flex-col gap-2" role="radiogroup" aria-label="Your role">
                {ROLE_OPTIONS.map((opt) => (
                  <RadioTile key={opt.value} label={opt.label} selected={role === opt.value} onSelect={() => setRole(opt.value)} />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex w-full flex-col items-center">
              <p className="mb-4 font-mono text-[0.6875rem] text-muted-foreground/70">
                Step 3 of {TOTAL_STEPS} &middot; optional
              </p>
              <h1 className="mb-2.5 text-2xl font-semibold tracking-tight text-balance">Which tools do you use?</h1>
              <p className="mb-8 max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                We&apos;ll set your Rules template to match.
              </p>
              <div className="grid w-full grid-cols-4 gap-2.5" aria-label="Tools you use">
                {TOOL_OPTIONS.map(({ value, label, Icon }) => {
                  const selected = tools.has(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTool(value)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2.5 rounded-xl border bg-card px-2 py-4 transition-colors",
                        selected ? "border-primary bg-primary/10" : "border-border hover:border-border/80 hover:bg-muted/40"
                      )}
                    >
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="size-2.5" strokeWidth={3} />
                        </span>
                      )}
                      <Icon className="size-6 text-foreground" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  )
                })}
              </div>
              <div
                className={cn(
                  "w-full max-w-sm overflow-hidden transition-all",
                  tools.has("other-tool") ? "mt-4 max-h-16 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <Input
                  value={otherTool}
                  onChange={(e) => setOtherTool(e.target.value)}
                  placeholder="Name your tool"
                  maxLength={60}
                  className="h-10 text-center"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex w-full flex-col items-center">
              <p className="mb-4 font-mono text-[0.6875rem] text-muted-foreground/70">
                Step 4 of {TOTAL_STEPS} &middot; optional
              </p>
              <h1 className="mb-2.5 text-2xl font-semibold tracking-tight text-balance">What brought you to trace?</h1>
              <p className="mb-8 max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                One-line answer is fine — this just shapes what we show you first.
              </p>
              <div className="flex w-full max-w-sm flex-col gap-2" role="radiogroup" aria-label="Your goal">
                {GOAL_OPTIONS.map((opt) => (
                  <RadioTile key={opt.value} label={opt.label} selected={goal === opt.value} onSelect={() => setGoal(opt.value)} />
                ))}
              </div>
            </div>
          )}

          {step === TOTAL_STEPS && (
            <div className="flex w-full flex-col items-center">
              <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CheckIcon className="size-5" />
              </div>
              <h1 className="mb-2.5 text-2xl font-semibold tracking-tight text-balance">
                {orgName.trim() ? `${orgName.trim()} is ready` : "You're set up"}
              </h1>
              <p className="mb-3 max-w-[30ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                We&apos;ve created your workspace. Let&apos;s create your first project.
              </p>
              {summaryChips.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {summaryChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.78125rem] text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-9 flex w-full items-center justify-center gap-6">
          {step > 0 && step < TOTAL_STEPS && (
            <Button type="button" variant="ghost" onClick={back} disabled={submitting} className="text-muted-foreground">
              Back
            </Button>
          )}
          {step > 0 && step < TOTAL_STEPS && (
            <Button type="button" variant="ghost" onClick={next} disabled={submitting} className="text-muted-foreground">
              Skip this step
            </Button>
          )}
          <Button type="button" onClick={next} disabled={!canContinue || submitting} size="lg" className="px-6">
            {submitting ? "Setting up…" : step === TOTAL_STEPS ? "Enter workspace" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
