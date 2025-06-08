import dotenv from "dotenv";
import pkg from "@slack/bolt";
const { App } = pkg;

// 環境変数を読み込み
dotenv.config();

// ボットトークンと Signing Secret を使ってアプリを初期化します
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // 追加
  appToken: process.env.SLACK_APP_TOKEN, // 追加
});

app.event("reaction_added", async ({ event, client }) => {
  const channelId = event.item.channel;
  const ts = event.item.ts;

  const channel = await client.conversations.history({
    channel: channelId,
    oldest: ts,
    inclusive: true,
    limit: 1,
  });
  const message = channel.messages[0].text;

  await client.chat.postMessage({
    channel: channelId,
    text: message,
    thread_ts: ts,
  });
});

(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000);

  app.logger.info("⚡️ Bolt app is running!");
})();
