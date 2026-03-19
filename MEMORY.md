# Memory

- third-party の status page をブラウザから直接取得する構成は CORS で詰まりやすい。公開前提でも API 集約層を先に用意した方が後戻りが少ない。
- Vite の `.vite` は生成物なので、Biome の `files.includes` から除外しておかないと lint が依存コードで壊れる。
- GitHub Pages 配信では `import.meta.env.BASE_URL` を使って静的 JSON の参照先を組み立てないと、リポジトリ配下の公開パスで `/status.json` が壊れる。
- Deno + Vite で daisyUI を入れるときは `deno install -D npm:tailwindcss npm:@tailwindcss/vite npm:daisyui` を使い、`vite.config.ts` に `tailwindcss()`、CSS に `@import "tailwindcss"; @plugin "daisyui";` を入れる。`npm install` が作った `package.json` / `package-lock.json` はこの構成では不要。
- 今回の UI のように独自 CSS が主役の画面は、daisyUI だけで同じ見た目にはならない。`card` `btn` `collapse` `join` `badge` などを土台として重ね、既存のグラデーション・影・余白 CSS は残すのが安全。
- 後からテーマを差し替える前提なら、テーマ名は `src/dashboard-theme.ts` に寄せ、色定義は `src/theme.css` の `[data-theme="..."]` 配下へ閉じ込めると、theme generator の出力へ置換しやすい。
- daisyUI 主体へ寄せるときは、色やトーンを `--color-*` semantic token と `color-mix()` で組み立てると、個別コンポーネントの CSS を触らずに theme だけで印象を変えられる。
