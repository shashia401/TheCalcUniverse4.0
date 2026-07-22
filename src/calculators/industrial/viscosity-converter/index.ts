import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

// Dynamic viscosity units (indices 0-3) and kinematic viscosity units (indices 4-6)
const DYNAMIC_KEYS = new Set(['pas', 'mpas', 'p', 'cp']);
const KINEMATIC_KEYS = new Set(['m2s', 'st', 'cst']);

function isDynamic(v: string): boolean { return DYNAMIC_KEYS.has(v); }
function isKinematic(v: string): boolean { return KINEMATIC_KEYS.has(v); }

const UNITS: UnitDef[] = [
  // Dynamic viscosity
  { value: 'pas', label: 'Pascal-Second (Pa·s) — Dynamic', shortLabel: 'Pa·s', factor: 1 },
  { value: 'mpas', label: 'Millipascal-Second (mPa·s) — Dynamic', shortLabel: 'mPa·s', factor: 0.001 },
  { value: 'p', label: 'Poise (P) — Dynamic', shortLabel: 'P', factor: 0.1 },
  { value: 'cp', label: 'Centipoise (cP) — Dynamic', shortLabel: 'cP', factor: 0.001 },
  // Kinematic viscosity
  { value: 'm2s', label: 'Square Meter per Second (m²/s) — Kinematic', shortLabel: 'm²/s', factor: 1 },
  { value: 'st', label: 'Stokes (St) — Kinematic', shortLabel: 'St', factor: 0.0001 },
  { value: 'cst', label: 'Centistokes (cSt) — Kinematic', shortLabel: 'cSt', factor: 0.000001 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Viscosity conversion within the same type (dynamic or kinematic) uses linear factors relative to the SI base units (Pa·s for dynamic, m²/s for kinematic). Dynamic viscosity measures a fluid\'s resistance to shear flow, while kinematic viscosity is dynamic viscosity divided by density. To convert between dynamic and kinematic viscosity: kinematic = dynamic ÷ density. The density must be known — this converter only handles within-type conversions accurately.',
  variables: [
    { symbol: 'μ', name: 'Dynamic Viscosity (mu)', description: 'A fluid\'s resistance to shear or flow when an external force is applied. Measured in Pa·s (SI) or poise (CGS). Honey has high viscosity; water has low viscosity.' },
    { symbol: 'ν', name: 'Kinematic Viscosity (nu)', description: 'Dynamic viscosity divided by fluid density. Represents resistance to flow under gravity alone. Measured in m²/s (SI) or stokes (CGS).' },
    { symbol: '1 cP & 1 cSt', name: 'Centigrade Scale References (cP & cSt)', description: '1 cP = 1 mPa·s — water at 20°C has about 1 cP dynamic viscosity. 1 cSt = 1 mm²/s — water at 20°C also has about 1 cSt kinematic viscosity. These coincidentally equal 1 for water since its density is 1,000 kg/m³.' },
  ],
  howToUse: [
    'Enter the viscosity value you want to convert.',
    'Select the current viscosity unit from the "From" dropdown. Units are labeled as Dynamic or Kinematic.',
    'Select the desired viscosity unit from the "To" dropdown.',
    'The converted value is displayed instantly. Convert only within the same type (dynamic → dynamic or kinematic → kinematic) unless you know the fluid density.',
    'Refer to the quick reference for viscosity ranges of common fluids like water, engine oil, and honey at various temperatures.',
  ],
  quickReference: [
    { label: 'Water (20°C)', value: '1.0 mPa·s / 1.0 cP / 1.0 cSt' },
    { label: 'SAE 30 oil (100°C)', value: '~10 cP / ~11 cSt' },
    { label: 'SAE 5W-30 (100°C)', value: '~9.3–12.5 cSt' },
    { label: 'Olive oil (20°C)', value: '~84 cP / ~91 cSt' },
    { label: 'Honey (20°C)', value: '~2,000–10,000 cP' },
    { label: '1 Pa·s', value: '10 poise / 1,000 cP' },
    { label: '1 St', value: '100 cSt / 0.0001 m²/s' },
    { label: 'SAE grade (approximate)', value: 'cSt at 100°C — SAE 30: 9.3–12.5, SAE 40: 12.5–16.3, SAE 50: 16.3–21.9' },
  ],
  commonUses: [
    'Engine oil viscosity: SAE 5W-30 is the most common multigrade recommendation',
    'Hydraulic oil: ISO VG 32 (32 cSt at 40°C) for most industrial hydraulics',
    'Gear oil: SAE 75W-90 (15–24 cSt at 100°C) for manual transmissions',
    'Paint viscosity: 70–100 KU (Krebs units) for spray application',
    'Blood plasma: ~1.5 cP at body temperature (37°C)',
    'Cooking oil: ~30–40 cP at frying temperature (180°C)',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Viscosity &mdash; Resistance to Flow</text>' +
      '<text x="70" y="35" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Low Viscosity (Water &sim;1 cP)</text>' +
      '<rect x="20" y="40" width="100" height="40" rx="4" fill="var(--svg-dbeafe)" opacity="0.4" stroke="var(--svg-93c5fd)" stroke-width="1"/>' +
      '<path d="M 20 60 Q 60 55 120 60" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<path d="M 20 65 Q 60 60 120 65" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1"/>' +
      '<path d="M 20 70 Q 60 66 120 70" fill="none" stroke="var(--svg-3b82f6)" stroke-width="0.5"/>' +
      '<text x="60" y="95" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-3b82f6)" text-anchor="middle">&rarr;&rarr;&rarr; Fast Flow &rarr;&rarr;&rarr;</text>' +
      '<text x="330" y="35" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">High Viscosity (Honey &sim;10,000 cP)</text>' +
      '<rect x="240" y="40" width="200" height="40" rx="4" fill="var(--svg-fed7aa)" opacity="0.4" stroke="var(--svg-fdba74)" stroke-width="1"/>' +
      '<path d="M 240 55 Q 320 58 440 55" fill="none" stroke="var(--svg-ea580c)" stroke-width="1.5"/>' +
      '<path d="M 240 62 Q 320 64 440 62" fill="none" stroke="var(--svg-ea580c)" stroke-width="1"/>' +
      '<path d="M 240 69 Q 320 71 440 69" fill="none" stroke="var(--svg-ea580c)" stroke-width="0.5"/>' +
      '<text x="340" y="95" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ea580c)" text-anchor="middle">&rarr;&rarr; Slow Flow &rarr;&rarr;</text>' +
      '<text x="240" y="120" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">&nu; = &mu; &divide; &rho; | Kinematic = Dynamic &divide; Density</text>' +
      '</svg>',
    alt: 'Comparison of low viscosity (water) flowing fast vs high viscosity (honey) flowing slowly through tubes',
    caption: 'Higher viscosity means greater resistance to flow — honey flows much slower than water',
  },
  explanation:
    'Viscosity is a measure of a fluid\'s resistance to flow — essentially its "thickness" or internal friction. It is a critical property in lubrication engineering, food processing, pipeline design, paint formulation, and countless industrial applications. There are two types of viscosity: dynamic (absolute) viscosity (μ), measured in pascal-seconds (Pa·s) or centipoise (cP), which measures resistance to shear flow; and kinematic viscosity (ν), measured in square meters per second (m²/s) or centistokes (cSt), which is dynamic viscosity divided by density. The relationship is ν = μ / ρ, where ρ is density. Water at 20°C has about 1 cP (dynamic) and 1 cSt (kinematic) because its density is about 1,000 kg/m³. SAE engine oil grades are based on kinematic viscosity at specific temperatures — SAE 30 oil has a kinematic viscosity of 9.3-12.5 cSt at 100°C, while SAE 5W-30 must also have a low-temperature (cold start) viscosity below 6,600 cP at -30°C. Understanding viscosity is essential for selecting the right lubricant, designing pipelines, formulating paints and coatings, and controlling food texture.',
  faqs: [
    {
      question: 'What is the difference between dynamic and kinematic viscosity?',
      answer: 'Dynamic viscosity (μ) measures a fluid\'s internal resistance to shear flow — how much force is needed to make it flow. Kinematic viscosity (ν) is dynamic viscosity divided by the fluid\'s density (ν = μ/ρ). Kinematic viscosity accounts for both the fluid\'s internal resistance AND its density, and represents how it flows under gravity alone. The practical difference: a thick, heavy oil might have high dynamic viscosity but moderate kinematic viscosity because its density is also high. Converting between the two requires knowing the fluid density at the measurement temperature.',
    },
    {
      question: 'How do I convert between centipoise and centistokes?',
      answer: 'You need the fluid density: cSt = cP ÷ density (in g/cm³). For example, SAE 30 oil at 100°C has a density of about 0.87 g/cm³ and dynamic viscosity of about 10 cP: kinematic viscosity = 10 ÷ 0.87 ≈ 11.5 cSt. For water at 20°C, density = 1.0 g/cm³, so 1 cP = 1 cSt — a coincidence that causes confusion. Always use the density at the same temperature as the viscosity measurement, because both density and viscosity change with temperature.',
    },
    {
      question: 'What do SAE oil viscosity grades mean?',
      answer: 'SAE (Society of Automotive Engineers) viscosity grades define engine oil flow characteristics at specific temperatures. Monograde oils (SAE 30, SAE 40): tested at 100°C only. Multigrade oils (SAE 5W-30, 10W-40): the "W" (Winter) number indicates low-temperature pumpability (tested at -30°C to -40°C), the second number indicates high-temperature viscosity at 100°C. For example, 5W-30 oil flows like SAE 5 when cold (good winter starting) but thickens to SAE 30 at operating temperature (good engine protection). Lower first numbers = better cold flow. Common recommendations: 0W-20 for modern fuel-efficient engines, 5W-30 for most gasoline engines, 10W-40 for older/high-mileage engines, 15W-40 for diesel engines.',
    },
    {
      question: 'What is the viscosity of common fluids?',
      answer: 'Viscosity varies enormously: Water at 20°C: 1.0 cP. Olive oil at 20°C: 84 cP. SAE 30 motor oil at 20°C: 500-700 cP. SAE 30 motor oil at 100°C: 9-12 cP (viscosity drops dramatically with temperature). Honey at 20°C: 2,000-10,000 cP depending on type. Ketchup: 50,000-100,000 cP (shear-thinning — it flows more when squeezed). Peanut butter: 150,000-250,000 cP. Glass at room temperature: 10^20+ cP (it is technically an extremely slow-flowing liquid). Pitch (the famous "pitch drop experiment"): 2.3 × 10^11 cP — about 230 billion times more viscous than water.',
    },
    {
      question: 'Why does viscosity change with temperature?',
      answer: 'Viscosity decreases as temperature increases for liquids (and increases for gases). For liquids, heat increases molecular motion, reducing intermolecular forces and allowing molecules to slide past each other more easily. Engine oil viscosity drops by roughly 90% from 20°C to 100°C. This dramatic change is why multigrade oils exist — they contain viscosity index improvers (long polymer chains) that expand at high temperature to partially compensate for the natural thinning. The relationship follows an approximate exponential curve: a 10°C rise typically cuts viscosity by 30-50% for most oils. This temperature sensitivity is a critical consideration in any engineering application involving fluid flow, from hydraulic systems to food processing to chemical reactors.',
    },
  ],

  citations: [
    { source: 'ASTM - Viscosity Standards', url: 'https://www.astm.org/standards/viscosity-standards.html' },
    { source: 'ISO - Rheology Standards', url: 'https://www.iso.org/standard/30669.html' },
  ],
};

const baseConfig = createConverter({ units: UNITS, educational: EDUCATIONAL });

const converterConfig = {
  inputs: [
    ...baseConfig.inputs,
    {
      id: 'density',
      label: 'Fluid Density (for Dynamic ↔ Kinematic)',
      type: 'number' as const,
      placeholder: '1000',
      min: 0,
      step: 1,
      helpText: 'Density in kg/m³. Water ≈ 1000, Oil ≈ 800–900, Honey ≈ 1400–1500.',
    },
  ],
  calculate: (values: Record<string, string>) => {
    if (values.value === undefined || values.value === '') return [];

    const val = parseFloat(values.value);
    const fromUnit = values.from || 'pas';
    const toUnit = values.to || 'mpas';

    if (isNaN(val)) return [];

    const fromDef = UNITS.find((u) => u.value === fromUnit);
    const toDef = UNITS.find((u) => u.value === toUnit);
    if (!fromDef || !toDef) return [];

    let result: number;

    if ((isDynamic(fromUnit) && isDynamic(toUnit)) || (isKinematic(fromUnit) && isKinematic(toUnit))) {
      // Same type: simple factor conversion
      result = (val * fromDef.factor) / toDef.factor;
    } else if (isDynamic(fromUnit) && isKinematic(toUnit)) {
      // Dynamic → Kinematic: ν = μ / ρ
      const density = parseFloat(values.density);
      if (isNaN(density) || density <= 0) return [];
      result = (val * fromDef.factor / density) / toDef.factor;
    } else if (isKinematic(fromUnit) && isDynamic(toUnit)) {
      // Kinematic → Dynamic: μ = ν × ρ
      const density = parseFloat(values.density);
      if (isNaN(density) || density <= 0) return [];
      result = (val * fromDef.factor * density) / toDef.factor;
    } else {
      return [];
    }

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
  },
  educational: EDUCATIONAL,
};

const configWithPanel = {
  ...converterConfig,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Viscosity Conversion' });
  },
};
export default configWithPanel;
