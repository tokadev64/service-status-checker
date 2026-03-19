# service-status-checker

各サービスの公式 status page
を集約し、状態だけを一覧表示するアプリケーションです。

## Stack

- Deno
- TypeScript
- Vue 3
- Vite
- Hono
- Biome
- Deno test
- fast-check
- Devbox

## Development

```bash
deno task dev
```

フロントエンドは `http://localhost:5173`、API は `http://localhost:8000`
で起動します。

静的スナップショットを更新したい場合:

```bash
deno task generate:status
```

フロントエンドは本番相当では `/status.json` を読み、ローカルでは
`/status.json` が無い場合のみ `/api/status` にフォールバックします。

## Build

```bash
deno task build
deno task preview
```

GitHub Pages 用の配信物を作る場合は、先に `deno task generate:status`
で最新の `public/status.json` を生成してから build します。

## Test

```bash
deno task check
```

## Deployment

- 本番配信は GitHub Pages を想定しています。
- `.github/workflows/deploy-pages.yml` が 5 分おきに `status.json`
  を再生成して Pages へ再配信します。
- GitHub Actions の `schedule` は最短 5 分なので、3 分更新はできません。

## Notes

- ブラウザから直接 third-party の status page を読むと CORS に阻まれるため、
  ローカル開発では API を Hono で集約しています。
- 本番では API を常時起動せず、GitHub Actions が静的 JSON を更新します。
- 現在の初期実装は Atlassian Statuspage の `summary.json`
  を利用するサービスを中心に、取得元ごとの専用パーサを併用しています。
