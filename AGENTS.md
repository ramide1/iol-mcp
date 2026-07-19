# iol-mcp

MCP server for IOL (InvertirOnline) API — tools for auth, portfolio, operations, and quotes via stdio transport.

## Commands

- **Install**: `bun install`
- **Run**: `bun run start` (runs `bun src/main.ts`)

No lint, typecheck, or test commands are configured. The codebase has no test infrastructure.

## Architecture

- **Runtime**: Bun (not Node.js)
- **Transport**: stdio (not HTTP)
- **SDK**: `@modelcontextprotocol/sdk` v1.29+
- **Entry**: `src/main.ts` → creates McpServer, calls `registerTools()`, connects to stdio
- **API Base**: `https://api.invertironline.com`

Single flat package, no monorepo.

## Key Files

| File | Role |
|------|------|
| `src/main.ts` | Entry point — server creation + stdio transport |
| `src/tool.ts` | All MCP tool definitions in a single `registerTools()` function |
| `src/tokenManager.ts` | In-memory token store (Map-based, no persistence) |
| `src/request.ts` | HTTP helpers with Bearer auth + maintenance error handling |
| `src/interface.ts` | TypeScript types for all IOL API endpoints |

## Token Flow

- Tokens are stored **in-memory only** (no disk, no DB). Server restart = re-auth required.
- `ensureToken()` (in `tool.ts`) tries: cached access token → refresh token → env password login.
- `IOL_USERNAME` + `IOL_PASSWORD` env vars enable lazy auto-login. Without them, call `get_token` manually.
- `IOL_ENABLE_TRADING=true` or `=1` gates all write operations (buy/sell/cancel/subscribe/rescue/cpd/simplified).

## API Gotchas

- `request.ts` checks every response for `{ status: "maintenance" }` and throws `IOLMaintenanceError` with optional `retryAfter`.
- POST requests that return non-JSON (e.g., empty 200) yield `null` — callers must handle this.
- Token requests use `application/x-www-form-urlencoded` (not JSON). All other API calls use JSON.

## Style

- Zod schemas for all tool input validation.
- All tools are registered in one big function (`registerTools` in `tool.ts`). No per-file tool organization.
- `interface.ts` defines response types for all IOL API endpoints (AccountStatus, Portfolio, Operation, Quote, FCI, etc.).
- `request.ts` uses `any` for raw `fetch()` responses — this is the HTTP plumbing layer, not business logic.
- Some tools use `z.any()` for input schemas (place_cpd, buy_simplified, advisor tools) because the API accepts flexible bodies.
