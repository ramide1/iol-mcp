import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tool";

// Create server instance
const server: McpServer = new McpServer({
  name: "iol",
  version: "1.0.0",
});

registerTools(server);

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("IOL MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});