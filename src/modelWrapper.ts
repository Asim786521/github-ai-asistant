import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mcpClient } from "./mcpClient.js";
import { MCPRequest } from "./types.js";
import { generateResponse } from "./config/Geminiconfig.js";
import { compileFunction } from "vm";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function modelWrapper(userMessage: string): Promise<string> {
  try {
 
    const prompt = `
You are a GitHub assistant.
Always return a JSON MCP request for GitHub operations.
Do NOT return any text outside JSON.
User: ${userMessage}
`;

    const result = await  generateResponse(prompt)
console.log("Gemini raw response:", result);
 
    // Strip code fences, markdown, or other wrappers
 
    let maybeMCP=result;
   
    console.log("Parsed MCP request:", maybeMCP);

    // Generic handler: map any known MCP shapes
    const isClassic = maybeMCP.type?.startsWith("mcp-");
    const isEntityFilters = maybeMCP.entity && maybeMCP.filters;
    const isMethodPath = maybeMCP.method && maybeMCP.url;
    const isAPIName = maybeMCP.api_name;

    if (isClassic || isEntityFilters || isMethodPath || isAPIName) {
      // Standardize to MCPRequest
      const standardizedRequest: MCPRequest = {
        ...maybeMCP,
        type: maybeMCP.type || "mcp-call",
        provider: "github",
        parameters: maybeMCP.parameters || {},
        operation: maybeMCP.operation || maybeMCP.method || maybeMCP.api_name,
      };

      console.log("Standardized MCP request:", standardizedRequest);
      const data = await mcpClient(standardizedRequest);
      return `Here’s what I found:\n${JSON.stringify(data, null, 2)}`;
    }

    return result; // fallback to model text if unrecognized

  } catch (err: any) {
    console.error("Gemini API error:", err);
    return `⚠️ Gemini API error: ${err.message}`;
  }
}
