Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/') {
      return new Response(Bun.file('./demo/index.html'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    if (url.pathname === '/styles.css') {
      return new Response(Bun.file('./demo/styles.css'), {
        headers: { 'Content-Type': 'text/css' },
      });
    }
    if (url.pathname === '/parse-ingredient.mjs') {
      // Fresh build per request so the demo always reflects current src
      const result = await Bun.build({
        entrypoints: ['./src/index.ts'],
        target: 'browser',
        format: 'esm',
      });
      if (!result.success) {
        return new Response(result.logs.map(String).join('\n'), {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      return new Response(await result.outputs[0].text(), {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store',
        },
      });
    }
    return new Response('Not Found', { status: 404 });
  },
});
