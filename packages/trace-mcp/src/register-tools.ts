import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import * as z from "zod"

import {
  getMemoryEntryForProject,
  insertMemoryEntry,
  listMemoryEntriesForProject,
  searchMemoryEntriesForProject,
  serializeMemoryEntry,
} from "@trace/database"

import { requireMcpDbContext } from "./mcp-db-context.js"

function jsonTextResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof value === "string"
            ? value
            : JSON.stringify(value, null, 2),
      },
    ],
  }
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  }
}

const storeInput = {
  intent: z.string().min(1).max(50_000),
  alternativesConsidered: z.string().max(50_000).optional(),
  architectureImpact: z.string().max(50_000).optional(),
  filesTouched: z.array(z.string().max(2048)).max(500).optional(),
  gitCommitRef: z.string().max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}

const listInput = {
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().min(1).optional(),
}

const searchInput = {
  query: z.string().min(1).max(2000),
  limit: z.number().int().min(1).max(25).optional(),
}

const getInput = {
  id: z.string().min(1),
}

async function runMemoryList(args: { limit?: number; cursor?: string }) {
  const { projectId } = requireMcpDbContext()
  const limit = Math.min(
    50,
    Math.max(1, args.limit ?? 20)
  )
  const result = await listMemoryEntriesForProject({
    projectId,
    limit,
    cursor: args.cursor,
  })
  if ("error" in result && result.error === "invalid_cursor") {
    throw new Error("Invalid cursor")
  }
  if (!("items" in result)) {
    throw new Error("Unexpected list error")
  }
  return {
    items: result.items.map(serializeMemoryEntry),
    nextCursor: result.nextCursor,
  }
}

export function createTraceMcpServer(): McpServer {
  const server = new McpServer(
    { name: "trace", version: "0.0.1" },
    { capabilities: { tools: {} } }
  )

  server.registerTool(
    "trace_ping",
    {
      description:
        "Lightweight health check: verifies API key context and returns the bound project id (Postgres reachable via DATABASE_URL).",
    },
    async () => {
      const { projectId } = requireMcpDbContext()
      return jsonTextResult({ ok: true, projectId })
    }
  )

  server.registerTool(
    "trace_store_memory",
    {
      description:
        "Persist one structured memory (intent, alternatives, architecture impact, files, git ref) for the project bound to this API key.",
      inputSchema: storeInput,
    },
    async (args) => {
      const { projectId } = requireMcpDbContext()
      const inserted = await insertMemoryEntry({
        projectId,
        intent: args.intent,
        alternativesConsidered: args.alternativesConsidered ?? null,
        architectureImpact: args.architectureImpact ?? null,
        filesTouched: args.filesTouched ?? [],
        gitCommitRef: args.gitCommitRef ?? null,
        metadata: args.metadata ?? null,
      })
      if (!inserted) {
        return toolError("Could not create memory")
      }
      return jsonTextResult(serializeMemoryEntry(inserted))
    }
  )

  server.registerTool(
    "trace_search_memory",
    {
      description:
        "Keyword search across past memories for the bound project (Phase 1: ILIKE on text fields). Returns short snippets and ids.",
      inputSchema: searchInput,
    },
    async (args) => {
      const { projectId } = requireMcpDbContext()
      const { items } = await searchMemoryEntriesForProject({
        projectId,
        query: args.query,
        limit: args.limit ?? 15,
      })
      const results = items.map((row) => {
        const snippetSource =
          row.intent ||
          row.alternativesConsidered ||
          row.architectureImpact ||
          ""
        return {
          id: row.id,
          snippet:
            snippetSource.length > 320
              ? `${snippetSource.slice(0, 320)}…`
              : snippetSource,
          createdAt: row.createdAt.toISOString(),
        }
      })
      return jsonTextResult({ items: results })
    }
  )

  server.registerTool(
    "trace_get_memory",
    {
      description:
        "Fetch one full memory entry by id for the bound project (use after search or list).",
      inputSchema: getInput,
    },
    async (args) => {
      const { projectId } = requireMcpDbContext()
      const row = await getMemoryEntryForProject(projectId, args.id)
      if (!row) {
        return toolError("Not found")
      }
      return jsonTextResult(serializeMemoryEntry(row))
    }
  )

  server.registerTool(
    "trace_list_recent",
    {
      description:
        "List the most recent memories for the bound project (newest first, cursor-paginated). Same backing data as trace_list_memories; tuned for a “what changed lately?” workflow.",
      inputSchema: listInput,
    },
    async (args) => {
      try {
        const data = await runMemoryList({
          limit: args.limit,
          cursor: args.cursor,
        })
        return jsonTextResult(data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "List failed"
        return toolError(msg)
      }
    }
  )

  server.registerTool(
    "trace_list_memories",
    {
      description:
        "List memories for the project implied by the API key (no project id argument). Supports limit (1–50) and optional opaque cursor from a previous response.",
      inputSchema: listInput,
    },
    async (args) => {
      try {
        const data = await runMemoryList({
          limit: args.limit,
          cursor: args.cursor,
        })
        return jsonTextResult(data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "List failed"
        return toolError(msg)
      }
    }
  )

  return server
}
