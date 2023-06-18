import type { Serve } from 'bun';
import open from 'open';

const port = process.env.PORT ?? 3000;

const dev = (await Bun.build({ entrypoints: ['./src/dev.ts'] })).outputs[0];

setTimeout(() => open(`http://localhost:${port}`), 500);

export default {
  fetch(req: Request) {
    const reqAsURL = new URL(req.url);
    if (reqAsURL.pathname.endsWith('dev.ts')) {
      return new Response(dev);
    }
    return new Response(Bun.file('./index.html'));
  },
  port,
} satisfies Serve;
