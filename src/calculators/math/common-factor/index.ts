import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CommonFactorPanel from './CommonFactorPanel';

function getFactors(n: number): number[] {
  const factors: number[] = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      factors.push(i);
      if (i !== n / i) factors.push(n / i);
    }
  }
  return factors.sort((a, b) => a - b);
}

const commonFactorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'Number A',
      type: 'number',
      placeholder: '24',
      min: 1,
      step: 1,
      helpText: 'Enter the first positive integer to find common factors',
    },
    {
      id: 'b',
      label: 'Number B',
      type: 'number',
      placeholder: '36',
      min: 1,
      step: 1,
      helpText: 'Enter the second positive integer to find common factors',
    },
  ],
  calculate: (values) => {
    const a = parseInt(values.a);
    const b = parseInt(values.b);

    if (isNaN(a) || isNaN(b) || a < 1 || b < 1 || !Number.isFinite(a) || !Number.isFinite(b)) return [];

    const factorsA = getFactors(a);
    const factorsB = getFactors(b);
    const common = factorsA.filter(f => factorsB.includes(f));
    const gcf = common.length > 0 ? common[common.length - 1] : 1;

    return [
      { id: 'gcf', label: 'Greatest Common Factor (GCF)', value: gcf.toString(), highlight: true, color: 'positive' },
      { id: 'commonFactors', label: 'All Common Factors', value: common.join(', ') },
      { id: 'commonCount', label: 'Number of Common Factors', value: common.length.toString() },
      { id: 'factorsA', label: `Factors of ${a}`, value: factorsA.join(', ') },
      { id: 'factorsB', label: `Factors of ${b}`, value: factorsB.join(', ') },
      { id: '_commonData', label: 'Common Factors Data', value: JSON.stringify({ common, a, b }) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CommonFactorPanel, { values, results });
  },
  educational: {
    formula: 'GCF(a, b) = max{common factors of a and b}',
    formulaDescription:
      'Common factors are numbers that divide evenly into both given numbers. The largest among them is the Greatest Common Factor (GCF), also called the Greatest Common Divisor (GCD). Finding common factors helps in simplifying fractions, dividing items into equal groups, and solving ratio and proportion problems.',
    variables: [
      { symbol: 'a, b', name: 'Numbers', description: 'The two positive integers to compare. Both must be whole numbers greater than 0.' },
      { symbol: 'GCF', name: 'Greatest Common Factor', description: 'The largest number that divides both a and b evenly. Also called the Greatest Common Divisor (GCD).' },
    ],
    howToUse: [
      'Enter two positive integers in the input fields.',
      'View the list of ALL common factors shared by both numbers, sorted from smallest to largest.',
      'The largest common factor is highlighted as the GCF, which is the most practically useful value.',
      'Check the individual factor lists for each number to understand how the common factors are derived.',
      'Use the GCF for simplifying fractions and dividing items into equal groups.',
    ],
    explanation:
      'Common factors are numbers that divide evenly into both of the given numbers. They represent the shared divisors between two integers. For example, the factors of 24 are 1, 2, 3, 4, 6, 8, 12, and 24. The factors of 36 are 1, 2, 3, 4, 6, 9, 12, 18, and 36. Their common factors are 1, 2, 3, 4, 6, and 12, with 12 being the greatest. Common factors are useful in simplifying fractions to their lowest terms (dividing numerator and denominator by their GCF), dividing objects into equal groups of the largest possible size, and solving problems involving ratios and proportions. Every pair of positive integers always has at least one common factor: the number 1. Numbers whose only common factor is 1 are called coprime or relatively prime, and they are especially important in number theory and cryptography.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="11" font-weight="bold">Common Factors of 24 and 36</text><circle cx="100" cy="90" r="70" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" opacity=".5"/><circle cx="220" cy="90" r="70" fill="var(--svg-fecaca)" stroke="var(--svg-ef4444)" stroke-width="2" opacity=".5"/><text x="65" y="75" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">Factors</text><text x="65" y="87" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">of 24:</text><text x="55" y="102" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="12">8</text><text x="55" y="118" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="12">24</text><text x="255" y="75" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">Factors</text><text x="255" y="87" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">of 36:</text><text x="265" y="102" text-anchor="middle" fill="var(--svg-991b1b)" font-size="12">9</text><text x="265" y="118" text-anchor="middle" fill="var(--svg-991b1b)" font-size="12">18</text><text x="265" y="134" text-anchor="middle" fill="var(--svg-991b1b)" font-size="12">36</text><text x="160" y="82" text-anchor="middle" fill="var(--svg-059669)" font-size="10" font-weight="bold">Common</text><text x="160" y="96" text-anchor="middle" fill="var(--svg-059669)" font-size="10" font-weight="bold">Factors</text><text x="160" y="114" text-anchor="middle" fill="var(--svg-059669)" font-size="13">1, 2, 3</text><text x="160" y="130" text-anchor="middle" fill="var(--svg-059669)" font-size="13">4, 6, 12</text><text x="160" y="150" text-anchor="middle" fill="var(--svg-059669)" font-size="11" font-weight="bold">GCF = 12</text><text x="160" y="182" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Venn diagram: intersection = shared factors</text></svg>',
      alt: 'Venn diagram showing factors of 24 and 36 with common factors in the overlapping intersection',
      caption: 'Common factors appear in the overlap of a Venn diagram. The largest common factor is the GCF.',
    },
    faqs: [
      {
        question: 'What is the difference between common factors and GCF?',
        answer: 'Common factors are ALL the numbers that divide into both numbers evenly. For example, the common factors of 12 and 18 are 1, 2, 3, and 6 — every number that divides both without a remainder. The GCF (Greatest Common Factor) is the largest of these common factors — in this case, 6. The GCF is the most commonly used value because it gives the greatest simplification.',
      },
      {
        question: 'Can two numbers have no common factors?',
        answer: 'Every pair of positive integers shares at least one common factor: 1. Numbers whose only common factor is 1 are called relatively prime or coprime (e.g., 8 and 9 share only the factor 1). This does not mean either number is prime — 8 and 9 are both composite — but they share no common prime factors.',
      },
      {
        question: 'How are common factors used in real life?',
        answer: 'Common factors appear when dividing items into equal groups: if you have 24 apples and 36 oranges and want to create identical gift baskets, the common factors tell you possible basket counts. The GCF (12) tells you the maximum number of identical baskets you can make. Common factors are also used in music theory (finding common time signatures), construction (cutting materials to common lengths), and manufacturing (batch sizes).',
      },
    ],
    citations: [
      { source: 'Wikipedia - Factorization', url: 'https://en.wikipedia.org/wiki/Factorization' },
      { source: 'Wikipedia - Greatest Common Divisor', url: 'https://en.wikipedia.org/wiki/Greatest_common_divisor' },
    ],
  },
};

export default commonFactorConfig;
