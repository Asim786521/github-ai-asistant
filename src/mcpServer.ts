import { MCPRequest, MCPTool, MCPResource, MCPPreset } from "./types";
import { githubProvider } from "./providers/githubProvider";

interface MCPServer {
  tools: Record<string, MCPTool>;
  resources: Record<string, MCPResource>;
  prompts: Record<string, MCPPreset>;
  handleRequest: (req: MCPRequest) => Promise<any>;
}

export const mcpServer: MCPServer = {
  // 🛠️ Tools
  tools: {
    get_pull_requests: {
      description: "Fetch merged pull requests from a GitHub repository",
      parameters: {
        repo: "string",
        state: "string",
        merged_after: "string",
      },
      handler: githubProvider,
    },
  },

  // 📦 Resources
  resources: {
    githubContext: {
      type: "context",
      description: "Information about the current GitHub repository",
      async getData() {
        return { repo: "example/repo", branch: "main" };
      },
    },
  },

  // 🧠 Prompts
  prompts: {
    summarizePRs: {
      role: "system",
      content: "You are a GitHub assistant. Summarize pull requests clearly and concisely.",
    },
  },

  // 🔄 Request Handler
  async handleRequest(req: MCPRequest) {
    if (req.type === "mcp-discover") {
      return {
        tools: Object.keys(this.tools),
        resources: Object.keys(this.resources),
        prompts: Object.keys(this.prompts),
      };
    }

    if (req.type === "mcp-call" && req.provider === "github") {
      const tool = this.tools[req.operation!];
      if (!tool) throw new Error(`Unknown operation: ${req.operation}`);
      return tool.handler(req.parameters || {});
    }

    throw new Error(`Unsupported request type: ${req.type}`);
  },
};
