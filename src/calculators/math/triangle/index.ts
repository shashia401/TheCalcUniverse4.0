import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TrianglePanel from './TrianglePanel';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

interface TriangleData {
  a: number; sideA: number; angleA: number;
  b: number; sideB: number; angleB: number;
  c: number; sideC: number; angleC: number;
}

function solveSSS(a: number, b: number, c: number): TriangleData | null {
  if (a + b <= c || a + c <= b || b + c <= a) return null;
  if (a <= 0 || b <= 0 || c <= 0) return null;

  const angleA = toDeg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
  const angleB = toDeg(Math.acos((a * a + c * c - b * b) / (2 * a * c)));
  const angleC = 180 - angleA - angleB;

  return {
    a, sideA: a, angleA: Math.round(angleA * 100) / 100,
    b, sideB: b, angleB: Math.round(angleB * 100) / 100,
    c, sideC: c, angleC: Math.round(angleC * 100) / 100,
  };
}

function solveSAS(sideB: number, angleA: number, sideC: number): TriangleData | null {
  if (sideB <= 0 || sideC <= 0 || angleA <= 0 || angleA >= 180) return null;

  const radA = toRad(angleA);
  // Law of cosines: a² = b² + c² - 2bc·cos(A)
  const a = Math.sqrt(sideB * sideB + sideC * sideC - 2 * sideB * sideC * Math.cos(radA));
  const angleB = toDeg(Math.acos((a * a + sideC * sideC - sideB * sideB) / (2 * a * sideC)));
  const angleC = 180 - angleA - angleB;

  return {
    a, sideA: Math.round(a * 100) / 100, angleA: Math.round(angleA * 100) / 100,
    b: sideB, sideB, angleB: Math.round(angleB * 100) / 100,
    c: sideC, sideC, angleC: Math.round(angleC * 100) / 100,
  };
}

function solveASA(angleA: number, sideC: number, angleB: number): TriangleData | null {
  if (sideC <= 0 || angleA <= 0 || angleB <= 0 || angleA + angleB >= 180) return null;

  const angleC = 180 - angleA - angleB;
  const radA = toRad(angleA);
  const radB = toRad(angleB);
  const radC = toRad(angleC);

  // Law of sines: a / sin(A) = b / sin(B) = c / sin(C)
  const a = (sideC * Math.sin(radA)) / Math.sin(radC);
  const b = (sideC * Math.sin(radB)) / Math.sin(radC);

  return {
    a: Math.round(a * 100) / 100, sideA: Math.round(a * 100) / 100, angleA: Math.round(angleA * 100) / 100,
    b: Math.round(b * 100) / 100, sideB: Math.round(b * 100) / 100, angleB: Math.round(angleB * 100) / 100,
    c: sideC, sideC, angleC: Math.round(angleC * 100) / 100,
  };
}

const triangleConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'What do you know?',
      type: 'select',
      required: true,
      options: [
        { label: 'Three Sides (SSS)', value: 'sss' },
        { label: 'Two Sides & Included Angle (SAS)', value: 'sas' },
        { label: 'Two Angles & Included Side (ASA)', value: 'asa' },
      ],
    },
    // SSS inputs
    { id: 'sideA', label: 'Side a (opposite A)', type: 'number', placeholder: '5', step: 0.01, required: true, helpText: 'Length of side a', showWhen: (v) => v.mode === 'sss' },
    { id: 'sideB', label: 'Side b (opposite B)', type: 'number', placeholder: '6', step: 0.01, required: true, helpText: 'Length of side b', showWhen: (v) => v.mode === 'sss' },
    { id: 'sideC', label: 'Side c (opposite C)', type: 'number', placeholder: '7', step: 0.01, required: true, helpText: 'Length of side c', showWhen: (v) => v.mode === 'sss' },
    // SAS inputs
    { id: 'sasSideB', label: 'Side b', type: 'number', placeholder: '6', step: 0.01, required: true, helpText: 'Length of side b', showWhen: (v) => v.mode === 'sas' },
    { id: 'sasAngleA', label: 'Angle A (included)', type: 'number', placeholder: '45', step: 0.1, required: true, helpText: 'Angle between sides b and c (degrees)', showWhen: (v) => v.mode === 'sas' },
    { id: 'sasSideC', label: 'Side c', type: 'number', placeholder: '7', step: 0.01, required: true, helpText: 'Length of side c', showWhen: (v) => v.mode === 'sas' },
    // ASA inputs
    { id: 'asaAngleA', label: 'Angle A', type: 'number', placeholder: '45', step: 0.1, required: true, helpText: 'Angle at vertex A (degrees)', showWhen: (v) => v.mode === 'asa' },
    { id: 'asaSideC', label: 'Side c (included)', type: 'number', placeholder: '7', step: 0.01, required: true, helpText: 'Side between angles A and B', showWhen: (v) => v.mode === 'asa' },
    { id: 'asaAngleB', label: 'Angle B', type: 'number', placeholder: '60', step: 0.1, required: true, helpText: 'Angle at vertex B (degrees)', showWhen: (v) => v.mode === 'asa' },
  ],
  calculate: (values) => {
    const mode = values.mode || 'sss';
    const fmt = (n: number) => {
      if (Number.isInteger(n)) return n.toString();
      return n.toFixed(2).replace(/\.?0+$/, '');
    };

    let triangle: TriangleData | null = null;

    if (mode === 'sss') {
      const a = parseFloat(values.sideA);
      const b = parseFloat(values.sideB);
      const c = parseFloat(values.sideC);
      if ([a, b, c].some(isNaN)) return [];
      triangle = solveSSS(a, b, c);
    } else if (mode === 'sas') {
      const b = parseFloat(values.sasSideB);
      const angleA = parseFloat(values.sasAngleA);
      const c = parseFloat(values.sasSideC);
      if ([b, angleA, c].some(isNaN)) return [];
      triangle = solveSAS(b, angleA, c);
    } else if (mode === 'asa') {
      const angleA = parseFloat(values.asaAngleA);
      const c = parseFloat(values.asaSideC);
      const angleB = parseFloat(values.asaAngleB);
      if ([angleA, c, angleB].some(isNaN)) return [];
      triangle = solveASA(angleA, c, angleB);
    }

    if (!triangle) return [];

    const results: CalculatorResult[] = [
      { id: 'triangleType', label: 'Triangle Type', value: '', color: 'positive' as const, highlight: true },
      { id: 'angleA', label: 'Angle A', value: `${fmt(triangle.angleA)}°`, color: 'neutral' as const },
      { id: 'angleB', label: 'Angle B', value: `${fmt(triangle.angleB)}°`, color: 'neutral' as const },
      { id: 'angleC', label: 'Angle C', value: `${fmt(triangle.angleC)}°`, color: 'neutral' as const },
      { id: 'sideALabel', label: 'Side a', value: fmt(triangle.sideA), color: 'neutral' as const },
      { id: 'sideBLabel', label: 'Side b', value: fmt(triangle.sideB), color: 'neutral' as const },
      { id: 'sideCLabel', label: 'Side c', value: fmt(triangle.sideC), color: 'neutral' as const },
    ];

    // Classify triangle
    const sides = [triangle.sideA, triangle.sideB, triangle.sideC].sort((a, b) => a - b);
    let typeName: string;
    if (Math.abs(sides[0] - sides[2]) < 0.01) {
      typeName = 'Equilateral';
    } else if (Math.abs(sides[0] - sides[1]) < 0.01 || Math.abs(sides[1] - sides[2]) < 0.01) {
      typeName = 'Isosceles';
    } else {
      typeName = 'Scalene';
    }

    const angles = [triangle.angleA, triangle.angleB, triangle.angleC];
    if (angles.some(a => a > 90.01)) {
      typeName += ' Obtuse';
    } else if (angles.some(a => Math.abs(a - 90) < 0.01)) {
      typeName += ' Right';
    } else {
      typeName += ' Acute';
    }

    results[0] = { ...results[0], value: typeName, color: 'positive' };

    // Area (Heron's formula)
    const s = (triangle.sideA + triangle.sideB + triangle.sideC) / 2;
    const area = Math.sqrt(s * (s - triangle.sideA) * (s - triangle.sideB) * (s - triangle.sideC));
    results.push({ id: 'perimeter', label: 'Perimeter', value: fmt(triangle.sideA + triangle.sideB + triangle.sideC), color: 'neutral' });
    results.push({ id: 'area', label: 'Area', value: `${fmt(area)} sq units`, color: 'neutral' });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TrianglePanel, { values, results });
  },
  educational: {
    formula: 'SSS: cos(A) = (b² + c² − a²)/(2bc) | SAS: a² = b² + c² − 2bc·cos(A) | ASA: a = c·sin(A)/sin(C)',
    formulaDescription:
      'The law of cosines relates the sides of a triangle to the cosine of one angle: a² = b² + c² − 2bc·cos(A). It is a generalization of the Pythagorean theorem that works for any triangle, not just right triangles. The law of sines relates side lengths to the sines of their opposite angles: a/sin(A) = b/sin(B) = c/sin(C). Together, these two laws provide everything needed to solve any triangle when given three independent measurements (SSS, SAS, or ASA). The third angle is always found by subtracting the other two from 180° since all interior angles of any triangle sum to 180°.',
    diagram: {
      svg: '<svg viewBox="0 0 380 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<polygon points="190,30 40,250 340,250" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2.5"/>' +
        '<circle cx="190" cy="30" r="4.5" fill="var(--svg-3b82f6)"/><text x="185" y="20" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">A</text>' +
        '<circle cx="40" cy="250" r="4.5" fill="var(--svg-3b82f6)"/><text x="24" y="272" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" font-weight="600">B</text>' +
        '<circle cx="340" cy="250" r="4.5" fill="var(--svg-3b82f6)"/><text x="342" y="272" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" font-weight="600">C</text>' +
        '<text x="100" y="265" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" text-anchor="middle">side c</text>' +
        '<text x="270" y="265" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" text-anchor="middle">side a</text>' +
        '<text x="190" y="145" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-1e293b)" text-anchor="middle" transform="rotate(-10,190,145)">side b</text>' +
        '<path d="M190,58 A28,28 0 0,0 166,68" fill="none" stroke="var(--svg-f59e0b)" stroke-width="2"/>' +
        '<text x="180" y="52" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-f59e0b)" font-weight="600">A</text>' +
        '<path d="M58,234 A28,28 0 0,1 85,246" fill="none" stroke="var(--svg-f59e0b)" stroke-width="2"/>' +
        '<text x="55" y="232" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-f59e0b)" font-weight="600">B</text>' +
        '<path d="M325,232 A28,28 0 0,0 298,222" fill="none" stroke="var(--svg-f59e0b)" stroke-width="2"/>' +
        '<text x="328" y="230" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-f59e0b)" font-weight="600">C</text>' +
        '<line x1="190" y1="250" x2="190" y2="110" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="5,4"/>' +
        '<text x="198" y="180" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-ef4444)">h (height)</text>' +
        '<text x="160" y="295" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">A = ½ × b × h</text>' +
        '</svg>',
      alt: 'Triangle diagram with labeled sides a, b, c, angles A, B, C marked with arcs, and height shown as dashed line',
      caption: 'Triangle with labeled vertices, sides, angles, and height for area calculation',
    },
    variables: [
      { symbol: 'a, b, c', name: 'Side Lengths', description: 'The three sides of the triangle. Side a is opposite angle A, side b is opposite angle B, and side c is opposite angle C.' },
      { symbol: 'A, B, C', name: 'Interior Angles', description: 'The three interior angles of the triangle, always summing to exactly 180° in Euclidean geometry.' },
      { symbol: 'Area', name: 'Area', description: 'Computed via Heron\'s formula: √(s(s−a)(s−b)(s−c)) where s = (a+b+c)/2 is the semi-perimeter.' },
    ],
    howToUse: [
      'Select the input mode that matches the information you have: SSS (three side lengths), SAS (two sides plus the angle between them), or ASA (two angles plus the side between them).',
      'Enter the known measurements in the labeled fields.',
      'The calculator computes all missing sides, angles, area, and perimeter automatically.',
      'The SVG visualization draws the triangle to scale with labeled sides, angles, and dimensions.',
    ],
    explanation:
      'Triangles are the building blocks of geometry. Any polygon can be decomposed into triangles, making triangle-solving a fundamental skill in geometry, surveying, engineering, and computer graphics. Given any three independent measurements (but not only three angles), the triangle is uniquely determined up to congruence — this is the SSS, SAS, ASA, and AAS congruence rules taught in geometry. The law of cosines is a generalization of the Pythagorean theorem: when angle C = 90°, c² = a² + b² − 2ab·cos(90°) = a² + b² (the familiar Pythagorean theorem). For SSS input, the law of cosines finds the first angle, then the law of sines finds the second, and the third is 180° minus the other two. For ASA, the third angle is found first (180° minus the two known angles), then the law of sines finds the unknown sides. This systematic approach ensures accuracy across all input modes.',
    faqs: [
      {
        question: 'What is the triangle inequality rule?',
        answer: 'The triangle inequality states that the sum of any two sides must be greater than the third side. If a + b ≤ c, no triangle can exist because the two shorter sides cannot reach across the longest side. This is why SSS input accepts any three positive numbers but may return "no valid triangle" if they violate this fundamental geometric constraint. For example, sides 1, 2, and 5 cannot form a triangle because 1 + 2 < 5.',
      },
      {
        question: 'Why does SAS use the included angle?',
        answer: 'The "included angle" is the angle between the two known sides. Without it, two different triangles could share the same two side lengths — imagine a hinge opening to different angles. SAS uniquely determines a triangle because fixing the angle between the two known sides forces a specific third side length via the law of cosines. If you have two sides and a non-included angle, that is the SSA case which can produce zero, one, or two possible triangles.',
      },
      {
        question: 'How do I know which input mode to use?',
        answer: 'Use SSS if you have all three side lengths (common when measuring a physical triangle). Use SAS if you have two sides and the angle between them (common in construction and surveying). Use ASA if you have two angles and the side between them (common in navigation and triangulation). These three patterns cover the most common real-world measurement scenarios. The AAS case (two angles, non-included side) is equivalent to ASA since the third angle can always be found.',
      },
      {
        question: 'Why does the SVG triangle look different from my sketch?',
        answer: 'The SVG renders the triangle to scale based on the computed side lengths. It may appear rotated or flipped differently than your mental image — this is because the canonical coordinate system places vertex C at the origin and vertex B along the positive x-axis for consistent rendering. The shape, proportions, and all angles are geometrically accurate regardless of orientation.',
      },
      {
        question: 'What is Heron\'s formula and when is it used?',
        answer: 'Heron\'s formula computes the area of a triangle using only its three side lengths: A = √(s(s−a)(s−b)(s−c)), where s = (a+b+c)/2 is the semi-perimeter. This is useful when you know all three sides but not the height. It was discovered by Heron of Alexandria and works for any triangle. For SSS mode, this is the primary method for calculating area. For SAS and ASA modes, area can also be computed directly using A = ½ab·sin(C) since you know two sides and the included angle.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Triangle', url: 'https://mathworld.wolfram.com/Triangle.html' },
      { source: 'Wikipedia - Triangle', url: 'https://en.wikipedia.org/wiki/Triangle' },
    ],
  },
};

export default triangleConfig;
