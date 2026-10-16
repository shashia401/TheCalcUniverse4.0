import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import LawOfSinesPanel from './LawOfSinesPanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import {
  type AngleUnit,
  type Tri,
  angleToDeg,
  classify,
  area,
  fmtAngle,
  fmtNum8 as fmt,
  solveAngleAngleSide,
  solveSSA,
  toRad,
} from '../shared/triangle';

const V = ['A', 'B', 'C'] as const;
type Vertex = (typeof V)[number];

const rows = (t: Tri, unit: AngleUnit, suffix = '', tag = ''): CalculatorResult[] => {
  const au = unit === 'rad' ? 'rad' : '°';
  const k = suffix ? `${tag} ` : '';
  return [
    { id: `sideA${suffix}`, label: `${k}Side a`, value: fmt(t.a), highlight: !suffix, color: suffix ? 'neutral' : 'positive' },
    { id: `angleA${suffix}`, label: `${k}Angle A`, value: fmtAngle(t.A, unit), unit: au, color: 'neutral' },
    { id: `sideB${suffix}`, label: `${k}Side b`, value: fmt(t.b), color: 'neutral' },
    { id: `angleB${suffix}`, label: `${k}Angle B`, value: fmtAngle(t.B, unit), unit: au, color: 'neutral' },
    { id: `sideC${suffix}`, label: `${k}Side c`, value: fmt(t.c), color: 'neutral' },
    { id: `angleC${suffix}`, label: `${k}Angle C`, value: fmtAngle(t.C, unit), unit: au, color: 'neutral' },
  ];
};

const R_OF = (t: Tri) => t.a / (2 * Math.sin(toRad(t.A))); // circumradius

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'angleUnit',
      label: 'Angle unit',
      type: 'select',
      defaultValue: 'deg',
      options: [
        { label: 'Degrees (°)', value: 'deg' },
        { label: 'Radians (rad)', value: 'rad' },
      ],
      helpText: 'Used for every angle you enter and for all angles in the results',
    },
    { id: 'sideA', label: 'Side a', type: 'number', placeholder: 'Side a', helpText: 'Enter the length of side a (leave blank if unknown)' },
    { id: 'angleA', label: 'Angle A', type: 'number', placeholder: 'Angle A', helpText: 'Enter angle A, opposite side a (leave blank if unknown)' },
    { id: 'sideB', label: 'Side b', type: 'number', placeholder: 'Side b', helpText: 'Enter the length of side b (leave blank if unknown)' },
    { id: 'angleB', label: 'Angle B', type: 'number', placeholder: 'Angle B', helpText: 'Enter angle B, opposite side b (leave blank if unknown)' },
    { id: 'sideC', label: 'Side c', type: 'number', placeholder: 'Side c', helpText: 'Enter the length of side c (leave blank if unknown)' },
    { id: 'angleC', label: 'Angle C', type: 'number', placeholder: 'Angle C', helpText: 'Enter angle C, opposite side c (leave blank if unknown)' },
  ],
  calculate: (values) => {
    const unit: AngleUnit = values.angleUnit === 'rad' ? 'rad' : 'deg';
    const blank = (s?: string) => (s ?? '').trim() === '';
    const rawSides = [values.sideA, values.sideB, values.sideC];
    const rawAngles = [values.angleA, values.angleB, values.angleC];
    // Blank = unknown. Anything else must be a clean number (the old parseFloat read "30abc" as 30).
    const sides = rawSides.map((s) => (blank(s) ? null : parseNumberStrict(s)));
    const angles = rawAngles.map((s) => (blank(s) ? null : parseNumberStrict(s)));
    if ([...sides, ...angles].some((v) => v !== null && !Number.isFinite(v))) return [];

    const nSides = sides.filter((v) => v !== null).length;
    const nAngles = angles.filter((v) => v !== null).length;
    if (nSides + nAngles < 3) return [];
    if (sides.some((v) => v !== null && v <= 0)) return [];
    const deg = angles.map((v) => (v === null ? null : angleToDeg(v, unit)));
    if (deg.some((v) => v !== null && (v <= 0 || v >= 180))) {
      return [{ id: 'triangleError', label: 'No such triangle', value: 'Every angle must be greater than 0 and less than 180° (π radians).', color: 'negative' }];
    }
    const err = (m: string): CalculatorResult[] => [{ id: 'triangleError', label: 'No such triangle', value: m, color: 'negative' }];
    const known = (i: number) => sides[i] !== null && deg[i] !== null; // a side together with its opposite angle

    let solutions: Tri[] = [];

    if (nAngles >= 2) {
      // ASA / AAS: the third angle follows from the angle sum.
      if (nAngles === 3) {
        const sum = deg[0]! + deg[1]! + deg[2]!;
        if (Math.abs(sum - 180) > 1e-6) return err(`The three angles add up to ${fmt(sum)}°, not 180°.`);
      }
      const given = V.filter((_, i) => deg[i] !== null).slice(0, 2); // the angle sum implies the third
      const withAngle: { A?: number; B?: number; C?: number } = {};
      for (const v of given) withAngle[v] = deg[V.indexOf(v)]!;
      if (given.reduce((s, v) => s + withAngle[v]!, 0) >= 180) return err('Two angles of a triangle must add up to less than 180°.');
      if (nSides === 0) return err('Add at least one side length: angles alone only determine the shape, not the size.');
      const si = sides.findIndex((v) => v !== null);
      const t = solveAngleAngleSide(withAngle, sides[si]!, V[si]);
      if (!t) return err('These values do not form a triangle.');
      // Every other side that was given must agree with the law of sines (within the rounding of typical inputs).
      for (let i = 0; i < 3; i++) {
        const g = sides[i];
        const computed = i === 0 ? t.a : i === 1 ? t.b : t.c;
        if (g !== null && Math.abs(g - computed) > 1e-3 * computed) {
          return err(`The sides and angles you entered contradict each other: side ${'abc'[i]} should be ${fmt(computed)} for those angles.`);
        }
      }
      solutions = [t];
    } else if (nAngles === 1) {
      const ai = deg.findIndex((v) => v !== null);
      if (!known(ai)) {
        return err('Law of sines needs the known angle to sit opposite a known side. Your side(s) and angle form SAS, which needs the Law of Cosines instead.');
      }
      const others = [0, 1, 2].filter((i) => i !== ai && sides[i] !== null);
      if (others.length === 0) return [];
      if (others.length === 2) return err('Three sides and one angle over-determine the triangle. Remove one value, or use the Law of Cosines calculator.');
      const oi = others[0];
      const res = solveSSA(sides[ai]!, deg[ai]!, sides[oi]!);
      if (res.kind === 'none') return err(res.reason);
      // Re-label the SSA triangles (s1 opposite the known angle; s2 opposite X) back to the user's A, B, C positions.
      const third = [0, 1, 2].find((i) => i !== ai && i !== oi)!;
      solutions = res.triangles.map((tt) => {
        const out = { a: 0, b: 0, c: 0, A: 0, B: 0, C: 0 };
        const setSide = (i: number, v: number) => (i === 0 ? (out.a = v) : i === 1 ? (out.b = v) : (out.c = v));
        const setAng = (i: number, v: number) => (i === 0 ? (out.A = v) : i === 1 ? (out.B = v) : (out.C = v));
        setSide(ai, tt.a);
        setAng(ai, tt.A);
        setSide(oi, tt.b);
        setAng(oi, tt.B);
        setSide(third, tt.c);
        setAng(third, tt.C);
        return out;
      });
    } else {
      return err('With only sides known you need the Law of Cosines (SSS). The Law of Sines needs at least one angle.');
    }

    const t = solutions[0];
    const out: CalculatorResult[] = [
      ...rows(t, unit),
      { id: 'circumradius', label: 'Circumradius R', value: fmt(R_OF(t)), color: 'neutral' },
      { id: 'ratio', label: 'Ratio (a/sin(A))', value: fmt(t.a / Math.sin(toRad(t.A))), color: 'neutral' },
      { id: 'triangleCount', label: 'Number of triangles', value: solutions.length === 2 ? '2 (ambiguous SSA case)' : '1', color: solutions.length === 2 ? 'negative' : 'neutral' },
      { id: 'triangleType', label: 'Triangle type', value: `${classify(t).bySides} ${classify(t).byAngles}`, color: 'neutral' },
      { id: 'area', label: 'Area', value: `${fmt(area(t))} sq units`, color: 'neutral' },
      { id: '_triangle', label: 'triangle', value: JSON.stringify(t) },
    ];
    if (solutions.length === 2) {
      const t2 = solutions[1];
      out.push(...rows(t2, unit, '2', 'Second triangle:'));
      out.push({ id: 'circumradius2', label: 'Second triangle: circumradius R', value: fmt(R_OF(t2)), color: 'neutral' });
      out.push({ id: 'area2', label: 'Second triangle: area', value: `${fmt(area(t2))} sq units`, color: 'neutral' });
      out.push({ id: '_triangle2', label: 'triangle 2', value: JSON.stringify(t2) });
    }
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LawOfSinesPanel, { values, results });
  },
  educational: {
    formula: 'a / sin(A) = b / sin(B) = c / sin(C) = 2R',
    formulaDescription:
      'The law of sines relates the side lengths of any triangle to the sines of its opposite angles. The ratio of any side length to the sine of its opposite angle is constant and equal to the diameter of the circumscribed circle (2R). This relationship holds for all triangles, including acute, obtuse, and right triangles, making it one of the most versatile tools in trigonometry for solving unknown sides and angles.',
    variables: [
      { symbol: 'a, b, c', name: 'Side lengths', description: 'The lengths of the three sides of the triangle, each opposite its corresponding vertex.' },
      { symbol: 'A, B, C', name: 'Angles', description: 'The interior angles at vertices A, B, and C respectively, measured in degrees.' },
      { symbol: 'R', name: 'Circumradius', description: 'The radius of the circumscribed circle that passes through all three vertices of the triangle.' },
      { symbol: 'sin', name: 'Sine function', description: 'A trigonometric function relating an angle to the ratio of the opposite side length to the hypotenuse in a right triangle.' },
    ],
    howToUse: [
      'Enter at least 3 known values from the triangle, with at least one complete side-angle pair (e.g., side a and angle A, or side b and angle B).',
      'Leave unknown fields empty. The calculator will solve for all missing sides, angles, and the circumradius.',
      'The law of sines equation a/sin(A) = b/sin(B) = c/sin(C) = 2R is applied to find the ratio, then all missing values are computed from it.',
      'Use the results section to see the complete triangle solution, including the circumradius R and the constant ratio value.',
      'For best results, provide two angles and one side (ASA or AAS), or two sides and a non-included angle (SSA). Note that the ambiguous SSA case may yield one valid solution.',
    ],
    quickReference: [
      { label: 'a / sin(A)', value: 'Constant ratio = 2R (circumdiameter)' },
      { label: 'Missing side', value: 'side = ratio × sin(opposite angle)' },
      { label: 'Missing angle', value: 'angle = sin⁻¹(side / ratio)' },
      { label: 'Angle sum', value: 'A + B + C = 180°' },
    ],
    commonUses: [
      'Surveying and navigation: determining distances between points that are not directly measurable by creating triangles from known baselines and measuring angles',
      'Astronomy: calculating distances to stars and planets using triangulation from two observation points on Earth',
      'Civil engineering: designing bridges, roofs, and trusses where non-right triangles must be solved for structural calculations',
      'Physics: resolving vector components and forces in non-orthogonal coordinate systems',
      'Architecture: computing roof pitches, dormer angles, and other structural elements where right-angle assumptions do not apply',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="170" y="22" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Law of Sines — Triangle ABC</text>' +
        '<text x="170" y="38" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">a / sin(A) = b / sin(B) = c / sin(C) = 2R</text>' +
        '<rect x="10" y="48" width="320" height="222" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Triangle -->' +
        '<polygon points="170,65 35,250 305,250" fill="rgba(37,99,235,0.06)" stroke="var(--svg-2563eb)" stroke-width="2" stroke-linejoin="round"/>' +
        '<!-- Vertex labels -->' +
        '<text x="170" y="58" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-dc2626)" font-weight="700" text-anchor="middle">A</text>' +
        '<text x="22" y="258" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-dc2626)" font-weight="700" text-anchor="middle">B</text>' +
        '<text x="318" y="258" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-dc2626)" font-weight="700" text-anchor="middle">C</text>' +
        '<!-- Side labels -->' +
        '<text x="170" y="245" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-2563eb)" font-style="italic" font-weight="600" text-anchor="middle">a</text>' +
        '<text x="240" y="150" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-2563eb)" font-style="italic" font-weight="600" text-anchor="middle" transform="rotate(-41, 240, 150)">b</text>' +
        '<text x="100" y="150" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-2563eb)" font-style="italic" font-weight="600" text-anchor="middle" transform="rotate(41, 100, 150)">c</text>' +
        '<!-- Angle arcs -->' +
        '<path d="M 170 65 L 130 130" fill="none" stroke="var(--svg-dc2626)" stroke-width="1"/>' +
        '<path d="M 170 65 L 208 130" fill="none" stroke="var(--svg-dc2626)" stroke-width="1"/>' +
        '<path d="M 130 72 L 150 80 A 30 30 0 0 1 170 90" fill="none" stroke="var(--svg-dc2626)" stroke-width="1"/>' +
        '<text x="155" y="88" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-dc2626)" font-weight="600" text-anchor="middle">A</text>' +
        '<path d="M 35 250 L 86 174" fill="none" stroke="var(--svg-059669)" stroke-width="1"/>' +
        '<path d="M 35 250 L 100 250" fill="none" stroke="var(--svg-059669)" stroke-width="1"/>' +
        '<path d="M 45 240 L 60 215 A 30 30 0 0 1 80 240" fill="none" stroke="var(--svg-059669)" stroke-width="1"/>' +
        '<text x="58" y="235" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-059669)" font-weight="600" text-anchor="middle">B</text>' +
        '<path d="M 305 250 L 254 174" fill="none" stroke="var(--svg-d97706)" stroke-width="1"/>' +
        '<path d="M 305 250 L 240 250" fill="none" stroke="var(--svg-d97706)" stroke-width="1"/>' +
        '<path d="M 295 240 L 282 220 A 30 30 0 0 1 260 240" fill="none" stroke="var(--svg-d97706)" stroke-width="1"/>' +
        '<text x="288" y="235" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-d97706)" font-weight="600" text-anchor="middle">C</text>' +
        '<!-- Circumcircle (dashed) -->' +
        '<circle cx="170" cy="155" r="96" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="1" stroke-dasharray="5,3" opacity="0.5"/>' +
        '<text x="170" y="20" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-8b5cf6)" text-anchor="middle" opacity="0.6">R</text>' +
        '</svg>',
      alt: 'Triangle ABC labeled with sides a, b, c opposite vertices A, B, C, and a dashed circumscribed circle with radius R showing the law of sines relationship a/sin(A) = b/sin(B) = c/sin(C) = 2R',
      caption: 'The law of sines relates each side to the sine of its opposite angle. The circumradius R is the radius of the circle passing through all three vertices.',
    },
    explanation:
      'The law of sines is a fundamental relationship in trigonometry that applies to any triangle, not just right triangles. It states that the ratio of a side length to the sine of its opposite angle is constant across all three sides of a triangle. This constant is equal to the diameter (2R) of the circumscribed circle that passes through all three vertices. The law of sines is derived from the geometry of the circumcircle. For any triangle ABC, the central angle subtended by chord a (side BC) at the center of the circumcircle is 2A (twice the inscribed angle A). The chord length a is therefore 2R sin(A), which rearranges to a/sin(A) = 2R. The same reasoning applies to sides b and c, yielding the complete law of sines. The law of sines is particularly useful when working with non-right triangles. It is the primary tool for solving ASA (angle-side-angle) and AAS (angle-angle-side) configurations, where two angles and any side are known. In these cases, the third angle is immediately found from the sum of angles (A + B + C = 180 degrees), and then the remaining sides are computed using the sine ratio. The law of sines also handles SSA (side-side-angle) configurations, though these present the ambiguous case: given two sides and a non-included angle, there may be zero, one, or two possible triangles. This ambiguity arises because the sine function is positive for both acute and obtuse angles (sin(θ) = sin(180° - θ)). For example, if sin(B) = 0.8, angle B could be approximately 53.1° or 126.9°. The correct solution depends on whether the sum of the known angle and the candidate angle remains less than 180 degrees. In right triangles (where one angle equals 90 degrees), the law of sines simplifies to standard SOH CAH TOA relationships: sin(90°) = 1, so the side opposite the right angle equals R, the circumdiameter. The law of sines is also closely related to the law of cosines, and together they form the complete toolkit for solving any triangle given sufficient information. In practical applications, the law of sines is used extensively in surveying, where surveyors measure a baseline distance and two angles to determine the location of a distant point through triangulation. The same principle is used in GPS trilateration, astronomy for measuring stellar distances, and in computer graphics for 3D rendering calculations.',
    faqs: [
      {
        question: 'Does the law of sines work for all types of triangles?',
        answer: 'Yes, the law of sines works for all triangles — acute, obtuse, and right triangles. The formula a/sin(A) = b/sin(B) = c/sin(C) = 2R is universally valid for any triangle in Euclidean geometry. In a right triangle, one angle is 90° and sin(90°) = 1, so the side opposite the right angle equals the circumdiameter, which simplifies the relationship.',
      },
      {
        question: 'What is the ambiguous case of the law of sines?',
        answer: 'The ambiguous case occurs in SSA (side-side-angle) configurations, where you are given two sides and a non-included angle. Because sin(θ) = sin(180° - θ), there may be two possible angle solutions — an acute angle and its obtuse supplement — leading to zero, one, or two valid triangles. The calculator resolves this by selecting the solution that produces a valid angle sum (A + B + C = 180°).',
      },
      {
        question: 'How is the circumradius R related to the triangle?',
        answer: 'The circumradius R is the radius of the unique circle that passes through all three vertices of a triangle. It is given by R = a / (2 sin(A)) = b / (2 sin(B)) = c / (2 sin(C)). For any triangle, the circumdiameter (2R) equals the constant ratio a/sin(A). The circumcenter (center of this circle) is the intersection point of the perpendicular bisectors of the triangle\'s sides.',
      },
      {
        question: 'What if I only know all three sides?',
        answer: 'If you know all three sides but no angles, the law of sines alone cannot solve the triangle because you have no angle to compute a sine ratio. In this case, use the law of cosines first to find any angle, then use the law of sines to find the remaining angles. This combined approach can solve any SSS triangle completely.',
      },
    ],
    citations: [
      { source: 'Wikipedia — Law of sines', url: 'https://en.wikipedia.org/wiki/Law_of_sines' },
      { source: 'Wolfram MathWorld', url: 'https://mathworld.wolfram.com/LawofSines.html' },
    ],
  },
};

export default config;
