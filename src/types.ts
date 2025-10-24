export interface MCPRequest {
  type: "mcp-call" | "mcp-discover";
  provider?: string;
  operation?: string;
  parameters?: Record<string, any>;
}

export interface MCPTool {
  description: string;
  parameters: Record<string, string>;
  handler: (params: Record<string, any>) => Promise<any>;
}

export interface MCPResource {
  type: string;
  description: string;
  getData: () => Promise<any>;
}

export interface MCPPreset {
  role: string;
  content: string;
}
