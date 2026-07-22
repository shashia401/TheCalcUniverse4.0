import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import MolecularWeightPanel from './MolecularWeightPanel';

// ─── Atomic Weights (Top 42 elements) ──────────────────────────────────────────

const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81,
  C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974,
  S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938,
  Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.380,
  Br: 79.904, Rb: 85.468, Sr: 87.620, Ag: 107.868, Cd: 112.411,
  I: 126.904, Cs: 132.905, Ba: 137.327, Pt: 195.078, Au: 196.967,
  Hg: 200.592, Pb: 207.200,
};

// ─── Subscript Normalization ───────────────────────────────────────────────────

const SUB_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

function normSub(s: string): string {
  return s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUB_MAP[ch] || ch);
}

// ─── Element Parsing ───────────────────────────────────────────────────────────

interface ElementCount {
  element: string;
  count: number;
}

interface ParseResult {
  elements: ElementCount[];
  hydrateCount: number;
}

/**
 * Parse a chemical formula string.
 * Handles: element symbols, subscript numbers, parentheses, hydrates.
 * Accepts both regular digits and Unicode subscript digits.
 *
 * Hydrate support:
 *   CuSO4·5H2O  — middle-dot separator
 *   CuSO4.5H2O  — dot separator (dot followed by number + H2O)
 *   CuSO4 + 5H2O — plus sign separator
 */
function parseFormula(raw: string): ParseResult {
  const s = normSub(raw).replace(/\s/g, '');
  if (!s) return { elements: [], hydrateCount: 0 };

  let hydrateCount = 0;
  let formulaPart = s;

  // Check for · (middle-dot) separator — most common hydrate notation
  const middleDotIdx = s.indexOf('·');
  if (middleDotIdx >= 0) {
    const before = s.slice(0, middleDotIdx);
    const after = s.slice(middleDotIdx + 1);
    const hMatch = after.match(/^(\d+)\s*(H2O)?/i);
    if (hMatch) {
      hydrateCount = parseInt(hMatch[1], 10);
      formulaPart = before;
    }
  } else {
    // Check for . followed by a number and H2O (dot hydrate notation)
    const dotHydrate = s.match(/\.(\d+)\s*(H2O)/i);
    if (dotHydrate && dotHydrate.index !== undefined) {
      hydrateCount = parseInt(dotHydrate[1], 10);
      formulaPart = s.slice(0, dotHydrate.index);
    } else {
      // Check for + separator (e.g., CuSO4+5H2O)
      const plusParts = s.split('+');
      if (plusParts.length > 1) {
        const lastPart = plusParts[plusParts.length - 1];
        const wMatch = lastPart.match(/^(\d+)\s*(H2O)/i);
        if (wMatch) {
          hydrateCount = parseInt(wMatch[1], 10);
          formulaPart = plusParts.slice(0, -1).join('+');
        }
      }
    }
  }

  const elements = parseElements(formulaPart);
  if (!elements) return { elements: [], hydrateCount: 0 };

  return { elements, hydrateCount };
}

/**
 * Tokenize and parse a formula string into element counts.
 * Uses a stack-based approach for parentheses.
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
      // Push a new context
      stack.push({ elements: current });
      current = [];
      i++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      // Pop context and apply multiplier
      if (stack.length === 0) return null;

      // Read the number after the closing bracket
      const numStart = i + 1;
      let numEnd = numStart;
      while (numEnd < s.length && /[0-9.]/.test(s[numEnd])) numEnd++;
      const multiplier = numStart < numEnd ? parseInt(s.slice(numStart, numEnd), 10) : 1;
      if (isNaN(multiplier) || multiplier < 1) return null;

      // Multiply all elements in current by multiplier
      for (const el of current) {
        el.count *= multiplier;
      }

      // Merge into parent context
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

      // Validate element exists in our table
      if (!ATOMIC_WEIGHTS[element]) return null;

      // Read subscript count
      const numStart = i;
      while (i < s.length && /[0-9]/.test(s[i])) i++;
      const numStr = s.slice(numStart, i);
      const count = numStr ? parseInt(numStr, 10) : 1;
      if (isNaN(count) || count < 1) return null;

      current.push({ element, count });
    } else {
      return null;
    }
  }

  // If we have unclosed brackets, invalid
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

  // Calculate total weight from elements
  let totalWeight = 0;
  let totalAtoms = 0;
  const breakdown: ElementBreakdown[] = [];

  for (const { element, count } of parsed.elements) {
    const mass = ATOMIC_WEIGHTS[element];
    const elementMass = mass * count;
    totalWeight += elementMass;
    totalAtoms += count;
    breakdown.push({ element, count, mass: elementMass, percentage: 0 });
  }

  // Add hydrate water (H2O = 18.015 g/mol) as separate breakdown entries
  if (parsed.hydrateCount > 0) {
    const hMass = 1.008 * 2 * parsed.hydrateCount;
    const oMass = 15.999 * parsed.hydrateCount;
    const waterWeight = hMass + oMass;
    totalWeight += waterWeight;
    totalAtoms += 3 * parsed.hydrateCount; // 2 H + 1 O per water

    // Add H from hydrate
    const existingH = breakdown.find((b) => b.element === 'H');
    if (existingH) {
      existingH.count += 2 * parsed.hydrateCount;
      existingH.mass += hMass;
    } else {
      breakdown.push({
        element: 'H',
        count: 2 * parsed.hydrateCount,
        mass: hMass,
        percentage: 0,
      });
    }

    // Add O from hydrate
    const existingO = breakdown.find((b) => b.element === 'O');
    if (existingO) {
      existingO.count += parsed.hydrateCount;
      existingO.mass += oMass;
    } else {
      breakdown.push({
        element: 'O',
        count: parsed.hydrateCount,
        mass: oMass,
        percentage: 0,
      });
    }
  }

  // Calculate percentages
  for (const b of breakdown) {
    b.percentage = totalWeight > 0 ? (b.mass / totalWeight) * 100 : 0;
  }

  return {
    molecularWeight: parseFloat(totalWeight.toFixed(3)),
    totalAtoms,
    breakdown,
    formulaDisplay: formula.trim(),
    formulaUnits: parsed.hydrateCount > 0
      ? `${parsed.hydrateCount} H₂O`
      : '',
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
        id: 'elementBreakdown',
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
    explanation: 'Molecular weight (or molecular mass) is the sum of the atomic masses of all atoms in a molecule, representing one of the fundamental concepts in chemistry that bridges the atomic and macroscopic worlds. The systematic determination of atomic weights began with John Dalton in 1803, who published the first table of atomic weights, and was significantly refined by the Swedish chemist Jöns Jacob Berzelius in the early 19th century. It is used to convert between mass and moles of a substance, prepare solutions of specific concentration, and determine the composition of chemical compounds. Atomic weights are based on the weighted average of naturally occurring isotopes of each element. Practical example: calculating the molecular weight of glucose (C₆H₁₂O₆). Carbon: 6 × 12.011 = 72.066, Hydrogen: 12 × 1.008 = 12.096, Oxygen: 6 × 15.999 = 95.994. Total = 72.066 + 12.096 + 95.994 = 180.156 g/mol. This means 180.156 grams of glucose contains exactly one mole (6.022 × 10²³ molecules) of glucose. Edge cases: hydrated compounds like copper sulfate pentahydrate (CuSO₄·5H₂O) include water molecules in the crystal structure. The molecular weight must account for the five water molecules: CuSO₄ = 159.609 g/mol, plus 5 × H₂O (5 × 18.015 = 90.075 g/mol) = 249.684 g/mol total. For polymers like polyethylene (C₂H₄)ₙ, the molecular weight varies with chain length (n), so an average molecular weight is reported. For compounds with isotopes like deuterated water (D₂O), use the atomic weight of deuterium (2.014) instead of protium (1.008).',
    limitations: [
      'This calculator uses standard IUPAC atomic weights which are weighted averages of naturally occurring isotopes. For mass spectrometry applications requiring exact isotopic masses (monoisotopic mass), use specialized tools.',
      'The elemental database includes 42 common elements; exotic or synthetic elements beyond atomic number 82 (Pb) are limited to Au, Hg, Pt.',
      'The formula parser does not support nested brackets more than one level deep — complex coordination compounds may need to be broken into separate calculations.',
      'Do not use this calculator for polymers where the molecular weight is an average distribution, for biochemical macromolecules like proteins and DNA sequences, for mass spectrometry where exact isotopic masses are required, or for compounds containing elements not in the database (elements 83+ except those listed).',
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
        answer: 'Parentheses group atoms together and apply a multiplication factor. For example, Mg(OH)2 means one Mg atom plus two OH groups (2 O atoms and 2 H atoms total). Ca(NO3)2 means one Ca plus two NO3 groups (2 N atoms, 6 O atoms). The calculator supports single-level parentheses — the subscript after the closing parenthesis multiplies all atoms inside. For nested parentheses like (NH4)2SO4, the formula should be written with separate groups since the parser handles one level of grouping within each bracket pair.',
      },
      {
        question: 'How do I enter hydrated compounds?',
        answer: 'Hydrated compounds contain water molecules in their crystal structure. Use the middle-dot (·) separator for the standard notation: CuSO4·5H2O (copper sulfate pentahydrate). The calculator also supports period notation (CuSO4.5H2O) and plus notation (CuSO4+5H2O). The hydrate water is automatically parsed and its mass (18.015 g/mol per water molecule) is added to the total molecular weight. The resulting element breakdown will show the additional hydrogen and oxygen atoms from the water of crystallization separately.',
      },
      {
        question: 'Can this calculator handle organic compounds and pharmaceuticals?',
        answer: 'Yes, the calculator handles any chemical formula using elements from the 42-element database, which covers all elements commonly found in organic compounds (H, C, N, O, F, P, S, Cl, Br, I). Common pharmaceuticals like ibuprofen (C13H18O2, MW = 206.29 g/mol), aspirin (C9H8O4, MW = 180.16 g/mol), and acetaminophen (C8H9NO2, MW = 151.16 g/mol) can be calculated directly. For very large molecules, enter the formula carefully — a single misplaced digit or letter changes the result.',
      },
      {
        question: 'What are the historical origins of atomic weight determination?',
        answer: 'The systematic determination of atomic weights began with John Dalton in 1803, who published the first table of atomic weights based on hydrogen = 1. Dalton\'s values were inaccurate because he assumed water was HO (not H2O). The Swedish chemist Jöns Jacob Berzelius published much more accurate atomic weights between 1818 and 1826, establishing the foundation of modern chemical stoichiometry. The modern standard — defining atomic masses relative to carbon-12 — was adopted by IUPAC in 1961, replacing the earlier oxygen-16 standard that had caused confusion between chemists (who used natural oxygen) and physicists (who used oxygen-16).',
      },
    ],
    citations: [
      { source: 'Wikipedia - Molecular Mass', url: 'https://en.wikipedia.org/wiki/Molecular_mass' },
      { source: 'Wolfram MathWorld - Molecular Weight', url: 'https://mathworld.wolfram.com/MolecularWeight.html' },
    ],
  },
};

export default molecularWeightConfig;
