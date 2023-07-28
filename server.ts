import type { Serve } from 'bun';
import open from 'open';

const port = process.env.PORT ?? 3000;

declare global {
  var opened: boolean;
}
globalThis.opened ??= false;
if (!globalThis.opened) {
  setTimeout(() => open(`http://localhost:${port}`), 500);
}
globalThis.opened = true;

export default {
  async fetch(req: Request) {
    const reqAsURL = new URL(req.url);
    if (reqAsURL.pathname.endsWith('dev.ts')) {
      const dev = (await Bun.build({ entrypoints: ['./src/dev.ts'] })).outputs[0];
      return new Response(dev);
    }
    return new Response(Bun.file('./index.html'));
  },
  port,
} satisfies Serve;
