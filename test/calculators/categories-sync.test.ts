import { describe, it, expect } from 'vitest';
import { categoryMeta, CATEGORY_ICONS, TOTAL_CALCULATOR_COUNT, getCategoryList } from '../../src/calculators/categories';
import { calculatorRegistry, getCategories } from '../../src/calculators/registry';

// categories.ts holds static values so layout components (Header/Footer)
// don't need to import the full ~350 KB registry. These tests guard the
// static values against drift from the real registry.
describe('categories.ts stays in sync with the registry', () => {
  it('TOTAL_CALCULATOR_COUNT matches the registry size', () => {
    expect(TOTAL_CALCULATOR_COUNT).toBe(calculatorRegistry.length);
  });

  it('every registry category slug exists in categoryMeta', () => {
    const slugs = new Set(calculatorRegistry.map((c) => c.categorySlug));
    for (const slug of slugs) {
      expect(categoryMeta[slug], `missing categoryMeta for "${slug}"`).toBeDefined();
      expect(CATEGORY_ICONS[slug], `missing icon for "${slug}"`).toBeDefined();
    }
  });

  it('getCategoryList matches getCategories (minus counts)', () => {
    const light = getCategoryList();
    const full = getCategories();
    expect(light.map(({ name, slug, description, icon }) => ({ name, slug, description, icon })))
      .toEqual(full.map(({ name, slug, description, icon }) => ({ name, slug, description, icon })));
  });
});
