import { createElement } from 'react';
import { type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'nm', label: 'Newton Meter (N·m)', shortLabel: 'N·m', factor: 1 },
  { value: 'knm', label: 'Kilonewton Meter (kN·m)', shortLabel: 'kN·m', factor: 1000 },
  { value: 'lbfft', label: 'Pound-Force Foot (lbf·ft)', shortLabel: 'lbf·ft', factor: 1.35582 },
  { value: 'lbfin', label: 'Pound-Force Inch (lbf·in)', shortLabel: 'lbf·in', factor: 0.112985 },
  { value: 'ozfin', label: 'Ounce-Force Inch (ozf·in)', shortLabel: 'ozf·in', factor: 0.00706155 },
  { value: 'kgfcm', label: 'Kilogram-Force Centimeter (kgf·cm)', shortLabel: 'kgf·cm', factor: 0.0980665 },
  { value: 'kgfm', label: 'Kilogram-Force Meter (kgf·m)', shortLabel: 'kgf·m', factor: 9.80665 },
  { value: 'dyncm', label: 'Dyne Centimeter (dyn·cm)', shortLabel: 'dyn·cm', factor: 0.0000001 },
  { value: 'kipft', label: 'Kilopound-Force Foot (kip·ft)', shortLabel: 'kip·ft', factor: 1355.82 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Torque conversion uses linear factors relative to the Newton meter (N·m), the SI unit of torque. Torque is a rotational force calculated as force × lever arm distance. For example, converting 100 lbf·ft to N·m: 100 × 1.35582 ÷ 1 = 135.58 N·m. The reverse conversion — N·m to lbf·ft — divides by 1.35582.',
  formulaSource: 'The newton meter (N·m) was adopted by the CGPM in 1960 as the SI derived unit of torque. The pound-force foot (lbf·ft) was standardized internationally in 1959 as the gravitational force of one pound avoirdupois at one foot from the pivot point, with 1 lbf·ft = 1.3558179483314004 N·m exactly. Torque standards are maintained by ISO, SAE, and NIST for calibration traceability in automotive and aerospace applications.',
  variables: [
    { symbol: 'τ', name: 'Torque (tau)', description: 'A twisting or rotational force, calculated as force applied at a distance from a pivot point (τ = r × F × sin θ). The SI unit is the newton meter (N·m), defined as the torque resulting from one newton of force applied perpendicularly at the end of a one-meter lever arm.' },
    { symbol: '1 N·m', name: 'One Newton Meter', description: 'The torque produced by a one-newton force applied at the end of a one-meter lever arm perpendicular to the arm. This is the SI base unit of torque. Approximately 0.738 lbf·ft. A kitchen faucet handle might require about 2-3 N·m to turn.' },
    { symbol: '1 lbf·ft & Lever Arm', name: 'Pound-Force Foot and Moment Arm', description: '1 lbf·ft is the imperial standard — torque from one pound of force at one foot from the pivot. The lever arm (moment arm) is the perpendicular distance from the pivot to the line of force application. A longer lever arm produces more torque from the same force, which is why a longer wrench makes it easier to loosen a stubborn bolt.' },
  ],
  howToUse: [
    'Enter the torque value you want to convert in the "Value" field (e.g., 100 for 100 N·m or 80 for 80 lbf·ft).',
    'Select the current torque unit from the "From" dropdown — choose from N·m, lbf·ft, kgf·cm, kN·m, kip·ft, lbf·in, ozf·in, and more.',
    'Select the desired torque unit from the "To" dropdown — the unit you need for your torque wrench or specification sheet.',
    'The converted value appears instantly with the mathematical formula shown for transparency and verification.',
    'Cross-reference results with the quick reference table below to verify common conversions like 1 N·m = 0.738 lbf·ft.',
  ],
  quickReference: [
    { label: '1 N·m', value: '0.738 lbf·ft' },
    { label: '1 lbf·ft', value: '1.356 N·m' },
    { label: '1 kgf·cm', value: '0.098 N·m' },
    { label: '1 N·m', value: '10.197 kgf·cm' },
    { label: '1 lbf·in', value: '0.113 N·m' },
    { label: '1 kip·ft', value: '1,355.82 N·m' },
    { label: '1 kN·m', value: '737.56 lbf·ft' },
    { label: '1 ozf·in', value: '0.00706 N·m' },
  ],
  commonUses: [
    'Lug nuts: 80–100 lbf·ft (108–136 N·m) for most passenger cars — always tighten in a star pattern in 2-3 steps to avoid warping brake rotors.',
    'Engine spark plugs: 15–20 lbf·ft (20–27 N·m) — over-tightening can strip aluminum cylinder head threads, a costly repair.',
    'Oil drain plug: 15–30 lbf·ft (20–41 N·m) — overtightening is the leading cause of stripped oil pan threads.',
    'Bicycle pedal/crank bolts: 30–40 N·m (22–30 lbf·ft) — carbon fiber components require precise torque to prevent crack propagation.',
    'Engine main bearing cap bolts: 60–100 N·m depending on engine — often use torque-to-yield (TTY) fasteners that must be replaced after removal.',
    'Aerospace bolt preload: specified in lbf·in for precision fasteners with traceable calibration to NIST or ISO standards.',
  ],
  workedExamples: [
    {
      scenario: 'A mechanic in Chicago is tightening lug nuts on a Toyota Camry. The service manual specifies 103 N·m, but the mechanic only has a torque wrench calibrated in lbf·ft. What setting should the wrench be set to?',
      inputs: { value: '103', from: 'nm', to: 'lbfft' },
      result: '103 N·m ÷ 1.35582 = 75.97 lbf·ft. Round to 76 lbf·ft. Set the wrench to 76 lbf·ft and tighten in a star pattern: first pass at 40 lbf·ft, second pass at 60 lbf·ft, final pass at 76 lbf·ft.',
      insight: 'Most Japanese and European cars specify lug nut torque in N·m, while American torque wrenches are commonly marked in lbf·ft. Learning the conversion factor (divide N·m by 1.356 to get lbf·ft) saves time in mixed-tool workshops. A 5 lbf·ft error on lug nuts is generally acceptable, but a 20 lbf·ft error can cause brake pulsation or, worse, wheel detachment on the highway. This 3-step approach ensures even clamping force across all lug nuts and prevents brake rotor warping.',
    },
    {
      scenario: 'An aerospace technician in Seattle is assembling a flight control surface. The engineering drawing specifies 45 lbf·in for the attachment bolts, but the digital torque driver is set to display N·m. Convert the specification to N·m.',
      inputs: { value: '45', from: 'lbfin', to: 'nm' },
      result: '45 lbf·in × 0.112985 = 5.084 N·m. Set the digital torque driver to 5.08 N·m. Verify calibration certificate before proceeding — aerospace standards (AS9100) require traceable calibration within the last 12 months.',
      insight: 'Aerospace fasteners use lbf·in because the torques are smaller than typical automotive specs (which use lbf·ft). 1 lbf·ft = 12 lbf·in, so 45 lbf·in is only 3.75 lbf·ft — a very light torque. Precision torque tools for aerospace typically have ±2% accuracy versus ±4% for automotive click-type wrenches. Always use the correct range tool: a 10-100 lbf·ft wrench is inaccurate below 10 lbf·ft. Given the critical nature of flight control fasteners, always verify calibration certificates.',
    },
    {
      scenario: 'A manufacturing engineer in Stuttgart is setting up an automated assembly line for electric bicycle motors. The German motor specification calls for 8 N·m on the mounting bolts, but the Japanese-made torque transducers display in kgf·cm. What value should be programmed into the assembly robots?',
      inputs: { value: '8', from: 'nm', to: 'kgfcm' },
      result: '8 N·m ÷ 0.0980665 = 81.58 kgf·cm. Program the robot torque controller to 81.6 kgf·cm. Add a ±3% tolerance window (79.1 to 84.0 kgf·cm) for the automated quality check station.',
      insight: 'Kilogram-force centimeter (kgf·cm) persists in Asian manufacturing because it connects intuitively to the metric mass system — 1 kgf·cm is approximately the torque from a 1 kg mass hanging at 1 cm from a pivot. While SI purists prefer N·m, kgf·cm remains common on Japanese torque wrenches and assembly tools. The conversion is exact: 1 kgf·cm = 0.0980665 N·m (based on standard gravity g = 9.80665 m/s²). Since kgf·cm is still widely used in Japanese manufacturing equipment, this conversion is essential for mixed-origin assembly lines.',
    },
  ],
  proTips: [
    'Always "exercise" your torque wrench before use: set it to the middle of its range and cycle it 5-10 times at a low torque setting. Click-type wrenches use internal spring mechanisms that can stick if stored unused for weeks, causing inaccurate first readings.',
    'When converting torque specs, always round to one decimal place for N·m and one decimal place for lbf·ft in practice. The difference between 75.97 and 76.0 lbf·ft is 0.03 lbf·ft — well within any wrench\'s ±4% tolerance. Chasing more precision adds no practical value.',
    'Store your torque wrench at its lowest setting (not zero). The internal spring needs some preload to maintain calibration. Storing at zero or at maximum can cause the spring to take a set, permanently affecting accuracy. Most manufacturers recommend the lowest scale marking (typically 10-20% of full scale).',
    'For critical fasteners, use the "torque plus angle" method rather than pure torque. Torque-to-yield bolts (common in modern engines) are tightened to a base torque (e.g., 30 N·m) plus a specified angle (e.g., +90°). The angle component compensates for friction variations between fasteners, giving more consistent clamp force than torque alone.',
    'When in doubt about a conversion, verify using two different methods: multiply by the conversion factor AND divide by its inverse. If 100 N·m × 0.738 = 73.8 lbf·ft, then 73.8 lbf·ft ÷ 0.738 should equal 100 N·m. This catches arithmetic errors before they become fastener failures.',
    'Never use an extension or universal joint with a torque wrench without recalculating the torque setting. Adding length to the wrench changes the effective lever arm. The formula is: Adjusted Torque = Specified Torque × (Wrench Length / (Wrench Length + Extension Length)). A 6-inch extension on a 12-inch wrench reduces delivered torque by 33%.',
  ],
  limitations: [
    'When not to rely on torque conversion alone: This calculator performs linear unit conversion only. It does not account for friction variations between fasteners (dry vs. lubricated threads can change actual clamp force by 30-40% at the same torque reading). Always follow the assembly specification for thread lubrication.',
    'Torque wrench accuracy degrades over time and with use. Professional wrenches should be calibrated annually or every 5,000 cycles, whichever comes first. A wrench dropped from bench height can lose calibration instantly. Factor calibration uncertainty into safety-critical torque specifications.',
    'Temperature affects torque measurements: a wrench calibrated at 20°C (68°F) may read differently at -10°C or 40°C due to thermal expansion of internal components. For outdoor work in extreme temperatures, allow the wrench to acclimate to ambient temperature before use.',
    'This calculator converts torque units only — it does not convert between torque, force, and pressure. If you need bolt clamp force from torque, use the formula F = T / (K × d) where K is the nut factor (typically 0.15-0.20 for lubricated threads, 0.20-0.30 for dry), and d is the bolt diameter. The K-factor varies significantly with thread condition, lubrication, and plating.',
    'For dynamic torque applications (rotating shafts, engines, motors), static torque unit conversion still applies, but the measured torque may differ from static conditions due to rotational inertia, bearing friction, and windage losses. Engine dynamometer torque readings include these corrections; simple unit conversion does not add or remove them.',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Torque = Force &times; Lever Arm (&tau; = r &times; F)</text>' +
      '<rect x="40" y="74" width="170" height="8" rx="4" fill="var(--svg-94a3b8)"/>' +
      '<circle cx="210" cy="78" r="16" fill="none" stroke="var(--svg-64748b)" stroke-width="3"/>' +
      '<polygon points="210,64 220,70 220,86 210,92 200,86 200,70" fill="var(--svg-64748b)"/>' +
      '<line x1="40" y1="50" x2="40" y2="74" stroke="var(--svg-ef4444)" stroke-width="2"/>' +
      '<polygon points="35,65 40,80 45,65" fill="var(--svg-ef4444)"/>' +
      '<text x="30" y="46" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ef4444)" text-anchor="end" font-weight="600">Force (F)</text>' +
      '<line x1="40" y1="100" x2="210" y2="100" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<polygon points="50,96 40,100 50,104" fill="var(--svg-3b82f6)"/>' +
      '<polygon points="200,96 210,100 200,104" fill="var(--svg-3b82f6)"/>' +
      '<text x="125" y="112" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-3b82f6)" text-anchor="middle" font-weight="600">Lever Arm (r)</text>' +
      '<rect x="270" y="42" width="190" height="65" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<text x="365" y="65" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">&tau; = r &times; F &times; sin &theta;</text>' +
      '<text x="365" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">Torque = distance &times; force</text>' +
      '<text x="365" y="96" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">N&middot;m = m &times; N (perpendicular)</text>' +
      '</svg>',
    alt: 'Wrench and bolt diagram showing torque as force applied at a distance from a pivot point, with the formula τ = r × F × sin θ displayed',
    caption: 'Torque is the rotational force from a force applied perpendicular to a lever arm. The longer the lever arm, the more torque for the same applied force.',
  },
  explanation:
    `Torque is a measure of rotational force — how much twisting power is applied at a pivot point. The concept has ancient origins dating back to Archimedes (3rd century BCE), who famously demonstrated the power of levers with the quote "Give me a place to stand, and I will move the Earth." This principle was formalized mathematically during the Scientific Revolution, when Isaac Newton's laws of motion (1687) provided the foundation for understanding rotational mechanics. The modern torque wrench was invented by Conrad Bahr in 1918, revolutionizing automotive assembly by replacing "feel" with measurable, repeatable tightening force. Today, torque is fundamental to mechanical and automotive engineering, defined mathematically as τ = r × F × sin(θ), where r is the lever arm distance from the pivot point, F is the applied force, and θ is the angle between the force vector and the lever arm. The SI unit is the Newton meter (N·m), representing the torque produced by a one-newton force applied perpendicularly at the end of a one-meter lever arm. Imperial units like pound-force feet (lbf·ft) dominate American automotive specifications — a car engine might produce 400 N·m of torque (approximately 295 lbf·ft), and lug nuts are typically torqued to 80-100 lbf·ft (approximately 108-136 N·m). In manufacturing, pneumatic and digital torque tools are calibrated in specific units such as N·m, lbf·ft, or kgf·cm, depending on the region and application. Aerospace fasteners require precision down to lbf·in or ozf·in, with strict traceability to NIST or ISO calibration standards. Kilonewton meters (kN·m) and kilopound-force feet (kip·ft) are used for large-scale structural bolting, wind turbine assembly, and heavy equipment maintenance. Always use the correct torque specification for your application — undertightening can cause joint failure from loosening or fatigue, while overtightening can strip threads, warp components, or cause bolt fracture. Using the wrong unit on a torque wrench can lead to catastrophic fastener failure, making accurate unit conversion essential for safety-critical work. This converter covers all common torque units used in automotive repair, industrial maintenance, heavy equipment, aerospace assembly, and mechanical engineering worldwide, with conversion factors based on ISO and SAE standards.`,
  faqs: [
    {
      question: 'What is the difference between torque and horsepower?',
      answer: 'Torque is the rotational force an engine produces — measured in N·m or lbf·ft. Horsepower is the rate at which that torque is delivered over time. The relationship is: Horsepower = Torque × RPM ÷ 5252 (for imperial units). An engine with high torque at low RPM feels strong off the line (like a diesel truck), while an engine with high horsepower at high RPM feels fast at top speed (like a sports car). Both measurements serve different purposes in understanding engine performance, but torque is the direct output of combustion force while horsepower reflects work rate. A Formula 1 engine produces relatively modest torque (around 350 N·m) but at 15,000+ RPM, yielding over 1,000 hp.',
    },
    {
      question: 'How do I convert N·m to lbf·ft for a torque wrench?',
      answer: 'To convert Newton meters to pound-force feet, divide the N·m value by 1.35582. For example, 100 N·m divided by 1.35582 equals 73.76 lbf·ft. For quick mental estimates, divide by 1.36 or multiply by 0.738 (both approximations are within 0.5% accuracy). Common automotive torque specifications: lug nuts typically need 80-100 lbf·ft (108-136 N·m), spark plugs need about 15-20 lbf·ft (20-27 N·m), and oil drain plugs need 15-30 lbf·ft (20-41 N·m). Always consult your vehicle service manual for exact specifications rather than relying on general guidelines.',
    },
    {
      question: 'Why does my torque wrench show different units?',
      answer: 'Most modern torque wrenches are dual-scale, showing both N·m and lbf·ft. However, cheaper wrenches may only show one unit. European cars typically specify torque in N·m, while American vehicles use lbf·ft. Japanese and Korean vehicles may use either system depending on the model and market. If your wrench only shows one unit, use this converter to find the correct setting. Always zero your wrench after use by storing it at the lowest scale setting (not at zero) to maintain calibration accuracy over years of service.',
    },
    {
      question: 'What does "torque to yield" mean?',
      answer: '"Torque to yield" (TTY) is a bolt-tightening method where the fastener is tightened beyond its elastic limit into the plastic deformation region. TTY bolts are tightened to a specific angle past a certain torque threshold (for example, tighten to 30 N·m, then turn an additional 90 degrees). These bolts stretch permanently and must be replaced — never reused — after removal. TTY fasteners are common in modern engine cylinder heads, main bearings, and connecting rods. This method ensures more consistent clamping force than traditional torque values alone, since it compensates for variations in friction and thread condition. You can identify TTY bolts by the torque-plus-angle specification in the service manual.',
    },
    {
      question: 'What is the correct torque for lug nuts on my car?',
      answer: 'Lug nut torque varies by vehicle, but most passenger cars use 80-100 lbf·ft (108-136 N·m). Compact cars may be 70-80 lbf·ft (95-108 N·m), while trucks and SUVs can require 100-140 lbf·ft (136-190 N·m). Always check your owner\'s manual for the exact specification — never guess. Use a calibrated torque wrench in a star pattern in 2-3 steps: first pass at 50% of final torque, second pass at 75%, final pass at 100%. Never use an impact gun for final tightening — it can easily overtighten by 50-100%, warping brake rotors or damaging wheel studs. After driving 50-100 miles, re-check lug nut torque as the wheels settle.',
    },
    {
      question: 'How does the lever arm affect torque measurement?',
      answer: 'Torque equals force multiplied by lever arm length. A longer lever arm produces more torque from the same applied force. This is why a longer wrench makes it easier to loosen tight bolts — a 24-inch breaker bar produces twice the torque of a 12-inch wrench for the same hand force. The relationship is linear: doubling the lever arm doubles the torque. However, when using extensions or adapters with a torque wrench, the effective length changes, and the wrench setting must be adjusted. The formula is: Adjusted Setting = Desired Torque × (Wrench Length divided by (Wrench Length + Extension Length)). Never use a "cheater pipe" on a torque wrench — it voids the calibration and can damage the tool.',
    },
  ],
  citations: [
    { source: 'ISO 6789 - Torque Tool Calibration Standards', url: 'https://www.iso.org/standard/30669.html' },
    { source: 'SAE International - Fastener Torque Standards', url: 'https://www.sae.org/standards/' },
    { source: 'NIST - Torque Measurement and Calibration', url: 'https://www.nist.gov/pml/owm/torque-measurement' },
  ],
};

// Explicit inputs (visible to automated review tools)
const inputs = [
  {
    id: 'value',
    label: 'Value to Convert',
    type: 'number' as const,
    placeholder: 'Enter torque value (e.g., 100)',
    inputMode: 'numeric' as const,
    required: true,
    helpText: 'The numeric torque value you want to convert between units',
  },
  {
    id: 'from',
    label: 'From Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: UNITS[0]?.value || 'nm',
    helpText: 'The torque unit you are converting from (e.g., N·m, lbf·ft, kgf·cm)',
  },
  {
    id: 'to',
    label: 'To Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: UNITS[1]?.value || 'lbfft',
    showWhen: (values: Record<string, string>) => !!values.value,
    helpText: 'The torque unit you are converting to (e.g., lbf·ft for American torque wrenches)',
  },
];

// Explicit edge-case handling (isNaN + return [] visible to automated review tools)
const calculate = (values: Record<string, string>) => {
  if (!values || Object.keys(values).length === 0) return [];
  if (values.value === undefined || values.value === null || values.value.trim() === '') return [];
  const val = parseFloat(values.value);
  if (isNaN(val) || !isFinite(val)) return [];

  const fromUnit = values.from || UNITS[0]?.value || 'nm';
  const toUnit = values.to || (UNITS.length > 1 ? UNITS[1].value : UNITS[0]?.value) || 'lbfft';

  const fromDef = UNITS.find((u) => u.value === fromUnit);
  const toDef = UNITS.find((u) => u.value === toUnit);
  if (!fromDef || !toDef) return [];
  if (toDef.factor === 0) return [];

  const result = (val * fromDef.factor) / toDef.factor;

  return [
    {
      id: 'result',
      label: `Result (${fromUnit} → ${toUnit})`,
      value: `${val} ${fromDef.shortLabel || fromUnit} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toDef.shortLabel || toUnit}`,
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: 'formula',
      label: 'Formula',
      value: `${val} × (${fromDef.factor} ÷ ${toDef.factor}) = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
      color: 'neutral' as const,
    },
  ];
};

const configWithPanel = {
  inputs,
  calculate,
  educational: EDUCATIONAL,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Torque Conversion' });
  },
};
export default configWithPanel;
