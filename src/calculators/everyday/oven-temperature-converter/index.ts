import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import OvenTempPanel from './OvenTempPanel';
import { closestGasMark, cToF, fToC, gasMarkToTemps, MAX_GAS_MARK, MIN_GAS_MARK } from '../../../utils/ovenTemp';

function formatGasMark(gasMark: number): string {
  if (gasMark === 0.25) return 'Gas Mark 1/4';
  if (gasMark === 0.5) return 'Gas Mark 1/2';
  return `Gas Mark ${Math.round(gasMark)}`;
}

function parseGasMarkInput(value: string): number | null {
  const trimmed = value.trim();
  const frac = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (frac) {
    const num = Number(frac[1]) / Number(frac[2]);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
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
    let gasMarkText: string;
    let gasNote: string;
    let description: string;
    let formulaStep: string;

    if (fromUnit === '°F' || fromUnit === '°C') {
      const n = Number(temperature);
      if (!Number.isFinite(n)) return [];
      if (fromUnit === '°F') {
        fahrenheit = n;
        celsius = fToC(n);
        formulaStep = `(${Math.round(n)}°F − 32) × 5/9 = ${Math.round(celsius)}°C`;
      } else {
        celsius = n;
        fahrenheit = cToF(n);
        formulaStep = `${Math.round(n)}°C × 9/5 + 32 = ${Math.round(fahrenheit)}°F`;
      }
      const closest = closestGasMark(celsius);
      if (closest) {
        gasMarkText = formatGasMark(closest.mark);
        description = closest.description;
        const exact = Math.round(celsius) === closest.celsius || Math.round(fahrenheit) === closest.fahrenheit;
        gasNote = exact ? 'Exact table match.' : `Nearest gas mark (the table lists ${closest.celsius}°C / ${closest.fahrenheit}°F for it).`;
      } else {
        gasMarkText = 'Outside the gas mark range';
        description = celsius < 100 ? 'Below the gas mark scale (under about 100°C)' : 'Above the gas mark scale (over about 270°C)';
        gasNote = 'Gas marks run from 1/4 (110°C) to 10 (260°C).';
      }
    } else if (fromUnit === 'Gas Mark') {
      const parsedGasMark = parseGasMarkInput(temperature);
      if (parsedGasMark === null) return [];
      const temps = gasMarkToTemps(parsedGasMark);
      if (!temps) {
        return [
          {
            id: 'gasMarkRange',
            label: 'Gas Mark',
            value: '—',
            color: 'negative',
            warning: `Gas marks run from ${MIN_GAS_MARK} (1/4) to ${MAX_GAS_MARK}; ${temperature} is outside the scale.`,
          },
        ];
      }
      fahrenheit = temps.fahrenheit;
      celsius = temps.celsius;
      description = temps.description;
      gasMarkText = formatGasMark(parsedGasMark);
      gasNote = temps.exact ? 'Exact table value.' : 'Interpolated between the two neighbouring gas marks.';
      formulaStep = `${gasMarkText} = ${Math.round(fahrenheit)}°F / ${Math.round(celsius)}°C`;
    } else {
      return [];
    }

    return [
      { id: 'fahrenheit', label: 'Fahrenheit', value: `${Math.round(fahrenheit)}°F`, highlight: true, color: 'positive' },
      { id: 'celsius', label: 'Celsius', value: `${Math.round(celsius)}°C`, highlight: true, color: 'positive' },
      { id: 'gasMark', label: 'Gas Mark', value: gasMarkText, highlight: true, interpretation: gasNote },
      { id: 'cookingDescription', label: 'Description', value: description },
      { id: 'formulaStep', label: 'Formula', value: formulaStep },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OvenTempPanel, { values, results });
  },
  educational: {
    formula: '°C = (°F − 32) × 5/9  |  °F = °C × 9/5 + 32',
    formulaDescription:
      'Oven temperatures are measured differently across the world. The United States uses Fahrenheit (°F), most other countries use Celsius (°C), and the United Kingdom additionally uses Gas Mark numbers for gas ovens. Converting between Fahrenheit and Celsius uses the formulas shown above. Gas Marks are a scale originally designed for gas ovens in the UK; the usual kitchen table lists 1/4 (110°C) to 10 (260°C), with rounded Celsius values (for example Gas Mark 4 = 350°F = 180°C, although 350°F is exactly 176.7°C).',
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
      'Oven temperature conversions are essential when following recipes from different countries. The Fahrenheit scale, developed by Daniel Gabriel Fahrenheit in 1724, sets the freezing point of water at 32°F and boiling at 212°F. The Celsius scale, also called centigrade, sets freezing at 0°C and boiling at 100°C — a more intuitive decimal system adopted by most of the world. The Gas Mark scale originated in the UK as a numbering system for gas oven regulators, with Gas Mark 1 at 275°F (140°C) and each subsequent mark adding roughly 25°F (about 14°C). Modern electric ovens in the UK still display Gas Marks alongside Celsius because many traditional British recipes reference them by number. Understanding these conversions prevents baking disasters: a cake recipe calling for Gas Mark 4 (350°F / 180°C) baked at Gas Mark 6 (400°F / 200°C) would likely burn on the outside while remaining raw inside. The Fahrenheit–Celsius conversion formula is linear, but Gas Mark conversions rely on a lookup table because the gas mark scale is discrete. This calculator handles all three conversions instantly, so you can confidently cook any recipe regardless of the temperature units used.',
    faqs: [
      {
        question: 'Why does the US use Fahrenheit while most countries use Celsius?',
        answer:
          'The US continues to use Fahrenheit largely due to historical precedent and the cost of conversion. Fahrenheit was the standard when the US was established, and while most countries adopted the metric system (including Celsius) in the 19th and 20th centuries, the US never mandated the switch for everyday use. Fahrenheit also offers a finer scale (180 degrees between freezing and boiling vs. 100 degrees for Celsius), which some cooks prefer for precision.',
      },
      {
        question: 'Why do UK recipes use Gas Marks?',
        answer:
          'Gas Marks date from the 1920s-30s, when gas cookers got regulator-style thermostats marked with numbers instead of temperatures. Gas Mark 1 corresponds to 275°F (140°C), and each subsequent number adds roughly 25°F (about 14°C). Although modern ovens are much more accurate, the convention persists in British cookbooks and recipes, much like Fahrenheit persists in American cooking.',
      },
      {
        question: 'How do I convert oven temperatures when a recipe only provides one unit?',
        answer:
          'Use this converter: simply enter the temperature you have, select its unit, and the converter will show the equivalent in all three scales — Fahrenheit, Celsius, and Gas Mark. For baking, temperature accuracy matters: a difference of 25°F (about 14°C) can significantly affect the texture and browning of baked goods. Always preheat your oven fully before baking.',
      },
      {
        question: 'Do I need to adjust oven temperature at high altitudes?',
        answer:
          'Yes, at high altitudes (above 3,000 feet / 900 meters), the lower air pressure causes foods to cook differently. For baking, a general rule is to increase the oven temperature by 15–25°F (8–14°C) to help set baked goods before they over-expand. However, the exact adjustment depends on the recipe and altitude. Use this converter to express the adjusted temperature in whatever scale your oven uses. The 15-25°F figure is a common baking guideline, not a fixed rule.',
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
      svg: '<svg viewBox="0 0 320 310" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="320" height="310" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Oven Temperature Equivalence</text><line x1="15" y1="26" x2="305" y2="26" stroke="var(--svg-e2e8f0)" stroke-width="1"/><rect x="25" y="34" width="60" height="16" rx="3" fill="var(--svg-dbeafe)"/><text x="55" y="45" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1d4ed8)" font-weight="700" text-anchor="middle">F</text><rect x="130" y="34" width="60" height="16" rx="3" fill="var(--svg-fef3c7)"/><text x="160" y="45" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-b45309)" font-weight="700" text-anchor="middle">C</text><rect x="235" y="34" width="60" height="16" rx="3" fill="var(--svg-fce7f3)"/><text x="265" y="45" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-9d174d)" font-weight="700" text-anchor="middle">Gas Mark</text><line x1="15" y1="55" x2="305" y2="55" stroke="var(--svg-e2e8f0)" stroke-width="1"/><!-- Row data: hottest (top) to coolest (bottom) --><rect x="15" y="57" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="69" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">500</text><text x="160" y="69" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">260</text><text x="265" y="69" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">10</text><rect x="15" y="75" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="87" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">475</text><text x="160" y="87" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">240</text><text x="265" y="87" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">9</text><rect x="15" y="93" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">450</text><text x="160" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">230</text><text x="265" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">8</text><rect x="15" y="111" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="123" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">425</text><text x="160" y="123" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">220</text><text x="265" y="123" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">7</text><rect x="15" y="129" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="141" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">400</text><text x="160" y="141" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">200</text><text x="265" y="141" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">6</text><rect x="15" y="147" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="159" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">375</text><text x="160" y="159" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">190</text><text x="265" y="159" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">5</text><rect x="15" y="165" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="177" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">350</text><text x="160" y="177" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">180</text><text x="265" y="177" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">4</text><rect x="15" y="183" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="195" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">325</text><text x="160" y="195" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">170</text><text x="265" y="195" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">3</text><rect x="15" y="201" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="213" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">300</text><text x="160" y="213" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">150</text><text x="265" y="213" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">2</text><rect x="15" y="219" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="231" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">275</text><text x="160" y="231" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">140</text><text x="265" y="231" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">1</text><rect x="15" y="237" width="290" height="18" fill="var(--svg-ffffff)"/><text x="55" y="249" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">250</text><text x="160" y="249" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">120</text><text x="260" y="249" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="end">1/2</text><rect x="15" y="255" width="290" height="18" fill="var(--svg-f1f5f9)"/><text x="55" y="267" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">225</text><text x="160" y="267" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">110</text><text x="260" y="267" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)" text-anchor="end">1/4</text><line x1="15" y1="277" x2="305" y2="277" stroke="var(--svg-e2e8f0)" stroke-width="1"/><!-- Note at the bottom --><text x="160" y="290" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Temperature in F, C, and Gas Mark</text><text x="160" y="302" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Hottest (top) to coolest (bottom)</text></svg>',
      alt: 'Reference table showing equivalent oven temperatures across Fahrenheit, Celsius, and Gas Mark scales from coolest (225 F, 110 C, Gas Mark 1/4) to hottest (500 F, 260 C, Gas Mark 10)',
      caption:
        'Oven temperature equivalence across Fahrenheit, Celsius, and Gas Mark scales, from Very Slow (225 F / 110 C / Gas Mark 1/4) to Extremely Hot (500 F / 260 C / Gas Mark 10).',
    },
  },
};

export default ovenTempConverterConfig;
