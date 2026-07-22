// Server-side registry helpers — safe to import from Server Components and generateStaticParams.
// The calculator `loader` functions are dynamic imports; never call them at the module level here.

import { calculatorRegistry, getCalculatorById, getCategories, getCalculatorsByCategory } from '@/calculators/registry/index';

export { calculatorRegistry, getCalculatorById, getCategories, getCalculatorsByCategory };

export function getAllStaticParams() {
  return calculatorRegistry.map((entry) => ({
    category: entry.categorySlug,
    calculator: entry.id,
  }));
}

export function getCategoryStaticParams() {
  const categories = new Set(calculatorRegistry.map((e) => e.categorySlug));
  return Array.from(categories).map((cat) => ({ category: cat }));
}
