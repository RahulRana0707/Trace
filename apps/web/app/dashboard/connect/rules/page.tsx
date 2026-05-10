import { RulesPageClient } from "@/components/connect/rules-page-client"

export default function ConnectRulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rules</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Copy a rules template into your editor so agents know when to use trace
          (MCP) for storing and retrieving decision memory.
        </p>
      </div>

      <RulesPageClient />
    </div>
  )
}
