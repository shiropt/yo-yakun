# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「yo-yakun」は、VoltAgentフレームワークを使用したSlackボットです。主な機能：
- Slackで「youyaku」リアクションが付けられたメッセージを要約
- URLが含まれている場合はURLの内容を取得して要約
- Google Gemini AI (gemini-1.5-flash) を使用

## 開発コマンド

```bash
# 依存関係のインストール
yarn

# 開発サーバー起動（tsx watchモード、.envファイル読み込み）
yarn dev

# TypeScriptのビルド
yarn build

# 本番環境での実行
yarn start

# VoltAgent CLIコマンド
yarn volt
```

## 必要な環境変数

`.env`ファイルに以下を設定：
- `GEMINI_API_KEY` - Google Gemini APIキー
- `SLACK_BOT_TOKEN` - SlackボットのOAuthトークン
- `SLACK_SIGNING_SECRET` - Slackアプリの署名シークレット
- `SLACK_APP_TOKEN` - Slackアプリトークン（Socket Mode用）
- `PORT` - ヘルスチェックエンドポイントのポート番号（デフォルト: 3000）

## アーキテクチャ

### メインコンポーネント
- **src/index.ts**: Slackボット + VoltAgentエージェント + Expressヘルスチェック
  - Slack Bolt アプリがSocket Modeで動作
  - Express サーバーが `/healthz` エンドポイントを提供（同じPORTで待受）
  - reaction_added イベントで「youyaku」リアクションを監視

### カスタムツール（src/tools/）
- **summary.ts**: 
  - `message_summarizer`: テキストメッセージの要約
  - `url_summarizer`: URLコンテンツの取得と要約
- **weather.ts**: 天気情報取得ツール（モック実装）

### VoltAgentの設定
- Google Gemini Provider使用
- モデル: gemini-1.5-flash
- エージェントがツールを自動選択して要約を生成

## TypeScript設定
- ES2022ターゲット、NodeNextモジュール
- ESモジュール形式（package.jsonで`"type": "module"`）
- strictモード有効
- 出力先: dist/

## 注意事項
- `.voltagent/`フォルダはVoltAgentが自動生成（エージェントメモリ用）
- テストフレームワークは未導入
- SlackアプリはSocket Modeで動作するため、公開URLは不要