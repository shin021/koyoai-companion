# こより AIコンパニオン（Cloudflare Workers版）

現在のCloudflareプロジェクトが `npx wrangler deploy` を使うWorkers型だったため、WorkersのStatic Assets + Worker API方式に変更した版です。

## 構成
- `public/` : HTML / CSS / JavaScript
- `src/index.js` : `/api/chat` と静的ファイルを処理
- `wrangler.jsonc` : Workers AI Binding とStatic Assets設定

## Cloudflare
Workers AI binding variable name: `AI`

この版では `@cf/zai-org/glm-4.7-flash` を使用します。
