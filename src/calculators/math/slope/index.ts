import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SlopePanel from './SlopePanel';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function slopeAsFraction(dy: number, dx: number): string {
  if (dx === 0) return 'undefined';
  const g = gcd(Math.round(dy * 1e9), Math.round(dx * 1e9));
  const num = Math.round(dy * 1e9) / g;
  const den = Math.round(dx * 1e9) / g;
  if (den < 0) return `${-num}/${-den}`;
  return `${num}/${den}`;
}

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
    const x1 = parseFloat(values.x1);
    const y1 = parseFloat(values.y1);
    const x2 = parseFloat(values.x2);
    const y2 = parseFloat(values.y2);

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return [];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const m = dx !== 0 ? dy / dx : Infinity;
    const b = dx !== 0 ? y1 - m * x1 : 0;

    const fmt = (n: number) => {
      if (Number.isInteger(n)) return n.toString();
      return parseFloat(n.toFixed(4)).toString();
    };

    const isVertical = dx === 0;
    const direction = isVertical ? 'vertical' : m > 0 ? 'increasing (positive slope)' : m < 0 ? 'decreasing (negative slope)' : 'horizontal (zero slope)';

    const showCompact = values.outputFormat === 'compact';
    const angleUnit = values.angleDisplay || 'degrees';
    const angle = Math.atan(m) * (angleUnit === 'degrees' ? 180 / Math.PI : 1);
    const angleLabel = angleUnit === 'degrees' ? `${angle.toFixed(2)}°` : `${angle.toFixed(4)} rad`;

    // Line equations
    let slopeIntercept = '';
    let pointSlope = '';
    let standardForm = '';

    if (isVertical) {
      slopeIntercept = `x = ${fmt(x1)} (vertical line)`;
      pointSlope = `x = ${fmt(x1)}`;
      standardForm = `x = ${fmt(x1)}`;
    } else {
      const mxStr = m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '-x' : `${fmt(m)}x`;
      const bStr = b > 0 ? ` + ${fmt(b)}` : b < 0 ? ` − ${fmt(Math.abs(b))}` : '';
      slopeIntercept = `y = ${mxStr}${bStr}`;

      const y1Str = y1 >= 0 ? `y − ${fmt(y1)}` : `y + ${fmt(Math.abs(y1))}`;
      const x1Str = x1 >= 0 ? `(x − ${fmt(x1)})` : `(x + ${fmt(Math.abs(x1))})`;
      pointSlope = `${y1Str} = ${m === 1 ? '' : m === -1 ? '−' : fmt(m)}${x1Str}`;

      const A = -dy;
      const B = dx;
      const C = A * x1 + B * y1;
      const g = gcd(Math.round(A * 1e6), gcd(Math.round(B * 1e6), Math.round(C * 1e6)));
      const sA = Math.round(A * 1e6) / g;
      const sB = Math.round(B * 1e6) / g;
      const sC = Math.round(C * 1e6) / g;

      const aStr = sA === 1 ? 'x' : sA === -1 ? '-x' : sA === 0 ? '' : `${fmt(sA)}x`;
      const bSign = sB > 0 ? ' + ' : ' − ';
      const sBStr = Math.abs(sB) === 1 ? 'y' : Math.abs(sB) === 0 ? '' : `${fmt(Math.abs(sB))}y`;
      standardForm = `${aStr}${sB !== 0 ? bSign : ''}${sBStr}${sC >= 0 ? ' = ' : ' = −'}${fmt(Math.abs(sC))}`;
      if (sA === 0 && sB === 0) standardForm = '0 = 0';
    }

    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const results: any[] = [
      {
        id: 'slope',
        label: 'Slope (m)',
        value: isVertical ? 'Undefined (vertical)' : fmt(m),
        highlight: true,
        color: isVertical ? 'negative' as const : m > 0 ? 'positive' as const : m < 0 ? 'negative' as const : 'neutral' as const,
      },
      { id: 'slopeFraction', label: 'Slope as Fraction', value: isVertical ? 'undefined' : slopeAsFraction(dy, dx), color: 'neutral' as const },
      { id: 'direction', label: 'Direction', value: direction, color: 'neutral' as const },
      { id: 'distance', label: 'Distance Between Points', value: fmt(distance), color: 'neutral' as const },
    ];

    if (!showCompact) {
      results.push(
        { id: 'slopeIntercept', label: 'Slope-Intercept Form', value: slopeIntercept, color: 'neutral' as const },
        { id: 'pointSlope', label: 'Point-Slope Form', value: pointSlope, color: 'neutral' as const },
        { id: 'standardForm', label: 'Standard Form', value: standardForm, color: 'neutral' as const },
        { id: 'yIntercept', label: 'Y-Intercept', value: isVertical ? 'none' : `(0, ${fmt(b)})`, color: 'neutral' as const },
        { id: 'angle', label: `Angle from Horizontal (${angleUnit === 'degrees' ? 'degrees' : 'radians'})`, value: isVertical ? '90°' : angleLabel, color: 'neutral' as const },
        { id: 'midpoint', label: 'Midpoint', value: `(${fmt(midX)}, ${fmt(midY)})`, color: 'neutral' as const },
      );
    }

    return results;
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
      'The slope of a line measures its steepness and direction. A positive slope means the line rises from left to right; a negative slope means it falls. A zero slope is horizontal, and an undefined (infinite) slope is vertical. The concept of slope dates back to ancient Greek mathematics, where Euclid studied ratios of line segments around 300 BCE. The formal notation m for slope was popularized in the 18th century by mathematicians like Euler, though its exact origin is debated — some attribute it to the French word "monter" (to climb). Slope is fundamental to calculus (derivatives measure the slope of a curve at any point), physics (velocity = slope of a distance-time graph), economics (marginal cost = slope of the cost function), and countless real-world applications. Slope-intercept form (y = mx + b) is the most intuitive — m tells you the steepness and b tells you where the line crosses the y-axis. Point-slope form (y − y₁ = m(x − x₁)) is useful when you know a point and the slope. Standard form (Ax + By = C) is convenient for finding both intercepts quickly and for solving systems of linear equations. The calculator also computes the distance between the two points using the Pythagorean theorem: d = √((x₂ − x₁)² + (y₂ − y₁)²) and the midpoint coordinates. Real-world slope examples: a 6% road grade means the road rises 6 feet for every 100 feet of horizontal distance (slope = 0.06). In architecture, the Americans with Disabilities Act (ADA) limits wheelchair ramp slopes to 1:12 (about 8.3%). Roof pitches are expressed as rise over run (e.g., a 4/12 pitch means 4 inches of rise for every 12 inches of horizontal run).',
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
        result: 'Slope m = 0.1 (positive, increasing). Slope as fraction: 1/10. Direction: increasing (positive slope). Distance between points: 241.2015. Angle: 5.71°. Y-intercept: (0, 0). Slope-intercept form: y = 0.1x.',
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
        result: 'Slope m = 3000 (positive, increasing). Slope as fraction: 3000/1. Direction: increasing (positive slope). Distance between points: 15000.0025. Angle: 89.98°. Y-intercept: (0, 47000). Slope-intercept form: y = 3000x + 47000. By December (x=12), projected sales ≈ $83,000.',
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
      'The simplified fraction form uses integer approximation with 1e9 precision. For extreme precision needs such as astronomical calculations, use a dedicated symbolic math tool or computer algebra system.',
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
        answer: 'Road grades are expressed as a percentage (slope × 100). A 6% grade means the road rises 6 feet for every 100 horizontal feet. Highway design standards typically limit grades to 6% on major highways and 12% on local roads. For drainage, roads are designed with a minimum 0.5% cross-slope to prevent water pooling.',
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
