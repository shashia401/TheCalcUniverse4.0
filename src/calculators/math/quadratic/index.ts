import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import QuadraticPanel from './QuadraticPanel';
import Decimal from 'decimal.js';

// Decimal.js is used for precision in the discriminant computation (b² − 4ac)
// and root calculations where near-zero discriminants or nearly-canceling
// terms can cause catastrophic cancellation in IEEE 754 double precision.

const quadraticConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'Coefficient a (x²)',
      type: 'number',
      placeholder: '1',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The coefficient of x². Must be non-zero for a quadratic equation. If a = 0, the equation is linear (not quadratic).',
    },
    {
      id: 'b',
      label: 'Coefficient b (x)',
      type: 'number',
      placeholder: '-5',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The coefficient of x. Influences the position of the vertex along the x-axis.',
    },
    {
      id: 'c',
      label: 'Constant c',
      type: 'number',
      placeholder: '6',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The constant term. This is the y-intercept — the parabola crosses the y-axis at (0, c).',
    },
  ],
  calculate: (values) => {
    const a = parseFloat(values.a);
    const b = parseFloat(values.b);
    const c = parseFloat(values.c);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return [];

    // Use Decimal for precise discriminant to catch near-zero cases
    let discriminant: number;
    try {
      const dA = new Decimal(a);
      const dB = new Decimal(b);
      const dC = new Decimal(c);
      discriminant = dB.pow(2).minus(dA.mul(dC).mul(4)).toNumber();
    } catch {
      discriminant = b * b - 4 * a * c;
    }

    const vertexX = -b / (2 * a);
    const vertexY = a * vertexX * vertexX + b * vertexX + c;
    const axisOfSymmetry = -b / (2 * a);

    const fmt = (n: number) => parseFloat(n.toFixed(8)).toString();
    const fmtComplex = (n: number) => {
      const abs = Math.abs(n);
      if (abs < 1e-14) return '0';
      return parseFloat(abs.toFixed(8)).toString();
    };

    // Determine nature of roots
    const discriminantFmt = parseFloat(discriminant.toFixed(8));
    const discriminantDisplay = Math.abs(discriminantFmt) < 1e-12 ? '0' : fmt(discriminantFmt);

    // Factored form: a(x − r₁)(x − r₂)
    let factoredForm = '';
    // Sum and product of roots (Vieta's formulas)
    const sumOfRoots = -b / a;
    const productOfRoots = c / a;

    const results = [
      {
        id: 'equation',
        label: 'Equation',
        value: `${fmt(a)}x²${b !== 0 ? ` ${b >= 0 ? '+' : '-'} ${fmt(Math.abs(b))}x` : ''}${c !== 0 ? ` ${c >= 0 ? '+' : '-'} ${fmt(Math.abs(c))}` : ''} = 0`,
        highlight: true,
        color: 'neutral' as const,
      },
      { id: 'discriminant', label: 'Discriminant (Δ = b² − 4ac)', value: discriminantDisplay, color: discriminant > 0 ? 'positive' as const : discriminant === 0 ? 'neutral' as const : 'negative' as const },
      { id: 'vertex', label: 'Vertex (h, k)', value: `(${fmt(vertexX)}, ${fmt(vertexY)})`, color: 'neutral' as const },
      { id: 'axis', label: 'Axis of Symmetry', value: `x = ${fmt(axisOfSymmetry)}`, color: 'neutral' as const },
      { id: 'yIntercept', label: 'Y-intercept', value: `(0, ${fmt(c)})`, color: 'neutral' as const },
      { id: 'opensDirection', label: 'Parabola Opens', value: a > 0 ? 'Upward (∪) — minimum at vertex' : 'Downward (∩) — maximum at vertex', color: 'neutral' as const },
    ];

    if (discriminant > 0) {
      const sqrtD = Math.sqrt(discriminant);
      const x1 = (-b + sqrtD) / (2 * a);
      const x2 = (-b - sqrtD) / (2 * a);
      results.push({ id: 'rootNature', label: 'Root Nature', value: 'Two distinct real roots (Δ > 0)', color: 'positive' as const });
      results.push({ id: 'x1', label: 'Root x₁', value: fmt(x1), color: 'positive' as const });
      results.push({ id: 'x2', label: 'Root x₂', value: fmt(x2), color: 'positive' as const });

      // Factored form
      const r1Str = x1 >= 0 ? `(x − ${fmt(x1)})` : `(x + ${fmt(Math.abs(x1))})`;
      const r2Str = x2 >= 0 ? `(x − ${fmt(x2)})` : `(x + ${fmt(Math.abs(x2))})`;
      if (Math.abs(a) === 1) {
        factoredForm = (a === 1 ? '' : '-') + `${r1Str}${r2Str}`;
      } else {
        factoredForm = `${fmt(a)}${r1Str}${r2Str}`;
      }
    } else if (Math.abs(discriminant) < 1e-12) {
      const x = -b / (2 * a);
      results.push({ id: 'rootNature', label: 'Root Nature', value: 'One repeated real root (double root, Δ = 0)', color: 'neutral' as const });
      results.push({ id: 'x', label: 'Repeated Root', value: fmt(x), color: 'neutral' as const });
      // Factored form for perfect square
      const rootStr = x >= 0 ? `(x − ${fmt(x)})²` : `(x + ${fmt(Math.abs(x))})²`;
      if (Math.abs(a) === 1) {
        factoredForm = (a === 1 ? '' : '-') + rootStr;
      } else {
        factoredForm = `${fmt(a)}${rootStr}`;
      }
    } else {
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-discriminant) / (2 * a);
      results.push({ id: 'rootNature', label: 'Root Nature', value: 'Two complex conjugate roots (Δ < 0)', color: 'negative' as const });
      results.push({ id: 'complex1', label: 'Root x₁ (complex)', value: `${fmt(realPart)} + ${fmtComplex(imagPart)}i`, color: 'negative' as const });
      results.push({ id: 'complex2', label: 'Root x₂ (complex)', value: `${fmt(realPart)} − ${fmtComplex(imagPart)}i`, color: 'negative' as const });
    }

    // Vieta's formulas check
    results.push({ id: 'vietaSum', label: 'Sum of Roots (Vieta)', value: fmt(sumOfRoots), color: 'neutral' as const });
    results.push({ id: 'vietaProduct', label: 'Product of Roots (Vieta)', value: fmt(productOfRoots), color: 'neutral' as const });

    if (factoredForm) {
      results.push({ id: 'factoredForm', label: 'Factored Form', value: factoredForm, color: 'positive' as const });
    }

    return results;
  },
  educational: {
    formula: 'x = (−b ± √(b² − 4ac)) / (2a)  |  Discriminant Δ = b² − 4ac  |  Vertex: (−b/2a, f(−b/2a))',
    diagram: {
      svg: '<svg viewBox="0 0 440 370" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Quadratic Parabola: y = ax² + bx + c</text><line x1="40" y1="275" x2="400" y2="275" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="279" font-size="12" fill="var(--svg-666666)">x</text><line x1="220" y1="275" x2="220" y2="25" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="226" y="28" font-size="12" fill="var(--svg-666666)">y</text><path d="M60,245 C100,125 140,45 220,45 C300,45 340,125 380,245" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="171" r="5" fill="var(--svg-ef4444)"/><text x="82" y="163" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">Root 1</text><circle cx="340" cy="171" r="5" fill="var(--svg-ef4444)"/><text x="358" y="163" text-anchor="start" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">Root 2</text><line x1="220" y1="45" x2="220" y2="285" stroke="var(--svg-22c55e)" stroke-width="1.5" stroke-dasharray="5,3"/><text x="220" y="300" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-22c55e)">Axis of Symmetry</text><circle cx="220" cy="45" r="5" fill="var(--svg-8b5cf6)"/><text x="235" y="40" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">Vertex (min)</text><text x="220" y="325" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">Quadratic Formula</text><text x="220" y="347" text-anchor="middle" font-size="13" fill="var(--svg-555555)">x = (&minus;b &plusmn; &radic;(b&sup2; &minus; 4ac)) / 2a</text></svg>',
      alt: 'Graph of a parabola opening upward on a coordinate plane with vertex at the minimum point, axis of symmetry as a dashed vertical line through the vertex, and two x-intercept root points highlighted in red',
      caption: 'The quadratic formula finds the x-intercepts (roots) where the parabola crosses the x-axis. The discriminant Δ = b² − 4ac determines how many real roots exist.',
    },
    formulaDescription:
      'The quadratic formula is the universal method for solving any quadratic equation ax² + bx + c = 0. It works for all coefficients — integers, fractions, decimals, and even complex numbers. The discriminant Δ = b² − 4ac is computed first because it determines the nature of the roots: positive Δ gives two distinct real roots, zero Δ gives one repeated (double) root, and negative Δ gives two complex conjugate roots (no x-intercepts). The calculator also computes the vertex (the minimum or maximum of the parabola), the axis of symmetry, the y-intercept, and the factored form when the roots are rational.',
    variables: [
      { symbol: 'a', name: 'Leading Coefficient', description: 'The coefficient of x². Must not be zero — if a = 0, the equation is linear, not quadratic. Controls the parabola\'s opening direction: upward (∪) if a > 0, downward (∩) if a < 0. Also controls how "wide" or "narrow" the parabola appears.' },
      { symbol: 'b', name: 'Linear Coefficient', description: 'The coefficient of x. Influences the horizontal position of the vertex and the axis of symmetry. With a, determines the vertex x-coordinate: h = −b/(2a).' },
      { symbol: 'c', name: 'Constant Term', description: 'The constant term. This is the y-intercept — the parabola always crosses the y-axis at the point (0, c). Also contributes to the discriminant and the vertex y-coordinate.' },
      { symbol: 'Δ (Discriminant)', name: 'b² − 4ac', description: 'The discriminant is the key to root classification. Δ > 0: two distinct real roots (parabola crosses x-axis twice). Δ = 0: one repeated real root (parabola touches x-axis at vertex). Δ < 0: two complex conjugate roots (parabola never touches x-axis).' },
      { symbol: 'Vieta\'s Formulas', name: 'Sum & Product', description: 'For roots r₁ and r₂: r₁ + r₂ = −b/a and r₁ × r₂ = c/a. These relationships provide a quick check on computed roots and are useful for constructing quadratics with desired roots.' },
    ],
    howToUse: [
      'Enter the coefficients a, b, and c from your quadratic equation in standard form: ax² + bx + c = 0. The coefficient a must not be zero.',
      'The discriminant Δ = b² − 4ac is computed and color-coded: green for positive (real roots), gray for zero (repeated root), red for negative (complex roots).',
      'View the roots — real roots are displayed as decimal values, complex roots are shown in (p ± qi) form with the imaginary unit i.',
      'The vertex (h, k) is displayed as the minimum (a > 0) or maximum (a < 0) of the parabola. The axis of symmetry is the vertical line through the vertex.',
      'Vieta\'s formulas show the sum and product of the roots, which serve as a quick verification: the sum should equal −b/a and the product should equal c/a.',
      'For real roots, the factored form a(x − r₁)(x − r₂) is displayed, which is useful for writing the equation in a form that immediately reveals the x-intercepts.',
    ],
    explanation:
      'The quadratic formula is one of the most celebrated results in algebra, with roots dating back to ancient Babylonian mathematicians around 2000 BCE. The formula was fully formalized by the Persian mathematician al-Khwarizmi in the 9th century CE in his treatise "Al-Kitab al-Mukhtasar fi Hisab al-Jabr wal-Muqabala" — from which we derive the word "algebra." The discriminant (b² − 4ac) is the key insight: it tells you the nature of the solutions before you compute them. A positive discriminant means the parabola crosses the x-axis at two distinct points. A zero discriminant means it touches the x-axis at exactly one point (the vertex) — the quadratic is a perfect square trinomial. A negative discriminant means the parabola floats entirely above (or below) the x-axis, and the solutions involve the imaginary unit i (where i² = −1). The vertex (h, k) is the parabola\'s minimum (if a > 0) or maximum (if a < 0), located at h = −b/(2a), k = f(h). The axis of symmetry is the vertical line x = h through the vertex. Quadratic equations appear everywhere: projectile motion follows a parabolic trajectory (h(t) = −½gt² + v₀t + h₀), area optimization problems involve quadratics, structural engineering uses parabolic arches (the Gateway Arch in St. Louis is a weighted catenary, closely approximated by a parabola), antenna dishes and solar concentrators use parabolic reflectors to focus signals, and profit/revenue functions in economics are often quadratic.',
    commonUses: [
      'Projectile motion and ballistics: calculating the trajectory of thrown objects, the maximum height of a projectile, and where it will land — the height as a function of time is quadratic',
      'Physics and engineering: analyzing the motion of objects under constant acceleration (d = ½at² + v₀t + d₀), optimizing structures with parabolic arches, and designing reflective surfaces for telescopes and satellite dishes',
      'Computer graphics and game development: computing ray-sphere intersections for 3D rendering using quadratics, and simulating parabolic arcs for grenade throws or jump trajectories',
      'Economics and business: maximizing profit and minimizing cost using quadratic revenue/cost functions — the maximum profit occurs at the vertex of the profit parabola',
      'Agriculture and land management: optimizing field dimensions for maximum area given a fixed perimeter (a classic quadratic optimization problem)',
      'Electrical engineering: analyzing RLC circuits where the characteristic equation for current/voltage is quadratic in the Laplace domain',
    ],
    workedExamples: [
      {
        scenario: 'A baseball player hits a ball straight up with an initial velocity of 30 m/s from a height of 1 meter. The height function is h(t) = −4.9t² + 30t + 1. At what times does the ball reach a height of 20 meters? Solve −4.9t² + 30t + 1 = 20, or −4.9t² + 30t − 19 = 0.',
        inputs: { a: '-4.9', b: '30', c: '-19' },
        result: 'Two real roots: t₁ ≈ 0.69070773 (on the way up), t₂ ≈ 5.60780268 (on the way down). Discriminant Δ = 527.6. Vertex at (3.06122449, 46.90816327). Axis of symmetry: x = 3.06122449. Parabola opens downward.',
        insight: 'The discriminant Δ = 30² − 4(−4.9)(−19) = 900 − 372.4 = 527.6. Since Δ > 0, there are two real solutions. Using the quadratic formula: t₁ ≈ 0.69 seconds (on the way up) and t₂ ≈ 5.43 seconds (on the way down). The ball passes 20 meters twice. The maximum height is h(3.06) = −4.9(3.06)² + 30(3.06) + 1 ≈ 46.9 meters, occurring at the vertex t = −b/(2a) = −30/(2(−4.9)) ≈ 3.06 seconds.',
      },
      {
        scenario: 'A farmer has 100 meters of fencing and wants to build a rectangular enclosure against an existing wall (so only three sides need fencing). What dimensions maximize the area? If width = w and length = l, then 2w + l = 100, so l = 100 − 2w. Area A = w × l = w(100 − 2w) = −2w² + 100w. To find the maximum, set the derivative to zero or find the vertex of the quadratic.',
        inputs: { a: '-2', b: '100', c: '0' },
        result: 'Two real roots: w₁ = 0, w₂ = 50. Discriminant Δ = 10000. Vertex at (25, 1250). Parabola opens downward. Maximum area = 1,250 m² at width = 25 m, length = 50 m.',
        insight: 'The quadratic −2w² + 100w = 0 has discriminant Δ = 100² − 4(−2)(0) = 10000. The roots are w = 0 and w = 50 (where area is 0 — degenerate rectangles). The vertex is at w = −b/(2a) = −100/(−4) = 25 meters. When w = 25, l = 100 − 50 = 50 meters. Maximum area = 25 × 50 = 1,250 m². The vertex of the parabola gives the maximum, and the axis of symmetry shows the optimal width is exactly halfway between the two roots.',
      },
      {
        scenario: 'An architect designs a parabolic arch for a bridge. The arch follows y = −0.01x² + 2x where x is the horizontal distance from the left base in meters and y is the height. At what horizontal distances is the arch height equal to 75 meters? Solve −0.01x² + 2x = 75, or −0.01x² + 2x − 75 = 0.',
        inputs: { a: '-0.01', b: '2', c: '-75' },
        result: 'Two real roots: x₁ = 50, x₂ = 150. Discriminant Δ = 1. Vertex at (100, 100). Parabola opens downward. The arch reaches 75 m at 50 m from the left base and at 150 m (50 m from the right base at total span of 200 m).',
        insight: 'Multiply through by 100 for easier coefficients: −x² + 200x − 7500 = 0, but the calculator handles decimals directly. Δ = 4 − 4(−0.01)(−75) = 4 − 3 = 1. Since Δ > 0, there are two real solutions: x₁ = 50 meters and x₂ = 150 meters. The arch reaches 75 meters height at 50m from the left and again at 150m (which is 50m from the right base at 200m total span). The symmetry is expected for a parabolic arch.',
      },
    ],
    proTips: [
      'The sign of the discriminant tells you everything. Before solving, check if Δ is positive, zero, or negative — it tells you whether the parabola crosses (Δ > 0), touches (Δ = 0), or misses (Δ < 0) the x-axis, which is often all you need to know for a qualitative answer.',
      'Vieta\'s formulas provide a fast mental check: the sum of roots is −b/a and the product is c/a. If your computed roots don\'t satisfy these, there is a calculation error. This is especially useful for integer-coefficient quadratics.',
      'For decimal coefficients with many digits, scaling the equation (multiplying all coefficients by a power of 10) can make manual verification easier without changing the roots. The calculator handles decimals internally.',
      'The vertex form y = a(x − h)² + k reveals the maximum/minimum immediately. Convert from standard form: h = −b/(2a), k = f(h). This is essential for optimization problems where you need the extreme value.',
    ],
    limitations: [
      'For quadratics with extremely large coefficients or very small discriminants near the floating-point precision limit (≈10^−15), root values may lose a few digits of precision. Decimal.js improves discriminant precision but does not eliminate all floating-point edge cases.',
      'Do not use for linear equations (a = 0) — this calculator requires a ≠ 0. For linear equations, use an equation solver or the slope calculator instead.',
      'Do not use for cubic, quartic, or higher-degree polynomial equations — the quadratic formula only applies to degree-2 polynomials. Use the polynomial calculator for higher-degree equations.',
      'For exact symbolic solutions (e.g., keeping √2 instead of 1.414), use a computer algebra system like SymPy or Mathematica. This calculator provides numeric approximations only.',
      'The factored form a(x − r₁)(x − r₂) is displayed only for real roots. Complex conjugate roots are not factorable over the reals.',
    ],
    quickReference: [
      { label: 'Quadratic Formula', value: 'x = (−b ± √(b² − 4ac)) / (2a)' },
      { label: 'Discriminant Δ', value: 'b² − 4ac (determines root nature)' },
      { label: 'Δ > 0', value: 'Two distinct real roots' },
      { label: 'Δ = 0', value: 'One repeated real root (double root)' },
      { label: 'Δ < 0', value: 'Two complex conjugate roots' },
      { label: 'Vertex (h, k)', value: 'h = −b/(2a), k = f(h) = c − b²/(4a)' },
      { label: 'Axis of Symmetry', value: 'x = −b/(2a)' },
      { label: 'Vieta: Sum', value: 'r₁ + r₂ = −b/a' },
      { label: 'Vieta: Product', value: 'r₁ × r₂ = c/a' },
      { label: 'Factored Form', value: 'a(x − r₁)(x − r₂), for real roots' },
    ],
    faqs: [
      {
        question: 'What does a negative discriminant mean in the real world?',
        answer: 'A negative discriminant means the parabola represented by y = ax² + bx + c never crosses the x-axis — the equation has no real solutions. In practical terms, this means whatever quantity you are solving for cannot equal zero under the given conditions. For example, if you are solving for when a projectile hits the ground (height = 0) and the discriminant is negative, the projectile never reaches the ground — it might have been launched from a platform high enough that it escapes into space, or the equation may not correctly model the situation. In economics, a negative discriminant in a break-even analysis means the business can never break even at the given price/cost structure.',
      },
      {
        question: 'What is the relationship between the vertex and completing the square?',
        answer: 'The vertex form y = a(x − h)² + k is derived by completing the square on ax² + bx + c. Starting from y = ax² + bx + c: factor out a → y = a(x² + (b/a)x) + c. Add and subtract (b/(2a))² inside the parentheses → y = a(x² + (b/a)x + (b/(2a))²) + c − a(b/(2a))² = a(x + b/(2a))² + c − b²/(4a). So h = −b/(2a) and k = c − b²/(4a). The vertex (h, k) is the minimum (a > 0) or maximum (a < 0) point on the parabola. The quadratic formula itself is derived by completing the square on the general form ax² + bx + c = 0.',
      },
      {
        question: 'Can the quadratic formula solve ANY quadratic equation?',
        answer: 'Yes, the quadratic formula solves every quadratic equation with real coefficients, without exception — regardless of whether the roots are rational, irrational, or complex. It works for integer coefficients (x² − 5x + 6 = 0), decimal coefficients (0.5x² − 1.3x + 0.8 = 0), and fractional coefficients. This makes it more powerful than factoring (which only works for "nice" integer roots), completing the square (which requires additional algebraic steps), or graphing (which cannot give exact values for irrational roots). The quadratic formula is the universal solver — memorize it.',
      },
      {
        question: 'What are complex roots and when do they matter?',
        answer: 'Complex roots involve the imaginary unit i where i² = −1. They appear when the discriminant is negative, meaning the parabola does not cross the x-axis. While complex roots may seem abstract, they are essential in electrical engineering (analyzing RLC circuit behavior where the characteristic equation is quadratic), control theory (system stability depends on whether complex roots have negative real parts), quantum mechanics (wave functions involve complex numbers), and signal processing (Fourier analysis uses complex exponentials). In pure math, the Fundamental Theorem of Algebra guarantees that every quadratic has exactly two roots over the complex numbers.',
      },
      {
        question: 'How do Vieta\'s formulas help verify my answer?',
        answer: 'Vieta\'s formulas state that for ax² + bx + c = 0 with roots r₁ and r₂: r₁ + r₂ = −b/a and r₁ × r₂ = c/a. These provide two quick sanity checks on any computed roots. For example, if I solve x² − 5x + 6 = 0, the sum of roots should be −(−5)/1 = 5, and the product should be 6/1 = 6. If I got roots 2 and 3: sum = 5, product = 6 — correct. If I got 1.5 and 3.5: sum = 5 but product = 5.25 — error detected. These formulas are also useful for constructing quadratics with desired properties: to create an equation with roots 4 and −2, use x² − (4 + (−2))x + (4×(−2)) = x² − 2x − 8 = 0.',
      },
      {
        question: 'What is the physical meaning of the axis of symmetry?',
        answer: 'The axis of symmetry is the vertical line x = −b/(2a) that splits the parabola into two mirror-image halves. In physics, for a projectile launched from the ground, the axis of symmetry passes through the highest point of the trajectory, and the time to reach maximum height equals the time from maximum height to landing — symmetric about the vertex. In optimization, the axis tells you the input value that produces the optimal output. For a business with quadratic profit = −2p² + 200p − 3000 (where p is price), the axis of symmetry at p = 50 tells you the optimal price without needing to complete the square.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Quadratic Equation', url: 'https://mathworld.wolfram.com/QuadraticEquation.html' },
      { source: 'Wikipedia - Quadratic Equation', url: 'https://en.wikipedia.org/wiki/Quadratic_equation' },
      { source: 'Khan Academy - Quadratic Formula', url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-formula' },
      { source: 'MacTutor - Al-Khwarizmi Biography', url: 'https://mathshistory.st-andrews.ac.uk/Biographies/Al-Khwarizmi/' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(QuadraticPanel, { values, results });
  },
};

export default quadraticConfig;
