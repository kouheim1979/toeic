# TOEIC形式 英語トレーナー
## 起動方法
`index.html` を GitHub Pages / Codespaces Preview / HTTPサーバー経由で開きます。
## ローカル確認方法
- `python3 -m http.server 8000`
- `python -m http.server 8000`
## ファイル構成
- `index.html`
- `styles/app.css`
- `src/` (ES Modules)
## 問題追加方法
`src/main.js` の問題配列、または将来的に `src/questions/part*.js` へ追加します。
## 注意事項
- 本アプリはTOEIC公式・公認ではありません。
- 実際のTOEIC過去問・公式問題・公式音声は収録しません。
- ES Modules のため `file://` 直開きでは動作しない環境があります。
