import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, SelectOption } from '../../../types/calculator';
import ElectricityPanel from './ElectricityPanel';

// ─── Appliance Presets ───────────────────────────────────────────────────────

const APPLIANCE_PRESETS: Record<string, { watts: number; label: string }> = {
  'space-heater':         { watts: 1500, label: 'Space Heater' },
  'window-ac':            { watts: 1200, label: 'Window AC Unit' },
  'central-ac':           { watts: 3500, label: 'Central AC (3.5 ton)' },
  'led-bulb':             { watts: 10,   label: 'LED Bulb' },
  'incandescent-bulb':    { watts: 60,   label: 'Incandescent Bulb' },
  'refrigerator':         { watts: 700,  label: 'Refrigerator (modern)' },
  'old-refrigerator':     { watts: 1500, label: 'Old Refrigerator' },
  'gaming-pc':            { watts: 500,  label: 'Gaming PC' },
  'laptop':               { watts: 65,   label: 'Laptop Charger' },
  'tv':                   { watts: 120,  label: 'LED TV (55")' },
  'clothes-dryer':        { watts: 3000, label: 'Clothes Dryer' },
  'washing-machine':      { watts: 500,  label: 'Washing Machine' },
  'dishwasher':           { watts: 1200, label: 'Dishwasher' },
  'microwave':            { watts: 1000, label: 'Microwave Oven' },
  'toaster':              { watts: 1200, label: 'Toaster' },
  'coffee-maker':         { watts: 900,  label: 'Coffee Maker' },
  'ceiling-fan':          { watts: 75,   label: 'Ceiling Fan' },
  'pool-pump':            { watts: 1500, label: 'Pool Pump' },
  'water-heater':         { watts: 4500, label: 'Water Heater (electric)' },
  'ev-charger':           { watts: 7000, label: 'EV Level 2 Charger' },
};

const PRESET_OPTIONS: SelectOption[] = [
  { label: 'Custom -- enter my own', value: '' },
  ...Object.entries(APPLIANCE_PRESETS).map(([key, v]) => ({
    label: v.label,
    value: key,
  })),
];

const PERIOD_OPTIONS: SelectOption[] = [
  { label: 'Day',               value: '1' },
  { label: 'Week (7 days)',     value: '7' },
  { label: 'Month (30 days)',   value: '30' },
  { label: 'Year (365 days)',   value: '365' },
];

const PERIOD_LABELS: Record<string, string> = {
  '1': 'Day',
  '7': 'Week',
  '30': 'Month',
  '365': 'Year',
};

// ─── Comparative Note ────────────────────────────────────────────────────────

function findComparisonPreset(wattage: number, hoursPerDay: number): string {
  // Find the closest appliance preset
  let bestKey = '';
  let bestDiff = Infinity;
  const dailyWh = wattage * hoursPerDay;
  for (const [key, p] of Object.entries(APPLIANCE_PRESETS)) {
    const presDailyWh = p.watts * hoursPerDay;
    const diff = Math.abs(dailyWh - presDailyWh);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestKey = key;
    }
  }
  if (bestKey && APPLIANCE_PRESETS[bestKey]) {
    return `Roughly equivalent to running a ${APPLIANCE_PRESETS[bestKey].label} for ${hoursPerDay} hrs/day`;
  }
  return '';
}

// ─── Config ──────────────────────────────────────────────────────────────────

const electricityCostConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'preset',
      label: 'Quick Select Appliance',
      type: 'select',
      options: PRESET_OPTIONS,
      helpText: 'Pick a common appliance to auto-fill wattage',
    },
    {
      id: 'wattage',
      label: 'Appliance Wattage',
      type: 'number',
      min: 0,
      step: 1,
      placeholder: 'e.g., 1500',
    },
    {
      id: 'hoursPerDay',
      label: 'Hours Used Per Day',
      type: 'number',
      min: 0,
      step: 0.5,
      placeholder: 'e.g., 4',
    },
    {
      id: 'days',
      label: 'Calculate For',
      type: 'select',
      options: PERIOD_OPTIONS,
      defaultValue: '30',
    },
    {
      id: 'costPerKwh',
      label: 'Electricity Rate ($/kWh)',
      type: 'number',
      min: 0,
      step: 0.001,
      placeholder: 'e.g., 0.14',
      helpText: 'US average is ~$0.14/kWh',
    },
    {
      id: 'applianceCount',
      label: 'Number of Appliances',
      type: 'number',
      min: 1,
      step: 1,
      placeholder: '1',
      defaultValue: '1',
      helpText: 'e.g., 10 LED bulbs',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    // Determine wattage from preset or custom
    let wattage = parseFloat(values.wattage);
    const presetKey = values.preset || '';
    const preset = presetKey ? APPLIANCE_PRESETS[presetKey] : null;

    if (preset && (isNaN(wattage) || wattage <= 0)) {
      wattage = preset.watts;
    }

    const hoursPerDay = parseFloat(values.hoursPerDay);
    const days = parseInt(values.days || '30', 10);
    const costPerKwh = parseFloat(values.costPerKwh);
    const applianceCount = parseInt(values.applianceCount || '1', 10);

    // Validate inputs
    if (isNaN(wattage) || wattage <= 0) return [];
    if (isNaN(hoursPerDay) || hoursPerDay <= 0) return [];
    if (isNaN(days) || days <= 0) return [];
    if (isNaN(costPerKwh) || costPerKwh < 0) return [];

    const count = isNaN(applianceCount) || applianceCount < 1 ? 1 : applianceCount;

    // Core calculations
    const kWhPerDay = (wattage * hoursPerDay) / 1000;
    const kWhPerPeriod = kWhPerDay * days;
    const totalCost = kWhPerPeriod * costPerKwh * count;
    const costPerDay = kWhPerDay * costPerKwh * count;
    const costPerMonth = kWhPerDay * 30 * costPerKwh * count;
    const costPerYear = kWhPerDay * 365 * costPerKwh * count;

    // Appliance label
    const applianceLabel = preset
      ? `${preset.label}${count > 1 ? ` (×${count})` : ''}`
      : `Custom Appliance${count > 1 ? ` (×${count})` : ''}`;

    // Comparison note
    const comparisonNote = findComparisonPreset(wattage, hoursPerDay);

    // Format helpers
    const fmtCurrency = (n: number): string => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
      if (n >= 1) return `$${n.toFixed(2)}`;
      if (n >= 0.01) return `$${n.toFixed(2)}`;
      return `$${n.toFixed(4)}`;
    };

    const fmtKwh = (n: number): string => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M kWh`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K kWh`;
      return `${parseFloat(n.toFixed(2))} kWh`;
    };

    return [
      {
        id: 'costPerPeriod',
        label: `Energy Cost (${PERIOD_LABELS[String(days)] || 'Period'})`,
        value: fmtCurrency(totalCost),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'kwhUsed',
        label: 'Energy Used',
        value: fmtKwh(kWhPerPeriod * count),
      },
      {
        id: 'kwhPerDay',
        label: 'Daily Usage',
        value: fmtKwh(kWhPerDay * count),
      },
      {
        id: 'costPerDay',
        label: 'Cost Per Day',
        value: fmtCurrency(costPerDay),
      },
      {
        id: 'costPerMonth',
        label: 'Projected Monthly Cost',
        value: fmtCurrency(costPerMonth),
      },
      {
        id: 'costPerYear',
        label: 'Projected Yearly Cost',
        value: fmtCurrency(costPerYear),
        highlight: true,
      },
      {
        id: 'applianceLabel',
        label: 'Appliance',
        value: applianceLabel,
      },
      {
        id: 'equivalentNote',
        label: 'Comparison',
        value: comparisonNote,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ElectricityPanel, { values, results });
  },
  educational: {
    formula: 'Cost = (Watts × Hours/Day × Days) / 1000 × $/kWh × Quantity',
    formulaDescription:
      'Calculate the energy cost of any electrical appliance. First find kilowatt-hours (kWh), then multiply by your electricity rate.',
    variables: [
      { symbol: 'W × h', name: 'Wattage & Usage', description: 'Power rating in Watts multiplied by hours of use per day. The foundation of energy consumption calculation.' },
      { symbol: 'd', name: 'Number of Days', description: 'Billing period or time span to calculate over.' },
      { symbol: '¢', name: 'Cost per kWh', description: 'Your electricity rate in cents per kilowatt-hour. Found on your electric bill.' },
    ],
    howToUse: [
      'Select an appliance from the Quick Select list to auto-fill wattage, or enter a custom value.',
      'Enter the average hours of use per day.',
      'Choose a period (Day, Week, Month, or Year) or use the default 30-day calculation.',
      'Enter your electricity rate in $/kWh (US average is ~$0.14).',
      'Set the number of identical appliances (e.g., 10 LED bulbs).',
    ],
    explanation:
      'Electricity is billed per kilowatt-hour (kWh), which represents 1,000 watts used for one hour. This calculator converts appliance wattage to kilowatt-hours, multiplies by your local electricity rate, and projects costs over daily, monthly, and yearly periods. Understanding appliance energy costs helps you identify energy-saving opportunities and manage your electric bill. Practical example: a gaming PC drawing 500W used for 6 hours per day. Daily consumption: (500 × 6) / 1000 = 3 kWh. At $0.14/kWh, daily cost = $0.42, monthly cost (30 days) = $12.60, yearly cost = $153.30. Compare with an LED TV (120W) used 6 hours: 0.72 kWh/day, $0.10/day, $3.02/month, $36.74/year. The gaming PC costs over 4 times more to run. Edge cases: for appliances with variable power draw, such as refrigerators and air conditioners that cycle on and off, the nameplate wattage overestimates actual consumption — a refrigerator rated at 700W typically runs only about 30% of the time, averaging 210W. Use a plug-in power meter (like a Kill-A-Watt) for accurate measurements. For electric vehicle charging at Level 2 (7,000W for 4 hours), consumption is 28 kWh/day, costing $3.92/day, $117.60/month, $1,430.80/year. Time-of-use billing can significantly affect costs — charging overnight at off-peak rates (potentially $0.08/kWh) versus peak rates ($0.30/kWh) can cut EV charging costs by 70%. For standby power (vampire power), devices like cable boxes, game consoles, and phone chargers draw 1-10W continuously — 10 such devices at 5W each, 24/7, costs about $0.50/month at average rates, or $6/year in wasted energy.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="20" y="50" width="60" height="60" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="8"/><text x="50" y="78" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10" font-weight="bold">Appliance</text><text x="50" y="91" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">1500 W</text><line x1="80" y1="80" x2="120" y2="80" stroke="var(--svg-3b82f6)" stroke-width="2" marker-end="url(#ab)"/><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><rect x="120" y="40" width="70" height="80" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="2" rx="5"/><text x="155" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="12" font-weight="bold">kWh</text><text x="155" y="85" text-anchor="middle" fill="var(--svg-ef4444)" font-size="11">Meter</text><text x="155" y="100" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">(W &amp;times; h)</text><text x="155" y="112" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">/ 1000</text><line x1="190" y1="80" x2="230" y2="80" stroke="var(--svg-ef4444)" stroke-width="2"/><rect x="230" y="45" width="70" height="70" fill="var(--svg-d1fae5)" stroke="var(--svg-059669)" stroke-width="2" rx="8"/><text x="265" y="78" text-anchor="middle" fill="var(--svg-065f46)" font-size="11" font-weight="bold">Cost</text><text x="265" y="93" text-anchor="middle" fill="var(--svg-065f46)" font-size="9">$ Price</text><text x="265" y="105" text-anchor="middle" fill="var(--svg-065f46)" font-size="8">kWh &amp;times; rate</text><text x="160" y="155" text-anchor="middle" fill="var(--svg-4b5563)" font-size="10">Cost = (Watts &amp;times; Hours) / 1000 &amp;times; $/kWh</text><rect x="50" y="165" width="220" height="22" fill="var(--svg-e5e7eb)" rx="4"/><text x="160" y="180" text-anchor="middle" fill="var(--svg-374151)" font-size="10">500 W &amp;times; 6 h/day &amp;divide; 1000 = 3 kWh/day</text></svg>',
      alt: 'Flow diagram showing appliance power converted to kilowatt-hours and then to cost',
      caption: 'Electricity cost calculation: appliance wattage is converted to kilowatt-hours, then multiplied by the electricity rate.',
    },
    faqs: [
      {
        question: 'What is a kilowatt-hour (kWh)?',
        answer: 'A kilowatt-hour is a unit of energy equal to using 1,000 watts for one hour. If a 100W light bulb runs for 10 hours, it uses 1 kWh. Your electric bill charges you per kWh consumed.',
      },
      {
        question: 'What is the average US electricity rate?',
        answer: 'As of recent data, the US average residential electricity rate is approximately $0.14 per kWh. Rates vary significantly by state — from under $0.10 in some states to over $0.30 in others (e.g., Hawaii, California).',
      },
      {
        question: 'How can I reduce my electricity bill?',
        answer: 'Replace incandescent bulbs with LEDs, unplug devices when not in use, use smart power strips, run major appliances during off-peak hours, maintain HVAC systems, improve home insulation, and consider energy-efficient appliances (look for ENERGY STAR ratings).',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Electricity Pricing', url: 'https://en.wikipedia.org/wiki/Electricity_pricing' },
      { source: 'Wolfram MathWorld', title: 'Electricity Cost', url: 'https://mathworld.wolfram.com/' },
    ],
  },
};

export default electricityCostConfig;
