import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import LCMPanel from './LCMPanel';
import { LCM_MAX_COUNT, analyzeLcm, analyzeLcmFractions, fractionText, parseLcmFractionInput, parseLcmInput } from './lcmMath';

// Pairs people look up most; the answers come from the calculator's own helper, never typed in by hand.
const COMMON_SETS: number[][] = [
  [4, 6], [6, 8], [8, 12], [9, 12], [12, 18], [15, 20], [14, 21], [18, 24], [20, 30], [24, 36],
  [5, 8], [7, 4], [7, 12], [24, 35], [24, 42], [3, 8, 12], [24, 36, 48], [60, 72, 80],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [2, 3, 4, 5, 6, 7],
];
const isRun = (xs: number[]): boolean => xs.length > 4 && xs.every((x, i) => i === 0 || x === xs[i - 1] + 1);
const setLabel = (xs: number[]): string => (isRun(xs) ? `LCM of ${xs[0]} to ${xs[xs.length - 1]}` : `LCM(${xs.join(', ')})`);

const lcmConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'numbers',
      label: 'Numbers or fractions',
      type: 'text',
      placeholder: '12, 18, 24',
      inputMode: 'numeric',
      helpText: `Enter two or more positive whole numbers (up to ${LCM_MAX_COUNT}) separated by commas or spaces. For fractions use a/b, like 1/2, 3/4 (write 1 1/2 as 3/2).`,
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const frac = parseLcmFractionInput(values.numbers);
    if (frac.kind === 'invalid') return [{ id: 'error', label: 'Error', value: frac.message, color: 'negative' }];
    if (frac.kind === 'incomplete') return [];
    if (frac.kind === 'ok') {
      const a = analyzeLcmFractions(frac.fractions);
      const shown = frac.fractions.length > 6 ? `${frac.fractions.slice(0, 6).map(fractionText).join(', ')}, …` : frac.fractions.map(fractionText).join(', ');
      const approx = Number(a.lcm.n) / Number(a.lcm.d);
      return [
        { id: 'result', label: `LCM of ${shown}`, value: fractionText(a.lcm), highlight: true, color: 'positive' },
        ...(a.lcm.d !== 1n && Number.isFinite(approx) ? [{ id: 'lcmDecimal', label: 'As a decimal', value: String(parseFloat(approx.toPrecision(10))) }] : []),
        { id: 'lcd', label: 'Least common denominator (LCD)', value: a.lcd.toString() },
        { id: 'overLcd', label: 'Fractions over the LCD', value: a.overLcd.map(fractionText).join(', ') },
        { id: 'lcmFormula', label: 'LCM of fractions', value: 'LCM(a/b, c/d) = LCM(a, c) / GCD(b, d)' },
      ];
    }
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
    const frac = parseLcmFractionInput(values.numbers);
    if (frac.kind === 'invalid' || frac.kind === 'incomplete') return [];
    if (frac.kind === 'ok') {
      const a = analyzeLcmFractions(frac.fractions);
      const fs = frac.fractions;
      const list = (xs: bigint[]) => xs.join(', ');
      return [
        { label: frac.reduced ? 'Write every fraction in lowest terms' : 'The fractions are already in lowest terms', expr: fs.map(fractionText).join(', ') },
        { label: 'Use LCM(a/b, c/d) = LCM(a, c) ÷ GCD(b, d)', expr: `LCM(${fs.map(fractionText).join(', ')})` },
        { label: 'LCM of the numerators', expr: `LCM(${list(fs.map((f) => f.n))}) = ${a.lcmNum}` },
        { label: 'GCD of the denominators', expr: `GCD(${list(fs.map((f) => f.d))}) = ${a.gcdDen}` },
        { label: 'Divide', expr: `${a.lcmNum} ÷ ${a.gcdDen} = ${fractionText(a.lcm)}` },
        { label: 'Check: the LCM is a whole number of each fraction', expr: fs.map((f, i) => `${fractionText(a.lcm)} = ${a.times[i]} × ${fractionText(f)}`).join(', ') },
      ];
    }
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
      { label: 'Commutative', value: 'LCM(a, b) = LCM(b, a)' },
      { label: 'Associative', value: 'LCM(a, LCM(b, c)) = LCM(LCM(a, b), c)' },
      { label: 'With 1 or itself', value: 'LCM(a, 1) = a and LCM(a, a) = a' },
      { label: 'Scaling', value: 'LCM(k·a, k·b) = k · LCM(a, b)' },
      { label: 'Common multiples', value: 'Every common multiple of the numbers is a multiple of their LCM' },
      ...COMMON_SETS.map((xs) => ({ label: setLabel(xs), value: analyzeLcm(xs.map(BigInt)).lcm.toString() })),
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
      {
        scenario: 'Find the LCM of three numbers: 12, 18 and 30 (for example, three machines that restart every 12, 18 and 30 minutes).',
        inputs: { numbers: '12, 18, 30' },
        result: 'LCM(12, 18, 30) = 180',
        insight: '12 = 2² × 3, 18 = 2 × 3², 30 = 2 × 3 × 5. The highest powers are 2², 3² and 5, so the LCM is 4 × 9 × 5 = 180. Chained with the GCD formula: LCM(12, 18) = 36, then LCM(36, 30) = 180.',
      },
      {
        scenario: 'Find the LCM of 24 and 300 with the division (ladder) method.',
        inputs: { numbers: '24, 300' },
        result: 'LCM(24, 300) = 600',
        insight: 'Divide by 2 (12, 150), by 2 (6, 75), by 2 (3, 75), by 3 (1, 25), by 5 (1, 5), by 5 (1, 1). The divisors 2 × 2 × 2 × 3 × 5 × 5 multiply to 600.',
      },
      {
        scenario: 'Find the LCM of the fractions 1/2 and 3/4 (also see the least common denominator you would use to add them).',
        inputs: { numbers: '1/2, 3/4' },
        result: 'LCM(1/2, 3/4) = 3/2',
        insight: 'LCM(1, 3) = 3 and GCD(2, 4) = 2, so the LCM is 3 ÷ 2 = 3/2. Check: 3/2 is 3 × 1/2 and 2 × 3/4. The least common denominator is a different number, LCM(2, 4) = 4, which turns the fractions into 2/4 and 3/4 so they can be added.',
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
        question: 'How do I find the LCM of fractions?',
        answer: 'Write each fraction in lowest terms, then divide the LCM of the numerators by the GCD of the denominators: LCM(a/b, c/d) = LCM(a, c) / GCD(b, d). For 1/2 and 3/4 that is LCM(1, 3) / GCD(2, 4) = 3/2, which is 3 × 1/2 and 2 × 3/4. Type fractions like 1/2, 3/4 into the calculator above.',
      },
      {
        question: 'Is the LCM of fractions the same as the least common denominator (LCD)?',
        answer: 'No. The LCM of fractions is the smallest number that is a whole number of each fraction (3/2 for 1/2 and 3/4). The least common denominator is the LCM of the denominators only (4 for 1/2 and 3/4), and it is what you use to add, subtract or compare fractions. The calculator shows both when you enter fractions.',
      },
      {
        question: 'How do I find the LCM step by step?',
        answer: 'Pick a method. Listing: write multiples of each number until one appears in every list. Prime factorization: write each number as primes and multiply the highest power of each prime. Ladder (cake): divide the row of numbers by primes until every entry is 1, then multiply the divisors. Or use the GCD: LCM(a, b) = a × b ÷ GCD(a, b). The steps panel above shows your numbers worked out these ways.',
      },
      {
        question: 'What is the fastest way to find the LCM?',
        answer: 'For two numbers, find the GCD and use LCM = a × b ÷ GCD: LCM(24, 36) = 24 × 36 ÷ 12 = 72. For three or more numbers, the ladder (cake) method keeps everything in one table. Listing multiples is only quick when the numbers are small or one divides the other.',
      },
      {
        question: 'What is the LCM of the numbers 1 to 10?',
        answer: '2,520. Take the highest power of each prime up to 10: 2³ × 3² × 5 × 7 = 8 × 9 × 5 × 7 = 2,520. It is the smallest number divisible by every whole number from 1 to 10.',
      },
      {
        question: 'What is the 7 × 11 × 13 trick?',
        answer: '7 × 11 × 13 = 1,001, and repeating a three-digit number to make a six-digit one multiplies it by 1,001 (123 becomes 123,123 = 123 × 1,001). So any number written as abcabc is divisible by 7, 11 and 13. Because 7, 11 and 13 share no factors, their LCM is also 1,001.',
      },
      {
        question: 'What is the sum of the HCF and LCM of 8 and 12?',
        answer: 'The HCF (GCD) of 8 and 12 is 4 and their LCM is 24, so the sum is 28. As a check, HCF × LCM = 4 × 24 = 96 = 8 × 12.',
      },
      {
        question: 'What are the common multiples of 6 and 9?',
        answer: 'The common multiples are 18, 36, 54, 72, 90 and so on. They are all multiples of the LCM, 18, which is the smallest one.',
      },
      {
        question: 'Is GCF the same as GCD?',
        answer: 'Yes. Greatest common factor (GCF), greatest common divisor (GCD) and highest common factor (HCF) are three names for the same number: the largest whole number that divides every number in the list. This calculator shows the GCD next to the LCM because the two are linked by LCM(a, b) × GCD(a, b) = a × b.',
      },
      {
        question: 'Why does GCF × LCM = a × b only work for two numbers?',
        answer: 'The identity comes from adding the smaller and larger exponent of each prime, which is only a complete accounting for two numbers. For three numbers, LCM(12, 18, 30) × GCD(12, 18, 30) = 180 × 6 = 1,080, but 12 × 18 × 30 = 6,480. For more than two numbers, chain the LCM pair by pair instead.',
      },
      {
        question: 'What is the LCM of a number and 1, or of a number and itself?',
        answer: 'The LCM of any number and 1 is the number itself, and the LCM of a number with itself is also that number. More generally, if one number divides the other, the LCM is the larger one: LCM(6, 18) = 18.',
      },
      {
        question: 'How do I find the LCM of decimals?',
        answer: 'Multiply every decimal by the same power of 10 until they are all whole numbers, find the LCM of the whole numbers, then divide by that power of 10. For 1.2 and 0.8, multiply by 10 to get 12 and 8, whose LCM is 24, so the LCM of 1.2 and 0.8 is 2.4 (it is 2 × 1.2 and 3 × 0.8). This calculator takes whole numbers, so scale first.',
      },
      {
        question: 'How does the Venn diagram method find the LCM?',
        answer: 'Write the prime factors of each number in two overlapping circles, with the primes they share in the overlap. The LCM is the product of every prime in the diagram, counting the overlap once. For 12 = 2 × 2 × 3 and 18 = 2 × 3 × 3 the overlap holds 2 and 3, 12 adds another 2, and 18 adds another 3, so the LCM is 2 × 3 × 2 × 3 = 36.',
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
        answer: 'Also called the cake method. Write the numbers in a row. Divide by any prime that divides at least one of them, bring down the numbers it does not divide, and repeat until every number is 1. The LCM is the product of all the divisors. For 12 and 18: divide by 2 (6 and 9), by 2 again (3 and 9), by 3 (1 and 3), then by 3 (1 and 1). The divisors 2 × 2 × 3 × 3 give 36.',
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
