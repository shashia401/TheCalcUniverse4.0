import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import OvenTempPanel from './OvenTempPanel';

interface GasMarkEntry {
  gasMark: number;
  fahrenheit: number;
  celsius: number;
  description: string;
}

// Celsius values are the independently standardized UK Gas Mark figures
// (e.g. Gas Mark 4 = 180°C/350°F is the standard reference point), not a
// direct °F→°C conversion of the Fahrenheit column — those are two
// separately rounded conventions and previously disagreed with the
// industrial/oven-temperature-converter calculator's table for the same
// gas marks.
const gasMarkTable: GasMarkEntry[] = [
  { gasMark: 0.25, fahrenheit: 225, celsius: 110, description: 'Very Slow / Cool' },
  { gasMark: 0.5, fahrenheit: 250, celsius: 130, description: 'Very Slow / Cool' },
  { gasMark: 1, fahrenheit: 275, celsius: 140, description: 'Slow / Cool' },
  { gasMark: 2, fahrenheit: 300, celsius: 150, description: 'Slow' },
  { gasMark: 3, fahrenheit: 325, celsius: 165, description: 'Moderately Slow / Warm' },
  { gasMark: 4, fahrenheit: 350, celsius: 180, description: 'Moderate / Medium' },
  { gasMark: 5, fahrenheit: 375, celsius: 190, description: 'Moderate / Moderately Hot' },
  { gasMark: 6, fahrenheit: 400, celsius: 200, description: 'Moderately Hot' },
  { gasMark: 7, fahrenheit: 425, celsius: 220, description: 'Hot' },
  { gasMark: 8, fahrenheit: 450, celsius: 230, description: 'Hot / Very Hot' },
  { gasMark: 9, fahrenheit: 475, celsius: 245, description: 'Very Hot' },
  { gasMark: 10, fahrenheit: 500, celsius: 260, description: 'Extremely Hot' },
];

function formatGasMark(gasMark: number): string {
  if (gasMark === 0.25) return 'Gas Mark 1/4';
  if (gasMark === 0.5) return 'Gas Mark 1/2';
  return `Gas Mark ${Math.round(gasMark)}`;
}

function findClosestGasMark(celsius: number): GasMarkEntry {
  let closest = gasMarkTable[0];
  let minDiff = Math.abs(celsius - gasMarkTable[0].celsius);

  for (const entry of gasMarkTable) {
    const diff = Math.abs(celsius - entry.celsius);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  return closest;
}

function interpolateGasMark(gasMark: number): { fahrenheit: number; celsius: number; description: string } {
  const sorted = [...gasMarkTable].sort((a, b) => a.gasMark - b.gasMark);

  const exact = sorted.find((e) => e.gasMark === gasMark);
  if (exact) {
    return { fahrenheit: exact.fahrenheit, celsius: exact.celsius, description: exact.description };
  }

  if (gasMark <= sorted[0].gasMark) {
    return {
      fahrenheit: sorted[0].fahrenheit,
      celsius: sorted[0].celsius,
      description: sorted[0].description,
    };
  }

  if (gasMark >= sorted[sorted.length - 1].gasMark) {
    return {
      fahrenheit: sorted[sorted.length - 1].fahrenheit,
      celsius: sorted[sorted.length - 1].celsius,
      description: sorted[sorted.length - 1].description,
    };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i];
    const upper = sorted[i + 1];
    if (gasMark > lower.gasMark && gasMark < upper.gasMark) {
      const t = (gasMark - lower.gasMark) / (upper.gasMark - lower.gasMark);
      const fahrenheit = lower.fahrenheit + t * (upper.fahrenheit - lower.fahrenheit);
      const celsius = lower.celsius + t * (upper.celsius - lower.celsius);
      return {
        fahrenheit: Math.round(fahrenheit),
        celsius: Math.round(celsius),
        description: lower.description,
      };
    }
  }

  return {
    fahrenheit: sorted[sorted.length - 1].fahrenheit,
    celsius: sorted[sorted.length - 1].celsius,
    description: sorted[sorted.length - 1].description,
  };
}

function parseGasMarkInput(value: string): number | null {
  const trimmed = value.trim();

  const fractionMatch = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0 && num / den > 0) return num / den;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num)) return null;
  if (num <= 0) return null;

  return num;
}

const ovenTempConverterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'temperature',
      label: 'Temperature',
      type: 'text',
      placeholder: 'e.g., 350',
      required: true,
      helpText:
        'Enter the temperature value. For Gas Mark input, you can use decimals or fractions such as "1/4" or "1/2".',
    },
    {
      id: 'fromUnit',
      label: 'From Unit',
      type: 'select',
      helpText: 'The temperature scale you are converting from',
      options: [
        { label: '°F (Fahrenheit)', value: '°F' },
        { label: '°C (Celsius)', value: '°C' },
        { label: 'Gas Mark', value: 'Gas Mark' },
      ],
      required: true,
    },
  ],

  calculate: (values): CalculatorResult[] => {
    const temperature = values.temperature?.trim() ?? '';
    const fromUnit = values.fromUnit || '°F';

    if (temperature === '') return [];

    let celsius: number;
    let fahrenheit: number;
    let gasMark: number;
    let description: string;
    let formulaStep: string;

    if (fromUnit === '°F') {
      const f = parseFloat(temperature);
      if (isNaN(f)) return [];

      fahrenheit = f;
      celsius = (f - 32) * (5 / 9);

      const closest = findClosestGasMark(celsius);
      gasMark = closest.gasMark;
      description = closest.description;

      formulaStep = `(${Math.round(f)}°F − 32) × 5/9 = ${Math.round(celsius)}°C`;
    } else if (fromUnit === '°C') {
      const c = parseFloat(temperature);
      if (isNaN(c)) return [];

      celsius = c;
      fahrenheit = c * (9 / 5) + 32;

      const closest = findClosestGasMark(celsius);
      gasMark = closest.gasMark;
      description = closest.description;

      formulaStep = `${Math.round(c)}°C × 9/5 + 32 = ${Math.round(fahrenheit)}°F`;
    } else if (fromUnit === 'Gas Mark') {
      const parsedGasMark = parseGasMarkInput(temperature);
      if (parsedGasMark === null) return [];

      const interpolated = interpolateGasMark(parsedGasMark);
      fahrenheit = interpolated.fahrenheit;
      celsius = interpolated.celsius;
      gasMark = parsedGasMark;
      description = interpolated.description;

      const gmDisplay = formatGasMark(parsedGasMark);
      formulaStep = `${gmDisplay} = ${Math.round(fahrenheit)}°F / ${Math.round(celsius)}°C`;
    } else {
      return [];
    }

    return [
      {
        id: 'fahrenheit',
        label: 'Fahrenheit',
        value: `${Math.round(fahrenheit)}°F`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'celsius',
        label: 'Celsius',
        value: `${Math.round(celsius)}°C`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'gasMark',
        label: 'Gas Mark',
        value: formatGasMark(gasMark),
        highlight: true,
      },
      {
        id: 'cookingDescription',
        label: 'Description',
        value: description,
      },
      {
        id: 'formulaStep',
        label: 'Formula',
        value: formulaStep,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OvenTempPanel, { values, results });
  },
  educational: {
    formula: '°C = (°F − 32) × 5/9  |  °F = °C × 9/5 + 32',
    formulaDescription:
      'Oven temperatures are measured differently across the world. The United States uses Fahrenheit (°F), most other countries use Celsius (°C), and the United Kingdom additionally uses Gas Mark numbers for gas ovens. Converting between Fahrenheit and Celsius uses the formulas shown above. Gas Marks are a discrete scale originally designed for gas ovens in the UK, where each whole number corresponds to a specific temperature range.',
    variables: [
      {
        symbol: '°F',
        name: 'Fahrenheit',
        description:
          'The temperature in degrees Fahrenheit, used primarily in the United States for oven temperature settings.',
      },
      {
        symbol: '°C',
        name: 'Celsius',
        description:
          'The temperature in degrees Celsius, the standard temperature scale used in most countries worldwide for cooking and baking.',
      },
      {
        symbol: 'Gas Mark',
        name: 'Gas Mark Number',
        description:
          'A discrete temperature scale used on gas ovens in the United Kingdom and some Commonwealth countries. Each integer corresponds to a specific temperature range.',
      },
    ],
    commonUses: [
      'Converting oven temperatures when following a recipe written in a different scale (Fahrenheit, Celsius, or Gas Mark)',
      'Looking up the Gas Mark equivalent for a specific Fahrenheit or Celsius temperature used in a UK or Commonwealth recipe',
      'Adjusting oven temperature for high-altitude baking by converting the recommended adjustment to your oven\'s scale',
      'Understanding the cooking description (e.g., "Moderate / Medium") associated with different temperature ranges',
    ],
    howToUse: [
      'Enter the temperature value you want to convert.',
      'Select the unit of the input temperature: °F (Fahrenheit), °C (Celsius), or Gas Mark.',
      'For Gas Mark input, you can enter whole numbers (1–10) or fraction values like "1/4" and "1/2".',
      'View the converted temperatures in all three scales, plus a cooking description and the formula used.',
    ],
    explanation:
      'Oven temperature conversions are essential when following recipes from different countries. The Fahrenheit scale, developed by Daniel Gabriel Fahrenheit in 1724, sets the freezing point of water at 32°F and boiling at 212°F. The Celsius scale, also called centigrade, sets freezing at 0°C and boiling at 100°C — a more intuitive decimal system adopted by most of the world. The Gas Mark scale originated in the UK as a numbering system for gas oven regulators, with Gas Mark 1 starting at 275°F (140°C) and each subsequent mark increasing by approximately 25°F (14°C). Modern electric ovens in the UK still display Gas Marks alongside Celsius because many traditional British recipes reference them by number. Understanding these conversions prevents baking disasters: a cake recipe calling for Gas Mark 4 (350°F / 177°C) baked at Gas Mark 6 (400°F / 204°C) would likely burn on the outside while remaining raw inside. The Fahrenheit–Celsius conversion formula is linear, but Gas Mark conversions rely on a lookup table because the gas mark scale is discrete. This calculator handles all three conversions instantly, so you can confidently cook any recipe regardless of the temperature units used.',
    faqs: [
      {
        question: 'Why does the US use Fahrenheit while most countries use Celsius?',
        answer:
          'The US continues to use Fahrenheit largely due to historical precedent and the cost of conversion. Fahrenheit was the standard when the US was established, and while most countries adopted the metric system (including Celsius) in the 19th and 20th centuries, the US never mandated the switch for everyday use. Fahrenheit also offers a finer scale (180 degrees between freezing and boiling vs. 100 degrees for Celsius), which some cooks prefer for precision.',
      },
      {
        question: 'Why do UK recipes use Gas Marks?',
        answer:
          'Gas Marks originated in the 1930s when gas ovens became common in UK households. Gas oven thermostats were not precise enough for exact Fahrenheit or Celsius settings, so manufacturers devised a numbered scale. Gas Mark 1 was set at 275°F (140°C), and each subsequent number increases the temperature by roughly 25°F (14°C). Although modern ovens are much more accurate, the convention persists in British cookbooks and recipes, much like Fahrenheit persists in American cooking.',
      },
      {
        question: 'How do I convert oven temperatures when a recipe only provides one unit?',
        answer:
          'Use this converter: simply enter the temperature you have, select its unit, and the converter will show the equivalent in all three scales — Fahrenheit, Celsius, and Gas Mark. For baking, temperature accuracy matters: a difference of 25°F (about 14°C) can significantly affect the texture and browning of baked goods. Always preheat your oven fully before baking.',
      },
      {
        question: 'Do I need to adjust oven temperature at high altitudes?',
        answer:
          'Yes, at high altitudes (above 3,000 feet / 900 meters), the lower air pressure causes foods to cook differently. For baking, a general rule is to increase the oven temperature by 15–25°F (8–14°C) to help set baked goods before they over-expand. However, the exact adjustment depends on the recipe and altitude. Use this converter to calculate the adjusted temperature in whatever scale your oven uses.',
      },
    ],
    citations: [
      {
        source: 'NIST — SI Units of Temperature',
        url: 'https://www.nist.gov/pml/owm/si-units-temperature',
      },
      {
        source: 'BBC Food — Oven Temperature Conversions',
        url: 'https://www.bbc.co.uk/food/articles/oven_temperatures',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 310" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="320" height="310" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Oven Temperature Equivalence</text><line x1="15" y1="26" x2="305" y2="26" stroke="var(--svg-e2e8f0)" stroke-width="1"/><rect x="25" y="34" width="60" height="16" rx="3" fill="var(--svg-dbeafe)"/><text x="55" y="45" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1d4ed8)" font-weight="700" text-anchor="middle">F</text><rect x="130" y="34" width="60" height="16" rx="3" fill="var(--svg-fef3c7)"/><text x="160" y="45" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-b45309)" font-weight="700" text-anchor="middle">C</text><rect x="235" y="34" width="60" height="16" rx="3" fill="var(--svg-fce7f3)"/><text x="265" y="45" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-9d174d)" font-weight="700" text-anchor="middle">Gas Mark</text><line x1="15" y1="55" x2="305" y2="55" stroke="var(--svg-e2e8f0)" stroke-width="1"/><!-- Row data: hottest (top) to coolest (bottom) --><rect x="15" y="57" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="69" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">500</text><text x="160" y="69" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">260</text><text x="265" y="69" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">10</text><rect x="15" y="75" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="87" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">475</text><text x="160" y="87" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">246</text><text x="265" y="87" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">9</text><rect x="15" y="93" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">450</text><text x="160" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">232</text><text x="265" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">8</text><rect x="15" y="111" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="123" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">425</text><text x="160" y="123" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">218</text><text x="265" y="123" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">7</text><rect x="15" y="129" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="141" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">400</text><text x="160" y="141" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">204</text><text x="265" y="141" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">6</text><rect x="15" y="147" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="159" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">375</text><text x="160" y="159" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">191</text><text x="265" y="159" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">5</text><rect x="15" y="165" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="177" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">350</text><text x="160" y="177" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">177</text><text x="265" y="177" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">4</text><rect x="15" y="183" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="195" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">325</text><text x="160" y="195" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">163</text><text x="265" y="195" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">3</text><rect x="15" y="201" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="213" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">300</text><text x="160" y="213" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">149</text><text x="265" y="213" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">2</text><rect x="15" y="219" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="231" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">275</text><text x="160" y="231" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">135</text><text x="265" y="231" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">1</text><rect x="15" y="237" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="249" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">250</text><text x="160" y="249" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">121</text><text x="260" y="249" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="end">1/2</text><rect x="15" y="255" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="267" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">225</text><text x="160" y="267" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">107</text><text x="260" y="267" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="end">1/4</text><line x1="15" y1="277" x2="305" y2="277" stroke="var(--svg-e2e8f0)" stroke-width="1"/><!-- Note at the bottom --><text x="160" y="290" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Temperature in F, C, and Gas Mark</text><text x="160" y="302" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Hottest (top) to coolest (bottom)</text></svg>',
      alt: 'Reference table showing equivalent oven temperatures across Fahrenheit, Celsius, and Gas Mark scales from coolest (225 F, 107 C, Gas Mark 1/4) to hottest (500 F, 260 C, Gas Mark 10)',
      caption:
        'Oven temperature equivalence across Fahrenheit, Celsius, and Gas Mark scales, from Very Slow (225 F / 107 C / Gas Mark 1/4) to Extremely Hot (500 F / 260 C / Gas Mark 10).',
    },
  },
};

export default ovenTempConverterConfig;
