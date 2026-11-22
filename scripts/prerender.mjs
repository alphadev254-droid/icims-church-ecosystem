import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const template = await readFile(join(dist, 'index.html'), 'utf8');
const headSlot = /<title data-route-meta(?:="")?>ICIMS<\/title>/;
const rootSlot = '<div id="root"></div>';

if (!headSlot.test(template) || !template.includes(rootSlot)) {
  throw new Error('The built HTML is missing the prerender template slots.');
}

process.env.NODE_ENV = 'production';
const vite = await createServer({
  configFile: false,
  root,
  mode: 'production',
  appType: 'custom',
  resolve: { alias: { '@': join(root, 'src') } },
  esbuild: { jsx: 'automatic', jsxDev: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, ws: false },
});

async function writePage(file, head, body = '', path = '') {
  const prerendered = path ? ` data-prerendered-path="${path}"` : '';
  const html = template.replace(headSlot, () => head).replace(rootSlot, () => `<div id="root"${prerendered}>${body}</div>`);
  const target = join(dist, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}

try {
  const { renderPublicPage, renderShells, publicPages, SITE_ORIGIN } = await vite.ssrLoadModule('/src/marketing/render-public.tsx');
  const { app, privateApp, notFound } = renderShells();
  await Promise.all([
    writePage('app.html', app),
    writePage('private-app.html', privateApp),
    writePage('404.html', notFound.head, notFound.body),
  ]);

  for (const { path } of publicPages) {
    const { head, body } = await renderPublicPage(path);
    await writePage(path === '/' ? 'index.html' : `${path.slice(1)}.html`, head, body, path);
  }

  const urls = publicPages.filter(page => page.index !== false)
    .map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc></url>`).join('\n');
  await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  console.log(`Prerendered ${publicPages.length} public pages and generated the canonical sitemap.`);
} finally {
  await vite.close();
}
