import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MatrixPanel from './MatrixPanel';
import { type FMatrix, determinant, fmtApprox, fmtExact, inverse, parseMatrix, rref } from './matrixMath';
import { type Frac, makeFrac, mulFrac, subFrac } from '../../../utils/rational';
import type { ExplainStep } from '../../../types/calculator';

const matrixConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'size',
      label: 'Matrix Size',
      type: 'select',
      required: true,
      options: [
        { label: '2 × 2', value: '2' },
        { label: '3 × 3', value: '3' },
        { label: '4 × 4', value: '4' },
        { label: '5 × 5', value: '5' },
      ],
    },
    {
      id: 'operation',
      label: 'Operation',
      type: 'select',
      required: true,
      options: [
        { label: 'Determinant', value: 'determinant' },
        { label: 'Inverse', value: 'inverse' },
        { label: 'Rank and reduced row echelon form', value: 'rank' },
      ],
    },
    {
      id: 'matrixA',
      label: 'Matrix A',
      type: 'text',
      placeholder: 'Enter each row on a new line, numbers separated by spaces',
      helpText: 'One row per line. Example:\n1 2\n3 4',
    },
  ],
  calculate: (values) => {
    const size = Number(values.size);
    const operation = values.operation || 'determinant';
    const raw = values.matrixA?.trim();

    if (!raw || !Number.isInteger(size) || size < 2 || size > 5) return [];

    const matrix = parseMatrix(raw, size);
    if (!matrix) return [];

    const grid = (m: FMatrix, f: (x: FMatrix[number][number]) => string) => m.map((row) => row.map(f).join(' ')).join(' | ');
    const common = [
      { id: 'matrixSize', label: 'Matrix Size', value: `${size}×${size}` },
      { id: '_matrixData', label: 'Matrix Data', value: JSON.stringify(matrix.map((r) => r.map(fmtExact))) },
    ];

    if (operation === 'determinant') {
      const det = determinant(matrix);
      return [
        { id: 'determinant', label: `det(A)`, value: fmtExact(det), highlight: true, color: 'positive' },
        { id: 'invertible', label: 'Invertible?', value: det.n === 0n ? 'No (singular)' : 'Yes' },
        ...common,
      ];
    }

    if (operation === 'inverse') {
      const inv = inverse(matrix);
      if (!inv)
        return [
          { id: 'inverse', label: 'A⁻¹', value: 'Matrix is singular (det = 0). No inverse exists.', color: 'negative' },
          ...common,
        ];
      return [
        { id: 'inverse', label: 'A⁻¹', value: grid(inv, fmtExact), highlight: true, color: 'positive' },
        { id: 'inverseDecimal', label: 'A⁻¹ (6 decimals)', value: grid(inv, fmtApprox) },
        ...common,
        { id: '_inverseData', label: 'Inverse Data', value: JSON.stringify(inv.map((r) => r.map(fmtExact))) },
      ];
    }

    if (operation === 'rank') {
      const { matrix: R, rank } = rref(matrix);
      return [
        { id: 'rank', label: 'Rank', value: String(rank), highlight: true, color: 'positive' },
        { id: 'nullity', label: 'Nullity (n − rank)', value: String(size - rank) },
        { id: 'rref', label: 'Reduced row echelon form', value: grid(R, fmtExact) },
        ...common,
        { id: '_rrefData', label: 'RREF Data', value: JSON.stringify(R.map((r) => r.map(fmtExact))) },
      ];
    }

    return [];
  },
  explainSteps: (values) => {
    const size = Number(values.size);
    const operation = values.operation || 'determinant';
    const raw = values.matrixA?.trim();
    if (!raw || !Number.isInteger(size) || size < 2 || size > 5) return [];
    const m = parseMatrix(raw, size);
    if (!m) return [];
    const grid = (g: FMatrix, f: (x: Frac) => string = fmtExact) => g.map((row) => row.map(f).join(' ')).join(' | ');
    const p = (f: Frac): string => {
      const s = fmtExact(f);
      return s.startsWith('-') ? `(${s})` : s;
    };
    const neg = (f: Frac): Frac => makeFrac(-f.n, f.d);
    const det = determinant(m);
    const out: ExplainStep[] = [];
    if (operation === 'determinant') {
      if (size === 2) {
        const [[a, b], [c, d]] = m;
        out.push({
          label: 'Multiply the diagonals and subtract: det = a·d − b·c',
          expr: `det(A) = ${p(a)}×${p(d)} − ${p(b)}×${p(c)} = ${p(mulFrac(a, d))} − ${p(mulFrac(b, c))} = ${fmtExact(det)}`,
        });
      } else if (size === 3) {
        const [[a, b, c], [d, e, f], [g, h, i]] = m;
        const m1 = subFrac(mulFrac(e, i), mulFrac(f, h));
        const m2 = subFrac(mulFrac(d, i), mulFrac(f, g));
        const m3 = subFrac(mulFrac(d, h), mulFrac(e, g));
        out.push({
          label: 'Work out the three 2×2 minors under the first row',
          expr: `M₁ = e·i − f·h = ${fmtExact(m1)},  M₂ = d·i − f·g = ${fmtExact(m2)},  M₃ = d·h − e·g = ${fmtExact(m3)}`,
        });
        out.push({
          label: 'Combine them along the first row with signs + − +',
          expr: `det(A) = ${p(a)}×${p(m1)} − ${p(b)}×${p(m2)} + ${p(c)}×${p(m3)} = ${fmtExact(det)}`,
        });
      } else {
        out.push({
          label: 'Row-reduce to an upper-triangular matrix using exact fractions',
          expr: `det(A) = ± (product of the diagonal pivots) = ${fmtExact(det)}`,
          note: 'Swapping two rows flips the sign; adding a multiple of one row to another changes nothing.',
        });
      }
      out.push({
        label: 'A nonzero determinant means the matrix is invertible',
        expr: det.n === 0n ? 'det(A) = 0, so A is singular (no inverse)' : `det(A) = ${fmtExact(det)} ≠ 0, so A is invertible`,
      });
      return out;
    }
    if (operation === 'inverse') {
      out.push({ label: 'An inverse exists only when the determinant is not zero', expr: `det(A) = ${fmtExact(det)}` });
      const inv = inverse(m);
      if (!inv) {
        out.push({ label: 'The matrix is singular', expr: 'det(A) = 0, so A has no inverse' });
        return out;
      }
      const exact = grid(inv);
      const approx = grid(inv, fmtApprox);
      const rounded = approx !== exact ? { note: `Rounded to 6 decimals: ${approx}` } : {};
      if (size === 2) {
        const [[a, b], [c, d]] = m;
        out.push({
          label: 'Swap the diagonal entries, flip the signs of the other two, divide by the determinant',
          expr: `A⁻¹ = 1/${p(det)} × [${fmtExact(d)} ${fmtExact(neg(b))} | ${fmtExact(neg(c))} ${fmtExact(a)}]`,
        });
        out.push({ label: 'Inverse matrix', expr: exact, ...rounded });
      } else {
        out.push({ label: 'Row-reduce [A | I] until the left side becomes the identity; the right side is then A⁻¹', expr: `A⁻¹ = ${exact}`, ...rounded });
      }
      return out;
    }
    if (operation === 'rank') {
      const { matrix: R, rank } = rref(m);
      return [
        { label: 'Row-reduce to reduced row echelon form (exact fractions)', expr: grid(R) },
        { label: 'Count the nonzero rows (the pivots): that is the rank', expr: `rank = ${rank}` },
        { label: 'Nullity is the number of columns minus the rank', expr: `nullity = ${size} − ${rank} = ${size - rank}` },
      ];
    }
    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MatrixPanel, { values, results });
  },
  educational: {
    formula: 'det(A) = sum of signed cofactor products | A⁻¹ = adj(A) / det(A)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="22" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">2 x 2 Matrix: det(A) = ad - bc</text><rect x="60" y="35" width="200" height="130" fill="rgba(59,130,246,0.06)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="6"/><text x="160" y="42" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="11">A =</text><line x1="118" y1="50" x2="118" y2="130" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="118" y1="50" x2="90" y2="50" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="90" y1="50" x2="90" y2="130" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="90" y1="130" x2="118" y2="130" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="202" y1="50" x2="202" y2="130" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="202" y1="50" x2="230" y2="50" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="230" y1="50" x2="230" y2="130" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="202" y1="130" x2="230" y2="130" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="118" y1="90" x2="202" y2="90" stroke="var(--svg-3b82f6)" stroke-width="1" stroke-dasharray="3,2"/><text x="104" y="75" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">a</text><text x="150" y="75" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">b</text><text x="104" y="118" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">c</text><text x="150" y="118" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">d</text><text x="160" y="160" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="11">det = a&times;d - b&times;c</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="10">det(A) = 0 means singular (no inverse)</text></svg>',
      alt: 'Matrix with brackets showing 2x2 grid labeled a, b, c, d and determinant formula',
      caption: 'The determinant of a 2x2 matrix: ad - bc',
    },
    formulaDescription:
      'The determinant is a scalar value computed from a square matrix that indicates whether the matrix is invertible (det ≠ 0) or singular (det = 0). The inverse of a matrix A, denoted A⁻¹, satisfies A × A⁻¹ = I (the identity matrix). For a 2×2 matrix [[a, b], [c, d]], the determinant is ad − bc and the inverse is 1/(ad−bc) × [[d, −b], [−c, a]]. For larger matrices, the inverse is computed as the adjugate matrix divided by the determinant.',
    variables: [
      { symbol: 'A', name: 'Matrix', description: 'An n×n square matrix of decimal numbers (entries are read exactly, e.g. 0.1 is 1/10). Supported sizes: 2×2, 3×3, 4×4, and 5×5.' },
      { symbol: 'det(A)', name: 'Determinant', description: 'A scalar that encodes properties of the matrix. Zero means the matrix is singular (non-invertible).' },
      { symbol: 'A⁻¹', name: 'Inverse', description: 'The matrix that, when multiplied by A, gives the identity matrix. Exists only when det(A) ≠ 0.' },
    ],
    howToUse: [
      'Select the matrix size: 2×2, 3×3, 4×4, or 5×5.',
      'Choose an operation: determinant, inverse, or rank with the reduced row echelon form.',
      'Enter matrix entries row by row. Use one line per row, separating numbers with spaces or commas.',
      'Results are exact: integers and decimals are read as exact fractions, so the answer is a whole number or a fraction such as 1/3, with a 6-decimal rounding alongside for inverses.',
    ],
    explanation:
      'Matrix operations are fundamental to linear algebra and have applications in computer graphics (transformation matrices), physics (systems of linear equations), machine learning (weight matrices), and engineering (finite element analysis). The determinant of a 2×2 matrix is ad − bc. For larger matrices, the determinant is computed via Laplace expansion (also called cofactor expansion), where you expand along a row or column, computing signed minors recursively. For a 3×3 matrix, the Rule of Sarrus provides a visual shortcut. The inverse exists only when the determinant is non-zero — a matrix with zero determinant is called singular or degenerate, meaning its rows (or columns) are linearly dependent. A singular matrix represents a transformation that collapses space (maps multiple inputs to the same output), which is why it cannot be reversed.',
    faqs: [
      {
        question: 'What does the determinant tell us about a linear transformation?',
        answer: 'The determinant represents the scaling factor of the linear transformation. In 2D, |det| is the area scaling factor — a determinant of 3 means the transformation multiplies areas by 3. In 3D, it is the volume scaling factor. A negative determinant indicates that the transformation reverses orientation (flips the space). A zero determinant means the transformation collapses the space into a lower dimension, which is why it is not invertible.',
      },
      {
        question: 'When is a matrix invertible?',
        answer: 'A square matrix is invertible (non-singular) when its determinant is not zero. This means its rows (and columns) are linearly independent — no row can be expressed as a linear combination of the others. Equivalent conditions: the matrix has full rank, its null space contains only the zero vector, and it represents a bijective (one-to-one and onto) linear transformation.',
      },
      {
        question: 'How do I compute the determinant of a 3×3 matrix?',
        answer: 'For a 3×3 matrix [[a, b, c], [d, e, f], [g, h, i]], the determinant is a(ei − fh) − b(di − fg) + c(dh − eg). This is called cofactor expansion along the first row, or the Rule of Sarrus when visualized as diagonal products. You can also expand along any row or column by taking the sum of each element times its cofactor (signed minor).',
      },
      {
        question: 'Why is a matrix without an inverse called singular?',
        answer: 'The term "singular" comes from the geometric interpretation: a singular matrix represents a linear transformation that collapses space into a lower dimension, which is a "singular" or degenerate case. For example, projecting a 3D object onto a 2D plane collapses the z-dimension — this transformation has determinant zero and is non-invertible because you cannot recover the lost depth information.',
      },
      {
        question: 'Where are matrix determinants used in real-world applications?',
        answer: 'Determinants are used in computer graphics for 3D transformations and collision detection, in machine learning for understanding whether a covariance matrix is invertible, in engineering for analyzing system stability, in economics for input-output models, and in robotics for inverse kinematics calculations. Any field that uses systems of linear equations relies on determinants to determine whether a unique solution exists.',
      },
    ],
    quickReference: [
      { label: '2×2 Determinant ([[a,b],[c,d]])', value: 'ad − bc' },
      { label: '2×2 Inverse ([[a,b],[c,d]])', value: '1/(ad−bc) × [[d, −b], [−c, a]]' },
      { label: 'Identity Matrix (2×2)', value: '[[1, 0], [0, 1]]' },
      { label: 'Zero Matrix (3×3)', value: 'All entries are 0' },
      { label: 'Singular Matrix Condition', value: 'det(A) = 0 — no inverse exists' },
      { label: '3×3 Determinant (Rule of Sarrus)', value: 'aei + bfg + cdh − ceg − bdi − afh' },
    ],
    commonUses: [
      'Computer graphics — transformation matrices for 3D rendering, rotation, scaling, and translation of objects in games and CAD software',
      'Machine learning — weight matrices in neural networks and covariance matrices in dimensionality reduction (PCA)',
      'Engineering — solving systems of linear equations in structural analysis, circuit simulation, and control systems',
      'Economics — input-output models that track how changes in one industry sector propagate through the entire economy',
      'Robotics — inverse kinematics matrices that calculate joint angles needed to reach a desired end-effector position',
    ],
    citations: [
      { source: 'Wolfram MathWorld - Matrix', url: 'https://mathworld.wolfram.com/Matrix.html' },
      { source: 'Wikipedia - Matrix (Mathematics)', url: 'https://en.wikipedia.org/wiki/Matrix_(mathematics)' },
    ],
  },
};

export default matrixConfig;
