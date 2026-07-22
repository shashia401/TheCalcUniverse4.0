import type { CalculatorEntry, CategoryInfo } from '../../types/calculator';
import { financeCalculators } from './finance';
import { everydayCalculators } from './everyday';
import { healthCalculators } from './health';
import { ecommerceCalculators } from './ecommerce';
import { mathCalculators } from './math';
import { diyCalculators } from './diy';
import { automotiveCalculators } from './automotive';
import { engineeringCalculators } from './engineering';
import { industrialCalculators } from './industrial';
import { devtoolsCalculators } from './devtools';

export const calculatorRegistry: CalculatorEntry[] = [
  ...financeCalculators,
  ...everydayCalculators,
  ...healthCalculators,
  ...ecommerceCalculators,
  ...mathCalculators,
  ...diyCalculators,
  ...automotiveCalculators,
  ...engineeringCalculators,
  ...industrialCalculators,
  ...devtoolsCalculators,
];

// ── O(1) lookup maps built at module load ──────────────────────────────

const registryById = new Map<string, CalculatorEntry>();
const registryByCategory = new Map<string, CalculatorEntry[]>();

for (const entry of calculatorRegistry) {
  registryById.set(entry.id, entry);
  const group = registryByCategory.get(entry.categorySlug);
  if (group) {
    group.push(entry);
  } else {
    registryByCategory.set(entry.categorySlug, [entry]);
  }
}

export const getCalculatorById = (id: string): CalculatorEntry | undefined =>
  registryById.get(id);

export const getCalculatorsByCategory = (categorySlug: string): CalculatorEntry[] =>
  registryByCategory.get(categorySlug) ?? [];

export { categoryMeta } from '../categories';
import { categoryMeta, CATEGORY_ICONS } from '../categories';

export const getCategories = (): CategoryInfo[] =>
  Object.values(categoryMeta).map((meta) => ({
    ...meta,
    icon: CATEGORY_ICONS[meta.slug] ?? 'Calculator',
    count: registryByCategory.get(meta.slug)?.length ?? 0,
  }));
