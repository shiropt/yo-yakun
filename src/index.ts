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

// app_mention イベントリスナー（メンション時のオウム返し機能）
app.event("app_mention", async ({ event, client, say }) => {
  try {
    // メッセージからボットのメンションを除去
    // <@UXXXXXX> 形式のメンションを削除
    const cleanedText = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();
    
    // 空のメッセージの場合はデフォルトメッセージを返す
    const replyText = cleanedText || "メンションありがとうございます！";
    
    // スレッドで返信（元のメッセージがスレッド内の場合はそのスレッドに、そうでなければ新しいスレッドを開始）
    await say({
      text: replyText,
      thread_ts: event.thread_ts || event.ts,
    });
  } catch (error) {
    console.error("app_mention イベントの処理中にエラーが発生しました:", error);
    // エラーが発生した場合でも、ユーザーに通知
    try {
      await client.chat.postMessage({
        channel: event.channel,
        text: "申し訳ありません。メッセージの処理中にエラーが発生しました。",
        thread_ts: event.thread_ts || event.ts,
      });
    } catch (postError) {
      console.error("エラーメッセージの送信に失敗しました:", postError);
    }
  }
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
