import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import MolarityPanel from './MolarityPanel';

// ─── Compound Database ─────────────────────────────────────────────────────────

const COMPOUND_DB: Record<string, number> = {
  'NaCl': 58.44,
  'HCl': 36.46,
  'H2SO4': 98.08,
  'H₂SO₄': 98.08,
  'NaOH': 40.00,
  'KOH': 56.11,
  'NH3': 17.03,
  'CH3COOH': 60.05,
  'C6H12O6': 180.16,
  'C₆H₁₂O₆': 180.16,
  'C2H5OH': 46.07,
  'CaCO3': 100.09,
  'MgSO4': 120.37,
  'KMnO4': 158.03,
  'H2O2': 34.01,
  'NaHCO3': 84.01,
};

// ─── Subscript Normalization ───────────────────────────────────────────────────

const SUB_TO_NORMAL: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

function normalizeFormula(s: string): string {
  return s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUB_TO_NORMAL[ch] || ch);
}

// ─── Smart Compound Detection ──────────────────────────────────────────────────

function lookupCompound(raw: string): { formula: string; molarMass: number } | null {
  const stripped = raw.trim();
  if (!stripped) return null;

  // Direct lookup first
  const direct = COMPOUND_DB[stripped];
  if (direct !== undefined) return { formula: stripped, molarMass: direct };

  // Try uppercase
  const upper = stripped.toUpperCase();
  const upVal = COMPOUND_DB[upper];
  if (upVal !== undefined) return { formula: upper, molarMass: upVal };

  // Try normalized (subscripts to regular digits)
  const norm = normalizeFormula(stripped);
  const normVal = COMPOUND_DB[norm];
  if (normVal !== undefined) return { formula: norm, molarMass: normVal };

  // Try uppercase normalized
  const upNorm = normalizeFormula(upper);
  const upNormVal = COMPOUND_DB[upNorm];
  if (upNormVal !== undefined) return { formula: upNorm, molarMass: upNormVal };

  return null;
}

// ─── Unit Conversion ───────────────────────────────────────────────────────────

function volumeToLiters(volume: number, unit: string): number {
  switch (unit) {
    case 'mL': return volume / 1000;
    case 'uL': case 'µL': return volume / 1_000_000;
    default: return volume; // L
  }
}

// ─── Number Validation ─────────────────────────────────────────────────────────

function parseNum(s: string | undefined): number | null {
  if (s === undefined || s === '') return null;
  const n = parseFloat(s);
  return isNaN(n) || n < 0 ? null : n;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const molarityConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      options: [
        { label: 'Molarity (from mass & volume)', value: 'calcMolarity' },
        { label: 'Mass (from molarity & volume)', value: 'calcMass' },
        { label: 'Volume (from mass & molarity)', value: 'calcVolume' },
      ],
      helpText: 'Select what you want to calculate',
    },
    {
      id: 'compound',
      label: 'Compound (optional)',
      type: 'text',
      placeholder: 'e.g., NaCl or H2SO4',
      defaultValue: 'NaCl',
      helpText: 'Auto-fills molar mass when a known compound is entered. Try NaCl (58.44 g/mol), H2SO4 (98.08 g/mol), or C6H12O6 (180.16 g/mol).',
    },
    {
      id: 'mass',
      label: 'Mass of Solute (g)',
      type: 'number',
      placeholder: 'e.g., 5.84',
      defaultValue: '5.84',
      showWhen: (v) => v.mode === 'calcMolarity' || v.mode === 'calcVolume',
      inputMode: 'decimal',
      helpText: 'Enter the mass of the solute in grams',
    },
    {
      id: 'volume',
      label: 'Volume of Solution',
      type: 'number',
      placeholder: 'e.g., 1',
      defaultValue: '1',
      showWhen: (v) => v.mode === 'calcMolarity' || v.mode === 'calcMass',
      inputMode: 'decimal',
      helpText: 'Enter the volume of the solution',
    },
    {
      id: 'volumeUnit',
      label: 'Volume Unit',
      type: 'select',
      options: [
        { label: 'Liters (L)', value: 'L' },
        { label: 'Milliliters (mL)', value: 'mL' },
        { label: 'Microliters (µL)', value: 'µL' },
      ],
      helpText: 'Select the unit of volume for the solution',
    },
    {
      id: 'molarity',
      label: 'Molarity (mol/L)',
      type: 'number',
      placeholder: 'e.g., 0.1',
      defaultValue: '0.1',
      showWhen: (v) => v.mode === 'calcMass' || v.mode === 'calcVolume',
      inputMode: 'decimal',
      helpText: 'Enter the molarity concentration in mol/L',
    },
    {
      id: 'molarMass',
      label: 'Molar Mass (g/mol)',
      type: 'number',
      placeholder: 'e.g., 58.44 for NaCl',
      defaultValue: '58.44',
      inputMode: 'decimal',
      helpText: 'Enter the molar mass in g/mol or use the compound lookup',
    },
  ],

  calculate: (values): CalculatorResult[] => {
    const mode = values.mode || 'calcMolarity';

    // Auto-detect compound
    const compoundRaw = values.compound || '';
    const found = compoundRaw ? lookupCompound(compoundRaw) : null;
    const autoFilledMass = found ? found.molarMass : null;

    // Parse inputs — use auto-filled molar mass if user didn't provide one
    const userMolarMass = parseNum(values.molarMass);
    const molarMass = userMolarMass !== null ? userMolarMass : autoFilledMass;

    const mass = parseNum(values.mass);
    const volumeRaw = parseNum(values.volume);
    const volumeUnit = values.volumeUnit || 'L';
    const volume = volumeRaw !== null ? volumeToLiters(volumeRaw, volumeUnit) : null;

    const molarityRaw = parseNum(values.molarity);

    // ── Mode: calcMolarity (find molarity from mass & volume) ──────────
    if (mode === 'calcMolarity') {
      if (mass === null || volume === null || molarMass === null || volume === 0) return [];
      if (molarMass <= 0 || volume <= 0) return [];
      const moles = mass / molarMass;
      const M = moles / volume;

      const results: CalculatorResult[] = [
        { id: 'molarityResult', label: 'Molarity (M)', value: M.toFixed(4), unit: 'mol/L', highlight: true, color: 'positive' },
        { id: 'moles', label: 'Moles of Solute', value: moles.toFixed(6), unit: 'mol' },
        { id: 'massUsed', label: 'Mass of Solute', value: mass.toFixed(4), unit: 'g' },
        { id: 'volumeUsed', label: 'Volume of Solution', value: (volume >= 1 ? volume.toFixed(3) : volume.toFixed(6)), unit: 'L' },
        { id: 'molarMassUsed', label: 'Molar Mass', value: molarMass.toFixed(4), unit: 'g/mol' },
        { id: 'formulaUsed', label: 'Formula Used', value: 'M = n / V = (m / MM) / V' },
        { id: 'stepByStep', label: 'Step-by-Step', value: JSON.stringify([
          `n = m / MM = ${mass.toFixed(4)} g / ${molarMass.toFixed(4)} g/mol = ${moles.toFixed(6)} mol`,
          `M = n / V = ${moles.toFixed(6)} mol / ${volume.toFixed(6)} L = ${M.toFixed(4)} mol/L`,
        ]) },
        { id: 'compoundSource', label: 'Compound Source', value: found ? `"${found.formula}" (MM = ${found.molarMass} g/mol)` : '' },
      ];

      return results;
    }

    // ── Mode: calcMass (find mass from molarity & volume) ──────────────
    if (mode === 'calcMass') {
      if (molarityRaw === null || volume === null || molarMass === null || volume === 0) return [];
      if (molarMass <= 0 || molarityRaw <= 0 || volume <= 0) return [];
      const moles = molarityRaw * volume;
      const massCalc = moles * molarMass;

      const results: CalculatorResult[] = [
        { id: 'massResult', label: 'Mass of Solute', value: massCalc.toFixed(4), unit: 'g', highlight: true, color: 'positive' },
        { id: 'moles', label: 'Moles of Solute', value: moles.toFixed(6), unit: 'mol' },
        { id: 'molarityUsed', label: 'Molarity', value: molarityRaw.toFixed(4), unit: 'mol/L' },
        { id: 'volumeUsed', label: 'Volume of Solution', value: (volume >= 1 ? volume.toFixed(3) : volume.toFixed(6)), unit: 'L' },
        { id: 'molarMassUsed', label: 'Molar Mass', value: molarMass.toFixed(4), unit: 'g/mol' },
        { id: 'formulaUsed', label: 'Formula Used', value: 'm = M × V × MM' },
        { id: 'stepByStep', label: 'Step-by-Step', value: JSON.stringify([
          `n = M × V = ${molarityRaw.toFixed(4)} mol/L × ${volume.toFixed(6)} L = ${moles.toFixed(6)} mol`,
          `m = n × MM = ${moles.toFixed(6)} mol × ${molarMass.toFixed(4)} g/mol = ${massCalc.toFixed(4)} g`,
        ]) },
        { id: 'compoundSource', label: 'Compound Source', value: found ? `"${found.formula}" (MM = ${found.molarMass} g/mol)` : '' },
      ];

      return results;
    }

    // ── Mode: calcVolume (find volume from mass & molarity) ────────────
    if (mode === 'calcVolume') {
      if (mass === null || molarityRaw === null || molarMass === null || molarityRaw === 0) return [];
      if (molarMass <= 0 || molarityRaw <= 0 || mass <= 0) return [];
      const moles = mass / molarMass;
      const volumeCalc = moles / molarityRaw;

      const results: CalculatorResult[] = [
        { id: 'volumeResult', label: 'Volume of Solution', value: (volumeCalc >= 1 ? volumeCalc.toFixed(3) : volumeCalc.toFixed(6)), unit: 'L', highlight: true, color: 'positive' },
        { id: 'moles', label: 'Moles of Solute', value: moles.toFixed(6), unit: 'mol' },
        { id: 'massUsed', label: 'Mass of Solute', value: mass.toFixed(4), unit: 'g' },
        { id: 'molarityUsed', label: 'Molarity', value: molarityRaw.toFixed(4), unit: 'mol/L' },
        { id: 'molarMassUsed', label: 'Molar Mass', value: molarMass.toFixed(4), unit: 'g/mol' },
        { id: 'formulaUsed', label: 'Formula Used', value: 'V = n / M = (m / MM) / M' },
        { id: 'stepByStep', label: 'Step-by-Step', value: JSON.stringify([
          `n = m / MM = ${mass.toFixed(4)} g / ${molarMass.toFixed(4)} g/mol = ${moles.toFixed(6)} mol`,
          `V = n / M = ${moles.toFixed(6)} mol / ${molarityRaw.toFixed(4)} mol/L = ${volumeCalc.toFixed(6)} L`,
        ]) },
        { id: 'compoundSource', label: 'Compound Source', value: found ? `"${found.formula}" (MM = ${found.molarMass} g/mol)` : '' },
      ];

      return results;
    }

    return [];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MolarityPanel, { values, results });
  },

  educational: {
    formula: 'M = n / V = (m / MM) / V',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="35" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Molarity = moles / liter</text><!-- Beaker --><path d="M 100 50 L 100 160 Q 100 175 115 175 L 205 175 Q 220 175 220 160 L 220 50" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2"/><!-- Liquid --><rect x="102" y="120" width="116" height="53" fill="rgba(59,130,246,0.15)" rx="0 0 4 4"/><text x="160" y="155" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Solution</text><text x="160" y="95" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">M = n / V</text><text x="160" y="115" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">moles per liter</text><!-- Label lines --><line x1="75" y1="50" x2="75" y2="100" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="60" y="78" text-anchor="end" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9">Solute</text><text x="60" y="90" text-anchor="end" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="8">(mass m)</text></svg>',
      alt: 'Beaker diagram showing molarity formula M = n/V with solute dissolving in solvent',
      caption: 'Molarity = moles of solute per liter of solution',
    },
    formulaDescription: 'Molarity (M) is the number of moles of solute per liter of solution. It is calculated by dividing the moles of solute (n) by the volume of solution in liters (V). The moles of solute are found by dividing the mass (m) by the molar mass (MM).',
    variables: [
      { symbol: 'M', name: 'Molarity', description: 'Concentration of the solution in moles per liter (mol/L).' },
      { symbol: 'n', name: 'Moles of solute', description: 'Amount of substance measured in moles (mol).' },
      { symbol: 'V', name: 'Volume', description: 'Total volume of the solution in liters (L).' },
      { symbol: 'm', name: 'Mass', description: 'Mass of the solute in grams (g).' },
      { symbol: 'MM', name: 'Molar mass', description: 'Mass per mole of the compound in grams per mole (g/mol).' },
    ],
    howToUse: [
      'Select the calculation mode: Molarity (from mass & volume), Mass (from molarity & volume), or Volume (from mass & molarity).',
      'Optionally enter a compound name (e.g., NaCl, H2SO4) to auto-fill the molar mass.',
      'Fill in the required fields based on the selected mode.',
      'Select the appropriate volume unit (L, mL, or µL).',
      'Results will show the calculated value, moles, step-by-step solution, and formulas used.',
    ],
    explanation: 'Molarity is one of the most common units of concentration in chemistry, developed during the 19th century as chemistry matured into a quantitative science. The concept of the mole was formalized by the German chemist Wilhelm Ostwald in 1894, though the underlying principle was proposed by Amadeo Avogadro in 1811 — that equal volumes of gases at the same temperature and pressure contain equal numbers of molecules. A 1 M (1 molar) solution contains 1 mole of solute dissolved in enough solvent to make 1 liter of solution. The mole is a counting unit representing Avogadroʼs number (6.022 × 10²³) of particles. To prepare a solution of known molarity, measure the required mass of solute and dilute to the desired volume. Practical example: to prepare 500 mL of 0.1 M NaCl solution. First, find the molar mass of NaCl: 58.44 g/mol. The moles needed = 0.1 M × 0.5 L = 0.05 mol. The mass needed = 0.05 × 58.44 = 2.922 g. Weigh 2.922 g of NaCl, dissolve in about 400 mL of distilled water, then dilute to exactly 500 mL in a volumetric flask. The resulting solution contains 0.1 moles of NaCl per liter. Edge cases: molarity is temperature-dependent because the volume of the solution changes with temperature. A solution that is 0.1000 M at 20°C becomes approximately 0.0995 M at 30°C due to thermal expansion. For precise analytical work, solutions should be used at the temperature at which they were prepared. For very dilute solutions (below 0.001 M), the assumption that the solute volume is negligible becomes less accurate, and molality (moles per kg of solvent) may be preferred. For concentrated solutions (above 1 M), the volume change upon mixing can be significant — for example, mixing 50 mL of water with 50 mL of ethanol yields only about 97 mL of solution, not 100 mL. For acids and bases, always add acid to water (not water to acid) when diluting concentrated solutions, especially for sulfuric acid which generates significant heat upon dilution.',
    faqs: [
      {
        question: 'What is the difference between molarity and molality?',
        answer: 'Molarity (M) is moles per liter of solution, while molality (m) is moles per kilogram of solvent. Molarity depends on temperature (volume changes with temperature), while molality is temperature-independent.',
      },
      {
        question: 'How do I prepare a 1 M NaCl solution?',
        answer: 'Weigh 58.44 g of NaCl (the molar mass), dissolve it in about 800 mL of distilled water, and then dilute to a final volume of 1 L in a volumetric flask.',
      },
      {
        question: 'Can I use this calculator for dilutions?',
        answer: 'For dilution calculations (M₁V₁ = M₂V₂), you would need the dilution formula calculator. This molarity calculator focuses on direct molarity, mass, and volume relationships.',
      },
      {
        question: 'How do I handle hydrated compounds when calculating molarity?',
        answer: 'Hydrated compounds contain water molecules bound in their crystal structure, and this water adds to the molar mass. For example, copper sulfate pentahydrate is CuSO4·5H2O with a molar mass of 249.69 g/mol (not 159.61 g/mol for anhydrous CuSO4). When preparing a solution from a hydrated salt, you MUST use the hydrated molar mass if the salt is in its hydrated form. Our compound database lists anhydrous molar masses — for hydrates, manually enter the correct molar mass or use the Molecular Weight Calculator first. Example: to make 1 L of 0.1 M CuSO4 from the pentahydrate, you need 0.1 mol × 249.69 g/mol = 24.969 g of CuSO4·5H2O.',
      },
      {
        question: 'What safety precautions should I take when preparing solutions?',
        answer: 'Always wear appropriate personal protective equipment: safety goggles, lab coat, and chemical-resistant gloves. For acid solutions, follow the "Always Add Acid" rule — slowly add concentrated acid to water with constant stirring, never the reverse. For exothermic dissolutions like NaOH in water, use a heat-resistant container. Work in a fume hood when handling volatile chemicals. Label all solutions with the chemical name, concentration, date prepared, and your initials. Consult the Safety Data Sheet (SDS) for each chemical before handling.',
      },
    ],
    commonUses: [
      'Preparing standard solutions in analytical chemistry labs — calculating the exact mass of a reagent needed to achieve a target concentration for titrations, calibrations, and quantitative analysis.',
      'Pharmaceutical formulation and compounding — determining drug concentrations for intravenous (IV) solutions, ensuring correct dosing in mg/mL and verifying molar equivalents.',
      'Biochemistry and molecular biology — preparing buffer solutions (e.g., Tris, PBS), enzyme assays, and PCR reagents where precise molar concentrations are critical for reproducible experiments.',
      'Environmental testing — calculating pollutant concentrations in water samples, such as nitrate or phosphate levels in mg/L and converting to molarity for regulatory reporting.',
      'Educational chemistry labs — teaching the fundamental relationship between mass, moles, volume, and concentration through hands-on solution preparation exercises.',
    ],
    quickReference: [
      { label: 'Molarity formula', value: 'M = n / V = (m / MM) / V' },
      { label: 'Mass from molarity', value: 'm = M × V × MM' },
      { label: 'Volume from mass', value: 'V = n / M = (m / MM) / M' },
      { label: '1 M solution', value: '1 mole solute per 1 L of total solution' },
      { label: '1 L = 1000 mL', value: 'Multiply by 1000 to convert liters to mL' },
      { label: '1 mL = 1000 µL', value: 'Multiply by 1000 to convert mL to µL' },
      { label: 'Avogadroʼs number', value: '6.02214076 × 10²³ entities per mole' },
      { label: 'NaCl molar mass', value: '58.44 g/mol (table salt)' },
    ],
    workedExamples: [
      {
        scenario: 'Dr. Patel, a chemistry researcher, needs to prepare 250 mL of a 0.2 M sodium hydroxide (NaOH) solution for a titration experiment. NaOH has a molar mass of 40.00 g/mol. How many grams of NaOH should she weigh on the analytical balance?',
        inputs: { mode: 'calcMass', molarity: '0.2', volume: '0.25', volumeUnit: 'L', molarMass: '40.00' },
        result: 'Mass = 2.000 g NaOH. n = 0.2 M × 0.25 L = 0.05 mol. m = 0.05 mol × 40.00 g/mol = 2.000 g.',
        insight: 'Using m = M × V × MM: m = 0.2 mol/L × 0.25 L × 40.00 g/mol = 2.000 g. Dr. Patel should weigh exactly 2.000 g of NaOH pellets. Important safety note: NaOH is highly caustic and hygroscopic — it absorbs moisture from air, so weigh quickly. Always add NaOH to water, never water to NaOH, and wear appropriate PPE including gloves and safety goggles. Use a volumetric flask for precise dilution to the 250 mL mark.',
      },
      {
        scenario: 'Maria, a biology graduate student, has dissolved 4.5 g of glucose (C6H12O6, molar mass 180.16 g/mol) in enough water to make 500 mL of solution. What is the molarity of this glucose solution for her cell culture experiment?',
        inputs: { mode: 'calcMolarity', mass: '4.5', volume: '0.5', volumeUnit: 'L', molarMass: '180.16' },
        result: 'Molarity = 0.0500 M (50 mM). n = 4.5 g / 180.16 g/mol = 0.02498 mol. M = 0.02498 mol / 0.5 L = 0.0500 mol/L.',
        insight: 'Moles n = m / MM = 4.5 g / 180.16 g/mol = 0.02498 mol. Molarity M = n / V = 0.02498 mol / 0.5 L = 0.0500 M = 50 mM glucose. For mammalian cell culture, this concentration may need further dilution depending on cell line requirements — typical media contain 5-25 mM glucose. This is a convenient stock solution for further dilution.',
      },
      {
        scenario: 'James, a quality control chemist, has 3.0 g of acetylsalicylic acid (aspirin, C9H8O4, molar mass 180.16 g/mol) and needs to prepare a 0.05 M standard solution for HPLC calibration. What final volume should he dilute to?',
        inputs: { mode: 'calcVolume', mass: '3.0', molarity: '0.05', molarMass: '180.16' },
        result: 'Volume = 0.333 L (333 mL). n = 3.0 g / 180.16 g/mol = 0.01665 mol. V = 0.01665 mol / 0.05 mol/L = 0.333 L.',
        insight: 'Moles n = 3.0 g / 180.16 g/mol = 0.01665 mol. Volume V = n / M = 0.01665 mol / 0.05 mol/L = 0.333 L = 333 mL. James should dissolve the 3.0 g of aspirin and dilute to exactly 333 mL in a volumetric flask. For HPLC calibration, this stock would typically be further diluted to create a calibration curve with concentrations from 0.001 to 0.05 M.',
      },
    ],
    proTips: [
      'Always add solute to solvent, not the reverse. This is especially critical with concentrated acids — adding water to concentrated sulfuric acid can cause violent boiling and splashing. The safety mnemonic is "Always Add Acid" (AAA: Add Acid to water).',
      'When preparing solutions for precise analytical work, use a volumetric flask rather than a graduated cylinder. Volumetric flasks are calibrated to contain a specific volume with much higher accuracy — typically ±0.05% versus ±1% for graduated cylinders.',
      'Molarity is temperature-dependent because liquid volume expands when heated. A 0.1000 M solution at 20°C becomes approximately 0.0995 M at 30°C. For critical work, prepare and use solutions at the same temperature, or use molality (mol/kg solvent) for temperature-independent concentrations.',
      'For hydrated compounds (like CuSO4·5H2O or Na2HPO4·2H2O), use the molar mass of the hydrated form, not the anhydrous form. The water of crystallization adds significant mass — CuSO4 is 159.61 g/mol anhydrous, but 249.69 g/mol as the pentahydrate.',
      'Use the compound auto-detection feature to pull molar masses for common reagents. The database includes NaCl (58.44), HCl (36.46), NaOH (40.00), H2SO4 (98.08), and glucose (180.16). For compounds not in the database, use the Molecular Weight Calculator first.',
      'For serial dilutions, use the M1V1 = M2V2 formula rather than this calculator. To make 100 mL of 0.01 M from a 0.1 M stock: (0.1 M)(V1) = (0.01 M)(100 mL), so V1 = 10 mL of stock diluted to 100 mL.',
    ],
    limitations: [
      'This calculator assumes the solute dissolves completely without significantly changing the total solution volume — this approximation holds well for dilute solutions below ~0.5 M but becomes less accurate at higher concentrations where volume changes upon mixing become significant.',
      'The compound database is limited to 16 common compounds; for others, manually enter the molar mass.',
      'Temperature effects on solution volume are not accounted for — molarity is temperature-dependent, and all calculations assume room temperature of approximately 20°C.',
      'The calculator does not handle serial dilutions; use M1V1 = M2V2 for those.',
      'Do not use this calculator for gases where concentration is expressed in partial pressure, for solid-solid mixtures where molarity is not applicable, for non-aqueous solvents where solution behavior differs, or for solutions requiring activity coefficient corrections at high ionic strength.',
    ],
    citations: [
      { source: 'Wikipedia - Molar Concentration', url: 'https://en.wikipedia.org/wiki/Molar_concentration' },
      { source: 'Wolfram MathWorld - Molarity', url: 'https://mathworld.wolfram.com/Molarity.html' },
    ],
  },
};

export default molarityConfig;
