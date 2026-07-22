import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PermutationCombinationPanel from './PermutationCombinationPanel';

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function permutation(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

function combination(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

const permCombConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'n',
      label: 'Total Items (n)',
      type: 'number',
      placeholder: '5',
      min: 0,
      max: 170,
      step: 1,
      required: true,
      helpText: 'The total number of items to choose from (n ≥ 0)',
    },
    {
      id: 'r',
      label: 'Items Chosen (r)',
      type: 'number',
      placeholder: '3',
      min: 0,
      max: 170,
      step: 1,
      required: true,
      helpText: 'How many items you are selecting (r ≥ 0)',
    },
    {
      id: 'orderMatters',
      label: 'Does Order Matter?',
      type: 'select',
      required: true,
      options: [
        { label: 'Yes — Order Matters (Permutation)', value: 'permutation' },
        { label: 'No — Order Does Not Matter (Combination)', value: 'combination' },
      ],
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.n);
    const r = parseInt(values.r);
    const orderMatters = values.orderMatters === 'permutation';

    if (isNaN(n) || isNaN(r)) return [];
    if (n < 0 || r < 0 || r > n) return [];
    if (n > 170) return [];

    const fmt = (num: number): string => {
      if (!isFinite(num)) return 'Infinity';
      if (Number.isInteger(num) && num < 1e15) return num.toLocaleString(undefined);
      return num.toExponential(6);
    };

    const isPerm = orderMatters;
    const typeLabel = isPerm ? 'Permutation' : 'Combination';
    const result = isPerm ? permutation(n, r) : combination(n, r);
    const symbol = isPerm ? 'P' : 'C';

    return [
      {
        id: 'result',
        label: `${typeLabel}: ${n}${symbol}${r}`,
        value: fmt(result),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'type',
        label: 'Type',
        value: typeLabel,
        color: 'neutral' as const,
      },
      {
        id: 'formula',
        label: 'Formula',
        value: isPerm
          ? `P(${n},${r}) = ${n}! / (${n} − ${r})!`
          : `C(${n},${r}) = ${n}! / (${r}! × (${n} − ${r})!)`,
        color: 'neutral' as const,
      },
      {
        id: 'formulaApplied',
        label: 'Formula Applied',
        value: isPerm
          ? `${n}! / ${n - r}! = ${fmt(factorial(n))} / ${fmt(factorial(n - r))} = ${fmt(result)}`
          : `${n}! / (${r}! × ${n - r}!) = ${fmt(factorial(n))} / (${fmt(factorial(r))} × ${fmt(factorial(n - r))}) = ${fmt(result)}`,
        color: 'neutral' as const,
      },
      {
        id: 'nFactorial',
        label: 'n!',
        value: fmt(factorial(n)),
        color: 'neutral' as const,
      },
      {
        id: 'rFactorial',
        label: 'r!',
        value: fmt(factorial(r)),
        color: 'neutral' as const,
      },
      {
        id: 'nMinusRFactorial',
        label: '(n−r)!',
        value: fmt(factorial(n - r)),
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PermutationCombinationPanel, { values, results });
  },
  educational: {
    formula: 'P(n,r) = n!/(n−r)! | C(n,r) = n!/(r!(n−r)!)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Permutations vs Combinations</text><text x="220" y="52" text-anchor="middle" font-size="13" fill="var(--svg-666666)">Choosing r items from a set of n distinct items</text><circle cx="60" cy="100" r="22" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="60" y="105" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">A</text><circle cx="130" cy="100" r="22" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="130" y="105" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">B</text><circle cx="200" cy="100" r="22" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="200" y="105" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">C</text><circle cx="270" cy="100" r="22" fill="var(--svg-ef4444)" fill-opacity=".2" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="270" y="105" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-ef4444)">D</text><circle cx="340" cy="100" r="22" fill="var(--svg-ef4444)" fill-opacity=".2" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="340" y="105" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-ef4444)">E</text><text x="220" y="150" text-anchor="middle" font-size="12" fill="var(--svg-666666)">n = 5 items &nbsp;&nbsp; r = 2 selected (D, E shown highlighted)</text><text x="220" y="195" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Key Formulas</text><text x="220" y="218" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Permutation (order matters): P(n,r) = n! / (n&minus;r)!</text><text x="220" y="241" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Combination (order does not matter): C(n,r) = n! / (r!(n&minus;r)!)</text><text x="220" y="270" text-anchor="middle" font-size="12" fill="var(--svg-666666)">P(5,2) = 20 ways &nbsp;&nbsp; C(5,2) = 10 ways</text><text x="220" y="295" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Permutations count arrangements; combinations count selections</text><text x="220" y="318" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Combinations divide by r! to remove duplicate orderings</text></svg>',
      alt: 'Five labeled circles representing n distinct items with two highlighted as selected, showing permutation and combination formulas',
      caption: 'Permutations count ordered arrangements; combinations count unordered selections',
    },
    formulaDescription:
      'Permutations count arrangements where order matters. Combinations count selections where order does not matter. The key difference is dividing by r! in combinations to eliminate counting different orders as distinct outcomes.',
    variables: [
      { symbol: 'n', name: 'Total Items', description: 'The total number of distinct items available to choose from. Must be a non-negative integer up to 170.' },
      { symbol: 'r', name: 'Items Chosen', description: 'How many items you are selecting at a time. Must be between 0 and n.' },
      { symbol: 'n!', name: 'n Factorial', description: 'The product of all positive integers from 1 to n: n × (n−1) × ... × 1. By convention, 0! = 1.' },
      { symbol: 'P(n,r)', name: 'Permutation', description: 'Number of ways to arrange r items from n when order matters: n!/(n−r)!' },
      { symbol: 'C(n,r)', name: 'Combination', description: 'Number of ways to select r items from n when order does not matter: n!/(r!(n−r)!)' },
    ],
    howToUse: [
      'Enter the total number of items (n) and how many to choose (r). Both must be non-negative integers with r ≤ n.',
      'Toggle "Does Order Matter?" to switch between permutations (order matters) and combinations (order does not matter).',
      'View the result, formula, and detailed step-by-step calculation showing each factorial value.',
      'Compare permutation vs. combination results — notice that combinations are always smaller because order no longer contributes distinct arrangements.',
      'The maximum value of n is 170 due to JavaScript factorial overflow limits. For larger values, use the big-number calculator.',
    ],
    explanation:
      'Permutations and combinations are fundamental counting techniques in combinatorics and probability. Permutations (order matters) count arrangements like passwords ("123" differs from "321"), race rankings (1st, 2nd, 3rd place), and seating arrangements. Combinations (order does not matter) count selections like lottery numbers (the same set of numbers wins regardless of draw order), committee members, and poker hands. The key mathematical insight is that the combination formula is the permutation formula divided by r! — dividing by r! removes the count of different orderings for the same set of items. The factorial function grows extremely fast: 10! = 3,628,800, and 20! is about 2.43 quintillion. This rapid growth is why the calculator caps n at 170 — beyond this, JavaScript\'s number type can no longer represent the factorial exactly. For larger values, you would need the big-number calculator with arbitrary-precision integers. Real-world applications include password security analysis (how many possible 8-character passwords?), tournament bracket design, genetics (gene combinations), and quality control sampling plans.',
    faqs: [
      {
        question: 'What is the difference between permutations and combinations?',
        answer: 'Permutations care about order: ABC, ACB, BAC are all different. Combinations treat ABC, ACB, BAC as the same selection. Think of a race: 1st/2nd/3rd place is a permutation (order matters). Choosing 3 team members is a combination (order does not matter). The combination formula is the permutation formula divided by r! — this removes the count of different orderings.',
      },
      {
        question: 'What does 0! equal and why?',
        answer: '0! = 1 by mathematical convention. There is exactly one way to arrange zero items (the empty arrangement). This convention makes formulas work correctly: C(n,n) = n!/(n!×0!) = 1, meaning there is exactly one way to choose all items.',
      },
      {
        question: 'Can r be greater than n?',
        answer: 'No. You cannot choose more items than are available. If r > n, the calculator returns 0 because there are zero ways to select r items from n available items. This is also why n must be at least r.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Permutation', url: 'https://mathworld.wolfram.com/Permutation.html' },
      { source: 'Wikipedia - Combination', url: 'https://en.wikipedia.org/wiki/Combination' },
    ],
  },
};

export default permCombConfig;
