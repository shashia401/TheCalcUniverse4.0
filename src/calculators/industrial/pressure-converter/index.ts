import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'pa', label: 'Pascal (Pa)', shortLabel: 'Pa', factor: 1 },
  { value: 'hpa', label: 'Hectopascal (hPa)', shortLabel: 'hPa', factor: 100 },
  { value: 'kpa', label: 'Kilopascal (kPa)', shortLabel: 'kPa', factor: 1000 },
  { value: 'mpa', label: 'Megapascal (MPa)', shortLabel: 'MPa', factor: 1_000_000 },
  { value: 'bar', label: 'Bar', shortLabel: 'bar', factor: 100_000 },
  { value: 'psi', label: 'Pound per Square Inch (PSI)', shortLabel: 'psi', factor: 6894.76 },
  { value: 'atm', label: 'Atmosphere (atm)', shortLabel: 'atm', factor: 101_325 },
  { value: 'torr', label: 'Torr', shortLabel: 'Torr', factor: 133.322 },
  { value: 'mmhg', label: 'Millimeter of Mercury (mmHg)', shortLabel: 'mmHg', factor: 133.322 },
  { value: 'inhg', label: 'Inch of Mercury (inHg)', shortLabel: 'inHg', factor: 3386.39 },
  { value: 'mmh2o', label: 'Millimeter of Water (mmH₂O)', shortLabel: 'mmH₂O', factor: 9.80665 },
  { value: 'inh2o', label: 'Inch of Water (inH₂O)', shortLabel: 'inH₂O', factor: 249.089 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Pressure unit conversion uses a linear factor relative to the Pascal (Pa), the SI base unit of pressure. Each unit is converted to Pascals first, then divided by the target unit\'s Pascal factor. For example, converting 1 PSI to bar: 1 PSI × 6894.76 Pa/psi ÷ 100,000 Pa/bar = 0.0689 bar.',
  variables: [
    { symbol: 'P', name: 'Pressure', description: 'Force applied perpendicular to a surface per unit area, measured in pascals (SI) or various derived units.' },
    { symbol: '1 Pa', name: 'One Pascal', description: 'One newton of force applied over one square meter. The SI base unit of pressure.' },
    { symbol: 'Bar & ATM', name: 'Bar and Standard Atmosphere', description: '1 bar = 100,000 Pa ≈ 0.987 atm. 1 atm = 101,325 Pa exactly. Both are close to sea-level atmospheric pressure but are defined differently — bar is metric, atm is a physical reference.' },
  ],
  howToUse: [
    'Enter the numeric pressure value you want to convert in the "Value" field.',
    'Select the unit you are converting from in the "From" dropdown (e.g., PSI, bar, kPa).',
    'Select the unit you want to convert to in the "To" dropdown.',
    'The result is displayed instantly along with the conversion formula.',
    'Use the quick reference table below for common conversions like tire pressure (PSI ↔ bar) or blood pressure (mmHg ↔ kPa).',
  ],
  quickReference: [
    { label: '1 PSI', value: '0.0689 bar' },
    { label: '1 bar', value: '14.504 PSI' },
    { label: '1 atm', value: '101.325 kPa' },
    { label: '1 kPa', value: '0.145 PSI' },
    { label: '1 MPa', value: '145.038 PSI' },
    { label: '1 torr', value: '133.322 Pa' },
    { label: '1 inHg', value: '3.386 kPa' },
    { label: '1 mmHg', value: '0.1333 kPa' },
  ],
  commonUses: [
    'Tire pressure: 30–35 PSI (2.1–2.4 bar) for most passenger cars',
    'Blood pressure: ~120/80 mmHg (systolic/diastolic)',
    'Scuba tanks: 2,000–3,000 PSI (138–207 bar)',
    'Atmospheric pressure at sea level: 14.7 PSI / 1.013 bar / 1013 hPa',
    'HVAC refrigerant pressures: 60–150 PSI depending on refrigerant type',
    'Hydraulic systems: 1,000–5,000 PSI (69–345 bar) for industrial equipment',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Absolute vs. Gauge Pressure</text>' +
      '<circle cx="120" cy="68" r="38" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
      '<line x1="120" y1="68" x2="148" y2="50" stroke="var(--svg-ef4444)" stroke-width="2"/>' +
      '<circle cx="120" cy="68" r="3" fill="var(--svg-ef4444)"/>' +
      '<text x="120" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)" text-anchor="middle">Gauge: reads 0 at atmospheric</text>' +
      '<text x="195" y="72" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-3b82f6)" text-anchor="middle" font-weight="700">+</text>' +
      '<rect x="220" y="40" width="110" height="50" rx="4" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="4,3"/>' +
      '<text x="275" y="58" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-3b82f6)" text-anchor="middle" font-weight="600">Atmospheric</text>' +
      '<text x="275" y="72" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-3b82f6)" text-anchor="middle">14.7 PSI / 1.013 bar</text>' +
      '<text x="365" y="72" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-3b82f6)" text-anchor="middle" font-weight="700">=</text>' +
      '<text x="435" y="70" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ef4444)" text-anchor="middle" font-weight="700">ABSOLUTE</text>' +
      '<text x="435" y="84" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">(includes atm)</text>' +
      '</svg>',
    alt: 'Pressure gauge diagram showing relationship between gauge and absolute pressure',
    caption: 'Gauge pressure reads zero at atmosphere; absolute pressure = gauge + atmospheric',
  },
  explanation:
    'Pressure is a fundamental measurement in physics, engineering, meteorology, and medicine — defined as force per unit area. The SI unit is the Pascal (Pa), but dozens of legacy units remain in active use around the world. Tire pressure gauges use PSI in the United States, weather reports use hectopascals (hPa) in Europe and millibars elsewhere, blood pressure is measured in millimeters of mercury (mmHg), and industrial processes use bars or megapascals. This converter handles all major pressure units with exact conversion factors. Understanding pressure units is essential for automotive maintenance, scuba diving, HVAC work, hydraulic systems, weather monitoring, and aerospace engineering. For example, standard sea-level atmospheric pressure is 14.7 PSI, 1013.25 hPa, 29.92 inHg, or 1 atm — all describing the same physical quantity. The Mars Climate Orbiter disaster (1999) was caused partly by a unit mismatch in thruster calibration data, highlighting how critical precise pressure and force unit conversion can be.',
  faqs: [
    {
      question: 'What is the difference between PSI, bar, and kPa?',
      answer: 'PSI (pounds per square inch) is the imperial standard used primarily in the United States for tire pressure, hydraulic systems, and industrial gauges. Bar is a metric unit equal to 100,000 Pa and is common in Europe for automotive tire pressure, compressors, and scuba tanks. kPa (kilopascal) is the SI-derived unit most commonly used in engineering, science, and meteorology worldwide. Conversion: 1 bar = 14.5 PSI = 100 kPa. For tire pressure, 32 PSI = 2.21 bar = 221 kPa.',
    },
    {
      question: 'Why do weather forecasters use different pressure units?',
      answer: 'Meteorologists in the US use inches of mercury (inHg) for barometric pressure, while most other countries use hectopascals (hPa) or millibars (mbar), which are numerically identical. The US National Weather Service has considered switching to hPa but the change would require replacing millions of analog barometers. Standard sea-level pressure is 29.92 inHg, 1013.25 hPa, or 1013.25 mbar.',
    },
    {
      question: 'How do I convert tire pressure from PSI to bar?',
      answer: 'Tire pressure commonly ranges from 30 to 40 PSI for passenger cars. To convert to bar, divide by 14.504 (since 1 bar = 14.504 PSI). For example, 35 PSI ÷ 14.504 = 2.41 bar. Most European and Asian vehicles list recommended tire pressure in bar or kPa on the driver\'s door jamb sticker, so this conversion is essential when driving or importing vehicles internationally.',
    },
    {
      question: 'What does "mmHg" mean in blood pressure measurements?',
      answer: 'mmHg (millimeters of mercury) is the traditional unit for blood pressure, dating back to the mercury sphygmomanometer invented in 1881. A reading of "120/80 mmHg" means the pressure pushes a column of mercury 120 mm high during heart contraction (systolic) and 80 mm between beats (diastolic). Modern devices no longer use mercury, but the unit remains the global standard. In SI units, 120 mmHg ≈ 16.0 kPa.',
    },
    {
      question: 'What is the difference between gauge pressure and absolute pressure?',
      answer: 'Gauge pressure (PSIG, barg) measures pressure relative to atmospheric pressure — a tire gauge reads 0 PSIG at ambient pressure. Absolute pressure (PSIA, bara) includes the atmospheric pressure baseline. Absolute = Gauge + Atmospheric. At sea level: 0 PSIG = 14.7 PSIA, and 2 bar gauge = 3.013 bar absolute. Most pressure converters in this tool handle absolute units, but always check which type your application requires — tire pressure is gauge, while scuba and vacuum systems use absolute.',
    },
  ],

  citations: [
    { source: 'NIST - Pressure Measurement', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
    { source: 'ISO - Pressure Standards', url: 'https://www.iso.org/standard/30669.html' },
  ],
};

const converterConfig = createConverter({ units: UNITS, educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  calculate: (values: Record<string, string>) => {
    if (values.value !== undefined && values.value !== '') {
      const val = parseFloat(values.value);
      if (!isNaN(val) && val < 0) return [];
    }
    return converterConfig.calculate(values);
  },
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Pressure Conversion' });
  },
};
export default configWithPanel;
