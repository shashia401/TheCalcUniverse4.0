import type { CalculatorEntry } from '../types/calculator';
import { calculatorRegistry } from './registry';

/**
 * Category relevance tiers used for cross-category recommendations.
 * Each category maps to related categories in descending order of relevance.
 */
export const CROSS_RELEVANCE: Record<string, string[]> = {
  finance: ['ecommerce', 'math', 'engineering'],
  health: ['everyday', 'math', 'engineering'],
  math: ['engineering', 'everyday', 'finance'],
  ecommerce: ['finance', 'math', 'everyday'],
  diy: ['engineering', 'math', 'everyday'],
  automotive: ['engineering', 'math', 'finance'],
  engineering: ['math', 'diy', 'everyday'],
  everyday: ['math', 'health', 'finance'],
  industrial: ['engineering', 'diy', 'math'],
  devtools: ['math', 'engineering', 'everyday'],
};

/**
 * Get recommended calculators for a given calculator entry.
 *
 * Priority order:
 * 1. Manual `relatedIds` — always first
 * 2. Same category + same subCategory — strongest automatic signal
 * 3. Same category, other subCategories
 * 4. Cross-category scored by seoKeywords overlap + subCategory match
 */
export function getRecommended(
  current: CalculatorEntry,
  count: number,
): CalculatorEntry[] {
  const result: CalculatorEntry[] = [];
  const seen = new Set<string>([current.id]);

  // 1. Manual relatedIds (warn about invalid references)
  if (current.relatedIds) {
    for (const id of current.relatedIds) {
      const entry = calculatorRegistry.find((c) => c.id === id);
      if (entry && !seen.has(id)) {
        result.push(entry);
        seen.add(id);
      } else if (!entry) {
        if (process.env.NODE_ENV === 'development') console.warn(`getRecommended: relatedId "${id}" not found in registry (calculator: ${current.id})`);
      }
    }
  }

  // 2. Same category + same subCategory (only when current has a subCategory)
  if (current.subCategory) {
    const sameSub = calculatorRegistry.filter(
      (c) =>
        c.categorySlug === current.categorySlug &&
        c.subCategory === current.subCategory &&
        !seen.has(c.id),
    );
    for (const entry of sameSub) {
      if (result.length >= count) break;
      result.push(entry);
      seen.add(entry.id);
    }
  }

  // 3. Same category, other subCategories
  if (result.length < count) {
    const sameCat = calculatorRegistry.filter(
      (c) => c.categorySlug === current.categorySlug && !seen.has(c.id),
    );
    for (const entry of sameCat) {
      if (result.length >= count) break;
      result.push(entry);
      seen.add(entry.id);
    }
  }

  // 4. Cross-category with keyword scoring
  if (result.length < count) {
    const currentKeywords = new Set(
      (current.seoKeywords ?? []).map((k) => k.toLowerCase()),
    );
    const relatedSlugs = CROSS_RELEVANCE[current.categorySlug] ?? [];
    const crossRelevant = relatedSlugs.flatMap((slug) =>
      calculatorRegistry.filter((c) => c.categorySlug === slug && !seen.has(c.id)),
    );

    const scored = crossRelevant
      .map((entry) => {
        const overlap = (entry.seoKeywords ?? []).filter((kw) =>
          currentKeywords.has(kw.toLowerCase()),
        ).length;
        return { entry, score: overlap * 2 };
      })
      .filter((s) => s.score > 0);

    scored.sort((a, b) => b.score - a.score);
    for (const { entry } of scored) {
      if (result.length >= count) break;
      if (!seen.has(entry.id)) {
        result.push(entry);
        seen.add(entry.id);
      }
    }
  }

  return result;
}
