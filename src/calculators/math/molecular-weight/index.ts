import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import MolecularWeightPanel from './MolecularWeightPanel';

// ─── Atomic Weights (all 118 elements) ─────────────────────────────────────────
// Conventional atomic weights (IUPAC / CIAAW), 3 decimals. Elements with no stable isotope (Tc, Pm, Po and everything
// after Bi except Th, Pa, U) use the mass number of their longest-lived isotope.

const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81,
  C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974,
  S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938,
  Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.380,
  Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904,
  Kr: 83.798, Rb: 85.468, Sr: 87.620, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.950, Tc: 98, Ru: 101.07, Rh: 102.906,
  Pd: 106.42, Ag: 107.868, Cd: 112.411, In: 114.818, Sn: 118.710,
  Sb: 121.760, Te: 127.60, I: 126.904, Xe: 131.293, Cs: 132.905,
  Ba: 137.327, La: 138.905, Ce: 140.116, Pr: 140.908, Nd: 144.242,
  Pm: 145, Sm: 150.36, Eu: 151.964, Gd: 157.25, Tb: 158.925,
  Dy: 162.500, Ho: 164.930, Er: 167.259, Tm: 168.934, Yb: 173.045,
  Lu: 174.967, Hf: 178.486, Ta: 180.948, W: 183.84, Re: 186.207,
  Os: 190.23, Ir: 192.217, Pt: 195.078, Au: 196.967, Hg: 200.592,
  Tl: 204.383, Pb: 207.200, Bi: 208.980, Po: 209, At: 210,
  Rn: 222, Fr: 223, Ra: 226, Ac: 227, Th: 232.038,
  Pa: 231.036, U: 238.029, Np: 237, Pu: 244, Am: 243,
  Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257,
  Md: 258, No: 259, Lr: 266, Rf: 267, Db: 268,
  Sg: 269, Bh: 270, Hs: 277, Mt: 278, Ds: 281,
  Rg: 282, Cn: 285, Nh: 286, Fl: 289, Mc: 290,
  Lv: 293, Ts: 294, Og: 294,
};

// ─── Subscript Normalization ───────────────────────────────────────────────────

const SUB_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

function normSub(s: string): string {
  return s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUB_MAP[ch] || ch);
}

const toSub = (s: string): string => s.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);

const MAX_COUNT = 1_000_000;

// ─── Element Parsing ───────────────────────────────────────────────────────────

interface ElementCount {
  element: string;
  count: number;
}

interface ParseResult {
  elements: ElementCount[];
  /** Number of H2O in a hydrate (0 when the extra units are something else, e.g. alum's Al2(SO4)3). */
  hydrateCount: number;
  /** "5 H₂O", "24 H₂O"... every part after the first "·". */
  units: string;
}

/**
 * Parse a chemical formula string.
 * Handles element symbols, subscripts (digits or Unicode), nested ( [ { brackets, and hydrates / adducts:
 *   CuSO4·5H2O   CuSO4.5H2O   CuSO4 + 5H2O   K2SO4·Al2(SO4)3·24H2O
 * Each part after the first may start with a count.
 */
function parseFormula(raw: string): ParseResult | null {
  const s = normSub(raw).replace(/\s/g, '');
  if (!s) return null;

  const parts = s
    .replace(/\.(?=\d*[A-Z([{])/g, '·')
    .replace(/\+(?=\d*[A-Z([{])/g, '·')
    .split(/[·•*]/);

  const total: ElementCount[] = [];
  const units: string[] = [];
  let hydrateCount = 0;
  let allWater = parts.length > 1;

  for (let p = 0; p < parts.length; p++) {
    const m = /^(\d*)(.*)$/.exec(parts[p])!;
    let coefficient = 1;
    if (m[1] !== '') {
      if (p === 0) return null; // the main formula has no leading count
      coefficient = parseInt(m[1], 10);
      if (coefficient < 1 || coefficient > MAX_COUNT) return null;
    }
    const elements = parseElements(m[2]);
    if (!elements) return null;
    for (const el of elements) el.count *= coefficient;
    mergeElements(total, elements);

    if (p > 0) {
      units.push(`${coefficient} ${toSub(m[2])}`);
      if (m[2] === 'H2O') hydrateCount += coefficient;
      else allWater = false;
    }
  }

  return { elements: total, hydrateCount: allWater ? hydrateCount : 0, units: units.join(' + ') };
}

/**
 * Tokenize and parse a formula string into element counts.
 * Uses a stack-based approach for parentheses; repeated elements (CH3COOH) are merged.
 */
function parseElements(s: string): ElementCount[] | null {
  if (!s) return null;

  const elements: ElementCount[] = [];
  const stack: Array<{ elements: ElementCount[] }> = [];
  let current = elements;
  let i = 0;

  while (i < s.length) {
    const ch = s[i];

    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push({ elements: current });
      current = [];
      i++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (stack.length === 0) return null;

      const numStart = i + 1;
      let numEnd = numStart;
      while (numEnd < s.length && /[0-9]/.test(s[numEnd])) numEnd++;
      const multiplier = numStart < numEnd ? parseInt(s.slice(numStart, numEnd), 10) : 1;
      if (isNaN(multiplier) || multiplier < 1 || multiplier > MAX_COUNT) return null;

      for (const el of current) el.count *= multiplier;

      const parent = stack.pop()!;
      mergeElements(parent.elements, current);
      current = parent.elements;

      i = numEnd;
    } else if (/[A-Z]/.test(ch)) {
      // Element symbol: uppercase + optional lowercase letters
      const elStart = i;
      i++;
      while (i < s.length && /[a-z]/.test(s[i])) i++;
      const element = s.slice(elStart, i);

      if (!Object.prototype.hasOwnProperty.call(ATOMIC_WEIGHTS, element)) return null;

      const numStart = i;
      while (i < s.length && /[0-9]/.test(s[i])) i++;
      const numStr = s.slice(numStart, i);
      const count = numStr ? parseInt(numStr, 10) : 1;
      if (isNaN(count) || count < 1 || count > MAX_COUNT) return null;

      mergeElements(current, [{ element, count }]);
    } else {
      return null;
    }
  }

  if (stack.length > 0) return null;

  return elements;
}

/**
 * Merge source element counts into target array (combining same elements).
 */
function mergeElements(target: ElementCount[], source: ElementCount[]): void {
  for (const src of source) {
    const existing = target.find((t) => t.element === src.element);
    if (existing) {
      existing.count += src.count;
    } else {
      target.push({ element: src.element, count: src.count });
    }
  }
}

// ─── Calculation ───────────────────────────────────────────────────────────────

interface ElementBreakdown {
  element: string;
  count: number;
  mass: number;
  percentage: number;
}

function calcMolecularWeight(formula: string): {
  molecularWeight: number;
  totalAtoms: number;
  breakdown: ElementBreakdown[];
  formulaDisplay: string;
  formulaUnits: string;
  hydrateCount: number;
} | null {
  const parsed = parseFormula(formula.trim());
  if (!parsed || parsed.elements.length === 0) return null;

  let totalWeight = 0;
  let totalAtoms = 0;
  const breakdown: ElementBreakdown[] = [];

  for (const { element, count } of parsed.elements) {
    const elementMass = ATOMIC_WEIGHTS[element] * count;
    totalWeight += elementMass;
    totalAtoms += count;
    breakdown.push({ element, count, mass: elementMass, percentage: 0 });
  }

  for (const b of breakdown) {
    b.percentage = totalWeight > 0 ? (b.mass / totalWeight) * 100 : 0;
  }

  return {
    molecularWeight: parseFloat(totalWeight.toFixed(3)),
    totalAtoms,
    breakdown,
    formulaDisplay: formula.trim(),
    formulaUnits: parsed.units,
    hydrateCount: parsed.hydrateCount,
  };
}

// ─── Config ────────────────────────────────────────────────────────────────────

const molecularWeightConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'formula',
      label: 'Chemical Formula',
      type: 'text',
      placeholder: 'e.g., H2O, NaCl, C6H12O6, Mg(OH)2, CuSO4.5H2O',
      defaultValue: 'H2O',
      helpText: 'Enter any chemical formula. Supports parentheses, hydrates (· or .), and Unicode subscripts. Examples: H2O, NaCl, C6H12O6, Mg(OH)2, CuSO4·5H2O.',
    },
  ],

  calculate: (values): CalculatorResult[] => {
    const raw = values.formula || '';
    if (!raw.trim()) return [];

    const result = calcMolecularWeight(raw);
    if (!result) return [];

    return [
      {
        id: 'molecularWeight',
        label: 'Molecular Weight',
        value: result.molecularWeight.toFixed(3),
        unit: 'g/mol',
        highlight: true,
        color: 'positive',
      },
      {
        id: 'formula',
        label: 'Formula',
        value: result.formulaDisplay,
      },
      {
        id: '_elementBreakdown',
        label: 'Element Breakdown',
        value: JSON.stringify(result.breakdown),
      },
      {
        id: 'totalAtoms',
        label: 'Total Atoms',
        value: String(result.totalAtoms),
      },
      {
        id: 'formulaUnits',
        label: 'Formula Units',
        value: result.formulaUnits,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MolecularWeightPanel, { values, results });
  },

  educational: {
    formula: 'MW = Σ (atomic weight × count of each element)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Water (H&#x2082;O) — Molecular Weight</text><circle cx="160" cy="80" r="28" fill="rgba(239,68,68,0.2)" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="160" y="86" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="16" font-weight="bold">O</text><circle cx="100" cy="140" r="22" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><text x="100" y="146" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13" font-weight="bold">H</text><circle cx="220" cy="140" r="22" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><text x="220" y="146" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13" font-weight="bold">H</text><line x1="128" y1="100" x2="110" y2="125" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="192" y1="100" x2="210" y2="125" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="100" y="175" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">H: 1.008 x 2</text><text x="220" y="175" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">H: 1.008 x 2</text><text x="160" y="178" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">O: 15.999</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">MW = 2 x 1.008 + 15.999 = 18.015 g/mol</text></svg>',
      alt: 'Water molecule diagram showing oxygen and hydrogen atoms with atomic weights',
      caption: 'Molecular weight = sum of atomic weights in the molecule',
    },
    formulaDescription: 'The molecular weight (or molecular mass) is the sum of the atomic weights of all atoms in a molecule, expressed in grams per mole (g/mol). For each element in the chemical formula, multiply its atomic weight by the number of atoms of that element, then sum all contributions. For hydrated compounds, add the molecular weight of water multiplied by the hydration number. Parenthesized groups have their internal atoms multiplied by the subscript outside the parentheses.',
    variables: [
      { symbol: 'MW', name: 'Molecular Weight', description: 'Sum of atomic masses of all atoms in the molecule (g/mol).' },
      { symbol: 'AW', name: 'Atomic Weight', description: 'Mass of one atom of an element, typically in g/mol.' },
      { symbol: 'n', name: 'Atom Count', description: 'Number of atoms of a given element in the formula unit.' },
    ],
    howToUse: [
      'Enter a chemical formula using standard notation (e.g., H2O, NaCl, C6H12O6).',
      'Use parentheses for polyatomic groups: Mg(OH)2, Ca(NO3)2.',
      'For hydrates, use the · or . notation: CuSO4·5H2O or CuSO4.5H2O.',
      'Unicode subscripts (H₂O) and normal digits (H2O) are both supported.',
      'The calculator shows molecular weight, element breakdown, and mass percentages.',
    ],
    explanation: 'Molecular weight (or molecular mass) is the sum of the atomic masses of all atoms in a molecule, representing one of the fundamental concepts in chemistry that bridges the atomic and macroscopic worlds. The systematic determination of atomic weights began with John Dalton in 1803, who published the first table of atomic weights, and was significantly refined by the Swedish chemist Jöns Jacob Berzelius in the early 19th century. It is used to convert between mass and moles of a substance, prepare solutions of specific concentration, and determine the composition of chemical compounds. Atomic weights are based on the weighted average of naturally occurring isotopes of each element. Practical example: calculating the molecular weight of glucose (C₆H₁₂O₆). Carbon: 6 × 12.011 = 72.066, Hydrogen: 12 × 1.008 = 12.096, Oxygen: 6 × 15.999 = 95.994. Total = 72.066 + 12.096 + 95.994 = 180.156 g/mol. This means 180.156 grams of glucose contains exactly one mole (6.022 × 10²³ molecules) of glucose. Edge cases: hydrated compounds like copper sulfate pentahydrate (CuSO₄·5H₂O) include water molecules in the crystal structure. The molecular weight must account for the five water molecules: CuSO₄ = 159.607 g/mol, plus 5 × H₂O (5 × 18.015 = 90.075 g/mol) = 249.682 g/mol total. For polymers like polyethylene (C₂H₄)ₙ, the molecular weight varies with chain length (n), so an average molecular weight is reported. For compounds with isotopes like deuterated water (D₂O), use the atomic weight of deuterium (2.014) instead of protium (1.008).',
    limitations: [
      'This calculator uses standard IUPAC atomic weights which are weighted averages of naturally occurring isotopes. For mass spectrometry applications requiring exact isotopic masses (monoisotopic mass), use specialized tools.',
      'All 118 elements are included. Elements with no stable isotope (Tc, Pm, Po and most elements after Bi, except Th, Pa and U) use the mass number of their longest-lived isotope, so treat those results as approximate.',
      'Formulas are read exactly as typed and are case-sensitive (Co is cobalt, CO is carbon monoxide). Charges and isotope labels such as D or 13C are not understood; use H and C, or work out those masses by hand.',
      'Do not use this calculator for polymers where the molecular weight is an average distribution, for biochemical macromolecules like proteins and DNA sequences, for mass spectrometry where exact isotopic masses are required, or when the formula contains anything other than element symbols, counts, brackets and hydrate separators.',
    ],
    faqs: [
      {
        question: 'What is the difference between molecular weight and molar mass?',
        answer: 'Molecular weight (or molecular mass) is the mass of one molecule relative to 1/12 of carbon-12, expressed in atomic mass units (amu or Da). Molar mass is numerically the same value but expressed in grams per mole (g/mol). In practice, the terms are used interchangeably. For example, water (H2O) has a molecular weight of 18.015 amu and a molar mass of 18.015 g/mol. One mole of water weighs 18.015 grams. The term "molecular weight" is technically a misnomer because it refers to mass, not weight, but it remains the more commonly used term in chemistry education and laboratory settings.',
      },
      {
        question: 'Why are atomic weights not whole numbers?',
        answer: 'Atomic weights are weighted averages of all naturally occurring isotopes of an element, accounting for both the mass and natural abundance of each isotope. For example, chlorine has two common isotopes: Cl-35 (exact mass 34.969 amu, 75.76% abundance) and Cl-37 (exact mass 36.966 amu, 24.24% abundance). The weighted average is (34.969 × 0.7576) + (36.966 × 0.2424) = 26.49 + 8.96 = 35.45 g/mol. This is why atomic weights in the periodic table are rarely integers — they represent what you would actually measure for a natural sample, which contains a mix of isotopes.',
      },
      {
        question: 'How do I calculate the mass percentage of an element in a compound?',
        answer: 'Divide the total mass contribution of that element by the total molecular weight, then multiply by 100%. For example, in water (H2O, MW = 18.015): hydrogen contributes 2 × 1.008 = 2.016 g/mol, so mass % H = (2.016 / 18.015) × 100% = 11.19%. Oxygen contributes 15.999 g/mol, so mass % O = (15.999 / 18.015) × 100% = 88.81%. The percentages should sum to approximately 100% (minor rounding differences are normal). This calculation, called elemental analysis, is routinely used in analytical chemistry to verify compound purity and identity.',
      },
      {
        question: 'How do I write formulas with parentheses for polyatomic groups?',
        answer: 'Parentheses group atoms together and apply a multiplication factor. For example, Mg(OH)2 means one Mg atom plus two OH groups (2 O atoms and 2 H atoms total). Ca(NO3)2 means one Ca plus two NO3 groups (2 N atoms, 6 O atoms). The subscript after the closing bracket multiplies everything inside, and groups can be nested to any depth with ( ), [ ] or { }: (NH4)2SO4 has 2 N, 8 H, 1 S and 4 O, and Fe4[Fe(CN)6]3 is read correctly.',
      },
      {
        question: 'How do I enter hydrated compounds?',
        answer: 'Hydrated compounds contain water molecules in their crystal structure. Use the middle-dot (·) separator for the standard notation: CuSO4·5H2O (copper sulfate pentahydrate). The calculator also supports period notation (CuSO4.5H2O) and plus notation (CuSO4+5H2O). The hydrate water is automatically parsed and its mass (18.015 g/mol per water molecule) is added to the total molecular weight, and its hydrogen and oxygen are counted in the element breakdown. Double salts work too: K2SO4·Al2(SO4)3·24H2O (alum) is read as three parts, each with its own count.',
      },
      {
        question: 'Can this calculator handle organic compounds and pharmaceuticals?',
        answer: 'Yes, the calculator handles any chemical formula using any of the 118 elements, which includes everything commonly found in organic compounds (H, C, N, O, F, P, S, Cl, Br, I). Common pharmaceuticals like ibuprofen (C13H18O2, MW = 206.29 g/mol), aspirin (C9H8O4, MW = 180.16 g/mol), and acetaminophen (C8H9NO2, MW = 151.16 g/mol) can be calculated directly. For very large molecules, enter the formula carefully — a single misplaced digit or letter changes the result.',
      },
      {
        question: 'What are the historical origins of atomic weight determination?',
        answer: 'The systematic determination of atomic weights began with John Dalton in 1803, who published the first table of atomic weights based on hydrogen = 1. Dalton\'s values were inaccurate because he assumed water was HO (not H2O). The Swedish chemist Jöns Jacob Berzelius published much more accurate atomic weights between 1818 and 1826, establishing the foundation of modern chemical stoichiometry. The modern standard — defining atomic masses relative to carbon-12 — was adopted by IUPAC in 1961, replacing the earlier oxygen-16 standard that had caused confusion between chemists (who used natural oxygen) and physicists (who used oxygen-16).',
      },
    ],
    citations: [
      { source: 'Wikipedia - Molecular Mass', url: 'https://en.wikipedia.org/wiki/Molecular_mass' },
      { source: 'Wikipedia - Molar Mass', url: 'https://en.wikipedia.org/wiki/Molar_mass' },
    ],
  },
};

/** Molar mass (g/mol) of any formula this calculator can read, or null. Used by the molarity calculator's compound lookup. */
export function molarMassOfFormula(formula: string): number | null {
  return calcMolecularWeight(formula)?.molecularWeight ?? null;
}

export default molecularWeightConfig;
