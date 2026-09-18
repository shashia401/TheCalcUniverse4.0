// Server-side registry helpers — safe to import from Server Components and generateStaticParams.
// The calculator `loader` functions are dynamic imports; never call them at the module level here.

import { calculatorRegistry, getCalculatorById, getCategories, getCalculatorsByCategory } from '@/calculators/registry/index';

export { calculatorRegistry, getCalculatorById, getCategories, getCalculatorsByCategory };
