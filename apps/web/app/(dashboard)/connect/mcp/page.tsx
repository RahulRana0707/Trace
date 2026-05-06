import { McpSetupSnippets } from "@/components/connect/mcp-setup-snippets"

export default function ConnectMcpPage() {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">MCP</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Connect trace to your coding agent via MCP so it can record structured reasoning and
          retrieve relevant past decisions when needed.
        </p>
      </div>
      <McpSetupSnippets />
    </div>
  )
}
