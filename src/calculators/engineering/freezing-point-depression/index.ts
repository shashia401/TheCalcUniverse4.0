import { CalculatorConfig } from '../../../types/calculator';
import { sigFig4 as fmt } from '../../../lib/format';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

const fpDepressionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'kf',
      label: 'Cryoscopic Constant (Kf)',
      type: 'number',
      placeholder: '1.86',
      unit: '°C·kg/mol',
      inputMode: 'decimal',
      min: 0.1,
      max: 100,
      step: 0.01,
      required: true,
      helpText: 'Solvent-specific constant. Typical values: water 1.86, benzene 5.12, camphor about 40, cyclohexane about 20, acetic acid 3.90 °C·kg/mol.',
    },
    {
      id: 'molality',
      label: 'Molality (m)',
      type: 'number',
      placeholder: '1',
      unit: 'mol/kg',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
      helpText: 'Moles of solute per kilogram of SOLVENT (not solution). For NaCl at 1 mol/kg: m = 1, but i = 2 gives effective 2 mol/kg.',
    },
    {
      id: 'vanthoff',
      label: "Van't Hoff Factor (i)",
      type: 'number',
      placeholder: '1',
      inputMode: 'decimal',
      min: 0.5,
      max: 10,
      step: 0.1,
      defaultValue: '1',
      required: true,
      helpText: 'Number of particles per formula unit. Non-electrolytes (sugar): 1. NaCl: 2 (Na⁺ + Cl⁻), CaCl₂: 3, MgSO₄: 2. Strong electrolytes: use ideal i. Weak electrolytes: use measured i (lower than ideal).',
    },
    {
      id: 'soluteMass',
      label: 'Solute Mass (optional)',
      type: 'number',
      placeholder: '58.44',
      unit: 'g',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      helpText: 'Mass of solute added. Optional — enter with solvent mass to auto-calculate molality. For NaCl (MW 58.44): 58.44 g in 1 kg water = 1 molal.',
    },
    {
      id: 'solventMass',
      label: 'Solvent Mass (optional)',
      type: 'number',
      placeholder: '1000',
      unit: 'g',
      inputMode: 'decimal',
      min: 0.1,
      max: 1e7,
      step: 1,
      helpText: 'Mass of solvent (NOT solution). For a 1 molal NaCl solution: dissolve 58.44 g NaCl in 1,000 g water (total mass ~1,058 g).',
    },
    {
      id: 'molarMass',
      label: 'Solute Molar Mass (optional)',
      type: 'number',
      placeholder: '58.44',
      unit: 'g/mol',
      inputMode: 'decimal',
      min: 1,
      step: 0.01,
      helpText: 'Molar mass of the solute. NaCl: 58.44, CaCl₂: 110.98, Sucrose: 342.3, Ethylene glycol: 62.07 g/mol.',
    },
    {
      id: 'solventFp',
      label: 'Pure-Solvent Freezing Point (optional)',
      type: 'number',
      placeholder: '0',
      unit: '°C',
      inputMode: 'decimal',
      min: -200,
      max: 500,
      step: 0.1,
      helpText: 'Freezing point of the pure solvent, used for the new freezing point. Blank = 0 °C (water). Benzene 5.5, cyclohexane 6.5, acetic acid 16.6, camphor about 179.',
    },
],
calculate: (values) => {
    const kf = parseFloat(values.kf);
    let molality = parseFloat(values.molality);
    const i = parseFloat(values.vanthoff) || 1;
    const soluteMass = parseFloat(values.soluteMass);
    const solventMass = parseFloat(values.solventMass);
    const molarMass = parseFloat(values.molarMass);
    const fp0 = values.solventFp !== undefined && values.solventFp !== '' ? parseFloat(values.solventFp) : 0;

    if (!Number.isFinite(kf) || kf <= 0 || !Number.isFinite(fp0)) return [];

    // Auto-calculate molality if solute mass, solvent mass, and molar mass are provided
    if (!isNaN(soluteMass) && !isNaN(solventMass) && !isNaN(molarMass) && soluteMass > 0 && solventMass > 0 && molarMass > 0) {
      const moles = soluteMass / molarMass;
      molality = moles / (solventMass / 1000);
    }

    if (!Number.isFinite(molality) || molality < 0 || !Number.isFinite(i) || i <= 0) return [];

    const deltaTf = kf * molality * i;

    const newFreezingPoint = fp0 - deltaTf;

    return [
      { id: 'deltaTf', label: 'Freezing Point Depression (ΔTf)', value: `${fmt(deltaTf)}°C`, highlight: true, color: 'positive' },
      { id: 'newFP', label: 'New Freezing Point (ideal)', value: `${fmt(newFreezingPoint)}°C`, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `ΔTf = ${kf} × ${fmt(molality)} × ${i} = ${fmt(deltaTf)}°C`, color: 'neutral' },
      { id: 'effectiveMolality', label: 'Effective Molality (m × i)', value: `${fmt(molality * i)} mol/kg`, color: 'neutral' },
    ];
  },

  explainSteps: (values) => {
    const kf = parseFloat(values.kf);
    let molality = parseFloat(values.molality);
    const i = parseFloat(values.vanthoff) || 1;
    const soluteMass = parseFloat(values.soluteMass);
    const solventMass = parseFloat(values.solventMass);
    const molarMass = parseFloat(values.molarMass);
    const fp0 = values.solventFp !== undefined && values.solventFp !== '' ? parseFloat(values.solventFp) : 0;
    if (!Number.isFinite(kf) || kf <= 0 || !Number.isFinite(fp0)) return [];
    const steps: ExplainStep[] = [];
    if (!isNaN(soluteMass) && !isNaN(solventMass) && !isNaN(molarMass) && soluteMass > 0 && solventMass > 0 && molarMass > 0) {
      const moles = soluteMass / molarMass;
      molality = moles / (solventMass / 1000);
      steps.push({ label: 'Moles of solute', expr: `${fmt(soluteMass)} g ÷ ${fmt(molarMass)} g/mol = ${fmt(moles)} mol` });
      steps.push({ label: 'Molality = moles ÷ kg of solvent', expr: `${fmt(moles)} mol ÷ (${fmt(solventMass)} g ÷ 1000) = ${fmt(molality)} mol/kg`, note: 'The masses override the molality field when all three are filled in.' });
    }
    if (!Number.isFinite(molality) || molality < 0 || !Number.isFinite(i) || i <= 0) return [];
    const deltaTf = kf * molality * i;
    steps.push({ label: 'Freezing point depression', expr: `ΔTf = Kf × m × i = ${kf} × ${fmt(molality)} × ${i} = ${fmt(deltaTf)}°C`, note: "i is the van 't Hoff factor, the number of particles each formula unit splits into." });
    steps.push({ label: 'Subtract from the pure-solvent freezing point', expr: `${fp0}°C − ${fmt(deltaTf)}°C = ${fmt(fp0 - deltaTf)}°C`, note: 'An ideal-solution estimate; it is least accurate for concentrated solutions.' });
    return finiteSteps(steps);
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'ΔTf = Kf × m × i',
    formulaDescription: "Freezing point depression is a colligative property — it depends only on the NUMBER of dissolved particles, not their identity. ΔTf = Kf × m × i, where Kf is the solvent's cryoscopic constant, m is molality, and i is the van't Hoff factor (number of ions per formula unit). For a 1 molal NaCl solution in water the ideal result is ΔTf = 1.86 × 1 × 2 = 3.72°C (measured is about 3.4°C because ions are not fully independent at that concentration).",
    variables: [
      { symbol: 'Kf', name: 'Cryoscopic Constant', description: 'Unique to each solvent. Water: 1.86 °C·kg/mol (low — modest depression). Camphor: 40 °C·kg/mol (huge — used for molar mass determination). The larger Kf, the more sensitive the solvent is to solute.' },
      { symbol: 'm', name: 'Molality', description: 'Moles of solute per kilogram of solvent (mol/kg). Different from molarity (mol/L) because volume changes with temperature. Molality is temperature-independent and preferred for colligative properties.' },
      { symbol: 'i', name: "Van't Hoff Factor", description: 'Number of discrete particles per formula unit in solution. Non-electrolytes: 1. NaCl → Na⁺ + Cl⁻: i = 2. CaCl₂ → Ca²⁺ + 2Cl⁻: i = 3. Real solutions show slightly lower i due to ion pairing at high concentrations.' },
    ],
    howToUse: [
      'Enter the cryoscopic constant (Kf) for your solvent, or use the preset for water (1.86).',
      'Enter the molality directly, OR enter solute mass + solvent mass + molar mass for auto-calculation.',
      'Set the van\'t Hoff factor: 1 for sugar/alcohol, 2 for NaCl, 3 for CaCl₂.',
      'The result shows the freezing point depression and the new freezing point.',
    ],
    quickReference: [
      { label: 'Water Kf', value: '1.86 °C·kg/mol' },
      { label: 'Sea water (3.5% salt)', value: 'ΔTf ≈ 2.0°C' },
      { label: 'Road salt (23% brine)', value: 'ΔTf ≈ 21°C (eutectic -21°C)' },
      { label: 'Antifreeze 50/50 (by mass)', value: 'Ideal ΔTf ≈ 30°C; real mixtures protect to about -37°C' },
      { label: 'Sucrose 1 molal', value: 'ΔTf = 1.86°C (i = 1)' },
      { label: 'NaCl 1 molal', value: 'ΔTf = 3.72°C (i = 2)' },
      { label: 'CaCl₂ 1 molal', value: 'ΔTf = 5.58°C (i = 3)' },
      { label: 'Benzene Kf', value: '5.12 °C·kg/mol' },
    ],
    commonUses: [
      'Road de-icing — NaCl and CaCl₂ lower the freezing point of water, preventing ice formation down to -21°C (NaCl eutectic).',
      'Automotive antifreeze — ethylene glycol (i = 1) depresses the coolant freezing point; a 50/50 mix protects to roughly -37°C in practice.',
      'Making ice cream — salt mixed with ice gives a freezing bath well below 0°C (down to about -21°C for NaCl at the eutectic).',
      'Molar mass determination — cryoscopy uses ΔTf to determine unknown molecular weights (especially with camphor, Kf = 40).',
      'Winter concrete — calcium chloride added to mixing water prevents freezing during cold-weather concrete pours.',
    ],
    explanation: "Freezing point depression is one of four colligative properties (along with boiling point elevation, vapor pressure lowering, and osmotic pressure) that depend solely on the NUMBER of solute particles, not their chemical identity. First quantitatively described by François-Marie Raoult in 1882, the phenomenon explains why seawater freezes at -2°C instead of 0°C, why salt melts ice on roads, and why antifreeze protects engines. The physics is elegant: solute particles interfere with the solvent's ability to form a regular crystal lattice. More particles = more interference = lower freezing point. The van't Hoff factor accounts for electrolyte dissociation — NaCl produces 2 particles per formula unit, so 1 molal NaCl depresses the freezing point twice as much as 1 molal sugar. Road salt (NaCl) is effective down to -21°C (the eutectic point of NaCl-water). Below that, CaCl₂ (eutectic -51°C) is used. The massive Kf of camphor (40 °C·kg/mol) was historically used for the Rast method of molar mass determination: a few milligrams of unknown solute in camphor produces a measurable ΔTf from which the molecular weight can be calculated.",
    faqs: [
      {
        question: 'Why does salt melt ice on roads?',
        answer: 'Salt (NaCl) dissolves in the thin film of liquid water always present on ice surfaces, creating a brine solution with a lower freezing point than pure water. If the ambient temperature is above the brine\'s freezing point (eutectic: -21.1°C for NaCl), the ice melts. The process is actually freezing point depression of the water, not "melting" of ice by salt directly. Below -21°C, NaCl is ineffective — road crews switch to CaCl₂ (eutectic -51°C) or use mechanical ice removal.',
      },
      {
        question: "What's the difference between molality and molarity for this calculation?",
        answer: 'Molality (mol/kg solvent) is independent of temperature since mass doesn\'t change with temperature. Molarity (mol/L solution) changes because liquid volume expands/contracts with temperature. Colligative property calculations always use molality. At low concentrations in water, molality ≈ molarity (1 L water ≈ 1 kg), but the distinction matters for precise work and non-aqueous solvents.',
      },
      {
        question: 'How does antifreeze work in a car engine?',
        answer: 'Ethylene glycol (C₂H₆O₂, MW 62.07) is a non-electrolyte (i = 1) that dissolves in water and depresses the freezing point. A 50/50 mixture by mass has m = (500 g ÷ 62.07) ÷ 0.5 kg ≈ 16.1 mol/kg, giving an ideal ΔTf = 1.86 × 16.1 × 1 ≈ 30°C. Real mixtures at this concentration are non-ideal and protect to roughly -37°C (the ideal equation is only accurate for dilute solutions). Propylene glycol is a less toxic alternative used in RVs and food-processing equipment.',
      },
      {
        question: 'Why is CaCl₂ more effective than NaCl for de-icing?',
        answer: '(1) Van\'t Hoff factor: CaCl₂ → 3 ions (Ca²⁺ + 2Cl⁻) vs NaCl → 2 ions — 50% more particles per mole. (2) Lower eutectic: CaCl₂ brine freezes at -51°C vs NaCl brine at -21°C. (3) CaCl₂ dissolution is exothermic — it releases heat while dissolving, accelerating ice melting. The downsides are higher cost and corrosion concerns.',
      },
      {
        question: 'How is freezing point depression used to determine molar mass?',
        answer: 'Cryoscopy: dissolve a known mass of unknown solute in a known mass of solvent with a high Kf (camphor, Kf = 40). Measure ΔTf. From ΔTf = Kf × m × i, solve for molality m. From m = moles_solute / kg_solvent, solve for moles. Molar mass = mass_solute / moles_solute. A 10 mg sample in 1 g camphor giving ΔTf = 2°C: m = 2/(40×1) = 0.05 mol/kg, moles = 0.05×0.001 = 5×10⁻⁵, MW = 0.010/5×10⁻⁵ = 200 g/mol. This method was the standard for organic chemists before mass spectrometry became widely available.',
      },
    ],
    proTips: [
      'For salt solutions use a measured van\'t Hoff factor if you have one: at about 1 molal NaCl it is nearer 1.8 than the ideal 2.0 because ions pair up.',
      'Freezing point depression and boiling point elevation use the same molality but different solvent constants (Kf vs Kb). Water: Kf = 1.86, Kb = 0.512.',
      'When testing antifreeze concentration, a refractometer or hydrometer is far more accurate than the ΔTf calculation because commercial antifreeze contains corrosion inhibitors that affect properties.',
      'For an ice-and-salt bath, remember the limit is the eutectic: saturated NaCl brine bottoms out near -21°C, so no amount of extra salt gets colder.',
    ],
    workedExamples: [
      {
        scenario: '58.44 g of NaCl (MW = 58.44 g/mol) is dissolved in 1 kg of water. What is the freezing point of this solution?',
        inputs: { kf: '1.86', soluteMass: '58.44', solventMass: '1000', molarMass: '58.44', vanthoff: '2' },
        result: 'ΔTf = 3.72°C. New freezing point = −3.72°C.',
        insight: '1 mole of NaCl in 1 kg water = 1 molal. With i = 2, effective molality = 2. ΔTf = 1.86 × 1 × 2 = 3.72°C. New freezing point = 0 − 3.72 = −3.72°C. (1 molal NaCl is about 5.5% salt by mass, stronger than seawater at about 3.5%.)',
      },
      {
        scenario: 'A 50/50 ethylene glycol-water mixture contains 500 g ethylene glycol (MW 62.07) per 500 g water. What protection does this provide?',
        inputs: { kf: '1.86', soluteMass: '500', solventMass: '500', molarMass: '62.07', vanthoff: '1' },
        result: 'ΔTf ≈ 29.97°C (ideal). New freezing point ≈ −30°C; real 50/50 antifreeze protects to about −37°C.',
        insight: 'Moles = 500/62.07 = 8.06 mol. Molality = 8.06/0.500 = 16.11 mol/kg. ΔTf = 1.86 × 16.11 × 1 = 29.97°C. The ideal equation therefore predicts about -30°C. In practice a 50/50 mix protects to about -37°C because the solution is far from ideal at this concentration, so the equation underestimates the depression.',
      },
    ],

    limitations: [
      'This calculator uses the ideal van\'t Hoff equation which assumes dilute solutions. At concentrations above 0.1 molal, activity coefficients deviate from 1.0 and actual ΔTf may differ from calculated values.',
      'The van\'t Hoff factor for weak electrolytes is concentration-dependent; use experimentally measured i values for precise work.',
      'The calculation assumes the solute is non-volatile. For mixtures of multiple solutes, ΔTf contributions are approximately additive at low concentrations.',
    ],
  citations: [
      { source: 'Wikipedia — Freezing Point Depression', url: 'https://en.wikipedia.org/wiki/Freezing_Point_Depression' },
    ],
  },
};

export default fpDepressionConfig;
