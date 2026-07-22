import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'j', label: 'Joule (J)', shortLabel: 'J', factor: 1 },
  { value: 'kj', label: 'Kilojoule (kJ)', shortLabel: 'kJ', factor: 1000 },
  { value: 'cal', label: 'Calorie (cal)', shortLabel: 'cal', factor: 4.184 },
  { value: 'kcal', label: 'Kilocalorie (kcal / Food Calorie)', shortLabel: 'kcal', factor: 4184 },
  { value: 'wh', label: 'Watt-hour (Wh)', shortLabel: 'Wh', factor: 3600 },
  { value: 'kwh', label: 'Kilowatt-hour (kWh)', shortLabel: 'kWh', factor: 3_600_000 },
  { value: 'btu', label: 'British Thermal Unit (BTU)', shortLabel: 'BTU', factor: 1055.06 },
  { value: 'ftlb', label: 'Foot-Pound (ft·lb)', shortLabel: 'ft·lb', factor: 1.35582 },
  { value: 'ev', label: 'Electronvolt (eV)', shortLabel: 'eV', factor: 1.602176634e-19 },
  { value: 'therm', label: 'Therm', shortLabel: 'therm', factor: 105_506_000 },
  { value: 'tce', label: 'Tonne of Coal Equivalent (TCE)', shortLabel: 'TCE', factor: 29_307_600_000 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Energy conversion uses linear factors relative to the Joule (J), the SI base unit of energy. Each unit is converted to Joules first, then divided by the target unit\'s Joule factor. For example, converting 1 kWh to BTU: 1 kWh × 3,600,000 J/kWh ÷ 1055.06 J/BTU = 3412.14 BTU.',
  variables: [
    { symbol: 'E', name: 'Energy', description: 'The capacity to do work, measured in joules (SI) or various derived units for specific contexts.' },
    { symbol: '1 J', name: 'One Joule', description: 'The energy transferred when a one-newton force moves an object one meter. The SI base unit of energy.' },
    { symbol: '1 kWh', name: 'One Kilowatt-Hour', description: 'The energy consumed by a 1,000-watt device running for one hour. Equal to 3.6 million joules. The standard unit for electricity billing.' },
    { symbol: '1 cal', name: 'One Calorie', description: 'The energy needed to raise one gram of water by 1°C. Food Calories (kcal) are 1,000 times larger.' },
    { symbol: '1 BTU', name: 'One British Thermal Unit', description: 'The energy to raise one pound of water by 1°F. Used for HVAC, heating systems, and natural gas. 1 BTU ≈ 1,055 J.' },
  ],
  howToUse: [
    'Enter the energy value you want to convert in the "Value" field.',
    'Select the current energy unit from the "From" dropdown.',
    'Select the desired energy unit from the "To" dropdown.',
    'The converted value is displayed instantly along with the conversion formula.',
    'Check the common uses section for real-world energy comparisons — like how many kWh a home uses or the energy content of gasoline.',
  ],
  quickReference: [
    { label: '1 kWh', value: '3.6 MJ / 3,412 BTU' },
    { label: '1 BTU', value: '1.055 kJ / 0.000293 kWh' },
    { label: '1 cal', value: '4.184 J' },
    { label: '1 food Cal (kcal)', value: '4.184 kJ' },
    { label: '1 therm', value: '105.5 MJ / 29.3 kWh' },
    { label: '1 eV', value: '1.602 × 10⁻¹⁹ J' },
    { label: '1 ft·lb', value: '1.356 J' },
    { label: '1 TCE', value: '29.3 GJ / 8,141 kWh' },
  ],
  commonUses: [
    'Average US home: ~900 kWh/month (30 kWh/day)',
    'EV battery: 50–100 kWh for 200–350 miles of range',
    'Gasoline: 33.7 kWh per gallon of energy content',
    'Human daily food energy: ~2,000 kcal (8.37 MJ)',
    'AC unit: 12,000 BTU/h (3.5 kW) cools ~500 sq ft',
    'Light bulb: 10 W LED running 100 hours = 1 kWh',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Energy Forms &amp; Conversions Are Everywhere</text>' +
      '<rect x="15" y="40" width="100" height="50" rx="6" fill="var(--svg-fef2f2)" stroke="var(--svg-ef4444)" stroke-width="1.5"/>' +
      '<text x="65" y="62" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-991b1b)" text-anchor="middle" font-weight="600">Chemical</text>' +
      '<text x="65" y="78" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Battery, Fuel</text>' +
      '<text x="135" y="68" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-94a3b8)" text-anchor="middle">&rarr;</text>' +
      '<rect x="153" y="40" width="100" height="50" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<text x="203" y="62" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e40af)" text-anchor="middle" font-weight="600">Electrical</text>' +
      '<text x="203" y="78" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Current, Grid</text>' +
      '<text x="273" y="68" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-94a3b8)" text-anchor="middle">&rarr;</text>' +
      '<rect x="290" y="40" width="100" height="50" rx="6" fill="var(--svg-f0fdf4)" stroke="var(--svg-10b981)" stroke-width="1.5"/>' +
      '<text x="340" y="62" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-166534)" text-anchor="middle" font-weight="600">Kinetic</text>' +
      '<text x="340" y="78" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Motion, Heat</text>' +
      '<rect x="100" y="100" width="280" height="24" rx="4" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
      '<text x="240" y="116" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">1 kWh = 3.6 MJ = 3,412 BTU = 860 kcal | Energy is conserved, only form changes</text>' +
      '</svg>',
    alt: 'Energy conversion flow diagram showing chemical to electrical to kinetic energy transformation',
    caption: 'Energy converts between forms; the total energy is always conserved',
  },
  explanation:
    'Energy exists in many forms — mechanical, electrical, thermal, chemical, and nuclear — and each field has developed its own preferred units. Physicists use joules (J), the SI unit. Electricity bills measure consumption in kilowatt-hours (kWh). Food energy is labeled in kilocalories (kcal) or Calories. Heating and cooling systems use BTUs. Chemistry and particle physics use electronvolts (eV). Natural gas is measured in therms, and coal energy in tonnes of coal equivalent (TCE). Understanding energy conversions is essential for comparing energy costs, evaluating appliance efficiency, calculating exercise calorie burn, and understanding climate and energy policy. For example, one gallon of gasoline contains about 33.7 kWh of energy, while an average US home uses about 900 kWh per month. A single calorie (food Calorie, technically a kilocalorie) can raise the temperature of one kilogram of water by 1°C.',
  faqs: [
    {
      question: 'What is the difference between a calorie and a food Calorie?',
      answer: 'A calorie (cal) with a lowercase "c" is the amount of energy needed to raise 1 gram of water by 1°C. A food Calorie (Cal or kcal) with a capital "C" equals 1,000 small calories (1 kcal). When a food label says "200 Calories," it means 200,000 small calories or 200 kcal. In scientific contexts, the joule is preferred — 1 food Calorie = 4,184 J = 4.184 kJ.',
    },
    {
      question: 'How do I compare energy costs between electricity and gas?',
      answer: 'First convert both to the same unit. Electricity is billed in kWh (1 kWh = 3,412 BTU). Natural gas is billed in therms (1 therm = 100,000 BTU) or cubic feet. To compare: if electricity costs $0.12/kWh and gas costs $1.00/therm, divide by efficiency — electric resistance heat is 100% efficient, while gas furnaces are 80-98% efficient. The effective cost per BTU: electricity = $0.12 ÷ 3,412 = $0.000035/BTU; gas = $1.00 ÷ 100,000 ÷ 0.95 = $0.0000105/BTU — gas is about 3x cheaper per BTU of heat delivered.',
    },
    {
      question: 'How many kWh does a typical home use?',
      answer: 'The average US home uses about 900 kWh per month (30 kWh per day). A typical refrigerator uses 100-200 kWh per year, an AC unit uses 2,000-4,000 kWh per year depending on climate, and LED lighting uses about 200-400 kWh per year. To convert your appliance wattage to kWh: (watts × hours used per day ÷ 1000) × 30 = monthly kWh. A 1,500 W space heater running 8 hours/day: (1500 × 8 ÷ 1000) × 30 = 360 kWh/month.',
    },
    {
      question: 'What is the difference between energy and power?',
      answer: 'Energy is the total amount of work done, measured in joules, kWh, or calories. Power is the rate at which energy is used, measured in watts (joules per second) or horsepower. Think of energy as the total distance traveled and power as the speed. A 100 W bulb running for 10 hours uses 1 kWh of energy. A 1,000 W microwave running for 1 hour uses the same 1 kWh — both consume the same energy, but the microwave uses power 10x faster.',
    },
    {
      question: 'How does a BTU relate to air conditioner sizing?',
      answer: 'BTU (British Thermal Unit) measures thermal energy. Air conditioner capacity is rated in BTU per hour (BTU/h). A 12,000 BTU/h unit can remove 12,000 BTUs of heat per hour. General sizing: 5,000-6,000 BTU for 150-250 sq ft, 12,000 BTU for 500-600 sq ft, and 18,000-24,000 BTU for 1,000-1,500 sq ft. In kW, 12,000 BTU/h ≈ 3.5 kW. Oversizing causes short cycling and poor humidity removal; undersizing means the unit runs constantly without reaching the set temperature.',
    },
  ],

  citations: [
    { source: 'NIST - Energy Units', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
    { source: 'ISO - Energy Standards', url: 'https://www.iso.org/standard/30669.html' },
  ],
};

const converterConfig = createConverter({ units: UNITS, educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Energy Conversion' });
  },
};
export default configWithPanel;
