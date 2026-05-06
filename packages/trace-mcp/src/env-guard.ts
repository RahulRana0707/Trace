import "dotenv/config"

const raw = process.env.DATABASE_URL?.trim()
if (!raw) {
  console.error(
    "Missing DATABASE_URL. The MCP server uses Postgres directly. Set DATABASE_URL (e.g. in packages/trace-mcp/.env when running from that directory, or export it before starting)."
  )
  process.exit(1)
}
