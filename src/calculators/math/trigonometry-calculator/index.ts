import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TrigPanel from './TrigPanel';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function toRadians(degrees: number): number {
  return degrees * DEG;
}

function toDegrees(radians: number): number {
  return radians * RAD;
}

function round(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function formatAngle(value: number): string {
  const rounded = round(value, 2);
  return `${rounded}°`;
}

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { label: 'Angle → Trig Values', value: 'angle-to-trig' },
        { label: 'Trig Value → Angle', value: 'trig-to-angle' },
      ],
      helpText: 'Choose to get trig values from an angle or vice versa',
    },
    {
      id: 'angle',
      label: 'Angle',
      type: 'number',
      placeholder: 'Enter angle',
      unit: 'degrees',
      showWhen: (v) => v.mode === 'angle-to-trig',
      helpText: 'Enter the angle in degrees to compute trig values',
    },
    {
      id: 'function',
      label: 'Trigonometric Function',
      type: 'select',
      options: [
        { label: 'sin', value: 'sin' },
        { label: 'cos', value: 'cos' },
        { label: 'tan', value: 'tan' },
        { label: 'csc', value: 'csc' },
        { label: 'sec', value: 'sec' },
        { label: 'cot', value: 'cot' },
      ],
      showWhen: (v) => v.mode === 'trig-to-angle',
      helpText: 'Select the trigonometric function for the inverse calculation',
    },
    {
      id: 'trigValue',
      label: 'Trig Value',
      type: 'number',
      placeholder: 'Enter value',
      showWhen: (v) => v.mode === 'trig-to-angle',
      helpText: 'Enter the trigonometric value to find the angle',
    },
  ],
  calculate: (values) => {
    const mode = values.mode;

    if (!mode) return [];

    if (mode === 'angle-to-trig') {
      const angleVal = parseFloat(values.angle);
      if (isNaN(angleVal)) return [];

      const rad = toRadians(angleVal);
      const sinVal = Math.sin(rad);
      const cosVal = Math.cos(rad);
      const tanVal = Math.tan(rad);

      const results: CalculatorResult[] = [
        {
          id: 'sin',
          label: 'sin(θ)',
          value: round(sinVal, 8).toString(),
          highlight: true,
          color: sinVal >= 0 ? 'positive' : 'negative',
        },
        {
          id: 'cos',
          label: 'cos(θ)',
          value: round(cosVal, 8).toString(),
        },
        {
          id: 'tan',
          label: 'tan(θ)',
          value: round(tanVal, 8).toString(),
        },
        {
          id: 'csc',
          label: 'csc(θ) = 1/sin(θ)',
          value: round(1 / sinVal, 8).toString(),
        },
        {
          id: 'sec',
          label: 'sec(θ) = 1/cos(θ)',
          value: round(1 / cosVal, 8).toString(),
        },
        {
          id: 'cot',
          label: 'cot(θ) = 1/tan(θ)',
          value: round(1 / tanVal, 8).toString(),
        },
      ];

      // Handle domain errors for reciprocal functions
      if (Math.abs(sinVal) < 1e-10) {
        results[3] = { id: 'csc', label: 'csc(θ) = 1/sin(θ)', value: 'Undefined (sin = 0)' };
      }
      if (Math.abs(cosVal) < 1e-10) {
        results[4] = { id: 'sec', label: 'sec(θ) = 1/cos(θ)', value: 'Undefined (cos = 0)' };
      }
      // cot is undefined when tan = 0 (at 0°, 180°, etc.) because 1/0 is division by zero
      if (Math.abs(tanVal) < 1e-10) {
        results[5] = { id: 'cot', label: 'cot(θ) = 1/tan(θ)', value: 'Undefined (tan = 0)' };
      }

      return results;
    }

    if (mode === 'trig-to-angle') {
      const func = values.function;
      const trigVal = parseFloat(values.trigValue);

      if (!func || isNaN(trigVal)) return [];

      let principalAngle: number;
      let principalAngleLabel: string;
      let referenceAngle: number;
      let error: string | null = null;

      switch (func) {
        case 'sin':
          if (trigVal < -1 || trigVal > 1) {
            error = 'sin value must be in [-1, 1]';
            return [
              { id: 'error', label: 'Domain Error', value: error, color: 'negative' as const },
            ];
          }
          principalAngle = toDegrees(Math.asin(trigVal));
          principalAngleLabel = 'sin⁻¹(';
          referenceAngle = principalAngle >= 0 ? principalAngle : -principalAngle;
          break;
        case 'cos':
          if (trigVal < -1 || trigVal > 1) {
            error = 'cos value must be in [-1, 1]';
            return [
              { id: 'error', label: 'Domain Error', value: error, color: 'negative' as const },
            ];
          }
          principalAngle = toDegrees(Math.acos(trigVal));
          principalAngleLabel = 'cos⁻¹(';
          referenceAngle = principalAngle >= 0 ? principalAngle : -principalAngle;
          break;
        case 'tan':
          principalAngle = toDegrees(Math.atan(trigVal));
          principalAngleLabel = 'tan⁻¹(';
          referenceAngle = principalAngle >= 0 ? principalAngle : -principalAngle;
          break;
        case 'csc':
          if (trigVal === 0 || Math.abs(trigVal) < 1e-10) {
            return [
              { id: 'error', label: 'Domain Error', value: 'csc value cannot be 0', color: 'negative' as const },
            ];
          }
          if (Math.abs(trigVal) < 1) {
            return [
              { id: 'error', label: 'Domain Error', value: '|csc| must be ≥ 1 (since sin = 1/csc)', color: 'negative' as const },
            ];
          }
          principalAngle = toDegrees(Math.asin(1 / trigVal));
          principalAngleLabel = 'csc⁻¹(';
          referenceAngle = principalAngle >= 0 ? principalAngle : -principalAngle;
          break;
        case 'sec':
          if (trigVal === 0 || Math.abs(trigVal) < 1e-10) {
            return [
              { id: 'error', label: 'Domain Error', value: 'sec value cannot be 0', color: 'negative' as const },
            ];
          }
          if (Math.abs(trigVal) < 1) {
            return [
              { id: 'error', label: 'Domain Error', value: '|sec| must be ≥ 1 (since cos = 1/sec)', color: 'negative' as const },
            ];
          }
          principalAngle = toDegrees(Math.acos(1 / trigVal));
          principalAngleLabel = 'sec⁻¹(';
          referenceAngle = principalAngle >= 0 ? principalAngle : -principalAngle;
          break;
        case 'cot':
          if (trigVal === 0 || Math.abs(trigVal) < 1e-10) {
            return [
              { id: 'error', label: 'Domain Error', value: 'cot value cannot be 0 (would correspond to tan = ∞)', color: 'negative' as const },
            ];
          }
          principalAngle = toDegrees(Math.atan(1 / trigVal));
          principalAngleLabel = 'cot⁻¹(';
          referenceAngle = principalAngle >= 0 ? principalAngle : -principalAngle;
          break;
        default:
          return [];
      }

      const angleDisplay = formatAngle(principalAngle);
      const refDisplay = formatAngle(referenceAngle);

      return [
        {
          id: 'principalAngle',
          label: `${principalAngleLabel}${trigVal}) = Principal Angle`,
          value: angleDisplay,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'referenceAngle',
          label: 'Reference Angle',
          value: refDisplay,
        },
        {
          id: 'functionUsed',
          label: 'Inverse Function',
          value: func === 'csc' || func === 'sec' || func === 'cot'
            ? `θ = ${func}⁻¹(${trigVal})`
            : `θ = ${func}⁻¹(${trigVal})`,
        },
      ];
    }

    return [];
  },
  educational: {
    formula:
      'sinθ = opposite/hypotenuse | cosθ = adjacent/hypotenuse | tanθ = opposite/adjacent | cscθ = 1/sinθ | secθ = 1/cosθ | cotθ = 1/tanθ | θ = sin⁻¹(value) | θ = cos⁻¹(value) | θ = tan⁻¹(value)',
    formulaDescription:
      'Trigonometry is the branch of mathematics that studies relationships between angles and sides of triangles. The six trigonometric functions and their inverses allow you to convert between an angle and its trigonometric ratio. Sine, cosine, and tangent are the primary functions; cosecant, secant, and cotangent are their reciprocals. The inverse functions (arcsin, arccos, arctan) return the principal angle whose sine, cosine, or tangent equals a given value. These relationships are fundamental to geometry, physics, engineering, navigation, and wave analysis, forming the backbone of periodic and oscillatory phenomena modeling.',
    variables: [
      {
        symbol: 'θ',
        name: 'Angle (theta)',
        description: 'The angle measured in degrees from the positive x-axis. In this calculator, all angles are in degrees and are converted to radians internally for computation.',
      },
      {
        symbol: 'sinθ, cosθ, tanθ',
        name: 'Primary Trigonometric Functions',
        description: 'The three basic trigonometric functions: sine (opposite/hypotenuse), cosine (adjacent/hypotenuse), and tangent (opposite/adjacent). They relate an angle to side ratios of a right triangle.',
      },
      {
        symbol: 'cscθ, secθ, cotθ',
        name: 'Reciprocal Trigonometric Functions',
        description: 'The reciprocal functions: cosecant (1/sinθ), secant (1/cosθ), and cotangent (1/tanθ). They are undefined when their corresponding primary function equals zero.',
      },
      {
        symbol: 'sin⁻¹, cos⁻¹, tan⁻¹',
        name: 'Inverse Trigonometric Functions',
        description: 'The inverse functions (arcsine, arccosine, arctangent) return the principal angle whose sine, cosine, or tangent equals a given value. Their outputs are restricted to specific ranges.',
      },
      {
        symbol: 'π/180',
        name: 'Degree-to-Radian Conversion Factor',
        description: 'To convert degrees to radians, multiply by π/180. This factor arises because 360° = 2π radians, so 1° = π/180 radians. All JavaScript Math functions operate in radians.',
      },
    ],
    howToUse: [
      'Select the mode: "Angle → Trig Values" to compute all six trigonometric values from an angle, or "Trig Value → Angle" to find the principal angle from a trigonometric value.',
      'In Angle mode, enter any angle in degrees (e.g., 30, 45, 60, 90) and instantly see sin, cos, tan, csc, sec, and cot values with appropriate precision.',
      'In Trig Value mode, choose the trigonometric function (sin, cos, tan, csc, sec, or cot) and enter its numeric value. The calculator returns the principal angle and the reference angle.',
      'Pay attention to domain restrictions: sin and cos accept values only in [-1, 1], while tan accepts any real number. For csc and sec, the absolute value must be ≥ 1.',
      'Use the principal angle for the direct inverse result and the reference angle for understanding the acute-angle relationship in right triangle contexts.',
    ],
    quickReference: [
      { label: 'sin(30°) = 1/2', value: 'cos(30°) = √3/2 ≈ 0.8660' },
      { label: 'sin(45°) = √2/2 ≈ 0.7071', value: 'cos(45°) = √2/2 ≈ 0.7071' },
      { label: 'sin(60°) = √3/2 ≈ 0.8660', value: 'cos(60°) = 1/2' },
      { label: 'tan(45°) = 1', value: 'sin(90°) = 1, cos(90°) = 0' },
    ],
    commonUses: [
      'Right triangle solving: given one angle and one side, find all missing sides and angles using SOH CAH TOA, essential for construction, surveying, and navigation',
      'Physics and engineering: analyzing periodic motion such as pendulums, springs, waves (sound, light, water), and alternating current (AC) circuits where sinusoidal functions describe oscillation',
      'Computer graphics and game development: rotating objects, calculating distances and angles in 2D/3D space, and implementing camera movements using trigonometric transformations',
      'Navigation and GPS: converting between bearing angles and coordinate displacements, calculating great-circle distances on Earth\'s surface, and maritime/aviation heading corrections',
      'Architecture and structural engineering: calculating roof pitches, ramp slopes, load angles, and the forces acting on structural members at various angles of incidence',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="280" y="22" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Right Triangle Trigonometry — SOH CAH TOA</text>' +
        '<text x="280" y="40" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">The six trigonometric functions relate an acute angle to side ratios of a right triangle</text>' +
        '<rect x="20" y="55" width="520" height="290" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Right triangle -->' +
        '<polygon points="100,300 380,300 380,80" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/>' +
        '<!-- Right angle marker -->' +
        '<polyline points="365,300 365,285 380,285" fill="none" stroke="var(--svg-64748b)" stroke-width="1.5"/>' +
        '<!-- Hypotenuse label -->' +
        '<text x="230" y="175" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ef4444)" font-weight="700" transform="rotate(-39,230,175)">hypotenuse (h)</text>' +
        '<!-- Adjacent label -->' +
        '<text x="210" y="316" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-22c55e)" font-weight="700">adjacent (a)</text>' +
        '<!-- Opposite label -->' +
        '<text x="388" y="200" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-eab308)" font-weight="700" transform="rotate(90,388,200)">opposite (o)</text>' +
        '<!-- Angle arc -->' +
        '<path d="M 130,300 A 30,30 0 0,0 120.4,278.4" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="2"/>' +
        '<text x="105" y="290" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-8b5cf6)" font-weight="700">θ</text>' +
        '<!-- SOH CAH TOA formulas -->' +
        '<text x="55" y="80" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700">SOH:</text>' +
        '<text x="100" y="80" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)">sin θ = opposite / hypotenuse</text>' +
        '<text x="55" y="100" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700">CAH:</text>' +
        '<text x="100" y="100" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)">cos θ = adjacent / hypotenuse</text>' +
        '<text x="55" y="120" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700">TOA:</text>' +
        '<text x="100" y="120" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)">tan θ = opposite / adjacent</text>' +
        '<!-- Reciprocal formulas -->' +
        '<text x="55" y="155" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-64748b)">csc θ = 1 / sin θ = h / o</text>' +
        '<text x="55" y="175" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-64748b)">sec θ = 1 / cos θ = h / a</text>' +
        '<text x="55" y="195" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-64748b)">cot θ = 1 / tan θ = a / o</text>' +
        '<!-- Color legend -->' +
        '<rect x="55" y="220" width="12" height="12" rx="2" fill="var(--svg-ef4444)"/><text x="72" y="231" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)">Hypotenuse</text>' +
        '<rect x="160" y="220" width="12" height="12" rx="2" fill="var(--svg-22c55e)"/><text x="177" y="231" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)">Adjacent</text>' +
        '<rect x="265" y="220" width="12" height="12" rx="2" fill="var(--svg-eab308)"/><text x="282" y="231" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)">Opposite</text>' +
        '<!-- Inverse note -->' +
        '<text x="280" y="265" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Inverse functions: θ = sin⁻¹(o/h) = cos⁻¹(a/h) = tan⁻¹(o/a)</text>' +
        '<text x="280" y="285" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">The principal angle for sin⁻¹ and tan⁻¹ is in [−90°, 90°]; for cos⁻¹ it is in [0°, 180°]</text>' +
        '</svg>',
      alt: 'Right triangle diagram showing sides labeled opposite, adjacent, and hypotenuse with angle theta, along with SOH CAH TOA formulas for sine, cosine, tangent and their reciprocal functions',
      caption: 'The six trigonometric functions are defined as ratios of right triangle sides. SOH CAH TOA is a mnemonic for the three primary functions. The reciprocal functions are the multiplicative inverses.',
    },
    explanation:
      'Trigonometry is a fundamental branch of mathematics that deals with the relationships between angles and sides of triangles, particularly right triangles. The word comes from Greek "trigonon" (triangle) and "metron" (measure). At its core, trigonometry provides six functions that connect an angle to the ratios of triangle sides. The three primary functions are sine (sin), cosine (cos), and tangent (tan), commonly remembered by the mnemonic SOH CAH TOA: Sine = Opposite over Hypotenuse, Cosine = Adjacent over Hypotenuse, Tangent = Opposite over Adjacent. The three reciprocal functions are cosecant (csc = 1/sin), secant (sec = 1/cos), and cotangent (cot = 1/tan). These functions have specific domains and ranges: sine and cosine accept any real angle and return values between -1 and 1; tangent accepts any angle except odd multiples of 90° (where cos = 0) and returns all real numbers. The reciprocal functions have complementary domains: csc and sec are undefined for angles where sin or cos equal zero, and their absolute values are always greater than or equal to 1. The inverse trigonometric functions (arcsin, arccos, arctan) reverse this process, returning the principal angle for a given trigonometric value. Principal angles have restricted ranges: arcsin returns angles in [-90°, 90°], arccos in [0°, 180°], and arctan in (-90°, 90°). For example, sin(30°) = 1/2, so arcsin(1/2) = 30°, and the reference angle (the acute angle to the x-axis) is also 30°. For negative values, arcsin(-1/2) = -30°, but the reference angle (absolute value) remains 30°. Trigonometric functions are periodic: sine and cosine have periods of 360° (2π radians), while tangent has a period of 180° (π radians). This periodicity means there are infinitely many angles producing the same trigonometric value. The principal angle is the canonical representative, typically the one closest to 0°. Understanding these functions is essential for analyzing any phenomenon involving rotation, oscillation, waves, or periodic behavior, from the orbit of planets to the vibration of guitar strings to the analysis of alternating current in electrical engineering. Trigonometry also underpins the Fourier transform, a mathematical tool that decomposes complex signals into their constituent sinusoidal frequencies, which is fundamental to digital signal processing, image compression (JPEG), and audio analysis.',
    faqs: [
      {
        question: 'What is the difference between the principal angle and the reference angle?',
        answer: 'The principal angle is the angle returned by the inverse trigonometric function (arcsin, arccos, arctan), which has a restricted range to ensure a unique result. For arcsin and arctan, the principal angle is in [-90°, 90°]; for arccos, it is in [0°, 180°]. The reference angle is the acute angle (between 0° and 90°) that the terminal side of the angle makes with the x-axis. It is always non-negative and always between 0° and 90°. For example, if the principal angle is -30°, the reference angle is 30°. The reference angle is useful because the absolute values of trigonometric functions for any angle equal those of its reference angle, with only the sign depending on the quadrant.',
      },
      {
        question: 'Why do sin and cos only accept values between -1 and 1, while tan accepts any real number?',
        answer: 'Sine and cosine represent ratios of triangle sides where the numerator (opposite or adjacent) can never exceed the hypotenuse in magnitude. In the unit circle definition, sinθ and cosθ are the y and x coordinates of a point on the unit circle, which must satisfy x² + y² = 1 — therefore both coordinates are constrained to [-1, 1]. Tangent, however, equals sinθ/cosθ, and since cosθ approaches 0, the ratio can approach positive or negative infinity. For the reciprocal functions: csc = 1/sin and sec = 1/cos, so their absolute values must always be ≥ 1 (since |sin| ≤ 1 and |cos| ≤ 1). Cosecant cannot take values between -1 and 1.',
      },
      {
        question: 'What happens when I enter an angle like 90° or 0°?',
        answer: 'At 0°: sin(0) = 0, cos(0) = 1, tan(0) = 0. Cosecant (1/sin) is undefined because division by zero is not possible — there is no triangle with zero opposite side length relative to a non-zero hypotenuse. Secant (1/cos) = 1, and cotangent (1/tan) is also undefined. At 90°: sin(90) = 1, cos(90) = 0, tan(90) approaches ∞ (infinity). Secant (1/cos) is undefined at 90° because cos = 0, while cosecant (1/sin) = 1. The calculator clearly labels these as "Undefined" rather than returning an erroneous numeric value or crashing.',
      },
      {
        question: 'How are inverse trigonometric functions different from reciprocals?',
        answer: 'This is a common point of confusion. The inverse sine function, denoted sin⁻¹(x) or arcsin(x), returns the angle whose sine is x. It is NOT the same as (sin x)⁻¹ = 1/(sin x) = csc x. The superscript -1 for inverse functions denotes functional composition, not multiplicative inverse. For example, arcsin(1/2) = 30° (an angle), while csc(30°) = 1/sin(30°) = 2 (a ratio). To avoid this ambiguity, many textbooks use the "arc" prefix: arcsin, arccos, arctan. The calculator uses both notations for clarity.',
      },
      {
        question: 'Why does tan have asymptotes at 90° and 270°?',
        answer: 'Since tanθ = sinθ/cosθ, it is undefined whenever cosθ = 0. Cosine equals 0 at θ = 90° + n×180° for any integer n (i.e., 90°, 270°, -90°, etc.). At these angles, cos approaches 0 while sin approaches ±1, so the ratio sin/cos approaches ±∞. These are called vertical asymptotes. On a graph of y = tan(x), the function rapidly rises toward + ∞ just before the asymptote and reappears from -∞ just after it. This is why the inverse tangent function arctan has a range of (-90°, 90°) — it only returns one branch between two asymptotes.',
      },
    ],
    citations: [
      { source: 'Khan Academy - Trigonometry', url: 'https://www.khanacademy.org/math/trigonometry' },
      { source: 'Wolfram MathWorld - Trigonometric Functions', url: 'https://mathworld.wolfram.com/TrigonometricFunctions.html' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TrigPanel, { values, results });
  },
};

export default config;
