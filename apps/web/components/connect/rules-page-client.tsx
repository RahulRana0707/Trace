"use client"

import { useMemo, useState } from "react"
import { CopyIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"

import {
  RULE_TOOLS,
  type RuleToolId,
  getRuleMarkdown,
} from "@/lib/connect/rule-templates"
import { Button } from "@trace/ui/components/button"
import { Label } from "@trace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trace/ui/components/select"
import { toast } from "@trace/ui/components/sonner"
import { cn } from "@trace/ui/lib/utils"

const markdownComponents: React.ComponentProps<
  typeof ReactMarkdown
>["components"] = {
  h2: ({ children }) => (
    <h2
      className={cn(
        "border-b border-border pb-3 text-base font-semibold tracking-tight text-foreground",
        "mt-10 mb-6 first:mt-0 first:mb-6"
      )}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code
          className={cn(
            "my-3 block overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs text-foreground",
            className
          )}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8rem] text-foreground"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8 border-border" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
}

export function RulesPageClient() {
  const [toolId, setToolId] = useState<RuleToolId>("cursor")
  const markdown = useMemo(() => getRuleMarkdown(toolId), [toolId])

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown)
      toast.success("Copied markdown")
    } catch {
      toast.error("Could not copy to clipboard")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="rule-tool-select">Coding tool</Label>
          <Select
            value={toolId}
            onValueChange={(v) => setToolId(v as RuleToolId)}
          >
            <SelectTrigger
              id="rule-tool-select"
              size="default"
              className="w-full"
            >
              <SelectValue placeholder="Choose a tool" />
            </SelectTrigger>
            <SelectContent>
              {RULE_TOOLS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.comingSoon ? `${t.label} (coming soon)` : t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="default"
          onClick={() => void copyMarkdown()}
        >
          <CopyIcon aria-hidden />
          Copy markdown
        </Button>
      </div>

      <div className="rounded-lg border bg-card px-5 py-6 sm:px-8 sm:py-8">
        <h2 className="mb-6 text-sm font-medium text-muted-foreground">
          Rules template
        </h2>
        <div className="max-w-3xl [&>*:first-child]:mt-0">
          <ReactMarkdown components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
