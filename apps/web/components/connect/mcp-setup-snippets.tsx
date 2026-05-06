"use client"

import { useMemo } from "react"
import { CopyIcon } from "lucide-react"

import {
  TRACE_API_KEY_PLACEHOLDER,
  buildHostedMcpServerJsonFragment,
  getHostedMcpHttpUrlForSnippets,
} from "@/lib/connect/mcp-snippet"
import { Button } from "@trace/ui/components/button"
import { Label } from "@trace/ui/components/label"
import { toast } from "@trace/ui/components/sonner"

async function copyLabelled(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  } catch {
    toast.error("Could not copy to clipboard")
  }
}

export function McpSetupSnippets() {
  const hostedUrl = useMemo(() => getHostedMcpHttpUrlForSnippets(), [])

  const hostedPlaceholderJson =
    hostedUrl &&
    buildHostedMcpServerJsonFragment({
      mcpUrl: hostedUrl,
      apiKey: TRACE_API_KEY_PLACEHOLDER,
    })

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Hosted MCP (HTTP)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Connect trace via MCP using your API key from{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="/connect/api-keys">
            API keys
          </a>
          . Paste the key into <code className="font-mono text-xs">Authorization</code> as{" "}
          <code className="font-mono text-xs">Bearer …</code>.
          {hostedUrl ? (
            <>
              {" "}
              Your MCP endpoint is{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs break-all">
                {hostedUrl}
              </code>
              .
            </>
          ) : (
            <>
              {" "}
              Hosted MCP isn&apos;t configured for this deployment yet.
            </>
          )}
        </p>
        <Label className="text-muted-foreground">Hosted MCP configuration</Label>
        {hostedPlaceholderJson ? (
          <>
            <pre className="max-h-56 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
              {hostedPlaceholderJson}
            </pre>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => void copyLabelled("hosted MCP JSON", hostedPlaceholderJson)}
            >
              <CopyIcon className="size-3.5" aria-hidden />
              Copy configuration
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ask your workspace administrator to publish the MCP endpoint for trace.
          </p>
        )}
      </div>
    </div>
  )
}
