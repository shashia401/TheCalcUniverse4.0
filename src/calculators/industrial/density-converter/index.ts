import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'kgm3', label: 'Kilogram per Cubic Meter (kg/m³)', shortLabel: 'kg/m³', factor: 1 },
  { value: 'gcm3', label: 'Gram per Cubic Centimeter (g/cm³)', shortLabel: 'g/cm³', factor: 1000 },
  { value: 'gml', label: 'Gram per Milliliter (g/mL)', shortLabel: 'g/mL', factor: 1000 },
  { value: 'lbft3', label: 'Pound per Cubic Foot (lb/ft³)', shortLabel: 'lb/ft³', factor: 16.0185 },
  { value: 'lbin3', label: 'Pound per Cubic Inch (lb/in³)', shortLabel: 'lb/in³', factor: 27679.9 },
  { value: 'lbgalus', label: 'Pound per US Gallon (lb/gal)', shortLabel: 'lb/gal (US)', factor: 119.826 },
  { value: 'lbgaluk', label: 'Pound per UK Gallon (lb/gal)', shortLabel: 'lb/gal (UK)', factor: 99.7764 },
  { value: 'ozin3', label: 'Ounce per Cubic Inch (oz/in³)', shortLabel: 'oz/in³', factor: 1729.99 },
  { value: 'ozft3', label: 'Ounce per Cubic Foot (oz/ft³)', shortLabel: 'oz/ft³', factor: 1.00116 },
  { value: 'sg', label: 'Specific Gravity (relative to water at 4°C)', shortLabel: 'SG', factor: 1000 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Density conversion uses linear factors relative to the base SI unit (kg/m³). Density is mass per unit volume. Specific gravity (SG) is a dimensionless ratio of a substance\'s density to the density of water at 4°C (1,000 kg/m³), so SG 1 = 1,000 kg/m³ = 1 g/cm³. For example, converting 1 lb/ft³ to kg/m³: 1 × 16.0185 ÷ 1 = 16.02 kg/m³.',
  variables: [
    { symbol: 'ρ', name: 'Density (rho)', description: 'Mass per unit volume of a substance, typically measured in kg/m³ (SI) or g/cm³ (CGS).' },
    { symbol: '1 kg/m³', name: 'One Kilogram per Cubic Meter', description: 'The SI base unit of density. The density of air at sea level is about 1.225 kg/m³.' },
    { symbol: '1 g/cm³ & SG', name: 'Water Density Reference (g/cm³ & Specific Gravity)', description: '1 g/cm³ = 1,000 kg/m³ = SG 1.0 — the density of water at 4°C (maximum density). A substance with SG > 1 sinks (e.g., gold SG 19.3), SG < 1 floats (e.g., wood SG 0.6).' },
  ],
  howToUse: [
    'Enter the density value you want to convert in the "Value" field.',
    'Select the current density unit from the "From" dropdown.',
    'Select the desired density unit from the "To" dropdown.',
    'The converted value is displayed instantly. Use specific gravity (SG) to compare material density to water.',
    'Use the quick reference table for density values of common materials like water, air, aluminum, and gold.',
  ],
  quickReference: [
    { label: '1 g/cm³', value: '1,000 kg/m³ / SG 1.0' },
    { label: '1 kg/m³', value: '0.001 g/cm³' },
    { label: '1 lb/ft³', value: '16.018 kg/m³' },
    { label: '1 lb/in³', value: '27,680 kg/m³' },
    { label: '1 lb/gal (US)', value: '119.83 kg/m³' },
    { label: 'Water (4°C)', value: '1,000 kg/m³ / SG 1.0 / 62.43 lb/ft³' },
    { label: 'Air (STP)', value: '1.225 kg/m³ / 0.0765 lb/ft³' },
    { label: 'Gold', value: '19,320 kg/m³ / SG 19.32' },
  ],
  commonUses: [
    'Battery acid (lead-acid): SG 1.28 when fully charged',
    'Engine coolant: SG 1.06–1.12 (antifreeze mixture)',
    'Seawater: ~1,025 kg/m³ / SG 1.025',
    'Aluminum vs steel: 2,700 vs 7,800 kg/m³ (steel is ~3× denser)',
    'Urine specific gravity: 1.005–1.030 (clinical diagnostic range)',
    'API gravity (petroleum): API 30° ≈ SG 0.876 (light crude)',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Density = Mass &divide; Volume (&rho; = m &divide; V)</text>' +
      '<rect x="30" y="30" width="140" height="75" rx="6" fill="none" stroke="var(--svg-64748b)" stroke-width="2"/>' +
      '<rect x="34" y="55" width="132" height="46" rx="4" fill="var(--svg-dbeafe)" opacity="0.5"/>' +
      '<text x="100" y="82" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-3b82f6)" text-anchor="middle">Water</text>' +
      '<text x="100" y="93" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-3b82f6)" text-anchor="middle">1.0 g/cm&sup3;</text>' +
      '<rect x="50" y="48" width="30" height="20" rx="2" fill="var(--svg-d97706)"/>' +
      '<text x="65" y="62" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ffffff)" text-anchor="middle">Wood</text>' +
      '<text x="65" y="114" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-475569)" text-anchor="middle">0.7 g/cm&sup3;</text>' +
      '<rect x="115" y="65" width="20" height="25" rx="2" fill="var(--svg-64748b)"/>' +
      '<text x="125" y="82" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ffffff)" text-anchor="middle">Fe</text>' +
      '<text x="125" y="114" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-475569)" text-anchor="middle">7.8 g/cm&sup3;</text>' +
      '<rect x="240" y="40" width="220" height="65" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<text x="350" y="62" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">&rho; = m / V</text>' +
      '<text x="350" y="80" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">SG = density &divide; water density</text>' +
      '<text x="350" y="96" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">SG &lt; 1 floats | SG &gt; 1 sinks</text>' +
      '</svg>',
    alt: 'Beaker diagram with wood floating and steel sinking in water illustrating density differences',
    caption: 'Density determines if an object floats (SG < 1) or sinks (SG > 1) in water',
  },
  explanation:
    'Density is a fundamental material property — how much mass occupies a given volume. It determines whether objects float or sink, affects structural weight calculations, and is essential for fluid dynamics, material selection, and quality control in manufacturing. Water at 4°C (its maximum density) has a density of exactly 1 g/cm³, 1,000 kg/m³, or SG 1.0. This is the reference point for specific gravity — gold is 19.3 times denser than water (SG 19.3), meaning a gold bar the size of a water bottle weighs as much as 19 water bottles. Air has a density of about 1.225 kg/m³ at sea level (1/815th the density of water). This large difference explains why sound travels faster in water than in air. Density varies with temperature and pressure — hot air rises because it is less dense, and cold water sinks because it is denser. Material density determines practical applications: aluminum (2.7 g/cm³) is used in aircraft because it is light, tungsten (19.3 g/cm³) in radiation shielding because it is dense.',
  faqs: [
    {
      question: 'What is the difference between density and specific gravity?',
      answer: 'Density is an absolute measurement with units (kg/m³, g/cm³). Specific gravity (SG) is a dimensionless ratio — the density of a substance divided by the density of water at 4°C (1,000 kg/m³). SG tells you immediately whether something floats: SG < 1 floats (wood, oil), SG > 1 sinks (metal, stone). The numerical value of SG is the same as density in g/cm³: water SG = 1.0, aluminum SG = 2.7, gold SG = 19.3. To convert SG to kg/m³: multiply by 1,000.',
    },
    {
      question: 'How does temperature affect density?',
      answer: 'Most substances expand when heated, so density decreases as temperature rises. Water is unusual — it reaches maximum density at 4°C, then becomes less dense as it approaches freezing. This is why ice floats: water at 0°C has density 999.8 kg/m³, while ice has density 917 kg/m³ (about 8% less). This anomaly is why lakes freeze from the surface down, allowing aquatic life to survive winter. For gases, the effect is much larger — air density drops about 0.4% per °C temperature increase.',
    },
    {
      question: 'How do I find the density of a material from its mass and volume?',
      answer: 'Density = mass ÷ volume. To find density: weigh the material (in kg or g), measure its volume (in m³, cm³, or L), then divide. For irregular objects, use water displacement to find volume — submerge the object and measure the volume of water displaced. Examples: A 2 kg brick with volume 1,000 cm³: ρ = 2,000 g ÷ 1,000 cm³ = 2 g/cm³. A 100 g rock displacing 35 mL of water: ρ = 100 ÷ 35 = 2.86 g/cm³.',
    },
    {
      question: 'What are typical densities of common materials?',
      answer: 'Air: 0.001225 g/cm³ (1.225 kg/m³). Wood (balsa): 0.12 g/cm³. Wood (oak): 0.75 g/cm³. Water: 1.0 g/cm³. Plastic (PET): 1.38 g/cm³. Aluminum: 2.7 g/cm³. Titanium: 4.5 g/cm³. Steel: 7.8 g/cm³. Brass: 8.5 g/cm³. Copper: 8.96 g/cm³. Lead: 11.34 g/cm³. Mercury: 13.53 g/cm³. Gold: 19.32 g/cm³. Platinum: 21.45 g/cm³. These values help identify unknown materials and select materials for weight-sensitive applications.',
    },
    {
      question: 'What is the difference between lb/ft³ and lb/in³?',
      answer: 'Pounds per cubic foot (lb/ft³) and pounds per cubic inch (lb/in³) are both imperial density units, but lb/in³ is 1,728 times larger than lb/ft³ (since 1 ft³ = 1,728 in³). Water density: 62.4 lb/ft³ or 0.0361 lb/in³. Steel density: 490 lb/ft³ or 0.284 lb/in³. In engineering, lb/ft³ is more common for bulk materials (concrete, wood, soil), while lb/in³ is used for metals and small precision parts where higher precision is needed.',
    },
  ],

  citations: [
    { source: 'NIST - SI Unit Definitions', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
    { source: 'ISO - Density Standards', url: 'https://www.iso.org/standard/30669.html' },
  ],
};

const converterConfig = createConverter({ units: UNITS, educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Density Conversion' });
  },
};
export default configWithPanel;
