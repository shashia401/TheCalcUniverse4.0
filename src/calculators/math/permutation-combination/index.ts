import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import PermutationCombinationPanel from './PermutationCombinationPanel';
import { PC_MAX, computePermComb, fmtBigCount } from './permCombMath';

const permCombConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'n',
      label: 'Total Items (n)',
      type: 'number',
      placeholder: '5',
      min: 0,
      max: PC_MAX,
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
      max: PC_MAX,
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
    {
      id: 'repetition',
      label: 'Can Items Repeat?',
      type: 'select',
      defaultValue: 'no',
      options: [
        { label: 'No — each item used at most once', value: 'no' },
        { label: 'Yes — items may be chosen again (with repetition)', value: 'yes' },
      ],
      helpText: 'With repetition: permutations = n^r, combinations = C(n + r − 1, r)',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const p = computePermComb(values.n, values.r, values.orderMatters, values.repetition);
    if (p.kind === 'invalid') return [{ id: 'error', label: 'Error', value: p.message, color: 'negative' }];
    if (p.kind !== 'ok') return [];
    const { n, r, isPerm, repetition, value, symbol, formula, applied, cells } = p.result;
    const typeLabel = isPerm ? 'Permutation' : 'Combination';
    const ids = ['nFactorial', 'rFactorial', 'nMinusRFactorial'] as const;

    return [
      {
        id: 'result',
        label: `${typeLabel}${repetition ? ' with repetition' : ''}: ${symbol}`,
        value: fmtBigCount(value),
        highlight: true,
        color: 'positive' as const,
      },
      ...(value.toString().length > 21 ? [{ id: 'exact', label: 'Exact value', value: value.toString(), color: 'neutral' as const }] : []),
      { id: 'type', label: 'Type', value: typeLabel, color: 'neutral' as const },
      { id: 'formula', label: 'Formula', value: formula, color: 'neutral' as const },
      { id: 'formulaApplied', label: 'Formula Applied', value: applied, color: 'neutral' as const },
      ...cells.map((c, i) => ({ id: ids[i], label: c.label, value: c.value, color: 'neutral' as const })),
    ];
  },
  explainSteps: (values) => {
    const p = computePermComb(values.n, values.r, values.orderMatters, values.repetition);
    if (p.kind !== 'ok') return [];
    const { n, r, isPerm, repetition, formula, applied, cells } = p.result;
    const plug = repetition
      ? `n = ${n}, r = ${r}${isPerm ? '' : `  →  n + r − 1 = ${n + r - 1}`}`
      : `n = ${n}, r = ${r}${r > n ? '' : `  →  n − r = ${n - r}`}`;
    const steps = [
      { label: 'Pick the formula', expr: formula, note: isPerm ? 'Order matters, so each different arrangement counts separately.' : 'Order does not matter, so arrangements of the same items count once.' },
      { label: 'Plug in your numbers', expr: plug },
    ];
    if (cells.length === 3 && !repetition) {
      const [nf, rf, df] = cells;
      steps.push({
        label: 'Work out the factorials',
        expr: isPerm ? `${n}! = ${nf.value},  ${n - r}! = ${df.value}` : `${n}! = ${nf.value},  ${r}! = ${rf.value},  ${n - r}! = ${df.value}`,
      });
    }
    steps.push({ label: 'Substitute and simplify', expr: applied });
    return steps;
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
      { symbol: 'n', name: 'Total Items', description: 'The total number of distinct items available to choose from. Must be a non-negative integer up to 1000.' },
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
      'n and r can be up to 1000. The arithmetic is exact (big integers); results longer than 21 digits are shown in scientific notation with the exact value on its own line.',
    ],
    explanation:
      'Permutations and combinations are fundamental counting techniques in combinatorics and probability. Permutations (order matters) count arrangements like passwords ("123" differs from "321"), race rankings (1st, 2nd, 3rd place), and seating arrangements. Combinations (order does not matter) count selections like lottery numbers (the same set of numbers wins regardless of draw order), committee members, and poker hands. The key mathematical insight is that the combination formula is the permutation formula divided by r! — dividing by r! removes the count of different orderings for the same set of items. The factorial function grows extremely fast: 10! = 3,628,800, and 20! is about 2.43 quintillion. Because the factorial overflows ordinary floating-point numbers beyond 170!, this calculator uses exact big-integer arithmetic and accepts n and r up to 1000. Real-world applications include password security analysis (how many possible 8-character passwords?), tournament bracket design, genetics (gene combinations), and quality control sampling plans.',
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
        answer: 'No. You cannot choose more items than are available. If r > n (and items cannot repeat), the calculator shows 0 because there are zero ways to select r different items from n available items. With repetition allowed, r may exceed n.',
      },
      {
        question: 'What changes when items can repeat?',
        answer: 'Ordered selections with repetition (like PIN codes or passwords) number n^r, because each of the r positions can be any of the n items: 10 digits, 4 positions gives 10^4 = 10,000. Unordered selections with repetition (like choosing 3 scoops from 5 flavours, flavours may repeat) number C(n + r - 1, r): C(7, 3) = 35.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Permutation', url: 'https://mathworld.wolfram.com/Permutation.html' },
      { source: 'Wikipedia - Combination', url: 'https://en.wikipedia.org/wiki/Combination' },
    ],
  },
};

export default permCombConfig;
