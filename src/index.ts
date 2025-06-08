import { VoltAgent, Agent, createTool } from "@voltagent/core";
import { GoogleGenAIProvider } from "@voltagent/google-ai";

const googleProvider = new GoogleGenAIProvider({
  apiKey: process.env.GEMINI_API_KEY || "",
});

import { weatherTool } from "./tools/weather.js";

const agent = new Agent({
  name: "Google Gemini Agent",
  instructions: "An agent powered by Google Gemini with useful tools",
  llm: googleProvider,
  model: "gemini-1.5-flash", // Specify the desired Google model ID
  markdown: true,
  tools: [weatherTool],
});

new VoltAgent({
  agents: {
    agent,
  },
});
