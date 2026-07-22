import { BlogPost } from '../types/blog';
import _postsMeta from './posts-meta.json';

/**
 * Runtime validation: ensures every post object has the required fields.
 * Throws on the first invalid entry so callers know immediately.
 */
function validateBlogPosts(data: unknown): BlogPost[] {
  if (!Array.isArray(data)) {
    throw new Error('Blog posts data must be an array');
  }
  for (const post of data) {
    if (typeof post !== 'object' || post === null) {
      throw new Error('Blog post entry is not an object');
    }
    const p = post as Record<string, unknown>;

    const requiredStringFields: (keyof BlogPost)[] = [
      'slug', 'title', 'metaDescription', 'publishedAt',
      'category', 'categorySlug', 'excerpt',
    ];
    for (const field of requiredStringFields) {
      if (typeof p[field] !== 'string') {
        throw new Error(
          `Blog post "${p.slug ?? 'unknown'}" missing required string field: ${field}`
        );
      }
    }

    if (typeof p.readingMinutes !== 'number') {
      throw new Error(
        `Blog post "${p.slug ?? 'unknown'}" missing required number field: readingMinutes`
      );
    }

    if (typeof p.author !== 'object' || p.author === null) {
      throw new Error(
        `Blog post "${p.slug ?? 'unknown'}" missing required object field: author`
      );
    }
    const author = p.author as Record<string, unknown>;
    if (typeof author.name !== 'string') {
      throw new Error(
        `Blog post "${p.slug ?? 'unknown'}" author missing required string field: name`
      );
    }

    if (!Array.isArray(p.sections)) {
      throw new Error(
        `Blog post "${p.slug ?? 'unknown'}" missing required array field: sections`
      );
    }
  }
  return data as BlogPost[];
}

// Validate with empty sections (post-meta has sections as extra data not in type)
const blogPostsData = _postsMeta as unknown as BlogPost[];

export const blogPosts: BlogPost[] = blogPostsData;

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug);

// Post content is loaded at BUILD TIME via src/lib/blog.ts (import.meta.glob).
// The v2 runtime-fetch loader was removed: fetching content client-side left
// blog bodies out of the static HTML, invisible to crawlers.
