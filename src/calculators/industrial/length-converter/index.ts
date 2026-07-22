import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'mm', label: 'Millimeter (mm)', shortLabel: 'mm', factor: 0.001 },
  { value: 'cm', label: 'Centimeter (cm)', shortLabel: 'cm', factor: 0.01 },
  { value: 'm', label: 'Meter (m)', shortLabel: 'm', factor: 1 },
  { value: 'km', label: 'Kilometer (km)', shortLabel: 'km', factor: 1000 },
  { value: 'in', label: 'Inch (in)', shortLabel: 'in', factor: 0.0254 },
  { value: 'ft', label: 'Foot (ft)', shortLabel: 'ft', factor: 0.3048 },
  { value: 'yd', label: 'Yard (yd)', shortLabel: 'yd', factor: 0.9144 },
  { value: 'mi', label: 'Mile (mi)', shortLabel: 'mi', factor: 1609.344 },
  { value: 'nmi', label: 'Nautical Mile (nmi)', shortLabel: 'nmi', factor: 1852 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Length conversion uses linear scaling factors relative to the meter (the SI base unit). Each unit has a fixed conversion factor to meters. To convert from unit A to unit B, multiply the input value by the ratio of the two factors.',
  variables: [
    { symbol: 'm', name: 'Meter', description: 'The SI base unit of length. Defined as the distance light travels in a vacuum in 1/299,792,458 of a second. The foundation of the metric system.' },
    { symbol: 'ft', name: 'Foot', description: 'The imperial/US customary unit of length. 1 foot = 12 inches. Originally based on the length of a human foot. The standard unit for US construction and aviation altitude.' },
    { symbol: 'mi & km', name: 'Mile & Kilometer', description: 'Mile (1,609.344 m): the primary distance unit in the US and UK for road travel. Kilometer (1,000 m): used by the rest of the world for road distances.' },
    { symbol: 'nmi', name: 'Nautical Mile', description: 'One nautical mile = 1,852 meters exactly. Defined as one minute of latitude along any meridian. Used in aviation, shipping, and GPS navigation.' },
  ],
  howToUse: [
    'Enter the length value you want to convert.',
    'Select the current length unit from the "From" dropdown.',
    'Select the desired length unit from the "To" dropdown.',
    'The converted value is displayed instantly with the formula. Use this for construction, travel planning, engineering, or science homework.',
  ],
  quickReference: [
    { label: '1 m', value: '3.281 ft / 1.094 yd / 39.37 in' },
    { label: '1 ft', value: '30.48 cm / 0.3048 m / 12 in' },
    { label: '1 in', value: '2.54 cm / 25.4 mm' },
    { label: '1 mi', value: '1.609 km / 1,760 yd / 5,280 ft' },
    { label: '1 km', value: '0.621 mi / 1,093.6 yd' },
    { label: '1 nmi', value: '1.852 km / 1.151 mi / 6,076 ft' },
    { label: '1 yd', value: '0.9144 m / 3 ft / 36 in' },
    { label: '1 cm', value: '0.394 in / 10 mm' },
  ],
  commonUses: [
    'Construction: converting blueprint measurements between imperial and metric for international projects',
    'Travel: understanding distances in foreign countries that use different measurement systems',
    'Aviation: altitudes in feet worldwide, but runway lengths in meters in most countries',
    'Shipping: container dimensions in feet/inches in the US, meters elsewhere',
    'Manufacturing: precision machining using millimeters (metric) or thousandths of an inch (imperial)',
    'GPS navigation: coordinates in degrees/minutes/seconds, distances in nautical miles or kilometers',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Common Length Units Visual Comparison</text>' +
      '<!-- 1 meter bar -->' +
      '<rect x="20" y="35" width="200" height="24" rx="3" fill="var(--svg-3b82f6)" opacity="0.6"/>' +
      '<text x="120" y="51" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Meter (39.37 in)</text>' +
      '<!-- 1 foot bar -->' +
      '<rect x="20" y="70" width="61" height="24" rx="3" fill="var(--svg-ef4444)" opacity="0.6"/>' +
      '<text x="50" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 ft</text>' +
      '<!-- 1 inch bar (tiny) -->' +
      '<rect x="20" y="105" width="5.08" height="24" rx="2" fill="var(--svg-22c55e)" opacity="0.6"/>' +
      '<text x="40" y="121" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-22c55e)" font-weight="600">1 in (2.54 cm)</text>' +
      '<!-- 1 yard bar -->' +
      '<rect x="100" y="70" width="91" height="24" rx="3" fill="var(--svg-8b5cf6)" opacity="0.6"/>' +
      '<text x="145" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Yard (0.914 m)</text>' +
      '<!-- scale -->' +
      '<line x1="20" y1="140" x2="220" y2="140" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
      '<line x1="20" y1="136" x2="20" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="20" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0</text>' +
      '<line x1="120" y1="136" x2="120" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="120" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0.5 m</text>' +
      '<line x1="220" y1="136" x2="220" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="220" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">1 m</text>' +
      '</svg>',
    alt: 'Visual comparison of 1 meter, 1 foot, 1 inch, and 1 yard drawn to scale',
    caption: 'Metric and imperial length units compared visually. The meter is the SI standard; the foot, inch, and yard are US customary units.',
  },
  explanation:
    'Length measurement is one of humanity\'s oldest quantified concepts, dating back to the cubit (the length of a forearm) in ancient Egypt and Mesopotamia. Today, the world is split between two major systems: the metric system (SI) and the US customary / imperial system. The metric system, established in France in 1795 and now adopted by every country except the United States, Liberia, and Myanmar, is based on the meter — originally defined as 1/10,000,000 of the distance from the equator to the North Pole along the Paris meridian. Today, the meter is defined with extreme precision by the speed of light: exactly 1/299,792,458 of a light-second. The imperial system uses the foot (12 inches), yard (3 feet), and mile (5,280 feet), with origins in Roman and Anglo-Saxon measurement. The inch is now formally defined as exactly 25.4 mm by international agreement (1959). Nautical miles (1,852 m) are used in aviation and maritime navigation because they correspond to one minute of latitude, making map calculations straightforward. Understanding both systems is essential for international trade, engineering, construction, and travel.',
  faqs: [
    {
      question: 'Why does the US still use imperial units for length?',
      answer: 'The US officially uses US customary units, which are derived from the British imperial system but with some differences (e.g., the US gallon vs. imperial gallon). Despite the Metric Conversion Act of 1975, which declared metric as "preferred," conversion has been voluntary rather than mandated. The high cost of changing road signs, retooling manufacturing equipment, and retraining the workforce has slowed adoption. However, US science, medicine, and many engineering fields use metric exclusively. Everyday life — construction, road distances, body height — remains in imperial. Interestingly, the US officially defines all customary units in terms of metric units (e.g., 1 in = 25.4 mm exactly).',
    },
    {
      question: 'What is the difference between a nautical mile and a statute mile?',
      answer: 'A statute mile (5,280 ft = 1,609.344 m) is used for road distances in the US and UK. A nautical mile (1,852 m = 6,076.1 ft = 1.151 mi) is used in aviation and maritime navigation. The nautical mile is special because it equals exactly one minute of latitude (1/60 of a degree) along any meridian. This makes navigation calculations simple: a difference of 1 minute of latitude = 1 nautical mile. A ship traveling at 1 knot (1 nautical mile per hour) covers one minute of latitude per hour. This relationship to the Earth\'s geometry makes nautical miles indispensable for GPS, aviation charts, and marine navigation.',
    },
    {
      question: 'How do I estimate metric-to-imperial conversions in my head?',
      answer: 'For quick estimation: meters to feet: multiply by 3.3 (10 m ≈ 33 ft). Kilometers to miles: multiply by 0.6 (100 km ≈ 60 mi). Centimeters to inches: multiply by 0.4 (10 cm ≈ 4 in). Feet to meters: divide by 3.3. Miles to kilometers: multiply by 1.6 (10 mi ≈ 16 km). Inches to centimeters: multiply by 2.5 (10 in ≈ 25 cm). These approximations are within 5–10% and work well for travel, hiking, and shopping estimates.',
    },
    {
      question: 'How do I convert feet and inches to meters without a calculator?',
        answer: 'Convert the inches to decimal feet first: inches ÷ 12. Then multiply by 0.3048. Example: 5 ft 7 in = 5 + 7/12 = 5.583 ft. Then 5.583 x 0.3048 = 1.702 m. For rough estimates: 1 ft ≈ 0.3 m (3.3 ft ≈ 1 m), 1 in ≈ 2.5 cm (4 in ≈ 10 cm). These approximations are within 1.6% for feet-to-meters and 1.6% for inches-to-cm. Common reference: an NBA basketball player at 6 ft 6 in is about 1.98 m.',
      },
      {
        question: 'What is a furlong, chain, rod, and league?',
        answer: 'These are older imperial units still referenced in horse racing and historical contexts. 1 furlong = 220 yards = 201.168 m (the length of a medieval furrow). 1 chain = 22 yards = 20.117 m (used in surveying — 80 chains = 1 mile). 1 rod/pole/perch = 5.5 yards = 5.029 m. 1 league = 3 miles = 4.828 km (originally the distance a person could walk in an hour). Horse races in the UK and US are measured in furlongs — the Kentucky Derby is 10 furlongs (1.25 miles). Cricket pitches are 1 chain (22 yards) long. While not in this converter, knowing these units helps interpret older maps, deeds, and literature.',
      },
      {
        question: 'How precise are these length conversions?',
        answer: 'This calculator uses the internationally agreed conversion factors defined by the 1959 International Yard and Pound Agreement: 1 yd = 0.9144 m, 1 in = 25.4 mm, 1 lb = 0.45359237 kg. These are EXACT definitions, not approximations. Conversions are displayed to 6 decimal places, which is far beyond the precision of most measurement tools. For most practical purposes, 4 significant figures are sufficient. A tape measure typically has precision of ±1/16 inch (±1.6 mm), making measurements beyond 3 decimal places meaningless for hand-tool work. However, for CNC machining and scientific instrumentation, sub-micron precision is achievable and the full conversion factor precision becomes relevant.',
      },
      {
        question: 'Why are there different definitions of the foot?',
      answer: 'Historically, the "foot" varied by region — the Roman foot (29.6 cm), Greek foot (30.8 cm), and various European feet all differed. In 1959, English-speaking nations agreed on the international foot of exactly 0.3048 m (30.48 cm). However, the US survey foot (defined as 1200/3937 m ≈ 30.48006 cm) was used for US land surveying until 2022, when federal agencies switched to the international foot. The difference is tiny (about 1/100 of an inch per mile) but matters for large-scale surveys like state boundaries. This agreement standardized length worldwide, ending centuries of confusion.',
    },
  ],
  citations: [
    { source: 'NIST - SI Length', url: 'https://www.nist.gov/pml/owm/si-units-length' },
    { source: 'NIST - US Customary Units', url: 'https://www.nist.gov/pml/owm/us-customary-system' },
  ],
  workedExamples: [
    {
      scenario: 'An architect in London is reviewing construction drawings from a US firm. The floor plan dimensions are given as 42 ft 6 in by 28 ft 3 in. She needs these in meters for the UK building permit application.',
      inputs: { value: '42.5', from: 'ft', to: 'm' },
      result: '42.5 ft = 12.954 m for the long dimension. 28.25 ft = 8.611 m for the short dimension. The room measures approximately 12.95 m x 8.61 m.',
      insight: 'The conversion reveals a large room of about 111.5 square meters. Always convert dimensions separately rather than converting area directly — rounding errors compound when you round first then multiply. Also note that 42 ft 6 in = 42.5 ft (not 42.6, a common mistake). This conversion workflow is standard for international architecture and construction projects where re-measurement is impractical.',
    },
    {
      scenario: 'A marathon runner from the US is traveling to run the Berlin Marathon. She trains in miles and wants to understand the race distance in miles. The marathon is 42.195 km. She also wants to know how many feet that is to correlate with her track workouts.',
      inputs: { value: '42.195', from: 'km', to: 'mi' },
      result: '42.195 km = 26.219 mi. Also: 42.195 km = 138,435 ft. The standard marathon distance of 42.195 km equals exactly 26 miles 385 yards.',
      insight: 'The seemingly arbitrary 42.195 km distance comes from the 1908 London Olympics where the course was extended from 25 miles to 26 miles 385 yards so it could start at Windsor Castle and finish in front of the royal box at White City Stadium. This royal convenience gave us the standard marathon distance. The runner can use the feet conversion to break the race into 400m track intervals (1,312 ft each, roughly 105.5 laps total).',
    },
    {
      scenario: 'A shipping logistics coordinator needs to verify if a cargo container stack will clear a bridge with 4.2 m clearance. The container stack measures 13 ft 9 in. Quick conversion needed in the field.',
      inputs: { value: '13.75', from: 'ft', to: 'm' },
      result: '13.75 ft = 4.191 m. Clearance available: 4.2 m. Margin: 0.009 m (9 mm, or about 3/8 inch).',
      insight: 'This is dangerously close — a 9 mm margin on a 4.2 m clearance is just 0.2% clearance. Road surface repaving, tire pressure variations, or suspension settling could consume this margin. The logistics coordinator should either reconfigure the load (reduce container height), use a low-clearance trailer, or find an alternate route. This real-world conversion illustrates that rounding errors in unit conversion can have serious safety and liability implications. Bridge strike incidents cost the industry billions annually and are often caused by unit confusion between metric bridge heights and imperial vehicle dimensions.',
    },
  ],
  proTips: [
    'For mental estimation, memorize the Fibonacci-like relationship between miles and kilometers: 3 mi ≈ 5 km, 5 mi ≈ 8 km, 8 mi ≈ 13 km. This works because the golden ratio (1.618) is close to the mile/kilometer ratio (1.609). A marathon (26.2 mi ≈ 42.2 km) follows this pattern: 21 mi ≈ 34 km, 34 mi ≈ 55 km.',
    'When converting construction dimensions, always work in decimal feet or decimal inches — not feet-and-inches notation. 5 ft 7 in = 5.583 ft (NOT 5.7 ft, which is 5 ft 8.4 in). Many costly construction errors trace back to decimal vs. duodecimal confusion. Surveyors and civil engineers use decimal feet (tenths of a foot) specifically to avoid this.',
    'For cross-border e-commerce, when a product page says "12 inches" for the US market and "30 cm" for the EU market, the EU measurement is approximate (12 in = 30.48 cm). This 1.6% difference matters for products with tight tolerances like phone cases, mounting brackets, and connectors. Always use the exact conversion (25.4 mm per inch) for precision products.',
    'GPS coordinates use nautical miles for distance calculations because 1 minute of latitude = 1 nautical mile everywhere on Earth. If your GPS shows you are 0.5 minutes of latitude from your waypoint, you are exactly 0.5 nautical miles (926 meters) away. This property does NOT hold for longitude — 1 minute of longitude equals 1 nautical mile times cos(latitude), so at 60 degrees north it is only 0.5 nautical miles.',
    'When reading non-US maps (which almost always use metric), the scale bar is your friend. A 1:25,000 map means 1 cm = 250 m or 4 cm = 1 km. A quick thumb measurement: the width of an adult thumbnail is roughly 1.5 cm, which equals about 375 m on such a map — useful for rough distance estimation while hiking.',
  ],
  limitations: [
    'This calculator performs pure mathematical unit conversions using the internationally defined conversion factors. It does NOT account for: measurement precision (a value of "10 ft" measured with a tape measure has different precision than "10.000 ft" from a laser scanner); significant figures in the input; temperature-dependent thermal expansion of measurement tools and objects (steel expands roughly 12 micrometers per meter per degree Celsius — significant for precision machining and bridge construction).',
    'Length units assume the standard international definitions: 1 in = 25.4 mm (international inch, adopted 1959), 1 ft = 0.3048 m (international foot). It does NOT use the US survey foot (1 ft = 1200/3937 m ≈ 0.3048006 m), which was used for US land surveying until 2022. The difference is 2 parts per million — negligible for most uses but significant for state boundary surveys.',
    'The converter works with linear length conversions only. For area conversions, square the length conversion factor (e.g., 1 m^2 = 10.764 ft^2, NOT 3.281 ft^2). For volume, cube the factor (1 m^3 = 35.315 ft^3). Converting areas or volumes by converting the linear dimension and squaring/cubing introduces no additional error beyond floating-point representation.',
    'For legal, contractual, or safety-critical measurements (property boundaries, aviation clearances, medical device dimensions), always verify with certified reference standards and do not rely solely on this calculator. Measurement traceability to NIST or an equivalent national metrology institute is essential for these applications.',
  ],
};

const converterConfig = createConverter({ units: UNITS, defaultFrom: 'm', defaultTo: 'ft', educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  inputs: converterConfig.inputs.map((input) =>
    input.id === 'value' ? { ...input, inputMode: 'decimal' as const, defaultValue: '1' } : input,
  ),
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Length Conversion' });
  },
};
export default configWithPanel;
