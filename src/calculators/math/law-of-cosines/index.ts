import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import LawOfCosinesPanel from './LawOfCosinesPanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { type AngleUnit, type Tri, angleToDeg, classify, fmtAngle, fmtNum8 as fmt, area, solveSAS, solveSSS, toRad } from '../shared/triangle';

const triangleRows = (t: Tri, unit: AngleUnit, workSteps: string): CalculatorResult[] => {
  const k = classify(t);
  return [
    { id: 'a', label: 'Side a', value: fmt(t.a), color: 'neutral' },
    { id: 'b', label: 'Side b', value: fmt(t.b), color: 'neutral' },
    { id: 'c', label: 'Side c', value: fmt(t.c), highlight: true, color: 'positive' },
    { id: 'angleA', label: 'Angle A', value: fmtAngle(t.A, unit), unit: unit === 'rad' ? 'rad' : '°', color: 'neutral' },
    { id: 'angleB', label: 'Angle B', value: fmtAngle(t.B, unit), unit: unit === 'rad' ? 'rad' : '°', color: 'neutral' },
    { id: 'angleC', label: 'Angle C', value: fmtAngle(t.C, unit), unit: unit === 'rad' ? 'rad' : '°', color: 'neutral' },
    { id: 'triangleType', label: 'Triangle type', value: `${k.bySides} ${k.byAngles}`, color: 'neutral' },
    { id: 'area', label: 'Area', value: `${fmt(area(t))} sq units`, color: 'neutral' },
    { id: 'steps', label: 'Work Steps', value: workSteps, color: 'neutral' },
    { id: '_triangle', label: 'triangle', value: JSON.stringify(t) },
  ];
};

const errorRow = (message: string): CalculatorResult[] => [{ id: 'triangleError', label: 'No such triangle', value: message, color: 'negative' }];

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      options: [
        { label: 'Side (SSS)', value: 'sss' },
        { label: 'Angle (SAS)', value: 'sas' },
      ],
      helpText: 'Select SSS to find angles or SAS to find the third side',
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
      helpText: 'Used for the angle you enter (SAS mode) and for every angle in the results',
    },
    {
      id: 'a',
      label: 'Side a',
      type: 'number',
      placeholder: 'Side a',
      required: true,
      helpText: 'Enter the length of side a',
    },
    {
      id: 'b',
      label: 'Side b',
      type: 'number',
      placeholder: 'Side b',
      required: true,
      helpText: 'Enter the length of side b',
    },
    {
      id: 'c',
      label: 'Side c',
      type: 'number',
      placeholder: 'Side c',
      required: true,
      showWhen: (v) => v.mode === 'sss',
      helpText: 'Enter the length of side c (required in SSS mode)',
    },
    {
      id: 'angleC',
      label: 'Angle C',
      type: 'number',
      placeholder: 'Angle C',
      required: true,
      showWhen: (v) => v.mode === 'sas',
      helpText: 'Enter angle C between sides a and b (SAS mode), in the unit chosen above; it must be greater than 0 and less than 180° (π rad)',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'sss';
    const unit: AngleUnit = values.angleUnit === 'rad' ? 'rad' : 'deg';
    const a = parseNumberStrict(values.a);
    const b = parseNumberStrict(values.b);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return [];

    if (mode === 'sss') {
      const c = parseNumberStrict(values.c);
      if (!Number.isFinite(c)) return [];
      if (a <= 0 || b <= 0 || c <= 0) return [];
      const t = solveSSS(a, b, c);
      if (!t) return errorRow('These three lengths cannot form a triangle: each side must be shorter than the sum of the other two (equal to the sum would be a flat, degenerate triangle).');
      const cosOf = (x: number, y: number, z: number) => (x * x + y * y - z * z) / (2 * x * y);
      const step = (name: string, expr: string, x: number, y: number, z: number, ang: number) =>
        `cos(${name}) = ${expr} = ${fmt(cosOf(x, y, z))}\n${name} = cos⁻¹(${fmt(cosOf(x, y, z))}) = ${fmtAngle(ang, unit)}`;
      const steps = [
        step('C', '(a² + b² − c²)/(2ab)', a, b, c, t.C),
        step('A', '(b² + c² − a²)/(2bc)', b, c, a, t.A),
        step('B', '(a² + c² − b²)/(2ac)', a, c, b, t.B),
        `Check: A + B + C = ${fmt(t.A + t.B + t.C)}°`,
        '(angles are computed with the numerically stable half-angle form, which gives the same values as cos⁻¹ above)',
      ].join('\n\n');
      return triangleRows(t, unit, steps);
    }

    if (mode === 'sas') {
      const angleIn = parseNumberStrict(values.angleC);
      if (!Number.isFinite(angleIn)) return [];
      if (a <= 0 || b <= 0) return [];
      const gamma = angleToDeg(angleIn, unit);
      if (gamma <= 0 || gamma >= 180) return errorRow('The included angle must be greater than 0 and less than 180° (π radians).');
      const t = solveSAS(a, b, gamma);
      if (!t) return [];
      const cosC = Math.abs(gamma - 90) < 1e-12 ? 0 : Math.cos(toRad(gamma)); // cos(90°) is exactly 0, not 6.1e-17
      const steps = [
        'c² = a² + b² − 2ab·cos(C)',
        `c² = ${fmt(a)}² + ${fmt(b)}² − 2(${fmt(a)})(${fmt(b)})·cos(${fmtAngle(gamma, unit)})`,
        `c² = ${fmt(a * a)} + ${fmt(b * b)} − ${fmt(2 * a * b)}·${fmt(cosC)} = ${fmt(t.c * t.c)}`,
        `c = √${fmt(t.c * t.c)} = ${fmt(t.c)}`,
        '',
        `Angle A = atan2(a·sin C, b − a·cos C) = ${fmtAngle(t.A, unit)}`,
        `Angle B = atan2(b·sin C, a − b·cos C) = ${fmtAngle(t.B, unit)}`,
        `Check: A + B + C = ${fmt(t.A + t.B + t.C)}°`,
      ].join('\n');
      return triangleRows(t, unit, steps);
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LawOfCosinesPanel, { values, results });
  },
  educational: {
    formula: 'c² = a² + b² − 2ab·cos(C)',
    formulaDescription:
      'The law of cosines generalizes the Pythagorean theorem to any triangle. It relates the lengths of the sides of a triangle to the cosine of one of its angles. For a triangle with sides a, b, c and angle C opposite side c, the formula states that c² equals the sum of the squares of the other two sides minus twice their product times the cosine of the included angle. When C = 90°, cos(90°) = 0 and the formula reduces to c² = a² + b², which is the familiar Pythagorean theorem for right triangles.',
    variables: [
      { symbol: 'a, b, c', name: 'Side lengths', description: 'The lengths of the three sides of the triangle, with c being the side opposite angle C.' },
      { symbol: 'C', name: 'Angle C', description: 'The angle opposite side c, measured in degrees. In SAS mode, this is the angle between sides a and b.' },
      { symbol: 'cos(C)', name: 'Cosine of angle C', description: 'The trigonometric cosine function evaluated at angle C, ranging from -1 to 1.' },
    ],
    howToUse: [
      'Select the mode: "Side (SSS)" when you know all three side lengths, or "Angle (SAS)" when you know two sides and the included angle.',
      'In SSS mode, enter the lengths of all three sides (a, b, c). The calculator finds each angle using the law of cosines step by step.',
      'In SAS mode, enter two side lengths (a, b) and the included angle (C) between them. The calculator finds the third side and the remaining angles.',
      'Review the work steps section to see each calculation step, including cosine evaluations and inverse cosine operations.',
      'Ensure your inputs satisfy the triangle inequality (SSS) or that the given angle is less than 180 degrees (SAS) for a valid triangle.',
    ],
    quickReference: [
      { label: 'c² formula', value: 'c² = a² + b² − 2ab·cos(C)' },
      { label: 'cos(C) formula', value: 'cos(C) = (a² + b² − c²)/(2ab)' },
      { label: 'Right triangle', value: 'If C = 90°, cos(C) = 0, so c² = a² + b²' },
      { label: 'Obtuse angle', value: 'If C > 90°, cos(C) < 0, so c² > a² + b²' },
    ],
    commonUses: [
      'Solving SSS triangles: finding all angles when only side lengths are known, which the law of sines alone cannot do',
      'Solving SAS triangles: finding the third side and remaining angles when two sides and the included angle are known',
      'Navigation and GPS: computing distances between points when direct measurement is impossible but distances from two reference points and the included angle are known',
      'Physics and engineering: calculating resultant vectors using the parallelogram law, where the magnitude of the resultant depends on the angle between two vectors',
      'Computer graphics: determining polygon geometry and performing collision detection in 3D space where triangle meshes are the fundamental building block',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 340 270" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="170" y="22" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Law of Cosines — Triangle ABC</text>' +
        '<text x="170" y="38" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">c² = a² + b² − 2ab·cos(C)</text>' +
        '<rect x="10" y="48" width="320" height="212" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Triangle -->' +
        '<polygon points="170,68 30,240 310,240" fill="rgba(37,99,235,0.06)" stroke="var(--svg-2563eb)" stroke-width="2" stroke-linejoin="round"/>' +
        '<!-- Vertex labels -->' +
        '<text x="170" y="60" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-dc2626)" font-weight="700" text-anchor="middle">A</text>' +
        '<text x="17" y="248" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-dc2626)" font-weight="700" text-anchor="middle">B</text>' +
        '<text x="323" y="248" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-dc2626)" font-weight="700" text-anchor="middle">C</text>' +
        '<!-- Side labels -->' +
        '<text x="170" y="235" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-2563eb)" font-style="italic" font-weight="600" text-anchor="middle">a</text>' +
        '<text x="245" y="148" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-2563eb)" font-style="italic" font-weight="600" text-anchor="middle" transform="rotate(-40, 245, 148)">b</text>' +
        '<text x="95" y="148" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-2563eb)" font-style="italic" font-weight="600" text-anchor="middle" transform="rotate(40, 95, 148)">c</text>' +
        '<!-- Highlight side c in red (the side we solve for) -->' +
        '<path d="M 95 148 L 100 140" fill="none" stroke="var(--svg-2563eb)" stroke-width="1"/>' +
        '<!-- Angle arc at C -->' +
        '<path d="M 310 240 L 250 170" fill="none" stroke="var(--svg-d97706)" stroke-width="1.5" stroke-dasharray="4,2"/>' +
        '<path d="M 310 240 L 240 240" fill="none" stroke="var(--svg-d97706)" stroke-width="1.5" stroke-dasharray="4,2"/>' +
        '<path d="M 298 232 L 282 215 A 22 22 0 0 1 268 232" fill="none" stroke="var(--svg-d97706)" stroke-width="1.5"/>' +
        '<text x="293" y="225" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-d97706)" font-weight="700" text-anchor="middle">C</text>' +
        '<!-- Right angle indicator for reference -->' +
        '<text x="170" y="185" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle" font-style="italic">If C = 90°: c² = a² + b²</text>' +
        '<!-- Formula breakdown -->' +
        '<line x1="40" y1="250" x2="300" y2="250" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/>' +
        '<text x="170" y="252" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle" font-style="italic">SSS: find angles | SAS: find side</text>' +
        '</svg>',
      alt: 'Triangle ABC with sides a, b, c labeled and angle C highlighted. The law of cosines formula c² = a² + b² - 2ab·cos(C) is displayed at the top.',
      caption: 'The law of cosines extends the Pythagorean theorem to any triangle. When C = 90 degrees, the formula reduces to the familiar a² + b² = c².',
    },
    explanation:
      'The law of cosines is one of the two fundamental tools (alongside the law of sines) for solving arbitrary triangles. It can be viewed as a generalization of the Pythagorean theorem that includes a correction term for non-right triangles. The formula c² = a² + b² - 2ab·cos(C) expresses the length of side c in terms of sides a, b and the included angle C between them. When angle C is 90 degrees, cos(90°) = 0 and the formula simplifies to c² = a² + b², which is the Pythagorean theorem. When angle C is acute (less than 90 degrees), cos(C) > 0 and the correction term is positive, making c² less than a² + b². When angle C is obtuse (greater than 90 degrees), cos(C) < 0 and the correction term becomes negative, making c² greater than a² + b². This behavior matches the geometric intuition: an obtuse angle "stretches" the opposite side. The law of cosines can be rearranged to solve for angles when all three sides are known: cos(C) = (a² + b² - c²)/(2ab). This rearrangement is the key to solving SSS triangles. The formula can be cyclically permuted for any vertex: a² = b² + c² - 2bc·cos(A) and b² = a² + c² - 2ac·cos(B). The law of cosines has a rich geometric interpretation. It can be derived by dropping an altitude from vertex A to side a, creating two right triangles, and applying the Pythagorean theorem to each. The distance from the foot of the altitude to vertex B is c·cos(B), and to vertex C is b·cos(C). These projections sum to the full side length a, giving the relationship a = b·cos(C) + c·cos(B), which is known as the projection formula and is equivalent to the law of cosines. Numerically, the law of cosines is well-behaved for most triangles but can be less accurate for very flat triangles (where angles are near 0 or 180 degrees) due to floating-point precision in the arccosine function. In such cases, the law of sines may give more accurate angle results after the first angle is determined.',
    faqs: [
      {
        question: 'When should I use the law of cosines instead of the law of sines?',
        answer: 'Use the law of cosines when you know all three sides (SSS) and need to find angles, or when you know two sides and the included angle (SAS) and need the third side. The law of sines alone cannot solve SSS triangles because it requires at least one angle. For SAS problems, you could use the law of sines after finding the third side, but the law of cosines directly computes it.',
      },
      {
        question: 'How does the law of cosines relate to the Pythagorean theorem?',
        answer: 'The law of cosines is a generalization of the Pythagorean theorem. When the angle C is 90 degrees, cos(90°) = 0 and the law of cosines reduces to c² = a² + b². When C is acute (less than 90°), cos(C) > 0 and c² < a² + b². When C is obtuse (greater than 90°), cos(C) < 0 and c² > a² + b². The Pythagorean theorem is thus a special case of the law of cosines for right triangles.',
      },
      {
        question: 'What happens if cos(C) is outside the range [-1, 1]?',
        answer: 'If the calculated cos(C) is outside the range [-1, 1] when using the SSS formula cos(C) = (a² + b² - c²)/(2ab), it usually means the triangle inequality is violated — the three side lengths cannot form a valid triangle. The calculator clamps values to [-1, 1] before applying arccosine to handle floating-point edge cases gracefully, but it also checks the triangle inequality at the start.',
      },
      {
        question: 'Can I use the law of cosines to find all three angles from three sides?',
        answer: 'Yes, you can apply the law of cosines cyclically: cos(A) = (b² + c² - a²)/(2bc), cos(B) = (a² + c² - b²)/(2ac), and cos(C) = (a² + b² - c²)/(2ab). Compute each cosine and then apply arccosine to find each angle in degrees. The sum should equal 180 degrees as a verification step.',
      },
    ],
    citations: [
      { source: 'Wikipedia — Law of cosines', url: 'https://en.wikipedia.org/wiki/Law_of_cosines' },
      { source: 'Brilliant — Law of Cosines', url: 'https://brilliant.org/wiki/law-of-cosines/' },
    ],
  },
};

export default config;
