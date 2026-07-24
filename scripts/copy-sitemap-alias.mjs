// @astrojs/sitemap emits sitemap-index.xml, but /sitemap.xml is the URL most
// people and tools check by default. Copy it as a real static file so it
// works on any host — no dependency on Apache mod_rewrite being enabled.
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const distDir = path.resolve(fileURLToPath(import.meta.url), '../../dist');
const src = path.join(distDir, 'sitemap-index.xml');
const dest = path.join(distDir, 'sitemap.xml');

if (!existsSync(src)) {
  console.error('copy-sitemap-alias: dist/sitemap-index.xml not found — did the sitemap integration run?');
  process.exit(1);
}
copyFileSync(src, dest);
console.log('copy-sitemap-alias: dist/sitemap.xml written (copy of sitemap-index.xml)');
