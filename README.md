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

## Build

```bash
deno task build
deno task preview
```

## Test

```bash
deno task check
```

## Notes

- ブラウザから直接 third-party の status page を読むと CORS に阻まれるため、API
  は Hono で集約しています。
- 現在の初期実装は Atlassian Statuspage の `summary.json`
  を利用するサービスを対象にしています。
- 静的フロントは GitHub Pages、API は Deno Deploy を想定しています。
