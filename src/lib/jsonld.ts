// Builds schema.org JSON-LD objects at build time. Rendered as inline
// <script type="application/ld+json"> tags by BaseLayout — pure static HTML.

import type { CalculatorConfig, CalculatorEntry } from '../types/calculator';
import type { BlogPost } from '../types/blog';
import { BASE_URL, SITE_NAME, OG_IMAGE_URL, LOGO_URL } from '../config/constants';

type Schema = Record<string, unknown>;

// No sameAs: we only list profiles that really exist — add them here when they do.
export function organizationSchema(): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
  };
}

const publisherRef = () => ({
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: SITE_NAME,
  url: `${BASE_URL}/`,
  logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
});

export function collectionPageSchema(opts: {
  name: string;
  url: string;
  description: string;
  items: { name: string; url: string }[];
}): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    url: opts.url,
    description: opts.description,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${BASE_URL}/` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  };
}

// schema.org SoftwareApplication.applicationCategory has no strict enum, but
// these are the conventionally recognized values. Every calculator was
// previously tagged 'UtilitiesApplication' regardless of category.
const APPLICATION_CATEGORY_BY_CATEGORY: Record<string, string> = {
  Finance: 'FinanceApplication',
  'Health & Fitness': 'HealthApplication',
  Mathematics: 'EducationalApplication',
  'Developer Tools': 'DeveloperApplication',
  'E-Commerce': 'BusinessApplication',
  Everyday: 'LifestyleApplication',
  'Home DIY': 'LifestyleApplication',
  Automotive: 'UtilitiesApplication',
  Engineering: 'UtilitiesApplication',
  'Industrial & Trades': 'UtilitiesApplication',
};

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
      applicationCategory: APPLICATION_CATEGORY_BY_CATEGORY[entry.category] ?? 'UtilitiesApplication',
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

  // MathSolver is deliberately NOT emitted: Google's Math Solver feature requires
  // a SolveMathAction whose target URL accepts a typed expression, which these
  // calculators don't support (a placeholder target previously leaked a literal
  // "?expression={math_expression}" URL into the index). Math pages keep a plain
  // LearningResource, which is valid and needs no action target.
  if (entry.categorySlug === 'math') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: entry.title,
      description: entry.description,
      url,
      inLanguage: 'en',
      learningResourceType: 'Calculator',
      educationalUse: 'practice',
      isAccessibleForFree: true,
      provider: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL },
    });
  }

  return schemas;
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
      image: [OG_IMAGE_URL],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      // A named person only when the post really has a profile; otherwise it is
      // the editorial team, which is an Organization, not a Person.
      author:
        post.author.url || post.author.sameAs?.length
          ? {
              '@type': 'Person',
              name: post.author.name,
              ...(post.author.url ? { url: post.author.url } : {}),
              ...(post.author.sameAs?.length ? { sameAs: post.author.sameAs } : {}),
            }
          : { '@type': 'Organization', name: post.author.name, url: `${BASE_URL}/about/` },
      publisher: publisherRef(),
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
