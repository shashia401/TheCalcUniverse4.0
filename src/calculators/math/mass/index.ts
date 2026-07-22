import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MassPanel from './MassPanel';

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

const PLANET_GRAVITY: Record<string, number> = {
  Earth: 9.81,
  Moon: 1.62,
  Mars: 3.71,
  Jupiter: 24.79,
};

const fmt = (n: number): string => {
  if (!isFinite(n)) return 'Infinity';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toFixed(8)).toString();
};

const massConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Solve for',
      type: 'select',
      required: true,
      options: [
        { label: 'Mass (m)', value: 'calcMass' },
        { label: 'Density (ρ)', value: 'calcDensity' },
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
      showWhen: (v) => v.mode === 'calcMass' || v.mode === 'calcDensity',
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
      showWhen: (v) => v.mode === 'calcMass' || v.mode === 'calcDensity',
      helpText: 'Select the unit of volume',
    },
    {
      id: 'density',
      label: 'Density',
      type: 'number',
      placeholder: 'e.g. 1000',
      step: 0.1,
      required: true,
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
    const mode = values.mode || 'calcMass';

    const buildPlanetWeights = (mKg: number) => {
      const entries: Array<{ id: string; label: string; value: string; color: 'neutral'; }> = [];
      const planets = ['Earth', 'Moon', 'Mars', 'Jupiter'] as const;
      for (const p of planets) {
        const w = mKg * PLANET_GRAVITY[p];
        entries.push({
          id: `weight${p}`,
          label: `Weight on ${p}`,
          value: `${fmt(w)} N`,
          color: 'neutral' as const,
        });
      }
      return entries;
    };

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
        { id: 'massG', label: 'Mass (g)', value: `${fmt(massG)} g`, color: 'neutral' as const },
        { id: 'massLb', label: 'Mass (lb)', value: `${fmt(massLb)} lb`, color: 'neutral' as const },
        { id: 'formula', label: 'Formula', value: 'm = ρ × V', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `m = ${fmt(densityKgm3)} kg/m³ × ${fmt(volM3)} m³ = ${fmt(massKg)} kg`,
          color: 'neutral' as const,
        },
        ...buildPlanetWeights(massKg),
      ];
    }

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
        { id: 'densityGcm3', label: 'Density (g/cm³)', value: `${fmt(densityGcm3)} g/cm³`, color: 'neutral' as const },
        { id: 'densityLbsft3', label: 'Density (lbs/ft³)', value: `${fmt(densityLbsft3)} lbs/ft³`, color: 'neutral' as const },
        { id: 'formula', label: 'Formula', value: 'ρ = m / V', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `ρ = ${fmt(massKg)} kg ÷ ${fmt(volM3)} m³ = ${fmt(densityKgm3)} kg/m³`,
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
        { id: 'volumeL', label: 'Volume (L)', value: `${fmt(volL)} L`, color: 'neutral' as const },
        { id: 'volumeMl', label: 'Volume (mL)', value: `${fmt(volMl)} mL`, color: 'neutral' as const },
        { id: 'volumeFt3', label: 'Volume (ft³)', value: `${fmt(volFt3)} ft³`, color: 'neutral' as const },
        { id: 'formula', label: 'Formula', value: 'V = m / ρ', color: 'neutral' as const },
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
    return createElement(MassPanel, { values, results });
  },
  educational: {
    formula: 'm = ρ × V  |  ρ = m / V  |  V = m / ρ',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="40" y="25" width="240" height="140" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="48" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13" font-weight="bold">Mass &amp; Weight</text><line x1="100" y1="65" x2="220" y2="65" stroke="var(--svg-3b82f6)" stroke-width="2"/><circle cx="100" cy="65" r="4" fill="var(--svg-3b82f6)"/><circle cx="220" cy="65" r="4" fill="var(--svg-3b82f6)"/><line x1="100" y1="65" x2="160" y2="105" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="220" y1="65" x2="160" y2="105" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="100" y="55" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">m</text><text x="220" y="55" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">W</text><text x="160" y="100" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Mass</text><text x="160" y="130" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">m = rho x V</text><text x="160" y="150" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Weight = m x g (gravity)</text></svg>',
      alt: 'Mass and weight balance diagram showing mass on one side and weight on the other',
      caption: 'Mass is constant; weight changes with gravity: W = m x g',
    },
    formulaDescription:
      'Mass is the amount of matter in an object, calculated from density and volume using the formula m = ρ × V. The formula triangle shows the relationship between mass, density, and volume.',
    variables: [
      { symbol: 'm', name: 'Mass', description: 'The amount of matter in the object, measured in kg, g, or lb.' },
      { symbol: 'ρ', name: 'Density', description: 'Mass per unit volume of the material.' },
      { symbol: 'V', name: 'Volume', description: 'The space occupied by the object.' },
    ],
    howToUse: [
      'Select what you want to solve for: Mass, Density, or Volume.',
      'Fill in the two known values along with their units.',
      'View the calculated mass plus equivalent weight on Earth, Moon, Mars, and Jupiter.',
    ],
    explanation:
      'Mass is a fundamental property of matter that remains constant regardless of location. Your mass on Earth is the same as your mass on the Moon — but your weight changes because gravity differs. Weight = mass × gravitational acceleration. This calculator computes mass from density and volume, then shows what that mass would weigh on different celestial bodies. Practical example: a steel beam with volume 0.5 m³ has a density of 7,850 kg/m³ (typical steel). The mass is 7,850 × 0.5 = 3,925 kg. On Earth, this beam weighs 3,925 × 9.81 = 38,504 N (about 8,655 lbs). On the Moon, the same beam weighs 3,925 × 1.62 = 6,359 N (about 1,430 lbs). If you are told a concrete block has a mass of 2,400 kg and occupies 1 m³, the density is 2,400 / 1 = 2,400 kg/m³ — which is exactly the expected density of standard concrete (about 2,400 kg/m³ or 150 lbs/ft³). Edge cases: for very light materials like aerogels (density as low as 1 kg/m³), the mass per volume is extremely small — a 1 m³ block of aerogel might weigh only 1-10 kg. For neutron star material, density is approximately 10¹⁷ kg/m³, meaning a teaspoon (5 mL) would have a mass of about 500 billion kg. For practical engineering calculations, remember that density values are temperature-dependent: water at 20°C has a density of 998 kg/m³, while at 4°C it is 1,000 kg/m³. For composite materials, the effective density is the weighted average of the component densities based on volume fraction.',
    faqs: [
      {
        question: 'What is the difference between mass and weight?',
        answer: 'Mass is the amount of matter in an object and stays the same everywhere. Weight is the force of gravity on that mass and changes depending on location. Weight = mass × gravitational acceleration (W = mg). On the Moon, you would weigh about 1/6 of your Earth weight, but your mass would be unchanged.',
      },
      {
        question: 'How is mass calculated from density and volume?',
        answer: 'Mass equals density times volume: m = ρ × V. For example, if a substance has a density of 1000 kg/m³ (like water) and occupies 2 m³, the mass is 2000 kg. This relationship is fundamental in physics, engineering, and materials science.',
      },
      {
        question: 'What are typical densities of common materials?',
        answer: 'Water: 1000 kg/m³ (1 g/cm³), Aluminum: 2700 kg/m³, Steel: 7850 kg/m³, Gold: 19300 kg/m³, Air at sea level: 1.225 kg/m³, Wood (oak): ~750 kg/m³.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Mass', url: 'https://en.wikipedia.org/wiki/Mass' },
      { source: 'Wolfram MathWorld', title: 'Mass', url: 'https://mathworld.wolfram.com/Mass.html' },
    ],
  },
};

export default massConfig;
