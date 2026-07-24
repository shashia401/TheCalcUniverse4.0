import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import LCMPanel from './LCMPanel';

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

function getPrimeFactors(n: number): { factor: number; exponent: number }[] {
  const factors: { factor: number; exponent: number }[] = [];
  let num = n;
  for (let p = 2; p * p <= num; p++) {
    if (num % p === 0) {
      let count = 0;
      while (num % p === 0) { num /= p; count++; }
      factors.push({ factor: p, exponent: count });
    }
  }
  if (num > 1) factors.push({ factor: num, exponent: 1 });
  return factors;
}

function getMultiples(n: number, limit: number): number[] {
  const multiples: number[] = [];
  for (let i = 1; i <= limit; i++) {
    multiples.push(n * i);
  }
  return multiples;
}

const lcmConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'numbers',
      label: 'Numbers (comma-separated)',
      type: 'text',
      placeholder: '12, 18, 24',
      inputMode: 'numeric',
      helpText: 'Enter two or more positive integers separated by commas',
    },
  ],
  calculate: (values) => {
    const raw = values.numbers?.trim();
    if (!raw) return [];

    const nums = raw.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (nums.length < 2) return [];

    // Calculate LCM
    let result = nums[0];
    for (let i = 1; i < nums.length; i++) {
      result = lcm(result, nums[i]);
    }

    if (!isFinite(result) || result > 1e15) {
      return [{ id: 'result', label: 'LCM', value: 'Result too large (> 10¹⁵)' }];
    }

    // Prime factorization method
    const pfacs = nums.map(n => ({
      number: n,
      factors: getPrimeFactors(n),
    }));

    // List of multiples for the first two numbers (up to LCM)
    const multiplesLimit = 100;
    const multiplesA = getMultiples(nums[0], Math.min(multiplesLimit, Math.ceil(result / nums[0])));
    const multiplesB = nums.length > 1 ? getMultiples(nums[1], Math.min(multiplesLimit, Math.ceil(result / nums[1]))) : [];

    return [
      { id: 'result', label: `LCM of ${nums.join(', ')}`, value: result.toString(), highlight: true, color: 'positive' },
      { id: 'lcmFormula', label: 'LCM Formula', value: `LCM(a,b) = (a × b) / GCD(a,b)` },
      { id: 'gcdValue', label: `GCD of ${nums[0]} and ${nums[1]}`, value: gcd(nums[0], nums[1]).toString() },
      { id: '_primeData', label: 'Prime Factorization Data', value: JSON.stringify(pfacs) },
      { id: '_multiplesData', label: 'Multiples Data', value: JSON.stringify({
        a: nums[0],
        b: nums.length > 1 ? nums[1] : nums[0],
        multiplesA,
        multiplesB,
        lcm: result,
      }) },
      { id: '_inputNums', label: 'Input Numbers', value: JSON.stringify(nums) },
    ];
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
      'Check the GCD of the first two numbers, which is used as an intermediate step in the calculation.',
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
        insight: 'The planets align approximately every 3,960 years at this exact configuration. In practice, orbital mechanics has perturbations, but the LCM gives the theoretical recurrence period.',
      },
    ],
    proTips: [
      'When one number is a multiple of another, the LCM is simply the larger number. For example, LCM(6, 18) = 18. Save yourself the calculation.',
      'For co-prime numbers (GCF = 1), the LCM is just their product. Example: LCM(7, 8) = 56. No computation needed.',
      'When adding fractions, always use the LCM of the denominators (the LCD) rather than just multiplying them together — this gives the simplest common denominator and avoids unnecessary large numbers.',
      'For three or more numbers, chain the calculation: LCM(a, b, c) = LCM(LCM(a, b), c). Never try to multiply all numbers and divide by their GCD — that only works for two numbers.',
    ],
    limitations: [
      'This calculator limits results to 10¹⁵. For numbers with LCM exceeding this (e.g., very large co-prime pairs), the result will show an overflow message.',
      'The LCM formula LCM = (a×b)/GCD only works for exactly two numbers. For three or more, you must chain calculations pairwise. The result is independent of pairing order due to associativity.',
      'The "list of multiples" method is only practical for small numbers. It explores multiples up to the LCM or 100, whichever is smaller, so for very large LCMs the list is truncated.',
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
    ],
    citations: [
      { source: 'Wikipedia - Least Common Multiple', url: 'https://en.wikipedia.org/wiki/Least_common_multiple' },
      { source: 'Wolfram MathWorld - Least Common Multiple', url: 'https://mathworld.wolfram.com/LeastCommonMultiple.html' },
    ],
  },
};

export default lcmConfig;
