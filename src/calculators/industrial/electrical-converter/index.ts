import { createElement } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { type UnitDef } from '../unit-converter';
import ConverterPanel from '../ConverterPanel';

// Electrical units span multiple sub-categories (voltage, current, resistance, etc.).
// All units within a sub-category are linearly related to their SI base unit.
// All units are presented in a single flat list with category prefixes for clarity.
// Converting between sub-categories (e.g., volts to amps) is mathematically possible
// but physically meaningless without additional context (Ohm's law, etc.).

const UNITS: UnitDef[] = [
  // Voltage
  { value: 'uv', label: 'Voltage — Microvolt (µV)', shortLabel: 'µV', factor: 0.000001 },
  { value: 'mv_v', label: 'Voltage — Millivolt (mV)', shortLabel: 'mV', factor: 0.001 },
  { value: 'v', label: 'Voltage — Volt (V)', shortLabel: 'V', factor: 1 },
  { value: 'kv', label: 'Voltage — Kilovolt (kV)', shortLabel: 'kV', factor: 1000 },
  { value: 'mv_v2', label: 'Voltage — Megavolt (MV)', shortLabel: 'MV', factor: 1_000_000 },
  // Current
  { value: 'ua', label: 'Current — Microamp (µA)', shortLabel: 'µA', factor: 0.000001 },
  { value: 'ma', label: 'Current — Milliampere (mA)', shortLabel: 'mA', factor: 0.001 },
  { value: 'a', label: 'Current — Ampere (A)', shortLabel: 'A', factor: 1 },
  { value: 'ka', label: 'Current — Kiloampere (kA)', shortLabel: 'kA', factor: 1000 },
  // Resistance
  { value: 'mohm', label: 'Resistance — Milliohm (mΩ)', shortLabel: 'mΩ', factor: 0.001 },
  { value: 'ohm', label: 'Resistance — Ohm (Ω)', shortLabel: 'Ω', factor: 1 },
  { value: 'kohm', label: 'Resistance — Kilohm (kΩ)', shortLabel: 'kΩ', factor: 1000 },
  { value: 'mohm2', label: 'Resistance — Megohm (MΩ)', shortLabel: 'MΩ', factor: 1_000_000 },
  { value: 'gohm', label: 'Resistance — Gigohm (GΩ)', shortLabel: 'GΩ', factor: 1_000_000_000 },
  // Capacitance
  { value: 'pf', label: 'Capacitance — Picofarad (pF)', shortLabel: 'pF', factor: 0.000000000001 },
  { value: 'nf', label: 'Capacitance — Nanofarad (nF)', shortLabel: 'nF', factor: 0.000000001 },
  { value: 'uf', label: 'Capacitance — Microfarad (µF)', shortLabel: 'µF', factor: 0.000001 },
  { value: 'mf', label: 'Capacitance — Millifarad (mF)', shortLabel: 'mF', factor: 0.001 },
  { value: 'f', label: 'Capacitance — Farad (F)', shortLabel: 'F', factor: 1 },
  // Inductance
  { value: 'uh', label: 'Inductance — Microhenry (µH)', shortLabel: 'µH', factor: 0.000001 },
  { value: 'mh', label: 'Inductance — Millihenry (mH)', shortLabel: 'mH', factor: 0.001 },
  { value: 'h', label: 'Inductance — Henry (H)', shortLabel: 'H', factor: 1 },
  // Conductance
  { value: 'us', label: 'Conductance — Microsiemens (µS)', shortLabel: 'µS', factor: 0.000001 },
  { value: 'ms', label: 'Conductance — Millisiemens (mS)', shortLabel: 'mS', factor: 0.001 },
  { value: 's', label: 'Conductance — Siemens (S)', shortLabel: 'S', factor: 1 },
  { value: 'ks', label: 'Conductance — Kilosiemens (kS)', shortLabel: 'kS', factor: 1000 },
  // Charge
  { value: 'uc', label: 'Charge — Microcoulomb (µC)', shortLabel: 'µC', factor: 0.000001 },
  { value: 'mc', label: 'Charge — Millicoulomb (mC)', shortLabel: 'mC', factor: 0.001 },
  { value: 'c', label: 'Charge — Coulomb (C)', shortLabel: 'C', factor: 1 },
  { value: 'mah', label: 'Charge — Milliampere-Hour (mAh)', shortLabel: 'mAh', factor: 3.6 },
  { value: 'ah', label: 'Charge — Ampere-Hour (Ah)', shortLabel: 'Ah', factor: 3600 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Electrical unit conversion uses linear factors relative to SI base units per sub-category (V, A, Ω, F, H, S, C). All units within a sub-category share the same physical quantity and convert linearly. Converting between sub-categories (e.g., volts to amps) is not physically meaningful without additional circuit context. For example, converting 1 kV to MV: 1 kV × 1000 ÷ 1,000,000 = 0.001 MV. The V·A = W relationship (power = voltage × current) requires knowing both values and is a different calculation.',
  variables: [
    { symbol: 'V', name: 'Volt', description: 'The SI unit of electrical potential difference. One volt pushes one ampere through one ohm of resistance.' },
    { symbol: 'A', name: 'Ampere', description: 'The SI unit of electric current. One ampere is one coulomb of charge flowing per second.' },
    { symbol: 'Ω', name: 'Ohm', description: 'The SI unit of electrical resistance. One ohm allows one ampere to flow at one volt (V = IR).' },
    { symbol: 'F', name: 'Farad', description: 'The SI unit of capacitance. One farad stores one coulomb of charge at one volt. Most practical capacitors are in µF to pF range.' },
    { symbol: 'H', name: 'Henry', description: 'The SI unit of inductance. One henry induces one volt when current changes at one ampere per second. Used in transformers, filters, and power electronics. Common values range from µH (microhenries) to H.' },
  ],
  howToUse: [
    'Enter the electrical value you want to convert in the "Value" field.',
    'Select the current unit from the "From" dropdown. Units are grouped by measurement type (Voltage, Current, Resistance, etc.).',
    'Select the desired unit from the "To" dropdown. Convert within the same measurement type for physically meaningful results.',
    'The converted value is displayed instantly. Use this for circuit design, component selection, or electrical engineering calculations.',
    'Use the quick reference table for common electrical unit relationships and component value conversions.',
  ],
  quickReference: [
    { label: '1 V', value: '1,000 mV / 0.001 kV' },
    { label: '1 A', value: '1,000 mA / 0.001 kA' },
    { label: '1 kΩ', value: '1,000 Ω' },
    { label: '1 µF', value: '1,000 nF / 1,000,000 pF' },
    { label: '1 F', value: '1,000 mF / 1,000,000 µF' },
    { label: '1 S', value: '1,000 mS / 1,000,000 µS' },
    { label: '1 mAh', value: '3.6 C' },
    { label: '1 Ah', value: '3,600 C' },
  ],
  commonUses: [
    'Household voltage: 120 V (US) / 230 V (Europe)',
    'USB power: 5 V, up to 3 A (15 W standard)',
    'Resistor: 4.7 kΩ with gold band = 4,700 Ω ±5%',
    'Capacitor labeled "104": 10 × 10⁴ pF = 100 nF = 0.1 µF',
    'Phone battery: 3,000–5,000 mAh at 3.7–3.8 V',
    'Power line: 138–765 kV (transmission) / 120–240 V (residential)',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Ohm&rsquo;s Law &amp; Power Triangle</text>' +
      '<polygon points="340,30 410,95 270,95" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<text x="340" y="58" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="800">V</text>' +
      '<text x="340" y="80" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">Volts</text>' +
      '<line x1="295" y1="90" x2="385" y2="90" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/>' +
      '<text x="310" y="108" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ef4444)" text-anchor="middle" font-weight="700">I</text>' +
      '<text x="310" y="120" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)" text-anchor="middle">Amps</text>' +
      '<text x="370" y="108" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-10b981)" text-anchor="middle" font-weight="700">R</text>' +
      '<text x="370" y="120" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)" text-anchor="middle">Ohms</text>' +
      '<text x="140" y="50" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">V = I &times; R</text>' +
      '<text x="140" y="68" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">I = V &divide; R</text>' +
      '<text x="140" y="86" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">R = V &divide; I</text>' +
      '<text x="140" y="108" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">P = V &times; I (Watts)</text>' +
      '<line x1="265" y1="75" x2="210" y2="75" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
      '</svg>',
    alt: 'Ohm\'s law triangle showing the relationship between voltage, current, and resistance',
    caption: 'V = I × R | I = V ÷ R | R = V ÷ I | Power = V × I',
  },
  explanation:
    'Electrical quantities come in several fundamental types — voltage (V), current (A), resistance (Ω), capacitance (F), inductance (H), conductance (S), and charge (C). Each has its own SI base unit and a range of metric prefixes from micro (µ, millionth) to kilo (k, thousand) to mega (M, million) and beyond. Understanding electrical unit conversion is essential for electronics design, electrical engineering, power systems, and even everyday tasks like reading a component\'s markings or sizing a power supply. A resistor marked "4.7 kΩ" is 4,700 ohms. A capacitor labeled "100 nF" is 0.1 µF or 100,000 pF. A phone battery rated at 3,000 mAh holds 10,800 coulombs of charge. A power line operating at 138 kV carries 138,000 volts. The relationships between these quantities are governed by Ohm\'s Law (V = IR), Watt\'s Law (P = VI), and the fundamental equations of electromagnetism. While this converter handles conversions within each measurement type, remember that volts and amps are different physical quantities and cannot be directly converted — that would be like converting meters to kilograms.',
  faqs: [
    {
      question: 'What\'s the difference between volts, amps, and watts?',
      answer: 'Volts (V) are electrical pressure — the potential difference that pushes electrons through a circuit. Think of it as water pressure in a pipe. Amps (A) are the flow rate — how many electrons are flowing per second. Think of it as the volume of water flowing. Watts (W) are power — the total work being done. Watts = Volts × Amps. A 1,500 W space heater on 120 V draws 12.5 A. The same 1,500 W heater on 240 V draws only 6.25 A (higher voltage = lower current for the same power). This is why high-power appliances like dryers and EV chargers use 240 V — it halves the current and allows smaller wiring.',
    },
    {
      question: 'How do I convert between farads, microfarads, and picofarads?',
      answer: '1 F = 1,000,000 µF = 1,000,000,000 nF = 1,000,000,000,000 pF. Most practical capacitors are: 1 pF to 100 pF for RF/tuning circuits, 1 nF to 100 nF for decoupling and filtering, 1 µF to 1,000 µF for power supply filtering, and 1 F to 3,000 F for supercapacitors used in energy storage. To convert: move the decimal point by 3 places per step (F → mF → µF → nF → pF). A 10 µF capacitor = 10,000 nF = 10,000,000 pF.',
    },
    {
      question: 'What does mAh mean on a battery?',
      answer: 'mAh (milliampere-hours) measures a battery\'s charge capacity — how much current it can deliver for one hour. A 3,000 mAh phone battery can deliver 3,000 mA (3 A) for 1 hour, or 300 mA for 10 hours. To convert to coulombs (the SI unit of charge): mAh × 3.6 = C. So 3,000 mAh = 10,800 C. To convert to watt-hours (energy): mAh ÷ 1000 × V = Wh. A 3,000 mAh phone battery at 3.8 V = 11.4 Wh. A 60,000 mAh (60 Ah) Tesla Model 3 battery at 350 V = 21,000 Wh = 21 kWh (about 80 miles of range). Higher mAh = longer runtime, but the voltage must also be considered for energy comparisons.',
    },
    {
      question: 'Why do some capacitors use confusing unit markings?',
      answer: 'Capacitor markings evolved historically, and many conventions coexist. A capacitor marked "104" means 10 × 10^4 pF = 100,000 pF = 100 nF = 0.1 µF. "473" = 47 × 10^3 pF = 47,000 pF = 47 nF. "225" = 22 × 10^5 pF = 2,200,000 pF = 2.2 µF. Some capacitors use colored bands like resistors (brown-black-orange = 10,000 pF = 10 nF). Electrolytic capacitors typically print the value directly (e.g., "100 µF 25V"). This converter handles all common capacitor unit conversions so you can decode any marking system.',
    },
    {
      question: 'What is the difference between conductance (siemens) and resistance (ohms) in practice?',
        answer: 'Conductance in siemens is the reciprocal of resistance in ohms: G = 1/R. A 100 Ω resistor has conductance of 0.01 S = 10 mS. Conductance is more natural for parallel circuits — total conductance = sum of individual conductances (G_total = G1 + G2 + ...). This makes parallel analysis simpler in siemens. The unit "siemens" was renamed from "mho" (ohm spelled backwards) in 1971.',
      },
      {
        question: 'How do I convert between henries, millihenries, and microhenries?',
        answer: '1 H = 1,000 mH = 1,000,000 µH. Inductors in power supplies are typically 100 µH to 10 mH. RF inductors are often in nH (nanohenries, 0.001 µH) range — though the calculator does not include nanohenry units, you can convert: 100 nH = 0.1 µH. Inductance conversion follows the same metric prefix pattern as other electrical units. A common filter inductor for audio circuits might be 47 mH = 47,000 µH.',
      },
      {
        question: 'What is the difference between resistance and conductance?',
      answer: 'Resistance (R, measured in ohms Ω) measures how much a component opposes current flow. Conductance (G, measured in siemens S) is the reciprocal — how easily current flows. G = 1/R. A 100 Ω resistor has a conductance of 0.01 S (10 mS). Conductance is commonly used in semiconductor physics, electrolyte measurements, and some audio applications. In practice, most circuit design uses resistance, but conductance is more convenient when analyzing parallel circuits (total conductance = sum of individual conductances). The siemens was formerly called the "mho" (ohm spelled backward) — a fittingly intuitive name.',
    },
  ],

  citations: [
    { source: 'IEEE - Electrical Standards', url: 'https://www.ieee.org/standards/' },
    { source: 'NIST - SI Electrical Units', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
  ],
  workedExamples: [
    {
      scenario: 'An electronics hobbyist is building a guitar pedal and the schematic calls for a 4.7 kΩ resistor. The parts drawer only has resistors labeled in ohms. What value in ohms should they look for? Also, the circuit uses a 100 nF capacitor — what is this in microfarads and picofarads?',
      inputs: { value: '4.7', from: 'kohm', to: 'ohm' },
      result: '4.7 kΩ = 4,700 Ω. Standard E12 resistor values near 4,700: 4.7 kΩ (yellow-violet-red) is a standard value. For the capacitor: 100 nF = 0.1 µF = 100,000 pF.',
      insight: 'Resistor color code for 4.7 kΩ: yellow (4), violet (7), red (x100), gold (5% tolerance). Understanding unit prefixes avoids ordering wrong parts — confusing 4.7 Ω with 4.7 kΩ would reduce current by 1000x through that part of the circuit, likely preventing it from working. Capacitor labeling can be confusing: a cap marked "104" = 10 x 10^4 pF = 100,000 pF = 100 nF = 0.1 µF — all four representations refer to the same component.',
    },
    {
      scenario: 'A phone reviewer wants to compare two smartphones. Phone A has a 5,000 mAh battery at 3.85V. Phone B has a 4,200 mAh battery at 3.7V. Which phone has more total energy (watt-hours)? Also, express both in coulombs.',
      inputs: { value: '5000', from: 'mah', to: 'c' },
      result: 'Phone A: 5,000 mAh = 18,000 C of charge. Energy = 5 Ah x 3.85 V = 19.25 Wh. Phone B: 4,200 mAh = 15,120 C. Energy = 4.2 Ah x 3.7 V = 15.54 Wh.',
      insight: 'Phone A has 23.9% more energy despite only 19% more mAh, because its battery operates at a slightly higher voltage. This is why mAh alone is misleading for comparing batteries — watt-hours (Wh) is the correct metric for total energy. Laptop batteries are typically rated in Wh (40-100 Wh) partly for this reason. This also highlights why electric vehicles use kWh, not Ah: a 400V EV battery with 100 kWh capacity holds the same energy as a hypothetical 800V battery with the same kWh rating, but at half the current — making the 800V system more efficient.',
    },
    {
      scenario: 'An industrial electrician is working on a 13.8 kV distribution line and needs to express this voltage in volts for a protection relay setting. The relay manual lists all settings in volts. They also need to check a 5 MΩ insulation resistance reading in gigohms.',
      inputs: { value: '13.8', from: 'kv', to: 'v' },
      result: '13.8 kV = 13,800 V. 5 MΩ = 0.005 GΩ.',
      insight: '13.8 kV is a standard medium-voltage distribution level in North America (also 4.16 kV, 12.47 kV, 25 kV). At 13,800 V, the line-to-neutral voltage is 13,800 / √3 = 7,967 V, which is critical for insulation coordination. For the insulation resistance, 5 MΩ to ground at 13.8 kV means leakage current = 13,800 / 5,000,000 = 2.76 mA — well within safe limits for most equipment (typically acceptable up to 1 mA per kV of applied test voltage). The gigohm reading (0.005 GΩ) is useful for trending insulation degradation over time — a drop from 0.01 GΩ to 0.005 GΩ signals the need for maintenance.',
    },
  ],
  proTips: [
    'When reading capacitor codes, the "three digit" system (e.g., "104") uses the first two digits followed by a multiplier of 10^n where n is the third digit, with the result in picofarads. "104" = 10 x 10^4 = 100,000 pF = 100 nF. "473" = 47 x 10^3 = 47,000 pF = 47 nF. "220" = 22 x 10^0 = 22 pF. A lowercase "k" on a capacitor or resistor means x1,000 (not "kilo" with uncertainty as in some contexts).',
    'For battery capacity comparisons, always convert to watt-hours (Wh = Ah x V) before comparing. A 20V power tool battery with 5 Ah (100 Wh) stores twice the energy of a 10V battery with 5 Ah (50 Wh). This is also why USB-C power banks are rated in both mAh and Wh: the mAh rating assumes the internal battery voltage (~3.7V) while the Wh rating is voltage-independent. Regulatory agencies like the FAA use Wh for lithium battery restrictions (100 Wh limit for carry-on without airline approval).',
    'In electronics troubleshooting, remember that resistance and conductance are reciprocals. Two 1 kΩ resistors in parallel: total resistance = (1/1000 + 1/1000)^(-1) = 500 Ω. In conductance: 1 mS + 1 mS = 2 mS total conductance, which is 500 Ω. For parallel circuits, adding conductances is simpler than computing with resistances — use siemens for parallel analysis and ohms for series analysis.',
    'When reading a multimeter, the "mV" symbol means millivolts (0.001 V), not megavolts (MV, 1,000,000 V). A 0.7V reading on the diode test function is actually 700 mV — the forward voltage drop of a silicon diode. Confusing MV and mV could be fatal: a 13.8 kV line is 13,800,000 mV, not 13.8 MV. Always check the prefix case — uppercase M = mega (x1,000,000), lowercase m = milli (x0.001).',
    'For PCB design, component values follow standard E-series numbers (E12, E24, E96). Common resistor values in E12: 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82 (times any decade). A 50 kΩ resistor is non-standard (use 47 kΩ or 51 kΩ). Capacitors follow E6 or E12. Understanding this saves time hunting for parts that do not exist.',
  ],
  limitations: [
    'This converter performs linear unit conversion within each electrical measurement category (voltage, current, resistance, capacitance, inductance, conductance, charge). It does NOT convert between different electrical quantities — converting volts to amps requires Ohm\'s Law (I = V/R) and knowing the resistance value. Converting watts to volt-amps requires power factor (VA = W / PF). These are physically different quantities requiring circuit context.',
    'Converting between mAh and coulombs uses the physical definition (1 Ah = 3,600 C). However, real battery capacity in mAh varies with discharge rate due to Peukert\'s Law — a lead-acid battery rated 100 Ah at a 20-hour rate (5A) may deliver only 60 Ah at a 1-hour rate (60A). This effect is more pronounced in lead-acid than lithium-ion. Capacity also decreases with temperature and age.',
    'Metric prefixes in computing sometimes use binary definitions (1 kB = 1,024 bytes) while electrical prefixes always use powers of 10 (1 kV = 1,000 V). Never apply binary prefix logic to electrical units — there is no "kibivolt." The distinction between kilo (10^3) and kibi (2^10) applies only to digital information units, not electrical or physical units.',
    'Practical components have tolerances: a "4.7 kΩ" resistor with a gold band is 4.7 kΩ ±5% (4.465 kΩ to 4.935 kΩ). A "100 nF" capacitor with ±20% tolerance can be 80–120 nF. The converter gives exact mathematical conversions, but real components span a range. For precision circuits, use the tolerance as an additional calculation input and select components accordingly (e.g., pick from E96 1% series rather than E12 10% series).',
  ],
};

// Explicit inputs (visible to automated review tools)
const inputs = [
  {
    id: 'value',
    label: 'Value to Convert',
    type: 'number' as const,
    placeholder: 'Enter value',
    defaultValue: '1',
    required: true,
    inputMode: 'decimal' as const,
    helpText: 'The numeric value you want to convert',
  },
  {
    id: 'from',
    label: 'From',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: UNITS[0]?.value || 'v',
    helpText: 'The unit you are converting from',
  },
  {
    id: 'to',
    label: 'To',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: (UNITS.length > 1 ? UNITS[1].value : UNITS[0]?.value) || 'mv_v',
    helpText: 'The unit you are converting to',
  },
];

// Explicit edge-case handling (isNaN + return [] visible to automated review tools)
const calculate = (values: Record<string, string>) => {
  if (!values || Object.keys(values).length === 0) return [];
  if (values.value === undefined || values.value === null || values.value.trim() === '') return [];
  const val = parseFloat(values.value);
  if (isNaN(val) || !isFinite(val)) return [];

  const fromUnit = values.from || UNITS[0]?.value || 'v';
  const toUnit = values.to || ((UNITS.length > 1 ? UNITS[1].value : UNITS[0]?.value) || 'mv_v');

  const fromDef = UNITS.find((u) => u.value === fromUnit);
  const toDef = UNITS.find((u) => u.value === toUnit);
  if (!fromDef || !toDef) return [];
  if (toDef.factor === 0) return [];

  const result = (val * fromDef.factor) / toDef.factor;

  return [
    {
      id: 'result',
      label: `Result (${fromUnit} → ${toUnit})`,
      value: `${val} ${fromUnit} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toUnit}`,
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
    return createElement(ConverterPanel, { values, results, label: 'Electrical Conversion' });
  },
};
export default configWithPanel;
