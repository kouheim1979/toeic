# Eigo Quest AI Backend

「えいごヒマつぶしクエスト」のAI機能用Vercelバックエンドです。

## 機能
- `/api/transcribe` 音声→英語文字起こし
- `/api/evaluate` REMS風変換文の内容・文法判定
- `/api/chat` AI英会話＋短い訂正
- `/api/tts` AI英語音声
- `/api/generate-drill` 苦手に合わせた独自ドリル生成
- `/api/health` 接続確認

Vercel AI Gatewayを利用し、APIキーをGitHub PagesのHTMLへ置きません。GitHub Pages Origin `https://kouheim1979.github.io` はCORS許可済みです。

本番バックエンドURL（2026-09-15作成）: `https://eigo-quest-ai-kouheim-3013.vercel.app`

## 注意
発音そのものを自動採点する機能ではありません。音声を文字起こしし、そのテキストの内容・文法をAIが評価します。端末のライブ音声認識を優先する設定も利用できます。
