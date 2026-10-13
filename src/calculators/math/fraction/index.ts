import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import FractionPanel from './FractionPanel';
import { fmtFrac, computeFraction, decimalViews, mixedNumber, OP_LABEL, OP_SYMBOL, FractionComputation } from './fractionMath';

// All arithmetic is exact BigInt rational arithmetic (src/utils/rational.ts): no float is ever involved,
// so very large numerators/denominators stay exact. fractionMath.ts is shared with FractionPanel.

function stepsFor(c: FractionComputation) {
  const { op, a, b } = c;
  const f = (n: bigint, d: bigint) => `${n}/${d}`;
  const steps: { label: string; expr: string; note?: string }[] = [];
  if (op === 'add' || op === 'subtract') {
    const sym = OP_SYMBOL[op];
    steps.push({
      label: 'Find a common denominator (LCM)',
      expr: `LCM(${a.d}, ${b.d}) = ${c.lcd}`,
      note: 'You can only add or subtract fractions that share a denominator.',
    });
    steps.push({
      label: 'Rewrite both fractions over it',
      expr: `${f(a.n, a.d)} = ${f(c.adjA!, c.lcd!)}  ·  ${f(b.n, b.d)} = ${f(c.adjB!, c.lcd!)}`,
    });
    steps.push({
      label: `${op === 'add' ? 'Add' : 'Subtract'} the numerators`,
      expr: `(${c.adjA} ${sym} ${c.adjB})/${c.lcd} = ${f(c.rawN, c.rawD)}`,
    });
  } else if (op === 'multiply') {
    steps.push({
      label: 'Multiply straight across',
      expr: `${f(a.n, a.d)} × ${f(b.n, b.d)} = (${a.n}×${b.n})/(${a.d}×${b.d}) = ${f(c.rawN, c.rawD)}`,
      note: 'No common denominator is needed for multiplication.',
    });
  } else {
    steps.push({
      label: 'Flip the second fraction and multiply',
      expr: `${f(a.n, a.d)} ÷ ${f(b.n, b.d)} = ${f(a.n, a.d)} × ${f(b.d, b.n)}`,
      note: 'Keep, change, flip — dividing is multiplying by the reciprocal.',
    });
    steps.push({
      label: 'Multiply straight across',
      expr: `(${a.n}×${b.d})/(${a.d}×${b.n}) = ${f(c.rawN, c.rawD)}`,
    });
  }
  steps.push({
    label: 'Simplify to lowest terms',
    expr: `${f(c.rawN, c.rawD)} = ${fmtFrac(c.result)}`,
    note: 'Divide the top and bottom by their greatest common divisor (GCD), keeping the denominator positive.',
  });
  return steps;
}

const fractionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Operation',
      type: 'select',
      required: true,
      options: [
        { label: 'Add (+)', value: 'add' },
        { label: 'Subtract (−)', value: 'subtract' },
        { label: 'Multiply (×)', value: 'multiply' },
        { label: 'Divide (÷)', value: 'divide' },
      ],
    },
    {
      id: 'aNum',
      label: 'First Numerator',
      type: 'number',
      placeholder: '3',
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Top number of the first fraction. Any whole number: positive, negative, or zero.',
    },
    {
      id: 'aDen',
      label: 'First Denominator',
      type: 'number',
      placeholder: '4',
      step: 1,
      inputMode: 'numeric',
      min: 1,
      required: true,
      helpText: 'Bottom number of the first fraction. Must be a positive whole number greater than zero.',
    },
    {
      id: 'bNum',
      label: 'Second Numerator',
      type: 'number',
      placeholder: '1',
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Top number of the second fraction. Any whole number: positive, negative, or zero.',
    },
    {
      id: 'bDen',
      label: 'Second Denominator',
      type: 'number',
      placeholder: '3',
      step: 1,
      inputMode: 'numeric',
      min: 1,
      required: true,
      helpText: 'Bottom number of the second fraction. Must be a positive whole number greater than zero.',
    },
  ],
  explainSteps: (values) => {
    const out = computeFraction(values);
    return out.kind === 'ok' ? stepsFor(out.comp) : [];
  },
  calculate: (values): CalculatorResult[] => {
    const out = computeFraction(values);
    if (out.kind === 'incomplete') return [];
    if (out.kind === 'invalid') {
      return [{ id: 'error', label: 'Error', value: out.message, color: 'negative' }];
    }
    const { comp } = out;
    const { result: r, op, a, b } = comp;
    const views = decimalViews(r);
    const mixed = mixedNumber(r);

    const rows: CalculatorResult[] = [
      {
        id: 'operation',
        label: OP_LABEL[op],
        value: `${a.n}/${a.d} ${OP_SYMBOL[op]} ${b.n}/${b.d}`,
        highlight: true,
        color: 'positive',
      },
      { id: 'result', label: 'Result (Fraction)', value: fmtFrac(r), color: 'neutral' },
    ];
    if (mixed) rows.push({ id: 'mixedNumber', label: 'As a Mixed Number', value: mixed, color: 'neutral' });
    rows.push({ id: 'decimal', label: 'Decimal Equivalent', value: views.rounded, color: 'neutral' });
    if (views.exact) {
      rows.push({
        id: 'exactDecimal',
        label: 'Exact Decimal (repeating digits in brackets)',
        value: views.exact,
        color: 'neutral',
      });
    }
    rows.push({
      id: 'simplified',
      label: 'Simplified',
      value: `${r.n}/${r.d}`,
      color: op === 'add' ? 'positive' : op === 'subtract' ? 'negative' : 'neutral',
    });
    return rows;
  },
  extraPanel: (values, results) => {
    if (!results.length || results[0].id === 'error') return null;
    return createElement(FractionPanel, { values, results });
  },
  educational: {
    formula: 'a/b + c/d = (ad + bc) / bd | a/b - c/d = (ad - bc) / bd | a/b × c/d = ac / bd | a/b ÷ c/d = ad / bc',
    formulaDescription:
      'Fraction arithmetic follows specific rules depending on the operation. For addition and subtraction, the fractions must share a common denominator — the least common multiple (LCM) of the denominators is used to find equivalent fractions with the same denominator. Once denominators match, the numerators are added or subtracted directly while the denominator stays the same. For multiplication, multiply numerators together and denominators together directly — no common denominator is needed. For division, multiply by the reciprocal (flip the second fraction upside down and multiply). Every result is automatically simplified to lowest terms by dividing both numerator and denominator by their greatest common divisor (GCD). This ensures the answer is always in its simplest, most readable form.',
    diagram: {
      svg: '<svg viewBox="0 0 420 180" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Fractions as Parts of a Whole</text>' +
        '<!-- 1/2 --><rect x="20" y="35" width="80" height="50" rx="4" fill="var(--svg-e2e8f0)"/><rect x="20" y="35" width="40" height="50" rx="4" fill="var(--svg-3b82f6)"/><text x="60" y="65" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">1/2</text>' +
        '<!-- 1/4 --><rect x="120" y="35" width="80" height="50" rx="4" fill="var(--svg-e2e8f0)"/><rect x="120" y="35" width="20" height="50" rx="4" fill="var(--svg-22c55e)"/><text x="130" y="65" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">1/4</text>' +
        '<!-- 3/4 --><rect x="220" y="35" width="80" height="50" rx="4" fill="var(--svg-e2e8f0)"/><rect x="220" y="35" width="60" height="50" rx="4" fill="var(--svg-f59e0b)"/><text x="250" y="65" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">3/4</text>' +
        '<!-- 1/3 --><rect x="320" y="35" width="80" height="50" rx="4" fill="var(--svg-e2e8f0)"/><rect x="320" y="35" width="26.7" height="50" rx="4" fill="var(--svg-8b5cf6)"/><text x="333" y="65" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">1/3</text>' +
        '<!-- Labels --><text x="60" y="105" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">1 out of 2</text>' +
        '<text x="160" y="105" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">1 out of 4</text>' +
        '<text x="260" y="105" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">3 out of 4</text>' +
        '<text x="360" y="105" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">1 out of 3</text>' +
        '<text x="210" y="135" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Numerator = colored parts, Denominator = total parts</text>' +
        '</svg>',
      alt: 'Four rectangles divided into fractions showing 1/2, 1/4, 3/4, and 1/3 as colored portions',
      caption: 'A fraction shows how many equal parts of a whole you have — the numerator is the count, the denominator is the part size',
    },
    variables: [
      { symbol: 'a/b, c/d', name: 'Fractions', description: 'Two fractions with numerators and denominators. a and c are numerators (can be any integer). b and d are denominators (must be positive integers). The denominator determines the "size" of each part.' },
      { symbol: 'LCM', name: 'Least Common Multiple', description: 'The smallest positive integer that is divisible by both denominators. Used to find a common denominator for addition and subtraction. Computed as (a × b) / GCD(a, b).' },
      { symbol: 'GCD', name: 'Greatest Common Divisor', description: 'The largest positive integer that divides both the numerator and denominator evenly. Used to simplify the result to lowest terms through Euclidean algorithm.' },
    ],
    howToUse: [
      'Select the operation you want to perform: addition, subtraction, multiplication, or division of two fractions.',
      'Enter the numerator (top number) and denominator (bottom number) for the first fraction. Denominators must be positive integers greater than zero.',
      'Enter the numerator and denominator for the second fraction. The calculator accepts any integers for numerators (positive, negative, or zero).',
      'View the result in its simplest form — the calculator automatically reduces the fraction to lowest terms using the greatest common divisor (GCD).',
      'Check the decimal equivalent displayed alongside the fraction result for easy comparison and real-world interpretation.',
      'Review the step-by-step work in the extra panel, which shows the LCM calculation for addition/subtraction and the reciprocal flip for division.',
    ],
    explanation:
      'A fraction represents a part of a whole and is one of the oldest mathematical concepts, dating back to Egyptian papyri from around 1800 BCE. The Rhind Mathematical Papyrus (c. 1550 BCE), a famous Egyptian document, contains extensive work with unit fractions (fractions with numerator 1). The word "fraction" comes from the Latin "fractio" meaning "to break," reflecting the idea of breaking a whole into equal parts. The denominator (bottom number) tells you how many equal parts the whole is divided into, while the numerator (top number) tells you how many of those parts you have. Fractions are foundational to all of mathematics — they are the gateway to algebra, ratios, proportions, percentages, probability, and calculus. The key insight for fraction arithmetic is that you can only directly add or subtract fractions when they share the same denominator, because the denominator defines the "size" of each part. For addition and subtraction, the calculator finds the least common multiple (LCM) of the denominators to create equivalent fractions with a common denominator, then adds or subtracts the numerators. For multiplication, you simply multiply numerators together and denominators together — no common denominator is needed because multiplication naturally combines the fractional parts. For division, you multiply by the reciprocal of the second fraction (flip it upside down), which is equivalent to the "keep-change-flip" mnemonic taught in schools. Every result is automatically simplified to lowest terms by dividing both the numerator and denominator by their greatest common divisor (GCD). Fractions appear everywhere in daily life: cooking uses cup and teaspoon fractions, construction uses inch fractions (1/16, 1/8, 1/4), music uses time signatures like 3/4 and 4/4, photography uses aperture fractions (f/2.8, f/4), and finance uses fractional shares and stock splits.',
    commonUses: [
      'Cooking and baking: scaling recipes using fractional measurements — doubling 1/3 cup to 2/3 cup, or halving 3/4 teaspoon to 3/8 teaspoon',
      'Construction and carpentry: working with inch fractions (1/16, 1/8, 1/4, 1/2) for precise measurements and material cuts',
      'Mathematics education: teaching students the fundamentals of rational numbers, equivalent fractions, and arithmetic operations',
      'Music theory: understanding time signatures (3/4, 4/4, 6/8) and note durations (whole notes, half notes, quarter notes, eighth notes)',
      'Financial calculations: working with fractional interest rates, stock splits (3:2 split expressed as 3/2), and proportional ownership',
    ],
    workedExamples: [
      {
        scenario: 'Sarah is baking cookies and needs to double the recipe. The original recipe calls for 3/4 cup of sugar. To double it, she needs to multiply 3/4 by 2 (which is 2/1 as a fraction).',
        inputs: { mode: 'multiply', aNum: '3', aDen: '4', bNum: '2', bDen: '1' },
        result: '3/4 × 2/1 = 6/4 = 3/2 (1.5)',
        insight: '3/4 × 2/1 = 6/4, which simplifies to 3/2 or 1.5 cups. Sarah needs one and a half cups of sugar. The calculator shows both the simplified fraction (3/2) and the decimal equivalent (1.5), making it easy to measure using standard kitchen tools.',
      },
      {
        scenario: 'A carpenter is cutting trim for a window frame. She needs to subtract a 3/8 inch notch from a 7/8 inch board. What is the remaining width?',
        inputs: { mode: 'subtract', aNum: '7', aDen: '8', bNum: '3', bDen: '8' },
        result: '7/8 − 3/8 = 4/8 = 1/2 (0.5)',
        insight: '7/8 − 3/8 = 4/8, which simplifies to 1/2 inch. Since both fractions already share the same denominator, the subtraction is straightforward: just subtract the numerators. The remaining board width is exactly 1/2 inch, which is a standard measurement.',
      },
      {
        scenario: 'A student is studying probability and needs to find P(A and B) for independent events. Event A has probability 1/3 and Event B has probability 1/4. For independent events, P(A and B) = P(A) × P(B).',
        inputs: { mode: 'multiply', aNum: '1', aDen: '3', bNum: '1', bDen: '4' },
        result: '1/3 × 1/4 = 1/12 (≈0.0833)',
        insight: '1/3 × 1/4 = 1/12. For independent events, multiply the probabilities directly. The calculator confirms the result is already in simplest form (1 and 12 share no common factors). The probability of both events occurring is 1/12 or approximately 0.0833 (8.33%).',
      },
    ],
    proTips: [
      'When adding or subtracting, first check if the denominators already match — if so, you can skip the LCM step and just add or subtract the numerators directly. This is much faster.',
      'Remember the "keep-change-flip" mnemonic for division: Keep the first fraction, Change the division sign to multiplication, and Flip the second fraction (use its reciprocal). This transforms division into multiplication, which is much simpler.',
      'Always check if your answer can be simplified. Even if the calculator does it automatically, understanding the simplification process helps you catch errors and build number sense.',
      'For cooking and construction, you may want to convert the simplified fraction to a common inch fraction or cup measurement after seeing the result. The decimal equivalent helps with this conversion.',
      'Negative numerators are mathematically valid — a negative fraction is just a fraction with a minus sign. The convention is to keep the denominator positive and put the sign on the numerator.',
    ],
    limitations: [
      'This calculator works with proper and improper fractions using integer numerators and denominators. Denominators must be positive integers greater than zero. Mixed numbers (e.g., 2 1/3) must be converted to improper fractions (7/3) before entry.',
      'Arithmetic is exact for whole numbers of any practical size (it does not use floating point). The decimal equivalent is rounded to 8 decimal places; when the exact decimal is longer or repeats, a second row shows it with the repeating digits in brackets (for example 1/7 = 0.(142857)).',
      'For comparing which fraction is larger (e.g., 3/7 vs 4/9), use the decimal equivalents or cross-multiply — this calculator performs arithmetic, not comparison.',
      'This tool handles only finite rational arithmetic between two fractions at a time. For symbolic fractions involving variables, continued fractions, or infinite series, use a computer algebra system.',
    ],
    quickReference: [
      { label: 'Addition Rule', value: 'a/b + c/d = (ad + bc) / bd' },
      { label: 'Subtraction Rule', value: 'a/b − c/d = (ad − bc) / bd' },
      { label: 'Multiplication Rule', value: 'a/b × c/d = ac / bd' },
      { label: 'Division Rule', value: 'a/b ÷ c/d = ad / bc' },
      { label: 'Simplify', value: 'Divide numerator and denominator by GCD' },
      { label: 'LCM', value: 'Least Common Multiple for common denominator' },
      { label: 'Reciprocal', value: 'Flip fraction (swap numerator and denominator)' },
      { label: 'Improper Fraction', value: 'Numerator > Denominator (value > 1)' },
      { label: 'Mixed → Improper', value: 'Whole × Den + Num over original Den' },
      { label: 'Division by Zero', value: 'Undefined — denominator must never be zero' },
    ],
    faqs: [
      {
        question: 'Why do I need a common denominator for addition but not multiplication?',
        answer: 'Addition combines parts of potentially different-sized wholes. Think of adding 1/2 (half a dollar) + 1/4 (a quarter) — you need to express both in the same units before combining. Converting 1/2 to 2/4 lets you add: 2/4 + 1/4 = 3/4. Multiplication takes a fraction of a fraction: 1/2 multiplied by 1/4 means "take half of one quarter," which naturally gives 1/8 without needing a common denominator. Multiplication inherently accounts for the different unit sizes.',
      },
      {
        question: 'Why do we simplify fractions?',
        answer: 'Simplifying (reducing to lowest terms) makes the result easier to understand, compare, and work with. The fractions 4/8 and 1/2 represent the same value, but 1/2 is immediately recognizable. Simplification also helps with comparing fractions (which is larger: 3/6 or 2/4? Both equal 1/2) and with performing further arithmetic — simpler numbers mean fewer chances for calculation errors.',
      },
      {
        question: 'What is an improper fraction and when should I use it?',
        answer: 'An improper fraction has a numerator larger than the denominator (e.g., 7/4 or 3/2). It represents a value greater than 1. In higher mathematics, improper fractions are preferred over mixed numbers because they are easier to multiply, divide, and use in algebraic formulas. The calculator displays improper fractions in their simplified form — for example, 6/4 simplifies to 3/2, not 1 1/2. In algebra and calculus, always work with improper fractions rather than mixed numbers.',
      },
      {
        question: 'How do I enter a mixed number like 2 1/3?',
        answer: 'Convert the mixed number to an improper fraction first. For 2 1/3: multiply the whole number by the denominator (2 × 3 = 6), then add the numerator (6 + 1 = 7), and place over the original denominator (7/3). So enter numerator 7 and denominator 3. If you have two mixed numbers, convert both before entering. This calculator works with improper fractions and simplified fractions — it does not have a separate mixed-number input mode (a result greater than 1 is also shown as a mixed number).',
      },
      {
        question: 'What happens when the result is a whole number?',
        answer: 'When the numerator is divisible by the denominator (e.g., 6/3 = 2), the calculator displays the result as a whole number rather than a fraction. The simplified fraction would be 2/1, which the calculator recognizes as an integer and displays as just "2". The decimal equivalent will also show the whole number without any fractional part.',
      },
      {
        question: 'Can I use negative fractions and what do they mean?',
        answer: 'Yes, you can enter negative numerators. The calculator handles negative values correctly in all operations. By convention, the negative sign is kept on the numerator and the denominator stays positive. For example, −3/4 + 1/4 = −2/4, which simplifies to −1/2. The rules for adding and subtracting negative numbers follow standard integer arithmetic: adding a negative is the same as subtraction, and subtracting a negative is the same as addition. In real-world contexts, a negative fraction might represent a loss (finance), a deficit (temperature below zero), or a downward measurement (elevation below sea level).',
      },
      {
        question: 'Why does dividing by a fraction give a larger number?',
        answer: 'Dividing by a fraction is equivalent to multiplying by its reciprocal. When you divide 6 by 1/2, you are asking "how many halves are in 6?" The answer is 12, which is larger than 6. This makes intuitive sense: a half is smaller than 1, so more halves fit into any number. When you divide by a fraction less than 1, the quotient is larger than the dividend. When you divide by a fraction greater than 1 (e.g., 3/2), the quotient is smaller. This is the same principle as: dividing by 0.5 is the same as multiplying by 2.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Fraction (Mathematics)', url: 'https://en.wikipedia.org/wiki/Fraction_(mathematics)' },
      { source: 'Wolfram MathWorld - Fraction', url: 'https://mathworld.wolfram.com/Fraction.html' },
      { source: 'Khan Academy - Fractions', url: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic' },
    ],
  },
};

export default fractionConfig;
