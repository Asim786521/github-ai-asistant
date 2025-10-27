import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mcpClient } from "./mcpClient.js";
import { MCPRequest } from "./types.js";
import { generateResponse } from "./config/Geminiconfig.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function modelWrapper(userMessage: string): Promise<string> {
  try {
    console.log("💬 [modelWrapper] Incoming user message:", userMessage);

    // Step 1: Create structured prompt
  const prompt = buildDynamicPrompt(userMessage);


    // Step 2: Get Gemini response
    const rawResponse = await generateResponse(prompt);
    console.log("🪄 [Gemini] Raw response:", rawResponse);

    // Step 3: Normalize to string (safe for both string/object outputs)
    let rawText =
      typeof rawResponse === "string"
        ? rawResponse
        : JSON.stringify(rawResponse);

    // Step 4: Clean text (remove markdown or code fences)
    const cleaned = rawText
      .replace(/```json|```/g, "")
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
      .trim();

    console.log("🧩 [modelWrapper] Cleaned output:", cleaned);

    // Step 5: Try parsing as JSON
    let maybeMCP: any;
    try {
      maybeMCP = JSON.parse(cleaned);
    } catch {
      console.warn("⚠️ Model output not valid JSON, returning as text.");
      return `🤖 AI Response: ${rawText}`;
    }

    console.log("✅ [modelWrapper] Parsed MCP request:", maybeMCP);

    // Step 6: Recognize valid MCP shapes
    const isClassic = maybeMCP.type?.startsWith("mcp-");
    const isEntityFilters = maybeMCP.entity && maybeMCP.filters;
    const isMethodPath = maybeMCP.method && maybeMCP.url;
    const isAPIName = maybeMCP.api_name;

    if (isClassic || isEntityFilters || isMethodPath || isAPIName || maybeMCP.operation) {
      const standardizedRequest: MCPRequest = {
        type: maybeMCP.type || "mcp-call",
        provider: "github",
        operation:
          maybeMCP.operation ||
          maybeMCP.api_name ||
          maybeMCP.method ||
          "unknown",
        parameters: maybeMCP.parameters || {},
        filters: maybeMCP.filters || {},
      };

      console.log("📦 [modelWrapper] Standardized MCP request:", standardizedRequest);

      // Step 7: Call MCP client
      const data = await mcpClient(standardizedRequest);

      // Step 8: Format output neatly
      if (data?.summary && data?.data) {
        return `✨ ${data.summary}\n\n${JSON.stringify(data.data, null, 2)}`;
      }

      return `Here’s what I found:\n${JSON.stringify(data, null, 2)}`;
    }

    // Fallback if no valid MCP pattern
    return `🤖 AI Response: ${rawText}`;
  } catch (err: any) {
    console.error("❌ [modelWrapper] Error:", err);
    return `⚠️ Gemini or MCP error: ${err.message}`;
  }
}

// 🧠 Dynamic prompt builder
function buildDynamicPrompt(userMessage: string): string {
  const examples = [
    {
      description: "Get merged pull requests this week",
      json: {
        operation: "get_pull_requests",
        parameters: { owner: "Asim786521", repo: "github-ai-asistant" },
        filters: { merged_at: { operator: "this_week" } },
      },
    },
    {
      description: "List open issues with label 'bug'",
      json: {
        operation: "get_issues",
        parameters: { owner: "Asim786521", repo: "github-ai-asistant" },
        filters: { state: { operator: "equals", value: "open" }, labels: { operator: "equals", value: "bug" } },
      },
    },
    {
      description: "Show commits from the last 7 days",
      json: {
        operation: "get_commits",
        parameters: { owner: "Asim786521", repo: "github-ai-asistant", branch: "develop" },
        filters: { committed_at: { operator: "this_week" } },
      },
    },
    {
      description: "List all branches",
      json: {
        operation: "get_branches",
        parameters: { owner: "Asim786521", repo: "github-ai-asistant" },
      },
    },
  ];

  return `
You are an intelligent GitHub assistant.
Your job is to translate a natural-language user query into a valid JSON MCP request
for GitHub operations such as pull requests, issues, commits, or branches.

Follow these rules:
- Output *only* valid JSON (no markdown, no comments, no text).
- Choose the correct operation and filters based on the user’s intent.
- Do not add explanations or words outside JSON.
- Always include "operation", "parameters", and optional "filters".

Available examples:
${examples
  .map(
    (ex) =>
      `- ${ex.description}:\n${JSON.stringify(ex.json, null, 2)}`
  )
  .join("\n\n")}

Now generate the correct JSON MCP request for:
"${userMessage}"
`;
}
