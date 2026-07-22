import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ConversionPanel from './ConversionPanel';

// ─── Category definitions ────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Weight & Mass', value: 'weight' },
  { label: 'Length & Distance', value: 'length' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Volume', value: 'volume' },
  { label: 'Data Storage', value: 'data' },
  { label: 'Speed', value: 'speed' },
  { label: 'Area', value: 'area' },
  { label: 'Currency (USD base)', value: 'currency' },
];

// ─── All units in one flat list ──────────────────────────────────────────────

const ALL_UNITS = [
  // Weight
  { label: 'Milligram (weight)', value: 'milligram' },
  { label: 'Gram (weight)', value: 'gram' },
  { label: 'Kilogram (weight)', value: 'kilogram' },
  { label: 'Ounce (weight)', value: 'ounce' },
  { label: 'Pound (weight)', value: 'pound' },
  { label: 'Ton (weight)', value: 'ton' },
  { label: 'Metric Ton (weight)', value: 'metric-ton' },
  // Length
  { label: 'Millimeter (length)', value: 'millimeter' },
  { label: 'Centimeter (length)', value: 'centimeter' },
  { label: 'Meter (length)', value: 'meter' },
  { label: 'Kilometer (length)', value: 'kilometer' },
  { label: 'Inch (length)', value: 'inch' },
  { label: 'Foot (length)', value: 'foot' },
  { label: 'Yard (length)', value: 'yard' },
  { label: 'Mile (length)', value: 'mile' },
  // Temperature
  { label: 'Celsius (temperature)', value: 'celsius' },
  { label: 'Fahrenheit (temperature)', value: 'fahrenheit' },
  { label: 'Kelvin (temperature)', value: 'kelvin' },
  // Volume
  { label: 'Milliliter (volume)', value: 'milliliter' },
  { label: 'Liter (volume)', value: 'liter' },
  { label: 'Gallon (US) (volume)', value: 'gallon-us' },
  { label: 'Quart (volume)', value: 'quart' },
  { label: 'Pint (volume)', value: 'pint' },
  { label: 'Cup (volume)', value: 'cup' },
  { label: 'Fluid Ounce (volume)', value: 'fluid-ounce' },
  { label: 'Tablespoon (volume)', value: 'tablespoon' },
  { label: 'Teaspoon (volume)', value: 'teaspoon' },
  { label: 'Cubic Meter (volume)', value: 'cubic-meter' },
  { label: 'Cubic Foot (volume)', value: 'cubic-foot' },
  // Data
  { label: 'Bit (data)', value: 'bit' },
  { label: 'Byte (data)', value: 'byte' },
  { label: 'Kilobyte (data)', value: 'kilobyte' },
  { label: 'Megabyte (data)', value: 'megabyte' },
  { label: 'Gigabyte (data)', value: 'gigabyte' },
  { label: 'Terabyte (data)', value: 'terabyte' },
  { label: 'Petabyte (data)', value: 'petabyte' },
  // Speed
  { label: 'Meter/second (speed)', value: 'mps' },
  { label: 'Km/hour (speed)', value: 'kmph' },
  { label: 'Miles/hour (speed)', value: 'mph' },
  { label: 'Knot (speed)', value: 'knot' },
  { label: 'Foot/second (speed)', value: 'fps' },
  // Area
  { label: 'Sq Millimeter (area)', value: 'sq-mm' },
  { label: 'Sq Centimeter (area)', value: 'sq-cm' },
  { label: 'Sq Meter (area)', value: 'sq-m' },
  { label: 'Sq Kilometer (area)', value: 'sq-km' },
  { label: 'Sq Inch (area)', value: 'sq-in' },
  { label: 'Sq Foot (area)', value: 'sq-ft' },
  { label: 'Sq Yard (area)', value: 'sq-yd' },
  { label: 'Acre (area)', value: 'acre' },
  { label: 'Hectare (area)', value: 'hectare' },
  // Currency
  { label: 'USD (currency)', value: 'usd' },
  { label: 'EUR (currency)', value: 'eur' },
  { label: 'GBP (currency)', value: 'gbp' },
  { label: 'JPY (currency)', value: 'jpy' },
  { label: 'CNY (currency)', value: 'cny' },
  { label: 'INR (currency)', value: 'inr' },
  { label: 'CAD (currency)', value: 'cad' },
  { label: 'AUD (currency)', value: 'aud' },
  { label: 'BRL (currency)', value: 'brl' },
];

// ─── Conversion factor maps (per category, base unit has factor = 1) ─────────

type FactorMap = Record<string, number>;

const FACTORS: Record<string, FactorMap> = {
  weight: {
    milligram: 0.001,
    gram: 1,
    kilogram: 1000,
    ounce: 28.3495,
    pound: 453.592,
    ton: 907185,
    'metric-ton': 1000000,
  },
  length: {
    millimeter: 0.001,
    centimeter: 0.01,
    meter: 1,
    kilometer: 1000,
    inch: 0.0254,
    foot: 0.3048,
    yard: 0.9144,
    mile: 1609.34,
  },
  volume: {
    milliliter: 0.001,
    liter: 1,
    'gallon-us': 3.78541,
    quart: 0.946353,
    pint: 0.473176,
    cup: 0.236588,
    'fluid-ounce': 0.0295735,
    tablespoon: 0.0147868,
    teaspoon: 0.00492892,
    'cubic-meter': 1000,
    'cubic-foot': 28.3168,
  },
  data: {
    bit: 0.125,
    byte: 1,
    kilobyte: 1000,
    megabyte: 1e6,
    gigabyte: 1e9,
    terabyte: 1e12,
    petabyte: 1e15,
  },
  speed: {
    mps: 1,
    kmph: 0.277778,
    mph: 0.44704,
    knot: 0.514444,
    fps: 0.3048,
  },
  area: {
    'sq-mm': 1e-6,
    'sq-cm': 0.0001,
    'sq-m': 1,
    'sq-km': 1e6,
    'sq-in': 0.00064516,
    'sq-ft': 0.092903,
    'sq-yd': 0.836127,
    acre: 4046.86,
    hectare: 10000,
  },
  currency: {
    usd: 1,
    eur: 1.08,
    gbp: 1.27,
    jpy: 0.0067,
    cny: 0.14,
    inr: 0.012,
    cad: 0.73,
    aud: 0.65,
    brl: 0.20,
  },
};

const CONVERSION_CITATIONS: { source: string; url: string }[] = [
  { source: 'NIST - International System of Units (SI)', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
  { source: 'Wikipedia - Conversion of Units', url: 'https://en.wikipedia.org/wiki/Conversion_of_units' },
];

// ─── Labels ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  weight: 'Weight & Mass',
  length: 'Length & Distance',
  temperature: 'Temperature',
  volume: 'Volume',
  data: 'Data Storage',
  speed: 'Speed',
  area: 'Area',
  currency: 'Currency',
};

const UNIT_LABELS: Record<string, string> = {
  // weight
  milligram: 'mg',
  gram: 'g',
  kilogram: 'kg',
  ounce: 'oz',
  pound: 'lb',
  ton: 'tn',
  'metric-ton': 't',
  // length
  millimeter: 'mm',
  centimeter: 'cm',
  meter: 'm',
  kilometer: 'km',
  inch: 'in',
  foot: 'ft',
  yard: 'yd',
  mile: 'mi',
  // temperature
  celsius: '°C',
  fahrenheit: '°F',
  kelvin: 'K',
  // volume
  milliliter: 'mL',
  liter: 'L',
  'gallon-us': 'gal',
  quart: 'qt',
  pint: 'pt',
  cup: 'cup',
  'fluid-ounce': 'fl oz',
  tablespoon: 'tbsp',
  teaspoon: 'tsp',
  'cubic-meter': 'm³',
  'cubic-foot': 'ft³',
  // data
  bit: 'bit',
  byte: 'B',
  kilobyte: 'KB',
  megabyte: 'MB',
  gigabyte: 'GB',
  terabyte: 'TB',
  petabyte: 'PB',
  // speed
  mps: 'm/s',
  kmph: 'km/h',
  mph: 'mph',
  knot: 'kn',
  fps: 'ft/s',
  // area
  'sq-mm': 'mm²',
  'sq-cm': 'cm²',
  'sq-m': 'm²',
  'sq-km': 'km²',
  'sq-in': 'in²',
  'sq-ft': 'ft²',
  'sq-yd': 'yd²',
  acre: 'ac',
  hectare: 'ha',
  // currency
  usd: 'USD',
  eur: 'EUR',
  gbp: 'GBP',
  jpy: 'JPY',
  cny: 'CNY',
  inr: 'INR',
  cad: 'CAD',
  aud: 'AUD',
  brl: 'BRL',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return parseFloat(n.toFixed(6)).toString();
}

// ─── Config ──────────────────────────────────────────────────────────────────

const conversionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: CATEGORIES,
      helpText: 'Select the type of measurement to convert',
    },
    {
      id: 'fromValue',
      label: 'Value',
      type: 'number',
      placeholder: '1',
      defaultValue: '1',
      step: 0.001,
      required: true,
      inputMode: 'decimal',
      helpText: 'The numeric value to convert',
    },
    {
      id: 'fromUnit',
      label: 'From Unit',
      type: 'select',
      required: true,
      options: ALL_UNITS,
      helpText: 'Select the unit you are converting from',
    },
    {
      id: 'toUnit',
      label: 'To Unit',
      type: 'select',
      required: true,
      options: ALL_UNITS,
      helpText: 'Select the unit you are converting to',
    },
  ],
  calculate: (values) => {
    const category = (values.category || '').trim();
    const fromUnit = (values.fromUnit || '').trim();
    const toUnit = (values.toUnit || '').trim();
    const fromValue = parseFloat(values.fromValue);

    if (isNaN(fromValue)) return [];
    if (!category || !fromUnit || !toUnit) return [];

    const categoryLabel = CATEGORY_LABELS[category] || category;
    const fromLabel = UNIT_LABELS[fromUnit] || fromUnit;
    const toLabel = UNIT_LABELS[toUnit] || toUnit;

    // ── Temperature (special formulas) ──
    if (category === 'temperature') {
      const tempUnits = ['celsius', 'fahrenheit', 'kelvin'];
      if (!tempUnits.includes(fromUnit) || !tempUnits.includes(toUnit)) return [];

      // Convert fromUnit → Celsius
      let celsius: number;
      if (fromUnit === 'celsius') celsius = fromValue;
      else if (fromUnit === 'fahrenheit') celsius = (fromValue - 32) * 5 / 9;
      else celsius = fromValue - 273.15;

      // Convert Celsius → toUnit
      let result: number;
      if (toUnit === 'celsius') result = celsius;
      else if (toUnit === 'fahrenheit') result = celsius * 9 / 5 + 32;
      else result = celsius + 273.15;

      const formatted = fmt(result);

      return [
        { id: 'result', label: 'Result', value: `${formatted} ${toLabel}`, highlight: true, color: 'positive' },
        { id: 'formula', label: 'Conversion', value: `${fromValue} ${fromLabel} = ${formatted} ${toLabel}` },
        { id: 'category', label: 'Category', value: categoryLabel },
        { id: 'fromDetail', label: 'From', value: `${fromValue} ${fromLabel}` },
        { id: 'toDetail', label: 'To', value: `${formatted} ${toLabel}` },
      ];
    }

    // ── Standard linear conversion ──
    const categoryFactors = FACTORS[category];
    if (!categoryFactors) return [];

    const fromFactor = categoryFactors[fromUnit];
    const toFactor = categoryFactors[toUnit];

    if (fromFactor === undefined || toFactor === undefined) return [];

    const result = fromValue * fromFactor / toFactor;
    const formatted = fmt(result);

    return [
      { id: 'result', label: 'Result', value: `${formatted} ${toLabel}`, highlight: true, color: 'positive' },
      { id: 'formula', label: 'Conversion', value: `${fromValue} ${fromLabel} = ${formatted} ${toLabel}` },
      { id: 'category', label: 'Category', value: categoryLabel },
      { id: 'fromDetail', label: 'From', value: `${fromValue} ${fromLabel}` },
      { id: 'toDetail', label: 'To', value: `${formatted} ${toLabel}` },
    ];
  },
  extraPanel: (_values, results) => {
    if (!results.length) return null;
    return createElement(ConversionPanel, { values: _values, results });
  },
  educational: {
    formula: 'value_from × (factor_base / factor_to)',
    formulaDescription:
      'Unit conversion is the process of changing a measurement from one unit to another while preserving the underlying quantity. Most conversions use a linear factor relative to a standard base unit per category. For example, all length conversions pass through meters — inches are multiplied by 0.0254 to get meters, and meters are divided by 0.3048 to get feet. Temperature is an exception because its scales have different zero points, so offset formulas (with addition/subtraction as well as multiplication) are required.',
    variables: [
      { symbol: 'F', name: 'Conversion Factor', description: 'The multiplier that relates each unit to the category\'s base unit. For example, in the length category, meters are the base unit, so feet have factor 0.3048. Each unit in every category has a known conversion factor relative to the base, enabling precise conversions between any two units within the same category.' },
      { symbol: '°C, °F, K', name: 'Temperature Scales', description: 'Celsius (water freezes at 0°, boils at 100°), Fahrenheit (freezes at 32°, boils at 212°), and Kelvin (0 K = absolute zero at −273.15°C). Temperature uses offset formulas, not simple factors, because different scales have different zero points in addition to differently sized degree increments.' },
      { symbol: 'Base Unit', name: 'Base Unit per Category', description: 'Each category has a reference base unit — meters for length, grams for mass, liters for volume, etc. All conversions go through the base unit, which serves as the universal reference point for translating between any two units within a category.' },
    ],
    howToUse: [
      'Select a measurement category — weight/mass, length/distance, temperature, volume, area, speed, data storage, or currency from the category dropdown.',
      'Enter the numeric value you want to convert in the "Value" field. The field accepts decimals and defaults to 1 for quick ratio checking.',
      'Choose the current unit ("From") and the desired unit ("To") from the dropdown lists. The full list shows all units across all categories.',
      'The result is displayed instantly, along with the conversion formula, intermediate factors used, and the source and target unit labels.',
      'Temperature conversions use special offset formulas — review the formula shown for Celsius/Fahrenheit/Kelvin to understand the addition/subtraction steps.',
    ],
    explanation:
      'Unit conversion is essential in science, engineering, travel, cooking, and daily life. The concept of standardized measurement systems dates back to ancient civilizations — the Egyptians used the cubit (based on forearm length) around 3000 BCE for pyramid construction, while the Romans developed the mile (mille passus, meaning "a thousand paces") around the 1st century BCE. The metric system was formally adopted in France in 1795 after the French Revolution, designed to be universal and based on natural constants — the meter was originally defined as one ten-millionth of the distance from the equator to the North Pole. The vast majority of conversions use simple multiplication or division by a fixed conversion factor relative to a standard base unit. For example, all length conversions go through meters so that converting inches to feet actually does: inches to meters (multiply by 0.0254) to feet (divide by 0.3048). Temperature is the exception — Celsius, Fahrenheit, and Kelvin use offset formulas that include addition or subtraction terms because their zero points differ (0°C does not equal 0°F). Understanding unit conversion helps avoid costly mistakes; the most famous example is the 1999 Mars Climate Orbiter crash, which was caused by a metric/imperial unit mismatch between two collaborating teams — Lockheed Martin used imperial units while NASA used metric, causing the $327 million spacecraft to burn up in Mars\' atmosphere. This tool covers a wide range of categories including weight, length, temperature, volume, area, speed, data storage, and currency units, making it useful for travel, international business, cooking recipes, scientific work, and engineering projects.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><rect x="15" y="40" width="80" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="6"/><text x="55" y="62" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10" font-weight="bold">Inches</text><text x="55" y="76" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">(value)</text><line x1="95" y1="55" x2="135" y2="55" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="115" y="48" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">&amp;times; 0.0254</text><rect x="135" y="35" width="80" height="60" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="2" rx="6"/><text x="175" y="58" text-anchor="middle" fill="var(--svg-991b1b)" font-size="10" font-weight="bold">Meters</text><text x="175" y="72" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">(base unit)</text><text x="175" y="84" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">(result)</text><line x1="215" y1="55" x2="255" y2="55" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="235" y="48" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">&amp;divide; 0.3048</text><rect x="255" y="40" width="50" height="50" fill="var(--svg-d1fae5)" stroke="var(--svg-059669)" stroke-width="2" rx="6"/><text x="280" y="62" text-anchor="middle" fill="var(--svg-065f46)" font-size="10" font-weight="bold">Feet</text><text x="280" y="76" text-anchor="middle" fill="var(--svg-065f46)" font-size="9">(value)</text><text x="160" y="125" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">All length conversions pass through meters</text><rect x="40" y="140" width="100" height="22" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="1" rx="4"/><text x="90" y="154" text-anchor="middle" fill="var(--svg-991b1b)" font-size="9">Temp: &amp;deg;C &amp;times; 9/5 + 32</text><rect x="180" y="140" width="100" height="22" fill="var(--svg-d1fae5)" stroke="var(--svg-059669)" stroke-width="1" rx="4"/><text x="230" y="154" text-anchor="middle" fill="var(--svg-065f46)" font-size="9">Others: linear factor</text><text x="160" y="185" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="9">value &amp;times; factor_from / factor_to</text></svg>',
      alt: 'Unit conversion flow diagram showing inches converted to meters as base unit, then to feet',
      caption: 'Unit conversions pass through a base unit: inches to meters to feet using conversion factors.',
    },
    commonUses: [
      'Converting cooking measurements between metric and imperial systems for international recipes — teaspoons to milliliters, cups to liters, ounces to grams.',
      'Converting body weight from pounds to kilograms or stones for medical records, fitness tracking, and international health documentation.',
      'Converting distances for travel planning — kilometers to miles for road trips, meters to feet for construction projects, and nautical miles to kilometers for maritime navigation.',
      'Converting temperature between Celsius and Fahrenheit for weather forecasts, cooking instructions, and scientific research across international teams.',
      'Converting storage sizes between bits, bytes, kilobytes, megabytes, gigabytes, and terabytes for IT infrastructure planning and data management.',
    ],
    quickReference: [
      { label: '1 inch', value: '2.54 cm or 0.0254 m' },
      { label: '1 foot', value: '30.48 cm or 0.3048 m' },
      { label: '1 mile', value: '1.60934 km or 1609.34 m' },
      { label: '1 kilogram', value: '2.20462 lb or 1000 g' },
      { label: '1 gallon (US)', value: '3.78541 L or 3785.41 mL' },
      { label: '1 pound', value: '453.592 g or 0.45359237 kg' },
      { label: '°C to °F', value: '°F = °C × 9/5 + 32' },
      { label: '°F to °C', value: '°C = (°F − 32) × 5/9' },
    ],
    workedExamples: [
      {
        scenario: 'Maria, a European baker, is following an American recipe that calls for 3 cups of flour and 2 sticks of butter (each stick is 4 ounces). Her kitchen scale and measuring tools are metric. She needs to convert to milliliters and grams.',
        inputs: { category: 'volume', fromValue: '3', fromUnit: 'cup', toUnit: 'milliliter' },
        result: '709.764 mL',
        insight: '3 cups × 0.236588 L/cup = 0.709764 L = 709.764 mL. For the butter: 8 oz × 28.3495 g/oz = 226.796 g. Maria should measure approximately 710 mL of flour and 227 g of butter. Understanding cup-to-mL conversion is essential for baking precision since flour density means volume measurements can vary — professional bakers prefer weight-based recipes for consistency.',
      },
      {
        scenario: 'James, a logistics manager, is shipping a container from the US to Germany. The cargo weighs 24,500 pounds, but the German port authority requires weight declarations in metric tons. He also needs the total in kilograms for the shipping manifest.',
        inputs: { category: 'weight', fromValue: '24500', fromUnit: 'pound', toUnit: 'metric-ton' },
        result: '11.113004 t',
        insight: '24,500 lb × (453.592 / 1,000,000) = 11.113 metric tons, or 11,113 kg. International shipping requires precise conversions — a mistake here could lead to customs delays, overweight container penalties (typically $500-$2,000 per violation), or even cargo rejection. Most international shipping containers have a maximum gross weight of about 30 metric tons.',
      },
      {
        scenario: 'Priya, an Indian student studying in the United States, checks the weather forecast showing 95°F for the weekend. She is accustomed to Celsius and wants to understand how hot that really is. She converts to Celsius and also checks if the temperature is in the dangerous heat zone.',
        inputs: { category: 'temperature', fromValue: '95', fromUnit: 'fahrenheit', toUnit: 'celsius' },
        result: '35 °C',
        insight: '°C = (95 − 32) × 5/9 = 63 × 5/9 = 35°C. This is a hot day by any standard. Priya should stay hydrated and limit outdoor activity during peak afternoon hours. For reference, the human body begins experiencing heat stress around 35°C (95°F) with high humidity, and the Indian Meteorological Department issues heatwave warnings when temperatures exceed 40°C (104°F) in plains regions.',
      },
    ],
    proTips: [
      'When converting between temperature scales, remember that the offset matters as much as the ratio. A common mistake is to simply multiply by 9/5 without adding 32 when converting Celsius to Fahrenheit — this gives a result that is 32 degrees too low.',
      'For cooking conversions, volume measurements for dry ingredients (like flour) are less reliable than weight because of compaction. A cup of sifted flour weighs about 120 g, while a cup of packed flour can weigh up to 150 g — use weight conversions where possible for baking precision.',
      'When converting currency, remember that exchange rates fluctuate constantly. The rates in this calculator are approximate base rates for quick reference — always check live market rates before making financial decisions involving real money transfers.',
      'Data storage units use two competing systems: decimal (1 KB = 1000 bytes) and binary (1 KiB = 1024 bytes). This calculator uses decimal units (the SI standard used by storage manufacturers). For memory (RAM) calculations, use binary: 1 GiB = 1024 MiB = 1,073,741,824 bytes.',
      'For very large or very small numbers, use scientific notation or the metric prefix system. For example, 0.000001 meters is 1 micrometer (µm), and 1,000,000 grams is 1 metric ton. The calculator handles decimal precision to 6 significant figures for practical accuracy.',
      'When measuring area for real estate, note that an acre is 43,560 square feet — about the size of an American football field without the end zones. A hectare (10,000 m²) is about 2.47 acres and is the standard land measurement unit in most countries outside the US and UK.',
    ],
    limitations: [
      'This calculator provides general-purpose conversions suitable for most everyday, educational, and professional applications.',
      'Currency exchange rates are approximate base rates and do not reflect real-time market fluctuations — for actual financial transactions, always consult live foreign exchange data from your bank or a reputable forex service.',
      'Temperature conversions assume standard atmospheric pressure at sea level; extreme altitudes or pressures may require specialized thermodynamic conversions. Data storage conversions use decimal units (1 KB = 1000 bytes) per the SI standard; for binary memory calculations (where 1 KiB = 1024 bytes), multiply by appropriate powers of 2.',
      'When not to use this calculator: for scientific research requiring uncertainty analysis with error propagation, for legal trade measurements subject to weights and measures regulations, for medical dosing where precision below microgram levels is required, or for aerospace navigation calculations where relativistic effects or precise geodetic references are needed.',
    ],
    faqs: [
      {
        question: 'Why do we need unit conversion?',
        answer: 'Different countries, industries, and scientific disciplines use different measurement systems. The United States primarily uses imperial units (feet, pounds, Fahrenheit), while most of the rest of the world uses the metric system (meters, kilograms, Celsius). Converting accurately between systems is critical for international trade, engineering collaboration, scientific research, aviation, maritime navigation, and everyday travel. Even within the same country, different industries may use different units — for example, car fuel economy is measured in miles per gallon in the US but liters per 100 kilometers in most other countries.',
      },
      {
        question: 'How does the linear conversion factor work?',
        answer: 'Each unit in a category is assigned a conversion factor relative to the category\'s base unit. For length, the base is 1 meter. Since 1 foot = 0.3048 meters, the foot has factor 0.3048. Since 1 kilometer = 1000 meters, kilometer has factor 1000. To convert from unit A to unit B: value × (factor of A / factor of B). For example, converting 5 feet to meters: 5 × (0.3048 / 1) = 1.524 m. Converting 5 feet to inches: 5 × (0.3048 / 0.0254) = 5 × 12 = 60 inches.',
      },
      {
        question: 'Why is temperature conversion different?',
        answer: 'Temperature scales have different zero points, not just differently sized degrees. Zero degrees Celsius is the freezing point of water (32°F), while zero degrees Fahrenheit is significantly colder. The Kelvin scale starts at absolute zero (−273.15°C). Because both the zero point AND the degree size differ, simple multiplication does not work. The conversion formulas account for both the offset difference and the scale ratio: °F = °C × 9/5 + 32, and °C = (°F − 32) × 5/9.',
      },
      {
        question: 'What is the difference between a US ton and a metric ton?',
        answer: 'A US (short) ton equals 2,000 pounds (approximately 907.185 kg), while a metric ton (tonne) equals exactly 1,000 kilograms (approximately 2,204.62 pounds). A UK (long) ton equals 2,240 pounds (approximately 1,016 kg). This calculator clearly distinguishes between "ton" (US short ton) and "metric-ton" to avoid the costly confusion that can occur when these units are mixed up in international trade, shipping, and industrial contexts. Always verify which ton definition your contract or specification uses before performing critical mass calculations.',
      },
      {
        question: 'How do I convert cooking measurements?',
        answer: 'The volume category includes common cooking measurements: teaspoons, tablespoons, cups, fluid ounces, pints, quarts, gallons, milliliters, and liters. For example, 1 cup = 8 fluid ounces = 16 tablespoons = 48 teaspoons ≈ 237 milliliters. You can also convert between metric and US volume units for international recipes. Note that "cups" in different countries may differ slightly — a US cup is 237 mL, a metric cup is 250 mL, and a UK cup is 284 mL. For weight-based cooking conversions, use the weight category to convert between ounces, pounds, grams, and kilograms.',
      },
      {
        question: 'How accurate are the currency conversions in this calculator?',
        answer: 'The currency conversion factors in this calculator are approximate base rates intended for quick reference and estimation purposes only. They do not update in real time and should not be used for actual financial transactions. Foreign exchange rates fluctuate continuously based on global market conditions, central bank policies, and geopolitical events. For actual currency conversion, always check the current mid-market rate from a reliable source such as your bank, XE.com, or OANDA, and account for any transaction fees or spread markups that may apply.',
      },
      {
        question: 'What is the history behind the metric and imperial systems?',
        answer: 'The metric system was developed during the French Revolution (adopted in 1795) as a rational, decimal-based system designed to replace the chaotic patchwork of local measurement standards across France. The meter was originally defined as one ten-millionth of the distance from the North Pole to the equator along the Paris meridian. The imperial system evolved from English customary units dating back to the Magna Carta (1215), with standardized definitions formalized in the British Weights and Measures Act of 1824. Today, only three countries — the United States, Liberia, and Myanmar — have not fully adopted the metric system as their primary system, though all use metric to varying degrees in scientific and international contexts.',
      },
    ],
    citations: [
      { source: 'NIST - International System of Units (SI)', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
      { source: 'Wikipedia - Conversion of Units', url: 'https://en.wikipedia.org/wiki/Conversion_of_units' },
    ],
  },
};

export default conversionConfig;
