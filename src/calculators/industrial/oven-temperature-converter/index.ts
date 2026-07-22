import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import OvenTempPanel from './OvenTempPanel';

const GAS_MARK_TABLE: { mark: string; value: number; celsius: number; fahrenheit: number }[] = [
  { mark: 'Gas Mark ¼', value: 0.25, celsius: 110, fahrenheit: 225 },
  { mark: 'Gas Mark ½', value: 0.5, celsius: 130, fahrenheit: 250 },
  { mark: 'Gas Mark 1', value: 1, celsius: 140, fahrenheit: 275 },
  { mark: 'Gas Mark 2', value: 2, celsius: 150, fahrenheit: 300 },
  { mark: 'Gas Mark 3', value: 3, celsius: 165, fahrenheit: 325 },
  { mark: 'Gas Mark 4', value: 4, celsius: 180, fahrenheit: 350 },
  { mark: 'Gas Mark 5', value: 5, celsius: 190, fahrenheit: 375 },
  { mark: 'Gas Mark 6', value: 6, celsius: 200, fahrenheit: 400 },
  { mark: 'Gas Mark 7', value: 7, celsius: 220, fahrenheit: 425 },
  { mark: 'Gas Mark 8', value: 8, celsius: 230, fahrenheit: 450 },
  { mark: 'Gas Mark 9', value: 9, celsius: 245, fahrenheit: 475 },
  { mark: 'Gas Mark 10', value: 10, celsius: 260, fahrenheit: 500 },
];

const OVEN_TERMS: { label: string; celsiusMin: number; celsiusMax: number; fahrenheitMin: number; fahrenheitMax: number }[] = [
  { label: 'Very slow', celsiusMin: 110, celsiusMax: 130, fahrenheitMin: 225, fahrenheitMax: 250 },
  { label: 'Slow', celsiusMin: 140, celsiusMax: 150, fahrenheitMin: 275, fahrenheitMax: 300 },
  { label: 'Moderate', celsiusMin: 160, celsiusMax: 180, fahrenheitMin: 325, fahrenheitMax: 350 },
  { label: 'Moderately hot', celsiusMin: 190, celsiusMax: 200, fahrenheitMin: 375, fahrenheitMax: 400 },
  { label: 'Hot', celsiusMin: 210, celsiusMax: 230, fahrenheitMin: 425, fahrenheitMax: 450 },
  { label: 'Very hot', celsiusMin: 240, celsiusMax: 260, fahrenheitMin: 475, fahrenheitMax: 500 },
];

function getOvenTerm(celsius: number): string {
  for (const term of OVEN_TERMS) {
    if (celsius >= term.celsiusMin && celsius <= term.celsiusMax) {
      return `${term.label} oven (${term.celsiusMin}°C–${term.celsiusMax}°C / ${term.fahrenheitMin}°F–${term.fahrenheitMax}°F)`;
    }
  }
  if (celsius < 110) return 'Below typical oven temperature range';
  return 'Above typical oven temperature range (very hot)';
}

function celsiusToGasMarkLabel(celsius: number): string {
  // Check exact or nearest match in the table
  if (celsius < 110) return 'N/A';

  // Special fractional marks
  if (celsius >= 105 && celsius <= 115) return 'Gas Mark ¼';
  if (celsius >= 125 && celsius <= 135) return 'Gas Mark ½';

  // Standard gas marks: GM = round((C - 135) / 14 + 1)
  const gm = Math.round((celsius - 135) / 14 + 1);
  if (gm >= 1 && gm <= 10) {
    // Find closest celsius in table for this gm
    const entry = GAS_MARK_TABLE.find(e => e.value === gm);
    if (entry) return entry.mark;
  }
  return 'N/A';
}

function gasMarkValueToCelsius(gasValue: number): number | null {
  const entry = GAS_MARK_TABLE.find(e => e.value === gasValue);
  if (entry) return entry.celsius;

  // Try to find closest if not exact
  if (gasValue >= 0.25 && gasValue <= 10) {
    // Approximate using formula: C = (GM - 1) * 14 + 135
    const approxC = (gasValue - 1) * 14 + 135;
    return Math.round(approxC);
  }
  return null;
}

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'value',
      label: 'Temperature Value',
      type: 'number',
      placeholder: 'Enter temperature...',
      defaultValue: '180',
      required: true,
    },
    {
      id: 'from',
      label: 'From',
      type: 'select',
      defaultValue: 'c',
      options: [
        { label: '°C', value: 'c' },
        { label: '°F', value: 'f' },
        { label: 'Gas Mark', value: 'gas' },
      ],
    },
    {
      id: 'to',
      label: 'To',
      type: 'select',
      defaultValue: 'f',
      options: [
        { label: '°C', value: 'c' },
        { label: '°F', value: 'f' },
        { label: 'Gas Mark', value: 'gas' },
      ],
    },
  ],
  calculate: (values) => {
    const val = parseFloat(values.value);
    const from = values.from || 'c';
    const to = values.to || 'f';

    if (isNaN(val)) return [];

    let celsius: number;
    let fahrenheit: number;
    let gasMarkLabel: string;

    // Convert input to celsius and fahrenheit
    if (from === 'c') {
      celsius = val;
      fahrenheit = celsius * 9 / 5 + 32;
    } else if (from === 'f') {
      fahrenheit = val;
      celsius = (fahrenheit - 32) * 5 / 9;
    } else if (from === 'gas') {
      const c = gasMarkValueToCelsius(val);
      if (c === null) return [];
      celsius = c;
      fahrenheit = celsius * 9 / 5 + 32;
    } else {
      return [];
    }

    // Determine gas mark for display
    gasMarkLabel = celsiusToGasMarkLabel(celsius);

    // Determine oven term
    const description = getOvenTerm(celsius);

    // Build the result label based on target unit
    let resultValue: string;
    if (to === 'c') {
      resultValue = `${val}°${from === 'gas' ? 'Gas Mark' : from.toUpperCase()} = ${celsius.toFixed(1)}°C`;
    } else if (to === 'f') {
      resultValue = `${val}°${from === 'gas' ? 'Gas Mark' : from.toUpperCase()} = ${fahrenheit.toFixed(1)}°F`;
    } else if (to === 'gas') {
      resultValue = `${val}°${from === 'gas' ? 'Gas Mark' : from.toUpperCase()} = ${gasMarkLabel}`;
    } else {
      resultValue = `${celsius.toFixed(1)}°C`;
    }

    return [
      {
        id: 'result',
        label: 'Converted Temperature',
        value: resultValue,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'resultC',
        label: 'Celsius',
        value: `${celsius.toFixed(1)}°C`,
      },
      {
        id: 'resultF',
        label: 'Fahrenheit',
        value: `${fahrenheit.toFixed(1)}°F`,
      },
      {
        id: 'gasMark',
        label: 'Gas Mark',
        value: gasMarkLabel,
      },
      {
        id: 'description',
        label: 'Oven Description',
        value: description,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OvenTempPanel, { values, results });
  },
  educational: {
    formula:
      '°F = °C × 9/5 + 32 | °C = (°F − 32) × 5/9 | Gas Mark = round((°C − 135) / 14 + 1) for °C ≥ 135',
    formulaDescription:
      'Oven temperature conversion involves three distinct scales: Celsius (used in most countries), Fahrenheit (used in the United States), and Gas Mark (a unique UK system that maps oven regulator settings to temperature ranges). Each Gas Mark increment represents approximately 14°C (25°F), with Gas Mark 4 (180°C / 350°F) serving as the standard moderate baking temperature. Fan or convection ovens typically require reducing the temperature by about 20°C (36°F) compared to conventional ovens, because the circulating air transfers heat more efficiently.',
    variables: [
      {
        symbol: '°C',
        name: 'Celsius',
        description:
          'The metric temperature scale, also called centigrade, where water freezes at 0°C and boils at 100°C at sea level. Used for oven temperature settings in most countries worldwide including Europe, Australia, New Zealand, and most of Asia.',
      },
      {
        symbol: '°F',
        name: 'Fahrenheit',
        description:
          'The imperial temperature scale where water freezes at 32°F and boils at 212°F at sea level. Predominantly used for oven temperature settings in the United States and a few Caribbean nations.',
      },
      {
        symbol: 'Gas Mark',
        name: 'Gas Mark',
        description:
          'A temperature scale unique to gas ovens in the United Kingdom and Commonwealth countries. Marks range from ¼ (very cool, 110°C) to 10 (very hot, 260°C), with Gas Mark 4 (180°C / 350°F) representing a standard moderate oven for most baking.',
      },
      {
        symbol: 'Fan Oven',
        name: 'Fan / Convection Oven',
        description:
          'Ovens with a fan that circulates hot air for more even and efficient cooking. Fan oven recipes typically require temperatures about 20°C (36°F) lower than conventional (non-fan) oven recipes to achieve the same results.',
      },
    ],
    howToUse: [
      'Enter the temperature value in the input field. For Gas Mark conversions, enter the Gas Mark number (e.g., 4 for Gas Mark 4, 0.25 for ¼, 0.5 for ½).',
      'Select the unit you are converting from: °C, °F, or Gas Mark.',
      'Select the unit you want to convert to: °C, °F, or Gas Mark.',
      'Read the converted result instantly along with the equivalent temperature in all three scales and a descriptive oven term (e.g., "Moderate oven"). Use this for international recipes that specify unfamiliar temperature scales.',
    ],
    quickReference: [
      { label: 'Gas Mark 4 (Standard)', value: '180°C / 350°F / Moderate' },
      { label: 'Very slow', value: '110–130°C / 225–250°F / ¼–½' },
      { label: 'Hot oven', value: '210–230°C / 425–450°F / Gas Mark 7–8' },
      { label: 'Very hot', value: '240–260°C / 475–500°F / Gas Mark 9–10' },
      { label: 'Fan oven adjustment', value: 'Reduce by 20°C (36°F) from recipe temperature' },
      { label: 'Common baking temp', value: '190°C / 375°F / Gas Mark 5' },
    ],
    commonUses: [
      'Baking international recipes that specify temperatures in unfamiliar units, such as converting a British Gas Mark recipe to Fahrenheit for a US oven',
      'Adjusting conventional oven recipes for fan or convection ovens by reducing the temperature by 20°C (36°F)',
      'Understanding vintage cookbooks that use Gas Mark settings before modern digital temperature controls',
      'Converting oven temperatures for foods like bread, pastries, and roasted meats where precise temperature control is critical for proper texture and doneness',
      'Translating recipe temperatures for kitchen appliances with different display scales, such as using an air fryer or toaster oven that defaults to Celsius',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 560 380" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="280" y="22" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Oven Temperature Scale Comparison</text>' +
        '<text x="280" y="40" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Celsius, Fahrenheit, and Gas Mark with common oven terms</text>' +
        '<rect x="20" y="55" width="520" height="300" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Celsius scale -->' +
        '<text x="45" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-3b82f6)" font-weight="700">°C</text>' +
        '<rect x="35" y="90" width="30" height="4" rx="2" fill="var(--svg-3b82f6)" opacity="0.3"/><rect x="35" y="150" width="30" height="4" rx="2" fill="var(--svg-3b82f6)" opacity="0.3"/>' +
        '<rect x="35" y="210" width="30" height="4" rx="2" fill="var(--svg-3b82f6)" opacity="0.3"/><rect x="35" y="270" width="30" height="4" rx="2" fill="var(--svg-3b82f6)" opacity="0.3"/>' +
        '<rect x="35" y="110" width="30" height="4" rx="2" fill="var(--svg-3b82f6)"/><rect x="35" y="170" width="30" height="4" rx="2" fill="var(--svg-3b82f6)"/>' +
        '<rect x="35" y="230" width="30" height="4" rx="2" fill="var(--svg-3b82f6)"/><rect x="35" y="290" width="30" height="4" rx="2" fill="var(--svg-3b82f6)"/>' +
        '<text x="70" y="93" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">110°</text><text x="70" y="153" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">160°</text>' +
        '<text x="70" y="213" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">200°</text><text x="70" y="273" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">260°</text>' +
        '<!-- Bar for Celsius range -->' +
        '<rect x="80" y="90" width="16" height="200" rx="3" fill="var(--svg-3b82f6)" opacity="0.15"/>' +
        '<!-- Fahrenheit scale -->' +
        '<text x="135" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ef4444)" font-weight="700">°F</text>' +
        '<rect x="125" y="90" width="30" height="4" rx="2" fill="var(--svg-ef4444)" opacity="0.3"/><rect x="125" y="150" width="30" height="4" rx="2" fill="var(--svg-ef4444)" opacity="0.3"/>' +
        '<rect x="125" y="210" width="30" height="4" rx="2" fill="var(--svg-ef4444)" opacity="0.3"/><rect x="125" y="270" width="30" height="4" rx="2" fill="var(--svg-ef4444)" opacity="0.3"/>' +
        '<text x="160" y="93" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">225°</text><text x="160" y="153" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">325°</text>' +
        '<text x="160" y="213" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">400°</text><text x="160" y="273" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">500°</text>' +
        '<!-- Gas Mark scale -->' +
        '<text x="330" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-8b5cf6)" font-weight="700">Gas Mark</text>' +
        '<rect x="280" y="90" width="30" height="4" rx="2" fill="var(--svg-8b5cf6)" opacity="0.3"/><rect x="280" y="150" width="30" height="4" rx="2" fill="var(--svg-8b5cf6)" opacity="0.3"/>' +
        '<rect x="280" y="210" width="30" height="4" rx="2" fill="var(--svg-8b5cf6)" opacity="0.3"/><rect x="280" y="270" width="30" height="4" rx="2" fill="var(--svg-8b5cf6)" opacity="0.3"/>' +
        '<text x="315" y="93" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">¼</text><text x="315" y="153" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">3</text>' +
        '<text x="315" y="213" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">6</text><text x="315" y="273" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-1e293b)">10</text>' +
        '<!-- Oven term bands -->' +
        '<rect x="355" y="90" width="150" height="40" rx="4" fill="var(--svg-dbeafe)" opacity="0.6"/><text x="430" y="113" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="700" text-anchor="middle">Very Slow</text>' +
        '<rect x="355" y="135" width="150" height="30" rx="4" fill="var(--svg-dbeafe)" opacity="0.6"/><text x="430" y="153" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="700" text-anchor="middle">Slow</text>' +
        '<rect x="355" y="170" width="150" height="35" rx="4" fill="var(--svg-dbeafe)"/><text x="430" y="191" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="700" text-anchor="middle">Moderate</text>' +
        '<rect x="355" y="210" width="150" height="30" rx="4" fill="var(--svg-dbeafe)" opacity="0.6"/><text x="430" y="229" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="700" text-anchor="middle">Mod. Hot</text>' +
        '<rect x="355" y="245" width="150" height="30" rx="4" fill="var(--svg-dbeafe)" opacity="0.6"/><text x="430" y="264" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="700" text-anchor="middle">Hot</text>' +
        '<rect x="355" y="280" width="150" height="30" rx="4" fill="var(--svg-dbeafe)" opacity="0.6"/><text x="430" y="299" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-2563eb)" font-weight="700" text-anchor="middle">Very Hot</text>' +
        '<text x="280" y="340" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Fan oven: reduce temperature by ~20°C (36°F). Oven terms are approximate ranges.</text>' +
        '</svg>',
      alt: 'Comparative scale showing Celsius, Fahrenheit, and Gas Mark oven temperatures with oven term bands from Very Slow to Very Hot',
      caption:
        'Oven temperature scales compared side by side with descriptive oven terms. Fan ovens typically require a 20°C reduction.',
    },
    explanation:
      'Oven temperature conversion is an essential skill for any cook or baker working with international recipes. Unlike simple unit conversions, oven temperature scales include the unique Gas Mark system, a method developed for traditional British gas ovens where the thermostat dial was marked with numbers rather than specific temperatures. The Gas Mark system works on an approximately linear scale: Gas Mark 1 corresponds to 140°C (275°F), and each subsequent mark increases by roughly 14°C (25°F) up to Gas Mark 10 at 260°C (500°F). This means Gas Mark 4 (180°C / 350°F) is the standard moderate oven temperature used for most baking. A critical consideration in oven temperature conversion is whether you are using a conventional oven or a fan-assisted (convection) oven. Fan ovens circulate hot air using a built-in fan, which transfers heat more efficiently and evenly throughout the oven cavity. As a result, fan ovens reach the effective cooking temperature more quickly and maintain it more consistently. The general rule is to reduce the temperature by about 20°C (36°F) when converting a conventional oven recipe for use in a fan oven. For example, if a recipe calls for 180°C (350°F) in a conventional oven, set a fan oven to 160°C (320°F). If a recipe specifies fan oven temperature and you are using a conventional oven, increase by the same amount. Beyond the numbers, common oven terms like "moderate" or "hot" provide a rough guide: a moderate oven is 160–180°C (325–350°F), good for cakes and biscuits; a hot oven is 210–230°C (425–450°F), ideal for roasting vegetables and searing meats; and a very hot oven at 240–260°C (475–500°F) is used for pizzas and bread to achieve a crisp crust. Understanding these relationships allows you to confidently adapt any recipe regardless of the temperature scale or oven type specified.',
    faqs: [
      {
        question: 'What is the Gas Mark system and why was it invented?',
        answer:
          'The Gas Mark system originated in the United Kingdom in the early 20th century when gas ovens became common in households. Gas ovens did not have precise temperature controls, so manufacturers assigned numbers (marks) to specific gas regulator settings. The first standardized Gas Mark table was published by the British Standards Institution in the 1930s. Gas Mark 4 (180°C / 350°F) became the default moderate oven setting for most baking. The system persists in UK cookbooks and on many modern British ovens, even though most now also display Celsius. Understanding gas marks is essential for anyone following traditional UK recipes or using vintage cookbooks.',
      },
      {
        question: 'When should I reduce the temperature for a fan oven?',
        answer:
          'You should reduce the temperature for a fan (convection) oven by approximately 20°C (36°F) when following a recipe designed for a conventional (non-fan) oven. This is because the fan circulates hot air, transferring heat to the food more efficiently. The same principle applies to cooking times: fan ovens often cook food 10–25% faster. If a recipe gives a fan oven temperature, use that directly. If only conventional temperatures are given, the conversion rule of thumb is: fan temperature = conventional temperature minus 20°C. For precise results, many modern recipes explicitly state temperatures for both oven types.',
      },
      {
        question: 'Can I use Gas Mark settings on an electric oven?',
        answer:
          'Yes, Gas Mark settings are temperature equivalents, not actual gas settings. Whether your oven is gas, electric, fan, or induction, the Gas Mark corresponds to a specific temperature range. Set your electric oven to the Celsius or Fahrenheit equivalent of the Gas Mark specified in the recipe. For example, if a recipe calls for Gas Mark 5 (190°C / 375°F), simply set your electric oven to 190°C or 375°F. The Gas Mark system describes the cooking temperature, not the fuel type.',
      },
      {
        question: 'What is the difference between °C and °F for baking accuracy?',
        answer:
          'The precision difference between Celsius and Fahrenheit for baking is subtle but real. Fahrenheit has 180 degrees between freezing and boiling, while Celsius has 100 degrees, making Fahrenheit a finer-grained scale. In practice, most ovens maintain temperature within ±10°C (±20°F) of the set point anyway, so the theoretical precision difference rarely matters. More important is knowing your individual oven\'s hot spots and calibration. An oven thermometer is recommended for any serious baking, regardless of the scale used.',
      },
      {
        question: 'What happens if I bake at the wrong temperature?',
        answer:
          'Baking at the wrong temperature can significantly affect results. Too low a temperature can cause cakes to sink in the middle, cookies to spread too much, bread to have a dense crumb, and pastries to be soggy rather than flaky. Too high a temperature can cause burning on the outside while the inside remains undercooked, cakes to dome excessively or crack, and cookies to brown too quickly without spreading properly. Most baked goods are particularly sensitive to temperature, which is why accurate conversion between oven scales matters especially for baking.',
      },
    ],
    citations: [
      {
        source: 'BBC Good Food - Oven Temperature Conversions',
        url: 'https://www.bbcgoodfood.com/howto/guide/oven-temperature-conversions',
      },
      {
        source: 'Wikipedia - Gas Mark',
        url: 'https://en.wikipedia.org/wiki/Gas_Mark',
      },
    ],
  },
};

export default config;
