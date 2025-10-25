export interface MCPRequest {
  type: string; // e.g., "mcp-call"
  provider?: string;
  url?:string
  method?:string
  operation?: string;
  objectType?:any
  parameters?: Record<string, any>;
  filters?: Record<string, any>; // <-- add this line
 
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
