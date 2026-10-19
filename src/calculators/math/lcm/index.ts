import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import LCMPanel from './LCMPanel';
import { LCM_MAX_COUNT, analyzeLcm, parseLcmInput } from './lcmMath';

// Pairs people look up most; the answers come from the calculator's own helper, never typed in by hand.
const COMMON_PAIRS: Array<[number, number]> = [[4, 6], [6, 8], [8, 12], [9, 12], [12, 18], [15, 20], [14, 21], [18, 24], [20, 30], [24, 36]];

const lcmConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'numbers',
      label: 'Numbers (comma-separated)',
      type: 'text',
      placeholder: '12, 18, 24',
      inputMode: 'numeric',
      helpText: `Enter two or more positive whole numbers (up to ${LCM_MAX_COUNT}) separated by commas or spaces`,
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const parsed = parseLcmInput(values.numbers);
    if (parsed.kind === 'invalid') return [{ id: 'error', label: 'Error', value: parsed.message, color: 'negative' }];
    if (parsed.kind !== 'ok') return [];
    const { nums } = parsed;

    // BigInt throughout: the answer is exact however large it gets (the old double + 10^15 cap lost digits).
    const { lcm, gcd, steps } = analyzeLcm(nums);
    const list = nums.length > 6 ? `${nums.slice(0, 6).join(', ')}, …` : nums.join(', ');

    return [
      { id: 'result', label: `LCM of ${list}`, value: lcm.toString(), highlight: true, color: 'positive' },
      { id: 'lcmFormula', label: 'LCM Formula', value: `LCM(a,b) = (a × b) / GCD(a,b)` },
      { id: 'gcdValue', label: nums.length === 2 ? `GCD of ${nums[0]} and ${nums[1]}` : `GCD of all ${nums.length} numbers`, value: gcd.toString() },
      ...(nums.length > 2 ? [{ id: 'lcmSteps', label: 'Chained steps', value: steps.join(' | ') }] : []),
    ];
  },
  explainSteps: (values) => {
    const parsed = parseLcmInput(values.numbers);
    if (parsed.kind !== 'ok') return [];
    const { nums } = parsed;
    const { gcd, steps } = analyzeLcm(nums);
    const chain = steps.map((s) => s.replace(' / ', ' ÷ '));
    const head = { label: 'Use LCM(a, b) = (a × b) ÷ GCD(a, b)', expr: `LCM(${nums.length > 6 ? `${nums.slice(0, 6).join(', ')}, …` : nums.join(', ')})` };
    if (nums.length === 2) {
      return [
        head,
        { label: 'Find the GCD', expr: `GCD(${nums[0]}, ${nums[1]}) = ${gcd}` },
        { label: 'Multiply, then divide by the GCD', expr: chain[0] },
      ];
    }
    const shown =
      chain.length <= 4
        ? chain.map((expr, i) => ({ label: `Combine ${i === 0 ? `${nums[0]} and ${nums[1]}` : `the result with ${nums[i + 1]}`}`, expr }))
        : [
            { label: `Combine ${nums[0]} and ${nums[1]}`, expr: chain[0] },
            { label: 'Keep combining the remaining numbers the same way', expr: `… ${chain.length - 2} more pairwise steps …` },
            { label: `Combine the result with ${nums[nums.length - 1]}`, expr: chain[chain.length - 1] },
          ];
    return [head, ...shown];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LCMPanel, { values, results });
  },
  educational: {
    formula: 'LCM(a, b) = (a × b) / GCD(a, b)',
    formulaDescription:
      'The Least Common Multiple of two numbers is the smallest positive integer that is divisible by both numbers. It can be found using the GCD relationship (LCM = a × b / GCD) or by comparing lists of multiples. The LCM is also called the Lowest Common Denominator when working with fractions.',
    variables: [
      { symbol: 'a, b', name: 'Input Numbers', description: 'The positive integers to find the LCM of. Two or more numbers can be entered, separated by commas.' },
      { symbol: 'LCM', name: 'Least Common Multiple', description: 'The smallest positive integer that is a multiple of all input numbers.' },
      { symbol: 'GCD', name: 'Greatest Common Divisor', description: 'The largest positive integer that divides all input numbers evenly. Related to LCM by the formula: LCM × GCD = a × b.' },
    ],
    howToUse: [
      'Enter two or more positive integers separated by commas.',
      'View the LCM calculated via the efficient GCD-based method.',
      'Compare the "List of Multiples" and "Prime Factorization" solution methods side by side to understand different approaches.',
      'Check the GCD of all the numbers, and the chained pairwise steps when you enter three or more numbers.',
      'Use the LCM as the common denominator when adding or subtracting fractions.',
    ],
    explanation:
      'The Least Common Multiple (LCM) is the smallest positive integer that all input numbers divide into evenly. It is essential for adding and subtracting fractions with different denominators (finding a common denominator), solving problems with repeating cycles and synchronizing schedules, and working with gear ratios in mechanical engineering. The LCM is related to the GCD by the fundamental formula: LCM(a, b) × GCD(a, b) = a × b. This means if you know the GCD, you can instantly compute the LCM without listing multiples. The prime factorization method provides deeper insight: write each number as a product of primes, then for each distinct prime factor, take the highest exponent that appears in any factorization. For example, 12 = 2 × 2 × 3 and 18 = 2 × 3 × 3, so the LCM takes 2 twice and 3 twice: LCM = 2 × 2 × 3 × 3 = 36. This calculator demonstrates both the formula approach and the conceptual approach side by side.',
    quickReference: [
      { label: 'LCM via GCD', value: 'LCM(a,b) = a × b ÷ GCD(a,b)' },
      { label: 'LCM via prime factors', value: 'Highest exponent of each distinct prime' },
      { label: 'GCD relationship', value: 'LCM(a,b) × GCD(a,b) = a × b' },
      { label: 'Co-prime numbers', value: 'LCM(a,b) = a × b (e.g. 7 and 8 → 56)' },
      { label: 'Multiple relationship', value: 'LCM(a,b) = a if b divides a evenly' },
      { label: 'Common denominator', value: 'LCM of denominators for fraction addition' },
      ...COMMON_PAIRS.map(([a, b]) => ({ label: `LCM(${a}, ${b})`, value: analyzeLcm([BigInt(a), BigInt(b)]).lcm.toString() })),
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="11" font-weight="bold">LCM(12, 18) = 36</text><text x="50" y="38" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">Multiples of 12:</text><text x="30" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="11">12</text><text x="65" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="11">24</text><rect x="85" y="44" width="30" height="20" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="4"/><text x="100" y="58" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="11" font-weight="bold">36</text><text x="135" y="55" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">48</text><text x="170" y="55" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">60</text><text x="50" y="78" text-anchor="middle" fill="var(--svg-ef4444)" font-size="10">Multiples of 18:</text><text x="30" y="95" text-anchor="middle" fill="var(--svg-ef4444)" font-size="11">18</text><rect x="50" y="84" width="30" height="20" fill="var(--svg-fecaca)" stroke="var(--svg-ef4444)" stroke-width="2" rx="4"/><text x="65" y="98" text-anchor="middle" fill="var(--svg-991b1b)" font-size="11" font-weight="bold">36</text><text x="105" y="95" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">54</text><text x="140" y="95" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">72</text><text x="175" y="95" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">90</text><text x="160" y="125" text-anchor="middle" fill="var(--svg-059669)" font-size="11" font-weight="bold">36 is the smallest common multiple</text><rect x="20" y="138" width="280" height="50" fill="var(--svg-f3f4f6)" stroke="var(--svg-d1d5db)" stroke-width="1" rx="6"/><text x="160" y="155" text-anchor="middle" fill="var(--svg-374151)" font-size="10">Prime Factorization:</text><text x="160" y="172" text-anchor="middle" fill="var(--svg-374151)" font-size="10">12 = 2&sup2; &times; 3, 18 = 2 &times; 3&sup2;</text><text x="160" y="186" text-anchor="middle" fill="var(--svg-374151)" font-size="10">LCM = 2&sup2; &times; 3&sup2; = 4 &times; 9 = 36</text></svg>',
      alt: 'Number line comparison showing multiples of 12 and 18 with the LCM highlighted',
      caption: 'The LCM is the smallest positive integer that is a multiple of all input numbers.',
    },
    workedExamples: [
      {
        scenario: 'Add the fractions 1/6 + 1/8 by finding a common denominator.',
        inputs: { numbers: '6, 8' },
        result: 'LCM(6, 8) = 24',
        insight: 'The least common denominator is 24. Convert: 1/6 = 4/24 and 1/8 = 3/24. Sum = 7/24. Using GCD: GCD(6,8)=2, so LCM = (6×8)/2 = 24.',
      },
      {
        scenario: 'Two traffic lights cycle every 45 seconds and 60 seconds. When will they blink together again?',
        inputs: { numbers: '45, 60' },
        result: 'LCM(45, 60) = 180',
        insight: 'The lights synchronize every 180 seconds (3 minutes). 45 = 3²×5, 60 = 2²×3×5. Taking highest exponents: 2²×3²×5 = 4×9×5 = 180 seconds.',
      },
      {
        scenario: 'Three planets orbit in 88, 225, and 365 days. When will they align again?',
        inputs: { numbers: '88, 225, 365' },
        result: 'LCM(88, 225, 365) = 1,445,400',
        insight: '88 = 2³×11, 225 = 3²×5², 365 = 5×73, so the LCM is 2³×3²×5²×11×73 = 1,445,400 days, about 3,957 years (1,445,400 ÷ 365.25) with these rounded periods. In practice, orbital mechanics has perturbations, but the LCM gives the theoretical recurrence period.',
      },
    ],
    proTips: [
      'When one number is a multiple of another, the LCM is simply the larger number. For example, LCM(6, 18) = 18. Save yourself the calculation.',
      'For co-prime numbers (GCF = 1), the LCM is just their product. Example: LCM(7, 8) = 56. No computation needed.',
      'When adding fractions, always use the LCM of the denominators (the LCD) rather than just multiplying them together — this gives the simplest common denominator and avoids unnecessary large numbers.',
      'For three or more numbers, chain the calculation: LCM(a, b, c) = LCM(LCM(a, b), c). Never try to multiply all numbers and divide by their GCD — that only works for two numbers.',
    ],
    limitations: [
      'Up to 30 positive whole numbers of at most 100 digits each. The LCM is computed with exact big-integer arithmetic, so even a result with thousands of digits is digit-for-digit correct; only the multiples chart and the prime-factor view are limited to numbers below 9,007,199,254,740,991.',
      'Zero, negatives and decimals are rejected with a message (by convention LCM(0, n) = 0 and LCM(−a, b) = LCM(a, b), which this tool does not use).',
      'The LCM formula LCM = (a×b)/GCD only works for exactly two numbers. For three or more, you must chain calculations pairwise. The result is independent of pairing order due to associativity.',
      'The "list of multiples" method is only practical for small numbers. The lists show the first 60 multiples of each of the first three numbers (or fewer, when the LCM comes sooner), so for very large LCMs the LCM itself is not in the list; the chained steps always give the exact value.',
    ],
    faqs: [
      {
        question: 'What is the difference between LCM and GCD?',
        answer: 'LCM (Least Common Multiple) is the smallest number that both numbers divide into evenly. GCD (Greatest Common Divisor) is the largest number that divides both numbers evenly. They are related by the identity: LCM(a,b) × GCD(a,b) = a × b. If you know one, you can compute the other instantly.',
      },
      {
        question: 'Can I find LCM of more than two numbers?',
        answer: 'Yes. Find the LCM of the first two numbers, then use that result with the third number: LCM(a, b, c) = LCM(LCM(a, b), c). This calculator supports multiple comma-separated inputs and handles the chained computation automatically. The same prime factorization principle extends: take the highest exponent of each prime across all numbers.',
      },
      {
        question: 'How is LCM used in real life?',
        answer: 'LCM is used to find common denominators when adding fractions (e.g., 1/6 + 1/8 needs denominator 24), synchronizing repeating events (e.g., two machines that run on 6-day and 8-day cycles will align every 24 days), scheduling recurring tasks, and in music theory for finding common time signatures and rhythmic patterns.',
      },
      {
        question: 'Why does LCM(a,b) × GCD(a,b) = a × b always hold?',
        answer: 'This identity follows from prime factorization. GCD takes the minimum exponent of each shared prime, while LCM takes the maximum exponent. The product of min and max for each prime equals the sum of the original exponents: min(e₁,e₂) + max(e₁,e₂) = e₁ + e₂. Multiplying across all primes gives GCD × LCM = a × b.',
      },
      {
        question: 'What is the least common denominator (LCD)?',
        answer: 'The LCD is simply the LCM of two or more fraction denominators. It is the smallest number into which all denominators divide evenly, making it the optimal choice for adding or subtracting fractions. Using the LCD instead of just multiplying denominators together keeps numbers smaller and results already simplified.',
      },
      {
        question: 'How does the prime factorization method work for LCM?',
        answer: 'Write each number as a product of primes with exponents. Then, for each distinct prime factor, take the LARGEST exponent that appears in any factorization — this is the key difference from GCF, which takes the smallest exponent. For 12 = 2²×3 and 18 = 2×3², we take 2² and 3², giving LCM = 4×9 = 36.',
      },
      {
        question: 'Is the lowest common multiple the same as the least common multiple?',
        answer: 'Yes. "Lowest common multiple", "least common multiple" and "smallest common multiple" all mean the same number, abbreviated LCM. Searches for "least common factor" or "least common divisor" usually mean the LCM or the greatest common factor (GCF): the smallest common factor of any two whole numbers is always 1, so it is never the answer people want.',
      },
      {
        question: 'How do I find the LCM on a calculator?',
        answer: 'Most basic and scientific calculators have no LCM key. Enter your numbers in the box above, or work it out as a × b ÷ GCD(a, b). Many graphing calculators, such as the TI-84 Plus, have an lcm( function under MATH, then NUM.',
      },
      {
        question: 'What is the division (ladder) method for LCM?',
        answer: 'Write the numbers in a row. Divide by any prime that divides at least one of them, bring down the numbers it does not divide, and repeat until every number is 1. The LCM is the product of all the divisors. For 12 and 18: divide by 2 (6 and 9), by 2 again (3 and 9), by 3 (1 and 3), then by 3 (1 and 1). The divisors 2 × 2 × 3 × 3 give 36.',
      },
      {
        question: 'What is the LCM of 12 and 18?',
        answer: 'It is 36. 12 = 2² × 3 and 18 = 2 × 3², so the LCM takes the highest power of each prime, 2² × 3² = 36. Check with the GCD: 12 × 18 ÷ GCD(12, 18) = 216 ÷ 6 = 36.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Least Common Multiple', url: 'https://en.wikipedia.org/wiki/Least_common_multiple' },
      { source: 'Wolfram MathWorld - Least Common Multiple', url: 'https://mathworld.wolfram.com/LeastCommonMultiple.html' },
    ],
  },
};

export default lcmConfig;
