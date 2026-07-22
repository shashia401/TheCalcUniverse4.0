import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import FuelEconomyPanel from './FuelEconomyPanel';

// Fuel economy conversions use inverse relationships (mpg = constant / L/100km),
// so the factory's linear factor approach cannot handle them.

const UNIT_META: Record<string, { label: string; shortLabel: string; toBase: (v: number) => number; fromBase: (v: number) => number }> = {
  l100km: {
    label: 'Liters per 100 km (L/100km)',
    shortLabel: 'L/100km',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  usmpg: {
    label: 'Miles per US Gallon (US mpg)',
    shortLabel: 'US mpg',
    toBase: (v) => v > 0 ? 235.214583 / v : NaN,
    fromBase: (v) => v > 0 ? 235.214583 / v : NaN,
  },
  ukmpg: {
    label: 'Miles per UK Gallon (UK mpg)',
    shortLabel: 'UK mpg',
    toBase: (v) => v > 0 ? 282.481 / v : NaN,
    fromBase: (v) => v > 0 ? 282.481 / v : NaN,
  },
  kml: {
    label: 'Kilometers per Liter (km/L)',
    shortLabel: 'km/L',
    toBase: (v) => v > 0 ? 100 / v : NaN,
    fromBase: (v) => v > 0 ? 100 / v : NaN,
  },
  usgal100mi: {
    label: 'US Gallons per 100 Miles (gal/100mi)',
    shortLabel: 'gal/100mi (US)',
    toBase: (v) => v * 2.352,
    fromBase: (v) => v / 2.352,
  },
  ukgal100mi: {
    label: 'UK Gallons per 100 Miles (gal/100mi)',
    shortLabel: 'gal/100mi (UK)',
    toBase: (v) => v * 2.825,
    fromBase: (v) => v / 2.825,
  },
};

const UNIT_VALUES = Object.keys(UNIT_META);
const OPTIONS = UNIT_VALUES.map((v) => ({ label: UNIT_META[v].label, value: v }));
const OPTIONS_SORTED = [...OPTIONS].sort((a, b) => a.label.localeCompare(b.label));

const fuelEconomyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'fromValue',
      label: 'Value',
      type: 'number',
      placeholder: '10',
      step: 0.1,
      required: true,
    },
    {
      id: 'fromUnit',
      label: 'From',
      type: 'select',
      required: true,
      options: OPTIONS_SORTED,
    },
    {
      id: 'toUnit',
      label: 'To',
      type: 'select',
      required: true,
      options: OPTIONS_SORTED,
    },
  ],
  calculate: (values) => {
    const rawValue = values.fromValue?.trim();
    const fromUnit = values.fromUnit?.trim();
    const toUnit = values.toUnit?.trim();
    if (!rawValue || !fromUnit || !toUnit) return [];
    const fromValue = parseFloat(rawValue);
    if (isNaN(fromValue) || !isFinite(fromValue) || fromValue <= 0) return [];

    const fromMeta = UNIT_META[fromUnit];
    const toMeta = UNIT_META[toUnit];
    if (!fromMeta || !toMeta) return [];

    // Convert to base (L/100km) then to target
    const baseValue = fromMeta.toBase(fromValue);
    if (isNaN(baseValue) || !isFinite(baseValue) || baseValue <= 0) return [];
    const result = toMeta.fromBase(baseValue);
    if (isNaN(result) || !isFinite(result)) return [];

    const formatted = parseFloat(result.toFixed(4)).toString();
    const fromLabel = fromMeta.shortLabel;
    const toLabel = toMeta.shortLabel;

    const results: CalculatorResult[] = [
      {
        id: 'result',
        label: 'Result',
        value: `${formatted} ${toLabel}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'formula',
        label: 'Conversion',
        value: `${rawValue} ${fromLabel} = ${formatted} ${toLabel}`,
      },
    ];

    // Add L/100km equivalent for reference
    const baseFormatted = parseFloat(baseValue.toFixed(4)).toString();
    if (fromUnit !== 'l100km' && toUnit !== 'l100km') {
      results.push({
        id: 'baseEquivalent',
        label: 'Equivalent',
        value: `${baseFormatted} L/100km`,
        color: 'neutral' as const,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FuelEconomyPanel, { values, results });
  },
  educational: {
    formula: 'US mpg = 235.215 ÷ L/100km | L/100km = 235.215 ÷ US mpg',
    formulaDescription:
      'Fuel economy conversion uses inverse relationships because miles per gallon (distance per volume) and liters per 100 km (volume per distance) are reciprocal measures. There is no linear conversion factor between them. The constant 235.215 converts between US gallons and the metric system: 1 US gallon = 3.78541 L, 1 mile = 1.60934 km, and the conversion factor = (3.78541 × 100) ÷ 1.60934 ≈ 235.215. The UK gallon constant (282.481) uses 1 UK gallon = 4.54609 L instead.',
    variables: [
      { symbol: 'L/100km', name: 'Liters per 100 Kilometers', description: 'Metric fuel consumption measure — how many liters of fuel the vehicle consumes to travel 100 km. Lower is better.' },
      { symbol: 'mpg (US)', name: 'Miles per US Gallon', description: 'US standard fuel economy measure — how many miles the vehicle can travel on one US gallon (3.785 L) of fuel. Higher is better.' },
      { symbol: 'mpg (UK)', name: 'Miles per Imperial Gallon', description: 'UK/imperial fuel economy measure using the larger imperial gallon (4.546 L). UK mpg values are about 20% higher than US mpg for the same fuel consumption.' },
      { symbol: 'Constant 235.2', name: 'US Conversion Factor', description: 'The magic number that converts US mpg to L/100km and vice versa. Derived from: (3.78541 L/gal × 100 km) ÷ 1.60934 km/mi.' },
      { symbol: 'km/L', name: 'Kilometers per Liter', description: 'A metric fuel economy measure widely used outside North America. Higher is better. 1 km/L ≈ 2.352 US mpg. Common range: 10-25 km/L for efficient cars.' },
    ],
    howToUse: [
      'Enter the fuel economy value you want to convert in the "Value" field.',
      'Select the current unit from the "From" dropdown (e.g., US mpg, L/100km).',
      'Select the desired unit from the "To" dropdown.',
      'The converted value appears instantly. Note that fuel economy conversions are inverse — doubling mpg does not halve L/100km.',
      'Use the quick reference table for common fuel economy values across all unit systems and typical vehicle comparisons.',
    ],
    quickReference: [
      { label: '25 US mpg', value: '9.41 L/100km / 30 UK mpg' },
      { label: '30 US mpg', value: '7.84 L/100km / 36 UK mpg' },
      { label: '8 L/100km', value: '29.4 US mpg / 35.3 UK mpg' },
      { label: '10 L/100km', value: '23.5 US mpg / 28.2 UK mpg' },
      { label: '1 US mpg', value: '1.201 UK mpg' },
      { label: '1 UK mpg', value: '0.833 US mpg' },
      { label: '1 km/L', value: '2.352 US mpg / 2.825 UK mpg' },
      { label: '1 gal/100mi (US)', value: '2.352 L/100km' },
    ],
    commonUses: [
      'Compact car (Toyota Corolla): ~33 US mpg (7.1 L/100km) combined',
      'SUV (Honda CR-V): ~28 US mpg (8.4 L/100km) combined',
      'Pickup truck (Ford F-150): ~20 US mpg (11.8 L/100km) combined',
      'Electric car Tesla Model 3: ~132 MPGe (gasoline-equivalent)',
      'Semi truck: ~6–8 US mpg (30–40 L/100km) at highway speeds',
      'Highway vs city: most cars are 15–30% more efficient on the highway',
    ],

    diagram: {
      svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">MPG vs. L/100km &mdash; Inverse Relationship</text>' +
        '<line x1="50" y1="100" x2="440" y2="100" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<line x1="50" y1="100" x2="50" y2="20" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<path d="M 55 25 Q 100 25 150 40 Q 220 65 280 80 Q 350 90 430 98" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
        '<circle cx="100" cy="32" r="10" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/>' +
        '<text x="100" y="36" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">50</text>' +
        '<circle cx="250" cy="73" r="10" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/>' +
        '<text x="250" y="77" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">25</text>' +
        '<circle cx="400" cy="97" r="10" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/>' +
        '<text x="400" y="101" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">10</text>' +
        '<text x="240" y="122" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)" text-anchor="middle">MPG &rarr; (higher = better)</text>' +
        '<text x="20" y="55" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-475569)" text-anchor="middle" transform="rotate(-90,20,55)">L/100km &darr;</text>' +
        '<text x="320" y="38" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle" font-style="italic">Doubling mpg halves L/100km</text>' +
        '<text x="320" y="50" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle" font-style="italic">10&rarr;20 mpg saves more than 40&rarr;80</text>' +
        '</svg>',
      alt: 'Graph showing the inverse hyperbolic relationship between MPG and L/100km fuel economy',
      caption: 'MPG and L/100km are inversely related — doubling mpg halves L/100km',
    },
    explanation:
      'Fuel economy is measured differently around the world, and the two main systems — miles per gallon (mpg) and liters per 100 km (L/100km) — are inversely related. This means that improving from 10 to 20 mpg saves far more fuel than improving from 30 to 40 mpg. The relationship is hyperbolic, not linear. The US uses miles per US gallon (3.785 L), the UK uses miles per imperial gallon (4.546 L), and virtually every other country uses liters per 100 km. Canada officially uses L/100km but also displays US mpg on vehicle window stickers for border crossers. Understanding fuel economy conversions is essential for car buyers comparing vehicles from different markets, fleet managers calculating fuel costs, and road trippers estimating expenses in foreign countries. A vehicle getting 8 L/100km (29.4 US mpg) uses about $1,200 in fuel per year at $3/gal driving 15,000 miles. At 12 L/100km (19.6 US mpg), that same distance costs about $2,300 — the difference is significant.',
    faqs: [
      {
        question: 'Why can\'t you use a simple multiplier to convert mpg to L/100km?',
        answer: 'Because mpg and L/100km are inversely related — they measure opposite things. MPG is distance per volume (how far you go on a gallon), while L/100km is volume per distance (how much fuel you burn to go 100 km). Doubling your mpg does NOT halve your L/100km. For example: 10 mpg = 23.5 L/100km, 20 mpg = 11.8 L/100km (L/100km halved), but 40 mpg = 5.9 L/100km, 80 mpg = 2.9 L/100km. Each doubling of mpg cuts L/100km in half, but the absolute savings decrease at higher efficiencies.',
      },
      {
        question: 'What is the difference between US mpg and UK mpg?',
        answer: 'A US gallon is 3.785 liters, while a UK (imperial) gallon is 4.546 liters — about 20% larger. This means the same car will show a higher number in UK mpg than US mpg. For example, a car doing 30 US mpg would get about 36 UK mpg. Always check which gallon your source uses. Canadian vehicles are sometimes advertised with US mpg on window stickers alongside L/100km, adding to the confusion. This converter handles both systems precisely.',
      },
      {
        question: 'What is considered good fuel economy?',
        answer: 'For gasoline cars in 2025: Excellent: under 6 L/100km (over 39 US mpg) — hybrids and efficient compacts. Good: 6-8 L/100km (29-39 US mpg) — modern sedans and hatchbacks. Average: 8-10 L/100km (24-29 US mpg) — typical SUVs and crossovers. Poor: 10-13 L/100km (18-24 US mpg) — large SUVs and trucks. Very Poor: over 13 L/100km (under 18 US mpg). Electric vehicles are measured in MPGe (miles per gallon equivalent) — most EVs achieve 100-140 MPGe, but the direct comparison is tricky because electricity costs differ from gasoline.',
      },
      {
        question: 'How do I calculate my actual fuel economy?',
        answer: 'Fill your tank completely and reset the trip odometer. Drive normally until the tank is nearly empty. Fill the tank again completely and note the gallons pumped (or liters). Divide the miles driven by gallons used: mpg = miles ÷ gallons. For L/100km: (liters pumped ÷ km driven) × 100. For best accuracy, repeat this across 3-5 fill-ups and average the results. The EPA estimates on window stickers are usually slightly optimistic — real-world mileage is typically 5-15% lower depending on driving conditions, traffic, and climate.',
      },
      {
        question: 'How does driving speed affect fuel economy?',
        answer: 'Fuel economy drops significantly above 50 mph (80 km/h) due to aerodynamic drag, which increases with the square of speed. At 55 mph, most cars achieve peak efficiency. At 75 mph, fuel economy is typically 15-25% worse than at 55 mph. For a car getting 30 mpg at 55 mph, expect about 23 mpg at 75 mph — a $350+ annual difference for a typical commuter. Other factors: aggressive acceleration can reduce economy by 10-30%, carrying roof cargo reduces it by 5-25%, and cold weather reduces it by 10-20% due to thicker oil and longer warm-up times.',
      },
    ],
  
    citations: [
      { source: 'EPA - Fuel Economy', url: 'https://www.fueleconomy.gov/' },
      { source: 'NIST - Unit Conversion', url: 'https://www.nist.gov/pml/owm/metric-si/unit-conversion' },
    ],
  },
};

export default fuelEconomyConfig;
