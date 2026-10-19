import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TrianglePanel from './TrianglePanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import {
  type AngleUnit,
  type Tri,
  angleToDeg,
  area,
  classify,
  fmtAngle,
  fmtNum8 as fmt,
  solveAngleAngleSide,
  solveSAS,
  solveSSS,
} from '../shared/triangle';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

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
        { label: 'Two Angles & a Non-included Side (AAS)', value: 'aas' },
      ],
    },
    {
      id: 'angleUnit',
      label: 'Angle unit',
      type: 'select',
      defaultValue: 'deg',
      options: [
        { label: 'Degrees (°)', value: 'deg' },
        { label: 'Radians (rad)', value: 'rad' },
      ],
      helpText: 'Used for the angles you enter and for every angle in the results',
    },
    // SSS inputs
    { id: 'sideA', label: 'Side a (opposite A)', type: 'number', placeholder: '5', step: 0.01, required: true, helpText: 'Length of side a', showWhen: (v) => v.mode === 'sss' },
    { id: 'sideB', label: 'Side b (opposite B)', type: 'number', placeholder: '6', step: 0.01, required: true, helpText: 'Length of side b', showWhen: (v) => v.mode === 'sss' },
    { id: 'sideC', label: 'Side c (opposite C)', type: 'number', placeholder: '7', step: 0.01, required: true, helpText: 'Length of side c', showWhen: (v) => v.mode === 'sss' },
    // SAS inputs
    { id: 'sasSideB', label: 'Side b', type: 'number', placeholder: '6', step: 0.01, required: true, helpText: 'Length of side b', showWhen: (v) => v.mode === 'sas' },
    { id: 'sasAngleA', label: 'Angle A (included)', type: 'number', placeholder: '45', step: 0.1, required: true, helpText: 'Angle between sides b and c, greater than 0 and less than 180° (π rad)', showWhen: (v) => v.mode === 'sas' },
    { id: 'sasSideC', label: 'Side c', type: 'number', placeholder: '7', step: 0.01, required: true, helpText: 'Length of side c', showWhen: (v) => v.mode === 'sas' },
    // ASA inputs
    { id: 'asaAngleA', label: 'Angle A', type: 'number', placeholder: '45', step: 0.1, required: true, helpText: 'Angle at vertex A', showWhen: (v) => v.mode === 'asa' },
    { id: 'asaSideC', label: 'Side c (included)', type: 'number', placeholder: '7', step: 0.01, required: true, helpText: 'Side between angles A and B', showWhen: (v) => v.mode === 'asa' },
    { id: 'asaAngleB', label: 'Angle B', type: 'number', placeholder: '60', step: 0.1, required: true, helpText: 'Angle at vertex B', showWhen: (v) => v.mode === 'asa' },
    // AAS inputs
    { id: 'aasAngleA', label: 'Angle A', type: 'number', placeholder: '30', step: 0.1, required: true, helpText: 'Angle at vertex A', showWhen: (v) => v.mode === 'aas' },
    { id: 'aasAngleB', label: 'Angle B', type: 'number', placeholder: '70', step: 0.1, required: true, helpText: 'Angle at vertex B', showWhen: (v) => v.mode === 'aas' },
    { id: 'aasSideA', label: 'Side a (opposite A)', type: 'number', placeholder: '10', step: 0.01, required: true, helpText: 'Side opposite angle A', showWhen: (v) => v.mode === 'aas' },
  ],
  calculate: (values) => {
    const mode = values.mode || 'sss';
    const unit: AngleUnit = values.angleUnit === 'rad' ? 'rad' : 'deg';
    const n = (k: string) => parseNumberStrict(values[k]);
    const ang = (k: string) => angleToDeg(n(k), unit);
    const bad = (m: string): CalculatorResult[] => [{ id: 'triangleError', label: 'No such triangle', value: m, color: 'negative' }];

    let t: Tri | null = null;
    if (mode === 'sss') {
      const [a, b, c] = [n('sideA'), n('sideB'), n('sideC')];
      if (![a, b, c].every(Number.isFinite) || a <= 0 || b <= 0 || c <= 0) return [];
      t = solveSSS(a, b, c);
      if (!t) return bad('These three lengths cannot form a triangle: each side must be shorter than the sum of the other two.');
    } else if (mode === 'sas') {
      const [b, A, c] = [n('sasSideB'), ang('sasAngleA'), n('sasSideC')];
      if (![b, A, c].every(Number.isFinite) || b <= 0 || c <= 0) return [];
      if (A <= 0 || A >= 180) return bad('The included angle must be greater than 0 and less than 180° (π radians).');
      const s = solveSAS(b, c, A); // x = b, y = c, included angle = A
      if (s) t = { a: s.c, b: s.a, c: s.b, A: s.C, B: s.A, C: s.B };
    } else if (mode === 'asa') {
      const [A, c, B] = [ang('asaAngleA'), n('asaSideC'), ang('asaAngleB')];
      if (![A, c, B].every(Number.isFinite) || c <= 0) return [];
      if (A <= 0 || B <= 0 || A + B >= 180) return bad('Both angles must be positive and add up to less than 180° (π radians).');
      t = solveAngleAngleSide({ A, B }, c, 'C');
    } else if (mode === 'aas') {
      const [A, B, a] = [ang('aasAngleA'), ang('aasAngleB'), n('aasSideA')];
      if (![A, B, a].every(Number.isFinite) || a <= 0) return [];
      if (A <= 0 || B <= 0 || A + B >= 180) return bad('Both angles must be positive and add up to less than 180° (π radians).');
      t = solveAngleAngleSide({ A, B }, a, 'A');
    }
    if (!t) return [];

    const k = classify(t);
    const au = unit === 'rad' ? 'rad' : '°';
    return [
      { id: 'triangleType', label: 'Triangle Type', value: `${k.bySides} ${k.byAngles}`, color: 'positive', highlight: true },
      { id: 'angleA', label: 'Angle A', value: fmtAngle(t.A, unit), unit: au, color: 'neutral' },
      { id: 'angleB', label: 'Angle B', value: fmtAngle(t.B, unit), unit: au, color: 'neutral' },
      { id: 'angleC', label: 'Angle C', value: fmtAngle(t.C, unit), unit: au, color: 'neutral' },
      { id: 'sideALabel', label: 'Side a', value: fmt(t.a), color: 'neutral' },
      { id: 'sideBLabel', label: 'Side b', value: fmt(t.b), color: 'neutral' },
      { id: 'sideCLabel', label: 'Side c', value: fmt(t.c), color: 'neutral' },
      { id: 'perimeter', label: 'Perimeter', value: fmt(t.a + t.b + t.c), color: 'neutral' },
      { id: 'area', label: 'Area', value: `${fmt(area(t))} sq units`, color: 'neutral' },
      { id: '_triangle', label: 'triangle', value: JSON.stringify(t) },
    ];
  },
  explainSteps: (values) => {
    const rows = triangleConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const g = (id: string) => resultValue(rows, id) ?? '';
    const deg = values.angleUnit !== 'rad';
    const ang = g; // the angle rows already carry their unit ("30°" / "0.5236 rad")
    const straight = deg ? '180°' : 'π rad';
    const how: Record<string, string> = {
      sss: 'Law of Cosines: find each angle from the three sides',
      sas: 'Law of Cosines for the third side, then the remaining angles',
      asa: `Third angle = ${straight} − A − B, then the Law of Sines for the sides`,
      aas: `Third angle = ${straight} − A − B, then the Law of Sines for the sides`,
    };
    return [
      {
        label: how[values.mode || 'sss'] ?? 'Solve for the unknown sides and angles',
        expr: `a = ${g('sideALabel')},  b = ${g('sideBLabel')},  c = ${g('sideCLabel')};  A = ${ang('angleA')},  B = ${ang('angleB')},  C = ${ang('angleC')}`,
      },
      { label: 'Check: the angles add up to a straight angle', expr: `A + B + C = ${ang('angleA')} + ${ang('angleB')} + ${ang('angleC')} ≈ ${straight}` },
      { label: 'Perimeter: add the three sides', expr: `P = a + b + c = ${g('sideALabel')} + ${g('sideBLabel')} + ${g('sideCLabel')} = ${g('perimeter')}` },
      { label: 'Area: half the product of two sides and the angle between them', expr: `Area = ½ × b × c × sin A = ½ × ${g('sideBLabel')} × ${g('sideCLabel')} × sin(${ang('angleA')}) = ${g('area')}` },
      { label: 'Classify the triangle', expr: g('triangleType') },
    ];
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
      { symbol: 'Area', name: 'Area', description: 'Computed as ½·b·c·sin A from the solved triangle, which equals Heron\'s formula √(s(s−a)(s−b)(s−c)) but stays accurate for thin triangles.' },
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
