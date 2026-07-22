import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import ConverterPanel from '../ConverterPanel';

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'value',
      label: 'Value',
      type: 'number',
      placeholder: 'Enter value',
      defaultValue: '100',
      required: true,
    },
    {
      id: 'from',
      label: 'From',
      type: 'select',
      defaultValue: 'c',
      options: [
        { label: 'Celsius (°C)', value: 'c' },
        { label: 'Fahrenheit (°F)', value: 'f' },
        { label: 'Kelvin (K)', value: 'k' },
        { label: 'Rankine (°R)', value: 'r' },
      ],
    },
    {
      id: 'to',
      label: 'To',
      type: 'select',
      defaultValue: 'f',
      options: [
        { label: 'Celsius (°C)', value: 'c' },
        { label: 'Fahrenheit (°F)', value: 'f' },
        { label: 'Kelvin (K)', value: 'k' },
        { label: 'Rankine (°R)', value: 'r' },
      ],
    },
  ],
  calculate: (values) => {
    const val = parseFloat(values.value);
    const from = values.from || 'c';
    const to = values.to || 'f';
    if (isNaN(val)) return [];

    // Convert from source to Kelvin first
    let kelvin: number;
    if (from === 'c') kelvin = val + 273.15;
    else if (from === 'f') kelvin = (val - 32) * 5 / 9 + 273.15;
    else if (from === 'r') kelvin = val * 5 / 9;
    else kelvin = val; // K

    // Convert from Kelvin to target
    let result: number;
    if (to === 'c') result = kelvin - 273.15;
    else if (to === 'f') result = (kelvin - 273.15) * 9 / 5 + 32;
    else if (to === 'r') result = kelvin * 9 / 5;
    else result = kelvin; // K

    return [
      {
        id: 'result',
        label: `Result`,
        value: `${val}°${from.toUpperCase()} = ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}°${to.toUpperCase()}`,
        highlight: true,
        color: 'positive',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Temperature Conversion' });
  },
  educational: {
    formula:
      '°C = (°F − 32) × 5/9 | °F = (°C × 9/5) + 32 | K = °C + 273.15',
    formulaDescription:
      'Temperature conversion uses offset formulas rather than simple multiplication because the zero points of each scale differ. Celsius and Fahrenheit have both different zero points and different degree sizes. Kelvin and Rankine are absolute scales (zero = absolute zero) but use Celsius-sized and Fahrenheit-sized degrees respectively.',
    variables: [
      {
        symbol: '°C',
        name: 'Celsius',
        description:
          'The metric temperature scale where water freezes at 0°C and boils at 100°C at sea level. Used worldwide for everyday and scientific temperature measurement.',
      },
      {
        symbol: '°F',
        name: 'Fahrenheit',
        description:
          'The imperial temperature scale where water freezes at 32°F and boils at 212°F at sea level. The primary scale used in the United States for weather, cooking, and body temperature.',
      },
      {
        symbol: 'K',
        name: 'Kelvin',
        description:
          'The SI base unit of thermodynamic temperature. Zero Kelvin (0 K) is absolute zero (−273.15°C), the point at which all molecular motion ceases. Used in science and engineering.',
      },
      {
        symbol: '°R',
        name: 'Rankine',
        description:
          'An absolute temperature scale using Fahrenheit-sized degrees. Zero Rankine (0 °R) is absolute zero. Used primarily in American engineering for thermodynamics calculations.',
      },
    ],
    howToUse: [
      'Enter the temperature value you want to convert.',
      'Select the current temperature scale from the "From" dropdown.',
      'Select the desired temperature scale from the "To" dropdown.',
      'The converted temperature is displayed instantly. Use this for cooking recipes, science homework, travel planning, or engineering calculations.',
    ],
    quickReference: [
      { label: 'Water freezes', value: '0°C / 32°F / 273.15 K / 491.67 °R' },
      { label: 'Room temp', value: '20–22°C / 68–72°F' },
      { label: 'Body temp', value: '37°C / 98.6°F / 310.15 K' },
      { label: 'Water boils', value: '100°C / 212°F / 373.15 K / 671.67 °R' },
      { label: 'Absolute zero', value: '−273.15°C / −459.67°F / 0 K / 0 °R' },
      { label: 'Oven (common)', value: '180°C / 350°F / Gas Mark 4' },
    ],
    commonUses: [
      'Cooking: converting oven temperatures between °C and °F for international recipes',
      'Weather: understanding temperature forecasts when traveling between countries',
      'Science: converting laboratory measurements for reports and experiments',
      'Engineering: thermodynamics calculations using Kelvin or Rankine for absolute temperature',
      'Health: converting body temperature readings between Celsius and Fahrenheit',
      'HVAC: converting temperature settings and specifications between scales',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="22" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Temperature Scale Comparison</text>' +
        '<text x="240" y="40" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">How the four common scales relate to each other</text>' +
        '<!-- Background -->' +
        '<rect x="20" y="55" width="440" height="220" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- Absolute zero line -->' +
        '<line x1="35" y1="260" x2="445" y2="260" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,2"/>' +
        '<text x="445" y="256" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="end">Absolute Zero (0 K / −273°C)</text>' +
        '<!-- C scale -->' +
        '<rect x="50" y="95" width="40" height="150" rx="4" fill="var(--svg-3b82f6)" opacity="0.15"/>' +
        '<text x="70" y="88" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">°C</text>' +
        '<rect x="50" y="95" width="40" height="100" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/>' +
        '<line x1="50" y1="105" x2="90" y2="105" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="95" y="108" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-3b82f6)">100°C — Boiling</text>' +
        '<line x1="50" y1="195" x2="90" y2="195" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="95" y="198" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-3b82f6)">0°C — Freezing</text>' +
        '<!-- F scale -->' +
        '<rect x="130" y="55" width="40" height="190" rx="4" fill="var(--svg-ef4444)" opacity="0.15"/>' +
        '<text x="150" y="48" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ef4444)" font-weight="700" text-anchor="middle">°F</text>' +
        '<rect x="130" y="55" width="40" height="95" rx="4" fill="var(--svg-ef4444)" opacity="0.5"/>' +
        '<line x1="130" y1="62" x2="170" y2="62" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="175" y="65" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ef4444)">212°F — Boiling</text>' +
        '<line x1="130" y1="150" x2="170" y2="150" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="175" y="153" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ef4444)">32°F — Freezing</text>' +
        '<!-- K scale -->' +
        '<rect x="220" y="55" width="40" height="205" rx="4" fill="var(--svg-22c55e)" opacity="0.15"/>' +
        '<text x="240" y="48" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">K</text>' +
        '<rect x="220" y="55" width="40" height="65" rx="4" fill="var(--svg-22c55e)" opacity="0.5"/>' +
        '<line x1="220" y1="62" x2="260" y2="62" stroke="var(--svg-22c55e)" stroke-width="1"/><text x="265" y="65" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-22c55e)">373.15 K — Boiling</text>' +
        '<line x1="220" y1="152" x2="260" y2="152" stroke="var(--svg-22c55e)" stroke-width="1"/><text x="265" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-22c55e)">273.15 K — Freezing</text>' +
        '<!-- R scale -->' +
        '<rect x="310" y="55" width="40" height="205" rx="4" fill="var(--svg-8b5cf6)" opacity="0.15"/>' +
        '<text x="330" y="48" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-8b5cf6)" font-weight="700" text-anchor="middle">°R</text>' +
        '<rect x="310" y="55" width="40" height="73" rx="4" fill="var(--svg-8b5cf6)" opacity="0.5"/>' +
        '<line x1="310" y1="62" x2="350" y2="62" stroke="var(--svg-8b5cf6)" stroke-width="1"/><text x="355" y="65" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-8b5cf6)">671.67 °R — Boiling</text>' +
        '<text x="250" y="240" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">At sea level; bar heights are proportional</text>' +
        '</svg>',
      alt: 'Comparative bar chart showing Celsius, Fahrenheit, Kelvin, and Rankine scales with freezing and boiling points of water',
      caption:
        'The four major temperature scales compared. Kelvin and Rankine are absolute scales starting at absolute zero.',
    },
    explanation:
      'Temperature is one of the most commonly converted physical quantities, yet it is unique among unit conversions because it involves both scaling and offset transformations. Unlike length or mass, where conversion is simply multiplying by a factor, temperature scales have different zero points. The Celsius scale sets 0°C at the freezing point of water. Fahrenheit sets 32°F at the same point. Kelvin and Rankine both start at absolute zero (−273.15°C, −459.67°F), the theoretical minimum temperature where all molecular motion stops. To convert between any two scales, the general approach is: first convert to Kelvin (the universal intermediate), then convert to the target scale. For example, 68°F → (68 − 32) × 5/9 = 20°C, or 68°F → (68 + 459.67) × 5/9 = 293.15 K. The Rankine scale is used almost exclusively in American engineering thermodynamics because it has the same degree size as Fahrenheit (so ΔT in °R = ΔT in °F) but starts at absolute zero, making gas law calculations consistent.',
    faqs: [
      {
        question: 'Why does the US still use Fahrenheit?',
        answer:
          'The US continues to use Fahrenheit primarily for cultural inertia and practicality for everyday use. The Fahrenheit scale has 180 degrees between freezing (32°F) and boiling (212°F) of water, which proponents argue gives more granular everyday temperature ranges. The 0°F reference was originally based on the freezing point of a brine solution (the coldest temperature Fahrenheit could reliably reproduce in his lab). While nearly every other country has officially adopted Celsius (or centigrade), resistance to Fahrenheit change in the US has persisted despite multiple metrication efforts since the 1970s. In scientific contexts, US researchers use Celsius and Kelvin exclusively.',
      },
      {
        question: 'What is absolute zero and why does it matter?',
        answer:
          'Absolute zero (0 K = −273.15°C = −459.67°F) is the theoretical lowest possible temperature where particles have minimum vibrational energy. It matters because it forms the foundation of the Kelvin and Rankine absolute temperature scales. In thermodynamics, many equations (the ideal gas law PV = nRT, the Stefan-Boltzmann law for thermal radiation) require temperature in an absolute scale — using Celsius or Fahrenheit would give incorrect results because they have arbitrary zero points. At temperatures approaching absolute zero, quantum effects like superconductivity and superfluidity emerge. The coldest temperature ever achieved in a lab is about 100 nanokelvin (0.0000001 K) above absolute zero.',
      },
      {
        question: 'Why do ovens use different temperatures in different countries?',
        answer:
          'Recipe sources vary by region: US recipes use Fahrenheit (typically 300–450°F), European recipes use Celsius (150–230°C), and UK recipes sometimes use Gas Marks (1–9). Gas Marks are unique to British ovens — Gas Mark 4 = 180°C = 350°F, with each mark representing about 14°C (25°F) increments. Fan/convection ovens typically cook at about 20°C (36°F) lower than conventional ovens. When converting recipes, accurate temperature conversion is critical for baking where chemical reactions (baking soda decomposition, protein denaturation, sugar caramelization) are temperature-sensitive within narrow ranges.',
      },
      {
        question: 'How do I quickly convert Celsius to Fahrenheit in my head?',
        answer:
          'The exact formula is °F = °C × 9/5 + 32, but a quick mental approximation: double the Celsius temperature and add 30. For 20°C: 20 × 2 + 30 = 70°F (exact: 68°F — close enough). For 30°C: 30 × 2 + 30 = 90°F (exact: 86°F). For 0°C: 0 × 2 + 30 = 30°F (exact: 32°F). The approximation is most accurate in the 10–30°C range (typical weather temperatures). For Fahrenheit to Celsius: subtract 30 then halve. For absolute precision, use the exact formula or this converter.',
      },
    ],
    citations: [
      { source: 'NIST - SI Temperature', url: 'https://www.nist.gov/pml/owm/si-units-temperature' },
      { source: 'NIST - Temperature Conversion', url: 'https://www.nist.gov/pml/owm/temperature-conversion' },
    ],
  },
};
export default config;
