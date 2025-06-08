import slackBolt from "@slack/bolt";
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

// Slack アプリの設定
const app = new slackBolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Slack イベントリスナー
app.event("reaction_added", async ({ event, client }) => {
  const channelId = event.item.channel;
  const ts = event.item.ts;

  const channel = await client.conversations.history({
    channel: channelId,
    oldest: ts,
    inclusive: true,
    limit: 1,
  });

  if (!channel.messages || channel.messages.length === 0) {
    console.log("メッセージが見つかりませんでした");
    return;
  }

  const message = channel.messages[0].text;
  if (!message) {
    console.log("メッセージのテキストが空です");
    return;
  }

  await client.chat.postMessage({
    channel: channelId,
    text: message,
    thread_ts: ts,
  });
});

// アプリケーション起動
(async () => {
  // Slack アプリを起動
  await app.start(process.env.PORT || 3000);
  app.logger.info("⚡️ Bolt app is running!");
})();
