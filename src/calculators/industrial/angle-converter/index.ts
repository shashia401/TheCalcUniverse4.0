import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'deg', label: 'Degree (°)', shortLabel: '°', factor: 1 },
  { value: 'rad', label: 'Radian (rad)', shortLabel: 'rad', factor: 57.29577951308232 },
  { value: 'grad', label: 'Gradian (grad)', shortLabel: 'grad', factor: 0.9 },
  { value: 'arcmin', label: 'Minute of Arc (\')', shortLabel: '\'', factor: 1 / 60 },
  { value: 'arcsec', label: 'Second of Arc (")', shortLabel: '"', factor: 1 / 3600 },
  { value: 'turn', label: 'Full Circle (turn)', shortLabel: 'turn', factor: 360 },
  { value: 'mrad', label: 'Milliradian (mrad)', shortLabel: 'mrad', factor: 0.05729577951308232 },
  { value: 'point', label: 'Compass Point (1/32 of circle)', shortLabel: 'pt', factor: 11.25 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Angle conversion uses linear factors relative to the degree (°). Radians use the mathematical constant π (1 rad ≈ 57.296°). Gradians divide a right angle into 100 units (100 grad = 90°), used primarily in surveying and European engineering. Compass points divide the circle into 32 equal parts of 11.25° each for navigation.',
  variables: [
    { symbol: 'θ', name: 'Angle (theta)', description: 'The figure formed by two rays sharing a common endpoint, measured in degrees, radians, or gradians.' },
    { symbol: '1°', name: 'One Degree', description: '1/360 of a full rotation. The most common unit for everyday angle measurement.' },
    { symbol: '1 rad & 1 grad', name: 'Angular SI and Metric Units (Radian & Gradian)', description: 'Radian (≈57.296°): the SI unit for angular measurement, essential for calculus and physics. Gradian (1/400 of a circle): used in surveying and some European engineering, 100 grad = 90°.' },
  ],
  howToUse: [
    'Enter the angle value you want to convert in the "Value" field.',
    'Select the current angle unit from the "From" dropdown.',
    'Select the desired angle unit from the "To" dropdown.',
    'The converted value is displayed instantly with the formula. Use this for math homework, navigation, machining, or surveying work.',
    'Check the quick reference for common angle equivalents like 90° in radians, gradians, and arcminutes.',
  ],
  quickReference: [
    { label: '180°', value: 'π rad / 200 grad / ½ turn' },
    { label: '90°', value: 'π/2 rad / 100 grad / ¼ turn' },
    { label: '1 rad', value: '57.296° / 63.662 grad' },
    { label: '1°', value: '0.01745 rad / 1.111 grad' },
    { label: '1°', value: '60 arcminutes / 3,600 arcseconds' },
    { label: '1 arcmin', value: '1/60° / 0.0167°' },
    { label: '1 mrad', value: '0.0573° / 3.438 arcmin' },
    { label: '1 compass point', value: '11.25°' },
  ],
  commonUses: [
    'Navigation: 90° is east, 180° is south, 270° is west (compass bearings)',
    'Roof pitch: a 6/12 roof has a 26.6° slope',
    'Rifle scope: 1 mrad ≈ 3.6 inches at 100 yards / 10 cm at 100 m',
    'Astronomy: Moon diameter ≈ 0.5° (30 arcminutes)',
    'Surveying: theodolites measure to sub-arcsecond precision',
    'Machining: CNC rotary tables use degrees, gradians, or decimal degrees',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Angle Types &amp; Units of Measurement</text>' +
      '<line x1="15" y1="100" x2="80" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<line x1="15" y1="100" x2="65" y2="55" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<path d="M 22 100 Q 40 85 35 70" fill="none" stroke="var(--svg-ef4444)" stroke-width="1"/>' +
      '<text x="47" y="92" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ef4444)" text-anchor="middle">30&deg;</text>' +
      '<text x="47" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Acute</text>' +
      '<line x1="95" y1="100" x2="145" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<line x1="95" y1="100" x2="95" y2="55" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<rect x="95" y="85" width="10" height="10" fill="none" stroke="var(--svg-ef4444)" stroke-width="1"/>' +
      '<text x="120" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Right (90&deg;)</text>' +
      '<line x1="175" y1="100" x2="235" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<line x1="175" y1="100" x2="230" y2="55" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<path d="M 182 100 Q 210 90 217 72" fill="none" stroke="var(--svg-ef4444)" stroke-width="1"/>' +
      '<text x="205" y="92" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ef4444)" text-anchor="middle">120&deg;</text>' +
      '<text x="205" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Obtuse</text>' +
      '<line x1="270" y1="100" x2="350" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<path d="M 290 100 Q 330 40 350 100" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<path d="M 285 100 Q 310 70 315 82" fill="none" stroke="var(--svg-ef4444)" stroke-width="1"/>' +
      '<text x="310" y="68" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ef4444)" text-anchor="middle">210&deg;</text>' +
      '<text x="310" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Reflex</text>' +
      '<text x="415" y="70" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)">360&deg; = 2&pi; rad</text>' +
      '<text x="415" y="84" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)">= 400 grad</text>' +
      '<text x="415" y="98" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)">= 1 turn</text>' +
      '</svg>',
    alt: 'Four angle types illustrated: acute, right, obtuse, and reflex with degree measurements',
    caption: 'A full circle = 360° = 2π rad = 400 grad = 1 turn',
  },
  explanation:
    'Angles are measured in several units depending on the field and region. Degrees (360° per circle) are the everyday standard — used in navigation (compass bearings), construction (roof pitch), and education. Radians are the mathematical standard — 2π radians equals a full circle — and are essential for calculus, trigonometry, and physics because radian measure simplifies derivative and integral formulas. Gradians (400 per circle) divide the right angle into 100 parts, making decimal calculations easier in surveying and some European engineering fields. Milliradians (mrad) are used in rifle scopes and artillery for range estimation — 1 mrad subtends approximately 1 meter at 1,000 meters distance. Arcminutes (60 per degree) and arcseconds (3,600 per degree) are used in astronomy and optics for measuring extremely small angles — the angular diameter of the Moon is about 30 arcminutes (0.5°). Compass points (32 per circle) were the standard for maritime navigation before modern instruments.',
  faqs: [
    {
      question: 'Why do mathematicians use radians instead of degrees?',
      answer: 'Radians make calculus work elegantly. The derivative of sin(x) is cos(x) ONLY when x is in radians. In degrees, the derivative would include a factor of π/180 everywhere, making formulas messy. Similarly, many physics formulas (angular velocity, centripetal force) are simpler in radians: ω = 2πf, where ω is angular velocity in rad/s and f is frequency in Hz. In degrees, this would be ω = 360f, and the factor 360 would appear in every related formula. Despite being less intuitive, radians are mathematically "natural."',
    },
    {
      question: 'How do I convert between degrees and radians?',
      answer: 'Multiply degrees by π/180 ≈ 0.017453 to get radians. Multiply radians by 180/π ≈ 57.2958 to get degrees. Common conversions: 0° = 0 rad, 30° = π/6 ≈ 0.524 rad, 45° = π/4 ≈ 0.785 rad, 60° = π/3 ≈ 1.047 rad, 90° = π/2 ≈ 1.571 rad, 180° = π ≈ 3.142 rad, 360° = 2π ≈ 6.283 rad. For quick mental conversions, multiply degrees by 0.0175 (roughly) or divide radians by 0.0175.',
    },
    {
      question: 'What is a gradian used for?',
      answer: 'Gradians (400 per circle, 100 per right angle) are used in surveying, civil engineering, and some European mapping. Their advantage: a right angle = 100 grad, making decimal calculations natural. Slope = rise/run and can be expressed as a percentage directly. France uses the "grade" system for some land surveying applications. Most scientific calculators support a "Grad" mode alongside Deg and Rad. The term "gon" is the modern name for gradian in international standards (ISO 31-1).',
    },
    {
      question: 'How are arcminutes and arcseconds used in astronomy?',
      answer: 'Arcminutes (\') and arcseconds (") measure tiny angles. The full Moon is about 30 arcminutes (0.5°) across. The angular resolution of the human eye is about 1 arcminute. Telescope resolution is measured in arcseconds — a good amateur telescope can resolve 1-2 arcseconds. The nearest star (Proxima Centauri) has a parallax of about 0.77 arcseconds — this is how we measure stellar distances. One arcsecond at 1 km is about 4.85 mm, at 1 AU (Earth-Sun distance) it is about 725 km.',
    },
    {
      question: 'How does angle measurement work in navigation and shooting?',
      answer: 'Navigation uses degrees with cardinal points (N, NE, E, etc.) and precise bearings from 0-360° true north. The 32-point compass system divides the circle into 32 "points" of 11.25° each (N, NbE, NNE, NEbN, NE, etc.). In rifle scopes, milliradians (mrad) are used for range estimation: 1 mrad subtends 0.1 m at 100 m, or 10 cm. A 1.8 m tall target that spans 5 mrad in the scope: range = 1.8 × 1000 ÷ 5 = 360 m. This system makes rapid range estimation possible without a rangefinder.',
    },
  ],

  citations: [
    { source: 'NIST - Angle Measurement', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
    { source: 'ISO - GPS Standards', url: 'https://www.iso.org/standard/30669.html' },
  ],
  workedExamples: [
    {
      scenario: 'A calculus student is finding the derivative of sin(x) at x = 60 degrees. They need to convert 60 degrees to radians first because the derivative formula d/dx(sin(x)) = cos(x) only holds when x is in radians.',
      inputs: { value: '60', from: 'deg', to: 'rad' },
      result: '60° = π/3 rad ≈ 1.047197551 rad. The derivative cos(60°) = 0.5 in degree measure, but using radians: cos(π/3) = 0.5 as well (coincidence for this particular angle).',
      insight: 'The 60-degree case is a lucky coincidence — both degree and radian cosines give 0.5 because cos(60°) = cos(π/3) = 0.5. But for most angles, the derivative computed directly in degrees gives wrong answers. For example, the slope of sin(x) at x = 30° computed in degrees is cos(30°) ≈ 0.8660 per degree, but the true rate of change is 0.8660 × (π/180) ≈ 0.0151 per degree. This scaling factor of π/180 appears throughout calculus when working in degrees, which is why radians are the "natural" unit.',
    },
    {
      scenario: 'A surveyor in France is measuring land parcels using a theodolite that displays gradians (gons). The parcel boundary has a 135-grad turn. The surveyor needs this in degrees for a report to an international client who uses degrees.',
      inputs: { value: '135', from: 'grad', to: 'deg' },
      result: '135 grad = 121.5°. Since 100 grad = 90°, quick conversion: 135 / 100 x 90 = 121.5°. This is an obtuse angle, confirmed by expected behavior on the theodolite.',
      insight: 'The gradian system makes mental arithmetic with right angles simple. Every 100 grad = 90°, so 135 grad = 1.35 right angles = 121.5°. French surveyors and some European engineers prefer gradians because dividing a right angle into 100 metric gradians (centigrads) and each gradian into 100 centigrads makes decimal calculations natural — similar to how metric distances beat imperial for calculation. The conversion to degrees is straightforward but error-prone without a converter since most people are unfamiliar with gradians.',
    },
    {
      scenario: 'A long-range competitive shooter needs to adjust their scope for a 850-meter shot. Their scope uses 0.1 mrad clicks. The bullet drops 2.8 meters at 850 meters. How many clicks of elevation adjustment are needed? Also, what is the equivalent angle in arcminutes for a scope that uses MOA adjustments?',
      inputs: { value: '3.294', from: 'mrad', to: 'arcmin' },
      result: 'Drop angle = arctan(2.8/850) = 3.294 mrad. To adjust the scope: 3.294 / 0.1 = 32.94 clicks (round to 33 clicks). In MOA: 3.294 mrad = 11.32 arcminutes. For a 1/4 MOA scope: 11.32 / 0.25 = 45.3 clicks (round to 45).',
      insight: 'Milliradians and MOA are both angular measurement systems used in precision shooting, but they are fundamentally different. 1 mrad subtends exactly 10 cm at 100 meters or 3.6 inches at 100 yards. 1 MOA subtends approximately 2.9 cm at 100 meters or 1.047 inches at 100 yards. For the 850-meter shot, the mrad scope needs 33 clicks while the MOA scope needs 45 clicks to achieve the same correction. This illustrates why many long-range shooters prefer mrad — the math is simpler (base-10) and fewer clicks are needed for the same correction at distance. The 0.1 mrad click value was originally a military standard (one "mil" or "NATO mil") and has been adopted by most tactical scope manufacturers.',
    },
  ],
  proTips: [
    'For quick radian estimates, remember that 1 radian ≈ 57.3°. Then divide common angles: 30° ≈ 0.52 rad (π/6), 45° ≈ 0.79 rad (π/4), 90° ≈ 1.57 rad (π/2). Memorizing these 5 angles (30, 45, 60, 90, 180 degrees in radians) covers 90% of trigonometry problems.',
    'In rifle scope adjustments: MRAD scopes use 0.1 mrad clicks (1 cm at 100 m), while MOA scopes typically use 1/4 MOA clicks (0.7 cm at 100 m). To convert between systems: 1 mrad = 3.438 MOA. A 1.5 mrad adjustment = 5.16 MOA. Mixing MRAD reticles with MOA turrets (or vice versa) is a common and costly mistake — always match your reticle and turret units.',
    'Surveying theodolites often measure in gradians (gons). To convert a gradian bearing to degrees mentally: divide by 100 and multiply by 90. 350 grad = 3.5 x 90 = 315°. Also, 1 grad = 0.9°, so 350 x 0.9 = 315°. This 0.9 factor is the key to all gradian-degree conversions.',
    'Astronomical resolution limits: The Hubble Space Telescope resolves about 0.05 arcseconds. The human eye resolves about 60 arcseconds (1 arcminute). The James Webb Space Telescope resolves about 0.1 arcseconds at 2 microns. A ground-based 8-meter telescope with adaptive optics resolves about 0.03 arcseconds. When you see claims of "the sharpest image ever taken," convert the angular resolution to arcseconds and compare to these benchmarks.',
    'When converting angles for CAD/CAM work, be aware that most software uses decimal degrees internally. 30° 15\' 45" = 30 + 15/60 + 45/3600 = 30.2625°. Failing to convert DMS (degrees-minutes-seconds) to decimal degrees is a common source of CNC machining errors — an offset of 30\' (0.5°) on a 200 mm part produces ~1.75 mm of positional error.',
  ],
  limitations: [
    'This converter performs mathematical unit conversion using standard conversion factors. It does NOT handle: angular velocity or acceleration conversions (degrees/second to radians/second requires separate dynamics calculations); negative angles that wrap around 360° — -30° and 330° are the same physical angle but the converter treats them as mathematically different values; angle normalization to principal ranges (0-360° or -180° to +180°).',
    'In navigation, compass bearings use 0-360° clockwise from true north, while mathematics conventionally measures angles counterclockwise from the positive x-axis. A 90° compass bearing (east) is a 0° mathematical angle. A 180° compass bearing (south) is a 270° mathematical angle. This converter does NOT perform the navigation-to-mathematical coordinate transformation — use the appropriate offset (subtract from 90°) before converting.',
    'Angles in astronomy are often expressed in sexagesimal format (DD:MM:SS) or decimal degrees. The arcminute and arcsecond units in this converter are fractional degrees (1 arcminute = 1/60°, 1 arcsecond = 1/3600°). For sexagesimal input like "30° 15\' 45"", convert to decimal degrees first (30 + 15/60 + 45/3600 = 30.2625°) before using this converter.',
    'In precision engineering, angle measurements at the arcsecond level require thermal compensation — a 1-meter steel bar expands approximately 0.012 mm per degree Celsius. An angular measurement to arcsecond precision (1/3600 degree) is meaningless if the object\'s temperature is not controlled or measured. This converter gives mathematical precision up to 6 decimal places, but physical measurement precision is limited by the measurement instrument and environmental conditions.',
  ],
};

const converterConfig = createConverter({ units: UNITS, educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  inputs: converterConfig.inputs.map((input) =>
    input.id === 'value' ? { ...input, inputMode: 'decimal' as const } : input,
  ),
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Angle Conversion' });
  },
};
export default configWithPanel;
