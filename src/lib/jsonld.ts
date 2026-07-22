// Builds schema.org JSON-LD objects at build time. Rendered as inline
// <script type="application/ld+json"> tags by BaseLayout — pure static HTML.

import type { CalculatorConfig, CalculatorEntry } from '../types/calculator';
import type { BlogPost } from '../types/blog';
import { BASE_URL, SITE_NAME } from '../config/constants';

type Schema = Record<string, unknown>;

export function calculatorUrl(entry: CalculatorEntry): string {
  return `${BASE_URL}/${entry.categorySlug}/${entry.id}/`;
}

export function buildCalculatorSchemas(entry: CalculatorEntry, config: CalculatorConfig): Schema[] {
  const url = calculatorUrl(entry);

  const schemas: Schema[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: entry.title,
      description: entry.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      url,
      provider: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      // NOTE: no `reviewedBy` Person — we don't emit expert-review structured
      // data unless a real, verifiable review exists. Fabricated E-E-A-T signals
      // are a penalty risk and deceptive on YMYL topics.
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: entry.category, item: `${BASE_URL}/${entry.categorySlug}/` },
        { '@type': 'ListItem', position: 3, name: entry.shortTitle ?? entry.title, item: url },
      ],
    },
  ];

  const faqs = config.educational?.faqs;
  if (faqs?.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  // NOTE: HowTo schema intentionally omitted — Google deprecated HowTo rich
  // results (Sept 2023), so it produces no SERP benefit and only adds markup
  // weight / "unsupported type" noise in Search Console. The how-to-use steps
  // still render on-page in EducationalSection.

  // MathSolver only fits genuine math problem solvers — emitting it on finance/
  // health/etc. calculators is inappropriate structured data. Gate to the math
  // category (and only when an expression is provided).
  if (entry.categorySlug === 'math' && entry.mathSolverExpression) {
    schemas.push(mathSolverSchema(entry, url));
  }

  return schemas;
}

function mathSolverSchema(entry: CalculatorEntry, url: string): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'MathSolver',
    name: entry.title,
    url,
    eduQuestionType: 'Word problem',
    mathExpression: entry.mathSolverExpression,
  };
}

export function buildBlogSchemas(post: BlogPost): Schema[] {
  const url = `${BASE_URL}/blog/${post.slug}/`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: post.publishedAt,
      ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
      author: {
        '@type': 'Person',
        name: post.author.name,
        ...(post.author.url ? { url: post.author.url } : {}),
        ...(post.author.sameAs?.length ? { sameAs: post.author.sameAs } : {}),
      },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL },
      ...(post.keywords?.length ? { keywords: post.keywords.join(', ') } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog/` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
}
