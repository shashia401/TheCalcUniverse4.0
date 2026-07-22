import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RatioPanel from './RatioPanel';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyRatio(a: number, b: number): [number, number] {
  const g = gcd(Math.round(a * 1e9), Math.round(b * 1e9));
  return [Math.round(a * 1e9) / g, Math.round(b * 1e9) / g];
}

const ratioConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'A',
      type: 'number',
      placeholder: '16',
      step: 0.01,
      required: true,
      helpText: 'First value of ratio A : B',
    },
    {
      id: 'b',
      label: 'B',
      type: 'number',
      placeholder: '9',
      step: 0.01,
      required: true,
      helpText: 'Second value of ratio A : B',
    },
    {
      id: 'c',
      label: 'C',
      type: 'number',
      placeholder: '32',
      step: 0.01,
      helpText: 'First value of second ratio C : D (leave D blank to solve for D, or vice versa)',
    },
    {
      id: 'd',
      label: 'D',
      type: 'number',
      placeholder: '',
      step: 0.01,
      helpText: 'Second value of second ratio C : D',
    },
    {
      id: 'preset',
      label: 'Aspect Ratio Presets',
      type: 'select',
      required: false,
      options: [
        { label: 'None (manual input)', value: 'none' },
        { label: '16:9 (HD Video)', value: '16:9' },
        { label: '4:3 (Standard)', value: '4:3' },
        { label: '1:1 (Square)', value: '1:1' },
        { label: '21:9 (Ultrawide)', value: '21:9' },
        { label: '3:2 (Photo)', value: '3:2' },
        { label: '8:5 (16:10)', value: '8:5' },
        { label: '9:16 (Portrait)', value: '9:16' },
        { label: '2:3 (Portrait Photo)', value: '2:3' },
        { label: '4:5 (Instagram)', value: '4:5' },
        { label: '5:4 (Medium Format)', value: '5:4' },
      ],
    },
  ],
  calculate: (values) => {
    const a = parseFloat(values.a);
    const b = parseFloat(values.b);
    const cRaw = values.c;
    const dRaw = values.d;
    const c = cRaw ? parseFloat(cRaw) : NaN;
    const d = dRaw ? parseFloat(dRaw) : NaN;

    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return [];

    const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();
    const [sa, sb] = simplifyRatio(a, b);
    const ratio = a / b;

    // Solve proportion A:B = C:D
    let solvedValue: string | null = null;
    let solveLabel = '';

    if (!isNaN(c) && isNaN(d) && c > 0) {
      // Solve for D: D = B * C / A
      const solvedD = (b * c) / a;
      solvedValue = fmt(solvedD);
      solveLabel = `D = ${fmt(solvedD)}   (${fmt(c)} : ${fmt(solvedD)})`;
    } else if (isNaN(c) && !isNaN(d) && d > 0) {
      // Solve for C: C = A * D / B
      const solvedC = (a * d) / b;
      solvedValue = fmt(solvedC);
      solveLabel = `C = ${fmt(solvedC)}   (${fmt(solvedC)} : ${fmt(d)})`;
    } else if (!isNaN(c) && !isNaN(d) && c > 0 && d > 0) {
      // Both given — check if proportional
      const ratio2 = c / d;
      const match = Math.abs(ratio - ratio2) < 0.001;
      solvedValue = match ? 'Proportional ✓' : `Not proportional (${fmt(c / d)} vs ${fmt(ratio)})`;
      solveLabel = `${fmt(c)} : ${fmt(d)} = ${fmt(c / d)}`;
    }

    const results = [
      {
        id: 'simplified',
        label: 'Simplified Ratio',
        value: `${sa} : ${sb}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'decimal',
        label: 'Decimal (A/B)',
        value: fmt(ratio),
        color: 'neutral' as const,
      },
      {
        id: 'fraction',
        label: 'As Fraction',
        value: `${fmt(a)} / ${fmt(b)}`,
        color: 'neutral' as const,
      },
      ...(solvedValue !== null
        ? [{
            id: 'proportionResult' as const,
            label: solveLabel.includes('D =') || solveLabel.includes('C =') ? 'Missing Value Solved' : 'Proportion Check',
            value: solvedValue,
            highlight: true,
            color: 'positive' as const,
          } as const]
        : []),
      ...(solvedValue !== null
        ? [{
            id: 'proportionSteps' as const,
            label: 'Proportion Steps',
            value: solveLabel,
            color: 'neutral' as const,
          } as const]
        : []),
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RatioPanel, { values, results });
  },
  educational: {
    formula: 'A/B = C/D  →  AD = BC  →  solve for the missing term',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Ratio &amp; Proportion</text><text x="220" y="55" text-anchor="middle" font-size="14" fill="var(--svg-666666)">A ratio compares two quantities using division</text><rect x="80" y="80" width="100" height="30" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".2" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="130" y="99" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">A (part 1)</text><rect x="80" y="125" width="60" height="30" rx="4" fill="var(--svg-22c55e)" fill-opacity=".2" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="110" y="144" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">B</text><text x="200" y="115" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--svg-8b5cf6)">=</text><rect x="240" y="80" width="80" height="30" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".2" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="280" y="99" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">C</text><rect x="240" y="125" width="50" height="30" rx="4" fill="var(--svg-22c55e)" fill-opacity=".2" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="265" y="144" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">D</text><text x="220" y="200" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Cross-Multiplication</text><text x="220" y="223" text-anchor="middle" font-size="15" fill="var(--svg-555555)">A &times; D = B &times; C</text><text x="220" y="248" text-anchor="middle" font-size="13" fill="var(--svg-666666)">If three values are known, the fourth can be found</text><text x="220" y="275" text-anchor="middle" font-size="13" fill="var(--svg-666666)">Common uses: scaling recipes, unit conversion, maps</text><text x="220" y="298" text-anchor="middle" font-size="13" fill="var(--svg-666666)">Aspect ratio: 16:9 means width/height = 16/9</text></svg>',
      alt: 'Two sets of bars representing the two ratios A:B and C:D in a proportion, with an equals sign between them and cross-multiplication formula',
      caption: 'A proportion states that two ratios are equal; cross-multiplication solves for the missing term',
    },
    formulaDescription:
      'A proportion states that two ratios are equal. Cross-multiplication (A × D = B × C) allows solving for any missing term. This is fundamental in scaling, unit conversion, recipe adjustments, and maintaining aspect ratios.',
    variables: [
      { symbol: 'A : B', name: 'First Ratio', description: 'The known ratio. Typically the model ratio or desired proportion (e.g., 16:9 for widescreen). A and B are the two quantities being compared.' },
      { symbol: 'C : D', name: 'Second Ratio', description: 'The equivalent ratio with one unknown value to solve for. Enter C and leave D blank (or vice versa) to solve the proportion.' },
      { symbol: 'Ratio', name: 'Decimal Ratio', description: 'A divided by B. The numeric value of the ratio. For 16:9, the decimal ratio is 16/9 ≈ 1.778.' },
    ],
    howToUse: [
      'Enter values A and B for the first ratio (these are required).',
      'Enter either C or D (leave the other blank) to solve for the missing value in the proportion A:B = C:D.',
      'Use the preset dropdown for common aspect ratios: 16:9 (HD video), 4:3 (standard), 1:1 (square), 21:9 (ultrawide), and more.',
      'View the simplified ratio in its smallest integer form, the decimal ratio (A/B), and the fraction form.',
      'If both C and D are provided, the calculator checks whether the ratios are proportional.',
    ],
    explanation:
      'Ratios and proportions are everywhere: aspect ratios for screens (16:9, 4:3), recipe scaling (double a recipe while maintaining ingredient proportions), map scales (1:100,000 means 1 cm on the map equals 1 km in reality), unit conversion (miles to kilometers), and financial ratios (price-to-earnings ratio). A ratio A:B compares two quantities by division. A proportion states that two ratios are equal: A:B = C:D, which is equivalent to A/B = C/D. Cross-multiplication (A × D = B × C) makes solving for any missing term straightforward. Simplifying a ratio by dividing by the GCD gives the smallest integer representation. For example, the ratio 32:18 simplifies to 16:9 (dividing both by 2). The decimal form of a ratio (A/B) is useful for comparison — the aspect ratio 16:9 gives the decimal 1.778, meaning the width is 1.778 times the height. The built-in preset dropdown provides common aspect ratios for media production, photography, and design, making it easy to calculate scaled dimensions without remembering the exact numbers.',
    faqs: [
      {
        question: 'How do I scale an image without distorting it?',
        answer: 'To scale an image proportionally, maintain the aspect ratio. If your image is 1600×900 (16:9) and you want the width to be 800, set C = 800 and solve for D: D = (900 × 800) / 1600 = 450. So 800×450 maintains the 16:9 ratio perfectly.',
      },
      {
        question: 'What does simplifying a ratio mean?',
        answer: 'Simplifying a ratio means finding the smallest integer pair with the same proportion. Divide both numbers by their greatest common divisor (GCD). For example, 32:18 simplifies to 16:9 (dividing by GCD = 2). A simplified ratio is easier to understand and compare.',
      },
      {
        question: 'How do I use the proportion solver?',
        answer: 'Enter A, B, and either C or D — leave the remaining field empty. The calculator solves the proportion A:B = C:D using cross-multiplication. For example, if A=16, B=9, C=32: D = (9 × 32) / 16 = 18, so 16:9 = 32:18.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Ratio', url: 'https://en.wikipedia.org/wiki/Ratio' },
      { source: 'Wolfram MathWorld - Ratio', url: 'https://mathworld.wolfram.com/Ratio.html' },
    ],
  },
};

export default ratioConfig;
