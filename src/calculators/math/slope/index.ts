import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SlopePanel from './SlopePanel';
import {
  Frac,
  addFrac,
  divFrac,
  fracToNumber,
  gcdBig,
  lcmBig,
  mulFrac,
  parseDecimalExact,
  subFrac,
} from '../../../utils/rational';

const absF = (f: Frac): Frac => ({ n: f.n < 0n ? -f.n : f.n, d: f.d });

/** Four-decimal display, but keep significant digits for tiny values (5.67e-7 must not print as "0"). */
function fmtNum(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return Math.abs(n) >= 1e-3 ? parseFloat(n.toFixed(4)).toString() : parseFloat(n.toPrecision(4)).toString();
}

/** Display an exact fraction: integers print in full (BigInt), others to 4 decimals. */
const fmt = (f: Frac): string => (f.d === 1n ? f.n.toString() : fmtNum(fracToNumber(f)));

const slopeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'x1',
      label: 'X₁',
      type: 'number',
      placeholder: '2',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'X-coordinate of first point. Supports decimals and negative values.',
    },
    {
      id: 'y1',
      label: 'Y₁',
      type: 'number',
      placeholder: '3',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Y-coordinate of first point. Supports decimals and negative values.',
    },
    {
      id: 'x2',
      label: 'X₂',
      type: 'number',
      placeholder: '5',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'X-coordinate of second point. Supports decimals and negative values.',
    },
    {
      id: 'y2',
      label: 'Y₂',
      type: 'number',
      placeholder: '7',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Y-coordinate of second point. Supports decimals and negative values.',
    },
    {
      id: 'outputFormat',
      label: 'Output Detail Level',
      type: 'select',
      required: false,
      defaultValue: 'standard',
      helpText: 'Standard shows slope, direction, and all three equation forms. Compact shows only the slope and distance between points.',
      options: [
        { label: 'Standard (All Forms + Equations)', value: 'standard' },
        { label: 'Compact (Slope + Distance Only)', value: 'compact' },
      ],
    },
    {
      id: 'angleDisplay',
      label: 'Angle Display',
      type: 'select',
      required: false,
      helpText: 'Display the slope angle using degrees (imperial standard) or radians (metric/mathematical standard). Useful for construction, physics, and trigonometry.',
      options: [
        { label: 'Degrees (°)', value: 'degrees' },
        { label: 'Radians (rad)', value: 'radians' },
      ],
      showWhen: (values) => values.outputFormat === 'standard',
    },
  ],
  calculate: (values) => {
    // Exact decimal parse (0.1 is exactly 1/10, "5abc" is rejected). Slope, intercept and every equation
    // are computed on exact fractions, so 0.1→0.4 / 0.2→0.5 is exactly 1 (not 0.9999999999999998).
    const X1 = parseDecimalExact(values.x1);
    const Y1 = parseDecimalExact(values.y1);
    const X2 = parseDecimalExact(values.x2);
    const Y2 = parseDecimalExact(values.y2);
    if (!X1 || !Y1 || !X2 || !Y2) return [];

    const DX = subFrac(X2, X1);
    const DY = subFrac(Y2, Y1);

    if (DX.n === 0n && DY.n === 0n) {
      return [
        {
          id: 'error',
          label: 'Error',
          value: 'The two points are identical, so they do not define a line. Enter two different points.',
          color: 'negative' as const,
        },
      ];
    }

    const isVertical = DX.n === 0n;
    const M = isVertical ? null : divFrac(DY, DX); // exact slope
    const B = M ? subFrac(Y1, mulFrac(M, X1)) : null; // exact y-intercept
    const m = M ? fracToNumber(M) : Infinity;

    const direction = !M ? 'vertical' : M.n > 0n ? 'increasing (positive slope)' : M.n < 0n ? 'decreasing (negative slope)' : 'horizontal (zero slope)';

    const showCompact = values.outputFormat === 'compact';
    const angleUnit = values.angleDisplay || 'degrees';
    // A vertical line makes a 90° (π/2 rad) angle with the x-axis.
    const angleRad = isVertical ? Math.PI / 2 : Math.atan(m);
    const angleLabel = angleUnit === 'degrees' ? `${((angleRad * 180) / Math.PI).toFixed(2)}°` : `${angleRad.toFixed(4)} rad`;

    // Line equations
    let slopeIntercept = '';
    let pointSlope = '';
    let standardForm = '';

    if (!M || !B) {
      slopeIntercept = `x = ${fmt(X1)} (vertical line)`;
      pointSlope = `x = ${fmt(X1)}`;
      standardForm = `x = ${fmt(X1)}`;
    } else {
      const isOne = M.n === 1n && M.d === 1n;
      const isMinusOne = M.n === -1n && M.d === 1n;
      const mxStr = isOne ? 'x' : isMinusOne ? '-x' : `${fmt(M)}x`;
      const bStr = B.n > 0n ? ` + ${fmt(B)}` : B.n < 0n ? ` − ${fmt(absF(B))}` : '';
      // A horizontal line is just y = b (no "0x", no stray "+").
      slopeIntercept = M.n === 0n ? `y = ${fmt(B)}` : `y = ${mxStr}${bStr}`;

      const y1Str = Y1.n >= 0n ? `y − ${fmt(Y1)}` : `y + ${fmt(absF(Y1))}`;
      const x1Str = X1.n >= 0n ? `(x − ${fmt(X1)})` : `(x + ${fmt(absF(X1))})`;
      pointSlope = M.n === 0n ? `${y1Str} = 0` : `${y1Str} = ${isOne ? '' : isMinusOne ? '−' : fmt(M)}${x1Str}`;

      // Ax + By = C with A = −(y₂−y₁), B = x₂−x₁, C = A·x₁ + B·y₁, scaled to coprime integers
      // and signed so that A > 0 (or A = 0 and B > 0) — the textbook standard form.
      const A = { n: -DY.n, d: DY.d };
      const C = addFrac(mulFrac(A, X1), mulFrac(DX, Y1));
      const L = lcmBig(lcmBig(A.d, DX.d), C.d);
      let ia = A.n * (L / A.d);
      let ib = DX.n * (L / DX.d);
      let ic = C.n * (L / C.d);
      const g = gcdBig(gcdBig(ia, ib), ic) || 1n;
      ia /= g;
      ib /= g;
      ic /= g;
      if (ia < 0n || (ia === 0n && ib < 0n)) {
        ia = -ia;
        ib = -ib;
        ic = -ic;
      }
      const abs = (v: bigint) => (v < 0n ? -v : v);
      const term = (c: bigint, v: string) => (abs(c) === 1n ? v : `${abs(c)}${v}`);
      let lhs = ia !== 0n ? term(ia, 'x') : '';
      if (ib !== 0n) lhs += `${lhs ? (ib > 0n ? ' + ' : ' − ') : ''}${term(ib, 'y')}`;
      standardForm = `${lhs} = ${ic < 0n ? '−' : ''}${abs(ic)}`;
    }

    const distance = Math.hypot(fracToNumber(DX), fracToNumber(DY));
    const half = { n: 1n, d: 2n };
    const midX = mulFrac(addFrac(X1, X2), half);
    const midY = mulFrac(addFrac(Y1, Y2), half);

    const results: any[] = [
      {
        id: 'slope',
        label: 'Slope (m)',
        value: !M ? 'Undefined (vertical)' : fmt(M),
        highlight: true,
        color: !M ? 'negative' as const : M.n > 0n ? 'positive' as const : M.n < 0n ? 'negative' as const : 'neutral' as const,
      },
      { id: 'slopeFraction', label: 'Slope as Fraction', value: !M ? 'undefined' : `${M.n}/${M.d}`, color: 'neutral' as const },
      { id: 'direction', label: 'Direction', value: direction, color: 'neutral' as const },
      { id: 'distance', label: 'Distance Between Points', value: fmtNum(distance), color: 'neutral' as const },
    ];

    if (!showCompact) {
      results.push(
        { id: 'slopeIntercept', label: 'Slope-Intercept Form', value: slopeIntercept, color: 'neutral' as const },
        { id: 'pointSlope', label: 'Point-Slope Form', value: pointSlope, color: 'neutral' as const },
        { id: 'standardForm', label: 'Standard Form', value: standardForm, color: 'neutral' as const },
        { id: 'yIntercept', label: 'Y-Intercept', value: B ? `(0, ${fmt(B)})` : X1.n === 0n ? 'every point (the line is the y-axis)' : 'none', color: 'neutral' as const },
        { id: 'angle', label: `Angle from Horizontal (${angleUnit === 'degrees' ? 'degrees' : 'radians'})`, value: angleLabel, color: 'neutral' as const },
        { id: 'midpoint', label: 'Midpoint', value: `(${fmt(midX)}, ${fmt(midY)})`, color: 'neutral' as const },
      );
    }

    return results;
  },
  explainSteps: (values) => {
    const X1 = parseDecimalExact(values.x1);
    const Y1 = parseDecimalExact(values.y1);
    const X2 = parseDecimalExact(values.x2);
    const Y2 = parseDecimalExact(values.y2);
    if (!X1 || !Y1 || !X2 || !Y2) return [];
    const DX = subFrac(X2, X1);
    const DY = subFrac(Y2, Y1);
    if (DX.n === 0n && DY.n === 0n) return [];
    const p = (f: Frac) => (f.n < 0n ? `(${fmt(f)})` : fmt(f));
    const M = DX.n === 0n ? null : divFrac(DY, DX);
    return [
      { label: 'Find the rise (change in y)', expr: `y₂ − y₁ = ${fmt(Y2)} − ${p(Y1)} = ${fmt(DY)}` },
      { label: 'Find the run (change in x)', expr: `x₂ − x₁ = ${fmt(X2)} − ${p(X1)} = ${fmt(DX)}` },
      {
        label: 'Divide the rise by the run',
        expr: M ? `m = ${fmt(DY)} ÷ ${fmt(DX)} = ${fmt(M)}` : `m = ${fmt(DY)} ÷ 0 is undefined (vertical line)`,
        note: !M
          ? 'The run is 0, and you cannot divide by zero, so a vertical line has no slope.'
          : M.n > 0n
            ? 'A positive slope means the line rises as x increases.'
            : M.n < 0n
              ? 'A negative slope means the line falls as x increases.'
              : 'A slope of 0 means the line is horizontal.',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SlopePanel, { values, results });
  },
  educational: {
    formula: 'm = (y₂ − y₁) / (x₂ − x₁) | y = mx + b | y − y₁ = m(x − x₁) | Ax + By = C',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Slope of a Line</text><line x1="40" y1="310" x2="400" y2="310" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="314" font-size="12" fill="var(--svg-666666)">x</text><line x1="220" y1="310" x2="220" y2="30" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="226" y="28" font-size="12" fill="var(--svg-666666)">y</text><line x1="60" y1="285" x2="380" y2="45" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><circle cx="120" cy="238" r="5" fill="var(--svg-ef4444)"/><text x="110" y="228" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">(x₁, y₁)</text><circle cx="320" cy="95" r="5" fill="var(--svg-ef4444)"/><text x="310" y="85" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">(x₂, y₂)</text><line x1="120" y1="238" x2="320" y2="238" stroke="var(--svg-22c55e)" stroke-width="2" stroke-dasharray="6,3"/><text x="220" y="255" text-anchor="middle" font-size="13" fill="var(--svg-22c55e)" font-weight="bold">Run = x₂ − x₁</text><line x1="320" y1="238" x2="320" y2="95" stroke="var(--svg-8b5cf6)" stroke-width="2" stroke-dasharray="6,3"/><text x="335" y="172" text-anchor="start" font-size="13" fill="var(--svg-8b5cf6)" font-weight="bold">Rise = y₂ − y₁</text><text x="220" y="285" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Slope m = Rise / Run = (y₂−y₁)/(x₂−x₁)</text></svg>',
      alt: 'Coordinate plane with a line passing through two labeled points, showing the rise (vertical change) and run (horizontal change)',
      caption: 'The slope of a line is the ratio of vertical change (rise) to horizontal change (run)',
    },
    formulaDescription:
      'The slope formula measures the rate of change between two points on a line. Divide the difference in y-coordinates (rise) by the difference in x-coordinates (run) to get the slope m. Slope-intercept form (y = mx + b) is the most intuitive representation — m tells you the steepness and b tells you where the line crosses the y-axis at (0, b). Point-slope form (y − y₁ = m(x − x₁)) is particularly useful when you know one point on the line and the slope but may not know the y-intercept. Standard form (Ax + By = C) is the preferred format for solving systems of linear equations and for finding both intercepts efficiently. All three forms describe the exact same line, just expressed differently for different purposes.',
    variables: [
      { symbol: 'm', name: 'Slope', description: 'The rate of change: rise over run. Positive means the line rises from left to right, negative means it falls, zero means horizontal, and undefined (infinite) means vertical. Slope is the tangent of the angle the line makes with the x-axis.' },
      { symbol: 'b', name: 'Y-Intercept', description: 'The point where the line crosses the y-axis (when x = 0). In slope-intercept form y = mx + b, b is the constant term that shifts the line vertically without changing its steepness.' },
      { symbol: '(x₁, y₁)', name: 'Point 1', description: 'The first known point on the line. Any two distinct points uniquely determine a line in the Cartesian plane. Used as the reference point in point-slope form.' },
      { symbol: '(x₂, y₂)', name: 'Point 2', description: 'The second known point on the line. Together with Point 1, these define the line uniquely. The slope is computed from the differences between the two points.' },
      { symbol: 'Distance', name: 'Euclidean Distance', description: 'The straight-line distance between the two points computed using the Pythagorean theorem: d = √((x₂−x₁)² + (y₂−y₁)²). Represents the actual length of the line segment connecting the two points.' },
    ],
    howToUse: [
      'Enter the coordinates of two points — X₁, Y₁ for the first point and X₂, Y₂ for the second point on the line.',
      'View the slope as both a decimal value and a simplified fraction (rise over run) for exact proportional understanding.',
      'Switch to Standard output to see all three equation forms: slope-intercept (y = mx + b), point-slope, and standard form (Ax + By = C).',
      'Use the Angle Display option to see the slope expressed as an angle from horizontal, in either degrees or radians.',
      'Check the direction indicator to understand whether the line is increasing, decreasing, horizontal, or vertical.',
      'The midpoint and distance between the two points are calculated automatically for additional geometric insight.',
    ],
    explanation:
      'The slope of a line measures its steepness and direction. A positive slope means the line rises from left to right; a negative slope means it falls. A zero slope is horizontal, and an undefined (infinite) slope is vertical. The letter m has been used for slope for centuries, but who introduced it is not known; a popular (unproven) guess is the French "monter", to climb. Slope is fundamental to calculus (derivatives measure the slope of a curve at any point), physics (velocity = slope of a distance-time graph), economics (marginal cost = slope of the cost function), and countless real-world applications. Slope-intercept form (y = mx + b) is the most intuitive — m tells you the steepness and b tells you where the line crosses the y-axis. Point-slope form (y − y₁ = m(x − x₁)) is useful when you know a point and the slope. Standard form (Ax + By = C) is convenient for finding both intercepts quickly and for solving systems of linear equations. The calculator also computes the distance between the two points using the Pythagorean theorem: d = √((x₂ − x₁)² + (y₂ − y₁)²) and the midpoint coordinates. Real-world slope examples: a 6% road grade means the road rises 6 feet for every 100 feet of horizontal distance (slope = 0.06). In architecture, the Americans with Disabilities Act (ADA) limits wheelchair ramp slopes to 1:12 (about 8.3%). Roof pitches are expressed as rise over run (e.g., a 4/12 pitch means 4 inches of rise for every 12 inches of horizontal run).',
    commonUses: [
      'Finding the slope of a roof to determine roofing material requirements and drainage design',
      'Calculating road grade for highway engineering — a 6% grade means the road rises 6 feet per 100 horizontal feet',
      'Computing rates of change in physics (velocity from position data, acceleration from velocity data)',
      'Determining wheelchair ramp compliance with ADA standards (maximum 1:12 slope ratio)',
      'Analyzing data trends in economics, business metrics, and scientific experiments through linear regression',
    ],
    workedExamples: [
      {
        scenario: 'Maria, a civil engineer, is designing a wheelchair ramp for a community center entrance. The door threshold is 24 inches above the sidewalk, and she has 20 feet (240 inches) of available horizontal space. Will the ramp meet the ADA maximum slope requirement of 1:12 (approximately 8.3%)?',
        inputs: { x1: '0', y1: '0', x2: '240', y2: '24' },
        result: 'Slope m = 0.1 (positive, increasing). Slope as fraction: 1/10. Direction: increasing (positive slope). Distance between points: 241.197. Angle: 5.71°. Y-intercept: (0, 0). Slope-intercept form: y = 0.1x.',
        insight: 'The slope is 24/240 = 0.10, or 10%. This exceeds the ADA maximum of 8.3% (1:12), so Maria needs to either extend the ramp to at least 288 inches (24 feet) or add a switchback. At 288 inches, the slope would be 24/288 = 0.0833, exactly meeting the 1:12 requirement.',
      },
      {
        scenario: 'James, a homeowner, is checking if his new roof meets local building code. The roof peak is 8 feet above the attic floor, and the horizontal distance from peak to eave is 20 feet. What is the roof pitch as rise-over-run?',
        inputs: { x1: '0', y1: '0', x2: '20', y2: '8' },
        result: 'Slope m = 0.4 (positive, increasing). Slope as fraction: 2/5. Direction: increasing (positive slope). Distance between points: 21.5407. Angle: 21.80°. Roof pitch ≈ 5/12. Y-intercept: (0, 0). Slope-intercept form: y = 0.4x.',
        insight: 'The slope is 8/20 = 0.4, which as a fraction is 2/5. Roof pitch is typically expressed per 12 inches of run: 0.4 × 12 = 4.8, so this is approximately a 5/12 pitch. This is a moderately steep roof suitable for asphalt shingles. Most building codes require a minimum pitch of 2/12 to 4/12 depending on roofing material.',
      },
      {
        scenario: 'Priya, a data analyst, is tracking monthly sales growth for her company. January sales were $50,000 and June sales reached $65,000. She wants to find the average monthly sales growth rate from the slope of the trend line.',
        inputs: { x1: '1', y1: '50000', x2: '6', y2: '65000' },
        result: 'Slope m = 3000 (positive, increasing). Slope as fraction: 3000/1. Direction: increasing (positive slope). Distance between points: 15000.0008. Angle: 89.98°. Y-intercept: (0, 47000). Slope-intercept form: y = 3000x + 47000. By December (x=12), projected sales ≈ $83,000.',
        insight: 'The slope of 3,000 means sales increased by $3,000 per month on average over this period. The slope-intercept form y = 3000x + 47000 tells Priya that the baseline (extrapolated) was $47,000 and the growth trajectory predicts approximately $83,000 by December (x=12) if the trend continues.',
      },
    ],
    proTips: [
      'Use the fraction form of slope rather than decimal whenever possible — fractions are exact and reveal proportional relationships that decimals hide. For example, a slope of 4/3 means "for every 3 units right, go up 4 units."',
      'When solving systems of equations, use the standard form (Ax + By = C) output from two lines to quickly check if the lines are parallel (same A/B ratio), perpendicular (product of slopes = -1), or intersecting at exactly one point.',
      'The distance between points is more than just a geometry exercise — it represents the actual length of material needed for any linear construction between those coordinates (piping, wiring, fencing, road segments).',
      'For real-world slope problems, always consider the sign convention: positive slopes in finance indicate growth; in road design, positive slopes mean uphill; in drainage, negative slopes mean water flows in the negative-x direction.',
      'The point-slope form is under-appreciated but powerful — it is the most natural form when you know one data point and the rate of change, which is the starting condition for most real-world linear modeling problems.',
      'Check your work by plugging both given points back into the slope-intercept equation. If y = mx + b does not produce the correct y for both x values, there is a calculation error.',
    ],
    limitations: [
      'Works with exactly two points to define a single line. It does not find the line of best fit for three or more points — use linear regression (available in the statistics calculator) for scatter plot trend lines.',
      'Assumes Cartesian coordinates on a flat plane and does not account for Earth curvature. For geographic distances over 10 kilometers, the curvature of the Earth becomes significant — do not use this for surveying or long-distance navigation.',
      'Coordinates are read as exact decimals and the slope, intercept and equations are computed exactly, so the fraction form is always in lowest terms. Only the distance and the angle use ordinary floating-point arithmetic (about 15 significant digits).',
      'Two identical points do not define a line, so the calculator asks for two different points instead of returning a slope.',
      'Limited to 2D Cartesian line equations. Does not handle 3D lines, lines in polar coordinates, or parametric representations. For 3D geometry, use the distance calculator or a dedicated 3D math tool.',
      'Vertical lines through the same x-coordinate produce "undefined" slope and are not expressible in slope-intercept form (y = mx + b). The calculator handles this by displaying the vertical line equation x = constant.',
    ],
    quickReference: [
      { label: 'Positive slope', value: 'Line rises left to right (m > 0)' },
      { label: 'Negative slope', value: 'Line falls left to right (m < 0)' },
      { label: 'Zero slope', value: 'Horizontal line (m = 0, y = constant)' },
      { label: 'Undefined slope', value: 'Vertical line (x = constant)' },
      { label: 'Parallel lines', value: 'Same slope (m₁ = m₂)' },
      { label: 'Perpendicular lines', value: 'm₁ × m₂ = −1' },
      { label: 'Road grade to slope', value: '6% grade = slope of 0.06' },
      { label: 'ADA max ramp slope', value: '1:12 = 0.0833 = 8.3%' },
    ],
    faqs: [
      {
        question: 'What does a slope of 0 mean?',
        answer: 'A slope of 0 means the line is horizontal — there is no change in y regardless of the change in x. The equation is y = b (a constant). This occurs when y₁ = y₂. In real-world terms, zero slope means steady state or equilibrium: no increase or decrease over time.',
      },
      {
        question: 'What does an undefined slope mean?',
        answer: 'An undefined slope means the line is vertical — x never changes. This occurs when x₁ = x₂. The equation is x = a (a constant). Division by zero in the slope formula produces this result. In practical terms, undefined slopes represent instantaneous change (infinite rate), such as a vertical cliff face or an instant price change.',
      },
      {
        question: 'Which equation form should I use?',
        answer: 'Slope-intercept form (y = mx + b) is best for graphing and understanding slope intuitively. Point-slope form is ideal when you know one point and the slope. Standard form is useful for solving systems of equations and finding intercepts quickly. For most everyday problems, slope-intercept is the most readable, but all three forms describe the same line.',
      },
      {
        question: 'How do I check if my slope calculation is correct?',
        answer: 'Verify by plugging both original points back into the slope-intercept equation y = mx + b. If both points satisfy the equation, the calculation is correct. Alternatively, use the distance between points via the Pythagorean theorem (d = √((x₂−x₁)² + (y₂−y₁)²)) as a cross-check — both methods should be mathematically consistent.',
      },
      {
        question: 'How is slope used in road design and construction?',
        answer: 'Road grades are expressed as a percentage (slope × 100). A 6% grade means the road rises 6 feet for every 100 horizontal feet. Highway design standards typically limit grades to 6% on major highways and 12% on local roads. For drainage, paved roads are also given a small cross-slope (typically around 1.5–2%) so water runs off the surface.',
      },
      {
        question: 'What is the difference between slope and rate of change?',
        answer: 'They are the same concept. Slope is the geometric term (rise over run on a graph), while rate of change is the applied term (change in one variable per unit change in another). In calculus, the derivative f\'(x) gives the instantaneous slope of a curve at any point. The slope calculator gives the average rate of change between two points — as the two points get closer together, this average approaches the derivative.',
      },
      {
        question: 'How do I convert between decimal slope and roof pitch?',
        answer: 'Roof pitch is expressed as rise (in inches) per 12 inches of run. To convert: multiply decimal slope by 12. For example, slope = 0.333 converts to a 4/12 pitch (0.333 × 12 = 4). A 6/12 pitch equals slope = 0.5 (6/12). Most residential roofs in North America use pitches between 4/12 and 9/12.',
      },
      {
        question: 'Can I use this calculator for finding if three points form a right triangle?',
        answer: 'Yes. Calculate slopes between all three pairs of points. If any two slopes are negative reciprocals (m₁ × m₂ = −1), the corresponding lines are perpendicular and the three points form a right triangle. The distance between points (shown in results) can also verify using the Pythagorean theorem: if d₁² + d₂² = d₃², the triangle is right-angled.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Slope', url: 'https://en.wikipedia.org/wiki/Slope' },
      { source: 'Wolfram MathWorld - Slope', url: 'https://mathworld.wolfram.com/Slope.html' },
    ],
  },
};

export default slopeConfig;
