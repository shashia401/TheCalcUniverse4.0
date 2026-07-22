import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import UnitCirclePanel from './UnitCirclePanel';

const DEG = Math.PI / 180;

function toRadians(degrees: number): number {
  return degrees * DEG;
}

function round(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function normalizeAngle(angle: number): number {
  // Normalize to 0-360 range
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

function getQuadrant(angle: number): string {
  if (angle === 0 || angle === 360) return 'On positive x-axis';
  if (angle === 90) return 'On positive y-axis';
  if (angle === 180) return 'On negative x-axis';
  if (angle === 270) return 'On negative y-axis';
  if (angle > 0 && angle < 90) return 'I';
  if (angle > 90 && angle < 180) return 'II';
  if (angle > 180 && angle < 270) return 'III';
  if (angle > 270 && angle < 360) return 'IV';
  return 'I';
}

function getReferenceAngle(angle: number): number {
  // For angles on axes, reference angle is 0 or 90 depending
  if (angle % 90 === 0 && angle % 180 !== 0) return 90;
  if (angle % 180 === 0) return 0;

  // For quadrant angles, find acute angle to x-axis
  if (angle > 0 && angle < 180) {
    if (angle <= 90) return angle;
    return 180 - angle;
  }
  if (angle > 180 && angle < 360) {
    if (angle <= 270) return angle - 180;
    return 360 - angle;
  }
  return angle;
}

function radiansToString(radians: number): string {
  // Try to express as a fraction of pi
  const piRatio = radians / Math.PI;

  // Common fractions
  const fractions: Record<string, number> = {
    'π/6': 1 / 6,
    'π/4': 1 / 4,
    'π/3': 1 / 3,
    'π/2': 1 / 2,
    '2π/3': 2 / 3,
    '3π/4': 3 / 4,
    '5π/6': 5 / 6,
    'π': 1,
    '7π/6': 7 / 6,
    '5π/4': 5 / 4,
    '4π/3': 4 / 3,
    '3π/2': 3 / 2,
    '5π/3': 5 / 3,
    '7π/4': 7 / 4,
    '11π/6': 11 / 6,
    '2π': 2,
    '0': 0,
  };

  // Check if it matches a common fraction
  for (const [fraction, value] of Object.entries(fractions)) {
    if (Math.abs(piRatio - value) < 0.001) {
      return fraction;
    }
  }

  // Fall back to decimal
  return `${round(radians, 4)} rad`;
}

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'angle',
      label: 'Angle',
      type: 'number',
      required: true,
      placeholder: 'Enter angle',
      unit: 'degrees',
      inputMode: 'decimal',
      helpText: 'Enter an angle in degrees to find its position on the unit circle',
    },
  ],
  calculate: (values) => {
    const angleInput = parseFloat(values.angle);
    if (isNaN(angleInput)) return [];

    const normalized = normalizeAngle(angleInput);
    const rad = toRadians(normalized);
    const sinVal = round(Math.sin(rad), 8);
    const cosVal = round(Math.cos(rad), 8);
    const tanValRaw = Math.tan(rad);

    // Check for undefined tan (cos near 0)
    const tanVal = Math.abs(Math.cos(rad)) < 1e-10 ? NaN : round(tanValRaw, 8);

    const quadrant = getQuadrant(normalized);
    const refAngle = getReferenceAngle(normalized);
    const radStr = radiansToString(rad);
    const refAngleStr = round(refAngle, 2).toString();

    // Coordinate on unit circle
    const coordX = cosVal;
    const coordY = sinVal;

    // Reciprocal functions
    const cscVal = Math.abs(sinVal) < 1e-10 ? 'Undefined' : round(1 / sinVal, 8).toString();
    const secVal = Math.abs(cosVal) < 1e-10 ? 'Undefined' : round(1 / cosVal, 8).toString();

    // Adjust cot for when tan is 0 or cos/sin special cases
    let cotValue: string;
    if (Math.abs(Math.cos(rad)) < 1e-10) {
      cotValue = '0';
    } else if (Math.abs(Math.sin(rad)) < 1e-10) {
      cotValue = 'Undefined';
    } else {
      cotValue = round(1 / tanValRaw, 8).toString();
    }

    return [
      {
        id: 'normalizedAngle',
        label: 'Angle (Normalized)',
        value: `${normalized}°`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'radians',
        label: 'Radians',
        value: radStr,
      },
      {
        id: 'coordinates',
        label: 'Coordinates (cos θ, sin θ)',
        value: `(${coordX}, ${coordY})`,
        highlight: true,
      },
      {
        id: 'trig',
        label: 'sin(θ)  |  cos(θ)  |  tan(θ)',
        value: `${sinVal}  |  ${cosVal}  |  ${isNaN(tanVal) ? 'Undefined' : tanVal}`,
      },
      {
        id: 'reciprocal',
        label: 'csc(θ)  |  sec(θ)  |  cot(θ)',
        value: `${cscVal}  |  ${secVal}  |  ${cotValue}`,
      },
      {
        id: 'quadrant',
        label: 'Quadrant',
        value: quadrant,
      },
      {
        id: 'referenceAngle',
        label: 'Reference Angle',
        value: `${refAngleStr}°`,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(UnitCirclePanel, { values, results });
  },
  educational: {
    formula:
      'x = cosθ | y = sinθ | x² + y² = 1 | tanθ = sinθ/cosθ | Reference Angle = acute angle to x-axis',
    formulaDescription:
      `The unit circle is a circle of radius 1 centered at the origin (0, 0) in the Cartesian coordinate plane. Every point on the unit circle corresponds to an angle theta measured counterclockwise from the positive x-axis, with the coordinates of each point being (cos theta, sin theta). This elegant relationship connects geometry, trigonometry, and algebra. Because the radius is 1, the coordinates satisfy x^2 + y^2 = 1, which is both the equation of the unit circle and the fundamental Pythagorean identity sin^2(theta) + cos^2(theta) = 1. The unit circle provides a complete, visual definition of the trigonometric functions that works for all angles — not just acute angles in right triangles — making it essential for understanding periodic functions and their properties.`,
    variables: [
      {
        symbol: 'θ (theta)',
        name: 'Angle from positive x-axis',
        description: 'The angle measured counterclockwise from the positive x-axis to the radius line connecting the origin to the point on the unit circle. Angles are typically measured in degrees or radians.',
      },
      {
        symbol: 'cos(θ)',
        name: 'Cosine = x-coordinate',
        description: 'The x-coordinate of the point on the unit circle at angle θ. Cosine represents the horizontal displacement from the origin, ranging from -1 (leftmost point at 180°) to 1 (rightmost point at 0°).',
      },
      {
        symbol: 'sin(θ)',
        name: 'Sine = y-coordinate',
        description: 'The y-coordinate of the point on the unit circle at angle θ. Sine represents the vertical displacement, ranging from -1 (bottom at 270°) to 1 (top at 90°).',
      },
      {
        symbol: 'Reference Angle',
        name: 'Acute angle to the x-axis',
        description: 'The smallest positive acute angle (between 0° and 90°) between the terminal side of the given angle and the x-axis. The absolute values of trigonometric functions of any angle equal those of its reference angle, with sign determined by the quadrant.',
      },
      {
        symbol: 'Quadrant',
        name: 'Coordinate quadrant (I, II, III, IV)',
        description: 'The four quadrants divide the plane by sign: Quadrant I (0°-90°): both coordinates positive; Quadrant II (90°-180°): x negative, y positive; Quadrant III (180°-270°): both negative; Quadrant IV (270°-360°): x positive, y negative.',
      },
    ],
    howToUse: [
      'Enter any angle in degrees (positive, negative, or greater than 360°) in the input field. The calculator automatically normalizes it to the 0-360° range.',
      'View the normalized angle, its equivalent in radians (displayed as a fraction of π when possible), and the coordinates (cosθ, sinθ) on the unit circle.',
      'Examine the six trigonometric values (sin, cos, tan, csc, sec, cot) and note which quadrant the angle falls in, which determines the sign of each function.',
      'The reference angle tells you the acute angle to the nearest x-axis. Use this together with the quadrant to determine trigonometric values of any angle using just the acute-angle values.',
      'For angles exactly on the axes (0°, 90°, 180°, 270°), the calculator identifies these special cases and correctly labels undefined reciprocal functions.',
    ],
    quickReference: [
      { label: '0° = (1, 0)', value: '90° = (0, 1)' },
      { label: '180° = (-1, 0)', value: '270° = (0, -1)' },
      { label: '30° = (√3/2, 1/2)', value: '45° = (√2/2, √2/2)' },
      { label: '60° = (1/2, √3/2)', value: 'Quadrant signs: (+,+), (−,+), (−,−), (+,−)' },
    ],
    commonUses: [
      'Learning and teaching trigonometry: the unit circle provides a complete visual definition of sine and cosine as coordinates, making abstract concepts like periodicity, even/odd properties, and phase shifts intuitive and concrete',
      'Signal processing and Fourier analysis: understanding sinusoidal functions as projections of circular motion is fundamental to decomposing signals into frequency components, used in audio compression, image processing, and telecommunications',
      'Physics: analyzing circular and rotational motion, including angular velocity, centripetal acceleration, simple harmonic oscillators, and wave phenomena where displacement varies sinusoidally with time',
      'Computer graphics and animation: rotating objects, calculating circular trajectories, implementing camera orbits, and generating smooth periodic animations using parametric equations based on the unit circle',
      'Navigation and robotics: converting between polar and Cartesian coordinates for path planning, calculating bearing angles from position offsets, and controlling robotic arm joints with rotational movements',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 560 400" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="280" y="22" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">The Unit Circle — x = cos θ, y = sin θ</text>' +
        '<text x="280" y="40" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Every angle θ maps to a point (cos θ, sin θ) on the circle x² + y² = 1</text>' +
        '<rect x="20" y="55" width="520" height="330" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Axes -->' +
        '<line x1="280" y1="80" x2="280" y2="340" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<line x1="60" y1="210" x2="500" y2="210" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<!-- Unit circle -->' +
        '<circle cx="280" cy="210" r="120" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2" opacity="0.3"/>' +
        '<!-- Angle arc -->' +
        '<path d="M 280,210 L 340,210 A 60,60 0 0,1 318.2,261.2" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="2.5"/>' +
        '<text x="305" y="235" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-8b5cf6)" font-weight="700">θ</text>' +
        '<!-- Radius line -->' +
        '<line x1="280" y1="210" x2="340" y2="261.2" stroke="var(--svg-8b5cf6)" stroke-width="2"/>' +
        '<!-- Point on circle -->' +
        '<circle cx="340" cy="261.2" r="5" fill="var(--svg-ef4444)"/>' +
        '<text x="345" y="275" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ef4444)" font-weight="700">P = (cos θ, sin θ)</text>' +
        '<!-- Vertical line (sin) -->' +
        '<line x1="340" y1="210" x2="340" y2="261.2" stroke="var(--svg-22c55e)" stroke-width="2" stroke-dasharray="4,2"/>' +
        '<text x="348" y="238" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-22c55e)" font-weight="600">sin θ</text>' +
        '<!-- Horizontal line (cos) -->' +
        '<line x1="280" y1="261.2" x2="340" y2="261.2" stroke="var(--svg-eab308)" stroke-width="2" stroke-dasharray="4,2"/>' +
        '<text x="300" y="275" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-eab308)" font-weight="600">cos θ</text>' +
        '<!-- Quadrant labels -->' +
        '<text x="340" y="130" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-64748b)" font-weight="700">Quadrant II</text>' +
        '<text x="400" y="145" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">( − , + )</text>' +
        '<text x="170" y="130" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-64748b)" font-weight="700">Quadrant I</text>' +
        '<text x="150" y="145" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">( + , + )</text>' +
        '<text x="170" y="300" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-64748b)" font-weight="700">Quadrant III</text>' +
        '<text x="155" y="315" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">( − , − )</text>' +
        '<text x="340" y="300" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-64748b)" font-weight="700">Quadrant IV</text>' +
        '<text x="370" y="315" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">( + , − )</text>' +
        '<!-- Axis labels -->' +
        '<text x="285" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">y (sin)</text>' +
        '<text x="490" y="214" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">x (cos)</text>' +
        '<!-- Key angle points -->' +
        '<text x="390" y="214" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-3b82f6)">0° (1,0)</text>' +
        '<text x="281" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-3b82f6)">90° (0,1)</text>' +
        '<text x="155" y="214" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-3b82f6)">180° (−1,0)</text>' +
        '<text x="260" y="338" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-3b82f6)">270° (0,−1)</text>' +
        '<!-- Bottom note -->' +
        '<text x="280" y="370" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">sin²θ + cos²θ = 1  |  Reference angle is the acute angle between terminal side and x-axis</text>' +
        '</svg>',
      alt: 'Unit circle diagram showing angle theta, point P at (cosθ, sinθ), dashed lines showing sine and cosine components, the four quadrants with sign patterns, and key angle coordinates at the axes',
      caption: 'On the unit circle, the x-coordinate is cosθ and the y-coordinate is sinθ for any angle θ. The reference angle is the acute angle between the terminal side and the x-axis.',
    },
    explanation:
      'The unit circle is one of the most powerful conceptual tools in all of trigonometry. It is a circle of radius 1 centered at the origin (0, 0) of the Cartesian coordinate plane. The equation of the unit circle is x² + y² = 1. Its key insight is that for any angle θ measured counterclockwise from the positive x-axis, the point where the terminal side of the angle intersects the circle has coordinates (cosθ, sinθ). This gives the six trigonometric functions a clear geometric meaning. Cosine is the x-coordinate: it tells you how far right (positive) or left (negative) the point is. Sine is the y-coordinate: it tells you how far up (positive) or down (negative) the point is. Because the radius is 1, the trigonometric functions take center stage — there is no hypotenuse scaling factor to worry about, as there is with right triangles. This unit circle definition generalizes trigonometry beyond acute angles (0° to 90°) to any real angle, including negative angles (clockwise rotation) and angles greater than 360° (full rotations). This generalization is essential for understanding periodic functions, since sin and cos repeat every 360° (2π radians). The quadrant system divides the plane into four regions: Quadrant I (top-right, 0°-90°, both coordinates positive), Quadrant II (top-left, 90°-180°, x negative, y positive), Quadrant III (bottom-left, 180°-270°, both negative), and Quadrant IV (bottom-right, 270°-360°, x positive, y negative). The signs of the six trigonometric functions follow directly from these coordinate signs: in Quadrant II, for instance, only sine is positive. The reference angle is the acute angle (between 0° and 90°) that the terminal side makes with the x-axis. For any angle, the absolute values of the trigonometric functions equal those of its reference angle. For example, sin(150°) = sin(30°) = 1/2, but cos(150°) = -cos(30°) = -√3/2 because cosine is negative in Quadrant II. This relationship is the basis of the "All Students Take Calculus" mnemonic for remembering which functions are positive in each quadrant (All in QI, Sin in QII, Tan in QIII, Cos in QIV). The unit circle also makes the Pythagorean identity sin²θ + cos²θ = 1 immediately obvious: since the point (cosθ, sinθ) lies on the circle x² + y² = 1, it must satisfy this identity. This is the most fundamental of all trigonometric identities and is the basis for deriving many others. Special angles (0°, 30°, 45°, 60°, 90°, and their multiples in all quadrants) produce exact values that appear repeatedly in mathematics and physics. For example, at 45° (π/4 radians), sinθ = cosθ = √2/2 ≈ 0.7071 because the point lies on the line y = x. At 30° (π/6), sinθ = 1/2 and cosθ = √3/2, while at 60° (π/3), the values swap. These exact values are worth memorizing as they form the building blocks for solving countless trigonometric problems without a calculator.',
    faqs: [
      {
        question: 'How do I find the reference angle for any given angle?',
        answer: 'The reference angle is always between 0° and 90°. To find it: First, normalize the angle to the 0-360° range by taking the remainder when dividing by 360 (and adding 360 if negative). Then determine which quadrant the terminal side is in. If the angle is in Quadrant I (0° to 90°), the reference angle equals the angle itself. In Quadrant II (90° to 180°), subtract the angle from 180°. In Quadrant III (180° to 270°), subtract 180° from the angle. In Quadrant IV (270° to 360°), subtract the angle from 360°. For example, an angle of 210° has a reference angle of 210° - 180° = 30°. An angle of 315° has a reference angle of 360° - 315° = 45°. For negative angles like -45°, normalize first: -45° + 360° = 315°, which is in Quadrant IV, so the reference angle is 360° - 315° = 45°.',
      },
      {
        question: 'Why are the coordinates at 45° equal to √2/2?',
        answer: 'At 45° (π/4 radians), the point on the unit circle lies on the line y = x, so the x and y coordinates are equal. Since the point must satisfy x² + y² = 1, we have 2x² = 1, so x² = 1/2, and x = ±√(1/2) = ±1/√2 = ±√2/2. For the first quadrant (0°-90°), both coordinates are positive, so (cos45°, sin45°) = (√2/2, √2/2). This exact value appears frequently in trigonometry, and its decimal approximation is approximately 0.70710678. The same magnitude applies at 135° (Quadrant II, x negative), 225° (Quadrant III, both negative), and 315° (Quadrant IV, y negative), with signs determined by the quadrant.',
      },
      {
        question: 'What does it mean when a reciprocal function is labeled "Undefined"?',
        answer: 'A reciprocal function (csc, sec, or cot) is undefined when its corresponding primary function (sin, cos, or tan) is zero, because division by zero is mathematically impossible. Specifically: cscθ = 1/sinθ is undefined when sinθ = 0, which occurs at θ = 0°, 180°, 360°, etc. (on the x-axis). secθ = 1/cosθ is undefined when cosθ = 0, which occurs at θ = 90°, 270°, etc. (on the y-axis). cotθ = 1/tanθ is undefined when tanθ = 0 (it is defined when tanθ is undefined and vice versa), which occurs at 0°, 180°, etc. On the unit circle, these correspond to the points where the relevant coordinate equals zero. For example, at 90° (0, 1), cos = 0, so sec(90°) is undefined, but sin = 1, so csc(90°) = 1.',
      },
      {
        question: 'How does the unit circle relate to the graph of sine and cosine waves?',
        answer: 'The unit circle provides a direct way to generate the graphs of sine and cosine functions. Imagine a point moving counterclockwise around the unit circle at a constant speed. If you plot the y-coordinate (sine) of this point against the angle of rotation, you get the familiar sine wave: it starts at 0, rises to 1 at 90°, falls back to 0 at 180°, reaches -1 at 270°, and returns to 0 at 360°. The cosine wave is the same shape but shifted: it starts at 1 (because cos0° = 1), falls to 0 at 90°, reaches -1 at 180°, etc. This relationship is fundamental to understanding simple harmonic motion — for example, a pendulum swinging back and forth traces out a sinusoidal pattern over time, and the projection of circular motion onto a line produces pure sine or cosine waves.',
      },
      {
        question: 'How do I remember which trigonometric functions are positive in each quadrant?',
        answer: 'The common mnemonic is "All Students Take Calculus" (ASTC). Going counterclockwise starting from Quadrant I: All six functions are positive in Quadrant I (angles 0°-90°). Only Sine and its reciprocal cosecant (csc) are positive in Quadrant II (90°-180°). Only Tangent and its reciprocal cotangent (cot) are positive in Quadrant III (180°-270°). Only Cosine and its reciprocal secant (sec) are positive in Quadrant IV (270°-360°). On the unit circle, this is why: in QII, x is negative (cos negative), y is positive (sin positive), so tan = sin/cos is negative. In QIII, both x and y are negative, so sin and cos are both negative, making their ratio (tan) positive. In QIV, x is positive, y is negative, so cos is positive, sin is negative, and tan is negative.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A physics student needs to find the horizontal and vertical components of a 50 N force applied at a 30-degree angle above the horizontal for a free-body diagram.',
        inputs: { angle: '30' },
        result: 'Coordinates (0.866025, 0.5); Quadrant I; Reference angle 30°; tan(30°) = 0.57735',
        insight: 'At 30 degrees (pi/6 radians), the unit circle gives coordinates (cos30, sin30) = (0.866025, 0.5). In quadrant I, both trig functions are positive. The force components are Fx = 50 * cos30 = 43.3 N (horizontal) and Fy = 50 * sin30 = 25 N (vertical). The reference angle is 30 degrees. The tangent is sin30/cos30 = 0.5/0.866 = 0.577 = tan30.',
      },
      {
        scenario: 'An engineering student analyzes the position of a robotic arm joint at 225 degrees and needs to determine the Cartesian coordinates of the endpoint, which lies on a circle of radius 1 meter.',
        inputs: { angle: '225' },
        result: 'Coordinates (-0.707107, -0.707107); Quadrant III; Reference angle 45°; tan(225°) = 1',
        insight: 'The angle 225 degrees is in Quadrant III (180-270 degrees), where both x and y are negative. The reference angle is 225 - 180 = 45 degrees. Using the unit circle: cos225 = -cos45 = -0.707107, sin225 = -sin45 = -0.707107. Both coordinates are negative and equal in magnitude, placing the endpoint at (-0.707, -0.707) meters. The tangent is sin/cos = (-0.707)/(-0.707) = 1, consistent with the 45-degree reference angle.',
      },
    ],
    proTips: [
      'Use the reference angle to quickly determine trig values for any angle: find the reference angle (acute angle to x-axis), look up or recall its sine and cosine, then apply the correct signs based on the quadrant.',
      'Memorize the exact values for special angles (0, 30, 45, 60, 90 degrees) and their patterns: sin(30)=1/2, sin(45)=sqrt(2)/2, sin(60)=sqrt(3)/2. Cosine follows the reverse pattern.',
      'The ASTC mnemonic ("All Students Take Calculus") tells you which functions are positive where: All in QI, Sine in QII, Tangent in QIII, Cosine in QIV.',
      'When a reciprocal function shows "Undefined," it means division by zero — the corresponding point on the unit circle has that coordinate equal to zero. For example, tan90 is undefined because cos90 = 0.',
      'To see the periodic nature of trig functions, enter angle values that differ by multiples of 360 (like 30, 390, 750) and observe that the coordinates repeat exactly.',
    ],
    limitations: [
      'The calculator uses decimal approximations for most trig values, not exact symbolic forms. For angles where exact values exist (like sin45 = sqrt(2)/2), the display shows the decimal equivalent (0.707107) rather than the radical form.',
      'Very large angles are normalized to the 0-360 degree range, so entering 1000 degrees produces the same results as 280 degrees. This is mathematically correct but may be surprising if you expect raw input preservation.',
      'The floating-point representation may produce small rounding errors for extreme values; for example, sin(180) may display as a very small number (like 1.2e-16) rather than exactly zero due to IEEE 754 double-precision limits.',
      'Reciprocal functions near their asymptotes can produce very large or imprecise values due to floating-point division by numbers close to zero. When sin or cos is exactly zero (to machine precision), the reciprocal is reported as "Undefined."',
    ],
    citations: [
      { source: 'Khan Academy - Unit Circle', url: 'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:trig/x2ec2f6f830c9fb89:unit-circle/v/unit-circle-definition-of-trig-functions-1' },
      { source: 'Wolfram MathWorld - Unit Circle', url: 'https://mathworld.wolfram.com/UnitCircle.html' },
    ],
  },
};

export default config;
