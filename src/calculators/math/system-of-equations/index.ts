import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SystemOfEquationsPanel from './SystemOfEquationsPanel';

function fmt(n: number): string {
  return parseFloat(n.toFixed(6)).toString();
}

const systemOfEquationsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a1',
      label: 'a₁ (coefficient of x in eq 1)',
      type: 'number',
      placeholder: '2',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter the coefficient of x in the first equation',
    },
    {
      id: 'b1',
      label: 'b₁ (coefficient of y in eq 1)',
      type: 'number',
      placeholder: '3',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter the coefficient of y in the first equation',
    },
    {
      id: 'c1',
      label: 'c₁ (constant in eq 1)',
      type: 'number',
      placeholder: '7',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter the constant term of the first equation',
    },
    {
      id: 'a2',
      label: 'a₂ (coefficient of x in eq 2)',
      type: 'number',
      placeholder: '5',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter the coefficient of x in the second equation',
    },
    {
      id: 'b2',
      label: 'b₂ (coefficient of y in eq 2)',
      type: 'number',
      placeholder: '-2',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter the coefficient of y in the second equation',
    },
    {
      id: 'c2',
      label: 'c₂ (constant in eq 2)',
      type: 'number',
      placeholder: '3',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'Enter the constant term of the second equation',
    },
  ],

  calculate: (values) => {
    const a1 = parseFloat(values.a1);
    const b1 = parseFloat(values.b1);
    const c1 = parseFloat(values.c1);
    const a2 = parseFloat(values.a2);
    const b2 = parseFloat(values.b2);
    const c2 = parseFloat(values.c2);

    if (isNaN(a1) || isNaN(b1) || isNaN(c1) || isNaN(a2) || isNaN(b2) || isNaN(c2)) {
      return [];
    }

    const D = a1 * b2 - a2 * b1;
    const Dx = c1 * b2 - c2 * b1;
    const Dy = a1 * c2 - a2 * c1;

    const steps: string[] = [];
    steps.push(`System of equations:`);
    steps.push(`  ${fmt(a1)}x + ${fmt(b1)}y = ${fmt(c1)}`);
    steps.push(`  ${fmt(a2)}x + ${fmt(b2)}y = ${fmt(c2)}`);
    steps.push(`Determinant D = a₁·b₂ − a₂·b₁ = ${fmt(a1)}·${fmt(b2)} − ${fmt(a2)}·${fmt(b1)} = ${fmt(D)}`);

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color?: 'positive' | 'negative' | 'neutral' }> = [
      {
        id: 'system',
        label: 'System',
        value: `${fmt(a1)}x + ${fmt(b1)}y = ${fmt(c1)}  |  ${fmt(a2)}x + ${fmt(b2)}y = ${fmt(c2)}`,
        highlight: true,
        color: 'neutral' as const,
      },
      {
        id: 'determinant',
        label: 'Determinant (D)',
        value: fmt(D),
        color: D !== 0 ? 'positive' as const : 'negative' as const,
      },
    ];

    if (D !== 0) {
      const x = Dx / D;
      const y = Dy / D;

      steps.push(`Dx = c₁·b₂ − c₂·b₁ = ${fmt(c1)}·${fmt(b2)} − ${fmt(c2)}·${fmt(b1)} = ${fmt(Dx)}`);
      steps.push(`Dy = a₁·c₂ − a₂·c₁ = ${fmt(a1)}·${fmt(c2)} − ${fmt(a2)}·${fmt(c1)} = ${fmt(Dy)}`);
      steps.push(`D = ${fmt(D)} ≠ 0 → unique solution`);
      steps.push(`x = Dx / D = ${fmt(Dx)} / ${fmt(D)} = ${fmt(x)}`);
      steps.push(`y = Dy / D = ${fmt(Dy)} / ${fmt(D)} = ${fmt(y)}`);

      results.push({ id: 'x', label: 'x', value: fmt(x), highlight: true, color: 'positive' as const });
      results.push({ id: 'y', label: 'y', value: fmt(y), highlight: true, color: 'positive' as const });
      results.push({ id: 'solutionType', label: 'Solution Type', value: 'Unique solution', color: 'positive' as const });
    } else if (Dx === 0 && Dy === 0) {
      steps.push(`D = 0 and Dx = Dy = 0 → infinite solutions (dependent system)`);
      results.push({ id: 'x', label: 'x', value: 'No unique value', color: 'neutral' as const });
      results.push({ id: 'y', label: 'y', value: 'No unique value', color: 'neutral' as const });
      results.push({ id: 'solutionType', label: 'Solution Type', value: 'Infinite solutions (dependent system)', color: 'neutral' as const });
    } else {
      steps.push(`D = 0 but Dx = ${fmt(Dx)} and Dy = ${fmt(Dy)} (not both zero) → no solution (inconsistent system)`);
      results.push({ id: 'x', label: 'x', value: 'No solution', color: 'negative' as const });
      results.push({ id: 'y', label: 'y', value: 'No solution', color: 'negative' as const });
      results.push({ id: 'solutionType', label: 'Solution Type', value: 'No solution (inconsistent system)', color: 'negative' as const });
    }

    results.push({
      id: 'steps',
      label: 'Step-by-Step Work',
      value: steps.join('\n'),
      color: 'neutral' as const,
    });

    return results;
  },

  educational: {
    formula: 'x = Dx/D, y = Dy/D where D = a₁b₂ − a₂b₁, Dx = c₁b₂ − c₂b₁, Dy = a₁c₂ − a₂c₁',
    formulaDescription:
      "Cramer's rule solves systems of two linear equations in two variables using determinants. Given the system a₁x + b₁y = c₁ and a₂x + b₂y = c₂, the main determinant D = a₁b₂ − a₂b₁ determines solvability. If D ≠ 0, the system has a unique solution: x = Dx/D and y = Dy/D, where Dx and Dy replace the x-column and y-column with constants. If D = 0 and Dx = Dy = 0, there are infinitely many solutions (the equations are dependent). If D = 0 and Dx ≠ 0 or Dy ≠ 0, there is no solution (the equations are inconsistent and represent parallel lines).",
    variables: [
      { symbol: 'D', name: 'Main Determinant', description: 'D = a₁b₂ − a₂b₁. The determinant determines whether the system has a unique solution (D ≠ 0), infinite solutions (D = 0, Dx = Dy = 0), or no solution (D = 0, Dx or Dy ≠ 0). Geometrically, D ≠ 0 means the two lines intersect at a single point.' },
      { symbol: 'Dx', name: 'X-Determinant', description: 'Dx = c₁b₂ − c₂b₁. Replaces the x-coefficient column with the constants. Used with D to compute x = Dx/D when a unique solution exists.' },
      { symbol: 'Dy', name: 'Y-Determinant', description: 'Dy = a₁c₂ − a₂c₁. Replaces the y-coefficient column with the constants. Used with D to compute y = Dy/D when a unique solution exists.' },
      { symbol: 'x, y', name: 'Solution Variables', description: 'The two unknowns being solved for. Each pair (x, y) represents the intersection point of two lines in 2D space.' },
    ],
    howToUse: [
      'Enter the coefficients for equation 1 in the form a₁x + b₁y = c₁. The coefficients a₁, b₁, and the constant c₁ are all required.',
      'Enter the coefficients for equation 2 in the form a₂x + b₂y = c₂. All six values (a₁, b₁, c₁, a₂, b₂, c₂) must be provided.',
      'The calculator computes the determinant D and reports whether the system has a unique solution, infinite solutions, or no solution.',
      'If a unique solution exists, the calculator displays x and y with step-by-step work showing Cramer\'s rule calculations.',
      'For dependent or inconsistent systems, the calculator explains the geometric meaning — parallel lines or coincident lines.',
    ],
    quickReference: [
      { label: 'Unique solution', value: 'D = a₁b₂ − a₂b₁ ≠ 0 → one intersection point' },
      { label: 'Infinite solutions', value: 'D = 0, Dx = Dy = 0 → same line (coincident)' },
      { label: 'No solution', value: 'D = 0, Dx ≠ 0 or Dy ≠ 0 → parallel lines' },
      { label: 'Cramer\'s Rule', value: 'x = Dx/D, y = Dy/D for D ≠ 0' },
    ],
    commonUses: [
      'Economics: Solve supply and demand equilibrium where two linear equations represent market conditions — find the price and quantity where supply equals demand.',
      'Engineering: Analyze circuits with two unknowns using Kirchhoff\'s voltage and current laws, where each loop or node produces a linear equation.',
      'Chemistry: Balance chemical reactions with two unknowns or solve mixture problems where two substances combine with different concentrations.',
      'Computer Graphics: Find intersection points of lines for collision detection, ray tracing, and geometric computations in 2D space.',
      'Education: Learn fundamental linear algebra concepts, practice Cramer\'s rule, and verify homework solutions for systems of equations.',
    ],
    explanation:
      `Solving systems of linear equations is a cornerstone of algebra with applications spanning nearly every scientific and engineering discipline. Cramer's rule, named after the Swiss mathematician Gabriel Cramer (1704-1752), provides an elegant method for solving systems using determinants. The concept dates back to the mid-18th century when Cramer published his treatise "Introduction to the Analysis of Algebraic Curves" in 1750, where he presented the determinant-based method for solving linear systems. For a 2x2 system a1x + b1y = c1 and a2x + b2y = c2, the determinant D = a1b2 - a2b1 serves as a quick test for solvability. If D is not zero, the two lines intersect at exactly one point — the unique solution (x, y) = (Dx/D, Dy/D). The geometric interpretation is intuitive: two non-parallel lines in a plane always intersect exactly once. If D = 0, the lines have the same slope: they are either parallel (no intersection, no solution) or coincident (the same line, infinite solutions). The distinction between these two cases is made by checking Dx and Dy. If both are also zero, the equations are multiples of each other, representing the same line. If either Dx or Dy is non-zero, the equations represent distinct parallel lines that never meet. This method extends naturally to larger systems — the same determinant-based logic works for 3x3, 4x4, and nxn systems, though computational complexity grows factorially with matrix size. Cramer's rule is particularly valuable in theoretical contexts and for small systems because it provides explicit formulas without requiring Gaussian elimination or matrix inversion. In practice, the rule is most efficient for 2x2 and 3x3 systems, while larger systems are typically solved using numerical methods like LU decomposition or iterative techniques such as Gauss-Seidel. Beyond pure mathematics, solving systems of equations underpins finite element analysis in engineering, economic equilibrium models, chemical reaction balancing, and network flow optimization — any domain where multiple constraints must be satisfied simultaneously.`,
    faqs: [
      {
        question: 'What is the geometric meaning of determinant D = 0?',
        answer: 'When D = 0, the two lines have the same slope. They are either parallel (if the constants differ, giving no solution) or the same line (if the equations are multiples, giving infinite solutions). The two equations are not independent — one is a linear combination of the other. This is why checking D alone is not enough; you must also check Dx and Dy to distinguish parallel from coincident lines.',
      },
      {
        question: 'Can Cramer\'s rule solve systems with three or more variables?',
        answer: 'Yes, Cramer\'s rule extends to any n×n system using higher-order determinants. For a 3×3 system, you compute four 3×3 determinants (D, Dx, Dy, Dz). However, the computational cost grows factorially — calculating a 10×10 determinant requires millions of operations. For large systems, Gaussian elimination, LU decomposition, or iterative methods are far more efficient.',
      },
      {
        question: 'What if my coefficients are fractions or decimals?',
        answer: 'Cramer\'s rule works with any real numbers — integers, fractions, decimals, or irrational numbers. The calculator handles all real number coefficients. If you have fractions, you can enter them as decimals (e.g., 1/3 as 0.333). The formula x = Dx/D and y = Dy/D works the same way regardless of the coefficient type.',
      },
      {
        question: 'How do I check if my solution is correct?',
        answer: 'Substitute the computed x and y values back into both original equations. For the solution to be correct, both equations must be satisfied (the left side must equal the right side within rounding tolerance). The calculator\'s step-by-step work shows the full computation path, making it easy to verify each step independently.',
      },
      {
        question: 'What happens if the coefficients are very large or very small numbers?',
        answer: 'Cramer\'s rule works mathematically for any real numbers, but with extreme values, floating-point precision can affect accuracy. Very large coefficients (e.g., 10^12) or very small ones (e.g., 10^-12) may introduce rounding errors in the determinant calculation. For better precision with extreme values, consider scaling all coefficients by a common factor before entering them. Systems with ill-conditioned matrices (where the determinant is very close to zero) are particularly sensitive to rounding errors — a small change in coefficients can produce a very different solution. In such cases, numerical methods with pivoting (like Gaussian elimination with partial pivoting) may give more reliable results than Cramer\'s rule.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah and Tom bought snacks at a school fundraiser. Sarah bought 2 bags of chips (x) and 3 bottles of water (y) for $7. Tom bought 5 bags of chips and noticed the cashier gave him a $2 discount on his water, paying $3 total. Find the price of one bag of chips and one bottle of water.',
        inputs: { a1: '2', b1: '3', c1: '7', a2: '5', b2: '-2', c2: '3' },
        result: 'x = $1.21 (chips), y = $1.53 (water); D = -19, unique solution',
        insight: 'The system 2x + 3y = 7, 5x - 2y = 3 gives D = 2(-2) - 5(3) = -4 - 15 = -19. Dx = 7(-2) - 3(3) = -14 - 9 = -23. Dy = 2(3) - 5(7) = 6 - 35 = -29. Thus x = -23/-19 = $1.21 per bag of chips, y = -29/-19 = $1.53 per water bottle. With a negative determinant and negative numerators, the signs cancel — both items have positive prices as expected.',
      },
      {
        scenario: 'An engineer is designing a truss structure with two tension members. The forces must satisfy x + y = 500 (total load) and 2x - y = 100 (moment equilibrium). Solve for the tension in each member.',
        inputs: { a1: '1', b1: '1', c1: '500', a2: '2', b2: '-1', c2: '100' },
        result: 'x = 200 N, y = 300 N; D = -3, unique solution',
        insight: 'The system has D = 1(-1) - 2(1) = -3 (nonzero, so unique solution exists). Dx = 500(-1) - 100(1) = -600. Dy = 1(100) - 2(500) = -900. Therefore x = -600/-3 = 200 N (tension in member 1), y = -900/-3 = 300 N (tension in member 2). The negative signs in the intermediate steps cancel, yielding positive forces as physically expected.',
      },
    ],
    proTips: [
      'Always check the determinant D first — if D = 0, stop and classify the system as dependent or inconsistent before attempting to solve for x and y.',
      'When entering negative coefficients, double-check the signs. A sign error in even one coefficient completely changes the geometric interpretation and solution.',
      'For decimal coefficients, enter them with at least 3 decimal places of precision. The calculator uses floating-point arithmetic, so rounding at entry can compound.',
      'To verify a solution manually, plug x and y back into BOTH original equations independently — satisfying just one equation is not enough.',
      'Use the step-by-step work output to understand Cramer\'s rule deeply. Each step shows how determinants are computed from the coefficients, which helps when solving by hand on exams.',
      'For systems that appear to have D very close to zero (e.g., D = 0.0001), the system is ill-conditioned. The lines are nearly parallel, and small measurement errors in coefficients can dramatically shift the intersection point.',
    ],
    limitations: [
      'Cramer\'s rule is not recommended for systems larger than 3x3 due to the factorial growth in determinant computation cost. Use Gaussian elimination or LU decomposition for 4x4 and larger systems.',
      'For nearly-singular systems where the determinant is very close to zero, floating-point errors can produce unreliable results — consider using iterative refinement or higher-precision arithmetic.',
      'The calculator uses standard double-precision floating-point (about 15-16 significant digits), so results for extremely large or small coefficients may lose accuracy.',
      'This tool solves linear systems only; it does not handle nonlinear systems, inequalities, or systems with more equations than unknowns (overdetermined systems). For overdetermined systems, use least-squares regression instead.',
    ],
    citations: [
      { source: 'Wolfram MathWorld — Cramer\'s Rule', url: 'https://mathworld.wolfram.com/CramersRule.html' },
      { source: 'Khan Academy — Solving Systems with Cramer\'s Rule', url: 'https://www.khanacademy.org/math/algebra-home/alg-system-of-equations' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">System of 2 Linear Equations — Cramer\'s Rule</text><rect x="20" y="46" width="440" height="80" rx="10" fill="var(--svg-f0f9ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="240" y="68" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e40af)">General Form</text><text x="240" y="90" text-anchor="middle" font-size="13" fill="var(--svg-1e40af)">a₁x + b₁y = c₁</text><text x="240" y="112" text-anchor="middle" font-size="13" fill="var(--svg-1e40af)">a₂x + b₂y = c₂</text><rect x="20" y="138" width="440" height="88" rx="10" fill="var(--svg-fefce8)" stroke="var(--svg-eab308)" stroke-width="1.5"/><text x="240" y="158" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-854d0e)">Cramer\'s Rule Determinants</text><text x="240" y="178" text-anchor="middle" font-size="12" fill="var(--svg-713f12)">D = a₁b₂ &minus; a₂b₁</text><text x="240" y="196" text-anchor="middle" font-size="12" fill="var(--svg-713f12)">Dx = c₁b₂ &minus; c₂b₁ &nbsp;&nbsp; Dy = a₁c₂ &minus; a₂c₁</text><text x="240" y="218" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-b45309)">D &ne; 0: x = Dx/D, y = Dy/D</text><rect x="30" y="240" width="130" height="50" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="95" y="266" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--svg-15803d)">D &ne; 0</text><text x="95" y="282" text-anchor="middle" font-size="10" fill="var(--svg-166534)">Unique solution</text><rect x="175" y="240" width="130" height="50" rx="8" fill="var(--svg-fef9c3)" stroke="var(--svg-eab308)" stroke-width="1.5"/><text x="240" y="258" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-854d0e)">D = 0</text><text x="240" y="274" text-anchor="middle" font-size="11" fill="var(--svg-713f12)">Dx = Dy = 0</text><text x="240" y="286" text-anchor="middle" font-size="10" fill="var(--svg-713f12)">Infinite solutions</text><rect x="320" y="240" width="130" height="50" rx="8" fill="var(--svg-fce7f3)" stroke="var(--svg-ec4899)" stroke-width="1.5"/><text x="385" y="258" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-be185d)">D = 0</text><text x="385" y="274" text-anchor="middle" font-size="11" fill="var(--svg-9d174d)">Dx &ne; 0 or Dy &ne; 0</text><text x="385" y="286" text-anchor="middle" font-size="10" fill="var(--svg-9d174d)">No solution</text><text x="240" y="322" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-6b7280)">Geometric Interpretation</text><text x="240" y="340" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">D &ne; 0: lines intersect at one point | D = 0, Dx=Dy=0: same line | D = 0, Dx/Dy &ne; 0: parallel lines</text><text x="240" y="356" text-anchor="middle" font-size="10" fill="var(--svg-94a3b8)">Equations are independent if D &ne; 0; dependent if D = 0</text></svg>',
      alt: 'Diagram of Cramer\'s rule for solving 2×2 systems of linear equations showing determinant calculations and the three possible cases',
      caption: 'Cramer\'s rule uses determinants D, Dx, and Dy to solve 2×2 linear systems. The sign of D determines if the solution is unique, infinite, or nonexistent, corresponding to intersecting, coincident, or parallel lines.',
    },
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SystemOfEquationsPanel, { values, results });
  },
};

export default systemOfEquationsConfig;
