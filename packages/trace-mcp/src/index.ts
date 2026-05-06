#!/usr/bin/env node
import "./env-guard.js"

import { resolveActiveApiKeyToProject } from "@trace/database"
import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"

import { createTraceMcpServer } from "./register-tools.js"
import { mcpDbContext } from "./mcp-db-context.js"

async function mcpAuthMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const h = req.headers.authorization
  if (!h || !h.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32_000,
        message:
          "Unauthorized: send Authorization: Bearer <TRACE_API_KEY> on MCP requests.",
      },
      id: null,
    })
    return
  }
  const token = h.slice(7).trim()
  if (!token) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32_000, message: "Unauthorized: empty bearer token." },
      id: null,
    })
    return
  }

  const resolved = await resolveActiveApiKeyToProject(token)
  if (!resolved) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32_000,
        message: "Unauthorized: invalid or revoked API key.",
      },
      id: null,
    })
    return
  }

  const pidRaw = req.headers["x-trace-project-id"]
  const traceProjectId =
    typeof pidRaw === "string" && pidRaw.trim() ? pidRaw.trim() : undefined
  if (traceProjectId && traceProjectId !== resolved.projectId) {
    res.status(403).json({
      jsonrpc: "2.0",
      error: {
        code: -32_000,
        message: "X-Trace-Project-Id does not match this API key's project.",
      },
      id: null,
    })
    return
  }

  mcpDbContext.run(
    { projectId: resolved.projectId, keyId: resolved.keyId },
    () => next()
  )
}

async function main(): Promise<void> {
  const app = express()
  app.disable("x-powered-by")
  app.use(express.json({ limit: "2mb" }))

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "trace-mcp",
      datastore: "postgres",
    })
  })

  app.get("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32_000, message: "Method not allowed for this endpoint." },
      id: null,
    })
  })

  app.delete("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32_000, message: "Method not allowed for this endpoint." },
      id: null,
    })
  })

  app.post("/mcp", mcpAuthMiddleware, async (req, res) => {
    const mcp = createTraceMcpServer()
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    try {
      await mcp.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      console.error("trace-mcp: MCP request failed", err)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32_603, message: "Internal server error" },
          id: null,
        })
      }
    } finally {
      res.on("close", () => {
        void transport.close()
        void mcp.close()
      })
    }
  })

  const port = Number.parseInt(process.env.PORT ?? "8080", 10)
  app.listen(port, () => {
    console.log(
      `trace-mcp listening on http://localhost:${port}/mcp (Postgres via DATABASE_URL)`
    )
  })
}

void main()
