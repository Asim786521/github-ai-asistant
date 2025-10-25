import { mcpServer } from "./mcpServer.js";
import { MCPRequest } from "./types.js";

// Acts as intermediary between modelWrapper and MCP server
export async function mcpClient(req: MCPRequest) {
  console.log("Sending request to MCP Server:", req);

  try {
    const res = await mcpServer.handleRequest(req);
    console.log("Received response from MCP Server:", res);
    return res;
  } catch (err: any) {
    console.error("MCP error:", err.message);
    return { error: err.message };
  }
}
