// Build-time blog helpers. v2 fetched post content with client-side JS at runtime —
// which meant the body of every blog post was invisible to crawlers. Here content is
// imported at build time and rendered into static HTML. Never reintroduce runtime fetch.

import type { BlogSection } from '../types/blog';
export { blogPosts, getBlogPostBySlug } from '../blog/registry';

interface PostContent {
  sections: BlogSection[];
  keywords: string[];
}

const contentModules = import.meta.glob<{ default: PostContent }>(
  '../blog/posts-content/*.json'
);

export async function loadPostContent(slug: string): Promise<PostContent | null> {
  const mod = contentModules[`../blog/posts-content/${slug}.json`];
  if (!mod) return null;
  return (await mod()).default;
}

/** Normalize an internal link to the 4.0 URL scheme: leading + trailing slash, no /en/. */
export function normalizeInternalPath(path: string): string {
  let p = path.trim();
  if (p.startsWith('/en/')) p = p.slice(3);
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.endsWith('/') && !p.includes('.') && !p.includes('#') && !p.includes('?')) p = `${p}/`;
  return p;
}
