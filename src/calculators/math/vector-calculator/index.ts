import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import VectorCalculatorPanel from './VectorCalculatorPanel';

const vectorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'v1x',
      defaultValue: '2',
      label: 'v₁x',
      type: 'number',
      placeholder: 'v₁x',
      required: true,
      step: 0.1,
      helpText: 'X-component of the first vector',
    },
    {
      id: 'v1y',
      defaultValue: '3',
      label: 'v₁y',
      type: 'number',
      placeholder: 'v₁y',
      required: true,
      step: 0.1,
      helpText: 'Y-component of the first vector',
    },
    {
      id: 'v1z',
      label: 'v₁z',
      type: 'number',
      placeholder: '0',
      step: 0.1,
      helpText: 'Z-component of the first vector (leave as 0 for 2D)',
    },
    {
      id: 'v2x',
      defaultValue: '5',
      label: 'v₂x',
      type: 'number',
      placeholder: 'v₂x',
      required: true,
      step: 0.1,
      helpText: 'X-component of the second vector',
    },
    {
      id: 'v2y',
      defaultValue: '6',
      label: 'v₂y',
      type: 'number',
      placeholder: 'v₂y',
      required: true,
      step: 0.1,
      helpText: 'Y-component of the second vector',
    },
    {
      id: 'v2z',
      label: 'v₂z',
      type: 'number',
      placeholder: '0',
      step: 0.1,
      helpText: 'Z-component of the second vector (leave as 0 for 2D)',
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

    const is3D = values.v1z !== '' || values.v2z !== '';

    // Addition
    const sumX = v1x + v2x;
    const sumY = v1y + v2y;
    const sumZ = v1z + v2z;

    // Subtraction
    const diffX = v1x - v2x;
    const diffY = v1y - v2y;
    const diffZ = v1z - v2z;

    // Magnitudes
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

    // Dot product
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;

    // Cross product (3D)
    const crossX = v1y * v2z - v1z * v2y;
    const crossY = v1z * v2x - v1x * v2z;
    const crossZ = v1x * v2y - v1y * v2x;

    // Angle between vectors
    let angleDeg = 0;
    if (mag1 > 0 && mag2 > 0) {
      const cosTheta = dot / (mag1 * mag2);
      angleDeg = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * (180 / Math.PI);
    }

    return [
      {
        id: 'sum',
        label: `Sum (v₁ + v₂)`,
        value: is3D ? `(${fmt(sumX)}, ${fmt(sumY)}, ${fmt(sumZ)})` : `(${fmt(sumX)}, ${fmt(sumY)})`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'difference',
        label: `Difference (v₁ − v₂)`,
        value: is3D ? `(${fmt(diffX)}, ${fmt(diffY)}, ${fmt(diffZ)})` : `(${fmt(diffX)}, ${fmt(diffY)})`,
        color: 'neutral' as const,
      },
      {
        id: 'magnitude1',
        label: `|v₁|`,
        value: fmt(mag1),
        color: 'neutral' as const,
      },
      {
        id: 'magnitude2',
        label: `|v₂|`,
        value: fmt(mag2),
        color: 'neutral' as const,
      },
      {
        id: 'dotProduct',
        label: 'Dot Product (v₁·v₂)',
        value: fmt(dot),
        color: 'neutral' as const,
      },
      {
        id: 'crossProduct',
        label: 'Cross Product (v₁ × v₂)',
        value: is3D ? `(${fmt(crossX)}, ${fmt(crossY)}, ${fmt(crossZ)})` : `(0, 0, ${fmt(crossZ)})`,
        color: 'neutral' as const,
      },
      {
        id: 'angleDeg',
        label: 'Angle Between',
        value: `${fmt(angleDeg)}°`,
        color: 'positive' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(VectorCalculatorPanel, { values, results });
  },
  educational: {
    formula: 'a · b = |a||b|cos θ | a × b = (a₂b₃−a₃b₂, a₃b₁−a₁b₃, a₁b₂−a₂b₁)',
    diagram: {
      svg: '<svg viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Vector Operations in 2D / 3D</text><line x1="60" y1="290" x2="420" y2="290" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><line x1="120" y1="290" x2="120" y2="40" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><text x="430" y="294" font-size="11" fill="var(--svg-94a3b8)">x</text><text x="126" y="38" font-size="11" fill="var(--svg-94a3b8)">y</text><defs><marker id="arrowBlue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-3b82f6)"/></marker><marker id="arrowRed" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-ef4444)"/></marker><marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-22c55e)"/></marker></defs><line x1="120" y1="290" x2="300" y2="160" stroke="var(--svg-3b82f6)" stroke-width="2.5" marker-end="url(#arrowBlue)"/><text x="310" y="158" font-size="13" font-weight="bold" fill="var(--svg-3b82f6)">v&#8321;</text><line x1="120" y1="290" x2="380" y2="230" stroke="var(--svg-ef4444)" stroke-width="2.5" marker-end="url(#arrowRed)"/><text x="390" y="228" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">v&#8322;</text><line x1="120" y1="290" x2="380" y2="100" stroke="var(--svg-22c55e)" stroke-width="2.5" stroke-dasharray="6,3" marker-end="url(#arrowGreen)"/><text x="390" y="98" font-size="13" font-weight="bold" fill="var(--svg-22c55e)">v&#8321;+v&#8322;</text><path d="M300,160 L380,230" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,4"/><text x="245" y="220" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">θ = angle between vectors</text><path d="M170,270 A50,50 0 0,1 175,250" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="1.5"/><text x="240" y="325" text-anchor="middle" font-size="12" fill="var(--svg-94a3b8)">Addition: parallelogram rule | Dot: a·b = a₁b₁ + a₂b₂ + a₃b₃</text></svg>',
      alt: 'Vector diagram showing two vectors v1 and v2 from the origin, their sum v1+v2 using the head-to-tail method, and the angle theta between them',
      caption: 'Vectors can be added, subtracted, and multiplied using dot and cross products',
    },
    formulaDescription:
      'Vector operations are fundamental in physics, engineering, and computer graphics. The vector sum is computed component-wise, while the dot product yields a scalar representing the projection of one vector onto another. The cross product produces a third vector perpendicular to both inputs. The angle between vectors is derived from the dot product formula: cos θ = (a·b)/(|a||b|).',
    variables: [
      { symbol: 'v₁ = (x₁, y₁, z₁)', name: 'First Vector', description: 'The first input vector defined by its three spatial components.' },
      { symbol: 'v₂ = (x₂, y₂, z₂)', name: 'Second Vector', description: 'The second input vector defined by its three spatial components.' },
      { symbol: '|v|', name: 'Magnitude (Length)', description: 'The length of a vector, calculated as √(x² + y² + z²). Always non-negative.' },
      { symbol: 'a · b', name: 'Dot Product', description: 'The scalar product: a₁b₁ + a₂b₂ + a₃b₃. Measures alignment between vectors.' },
      { symbol: 'a × b', name: 'Cross Product', description: 'The vector product: a 3D vector perpendicular to both a and b. Magnitude equals area of parallelogram.' },
    ],
    howToUse: [
      'Enter the x, y, and z components of both vectors. For 2D vectors, leave the z components as 0.',
      'The calculator computes addition, subtraction, magnitudes, dot product, cross product, and the angle between vectors.',
      'Review the results: addition and subtraction show component-wise results; the angle shows how aligned the vectors are.',
      'Vectors with z = 0 are treated as 2D vectors, but cross product results will still be displayed in 3D format.',
    ],
    quickReference: [
      { label: 'Addition', value: 'v₁ + v₂ = (x₁+x₂, y₁+y₂, z₁+z₂)' },
      { label: 'Dot product', value: 'a · b = |a||b|cos θ' },
      { label: 'Cross product', value: '|a × b| = |a||b|sin θ' },
      { label: 'Angle', value: 'θ = arccos((a·b)/(|a||b|))' },
    ],
    commonUses: [
      'Physics: calculating net force by adding force vectors, computing work as the dot product of force and displacement.',
      'Computer graphics: representing positions, directions, velocities, and normals; performing lighting calculations using dot products.',
      'Engineering: analyzing structural forces, moments (torque uses cross product), and fluid velocity fields.',
      'Machine learning: representing feature vectors and computing similarity using dot products in high-dimensional spaces.',
      'Robotics: describing robot arm positions and orientations, computing transformations between coordinate frames.',
    ],
    explanation:
      'Vectors are mathematical objects with both magnitude and direction, represented as ordered tuples of numbers. In 2D, a vector has two components (x, y); in 3D, three components (x, y, z). Vector addition is performed component-wise and geometrically follows the parallelogram law. The dot product (or scalar product) produces a scalar from two vectors and is zero when the vectors are perpendicular — making it invaluable for testing orthogonality. The cross product exists only in 3D and produces a vector perpendicular to both inputs, with magnitude equal to the area of the parallelogram they span. The right-hand rule determines the direction of the cross product. The angle between vectors is derived from the dot product formula, and the angle is 0° for parallel vectors, 90° for perpendicular vectors, and 180° for anti-parallel vectors. Vector operations are the mathematical foundation for describing physical quantities like force, velocity, acceleration, and electromagnetic fields.',
    faqs: [
      {
        question: 'What is the difference between the dot product and the cross product?',
        answer: 'The dot product produces a scalar (a single number) and measures how much two vectors point in the same direction. It is commutative: a·b = b·a. The cross product produces a vector perpendicular to both inputs and measures how much two vectors point in different directions. It is anti-commutative: a × b = −(b × a). The cross product only exists in 3D, while the dot product works in any dimension.',
      },
      {
        question: 'Can I use this calculator for 2D vectors?',
        answer: 'Yes! Simply leave the z-components as 0 (the default). The calculator will display 2D results for addition and subtraction, though the cross product is inherently a 3D operation. For 2D vectors, the cross product magnitude equals |v₁x·v₂y − v₁y·v₂x|, which represents the signed area of the parallelogram.',
      },
      {
        question: 'What does a dot product of zero mean?',
        answer: 'A dot product of zero means the vectors are orthogonal (perpendicular) to each other. This is a critically important property in geometry, physics, and linear algebra. For example, in 3D graphics, surface normals are perpendicular to surfaces, so lighting calculations use zero dot products to detect surfaces facing away from the light source.',
      },
      {
        question: 'How is the angle between vectors calculated?',
        answer: 'The angle is calculated using the dot product formula: cos θ = (a·b)/(|a||b|). Rearranging: θ = arccos((a·b)/(|a||b|)). The result is in the range [0°, 180°], where 0° means the vectors point in exactly the same direction, 90° means they are perpendicular, and 180° means they point in exactly opposite directions.',
      },
      {
        question: 'What is the geometric meaning of the cross product magnitude?',
        answer: 'The magnitude of the cross product |a × b| equals the area of the parallelogram formed by the two vectors. It is also equal to |a||b|sin θ, where θ is the angle between the vectors. This means the cross product magnitude is maximized when the vectors are perpendicular (sin 90° = 1) and zero when they are parallel (sin 0° = 0).',
      },
    ],
    citations: [
      { source: 'Wikipedia - Vector Algebra', url: 'https://en.wikipedia.org/wiki/Vector_algebra' },
      { source: 'Khan Academy - Vectors', url: 'https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces' },
    ],
  },
};

export default vectorConfig;
