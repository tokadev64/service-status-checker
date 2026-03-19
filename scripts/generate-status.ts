import { collectStatuses } from '../src/server/status_service.ts';

const OUTPUT_PATH = new URL('../public/status.json', import.meta.url);

const payload = await collectStatuses();

await Deno.mkdir(new URL('../public', import.meta.url), { recursive: true });
await Deno.writeTextFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Wrote ${OUTPUT_PATH.pathname}`);
