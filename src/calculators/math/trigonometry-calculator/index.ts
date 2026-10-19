import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TrigPanel from './TrigPanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { type TrigValues, degreesFromRadians, parseDegrees, piFraction, reduceDegrees, referenceAngle, toFloat, trigAt } from './trigMath';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

type Unit = 'deg' | 'rad';

/** Value text: 8 decimals, but tiny non-zero values keep 6 significant digits instead of rounding to 0. */
const fmt = (v: number): string => {
  if (v === 0) return '0';
  if (Math.abs(v) < 1e-4) return String(Number(v.toPrecision(6)));
  return String(parseFloat(v.toFixed(8)));
};
const UNDEF = (what: string) => `Undefined (${what})`;

const angleText = (deg: number, unit: Unit): string => {
  const d = Math.abs(deg) < 1e-9 ? 0 : deg;
  const degTxt = `${fmt(d)}°`;
  const radTxt = `${fmt((d * Math.PI) / 180)} rad`;
  return unit === 'rad' ? radTxt : degTxt;
};


/** Result rows for "trig value -> angle". `deg` is the principal value in degrees. */
function trigToAngleRows(func: string, deg: number, v: number, unit: Unit, label = `${func}⁻¹(`): CalculatorResult[] {
  const mod = (x: number) => ((x % 360) + 360) % 360;
  const alpha = deg;
  const family = func === 'sin' || func === 'csc' ? [alpha, 180 - alpha] : func === 'cos' || func === 'sec' ? [alpha, -alpha] : [alpha, alpha + 180];
  const norm = family.map(mod).map((x) => (Math.abs(x - 360) < 1e-9 ? 0 : x)).sort((a, b) => a - b);
  const uniq = norm.filter((x, i) => i === 0 || Math.abs(x - norm[i - 1]) > 1e-9);
  const exact = piFraction(deg);
  const rows: CalculatorResult[] = [
    { id: 'principalAngle', label: `${label}${v}) = Principal Angle`, value: angleText(deg, unit), highlight: true, color: 'positive' },
    { id: 'referenceAngle', label: 'Reference Angle', value: angleText(referenceAngle(mod(deg)), unit) },
    { id: 'functionUsed', label: 'Inverse Function', value: `θ = ${func}⁻¹(${v})` },
  ];
  if (exact !== null) rows.push({ id: 'exactValue', label: 'Exact value', value: `${exact === '0' ? '0' : exact} rad = ${fmt(deg)}°` });
  rows.push({
    id: 'allAngles',
    label: 'All angles in one turn',
    value: `θ = ${uniq.map((x) => angleText(x, unit)).join(' or ')}  (0° ≤ θ < 360°)`,
  });
  rows.push({ id: '_angleDeg', label: 'angle', value: String(mod(deg)) });
  return rows;
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
      id: 'angleUnit',
      label: 'Angle unit',
      type: 'select',
      defaultValue: 'deg',
      options: [
        { label: 'Degrees (°)', value: 'deg' },
        { label: 'Radians (rad)', value: 'rad' },
      ],
      helpText: 'Unit of the angle you enter (angle → trig) or of the angle in the answer (trig → angle)',
    },
    {
      id: 'angle',
      label: 'Angle',
      type: 'number',
      placeholder: 'Enter angle',
      showWhen: (v) => v.mode === 'angle-to-trig',
      helpText: 'Enter the angle in the unit chosen above. Any size and sign is fine (e.g. -45, 750).',
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
    const unit: Unit = values.angleUnit === 'rad' ? 'rad' : 'deg';
    if (!mode) return [];

    if (mode === 'angle-to-trig') {
      const raw = parseNumberStrict(values.angle);
      if (!Number.isFinite(raw)) return [];

      // Degrees are reduced modulo 360 exactly; radians go through floating point (snapped to special angles).
      let normDeg: number;
      let shownDeg: number;
      if (unit === 'deg') {
        const exact = parseDegrees(values.angle);
        if (!exact) return [];
        normDeg = toFloat(reduceDegrees(exact));
        shownDeg = raw;
      } else {
        shownDeg = degreesFromRadians(raw);
        normDeg = ((shownDeg % 360) + 360) % 360;
        if (!Number.isFinite(shownDeg)) return [];
      }
      const t: TrigValues = trigAt(normDeg);

      const row = (id: string, label: string, v: number | null, why: string, extra: Partial<CalculatorResult> = {}): CalculatorResult =>
        v === null ? { id, label, value: UNDEF(why) } : { id, label, value: fmt(v), ...extra };

      const out: CalculatorResult[] = [
        row('sin', 'sin(θ)', t.sin, '', { highlight: true, color: t.sin >= 0 ? 'positive' : 'negative' }),
        row('cos', 'cos(θ)', t.cos, ''),
        row('tan', 'tan(θ)', t.tan, 'cos = 0'),
        row('csc', 'csc(θ) = 1/sin(θ)', t.csc, 'sin = 0'),
        row('sec', 'sec(θ) = 1/cos(θ)', t.sec, 'cos = 0'),
        row('cot', 'cot(θ) = 1/tan(θ)', t.cot, 'sin = 0'),
        { id: 'quadrant', label: 'Quadrant', value: t.quadrant },
        { id: 'referenceAngle', label: 'Reference angle', value: angleText(t.refDeg, unit) },
        { id: 'normalizedAngle', label: 'Coterminal angle in [0°, 360°)', value: angleText(t.normDeg, unit) },
      ];
      // cot has an exact meaning at tan = 0? No: cot(90°) = 0 (cos/sin), tan(90°) undefined.
      if (t.exact) {
        out.push({
          id: 'exactValues',
          label: 'Exact values',
          value: `sin = ${t.exact.sin}, cos = ${t.exact.cos}, tan = ${t.exact.tan ?? 'not defined'}`,
        });
      }
      out.push({ id: '_angleDeg', label: 'angle', value: String(shownDeg) });
      return out;
    }

    if (mode === 'trig-to-angle') {
      const func = values.function;
      const v = parseNumberStrict(values.trigValue);
      if (!func || !Number.isFinite(v)) return [];
      const err = (m: string): CalculatorResult[] => [{ id: 'error', label: 'Domain Error', value: m, color: 'negative' }];

      let rad: number;
      let label: string;
      switch (func) {
        case 'sin':
          if (v < -1 || v > 1) return err('sin value must be in [-1, 1]');
          [rad, label] = [Math.asin(v), 'sin⁻¹('];
          break;
        case 'cos':
          if (v < -1 || v > 1) return err('cos value must be in [-1, 1]');
          [rad, label] = [Math.acos(v), 'cos⁻¹('];
          break;
        case 'tan':
          [rad, label] = [Math.atan(v), 'tan⁻¹('];
          break;
        case 'csc':
          if (v === 0) return err('csc value cannot be 0');
          if (Math.abs(v) < 1) return err('|csc| must be ≥ 1 (since sin = 1/csc)');
          [rad, label] = [Math.asin(1 / v), 'csc⁻¹('];
          break;
        case 'sec':
          if (v === 0) return err('sec value cannot be 0');
          if (Math.abs(v) < 1) return err('|sec| must be ≥ 1 (since cos = 1/sec)');
          [rad, label] = [Math.acos(1 / v), 'sec⁻¹('];
          break;
        case 'cot':
          if (v === 0) return [
            // cot x = 0 is solvable (x = 90°): cot⁻¹(0) = 90° with the (−90°, 90°] convention; atan(1/0) = atan(∞).
            ...trigToAngleRows('cot', 90, v, unit),
          ];
          [rad, label] = [Math.atan(1 / v), 'cot⁻¹('];
          break;
        default:
          return [];
      }
      return trigToAngleRows(func, degreesFromRadians(rad), v, unit, label);
    }

    return [];
  },
  explainSteps: (values) => {
    const rows = config.calculate(values);
    if (!hasAnswer(rows)) return [];
    const g = (id: string) => resultValue(rows, id) ?? '';
    if (values.mode === 'angle-to-trig') {
      const exact = g('exactValues');
      return [
        { label: 'Reduce the angle to one turn (0° up to 360°)', expr: `${(values.angle ?? '').trim()}${values.angleUnit === 'rad' ? ' rad' : '°'} ≡ ${g('normalizedAngle')}` },
        { label: 'Find the quadrant and the reference angle', expr: `${g('quadrant')};  reference angle = ${g('referenceAngle')}` },
        { label: 'Read sin, cos and tan from the reference angle and the signs of the quadrant', expr: `sin = ${g('sin')},  cos = ${g('cos')},  tan = ${g('tan')}` },
        { label: 'The reciprocal functions are 1 divided by those', expr: `csc = ${g('csc')},  sec = ${g('sec')},  cot = ${g('cot')}` },
        ...(exact ? [{ label: 'Exact values for this special angle', expr: exact }] : []),
      ];
    }
    if (values.mode === 'trig-to-angle') {
      const reciprocal = ['csc', 'sec', 'cot'].includes(values.function);
      const exact = g('exactValue');
      return [
        {
          label: 'Apply the inverse function to get the principal angle',
          expr: `${g('functionUsed')}  →  ${g('principalAngle')}`,
          ...(reciprocal ? { note: 'csc, sec and cot are handled through their reciprocals (sin, cos, tan).' } : {}),
        },
        { label: 'Reference angle', expr: g('referenceAngle') },
        { label: 'Other angles with the same value within one turn', expr: g('allAngles') },
        ...(exact ? [{ label: 'Exact value', expr: exact }] : []),
      ];
    }
    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TrigPanel, { values, results });
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
        description: 'The angle measured from the positive x-axis, in degrees or radians (choose the unit). Degree input is reduced modulo 360° exactly, so 750° behaves as 30° and multiples of 15° give exact radical values.',
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
        answer: 'The principal angle is the angle returned by the inverse trigonometric function (arcsin, arccos, arctan), which has a restricted range to ensure a unique result. For arcsin and arctan, the principal angle is in [-90°, 90°]; for arccos, it is in [0°, 180°]. The reference angle is the acute angle (between 0° and 90°) that the terminal side of the angle makes with the x-axis. It is always non-negative and always between 0° and 90°. For example, if the principal angle is -30°, the reference angle is 30°; for cos⁻¹(-0.5) = 120° the reference angle is 60° (180° − 120°), not 120°. The reference angle is useful because the absolute values of trigonometric functions for any angle equal those of its reference angle, with only the sign depending on the quadrant.',
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
};

export default config;
