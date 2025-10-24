import { mcpClient } from "./mcpClient";
import { MCPRequest } from "./types";

export async function modelWrapper(userMessage: string): Promise<string> {
  // 🧩 Basic intent detection
  if (userMessage.toLowerCase().includes("pull requests")) {
    const request: MCPRequest = {
      type: "mcp-call",
      provider: "github",
      operation: "get_pull_requests",
      parameters: {
        repo: "example/repo",
        state: "merged",
        merged_after: "2025-10-17T00:00:00Z",
      },
    };
    const data = await mcpClient(request);
    return `Merged PRs:\n${data.map((d: any) => `- ${d.title}`).join("\n")}`;
  }

  // Discovery example
  if (userMessage.toLowerCase().includes("discover")) {
    const request: MCPRequest = { type: "mcp-discover" };
    const info = await mcpClient(request);
    return `MCP Server Capabilities:\nTools: ${info.tools.join(", ")}\nResources: ${info.resources.join(", ")}\nPrompts: ${info.prompts.join(", ")}`;
  }

  return "Try asking: 'Summarize all merged GitHub pull requests this week.'";
}
