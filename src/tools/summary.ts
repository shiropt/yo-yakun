import { createTool } from "@voltagent/core";
import { z } from "zod";

export const summaryTool = createTool({
  name: "message_summarizer",
  description: "指定されたmessageの内容を日本語で要約します",
  parameters: z.object({
    message: z.string(),
  }),
  execute: async ({ message }) => {
    return `${message}の内容を簡潔に日本語で要約してください。英語ではなく日本語で回答してください：



【重要】上記の内容を日本語で分かりやすく要約してください。回答は必ず日本語でお願いします。`;
  },
});

export const urlSummarizerTool = createTool({
  name: "url_summarizer",
  description: "指定されたURLの内容を日本語で要約します",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async ({ url }) => {
    const response = await fetch(url);

    const text = await response.text();

    return `以下のURLの内容を必ず日本語で要約してください。英語ではなく日本語で回答してください：

URL: ${url}

内容:
${text}

【重要】上記の内容を日本語で分かりやすく要約してください。回答は必ず日本語でお願いします。`;
  },
});
