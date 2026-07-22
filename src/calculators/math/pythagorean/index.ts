import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PythagoreanPanel from './PythagoreanPanel';

const pythagoreanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Find',
      type: 'select',
      required: true,
      options: [
        { label: 'Hypotenuse (c) — given legs a and b', value: 'hypotenuse' },
        { label: 'Leg a — given hypotenuse c and leg b', value: 'leg_a' },
        { label: 'Leg b — given hypotenuse c and leg a', value: 'leg_b' },
      ],
    },
    {
      id: 'a',
      label: 'Leg a',
      type: 'number',
      placeholder: '3',
      min: 0,
      step: 0.001,
      helpText: 'One of the two shorter sides of the right triangle',
      showWhen: (values) => values.mode !== 'leg_a',
    },
    {
      id: 'b',
      label: 'Leg b',
      type: 'number',
      placeholder: '4',
      min: 0,
      step: 0.001,
      showWhen: (values) => values.mode !== 'leg_b',
    },
    {
      id: 'c',
      label: 'Hypotenuse c',
      type: 'number',
      placeholder: '5',
      min: 0,
      step: 0.001,
      helpText: 'The longest side, opposite the right angle',
      showWhen: (values) => values.mode !== 'hypotenuse',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'hypotenuse';
    const a = parseFloat(values.a);
    const b = parseFloat(values.b);
    const c = parseFloat(values.c);

    const fmt = (n: number) => parseFloat(n.toFixed(8)).toString();
    const deg = (r: number) => r * (180 / Math.PI);

    if (mode === 'hypotenuse') {
      if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return [];
      const hyp = Math.sqrt(a * a + b * b);
      const area = 0.5 * a * b;
      const perimeter = a + b + hyp;
      const angleA = deg(Math.atan(a / b));
      const angleB = 90 - angleA;

      // SOH CAH TOA steps
      const soh = `sin(α) = opposite/hypotenuse = a/c = ${a}/${fmt(hyp)} = ${(a / hyp).toFixed(4)} → α = ${angleA.toFixed(2)}°`;
      const cah = `cos(α) = adjacent/hypotenuse = b/c = ${b}/${fmt(hyp)} = ${(b / hyp).toFixed(4)} → α = ${angleA.toFixed(2)}°`;
      const toa = `tan(α) = opposite/adjacent = a/b = ${a}/${b} = ${(a / b).toFixed(4)} → α = ${angleA.toFixed(2)}°`;

      return [
        { id: 'hyp', label: 'Hypotenuse (c)', value: fmt(hyp), highlight: true, color: 'positive' },
        { id: 'area', label: 'Triangle Area', value: fmt(area), color: 'neutral' },
        { id: 'perimeter', label: 'Perimeter', value: fmt(perimeter), color: 'neutral' },
        { id: 'angleA', label: 'Angle A (opposite leg a)', value: `${angleA.toFixed(4)}°`, color: 'neutral' },
        { id: 'angleB', label: 'Angle B (opposite leg b)', value: `${angleB.toFixed(4)}°`, color: 'neutral' },
        { id: 'sohStep', label: 'SOH Step', value: soh, color: 'neutral' },
        { id: 'cahStep', label: 'CAH Step', value: cah, color: 'neutral' },
        { id: 'toaStep', label: 'TOA Step', value: toa, color: 'neutral' },
      ];
    }

    if (mode === 'leg_a') {
      if (isNaN(c) || isNaN(b) || c <= 0 || b <= 0 || c <= b) return [];
      const legA = Math.sqrt(c * c - b * b);
      const angleA = deg(Math.atan(legA / b));
      return [
        { id: 'leg_a', label: 'Leg a', value: fmt(legA), highlight: true, color: 'positive' },
        { id: 'area', label: 'Triangle Area', value: fmt(0.5 * legA * b), color: 'neutral' },
        { id: 'angleA', label: 'Angle A (opposite leg a)', value: `${angleA.toFixed(4)}°`, color: 'neutral' },
        { id: 'angleB', label: 'Angle B (opposite leg b)', value: `${(90 - angleA).toFixed(4)}°`, color: 'neutral' },
      ];
    }

    if (mode === 'leg_b') {
      if (isNaN(c) || isNaN(a) || c <= 0 || a <= 0 || c <= a) return [];
      const legB = Math.sqrt(c * c - a * a);
      const angleA = deg(Math.atan(a / legB));
      return [
        { id: 'leg_b', label: 'Leg b', value: fmt(legB), highlight: true, color: 'positive' },
        { id: 'area', label: 'Triangle Area', value: fmt(0.5 * a * legB), color: 'neutral' },
        { id: 'angleA', label: 'Angle A (opposite leg a)', value: `${angleA.toFixed(4)}°`, color: 'neutral' },
        { id: 'angleB', label: 'Angle B (opposite leg b)', value: `${(90 - angleA).toFixed(4)}°`, color: 'neutral' },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PythagoreanPanel, { values, results });
  },
  educational: {
    formula: 'a² + b² = c²  →  c = √(a² + b²),  a = √(c² − b²),  b = √(c² − a²)',
    formulaDescription:
      'The Pythagorean theorem states that in any right triangle, the square of the hypotenuse equals the sum of the squares of the two legs. The formula can be rearranged to solve for any side: c = √(a² + b²) when solving for the hypotenuse, or a = √(c² − b²) when solving for a leg. Combined with SOH CAH TOA trigonometry, you can also find all angles of any right triangle from just two side lengths.',
    variables: [
      { symbol: 'a, b', name: 'Legs', description: 'The two shorter sides that form the 90° right angle. Interchangeable in the formula.' },
      { symbol: 'c', name: 'Hypotenuse', description: 'The longest side, always opposite the 90° right angle. Always the largest value.' },
      { symbol: 'α, β', name: 'Acute Angles', description: 'The two acute angles opposite legs a and b respectively. Always sum to 90°.' },
    ],
    howToUse: [
      'Select what you want to find — hypotenuse, leg a, leg b, or the acute angles.',
      'Enter the known values for the other two sides or angle.',
      'View the missing side, calculated area, perimeter, and both acute angles.',
      'The SOH CAH TOA trigonometry steps show exactly how each angle is derived from the side ratios.',
      'The SVG right triangle dynamically scales based on the side lengths, showing labeled sides and angles.',
    ],
    explanation:
      'The Pythagorean theorem is one of the most fundamental relationships in Euclidean geometry, with a history dating back over 3,500 years to Babylonian mathematics. It applies exclusively to right triangles (triangles with one 90° angle). The theorem states that the area of the square on the hypotenuse equals the sum of the areas of the squares on the two legs — a² + b² = c². When solving for a leg, the formula is rearranged to a = √(c² − b²). The angles are found using SOH CAH TOA trigonometry: sin(α) = opposite/hypotenuse, cos(α) = adjacent/hypotenuse, tan(α) = opposite/adjacent. The theorem has practical applications in construction (squaring corners), navigation (shortest distances), physics (vector magnitudes, projectile motion), and computer graphics (distance calculations, collision detection). The Pythagorean theorem is so fundamental that it appears in nearly every branch of mathematics and science.',
    faqs: [
      {
        question: 'What are Pythagorean triples?',
        answer: 'Sets of three positive integers where a² + b² = c² exactly. The simplest and most well-known is 3-4-5 (9 + 16 = 25). Any multiple of a Pythagorean triple is also a triple (6-8-10, 9-12-15, etc.). Other common triples include 5-12-13, 8-15-17, and 7-24-25. There are infinitely many Pythagorean triples, and they can be generated using Euclid\'s formula.',
      },
      {
        question: 'Does the theorem work for non-right triangles?',
        answer: 'No. The Pythagorean theorem only applies to right triangles. For other triangles, use the Law of Cosines: c² = a² + b² − 2ab·cos(C), which is a generalization. When angle C = 90°, cos(90°) = 0, and the Law of Cosines reduces to the Pythagorean theorem — showing that Pythagoras is a special case of the more general relationship.',
      },
      {
        question: 'How do I find the angles of a right triangle?',
        answer: 'Use SOH CAH TOA trigonometry. If you know the sides, sin(α) = a/c (opposite/hypotenuse), cos(α) = b/c (adjacent/hypotenuse), or tan(α) = a/b (opposite/adjacent). Take the inverse sine (arcsin), inverse cosine (arccos), or inverse tangent (arctan) of the ratio to find the angle in degrees or radians. The calculator shows all three trig steps and their corresponding inverse functions.',
      },
      {
        question: 'What is SOH CAH TOA?',
        answer: 'A mnemonic device for remembering right triangle trigonometry: Sine = Opposite / Hypotenuse, Cosine = Adjacent / Hypotenuse, Tangent = Opposite / Adjacent. Given any two sides of a right triangle, SOH CAH TOA lets you find any angle by choosing the appropriate ratio. For example, if you know the opposite and adjacent sides, use TOA (tangent) to find the angle.',
      },
      {
        question: 'How is the Pythagorean theorem used in real-world applications?',
        answer: 'Construction workers use it to ensure corners are square (a 3-4-5 measurement guarantees a right angle). GPS systems use it for trilateration calculations. Computer graphics rely on it for calculating distances between objects, rendering 3D scenes, and detecting collisions. In physics, it calculates vector magnitudes, resultants of forces, and projectile trajectories. Even screen size measurements (e.g., a 27-inch monitor is measured diagonally using the theorem on the width and height).',
      },
    ],
    diagram: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" style="font-family:system-ui,-apple-system,sans-serif;background:#fff">
  <!-- Leg a (vertical, purple) -->
  <line x1="60" y1="200" x2="60" y2="50" stroke="var(--svg-8b5cf6)" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Leg b (horizontal, green) -->
  <line x1="60" y1="200" x2="210" y2="200" stroke="var(--svg-10b981)" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Hypotenuse c (red) -->
  <line x1="60" y1="50" x2="210" y2="200" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Right angle square marker -->
  <polyline points="60,185 75,185 75,200" fill="none" stroke="var(--svg-64748b)" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Side label a -->
  <text x="48" y="130" fill="var(--svg-8b5cf6)" font-size="16" font-weight="600" text-anchor="end" font-family="system-ui">a</text>
  <!-- Side label b -->
  <text x="135" y="220" fill="var(--svg-10b981)" font-size="16" font-weight="600" text-anchor="middle" font-family="system-ui">b</text>
  <!-- Side label c (hypotenuse) -->
  <text x="135" y="118" fill="var(--svg-ef4444)" font-size="16" font-weight="600" text-anchor="middle" font-family="system-ui" transform="rotate(45,135,118)">c</text>
  <!-- Formula display -->
  <text x="150" y="248" fill="var(--svg-334155)" font-size="15" font-weight="700" text-anchor="middle" font-family="system-ui">a² + b² = c²</text>
</svg>`,
      alt: 'A right triangle with legs labeled a in purple and b in green, hypotenuse labeled c in red, right angle marked with a square, and the formula a squared plus b squared equals c squared.',
      caption: 'The Pythagorean theorem relates the three sides of any right triangle.',
    },
    citations: [
      { source: 'Wikipedia - Pythagorean Theorem', url: 'https://en.wikipedia.org/wiki/Pythagorean_theorem' },
      { source: 'Wolfram MathWorld - Pythagorean Theorem', url: 'https://mathworld.wolfram.com/PythagoreanTheorem.html' },
    ],
  },
};

export default pythagoreanConfig;
