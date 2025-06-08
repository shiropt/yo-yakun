import { createTool } from "@voltagent/core";
import { z } from "zod";

export const weatherTool = createTool({
  name: "get_weather",
  description: "指定された場所の天気情報を取得します",
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    console.log(`天気情報を取得中: ${location}`);
    const temperature = Math.floor(Math.random() * 30) + 5;
    const conditions = ["晴れ", "曇り", "雨", "雪"];
    const condition = conditions[Math.floor(Math.random() * 4)];
    const humidity = Math.floor(Math.random() * 50) + 30;

    return `${location}の天気: ${condition}、気温: ${temperature}度、湿度: ${humidity}%`;
  },
});
