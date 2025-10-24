import { mcpServer } from "./mcpServer";
import { MCPRequest } from "./types";

// Acts as intermediary between modelWrapper and MCP server
export async function mcpClient(req: MCPRequest) {
  try {
    return await mcpServer.handleRequest(req);
  } catch (err: any) {
    console.error("MCP error:", err.message);
    return { error: err.message };
  }
}
