import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DotProductPanel from './DotProductPanel';

const dotProductConfig: CalculatorConfig = {
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
      placeholder: '0',
      step: 0.1,
      helpText: 'Third component of vector a (leave as 0 for 2D)',
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
      placeholder: '0',
      step: 0.1,
      helpText: 'Third component of vector b (leave as 0 for 2D)',
    },
  ],
  calculate: (values) => {
    const v1x = parseFloat(values.v1x);
    const v1y = parseFloat(values.v1y);
    const v1z = parseFloat(values.v1z || '0') || 0;
    const v2x = parseFloat(values.v2x);
    const v2y = parseFloat(values.v2y);
    const v2z = parseFloat(values.v2z || '0') || 0;

    if ([v1x, v1y, v2x, v2y].some(isNaN)) return [];

    const fmt = (n: number) => {
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toFixed(6)).toString();
    };

    // Dot product: a·b = a₁b₁ + a₂b₂ + a₃b₃
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;

    // Magnitudes
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

    // Angle between
    let angleDeg = 0;
    let cosTheta = 0;
    if (mag1 > 0 && mag2 > 0) {
      cosTheta = dot / (mag1 * mag2);
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
      angleDeg = Math.acos(cosTheta) * (180 / Math.PI);
    }

    // Orthogonal check
    const orthogonal = Math.abs(dot) < 1e-10 ? 'Yes' : 'No';

    // Scalar projection of a onto b: a·b / |b|
    let projection = 0;
    if (mag2 > 0) {
      projection = dot / mag2;
    }

    return [
      {
        id: 'dotProduct',
        label: 'a · b',
        value: fmt(dot),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'magnitude1',
        label: '|a|',
        value: fmt(mag1),
        color: 'neutral' as const,
      },
      {
        id: 'magnitude2',
        label: '|b|',
        value: fmt(mag2),
        color: 'neutral' as const,
      },
      {
        id: 'angleDeg',
        label: 'Angle Between',
        value: `${fmt(angleDeg)}°`,
        color: 'positive' as const,
      },
      {
        id: 'cosTheta',
        label: 'cos θ',
        value: fmt(cosTheta),
        color: 'neutral' as const,
      },
      {
        id: 'orthogonal',
        label: 'Orthogonal?',
        value: orthogonal,
        color: orthogonal === 'Yes' ? ('positive' as const) : ('neutral' as const),
      },
      {
        id: 'projection',
        label: 'Scalar Projection of a onto b',
        value: fmt(projection),
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DotProductPanel, { values, results });
  },
  educational: {
    formula: 'a · b = a₁b₁ + a₂b₂ + a₃b₃ = |a||b|cos θ',
    diagram: {
      svg: '<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Dot (Scalar) Product</text><line x1="60" y1="290" x2="420" y2="290" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><line x1="60" y1="290" x2="60" y2="50" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><text x="430" y="294" font-size="11" fill="var(--svg-94a3b8)">x</text><text x="66" y="48" font-size="11" fill="var(--svg-94a3b8)">y</text><defs><marker id="arrowA2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-3b82f6)"/></marker><marker id="arrowB2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-ef4444)"/></marker></defs><line x1="60" y1="290" x2="340" y2="190" stroke="var(--svg-3b82f6)" stroke-width="2.5" marker-end="url(#arrowA2)"/><text x="350" y="188" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">a</text><line x1="60" y1="290" x2="260" y2="110" stroke="var(--svg-ef4444)" stroke-width="2.5" marker-end="url(#arrowB2)"/><text x="270" y="104" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">b</text><path d="M160,270 A50,50 0 0,1 175,250" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="1.5"/><text x="175" y="262" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">θ</text><line x1="60" y1="290" x2="340" y2="290" stroke="var(--svg-3b82f6)" stroke-width="2" stroke-dasharray="6,3" opacity="0.5"/><text x="200" y="308" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)">Scalar projection = |a|cos θ</text><text x="240" y="330" text-anchor="middle" font-size="12" fill="var(--svg-94a3b8)">a · b = |a||b|cos θ  |  Zero when θ = 90° (orthogonal)</text></svg>',
      alt: 'Vector diagram showing two vectors a and b with angle theta between them, and a dashed line showing the scalar projection of a onto b',
      caption: 'The dot product measures how much two vectors align with each other, reaching maximum when parallel and zero when perpendicular',
    },
    formulaDescription:
      'The dot product (also called the scalar product or inner product) is an algebraic operation that takes two equal-length sequences of numbers and returns a single number. Geometrically, it is the product of the Euclidean magnitudes of the two vectors and the cosine of the angle between them. The dot product is zero when the vectors are orthogonal (perpendicular), positive when they point in similar directions (angle < 90°), and negative when they point in opposite directions (angle > 90°).',
    variables: [
      { symbol: 'a = (a₁, a₂, a₃)', name: 'First Vector', description: 'The first input vector defined by its components.' },
      { symbol: 'b = (b₁, b₂, b₃)', name: 'Second Vector', description: 'The second input vector defined by its components.' },
      { symbol: 'a · b', name: 'Dot Product', description: 'The scalar result of the dot product: a₁b₁ + a₂b₂ + a₃b₃.' },
      { symbol: '|a|, |b|', name: 'Magnitudes', description: 'The lengths of vectors a and b, calculated as √(x² + y² + z²).' },
      { symbol: 'θ', name: 'Angle', description: 'The angle between the two vectors, derived from cos θ = (a·b)/(|a||b|).' },
    ],
    howToUse: [
      'Enter the components of the first vector (a) and second vector (b). The z-components are optional (default 0).',
      'The calculator computes the dot product, magnitudes, and the angle between the vectors.',
      'Check the "Orthogonal?" result — if "Yes", the dot product is zero and the vectors are perpendicular.',
      'Review the scalar projection, which gives the length of the shadow of vector a cast onto vector b.',
    ],
    quickReference: [
      { label: 'Zero dot product', value: 'Vectors are perpendicular (θ = 90°)' },
      { label: 'Positive dot product', value: 'Vectors point in similar direction (θ < 90°)' },
      { label: 'Negative dot product', value: 'Vectors point in opposite directions (θ > 90°)' },
      { label: 'Projection', value: 'Scalar proj of a onto b = a·b / |b|' },
    ],
    commonUses: [
      'Physics: computing work done by a force (W = F · d), where only the force component in the direction of motion contributes.',
      'Computer graphics: implementing the Phong lighting model where the dot product of the surface normal and light direction determines brightness.',
      'Machine learning: calculating cosine similarity between document vectors for information retrieval and recommendation systems.',
      'Game development: detecting whether a character is facing toward or away from an object using the dot product of direction vectors.',
      'Linear algebra: testing orthogonality, computing projections, and implementing the Gram-Schmidt process for creating orthonormal bases.',
    ],
    explanation:
      'The dot product is the simplest and most fundamental vector multiplication operation. Unlike scalar multiplication which scales a vector, the dot product combines two vectors to produce a scalar. The algebraic definition (sum of component-wise products) is easy to compute, while the geometric interpretation (|a||b|cos θ) reveals its true meaning: it measures how much one vector extends in the direction of another. When the dot product is zero, the vectors are orthogonal — a property used constantly in graphics, physics, and linear algebra. A positive dot product means the vectors are generally pointing in the same direction; a negative one means they point oppositely. The scalar projection (a · b / |b|) gives the signed length of the orthogonal projection of a onto the line through b. This is used extensively in computing components of forces, decomposing vectors into basis directions, and in the Gram-Schmidt orthogonalization process.',
    faqs: [
      {
        question: 'What is the difference between dot product and cross product?',
        answer: 'The dot product produces a scalar (a single number) and measures how aligned two vectors are. The cross product produces a vector that is perpendicular to both inputs and measures how different their directions are. The dot product works in any dimension and is commutative (a·b = b·a), while the cross product is unique to 3D and is anti-commutative (a×b = −b×a).',
      },
      {
        question: 'What does it mean if cos θ = 1 or cos θ = −1?',
        answer: 'If cos θ = 1, the angle is 0° and the vectors are parallel and pointing in exactly the same direction. If cos θ = −1, the angle is 180° and the vectors are antiparallel (same line, opposite directions). In both cases, one vector is a scalar multiple of the other. When cos θ = 0, θ = 90° and the vectors are perpendicular (orthogonal).',
      },
      {
        question: 'How is the dot product used in machine learning?',
        answer: 'In machine learning, the dot product is used for cosine similarity: cos θ = (a·b)/(|a||b|), which measures the similarity between two vectors regardless of their magnitude. This is commonly used in natural language processing to compare document vectors (TF-IDF or word embedding vectors), in recommendation systems to find similar items or users, and in neural networks where weighted sums are computed as dot products.',
      },
      {
        question: 'What is the scalar projection and how is it different from the vector projection?',
        answer: 'The scalar projection (also called the scalar component) of a onto b is the signed length of the orthogonal projection of a onto the line of b. It is computed as a·b/|b|. The vector projection is the scalar projection multiplied by the unit vector in the direction of b: (a·b/|b|²)·b. The scalar projection tells you "how much of a points in b\'s direction," while the vector projection gives you the actual projection vector.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Dot Product', url: 'https://en.wikipedia.org/wiki/Dot_product' },
      { source: 'Khan Academy - Dot Products', url: 'https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces/dot-cross-products/v/vector-dot-product-and-vector-length' },
    ],
  },
};

export default dotProductConfig;
