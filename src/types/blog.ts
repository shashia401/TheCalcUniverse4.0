export interface BlogAuthor {
  name: string;
  role: string;
  url?: string;
  sameAs?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription: string;
  keywords: string[];
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  category: string;
  categorySlug: string;
  excerpt: string;
  author: BlogAuthor;
  relatedCalculatorId?: string;
  relatedCalculatorPath?: string;
  relatedCalculatorLabel?: string;
  relatedCalculators?: string[];    // Array of calculator IDs
  sections: BlogSection[];
}

export type BlogSection =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'callout'; variant: 'info' | 'tip' | 'warning'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'cta'; heading: string; body: string; buttonLabel: string; path: string };
