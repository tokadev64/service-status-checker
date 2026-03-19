import { createApp } from '../src/server/app.ts';

const app = createApp();

Deno.serve({ port: 8000 }, app.fetch);
