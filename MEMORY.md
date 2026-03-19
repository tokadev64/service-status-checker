# Memory

- third-party の status page をブラウザから直接取得する構成は CORS で詰まりやすい。公開前提でも API 集約層を先に用意した方が後戻りが少ない。
- Vite の `.vite` は生成物なので、Biome の `files.includes` から除外しておかないと lint が依存コードで壊れる。
