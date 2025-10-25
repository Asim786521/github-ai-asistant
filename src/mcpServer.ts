import { MCPRequest, MCPTool, MCPResource, MCPPreset } from "./types.js";
import { githubProvider } from "./providers/githubProvider.js";

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
      description: "Fetch merged pull requests from GitHub",
      parameters: {
        owner: "string",
        repo: "string",
        branch: "string",
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
      description: "Current GitHub repository info",
      async getData() {
        return {
          owner: process.env.GITHUB_OWNER || "Asim786521",
          repo: process.env.GITHUB_REPO || "paste-scribe",
          branch: process.env.GITHUB_BRANCH || "main",
        };
      },
    },
  },

  // 🧠 Prompts
  prompts: {
    summarizePRs: {
      role: "system",
      content: "You are a GitHub assistant. Summarize pull requests clearly.",
    },
  },

  // 🔄 Request handler
  async handleRequest(req: MCPRequest) {
    console.log("MCP Request received:", req);

    // 1️⃣ Discovery request
    if (req.type === "mcp-discover") {
      return {
        tools: Object.keys(this.tools),
        resources: Object.keys(this.resources),
        prompts: Object.keys(this.prompts),
      };
    }

    let op = req.operation;

    // 2️⃣ Map model HTTP-style requests to tool names
    if (req.method === "GET" && req.url?.includes("/search/issues")) {
      op = "get_pull_requests";
    }

    const tool = this.tools[op!];

    if (!tool) {
      throw new Error(`Unknown operation: ${op}`);
    }

    // 3️⃣ Prepare parameters from resources and request
    const githubCtx = await this.resources.githubContext.getData();
    const params: Record<string, any> = { ...githubCtx, ...req.parameters };

    // 4️⃣ Handle filters like "this_week"
    if (req.filters?.merged_at?.operator === "this_week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      params.merged_after = oneWeekAgo.toISOString();
      params.state = "closed"; // GitHub uses "closed" for merged PRs
    }

    console.log("Calling GitHub provider with params:", params);

    const result = await tool.handler(params);

    console.log("GitHub provider response:", result);

    return result;
  },
};

console.log("✅ MCP Server loaded, waiting for requests...");
