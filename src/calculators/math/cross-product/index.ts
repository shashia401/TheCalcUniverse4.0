import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CrossProductPanel from './CrossProductPanel';

const crossProductConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'v1x',
      defaultValue: '2',
      label: 'a₁ (v₁x)',
      type: 'number',
      placeholder: 'a₁',
      required: true,
      step: 0.1,
      helpText: 'First component of vector a',
    },
    {
      id: 'v1y',
      defaultValue: '3',
      label: 'a₂ (v₁y)',
      type: 'number',
      placeholder: 'a₂',
      required: true,
      step: 0.1,
      helpText: 'Second component of vector a',
    },
    {
      id: 'v1z',
      label: 'a₃ (v₁z)',
      type: 'number',
      placeholder: 'a₃',
      required: true,
      step: 0.1,
      helpText: 'Third component of vector a',
    },
    {
      id: 'v2x',
      defaultValue: '5',
      label: 'b₁ (v₂x)',
      type: 'number',
      placeholder: 'b₁',
      required: true,
      step: 0.1,
      helpText: 'First component of vector b',
    },
    {
      id: 'v2y',
      defaultValue: '6',
      label: 'b₂ (v₂y)',
      type: 'number',
      placeholder: 'b₂',
      required: true,
      step: 0.1,
      helpText: 'Second component of vector b',
    },
    {
      id: 'v2z',
      label: 'b₃ (v₂z)',
      type: 'number',
      placeholder: 'b₃',
      required: true,
      step: 0.1,
      helpText: 'Third component of vector b',
    },
  ],
  calculate: (values) => {
    const v1x = parseFloat(values.v1x);
    const v1y = parseFloat(values.v1y);
    const v1z = parseFloat(values.v1z);
    const v2x = parseFloat(values.v2x);
    const v2y = parseFloat(values.v2y);
    const v2z = parseFloat(values.v2z);

    if ([v1x, v1y, v1z, v2x, v2y, v2z].some(isNaN)) return [];

    const fmt = (n: number) => {
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toFixed(6)).toString();
    };

    // Cross product: a × b = (a₂b₃ − a₃b₂, a₃b₁ − a₁b₃, a₁b₂ − a₂b₁)
    const crossX = v1y * v2z - v1z * v2y;
    const crossY = v1z * v2x - v1x * v2z;
    const crossZ = v1x * v2y - v1y * v2x;

    const crossStr = `${fmt(crossX)}, ${fmt(crossY)}, ${fmt(crossZ)}`;

    // Magnitude
    const magnitude = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

    // Unit vector
    let unitVector = 'undefined (zero vector)';
    if (magnitude > 0) {
      unitVector = `${fmt(crossX / magnitude)}, ${fmt(crossY / magnitude)}, ${fmt(crossZ / magnitude)}`;
    }

    // Verification: dot with each original should be ~0
    const dotWithA = crossX * v1x + crossY * v1y + crossZ * v1z;
    const dotWithB = crossX * v2x + crossY * v2y + crossZ * v2z;

    // Area of parallelogram = magnitude
    const area = magnitude;

    return [
      {
        id: 'crossProduct',
        label: 'a × b',
        value: `(${crossStr})`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'magnitude',
        label: '|a × b|',
        value: fmt(magnitude),
        color: 'neutral' as const,
      },
      {
        id: 'unitVector',
        label: 'Unit Vector (direction)',
        value: unitVector !== 'undefined (zero vector)' ? `(${unitVector})` : unitVector,
        color: 'neutral' as const,
      },
      {
        id: 'verification',
        label: 'Verification (dot with a, dot with b)',
        value: `${fmt(dotWithA)}, ${fmt(dotWithB)}`,
        color: 'neutral' as const,
      },
      {
        id: 'area',
        label: 'Area of Parallelogram',
        value: fmt(area),
        highlight: true,
        color: 'positive' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CrossProductPanel, { values, results });
  },
  educational: {
    formula: 'a × b = (a₂b₃ − a₃b₂, a₃b₁ − a₁b₃, a₁b₂ − a₂b₁)',
    diagram: {
      svg: '<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Cross Product a × b</text><line x1="80" y1="290" x2="420" y2="290" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><line x1="100" y1="290" x2="100" y2="50" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><text x="430" y="294" font-size="11" fill="var(--svg-94a3b8)">x</text><text x="106" y="48" font-size="11" fill="var(--svg-94a3b8)">y</text><defs><marker id="arrowA" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-3b82f6)"/></marker><marker id="arrowB" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-ef4444)"/></marker><marker id="arrowC" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-22c55e)"/></marker></defs><line x1="100" y1="290" x2="320" y2="200" stroke="var(--svg-3b82f6)" stroke-width="2.5" marker-end="url(#arrowA)"/><text x="330" y="198" font-size="13" font-weight="bold" fill="var(--svg-3b82f6)">a</text><line x1="100" y1="290" x2="200" y2="120" stroke="var(--svg-ef4444)" stroke-width="2.5" marker-end="url(#arrowB)"/><text x="210" y="112" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">b</text><line x1="100" y1="290" x2="380" y2="90" stroke="var(--svg-22c55e)" stroke-width="2.5" stroke-dasharray="6,3" marker-end="url(#arrowC)"/><text x="390" y="88" font-size="13" font-weight="bold" fill="var(--svg-22c55e)">a × b</text><path d="M320,200 L200,120" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,4"/><text x="210" y="175" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)">Area = |a × b|</text><text x="240" y="325" text-anchor="middle" font-size="12" fill="var(--svg-94a3b8)">The cross product is perpendicular to both a and b (right-hand rule)</text></svg>',
      alt: '3D vector diagram showing two vectors a and b originating from the same point, with their cross product a × b shown as a perpendicular vector, and the parallelogram area shaded',
      caption: 'The cross product of two vectors produces a third vector perpendicular to both, with magnitude equal to the parallelogram area',
    },
    formulaDescription:
      'The cross product (also called the vector product) is a binary operation on two vectors in three-dimensional space. It produces a third vector that is perpendicular to both input vectors. The magnitude of the cross product equals the area of the parallelogram formed by the two vectors: |a × b| = |a||b|sin θ. The direction follows the right-hand rule.',
    variables: [
      { symbol: 'a = (a₁, a₂, a₃)', name: 'First Vector', description: 'The first 3D vector in the cross product operation.' },
      { symbol: 'b = (b₁, b₂, b₃)', name: 'Second Vector', description: 'The second 3D vector in the cross product operation.' },
      { symbol: 'a × b', name: 'Cross Product Vector', description: 'A vector perpendicular to both a and b, following the right-hand rule.' },
      { symbol: '|a × b|', name: 'Magnitude', description: 'The length of the cross product, equal to |a||b|sin θ, also the area of the parallelogram.' },
      { symbol: 'n̂', name: 'Unit Vector', description: 'The normalized direction of the cross product, a × b / |a × b|.' },
    ],
    howToUse: [
      'Enter all three components of both 3D vectors a and b. All components are required.',
      'The calculator computes the cross product a × b and displays the resulting vector components.',
      'Review the magnitude, unit vector (normalized direction), and verification that the result is orthogonal to both inputs.',
      'The area result shows the area of the parallelogram spanned by the two vectors, which equals the cross product magnitude.',
    ],
    quickReference: [
      { label: 'i × j = k', value: 'Standard basis vectors follow a cyclic pattern' },
      { label: 'j × k = i', value: 'Right-hand rule determines direction' },
      { label: 'k × i = j', value: 'Reversing order flips the sign' },
      { label: 'Perpendicular check', value: '(a × b) · a = 0 and (a × b) · b = 0' },
    ],
    commonUses: [
      'Physics: calculating torque (τ = r × F) where r is the position vector and F is the force vector.',
      'Electromagnetism: computing the Lorentz force (F = qv × B) on a charged particle in a magnetic field.',
      'Computer graphics: calculating surface normals for lighting calculations by taking cross products of edge vectors.',
      'Robotics: computing angular momentum (L = r × p) and rotational dynamics.',
      'Engineering: determining the moment of a force about a point, essential for structural analysis and mechanical design.',
    ],
    explanation:
      'The cross product is a fundamental vector operation in three-dimensional space. Unlike the dot product which produces a scalar, the cross product produces a vector. The resulting vector is always perpendicular (orthogonal) to both input vectors, making it an indispensable tool for constructing normal vectors. The magnitude |a × b| = |a||b|sin θ gives the area of the parallelogram formed by the two vectors, and equals zero when the vectors are parallel (θ = 0° or 180°). The direction follows the right-hand rule: if you curl the fingers of your right hand from a toward b, your thumb points in the direction of a × b. The cross product is anti-commutative: a × b = −(b × a), meaning swapping the inputs reverses the direction. The cross product is intimately connected to the determinant of a 3×3 matrix formed by the standard basis vectors and the components of a and b.',
    faqs: [
      {
        question: 'Why is the cross product only defined for 3D vectors?',
        answer: 'The cross product as traditionally defined is unique to three dimensions. In 2D, the cross product is a scalar representing the signed area of the parallelogram, often written as a × b = a₁b₂ − a₂b₁. In higher dimensions, the generalization is the wedge product (exterior algebra) which produces a bivector. Seven-dimensional cross products also exist but have different algebraic properties.',
      },
      {
        question: 'What does it mean if the cross product is the zero vector?',
        answer: 'If the cross product a × b = (0, 0, 0), the two vectors are parallel (θ = 0° or θ = 180°), meaning one is a scalar multiple of the other. The parallelogram area is zero because the vectors lie on the same line. In physics, this means no torque is generated when force is applied in the same direction as the position vector.',
      },
      {
        question: 'How does the right-hand rule work?',
        answer: 'Point the fingers of your right hand in the direction of vector a, then curl them toward vector b. Your extended thumb points in the direction of a × b. This convention determines the sign of the cross product. If you use your left hand instead, the direction reverses. This is why the cross product is said to be "chiral" — it depends on the handedness of the coordinate system.',
      },
      {
        question: 'What is the relationship between the cross product and the determinant?',
        answer: 'The cross product can be computed as the determinant of a 3×3 matrix: a × b = det([i, j, k; a₁, a₂, a₃; b₁, b₂, b₃]), where i, j, k are the standard basis vectors. This determinant formulation reveals why the cross product is perpendicular to both inputs and why its magnitude equals the parallelogram area.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Cross Product', url: 'https://en.wikipedia.org/wiki/Cross_product' },
      { source: 'Khan Academy - Cross Products', url: 'https://www.khanacademy.org/math/multivariable-calculus/thinking-about-multivariable-function/x786f2022:vectors-and-matrices/a/cross-products-mvc' },
    ],
  },
};

export default crossProductConfig;
