import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'mg', label: 'Milligram (mg)', shortLabel: 'mg', factor: 0.001 },
  { value: 'g', label: 'Gram (g)', shortLabel: 'g', factor: 1 },
  { value: 'kg', label: 'Kilogram (kg)', shortLabel: 'kg', factor: 1000 },
  { value: 't', label: 'Metric Tonne (t)', shortLabel: 't', factor: 1000000 },
  { value: 'oz', label: 'Ounce (oz)', shortLabel: 'oz', factor: 28.349523125 },
  { value: 'lb', label: 'Pound (lb)', shortLabel: 'lb', factor: 453.59237 },
  { value: 'st', label: 'Stone (st)', shortLabel: 'st', factor: 6350.29318 },
  { value: 'usTon', label: 'US Ton', shortLabel: 'ton', factor: 907184.74 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Weight (mass) conversion uses linear scaling factors relative to the gram. Each unit has a fixed conversion factor to grams. To convert from unit A to unit B, multiply the input value by the ratio of the two factors.',
  variables: [
    { symbol: 'g', name: 'Gram', description: 'The metric base unit of mass. One gram is defined as 1/1000 of a kilogram. The mass of one cubic centimeter of water at 4°C.' },
    { symbol: 'kg', name: 'Kilogram', description: 'The SI base unit of mass. Originally defined as the mass of one liter of water, now defined by the Planck constant. The standard for everyday weight worldwide outside the US.' },
    { symbol: 'lb & oz', name: 'Pound & Ounce', description: 'Pound (453.59237 g): the primary weight unit in the US, UK, and some Commonwealth countries. Ounce (28.3495 g): 1/16 of a pound, used for food, mail, and precious metals.' },
    { symbol: 't & usTon', name: 'Tonne & US Ton', description: 'Metric tonne (1,000 kg): used worldwide for industrial and commercial weight. US ton (2,000 lb ≈ 907 kg): used in the US for heavy goods, vehicles, and freight.' },
  ],
  howToUse: [
    'Enter the weight value you want to convert.',
    'Select the current weight unit from the "From" dropdown.',
    'Select the desired weight unit from the "To" dropdown.',
    'The converted value is displayed instantly with the formula. Use this for cooking, shipping, fitness, or science calculations.',
  ],
  quickReference: [
    { label: '1 kg', value: '2.205 lb / 35.274 oz' },
    { label: '1 lb', value: '0.454 kg / 16 oz / 453.592 g' },
    { label: '1 oz', value: '28.35 g / 0.0625 lb' },
    { label: '1 st', value: '14 lb / 6.35 kg' },
    { label: '1 t', value: '1,000 kg / 2,204.6 lb / 1.102 US tons' },
    { label: '1 US ton', value: '2,000 lb / 907.185 kg / 0.907 t' },
    { label: '1 g', value: '0.035 oz / 1,000 mg' },
  ],
  commonUses: [
    'Fitness: converting body weight between kg and lb for workout programs and health tracking',
    'Cooking: scaling recipes that use grams, ounces, or pounds for accurate ingredient measurements',
    'Shipping and freight: calculating charges based on weight in kg, lb, or tonnes for air, sea, and ground transport',
    'Science: measuring chemicals and samples in milligrams, grams, or kilograms for experiments',
    'International trade: converting product specifications and shipping weights between metric and imperial systems',
    'Precious metals: weighing gold and silver in troy ounces (31.1035 g) for pricing and trading',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Common Weight Units Relative Comparison</text>' +
      '<!-- 1 kg bar -->' +
      '<rect x="20" y="35" width="200" height="24" rx="3" fill="var(--svg-3b82f6)" opacity="0.6"/>' +
      '<text x="120" y="51" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Kilogram (2.205 lb)</text>' +
      '<!-- 1 lb bar -->' +
      '<rect x="20" y="70" width="91" height="24" rx="3" fill="var(--svg-ef4444)" opacity="0.6"/>' +
      '<text x="65" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Pound (0.454 kg)</text>' +
      '<!-- 1 oz bar -->' +
      '<rect x="20" y="105" width="5.7" height="24" rx="2" fill="var(--svg-22c55e)" opacity="0.6"/>' +
      '<text x="40" y="121" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-22c55e)" font-weight="600">1 oz (28.35 g)</text>' +
      '<!-- 1 st bar -->' +
      '<rect x="130" y="70" width="127" height="24" rx="3" fill="var(--svg-8b5cf6)" opacity="0.6"/>' +
      '<text x="193" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Stone (14 lb / 6.35 kg)</text>' +
      '<!-- scale -->' +
      '<line x1="20" y1="140" x2="220" y2="140" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
      '<line x1="20" y1="136" x2="20" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="20" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0</text>' +
      '<line x1="120" y1="136" x2="120" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="120" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0.5 kg</text>' +
      '<line x1="220" y1="136" x2="220" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="220" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">1 kg</text>' +
      '</svg>',
    alt: 'Visual comparison of 1 kilogram, 1 pound, 1 ounce, and 1 stone drawn to relative scale',
    caption: 'Metric and imperial weight units compared. The kilogram is the SI standard; the pound is the US/UK customary unit.',
  },
  explanation:
    'Weight measurement (more precisely, mass measurement) is fundamental to commerce, science, and daily life. The kilogram is the SI base unit of mass and the only SI base unit still defined by a physical constant (the Planck constant) after the 2019 redefinition. Before 2019, the kilogram was defined by the International Prototype of the Kilogram (IPK), a platinum-iridium cylinder kept in a vault near Paris. The gram is 1/1000 of a kilogram and is the everyday unit for cooking and small quantities. The pound has ancient origins, dating back to Roman times (libra pondo), which gives lb its symbol. The international avoirdupois pound was standardized as exactly 0.45359237 kg in 1959. The ounce (1/16 lb) is used for food portions, letters, and precious metals. The stone (14 lb) remains common in the UK and Ireland for expressing body weight — someone weighing 70 kg is about 11 stone. Metric tonnes (1,000 kg) are used for industrial quantities; US tons (2,000 lb) for heavy goods in the US. Understanding weight conversions is crucial for international shipping, fitness tracking, and cooking across cultures.',
  faqs: [
    {
      question: 'What is the difference between weight and mass?',
      answer: 'Mass is the amount of matter in an object and is constant everywhere in the universe. Weight is the force exerted on that mass by gravity. On Earth, the difference is negligible for everyday purposes because gravity is nearly uniform. But on the Moon, a 60 kg person would still have 60 kg of mass but weigh only about 10 kg (one-sixth). Scales actually measure weight (force) but are calibrated to display mass. In space, astronauts are "weightless" but still have mass. For unit conversions, kilograms, grams, pounds, and ounces are all used as mass units in everyday life, though technically the pound-force (lbf) is the force version.',
    },
    {
      question: 'Why do UK scales show stones and pounds for body weight?',
      answer: 'The stone (14 lb) is a traditional British unit that persists in the UK and Ireland for body weight. It likely originated from the practice of using actual stones of a standard weight for trade (e.g., a stone of wool = 14 lb). Today, British people typically state their weight in stones and pounds ("11 stone 4"), while the rest of the world uses kilograms. The stone was officially abolished for trade in the UK in 1985 but continues in popular use for personal weight. Hospitals and doctors in the UK use kilograms for medical records.',
    },
    {
      question: 'How are precious metals weighed differently?',
      answer: 'Precious metals (gold, silver, platinum) use the troy ounce (31.1034768 g) rather than the standard avoirdupois ounce (28.3495 g). The troy ounce is about 9.7% heavier. The system traces back to Troyes, France, a medieval trading hub. Precious metals are also measured in troy pounds (12 troy ounces = 373.24 g), which is lighter than the avoirdupois pound (16 oz = 453.59 g). Gold purity is measured in karats (24K = pure gold), and gold bar weights are often stated in grams or kilograms. When buying or selling precious metals, always confirm whether prices are per troy ounce or avoirdupois ounce.',
    },
    {
      question: 'How do I quickly estimate kilograms to pounds?',
      answer: 'Quick mental approximation: double the kg and add 10%. For 70 kg: 70 × 2 = 140, plus 14 = 154 lb (exact: 154.32 lb). For 100 kg: 100 × 2 = 200, plus 20 = 220 lb (exact: 220.46 lb). For pounds to kg: halve the lb and subtract 10%. For 200 lb: 200 ÷ 2 = 100, minus 10 = 90 kg (exact: 90.72 kg). These approximations are within 1–2% and perfect for fitness, travel, and everyday use.',
    },
  ],
  citations: [
    { source: 'NIST - SI Mass', url: 'https://www.nist.gov/pml/owm/si-units-mass' },
    { source: 'NIST - Redefining the Kilogram', url: 'https://www.nist.gov/si-redefinition/kilogram' },
  ],
};

const converterConfig = createConverter({ units: UNITS, defaultFrom: 'kg', defaultTo: 'lb', educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Weight Conversion' });
  },
};
export default configWithPanel;
