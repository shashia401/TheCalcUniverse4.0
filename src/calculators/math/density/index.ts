import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DensityPanel from './DensityPanel';

const massToKg = (v: number, u: string): number => {
  switch (u) {
    case 'g': return v / 1000;
    case 'kg': return v;
    case 'lb': return v * 0.45359237;
    default: return v;
  }
};

const volumeToM3 = (v: number, u: string): number => {
  switch (u) {
    case 'mL': return v / 1e6;
    case 'L': return v / 1000;
    case 'cm3': return v / 1e6;
    case 'm3': return v;
    case 'ft3': return v * 0.0283168;
    default: return v;
  }
};

const densityToKgm3 = (v: number, u: string): number => {
  switch (u) {
    case 'g/cm3': return v * 1000;
    case 'kg/m3': return v;
    case 'lbs/ft3': return v * 16.0185;
    default: return v;
  }
};

const fmt = (n: number): string => {
  if (!isFinite(n)) return 'Infinity';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toFixed(8)).toString();
};

const densityConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Solve for',
      type: 'select',
      required: true,
      options: [
        { label: 'Density (ρ)', value: 'calcDensity' },
        { label: 'Mass (m)', value: 'calcMass' },
        { label: 'Volume (V)', value: 'calcVolume' },
      ],
      helpText: 'Select which value you want to calculate',
    },
    {
      id: 'mass',
      label: 'Mass',
      type: 'number',
      placeholder: 'e.g. 10',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      showWhen: (v) => v.mode === 'calcDensity' || v.mode === 'calcVolume',
      helpText: 'Enter the mass of the object',
    },
    {
      id: 'massUnit',
      label: 'Mass Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'g', value: 'g' },
        { label: 'kg', value: 'kg' },
        { label: 'lb', value: 'lb' },
      ],
      showWhen: (v) => v.mode === 'calcDensity' || v.mode === 'calcVolume',
      helpText: 'Select the unit of mass',
    },
    {
      id: 'volume',
      label: 'Volume',
      type: 'number',
      placeholder: 'e.g. 5',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      showWhen: (v) => v.mode === 'calcDensity' || v.mode === 'calcMass',
      helpText: 'Enter the volume of the object',
    },
    {
      id: 'volumeUnit',
      label: 'Volume Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'mL', value: 'mL' },
        { label: 'L', value: 'L' },
        { label: 'cm3', value: 'cm3' },
        { label: 'm3', value: 'm3' },
        { label: 'ft3', value: 'ft3' },
      ],
      showWhen: (v) => v.mode === 'calcDensity' || v.mode === 'calcMass',
      helpText: 'Select the unit of volume',
    },
    {
      id: 'density',
      label: 'Density',
      type: 'number',
      placeholder: 'e.g. 1000',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      showWhen: (v) => v.mode === 'calcMass' || v.mode === 'calcVolume',
      helpText: 'Enter the density of the material',
    },
    {
      id: 'densityUnit',
      label: 'Density Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'g/cm3', value: 'g/cm3' },
        { label: 'kg/m3', value: 'kg/m3' },
        { label: 'lbs/ft3', value: 'lbs/ft3' },
      ],
      showWhen: (v) => v.mode === 'calcMass' || v.mode === 'calcVolume',
      helpText: 'Select the unit of density',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'calcDensity';

    if (mode === 'calcDensity') {
      const mass = parseFloat(values.mass);
      const volume = parseFloat(values.volume);
      if (isNaN(mass) || isNaN(volume) || volume === 0) return [];

      const massKg = massToKg(mass, values.massUnit || 'kg');
      const volM3 = volumeToM3(volume, values.volumeUnit || 'm3');
      const densityKgm3 = massKg / volM3;
      const densityGcm3 = densityKgm3 / 1000;
      const densityLbsft3 = densityKgm3 / 16.0185;

      return [
        {
          id: 'result',
          label: 'Density (ρ)',
          value: `${fmt(densityKgm3)} kg/m³`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'densityGcm3',
          label: 'Density (g/cm³)',
          value: `${fmt(densityGcm3)} g/cm³`,
          color: 'neutral' as const,
        },
        {
          id: 'densityLbsft3',
          label: 'Density (lbs/ft³)',
          value: `${fmt(densityLbsft3)} lbs/ft³`,
          color: 'neutral' as const,
        },
        {
          id: 'formula',
          label: 'Formula',
          value: 'ρ = m / V',
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `ρ = ${fmt(massKg)} kg ÷ ${fmt(volM3)} m³ = ${fmt(densityKgm3)} kg/m³`,
          color: 'neutral' as const,
        },
      ];
    }

    if (mode === 'calcMass') {
      const density = parseFloat(values.density);
      const volume = parseFloat(values.volume);
      if (isNaN(density) || isNaN(volume)) return [];

      const densityKgm3 = densityToKgm3(density, values.densityUnit || 'kg/m3');
      const volM3 = volumeToM3(volume, values.volumeUnit || 'm3');
      const massKg = densityKgm3 * volM3;
      const massG = massKg * 1000;
      const massLb = massKg / 0.45359237;

      return [
        {
          id: 'result',
          label: 'Mass (m)',
          value: `${fmt(massKg)} kg`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'massG',
          label: 'Mass (g)',
          value: `${fmt(massG)} g`,
          color: 'neutral' as const,
        },
        {
          id: 'massLb',
          label: 'Mass (lb)',
          value: `${fmt(massLb)} lb`,
          color: 'neutral' as const,
        },
        {
          id: 'formula',
          label: 'Formula',
          value: 'm = ρ × V',
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `m = ${fmt(densityKgm3)} kg/m³ × ${fmt(volM3)} m³ = ${fmt(massKg)} kg`,
          color: 'neutral' as const,
        },
      ];
    }

    if (mode === 'calcVolume') {
      const mass = parseFloat(values.mass);
      const density = parseFloat(values.density);
      if (isNaN(mass) || isNaN(density) || density === 0) return [];

      const massKg = massToKg(mass, values.massUnit || 'kg');
      const densityKgm3 = densityToKgm3(density, values.densityUnit || 'kg/m3');
      const volM3 = massKg / densityKgm3;
      const volL = volM3 * 1000;
      const volMl = volM3 * 1e6;
      const volFt3 = volM3 / 0.0283168;

      return [
        {
          id: 'result',
          label: 'Volume (V)',
          value: `${fmt(volM3)} m³`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'volumeL',
          label: 'Volume (L)',
          value: `${fmt(volL)} L`,
          color: 'neutral' as const,
        },
        {
          id: 'volumeMl',
          label: 'Volume (mL)',
          value: `${fmt(volMl)} mL`,
          color: 'neutral' as const,
        },
        {
          id: 'volumeFt3',
          label: 'Volume (ft³)',
          value: `${fmt(volFt3)} ft³`,
          color: 'neutral' as const,
        },
        {
          id: 'formula',
          label: 'Formula',
          value: 'V = m / ρ',
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `V = ${fmt(massKg)} kg ÷ ${fmt(densityKgm3)} kg/m³ = ${fmt(volM3)} m³`,
          color: 'neutral' as const,
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DensityPanel, { values, results });
  },
  educational: {
    formula: 'ρ = m / V  |  m = ρ × V  |  V = m / ρ',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><polygon points="160,25 55,175 265,175" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linejoin="round"/><line x1="160" y1="25" x2="160" y2="175" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="5,3"/><line x1="55" y1="175" x2="265" y2="175" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="75" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="28" font-weight="bold">&#x3C1;</text><text x="108" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="24" font-weight="bold">m</text><text x="212" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="24" font-weight="bold">V</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="10">Cover the unknown to get the formula</text></svg>',
      alt: 'Density formula triangle showing rho at top, m and V at bottom',
      caption: 'Density formula triangle: cover the unknown variable and the remaining arrangement gives the formula.',
    },
    formulaDescription:
      'Density (ρ) is mass per unit volume. The density formula triangle shows the relationship between mass (m), density (ρ), and volume (V). Cover the variable you want to solve for and the remaining arrangement gives the formula. For example, covering ρ leaves m over V, meaning ρ = m/V. Covering m leaves ρ × V, and covering V leaves m/ρ.',
    variables: [
      { symbol: 'ρ (rho)', name: 'Density', description: 'Mass per unit volume of a substance. Measured in g/cm³, kg/m³, or lbs/ft³. A material property that determines whether an object will sink or float in a given fluid.' },
      { symbol: 'm', name: 'Mass', description: 'The amount of matter in the object, measured in grams (g), kilograms (kg), or pounds (lb). Mass is constant regardless of location — unlike weight, which changes with gravity.' },
      { symbol: 'V', name: 'Volume', description: 'The three-dimensional space occupied by the object. Measured in mL, L, cm³, m³, or ft³. For regular shapes, volume can be calculated from dimensions (e.g., V = length × width × height for a rectangular prism).' },
    ],
    howToUse: [
      'Select what you want to solve for: Density, Mass, or Volume using the dropdown at the top.',
      'Fill in the two known values along with their units — the calculator auto-converts between g, kg, lb for mass and mL, L, cm³, m³, ft³ for volume.',
      'The calculator instantly solves for the third value, displaying results in all three density units (g/cm³, kg/m³, lbs/ft³) for easy comparison.',
      'Review the step-by-step calculation to understand how unit conversions and the formula were applied.',
    ],
    explanation:
      'Density is a fundamental physical property that describes how much mass is packed into a given volume. Pure water has a density of approximately 1 g/cm³ (1000 kg/m³) at 4°C — this is the reference standard. Different materials have characteristic densities: gold is about 19.3 g/cm³, aluminum is 2.7 g/cm³, and air at sea level is about 0.0012 g/cm³. The formula triangle is a helpful mnemonic: cover the variable you want, and the remaining two show the operation needed. Practical example: a block of aluminum measuring 10 cm × 10 cm × 10 cm has a volume of 1,000 cm³. If its mass is 2,700 g, the density is 2,700 / 1,000 = 2.7 g/cm³, which matches the known density of aluminum. This principle is used to verify material authenticity — if a "gold" bar has density closer to 7.8 g/cm³ (steel) than 19.3 g/cm³ (gold), it is counterfeit. Density changes with temperature for most materials — substances expand when heated (lower density) and contract when cooled (higher density). Water is a notable exception: its maximum density occurs at 4°C (1.000 g/cm³), and ice at 0°C has a density of 0.917 g/cm³, which is why ice floats and why lakes freeze from the top down — a property essential for aquatic life survival in winter. For gases, density depends heavily on both temperature and pressure, requiring the ideal gas law (PV = nRT) for accurate calculations at varying conditions.',
    quickReference: [
      { label: 'Water at 4°C', value: '1.000 g/cm³ = 1,000 kg/m³' },
      { label: 'Ice at 0°C', value: '0.917 g/cm³ = 917 kg/m³' },
      { label: 'Gold (24K pure)', value: '19.3 g/cm³ = 19,300 kg/m³' },
      { label: 'Aluminum', value: '2.70 g/cm³ = 2,700 kg/m³' },
      { label: 'Iron / Steel', value: '7.87 g/cm³ = 7,870 kg/m³' },
      { label: 'Air at sea level (20°C)', value: '0.00120 g/cm³ = 1.20 kg/m³' },
      { label: 'Seawater', value: '1.025 g/cm³ = 1,025 kg/m³' },
      { label: 'Mercury', value: '13.53 g/cm³ = 13,530 kg/m³' },
    ],
    commonUses: [
      'Material identification and authenticity verification — measuring an object\'s density to determine what it is made of or whether it is genuine (gold vs. gold-plated tungsten, pure silver vs. sterling, gemstones vs. glass imitations).',
      'Engineering and construction — calculating the mass of structural materials (steel beams, concrete slabs, aluminum panels) from their dimensions and known material density for load calculations, shipping logistics, and cost estimation.',
      'Buoyancy and flotation analysis — determining whether an object will sink or float in water or other fluids. Any object with density less than the fluid\'s density will float (ships, life jackets, buoys), which is the principle behind Archimedes\' principle.',
      'Quality control in manufacturing — ensuring product consistency by measuring density of raw materials (plastic pellets, metal powders, ceramic slurries) to detect variations in composition, porosity, or contamination before production.',
      'Geology and mining — identifying mineral samples by density comparison, estimating ore body mass from volume surveys, and separating valuable minerals from waste rock using density-based techniques like heavy media separation.',
    ],
    workedExamples: [
      {
        scenario: 'Raj, a jewelry appraiser, has a yellow metal bar that a client claims is solid gold. The bar measures 5 cm × 3 cm × 2 cm and has a mass of 579 g. He needs to determine whether it is truly gold or a gold-plated fake (likely tungsten, which has a density of 19.25 g/cm³ — very close to gold).',
        inputs: { mode: 'calcDensity', mass: '579', massUnit: 'g', volume: '30', volumeUnit: 'cm3' },
        result: '19300 kg/m³',
        insight: 'Volume = 5 × 3 × 2 = 30 cm³. Density ρ = 579 g / 30 cm³ = 19.3 g/cm³. This matches pure gold (19.3 g/cm³) almost perfectly. If the bar were gold-plated tungsten, the density would be closer to 19.25 g/cm³ — the difference is only 0.05 g/cm³, which is within measurement error for consumer-grade scales and calipers. Raj should use a more precise test: ultrasound thickness gauging, X-ray fluorescence (XRF) spectrometry, or electrical conductivity testing. Density alone cannot distinguish gold from tungsten-gold alloys with matching density because counterfeiters intentionally match gold\'s density. However, if the density came back as 7.8 g/cm³ (steel) or 8.9 g/cm³ (brass), Raj could confidently reject the bar as a fake.',
      },
      {
        scenario: 'Fatima, a logistics coordinator, needs to ship a solid steel machine component. The component is a rectangular block measuring 1.2 m × 0.8 m × 0.5 m. The shipping company charges by weight, and she needs to calculate the mass to estimate freight costs. Steel density is 7,870 kg/m³.',
        inputs: { mode: 'calcMass', density: '7870', densityUnit: 'kg/m3', volume: '0.48', volumeUnit: 'm3' },
        result: '3777.6 kg',
        insight: 'Volume = 1.2 × 0.8 × 0.5 = 0.48 m³. Mass m = 7,870 kg/m³ × 0.48 m³ = 3,777.6 kg ≈ 3.78 metric tons. The calculator also shows this as 3,777,600 g and 8,328 lb. Fatima needs a freight service rated for at least 4 tons. She should also consider: the steel block will need a pallet or crate (add ~50 kg for packaging), forklift accessibility (the block\'s footprint is 1.2 × 0.8 m), and floor loading limits on the truck and at the destination warehouse. At typical freight rates of $0.15-$0.30 per kg for domestic shipping, transport will cost approximately $570-$1,130. International shipping would be significantly more.',
      },
      {
        scenario: 'Dr. Okonkwo, a chemistry lab instructor, prepares a solution by dissolving 58.44 g of sodium chloride (table salt, NaCl) in enough water to make exactly 500 mL of solution. The resulting solution has a density of 1.07 g/cm³. She needs to find the volume occupied by just the dissolved salt to understand solution density effects.',
        inputs: { mode: 'calcVolume', mass: '58.44', massUnit: 'g', density: '2.165', densityUnit: 'g/cm3' },
        result: '0.00002699 m³',
        insight: 'Pure crystalline NaCl has a density of 2.165 g/cm³. The volume of just the salt crystals: V = 58.44 g / 2.165 g/cm³ = 26.98 cm³ ≈ 27 mL. The solution\'s final volume is 500 mL, but the salt only occupies about 27 mL of that — the rest is water. The solution density (1.07 g/cm³) is higher than pure water (1.00 g/cm³) because the dissolved salt ions add mass without proportionally increasing volume (the ions fit into gaps between water molecules). This is a key concept in solution chemistry: dissolution is not just mixing — the solute particles interact with solvent molecules at the molecular level, changing the solution\'s properties in ways that simple volume addition cannot predict.',
      },
    ],
    proTips: [
      'Use the density formula triangle as a visual shortcut: cover the variable you want to solve for, and the remaining two show the operation. Cover ρ to get mass/volume (m/V), cover m to get ρ × V, and cover V to get m/ρ.',
      'Water at 4°C has a density of exactly 1 g/cm³ — use this as your reference point. Any material denser than water sinks, and any material less dense floats. This is the simplest density check: if it sinks in water, its density is > 1 g/cm³.',
      'When measuring irregular objects, use the water displacement method (Archimedes\' principle): submerge the object in a graduated cylinder and measure the water level change. Then weigh the object to get mass, and calculate density. This is how Archimedes detected the counterfeit gold crown over 2,200 years ago.',
      'For alloys and mixtures, density is not a simple average of component densities. The actual density depends on the atomic packing structure, which can change with composition. Brass (copper-zinc alloy) can range from 8.4 to 8.7 g/cm³ depending on the zinc percentage.',
      'Temperature affects density measurements. Always note the temperature when recording density, especially for liquids and gases. Water\'s density changes by about 0.0002 g/cm³ per degree Celsius near room temperature — small but significant for precision work.',
      'When calculating shipping mass from density, always add 10-15% margin for packaging materials (pallets, crates, wrapping) which add to the total shipping weight beyond the product\'s calculated mass.',
    ],
    limitations: [
      'Homogeneous material assumption: This calculator assumes uniform, homogeneous materials with constant density throughout the object. For composite materials, layered structures, or objects with internal voids, the calculated result represents average density rather than the density of any specific component. Powder and granular material "bulk density" (including air gaps between particles) differs substantially from the true material density — flour has a bulk density of about 0.5-0.6 g/cm³ versus a true particle density of about 1.5 g/cm³.',
      'Temperature and gas density limitations: Temperature and pressure significantly affect density, especially for gases — this calculator does not adjust for these environmental factors. For gas density calculations, use the ideal gas law (PV = nRT) or real gas equations at high pressures.',
      'Unit support limitations: The calculator provides conversion between g/cm³, kg/m³, and lbs/ft³, which covers most common applications; other units like oz/in³ or (short) ton/yd³ require manual conversion. Mass unit support is limited to g, kg, and lb — scientific applications requiring atomic mass units (amu), slugs, or troy ounces are not supported.',
      'When not to use this calculator: Do not use for two-phase flows (liquid-gas mixtures), relativistic mass-energy calculations, quantum-scale particle densities, or astrophysical densities where general relativistic effects are significant.',
    ],
    faqs: [
      {
        question: 'What is the density of water?',
        answer: 'Pure water has a density of approximately 1 g/cm³ at 4°C, which equals 1,000 kg/m³. This is a convenient reference point — materials that sink in water have density greater than 1 g/cm³, while those that float have density less than 1 g/cm³. Water reaches its maximum density at 4°C (not at freezing). As water cools from 4°C to 0°C, it expands slightly, which is why ice floats and why pipes burst when water freezes inside them.',
      },
      {
        question: 'How do I convert between density units?',
        answer: '1 g/cm³ = 1,000 kg/m³ = 62.43 lbs/ft³. To convert from kg/m³ to g/cm³, divide by 1,000. To convert from kg/m³ to lbs/ft³, divide by 16.0185. This calculator automatically displays results in all three units so you can compare without manual conversion.',
      },
      {
        question: 'Why does ice float on water?',
        answer: 'Ice has a density of about 0.917 g/cm³, which is less than water\'s 1 g/cm³. This is unusual — most substances are denser in their solid state than their liquid state. Water\'s unique property is due to hydrogen bonding: in liquid water, molecules pack relatively closely, but when water freezes, each molecule forms four hydrogen bonds in a tetrahedral arrangement, creating an open hexagonal crystal structure with empty space in the center of each hexagon. This is also why ice expands when freezing (by about 9% in volume), which can burst pipes and crack rocks.',
      },
      {
        question: 'How does temperature affect density?',
        answer: 'For most materials, increasing temperature causes thermal expansion — molecules vibrate more vigorously and occupy more space, decreasing density. Conversely, cooling increases density as molecules pack closer together. For solids and liquids, the effect is relatively small (typically 0.01-0.1% per degree Celsius). For gases, the effect is much larger because gas volume changes proportionally with absolute temperature (Charles\'s Law: V₁/T₁ = V₂/T₂). A gas at 0°C (273 K) heated to 100°C (373 K) expands by about 37%, reducing its density by the same factor. Water is a notable exception to the general rule because it reaches maximum density at 4°C — below this temperature, water actually expands as it approaches freezing, which is why ice floats and lakes freeze from the surface down.',
      },
      {
        question: 'What is specific gravity and how does it relate to density?',
        answer: 'Specific gravity (SG) is the ratio of a substance\'s density to the density of a reference material, usually water at 4°C (1 g/cm³). Since water\'s density is 1 g/cm³, the specific gravity of a material is numerically equal to its density in g/cm³ at the same temperature. For example, gold has a specific gravity of 19.3 (meaning it is 19.3 times denser than water). Specific gravity is dimensionless (no units) because it is a ratio of two densities. Industries that commonly use specific gravity include brewing (original gravity and final gravity of beer wort), petroleum (API gravity for crude oil classification), and battery manufacturing (electrolyte specific gravity indicates charge level). This calculator does not directly output specific gravity, but you can easily compute it: since 1 g/cm³ = SG, the result in g/cm³ is the specific gravity relative to water.',
      },
      {
        question: 'Why do some objects float and others sink?',
        answer: 'Whether an object floats or sinks depends on its density relative to the fluid it is placed in, according to Archimedes\' principle: an object immersed in a fluid experiences an upward buoyant force equal to the weight of the fluid it displaces. If the object\'s density is less than the fluid\'s density, the buoyant force exceeds the object\'s weight and it floats. If the object\'s density is greater, it sinks. If the densities are equal, the object is neutrally buoyant and stays suspended at any depth (submarines achieve this by adjusting ballast). A steel ship floats despite steel being 7.8 times denser than water because the ship\'s hull encloses a large volume of air, making the average density of the entire ship (steel + air) less than 1 g/cm³. This is why a solid steel ball sinks but a hollow steel bowl floats — the shape determines the effective volume and thus the average density.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Density', url: 'https://en.wikipedia.org/wiki/Density' },
      { source: 'NIST - Reference on Constants, Units, and Uncertainty', url: 'https://physics.nist.gov/cuu/Constants/' },
      { source: 'Engineering Toolbox - Material Densities', url: 'https://www.engineeringtoolbox.com/density-solids-d_1265.html' },
    ],
  },
};

export default densityConfig;
