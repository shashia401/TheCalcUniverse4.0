import { createElement } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS = [
  { value: 'ms', label: 'Meter per Second (m/s)', shortLabel: 'm/s', factor: 1 },
  { value: 'kmh', label: 'Kilometer per Hour (km/h)', shortLabel: 'km/h', factor: 0.277778 },
  { value: 'mph', label: 'Mile per Hour (mph)', shortLabel: 'mph', factor: 0.44704 },
  { value: 'fts', label: 'Foot per Second (ft/s)', shortLabel: 'ft/s', factor: 0.3048 },
  { value: 'kn', label: 'Knot (kn)', shortLabel: 'kn', factor: 0.514444 },
  { value: 'c', label: 'Speed of Light (c)', shortLabel: 'c', factor: 299792458 },
  { value: 'mach', label: 'Mach (at sea level)', shortLabel: 'Mach', factor: 340.29 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Speed conversion uses linear scaling factors relative to meters per second (m/s), the SI unit of velocity. Each unit has a fixed conversion factor to m/s. To convert from unit A to unit B, multiply the input value by the ratio of the two factors.',
  formulaSource: 'The meter per second (m/s) was adopted by the CGPM in 1960 as the SI derived unit of velocity. The knot was standardized internationally in 1954 as exactly 1 nautical mile per hour, where 1 nautical mile = 1,852 meters exactly. The speed of light in vacuum (c = 299,792,458 m/s) was fixed as an exact constant by the CGPM in 1983, defining the meter itself. Highway speed units (km/h, mph) are derived from national measurement standards maintained by NIST and national metrology institutes.',
  variables: [
    { symbol: 'm/s', name: 'Meter per Second', description: 'The SI unit of speed and velocity. An object moving at 1 m/s travels one meter in one second. The standard unit for physics and scientific calculations. A person walking briskly moves at about 1.4 m/s.' },
    { symbol: 'km/h', name: 'Kilometer per Hour', description: 'The standard unit for road speed limits and vehicle speedometers in most countries worldwide. 1 km/h = 0.2778 m/s. Named after the metric prefix kilo (1,000) and hour (3,600 seconds), so 1 km/h = 1,000 m / 3,600 s = 5/18 m/s exactly.' },
    { symbol: 'mph', name: 'Mile per Hour', description: 'The standard unit for road speed limits and vehicle speedometers in the US, UK, and a few other countries. 1 mph = 0.44704 m/s = 1.609344 km/h exactly (since the international yard and pound agreement of 1959).' },
    { symbol: 'kn', name: 'Knot', description: 'One nautical mile per hour. Used universally in aviation, maritime navigation, and meteorology. 1 kn = 1.852 km/h = 0.514444 m/s. The name comes from the historical method of measuring ship speed with a knotted rope (chip log).' },
    { symbol: 'Mach', name: 'Mach Number', description: 'The ratio of an object\'s speed to the speed of sound in the surrounding medium. Mach 1 at sea level (15°C) = 340.29 m/s = 1,225 km/h. Named after Austrian physicist Ernst Mach (1838-1916). Varies with temperature and altitude.' },
    { symbol: 'c', name: 'Speed of Light', description: 'The universal speed limit: 299,792,458 m/s exactly (defined constant since 1983). About 1.079 billion km/h or 670.6 million mph. Nothing with mass can reach this speed per special relativity.' },
  ],
  howToUse: [
    'Enter the speed value you want to convert in the "Value" field (e.g., 100 for 100 km/h or 60 for 60 mph).',
    'Select the current speed unit from the "From" dropdown — choose from m/s, km/h, mph, knots, Mach, ft/s, or speed of light.',
    'Select the desired speed unit from the "To" dropdown — the target unit for your calculation.',
    'The converted value appears instantly with the mathematical formula shown. Use the quick reference table below for common conversions.',
  ],
  quickReference: [
    { label: '100 km/h', value: '62.14 mph / 27.78 m/s / 54.0 kn' },
    { label: '60 mph', value: '96.56 km/h / 26.82 m/s / 52.14 kn' },
    { label: '10 m/s', value: '36 km/h / 22.37 mph / 19.44 kn' },
    { label: '1 kn', value: '1.852 km/h / 1.151 mph / 0.5144 m/s' },
    { label: 'Mach 1 (sea level)', value: '1,225 km/h / 761.2 mph / 661.7 kn / 340.3 m/s' },
    { label: 'Speed of light', value: '299,792,458 m/s / 1.079×10⁹ km/h / 6.706×10⁸ mph' },
    { label: 'Walking pace', value: '5 km/h / 3.1 mph / 1.4 m/s' },
    { label: 'Sprinting (elite)', value: '37.6 km/h / 23.4 mph / 10.4 m/s (Usain Bolt peak)' },
  ],
  commonUses: [
    'Driving: converting speed limits and vehicle speeds between km/h and mph when traveling between countries (e.g., crossing from Canada to the US)',
    'Aviation: aircraft speeds use knots for airspeed and Mach number at high altitudes, with ground speed in km/h or mph depending on region',
    'Weather: wind speeds reported in knots (maritime/aviation), km/h (most countries), or mph (US) — critical for storm tracking and marine forecasts',
    'Physics: calculating velocity in m/s for kinematics, momentum (p = mv), kinetic energy (KE = ½mv²), and relativistic calculations',
    'Navigation: converting between knots and km/h or mph for sailing, boating, and flight planning — 1 knot = 1 minute of latitude per hour',
    'Running and sports: tracking pace and speed — elite marathoners run at ~20 km/h (12.4 mph), cyclists sprint at 70+ km/h (43+ mph)',
  ],
  workedExamples: [
    {
      scenario: 'A tourist from Germany is driving in the US. The rental car speedometer shows mph, but they are used to km/h. The highway speed limit sign says 70 mph. What is that in km/h, and what should they set the cruise control to?',
      inputs: { value: '70', from: 'mph', to: 'kmh' },
      result: '70 mph × 1.609344 = 112.65 km/h. Set cruise control to roughly 113 km/h. For quick mental math: mph × 8 ÷ 5 = km/h. 70 × 8 ÷ 5 = 112 km/h — close enough for practical use.',
      insight: 'The 8/5 conversion trick (mph × 8 ÷ 5 ≈ km/h) works because 8/5 = 1.6 and the exact factor is 1.609344 — only 0.6% error. For the reverse (km/h to mph), use 5/8: km/h × 5 ÷ 8 = mph. Most US interstate highways have limits of 65-75 mph (105-121 km/h), while German Autobahns famously have no general speed limit but a recommended 130 km/h (81 mph).',
    },
    {
      scenario: 'A pilot is flying from London to New York at a cruising speed of 480 knots at 35,000 feet. The flight computer shows ground speed in km/h for the passenger information display. What ground speed in km/h should be displayed? Also, what is the Mach number at this altitude?',
      inputs: { value: '480', from: 'kn', to: 'kmh' },
      result: '480 kn × 1.852 = 888.96 km/h. Ground speed ≈ 889 km/h (assuming zero wind). Mach number at 35,000 ft: speed of sound at −54°C is ~295 m/s (1,062 km/h). Mach = 889 ÷ 1,062 ≈ 0.837 — typical for long-haul airliners cruising at Mach 0.78-0.85.',
      insight: 'The speed of sound decreases with altitude because air temperature drops. At sea level (15°C), Mach 1 = 340 m/s (1,225 km/h). At 35,000 ft (−54°C), Mach 1 ≈ 295 m/s (1,062 km/h). This means an aircraft flying at the same true airspeed climbs to a higher Mach number at altitude — important for avoiding the transonic drag rise near Mach 1. Actual ground speed depends on headwind/tailwind.',
    },
    {
      scenario: 'A physics teacher in Tokyo wants to demonstrate the speed of sound to students. They want to express Mach 1 in familiar everyday units: a baseball pitch in km/h, a cheetah\'s top speed in m/s, and a bullet train\'s cruising speed in km/h for comparison.',
      inputs: { value: '1', from: 'mach', to: 'kmh' },
      result: 'Mach 1 (sea level) = 340.29 m/s = 1,225 km/h. Comparisons: fastest baseball pitch = 169.1 km/h (0.138 Mach), cheetah top speed = 29 m/s (0.08 Mach), Shinkansen bullet train = 320 km/h (0.26 Mach), commercial jet = 900 km/h (~Mach 0.73). Only fighter jets and Concorde (Mach 2.04) routinely exceed Mach 1.',
      insight: 'Mach 1 is remarkably fast — about 3.4 football fields per second. Everyday speeds are a tiny fraction of Mach 1. Even the fastest production car (Bugatti Chiron Super Sport at 490 km/h) reaches only Mach 0.40. The speed of sound has been broken by humans on land (ThrustSSC, 1,228 km/h, 1997), water (Spirit of Australia, 511 km/h, 1978 — not supersonic, water speed record is subsonic), and of course in the air (Chuck Yeager, Bell X-1, 1947).',
    },
  ],
  proTips: [
    'For highway driving abroad, remember the 8/5 rule: mph × 8 ÷ 5 = km/h (error < 1%). The reverse: km/h × 5 ÷ 8 = mph. Write these on a sticky note in your rental car — most speedometer errors happen in the first hour of driving in a new country.',
    'When reading aviation weather (METAR), wind speeds are ALWAYS in knots. If you need km/h for a weather report, multiply knots by 1.852. A 20-knot wind is 37 km/h — strong enough to make cycling difficult. A 50-knot wind (93 km/h) is storm-force.',
    'Real-world Mach number is altitude-dependent. At sea level: Mach 1 ≈ 1,225 km/h. At 35,000 ft: Mach 1 ≈ 1,062 km/h. An aircraft "flying at Mach 0.85" is flying at a different true airspeed depending on altitude. Use this converter with the sea-level Mach value and adjust mentally for altitude.',
    'For running pace: most GPS watches show speed in min/km or min/mile. To convert: speed (km/h) = 60 ÷ pace (min/km). A 5:00 min/km pace = 12 km/h. Speed (mph) = 60 ÷ pace (min/mile). A 8:00 min/mile pace = 7.5 mph. Use this converter for km/h to mph after calculating speed from pace.',
    'When shopping for a car abroad, convert the horsepower and top speed specs: German cars list top speed in km/h, UK cars in mph. A car listed at "250 km/h electronically limited" is 155 mph — the famous German "gentlemen\'s agreement" limit. Use this converter to compare specs across markets.',
    'For sailing passage planning: 1 knot = 1 nautical mile per hour. If your destination is 60 nautical miles away and you sail at 5 knots, it takes 12 hours. This elegant relationship (1 minute of latitude = 1 nautical mile) is why knots persist in navigation despite metrication of almost everything else.',
  ],
  limitations: [
    'Mach number conversion in this calculator uses the sea-level standard (340.29 m/s at 15°C). At altitude, the speed of sound decreases significantly — at 35,000 ft (−54°C), Mach 1 is only 295 m/s, 13% slower. For aerospace applications requiring altitude-corrected Mach numbers, use a specialized aviation calculator with temperature input.',
    'The speed-of-light unit (c) assumes vacuum speed (299,792,458 m/s). Light travels slower in any medium — about 225,000 km/s in water (25% slower) and 200,000 km/s in glass (33% slower). For fiber optics and refraction calculations, use the refractive index of the specific medium.',
    'This calculator converts linear speed magnitudes only. It does not handle rotational speed (RPM, rad/s — use the Frequency Converter for that), angular velocity, or relativistic velocity addition. For speeds approaching c, relativistic effects (time dilation, length contraction) become significant and this simple linear conversion is inadequate.',
    'The wind speed conversions (knots to km/h to mph) cover the Beaufort scale range, but gusts and sustained wind have different meanings: "wind speed" in forecasts typically means sustained wind averaged over 1-10 minutes, while gusts are 1-3 second peaks. This converter handles the units, not the meteorological definitions.',
    'Running speed from GPS watches often uses Doppler-shifted satellite signals, which are accurate to ±0.2 km/h under open sky but degrade near tall buildings or under tree cover. The speed values you convert are only as accurate as the source measurement.',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Speed Comparison of Common Speeds</text>' +
      '<rect x="20" y="35" width="20" height="20" rx="3" fill="var(--svg-3b82f6)" opacity="0.6"/>' +
      '<text x="30" y="47" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">5</text>' +
      '<text x="45" y="49" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-3b82f6)">Walking (5 km/h)</text>' +
      '<rect x="20" y="65" width="60" height="20" rx="3" fill="var(--svg-22c55e)" opacity="0.6"/>' +
      '<text x="50" y="77" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">15</text>' +
      '<text x="85" y="79" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-22c55e)">Sprint (15 km/h / 9.3 mph)</text>' +
      '<rect x="20" y="95" width="200" height="20" rx="3" fill="var(--svg-ef4444)" opacity="0.6"/>' +
      '<text x="120" y="107" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">100 km/h (62 mph)</text>' +
      '<rect x="20" y="125" width="300" height="20" rx="3" fill="var(--svg-8b5cf6)" opacity="0.6"/>' +
      '<text x="170" y="137" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Cruising speed ~900 km/h (560 mph / Mach 0.85)</text>' +
      '</svg>',
    alt: 'Speed comparison bar chart showing walking, sprinting, car, and airplane speeds relative to each other',
    caption: 'Common speeds from walking to jet aircraft. The bar widths show relative velocity.',
  },
  explanation:
    'Speed is a fundamental physical quantity that measures how fast an object covers distance. The SI unit is meters per second (m/s), but everyday life uses km/h or mph depending on the country. The history of speed measurement reflects human transportation evolution: horse-drawn carriages gave way to steam locomotives (which popularized mph), then automobiles (which standardized km/h in most of the world), aircraft (which adopted knots), and spacecraft (which use km/s). Speed converters are essential because different domains use different units: car speedometers in the US show mph; everywhere else shows km/h. Aviation uses knots (nautical miles per hour) for airspeed and altitude rates, but Mach number for high-speed flight relative to the speed of sound. Meteorology reports wind speeds in knots internationally, km/h in most countries, and mph in the US. The knot is uniquely useful in navigation because one knot equals one nautical mile per hour, and one nautical mile equals one minute of latitude — making time-distance calculations at sea and in the air straightforward. The speed of sound (Mach 1) varies with temperature and altitude: at sea level (15°C), it is about 340.29 m/s (1,225 km/h), but at 11,000 m cruising altitude where air is colder, it drops to about 295 m/s (1,062 km/h). The speed of light (299,792,458 m/s) is the universe\'s speed limit and a fundamental physical constant — it was measured with increasing precision from Ole Rømer\'s observations of Jupiter\'s moons (1676) to the 1983 CGPM definition that fixed c as exact.',
  faqs: [
    {
      question: 'Why does aviation use knots instead of km/h or mph?',
      answer: 'Aviation and maritime use knots because of the elegant relationship to latitude and longitude. One knot equals one nautical mile per hour, and one nautical mile equals one minute of latitude (about 1.852 km). This makes navigation calculations intuitive: if you fly 60 nautical miles north or south, you have changed latitude by exactly 1 degree. Charts and maps are marked in degrees and minutes, so plotting courses is straightforward — you can measure distance directly from the latitude scale on the edge of the chart. Additionally, international aviation standards (ICAO) use knots universally — a pilot flying from the US to Europe uses the same speed units throughout the flight. Air traffic control worldwide uses knots for speed and feet for altitude, creating a consistent global system that avoids conversion errors in busy airspace.',
    },
    {
      question: 'How is Mach number calculated and why does it change with altitude?',
      answer: 'Mach number is the ratio of an object\'s speed to the speed of sound in the surrounding medium. Mach 1 = the speed of sound, which is determined by air temperature: speed of sound = √(γ × R × T), where γ ≈ 1.4 (ratio of specific heats for air), R = 287 J/(kg·K), and T is the absolute temperature in Kelvin. At sea level at 15°C (288 K), Mach 1 ≈ 340 m/s (1,225 km/h, 761 mph). At 35,000 ft cruising altitude (−54°C or 219 K), Mach 1 ≈ 295 m/s (1,062 km/h). So an aircraft flying at Mach 0.85 at 35,000 ft has a true airspeed of about 0.85 × 1,062 = 903 km/h. Supersonic flight begins at Mach 1 (the sound barrier), transonic flow occurs between Mach 0.8-1.2, and hypersonic flight is typically Mach 5+. The term honors Ernst Mach, who photographed bullets in flight to study shock waves.',
    },
    {
      question: 'How do I quickly convert between km/h and mph in my head?',
      answer: 'The 8/5 rule: km/h to mph: multiply by 5 then divide by 8 (or multiply by 0.625). Example: 100 km/h → 100 × 5 ÷ 8 = 62.5 mph (exact: 62.14 mph, only 0.6% error). For mph to km/h: multiply by 8 then divide by 5 (or multiply by 1.6). Example: 60 mph → 60 × 8 ÷ 5 = 96 km/h (exact: 96.56 km/h, only 0.6% error). The 5/8 factor comes from the approximation: 1 mile = 1.6 km, and 5/8 = 0.625 ≈ 0.621 (the exact factor). For even simpler mental math at common speeds, just remember: 50 mph ≈ 80 km/h, 60 mph ≈ 97 km/h, 70 mph ≈ 113 km/h, 80 mph ≈ 129 km/h, 100 km/h ≈ 62 mph, 120 km/h ≈ 75 mph.',
    },
    {
      question: 'What is the difference between speed and velocity?',
      answer: 'Speed is a scalar quantity — it has only magnitude (e.g., 60 km/h). Velocity is a vector — it has both magnitude AND direction (e.g., 60 km/h north). In physics, velocity matters for momentum (p = mv) and acceleration calculations because direction changes affect the result. A car driving in a circle at constant speed has changing velocity (since direction changes) and therefore has centripetal acceleration toward the center. For a satellite in a circular orbit at constant speed, its velocity vector changes continuously — it is always accelerating toward Earth. Speed converters on this page convert the magnitude (scalar) only. For vector calculations involving direction, you must account for direction separately using trigonometry or vector addition.',
    },
    {
      question: 'What is the fastest speed ever achieved by a human?',
      answer: 'The fastest speed achieved by humans: Apollo 10 astronauts reached 39,897 km/h (24,791 mph, about Mach 36) during their return from the Moon in 1969 — the fastest humans have ever traveled relative to Earth. For unmanned objects: the Parker Solar Probe reached 635,266 km/h (394,736 mph) in 2024 during its closest approach to the Sun, making it the fastest human-made object. On land: ThrustSSC reached 1,228 km/h (763 mph, Mach 1.02) in 1997, breaking the sound barrier on land. On water: the current record is 511 km/h (317 mph), set by Spirit of Australia in 1978 — no watercraft has broken the sound barrier. In a production car: the Bugatti Chiron Super Sport 300+ reached 490 km/h (304 mph) in 2019.',
    },
    {
      question: 'Why do ships and aircraft measure speed in knots?',
      answer: 'The knot has a fascinating nautical origin. Until the 19th century, ships measured speed using a "chip log" — a wooden board attached to a rope with knots tied at regular intervals (47 feet 3 inches apart, or 8 fathoms). The board was thrown overboard, and the number of knots that passed through a sailor\'s hands in 28 seconds (measured by a sandglass) gave the speed in nautical miles per hour. This "knots" unit proved so practical it survived into the modern era. Today, 1 knot = 1 nautical mile per hour = 1.852 km/h = 1.151 mph. The knot persists because it integrates perfectly with latitude-based navigation: 1 minute of latitude = 1 nautical mile, making chart work trivially easy. A ship or aircraft\'s speed in knots directly tells you how many minutes of latitude you cover per hour.',
    },
  ],
  citations: [
    { source: 'NIST - SI Units of Speed', url: 'https://www.nist.gov/pml/owm/si-units-speed' },
    { source: 'NASA - Mach Number', url: 'https://www.grc.nasa.gov/www/k-12/airplane/mach.html' },
    { source: 'ICAO - Standard Atmosphere', url: 'https://www.icao.int/safety/OPS/OPS-Normal/Pages/Standard-Atmosphere.aspx' },
  ],
};

const inputs = [
  {
    id: 'value',
    label: 'Value to Convert',
    type: 'number' as const,
    placeholder: 'Enter speed (e.g., 100)',
    inputMode: 'numeric' as const,
    required: true,
    helpText: 'The numeric speed value you want to convert between units',
  },
  {
    id: 'from',
    label: 'From Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: 'kmh',
    helpText: 'The speed unit you are converting from (e.g., km/h, mph, knots)',
  },
  {
    id: 'to',
    label: 'To Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: 'mph',
    showWhen: (values: Record<string, string>) => !!values.value,
    helpText: 'The speed unit you are converting to (e.g., mph for US speedometers)',
  },
];

const calculate = (values: Record<string, string>) => {
  if (!values || Object.keys(values).length === 0) return [];
  if (values.value === undefined || values.value === null || values.value.trim() === '') return [];
  const val = parseFloat(values.value);
  if (isNaN(val) || !isFinite(val)) return [];

  const fromUnit = values.from || 'kmh';
  const toUnit = values.to || 'mph';

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
    return createElement(ConverterPanel, { values, results, label: 'Speed Conversion' });
  },
};
export default configWithPanel;
