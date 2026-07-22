import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'ml', label: 'Milliliter (mL)', shortLabel: 'mL', factor: 0.001 },
  { value: 'l', label: 'Liter (L)', shortLabel: 'L', factor: 1 },
  { value: 'm3', label: 'Cubic Meter (m³)', shortLabel: 'm³', factor: 1000 },
  { value: 'tsp', label: 'Teaspoon (tsp)', shortLabel: 'tsp', factor: 0.00492892 },
  { value: 'tbsp', label: 'Tablespoon (tbsp)', shortLabel: 'tbsp', factor: 0.0147868 },
  { value: 'floz', label: 'Fluid Ounce (fl oz)', shortLabel: 'fl oz', factor: 0.0295735 },
  { value: 'cup', label: 'US Cup', shortLabel: 'cup', factor: 0.236588 },
  { value: 'pt', label: 'US Pint (pt)', shortLabel: 'pt', factor: 0.473176 },
  { value: 'qt', label: 'US Quart (qt)', shortLabel: 'qt', factor: 0.946353 },
  { value: 'gal', label: 'US Gallon (gal)', shortLabel: 'gal', factor: 3.78541 },
  { value: 'in3', label: 'Cubic Inch (in³)', shortLabel: 'in³', factor: 0.0163871 },
  { value: 'ft3', label: 'Cubic Foot (ft³)', shortLabel: 'ft³', factor: 28.3168 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Volume conversion uses linear scaling factors relative to the liter. Each unit has a fixed conversion factor to liters. To convert from unit A to unit B, multiply the input value by the ratio of the two factors.',
  variables: [
    { symbol: 'L', name: 'Liter', description: 'The metric base unit of volume. One liter equals the volume of a cube 10 cm on each side (1,000 cm³). Commonly used for beverages, fuel, and liquid measurements worldwide.' },
    { symbol: 'gal', name: 'US Gallon', description: 'The primary US liquid volume unit. A US gallon (3.785 L) is smaller than the imperial gallon (4.546 L). Used for fuel, milk, and other bulk liquids in the US.' },
    { symbol: 'fl oz & cup', name: 'Fluid Ounce & Cup', description: 'US fluid ounce (29.57 mL): used for small liquid quantities in recipes and beverages. US cup (236.6 mL): the standard US cooking measure, equivalent to 8 fl oz.' },
    { symbol: 'm³ & ft³', name: 'Cubic Meter & Cubic Foot', description: 'Cubic meter (1,000 L): the SI unit for large volumes like shipping containers and room sizes. Cubic foot (28.32 L): used in construction, HVAC, and refrigeration in the US.' },
  ],
  howToUse: [
    'Enter the volume value you want to convert.',
    'Select the current volume unit from the "From" dropdown.',
    'Select the desired volume unit from the "To" dropdown.',
    'The converted value is displayed instantly with the formula. Use this for cooking, automotive, construction, or science calculations.',
  ],
  quickReference: [
    { label: '1 L', value: '0.264 US gal / 33.814 fl oz / 4.227 cups' },
    { label: '1 US gal', value: '3.785 L / 128 fl oz / 16 cups / 8 pt / 4 qt' },
    { label: '1 fl oz', value: '29.57 mL / 0.125 cup / 2 tbsp' },
    { label: '1 cup', value: '236.6 mL / 8 fl oz / 16 tbsp / 48 tsp' },
    { label: '1 m³', value: '1,000 L / 264.17 US gal / 35.315 ft³' },
    { label: '1 ft³', value: '28.317 L / 7.481 US gal / 1,728 in³' },
    { label: '1 qt', value: '0.946 L / 32 fl oz / 2 pt' },
    { label: '1 tbsp', value: '14.79 mL / 0.5 fl oz / 3 tsp' },
  ],
  commonUses: [
    'Cooking: converting between cups, milliliters, tablespoons, and teaspoons for international recipes',
    'Automotive: measuring engine displacement in liters (L) or cubic inches (in³), fuel economy in gallons or liters',
    'Construction: calculating concrete volume in cubic yards or cubic meters for foundations and slabs',
    'Shipping: determining cargo volume in cubic meters (CBM) for freight container loading',
    'Science: measuring liquids in lab beakers and graduated cylinders using mL and L',
    'HVAC: sizing air handlers and ductwork using cubic feet per minute (CFM) and refrigerant volumes',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Common Volume Units Visual Comparison</text>' +
      '<!-- 1 L bar -->' +
      '<rect x="20" y="35" width="200" height="24" rx="3" fill="var(--svg-3b82f6)" opacity="0.6"/>' +
      '<text x="120" y="51" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 Liter (33.8 fl oz)</text>' +
      '<!-- 1 US gal bar -->' +
      '<rect x="20" y="70" width="189" height="24" rx="3" fill="var(--svg-ef4444)" opacity="0.6"/>' +
      '<text x="114" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 US Gallon (3.785 L)</text>' +
      '<!-- 1 cup bar -->' +
      '<rect x="20" y="105" width="12" height="24" rx="2" fill="var(--svg-22c55e)" opacity="0.6"/>' +
      '<text x="50" y="121" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-22c55e)" font-weight="600">1 cup (237 mL)</text>' +
      '<!-- 1 ft³ bar -->' +
      '<rect x="240" y="35" width="170" height="24" rx="3" fill="var(--svg-8b5cf6)" opacity="0.6"/>' +
      '<text x="325" y="51" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1 ft³ (7.48 gal / 28.3 L)</text>' +
      '<!-- scale -->' +
      '<line x1="20" y1="140" x2="420" y2="140" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
      '<line x1="20" y1="136" x2="20" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="20" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">0 L</text>' +
      '<line x1="120" y1="136" x2="120" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="120" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">5 L</text>' +
      '<line x1="220" y1="136" x2="220" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="220" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">10 L</text>' +
      '<line x1="420" y1="136" x2="420" y2="144" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="420" y="155" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-94a3b8)" text-anchor="middle">28.3 L</text>' +
      '</svg>',
    alt: 'Visual comparison of 1 liter, 1 US gallon, 1 cup, and 1 cubic foot drawn to scale',
    caption: 'Common volume units compared. The liter is the metric standard; the US gallon, cup, and cubic foot are used in the US.',
  },
  explanation:
    'Volume measurement spans an enormous range — from milliliters in a medicine dropper to cubic kilometers in a reservoir. The liter, defined as 1 cubic decimeter (1,000 cm³), is the everyday metric unit. A cubic meter (1,000 L) is roughly the volume of a washing machine. The US customary system uses gallons (231 cubic inches exactly), quarts (¼ gallon), pints (⅛ gallon), cups (1/16 gallon), fluid ounces (1/128 gallon), and tablespoons/teaspoons for cooking. Importantly, the US gallon (3.785 L) is smaller than the imperial/UK gallon (4.546 L) — a common source of error when following British or Canadian recipes. The cubic foot is used in construction (concrete, lumber), HVAC (airflow), and refrigeration. Engine displacement is commonly stated in liters (modern) or cubic inches (classic American cars). The US food labeling system rounds fluid ounces to exactly 30 mL (not 29.57 mL) for nutritional labels. Understanding these relationships is essential for cooking, automotive work, construction, and international trade.',
  faqs: [
    {
      question: 'What is the difference between US and imperial gallons?',
      answer: 'The US gallon (3.78541 L) is smaller than the imperial gallon (4.54609 L) by about 20%. The imperial gallon is based on the volume of 10 pounds of water at 62°F. The US gallon is based on the volume of 231 cubic inches (the old English wine gallon). This means: 1 US gal ≈ 0.8327 imp gal, and 1 imp gal ≈ 1.201 US gal. When filling a car with fuel in Canada or the UK, a gallon of gas is actually 20% more fuel than a US gallon. This distinction is critical for fuel economy calculations: US MPG is different from Imperial MPG. Many Canadian and UK websites now use L/100 km to avoid confusion.',
    },
    {
      question: 'Why are US food labels different from actual volume measurements?',
      answer: 'US food labeling laws allow rounding: 1 tablespoon = 15 mL (exact: 14.79 mL), 1 cup = 240 mL (exact: 236.59 mL), 1 fluid ounce = 30 mL (exact: 29.57 mL). These rounded values are legally defined in 21 CFR §101.9 for nutrition labels. The rounding makes labeling consistent and simplifies consumer comparisons. However, for scientific or precise cooking, the exact values should be used. This explains why a "cup" in a US recipe might produce slightly different results than a "cup" measured by volume in a lab.',
    },
    {
      question: 'How do I convert between cubic meters and shipping measurements?',
      answer: 'Shipping freight uses CBM (cubic meters) as the standard volume unit. A standard 20 ft shipping container holds about 33 CBM; a 40 ft container holds about 67 CBM. For air freight, dimensional weight is calculated as (L × W × H in cm) ÷ 6000, which converts volume to chargeable weight in kg. For sea freight, the factor is 1 CBM = 1,000 kg for LCL (less than container load) shipments. Understanding these relationships helps estimate shipping costs and container fit.',
    },
    {
      question: 'What is engine displacement and how is it measured?',
      answer: 'Engine displacement is the total swept volume of all pistons in an engine, measured in liters (L) or cubic inches (in³). A 5.0 L engine has a total cylinder volume of 5,000 cm³. Classic American engines were measured in cubic inches (e.g., 350 in³ ≈ 5.7 L). To convert: divide in³ by 61.024 to get L, or multiply L by 61.024 to get in³. Engine displacement affects power output and fuel consumption. Modern cars range from 1.0 L (small economy cars) to 6.2 L or more (performance vehicles).',
    },
  ],
  citations: [
    { source: 'NIST - SI Volume', url: 'https://www.nist.gov/pml/owm/si-units-volume' },
    { source: 'FDA - Food Labeling', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?fr=101.9' },
  ],
};

const converterConfig = createConverter({ units: UNITS, defaultFrom: 'l', defaultTo: 'gal', educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Volume Conversion' });
  },
};
export default configWithPanel;
