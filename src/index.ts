import express, { Request, Response } from "express";
import slackBolt from "@slack/bolt";
import { Agent } from "@voltagent/core";
import { GoogleGenAIProvider } from "@voltagent/google-ai";
import { weatherTool } from "./tools/weather.js";
import { summaryTool, urlSummarizerTool } from "./tools/summary.js";

// Google AI Provider の設定
const googleProvider = new GoogleGenAIProvider({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const port = Number(process.env.PORT || 3000);

// VoltAgent の設定
const agent = new Agent({
  name: "Google Gemini Agent",
  instructions: "An agent powered by Google Gemini with useful tools",
  llm: googleProvider,
  model: "gemini-1.5-flash", // Specify the desired Google model ID
  markdown: true,
  tools: [weatherTool, summaryTool, urlSummarizerTool],
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
  if (event.reaction !== "youyaku") {
    return;
  }

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
    await client.chat.postMessage({
      channel: channelId,
      text: "要約を生成できませんでした",
      thread_ts: ts,
    });
    return;
  }

  // message に URL が含まれている場合は URL を抽出する。
  const url = message.match(/https?:\/\/[^\s]+/);

  const summary = await agent.generateText(url ? url[0] : message);

  await client.chat.postMessage({
    channel: channelId,
    text: summary.text || "要約を生成できませんでした",
    thread_ts: ts,
  });
});

// アプリケーション起動
(async () => {
  // Slack アプリを起動
  await app.start(port);
  app.logger.info(`⚡️ Bolt app is running! on port ${port}`);
})();

const health = express();
health.get("/healthz", (_: Request, res: Response) => {
  res.send("ok");
});

// Render が割り当てた PORT で待受。Bolt 本体とは競合しない
health.listen(Number(process.env.PORT), "0.0.0.0", () =>
  console.log(`Health endpoint on ${process.env.PORT}`)
);
