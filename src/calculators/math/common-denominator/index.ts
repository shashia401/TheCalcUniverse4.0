import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CommonDenomPanel from './CommonDenomPanel';

/** Euclidean algorithm for GCD */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

/** Least Common Multiple */
function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return (a / gcd(a, b)) * b;
}

/** Parse comma-separated string of numbers */
function parseList(raw: string | undefined): number[] | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  const nums = s.split(/[,\s]+/).map(x => parseInt(x.trim(), 10));
  if (nums.some(n => isNaN(n) || n <= 0)) return null;
  return nums;
}

interface WorkStep {
  step: string;
  detail: string;
}

interface ConvertedFraction {
  numerator: number;
  denominator: number;
  originalNumerator: number;
  originalDenominator: number;
  multiplier: number;
}

const commonDenomConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'numerators',
      label: 'Numerators (comma-separated)',
      type: 'text',
      placeholder: '1, 1, 1',
      defaultValue: '1, 1, 1',
      helpText: 'Enter the numerators for each fraction, separated by commas. Example: for 1/2 + 3/4, enter "1, 3".',
    },
    {
      id: 'denominators',
      label: 'Denominators (comma-separated)',
      type: 'text',
      placeholder: '2, 3, 4',
      defaultValue: '2, 3, 4',
      helpText: 'Enter the corresponding denominators, separated by commas. Must be positive integers.',
    },
  ],

  calculate: (values) => {
    let numerators = parseList(values.numerators);
    const denominators = parseList(values.denominators);
    if (!numerators || !denominators) return [];
    // Broadcast single numerator across multiple denominators (e.g. 3/4 and 3/6)
    if (numerators.length === 1 && denominators.length > 1) {
      const singleNum = numerators[0];
      numerators = Array(denominators.length).fill(singleNum);
    }
    if (numerators.length !== denominators.length) {
      return [
        {
          id: 'error',
          label: 'Error',
          value: 'The number of numerators must match the number of denominators.',
          color: 'negative' as const,
        },
      ];
    }

    // Calculate LCD (LCM of all denominators)
    let lcd = denominators[0];
    for (let i = 1; i < denominators.length; i++) {
      lcd = lcm(lcd, denominators[i]);
    }

    if (!isFinite(lcd) || lcd > 1e12) {
      return [{ id: 'result', label: 'LCD', value: 'Result too large (> 10¹²)' }];
    }

    // Build work steps for finding LCM of denominators
    const work: WorkStep[] = [];
    work.push({ step: 'Step 1', detail: `Denominators: [${denominators.join(', ')}]` });

    // Show GCD/LCM step-by-step for each pair
    let currentLCM = denominators[0];
    for (let i = 1; i < denominators.length; i++) {
      const g = gcd(currentLCM, denominators[i]);
      const l = lcm(currentLCM, denominators[i]);
      work.push({
        step: `Step ${i + 1}`,
        detail: i === 1
          ? `LCM(${denominators[0]}, ${denominators[i]}) = ${denominators[0]} × ${denominators[i]} / GCD(${denominators[0]}, ${denominators[i]}) = ${denominators[0]} × ${denominators[i]} / ${g} = ${l}`
          : `LCM(${currentLCM}, ${denominators[i]}) = ${currentLCM} × ${denominators[i]} / GCD(${currentLCM}, ${denominators[i]}) = ${currentLCM} × ${denominators[i]} / ${g} = ${l}`,
      });
      currentLCM = l;
    }

    // Confirm final LCD
    work.push({ step: 'Result', detail: `LCD = LCM of all denominators = ${lcd}` });

    // Build converted fractions
    const converted: ConvertedFraction[] = numerators.map((num, i) => {
      const den = denominators[i];
      const multiplier = Math.round(lcd / den);
      return {
        numerator: num * multiplier,
        denominator: lcd,
        originalNumerator: num,
        originalDenominator: den,
        multiplier,
      };
    });

    // Display work
    const workStr = work.map(w => `${w.step}: ${w.detail}`).join(' | ');

    return [
      {
        id: 'lcd',
        label: 'Least Common Denominator (LCD)',
        value: lcd.toString(),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: '_convertedFractions',
        label: 'Converted Fractions',
        value: JSON.stringify(converted),
        color: 'neutral' as const,
      },
      {
        id: 'convertedFractions',
        label: 'Converted Fractions',
        value: JSON.stringify(converted),
        color: 'neutral' as const,
      },
      {
        id: 'work',
        label: 'Work Steps',
        value: workStr,
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CommonDenomPanel, { values, results });
  },

  educational: {
    formula: 'LCD = LCM(denominator₁, denominator₂, ..., denominatorₙ)',
    diagram: {
      svg: '<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="200" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-1e293b)">Common Denominator</text><text x="200" y="50" text-anchor="middle" font-size="13" fill="var(--svg-64748b)">Convert fractions to equivalent form with a shared denominator</text><rect x="40" y="70" width="60" height="26" rx="3" fill="var(--svg-3b82f6)" fill-opacity=".2" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="70" y="87" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-3b82f6)">1</text><line x1="40" y1="96" x2="100" y2="96" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="70" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-64748b)">2</text><text x="150" y="88" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-1e293b)">+</text><rect x="190" y="70" width="60" height="26" rx="3" fill="var(--svg-3b82f6)" fill-opacity=".2" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="220" y="87" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-3b82f6)">1</text><line x1="190" y1="96" x2="250" y2="96" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="220" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-64748b)">3</text><text x="300" y="88" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-1e293b)">=</text><rect x="340" y="70" width="20" height="26" rx="3" fill="var(--svg-22c55e)" fill-opacity=".2" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="350" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">?</text><line x1="340" y1="96" x2="360" y2="96" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="350" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-64748b)">6</text><text x="200" y="155" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">1/2 = 3/6,  1/3 = 2/6  →  1/2 + 1/3 = 5/6</text><text x="200" y="178" text-anchor="middle" font-size="12" fill="var(--svg-64748b)">The LCD is the LCM of all denominators</text><text x="200" y="198" text-anchor="middle" font-size="12" fill="var(--svg-64748b)">Each numerator is scaled by (LCD ÷ original denominator)</text><text x="200" y="225" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">Step-by-Step Process</text><text x="200" y="245" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">1. Find LCM of all denominators → LCD</text><text x="200" y="262" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">2. For each fraction: multiply numerator by LCD/denominator</text><text x="200" y="279" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">3. All fractions now share the same denominator</text><text x="200" y="302" text-anchor="middle" font-size="11" fill="var(--svg-94a3b8)">Essential for adding, subtracting, and comparing fractions</text></svg>',
      alt: 'Diagram showing fractions 1/2 and 1/3 being converted to equivalent fractions 3/6 and 2/6 with the common denominator 6 (the LCD)',
      caption: 'The Least Common Denominator (LCD) is the LCM of all denominators. Each fraction is scaled by multiplying both numerator and denominator by the factor (LCD ÷ original denominator).',
    },
    formulaDescription:
      'The Least Common Denominator (LCD) is the smallest positive integer that all denominators divide into evenly. It is found by computing the Least Common Multiple (LCM) of all denominators using the GCD-based formula: LCM(a, b) = (a × b) / GCD(a, b). Once the LCD is found, each fraction is converted to an equivalent fraction with the LCD as its new denominator by multiplying both the numerator and denominator by the factor (LCD ÷ original denominator). This process is essential for adding, subtracting, and comparing fractions that have different denominators.',
    variables: [
      { symbol: 'LCD', name: 'Least Common Denominator', description: 'The smallest number that all denominators divide evenly into. Used as the common denominator when combining or comparing fractions.' },
      { symbol: 'LCM', name: 'Least Common Multiple', description: 'The smallest positive integer that is a multiple of all the given numbers. The LCD of a set of fractions is the LCM of their denominators.' },
      { symbol: 'GCD', name: 'Greatest Common Divisor', description: 'The largest positive integer dividing two numbers evenly. Used in the L = (a × b) / G formula to efficiently compute the LCM without listing multiples.' },
      { symbol: 'Multiplier', name: 'Scaling Factor', description: 'For each fraction, the number that both numerator and denominator are multiplied by to reach the LCD. Computed as LCD ÷ original denominator.' },
    ],
    howToUse: [
      'Enter the numerators of your fractions as a comma-separated list (e.g., "1, 2, 3" for fractions 1/2, 2/3, 3/4).',
      'Enter the corresponding denominators as a comma-separated list (e.g., "2, 3, 4"). The number of entries must match the numerators.',
      'The calculator finds the LCD as the LCM of all denominators using the Euclidean algorithm for GCD.',
      'Each fraction is converted to an equivalent fraction with the LCD as its new denominator. The multiplier used is displayed for each conversion.',
      'Review the step-by-step work showing how the LCM was computed for each pair of denominators.',
    ],
    quickReference: [
      { label: 'Two denominators a and b', value: 'LCD = (a × b) / GCD(a, b)' },
      { label: 'Three denominators a, b, c', value: 'LCD = LCM(LCM(a,b), c)' },
      { label: 'Convert fraction', value: 'New numerator = old num × (LCD / old den)' },
    ],
    commonUses: [
      'Adding fractions with different denominators: 1/2 + 1/3 becomes 3/6 + 2/6 = 5/6.',
      'Subtracting fractions: 3/4 - 1/6 becomes 9/12 - 2/12 = 7/12.',
      'Comparing fractions: determine which of 3/5, 2/3, 5/8 is largest by converting to a common denominator.',
      'Ordering fractions from smallest to largest for data analysis and reporting.',
      'Solving rational equations and algebraic expressions involving fractional terms.',
    ],
    explanation:
      'The Common Denominator concept is one of the most essential tools in fraction arithmetic. When fractions have different denominators, they cannot be directly added, subtracted, or compared because the parts are of different sizes. A common denominator solves this by expressing all fractions as equivalent fractions with the same denominator, ensuring that all parts are of equal size. The Least Common Denominator (LCD) is the smallest possible common denominator, which makes the arithmetic simpler and the results cleaner. The LCD is found by computing the Least Common Multiple (LCM) of all denominators using the Euclidean algorithm for GCD. The Euclidean algorithm itself is one of the oldest algorithms still in common use, described by Euclid in his Elements around 300 BCE, though it was likely known to earlier Greek and possibly Babylonian mathematicians. The formula LCM(a, b) = (a × b) / GCD(a, b) is computationally efficient because GCD can be computed rapidly using the Euclidean algorithm (repeated subtraction or division). Once the LCD is found, each fraction is converted by multiplying both numerator and denominator by the scaling factor (LCD ÷ original denominator). This works because multiplying by (LCD/denominator) is equivalent to multiplying by 1 (since LCD/denominator = denominator × factor / denominator = factor, and the fraction retains its value). For example, with fractions 1/2 and 1/3: the denominators are 2 and 3. GCD(2, 3) = 1, so LCM = (2 × 3) / 1 = 6, giving LCD = 6. Convert 1/2: multiply numerator 1 by (6/2 = 3), giving 3/6. Convert 1/3: multiply numerator 1 by (6/3 = 2), giving 2/6. Now 1/2 + 1/3 = 3/6 + 2/6 = 5/6. The calculator automates this entire process and shows each step, making it valuable for students learning fraction arithmetic and for professionals who regularly work with fractions in construction, cooking, chemistry, and data analysis.',
    workedExamples: [
      { scenario: 'A student needs to add 1/4 and 2/3 for a homework problem.', inputs: { numerators: '1, 2', denominators: '4, 3' }, result: 'LCD = 12, Converted: 3/12 and 8/12', insight: 'Denominators are 4 and 3. GCD(4,3) = 1, so LCM = (4x3)/1 = 12. LCD = 12. Convert 1/4: multiply by (12/4)=3, giving 3/12. Convert 2/3: multiply by (12/3)=4, giving 8/12. Now 1/4 + 2/3 = 3/12 + 8/12 = 11/12.' },
      { scenario: 'A chef is adjusting a recipe: they need to compare 3/4 cup, 5/6 cup, and 2/3 cup.', inputs: { numerators: '3, 5, 2', denominators: '4, 6, 3' }, result: 'LCD = 12, Converted: 9/12, 10/12, and 8/12', insight: 'Denominators are 4, 6, 3. LCM(4,6) = 12, then LCM(12,3) = 12. LCD = 12. Converted: 3/4 -> 9/12, 5/6 -> 10/12, 2/3 -> 8/12. So 5/6 (10/12) is largest, then 3/4 (9/12), then 2/3 (8/12).' },
      { scenario: 'A construction worker needs to add 3/8 inch and 5/16 inch for a precise measurement.', inputs: { numerators: '3, 5', denominators: '8, 16' }, result: 'LCD = 16, Converted: 6/16 and 5/16', insight: 'Denominators are 8 and 16. GCD(8,16) = 8, so LCM = (8x16)/8 = 16. LCD = 16. Convert 3/8: multiply by (16/8)=2, giving 6/16. 5/16 stays the same. Total = 6/16 + 5/16 = 11/16 inch.' },
    ],
    proTips: [
      'If one denominator is a multiple of the other, the LCD is simply the larger denominator. For example, with denominators 3 and 9, LCD = 9. No LCM calculation needed.',
      'For two denominators, the quick method is: LCD = (a x b) / GCD(a,b). For three or more, apply this formula pair-by-pair: first find LCM(a,b), then LCM(result, c), and so on.',
      'When working with fractions that have large denominators, always simplify the fractions first (divide numerator and denominator by their GCD). This often makes the LCD much smaller and the arithmetic easier.',
      'In probability calculations, the common denominator is often the total number of possible outcomes. Expressing each probability with this denominator makes it easy to compare relative likelihoods.',
      'Construction trades use fractions extensively: a standard US tape measure is marked in 1/16 inch increments. Finding a common denominator of 16 converts all measurements to the same sixteenth-of-an-inch scale for easy addition.',
    ],
    limitations: [
      'The calculator requires integer denominators. For mixed numbers like 1 1/2, first convert to an improper fraction (3/2) before entering. Decimal denominators (e.g., 0.5) must be converted to integers by multiplying numerator and denominator by a power of 10.',
      'Very large denominators can produce an LCD exceeding 10^12, at which point the calculator returns an overflow message. For most practical fraction problems with denominators like 2, 3, 4, 5, 6, 8, 10, 12, the LCD stays well within this range.',
      'The step-by-step work display shows intermediate LCM calculations between pairs of denominators but does not show the full Euclidean algorithm division chain (GCD-by-repeated-division steps).',
      'The calculator converts fractions to equivalent forms with the LCD as the new denominator but does not automatically simplify the final result. Use the Fraction Simplifier calculator to reduce fractions to their lowest terms.',
    ],
    faqs: [
      {
        question: 'What is the difference between LCD and LCM?',
        answer: 'The LCM (Least Common Multiple) is a general mathematical concept: the smallest number that two or more numbers divide evenly into. The LCD (Least Common Denominator) is the same concept applied specifically to the denominators of fractions. For a set of fractions, the LCD is simply the LCM of all the denominators. The terms are often used interchangeably in the context of fractions.',
      },
      {
        question: 'Why do I need a common denominator to add fractions?',
        answer: 'Fractions represent parts of a whole. When denominators differ, the parts are different sizes (like slices of differently sized pizzas). A common denominator converts all fractions to use the same-sized parts, making addition straightforward: you add only the numerators while keeping the denominator the same. For example, 1/2 (half) + 1/3 (third) becomes 3/6 (three sixths) + 2/6 (two sixths) = 5/6 (five sixths of the whole).',
      },
      {
        question: 'Can I use denominators that are not integers?',
        answer: 'This calculator works with positive integer denominators only. If you have decimal denominators like 0.5, you should multiply the numerator and denominator by a power of 10 (e.g., 0.5 = 1/2) to get integer denominators before using the calculator.',
      },
      {
        question: 'What happens if the numbers are very large?',
        answer: 'The calculator uses JavaScript double-precision floating point internally. If the LCD exceeds 10^12, the calculator returns a "Result too large" message. For most practical fraction problems involving denominators like 2, 3, 4, 5, 6, 8, 10, 12, the LCD stays well within a reasonable range.',
      },
      {
        question: 'How does the Euclidean algorithm for GCD work?',
        answer: 'The Euclidean algorithm repeatedly applies the principle that GCD(a, b) = GCD(b, a mod b) until the remainder is zero. For example, GCD(48, 18): 48 mod 18 = 12, then 18 mod 12 = 6, then 12 mod 6 = 0, so GCD = 6. This elegant method, discovered over 2,300 years ago, is remarkably efficient even for very large numbers and forms the computational backbone of this calculator\'s LCD calculation.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Least Common Denominator', url: 'https://en.wikipedia.org/wiki/Lowest_common_denominator' },
      { source: 'Wolfram MathWorld - Least Common Multiple', url: 'https://mathworld.wolfram.com/LeastCommonMultiple.html' },
    ],
  },
};

export default commonDenomConfig;
