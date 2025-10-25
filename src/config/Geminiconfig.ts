import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey: string = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Model configuration
const generationConfig = {
  temperature: 0.0,       // deterministic output
  maxOutputTokens: 256,   // adjust as needed
  topP: 0.95,
  topK: 64,
};

// Get the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // or 1.5-pro-latest
  generationConfig,
});

// Generate content safely
export async function generateResponse(prompt: string) {
  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();

  console.log("Raw Model response:", rawText);

  // Remove markdown/code fences
  const cleanedText = rawText.replace(/^```.*\n?/, "").replace(/```$/, "").trim();

  console.log("Cleaned Model response:", cleanedText);

  // Try parsing JSON
  let maybeJSON: any;
  try {
    maybeJSON = JSON.parse(cleanedText);
    console.log("Parsed JSON:", maybeJSON);
    return maybeJSON;
  } catch (err) {
    console.warn("Response is not valid JSON, returning raw text.");
    return cleanedText; // fallback
  }

  return maybeJSON;
}

// Example usage
(async () => {
  const prompt = "Return a JSON MCP request to list merged pull requests this week.";
  const data = await generateResponse(prompt);
  console.log("Final parsed output:", data);
})();
