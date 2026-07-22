import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import InverseTrigPanel from './InverseTrigPanel';

const fmt = (n: number): string => {
  if (!isFinite(n)) return 'Infinity';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toFixed(8)).toString();
};

const functionMeta: Record<string, { label: string; domain: string; domainCheck: (v: number) => boolean; rangeDeg: string; compute: (v: number) => number }> = {
  arcsin: {
    label: 'arcsin',
    domain: '[-1, 1]',
    domainCheck: (v) => v >= -1 && v <= 1,
    rangeDeg: '[-90°, 90°]',
    compute: (v) => Math.asin(v),
  },
  arccos: {
    label: 'arccos',
    domain: '[-1, 1]',
    domainCheck: (v) => v >= -1 && v <= 1,
    rangeDeg: '[0°, 180°]',
    compute: (v) => Math.acos(v),
  },
  arctan: {
    label: 'arctan',
    domain: 'All real numbers',
    domainCheck: () => true,
    rangeDeg: '[-90°, 90°]',
    compute: (v) => Math.atan(v),
  },
};

const toDeg = (rad: number): number => rad * (180 / Math.PI);

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'function',
      label: 'Function',
      type: 'select',
      required: true,
      options: [
        { label: 'arcsin', value: 'arcsin' },
        { label: 'arccos', value: 'arccos' },
        { label: 'arctan', value: 'arctan' },
      ],
      helpText: 'Select the inverse trigonometric function to compute',
    },
    {
      id: 'value',
      label: 'Value',
      type: 'number',
      placeholder: 'Enter value',
      required: true,
      helpText: 'Enter a numeric value within the function domain',
    },
  ],
  calculate: (values) => {
    const func = values.function || 'arcsin';
    const value = parseFloat(values.value);

    if (isNaN(value)) return [];

    const meta = functionMeta[func];
    if (!meta) return [];

    if (!meta.domainCheck(value)) {
      return [
        {
          id: 'domainError',
          label: 'Domain Error',
          value: `${meta.label} is only defined for values in ${meta.domain}. The input ${fmt(value)} is outside this domain.`,
          color: 'negative' as const,
        },
      ];
    }

    const radians = meta.compute(value);
    const degrees = toDeg(radians);

    return [
      {
        id: 'degrees',
        label: 'Degrees',
        value: fmt(degrees) + '°',
        unit: '°',
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'radians',
        label: 'Radians',
        value: fmt(radians),
        color: 'neutral' as const,
      },
      {
        id: 'principalValue',
        label: 'Principal Value',
        value: `${fmt(degrees)}° (${fmt(radians)} rad)`,
        color: 'neutral' as const,
      },
      {
        id: 'domainCheck',
        label: 'Domain',
        value: `${meta.label}(${fmt(value)}) — value ${fmt(value)} is in ${meta.domain}. Principal value lies in ${meta.rangeDeg}.`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(InverseTrigPanel, { values, results });
  },
  educational: {
    formula: 'y = sin⁻¹(x)  |  y = cos⁻¹(x)  |  y = tan⁻¹(x)',
    formulaDescription:
      'Inverse trigonometric functions reverse the action of the standard trigonometric functions. If y = sin(θ), then θ = arcsin(y) returns the angle whose sine is y. Because trigonometric functions are periodic and not one-to-one over their entire domain, the inverse functions are defined on restricted domains to produce a unique principal value. arcsin has domain [-1, 1] and range [-90°, 90°]; arccos has domain [-1, 1] and range [0°, 180°]; arctan has domain all real numbers and range [-90°, 90°].',
    variables: [
      { symbol: 'arcsin(x)', name: 'Inverse sine (arcsine)', description: 'Returns the angle whose sine is x. Domain: [-1, 1]. Range: [-90°, 90°] (principal value).' },
      { symbol: 'arccos(x)', name: 'Inverse cosine (arccosine)', description: 'Returns the angle whose cosine is x. Domain: [-1, 1]. Range: [0°, 180°] (principal value).' },
      { symbol: 'arctan(x)', name: 'Inverse tangent (arctangent)', description: 'Returns the angle whose tangent is x. Domain: all real numbers. Range: [-90°, 90°] (principal value).' },
      { symbol: 'Principal value', name: 'Principal value', description: 'The unique angle within the restricted range that satisfies the inverse trigonometric equation. For arcsin(0.5), the principal value is 30°, not 150° (which also has sine 0.5).' },
    ],
    howToUse: [
      'Select the inverse trigonometric function you want to compute: arcsin (inverse sine), arccos (inverse cosine), or arctan (inverse tangent).',
      'Enter a numeric value. For arcsin and arccos, the value must be in the domain [-1, 1]. For arctan, any real number is accepted.',
      'The calculator returns the principal value in both degrees and radians. The principal value is the unique angle within the function\'s restricted range.',
      'If the input is outside the valid domain, a domain error message is shown explaining the restriction.',
    ],
    quickReference: [
      { label: 'arcsin(0) = 0°', value: 'sin⁻¹(0) = 0° = 0 rad' },
      { label: 'arcsin(1) = 90°', value: 'sin⁻¹(1) = 90° = π/2 rad' },
      { label: 'arccos(0) = 90°', value: 'cos⁻¹(0) = 90° = π/2 rad' },
      { label: 'arctan(1) = 45°', value: 'tan⁻¹(1) = 45° = π/4 rad' },
    ],
    commonUses: [
      'Solving trigonometric equations: finding unknown angles from known trigonometric ratios in geometry and physics problems',
      'Calculus and integration: inverse trig functions appear as antiderivatives of rational functions involving square roots, such as ∫(1/√(1-x²))dx = arcsin(x) + C',
      'Computer graphics: converting between coordinate representations, such as finding the angle of a vector from its x and y components using arctan2 (related to arctan)',
      'Navigation and robotics: computing heading angles from sensor readings and determining joint angles in robotic arm kinematics using inverse kinematics equations',
      'Signal processing: phase angle calculation in Fourier analysis, where the phase of a complex frequency component is found using arctan of the imaginary part over the real part',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="200" y="22" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Inverse Trigonometric Functions — Principal Values</text>' +
        '<text x="200" y="38" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">arcsin: blue | arccos: green | arctan: orange</text>' +
        '<rect x="10" y="48" width="380" height="222" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Axes -->' +
        '<line x1="50" y1="190" x2="350" y2="190" stroke="var(--svg-94a3b8)" stroke-width="1"/>' +
        '<line x1="200" y1="60" x2="200" y2="230" stroke="var(--svg-94a3b8)" stroke-width="1"/>' +
        '<!-- Axis labels -->' +
        '<text x="350" y="205" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="end">x</text>' +
        '<text x="210" y="65" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="start">y</text>' +
        '<!-- Scale markers -->' +
        '<text x="200" y="210" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0</text>' +
        '<text x="125" y="210" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">-1</text>' +
        '<text x="275" y="210" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">1</text>' +
        '<text x="88" y="210" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">-0.5</text>' +
        '<text x="312" y="210" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0.5</text>' +
        '<text x="208" y="115" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="start">90°</text>' +
        '<text x="208" y="265" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="start">-90°</text>' +
        '<text x="208" y="150" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="start">45°</text>' +
        '<text x="208" y="230" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="start">-45°</text>' +
        '<!-- arcsin curve (blue) domain [-1,1] -->' +
        '<path d="M 125 190 Q 162 150 200 115 Q 238 150 275 190" fill="none" stroke="var(--svg-2563eb)" stroke-width="2" stroke-linecap="round"/>' +
        '<text x="200" y="108" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="600" text-anchor="middle">arcsin(x)</text>' +
        '<!-- arccos curve (green) domain [-1,1] -->' +
        '<path d="M 125 115 Q 162 150 200 190 Q 238 150 275 115" fill="none" stroke="var(--svg-16a34a)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4,3"/>' +
        '<text x="285" y="108" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-16a34a)" font-weight="600" text-anchor="start">arccos(x)</text>' +
        '<!-- arctan curve (orange): approaches asymptotes -->' +
        '<path d="M 50 148 Q 100 165 150 178 Q 180 185 200 190" fill="none" stroke="var(--svg-d97706)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,4"/>' +
        '<path d="M 200 190 Q 220 195 250 202 Q 300 215 350 232" fill="none" stroke="var(--svg-d97706)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,4"/>' +
        '<text x="345" y="238" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-d97706)" font-weight="600" text-anchor="end">arctan(x)</text>' +
        '<!-- Dashed asymptote lines for arctan -->' +
        '<line x1="50" y1="115" x2="350" y2="115" stroke="var(--svg-d97706)" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>' +
        '<line x1="50" y1="265" x2="350" y2="265" stroke="var(--svg-d97706)" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>' +
        '</svg>',
      alt: 'Graph showing three inverse trigonometric functions plotted: arcsin(x) in blue on domain [-1,1] with range [-90°, 90°], arccos(x) in green on domain [-1,1] with range [0°, 180°], and arctan(x) in orange approaching horizontal asymptotes at ±90°',
      caption: 'Principal values of inverse trigonometric functions. arcsin and arctan range from -90° to 90°, while arccos ranges from 0° to 180°. arctan has horizontal asymptotes at ±90°.',
    },
    explanation:
      'Inverse trigonometric functions, also called arcus functions or cyclometric functions, are the inverse operations of the standard trigonometric functions sine, cosine, and tangent. They answer the question: given a trigonometric ratio, what angle produces it? For example, if sin(θ) = 0.5, then θ = arcsin(0.5) = 30 degrees (π/6 radians). Because trigonometric functions are periodic — they repeat their values at regular intervals — they are not one-to-one over their full domains. A one-to-one function is required for a well-defined inverse. To resolve this, each inverse trig function is defined on a restricted domain of the original function. For sine, the restricted domain is [-90°, 90°] (or [-π/2, π/2] radians), where sine is increasing and takes all values from -1 to 1 exactly once. The inverse of this restricted sine is arcsin (also written as sin⁻¹). For cosine, the restricted domain is [0°, 180°] (or [0, π] radians), where cosine is decreasing and covers all values from 1 to -1. The inverse of this restricted cosine is arccos (cos⁻¹). For tangent, the restricted domain is (-90°, 90°) (or (-π/2, π/2) radians), where tangent is increasing and takes all real values. The inverse of this restricted tangent is arctan (tan⁻¹). These restricted ranges are called the principal values. For example, arcsin(0.5) = 30° is the principal value, even though sin(150°) = 0.5 and sin(390°) = 0.5 as well. The principal value is always the unique angle within the restricted range. The notation sin⁻¹(x) is common but potentially confusing because it resembles 1/sin(x) = csc(x). To avoid ambiguity, the arcsin notation is preferred, where "arc" means "the arc (angle) whose sine is." The inverse trig functions have important relationships. For any x in [-1, 1]: arcsin(x) + arccos(x) = 90° (or π/2 radians), because the sine of an angle equals the cosine of its complement. The derivatives of inverse trig functions are important in calculus: d/dx arcsin(x) = 1/√(1-x²), d/dx arccos(x) = -1/√(1-x²), and d/dx arctan(x) = 1/(1+x²). These derivatives appear frequently in integration problems, making inverse trig functions essential tools in calculus.',
    faqs: [
      {
        question: 'What is the difference between arcsin(x) and sin⁻¹(x)?',
        answer: 'They are the same function written with different notation. arcsin(x) is preferred to avoid confusion with 1/sin(x) = csc(x) (cosecant). The "arc" prefix comes from the geometric interpretation: arcsin(x) gives the arc (angle) whose sine is x. In calculators, the notation sin⁻¹(x) is common, but mathematically it means the inverse function, not the reciprocal.',
      },
      {
        question: 'Why does arcsin have the domain [-1, 1]?',
        answer: 'The sine function only produces output values in the range [-1, 1]. Since the inverse function reverses the input-output relationship, arcsin can only accept inputs in [-1, 1] — these are the only values that sine can output. Any value outside this range has no real angle whose sine equals it, so arcsin is undefined there. For example, no real angle θ satisfies sin(θ) = 2.',
      },
      {
        question: 'What does "principal value" mean for inverse trig functions?',
        answer: 'The principal value is the unique angle returned by the inverse trig function within its restricted range. Since trigonometric functions are periodic, there are infinitely many angles with the same sine, cosine, or tangent. For example, sin(30°) = sin(150°) = sin(390°) = 0.5. The principal value of arcsin(0.5) is 30°, which is the angle in the restricted range [-90°, 90°]. The principal value convention ensures that each inverse trig function returns exactly one unambiguous result.',
      },
      {
        question: 'Can arcsin and arccos produce angles in degrees or radians?',
        answer: 'Both units are valid. The calculator returns results in both degrees and radians. In degree mode, arcsin(1) = 90° and arccos(0) = 90°. In radian mode, arcsin(1) = π/2 ≈ 1.5708 and arccos(0) = π/2. Most mathematical work uses radians because the derivative formulas are simpler in radians. For practical geometry and navigation, degrees are more intuitive.',
      },
    ],
    citations: [
      { source: 'Wikipedia — Inverse trigonometric functions', url: 'https://en.wikipedia.org/wiki/Inverse_trigonometric_functions' },
      { source: 'Wolfram MathWorld', url: 'https://mathworld.wolfram.com/InverseTrigonometricFunctions.html' },
    ],
  },
};

export default config;
