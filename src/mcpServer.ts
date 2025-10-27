import { MCPRequest, MCPTool, MCPResource, MCPPreset } from "./types.js";
import {
  githubProvider,
  issuesProvider,
  commitsProvider,
  branchesProvider,
} from "./providers/githubProvider.js";

interface MCPServer {
  tools: Record<string, MCPTool>;
  resources: Record<string, MCPResource>;
  prompts: Record<string, MCPPreset>;
  handleRequest: (req: MCPRequest) => Promise<any>;
}

export const mcpServer: MCPServer = {
  tools: {
    get_pull_requests: { description: "Fetch PRs", parameters: {}, handler: githubProvider },
    get_issues: { description: "Fetch issues", parameters: {}, handler: issuesProvider },
    get_commits: { description: "Fetch commits", parameters: {}, handler: commitsProvider },
    get_branches: { description: "Fetch branches", parameters: {}, handler: branchesProvider },
  },

  resources: {
    githubContext: {
      type: "context",
      description: "Current GitHub repo info",
      async getData() {
        return {
          owner: process.env.GITHUB_OWNER || "Asim786521",
          repo: process.env.GITHUB_REPO || "github-ai-asistant",
          branch: process.env.GITHUB_BRANCH || "main",
        };
      },
    },
  },

  prompts: {
    summarizePRs: {
      role: "system",
      content: "Summarize pull requests clearly and concisely.",
    },
    summarizeIssues: {
      role: "system",
      content: "Summarize GitHub issues by title, user, and status.",
    },
    summarizeCommits: {
      role: "system",
      content: "Summarize commit history highlighting messages and authors.",
    },
    summarizeBranches: {
      role: "system",
      content: "Summarize branches with recent activity and protection status.",
    },
  },

  async handleRequest(req: MCPRequest) {
    console.log("📩 [MCP] Incoming request:", req);

    if (req.type === "mcp-discover") {
      return {
        tools: Object.keys(this.tools),
        prompts: Object.keys(this.prompts),
        resources: Object.keys(this.resources),
      };
    }

    let op :any= req.operation;
    let promptKey: keyof typeof this.prompts = "summarizePRs";

    const map = {
      issues: "summarizeIssues",
      pulls: "summarizePRs",
      commits: "summarizeCommits",
      branches: "summarizeBranches",
    } as const;

    for (const [key, val] of Object.entries(map)) {
      if (req.url?.includes(key)) {
        op = `get_${key}`;
        promptKey = val;
        break;
      }
    }

    const tool = this.tools[op];
    if (!tool) throw new Error(`❌ Unknown tool: ${op}`);

    const githubCtx = await this.resources.githubContext.getData();
    let params = { ...githubCtx, ...req.parameters };

    if (req.filters) params = applyDynamicFilters(params, req.filters);

    console.log(`🔧 [MCP] Executing ${op} with:`, params);

    try {
      const data = await tool.handler(params);
      const message = generateNaturalSummary(promptKey, data);
      return { message, data };
    } catch (err: any) {
      console.error(`❌ [MCP] Error in ${op}:`, err.message);
      return { error: err.message };
    }
  },
};

console.log("✅ MCP Server loaded and ready.");

function applyDynamicFilters(params: Record<string, any>, filters: Record<string, any>) {
  for (const [field, cond] of Object.entries(filters)) {
    const { operator, value } = cond as any;
    const now = new Date();

    if (operator === "this_week") {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      params[`${field}_after`] = d.toISOString();
    } else if (operator === "this_month") {
      const d = new Date();
      d.setMonth(now.getMonth() - 1);
      params[`${field}_after`] = d.toISOString();
    } else if (operator === "after") {
      params[`${field}_after`] = new Date(value).toISOString();
    } else if (operator === "equals") {
      params[field] = value;
    }
  }
  return params;
}

function generateNaturalSummary(promptKey: string, data: any[]) {
  if (!data?.length) return "No results found.";

  switch (promptKey) {
    case "summarizePRs":
      return `Found ${data.length} pull requests. Latest: “${data[0].title}” by ${data[0].user}.`;
    case "summarizeIssues":
      return `There are ${data.length} open issues. Example: “${data[0].title}” (${data[0].status}).`;
    case "summarizeCommits":
      return `${data.length} commits found. Latest by ${data[0].author}: “${data[0].message.split("\n")[0]}”.`;
    case "summarizeBranches":
      return `${data.length} branches found. Main branch: ${data.find(b => b.name === "main") ? "exists" : "missing"}.`;
    default:
      return `Retrieved ${data.length} items.`;
  }
}
