import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BloodTypePanel from './BloodTypePanel';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

type AboGenotype = 'AA' | 'AO' | 'BB' | 'BO' | 'AB' | 'OO';
type RhGenotype = 'RR' | 'Rr' | 'rr';

function getPossibleAboGenotypes(bloodType: string): AboGenotype[] {
  switch (bloodType) {
    case 'A': return ['AA', 'AO'];
    case 'B': return ['BB', 'BO'];
    case 'AB': return ['AB'];
    case 'O': return ['OO'];
    default: return [];
  }
}

function getPossibleRhGenotypes(rh: string): RhGenotype[] {
  return rh === '+' ? ['RR', 'Rr'] : ['rr'];
}

function aboGenotypeToBloodType(genotype: string): string {
  if (genotype === 'AA' || genotype === 'AO') return 'A';
  if (genotype === 'BB' || genotype === 'BO') return 'B';
  if (genotype === 'AB') return 'AB';
  if (genotype === 'OO') return 'O';
  return '';
}

function rhGenotypeToFactor(genotype: string): string {
  if (genotype === 'RR' || genotype === 'Rr') return '+';
  return '-';
}

function getAboAlleles(genotype: AboGenotype): string[] {
  return genotype.split('');
}

function getRhAlleles(genotype: RhGenotype): string[] {
  return genotype.split('');
}

function combineAboAlleles(a1: string, a2: string): string {
  // Sort alleles: I^A (A) comes before I^B (B) which comes before i (O)
  const alleles = [a1, a2];
  alleles.sort((x, y) => {
    const order: Record<string, number> = { 'A': 0, 'B': 1, 'O': 2 };
    return (order[x] ?? 3) - (order[y] ?? 3);
  });
  const combined = alleles.join('');
  // Normalize: AO stays AO, OA → AO, BO stays BO, OB → BO
  if (combined === 'OA') return 'AO';
  if (combined === 'OB') return 'BO';
  if (combined === 'AB' || combined === 'BA') return 'AB';
  return combined;
}

function combineRhAlleles(a1: string, a2: string): string {
  const alleles = [a1, a2].sort().join('');
  if (alleles === 'Rr' || alleles === 'rR') return 'Rr';
  return alleles;
}

interface Tally { counts: Record<string, number>; total: number }

/** Every child ABO genotype from every possible parent genotype pair x 4 allele pairings. */
function aboTally(p1Blood: string, p2Blood: string): Tally {
  const counts: Record<string, number> = { A: 0, B: 0, AB: 0, O: 0 };
  let total = 0;
  for (const g1 of getPossibleAboGenotypes(p1Blood)) {
    for (const g2 of getPossibleAboGenotypes(p2Blood)) {
      for (const al1 of getAboAlleles(g1)) {
        for (const al2 of getAboAlleles(g2)) {
          const childBt = aboGenotypeToBloodType(combineAboAlleles(al1, al2));
          counts[childBt] = (counts[childBt] || 0) + 1;
          total++;
        }
      }
    }
  }
  return { counts, total };
}

/** Same enumeration for the Rh locus. */
function rhTally(p1Rh: string, p2Rh: string): Tally {
  const counts: Record<string, number> = { '+': 0, '-': 0 };
  let total = 0;
  for (const g1 of getPossibleRhGenotypes(p1Rh)) {
    for (const g2 of getPossibleRhGenotypes(p2Rh)) {
      for (const al1 of getRhAlleles(g1)) {
        for (const al2 of getRhAlleles(g2)) {
          const childRh = rhGenotypeToFactor(combineRhAlleles(al1, al2));
          counts[childRh] = (counts[childRh] || 0) + 1;
          total++;
        }
      }
    }
  }
  return { counts, total };
}

/** ABO x Rh combinations, most likely first (ties keep A, B, AB, O then + before -). */
function combinedOutcomes(abo: Tally, rh: Tally): { label: string; pct: number; aboN: number; rhN: number }[] {
  const out: { label: string; pct: number; aboN: number; rhN: number }[] = [];
  for (const bt of ['A', 'B', 'AB', 'O'].filter((b) => abo.counts[b] > 0)) {
    for (const rf of ['+', '-'].filter((r) => rh.counts[r] > 0)) {
      out.push({ label: `Type ${bt}${rf}`, pct: (abo.counts[bt] / abo.total) * (rh.counts[rf] / rh.total) * 100, aboN: abo.counts[bt], rhN: rh.counts[rf] });
    }
  }
  return out.sort((a, b) => b.pct - a.pct);
}

const bloodTypeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'parent1Blood',
      label: 'Parent 1 Blood Type',
      type: 'select',
      required: true,
      helpText: 'Select the blood type (A, B, AB, or O) for the first parent',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'AB', value: 'AB' },
        { label: 'O', value: 'O' },
      ],
    },
    {
      id: 'parent1Rh',
      label: 'Parent 1 Rh Factor',
      type: 'select',
      required: true,
      helpText: 'Rh+ (positive) is dominant over Rh- (negative)',
      options: [
        { label: 'Rh+', value: '+' },
        { label: 'Rh-', value: '-' },
      ],
    },
    {
      id: 'parent2Blood',
      label: 'Parent 2 Blood Type',
      type: 'select',
      required: true,
      helpText: 'Select the blood type (A, B, AB, or O) for the second parent',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'AB', value: 'AB' },
        { label: 'O', value: 'O' },
      ],
    },
    {
      id: 'parent2Rh',
      label: 'Parent 2 Rh Factor',
      type: 'select',
      required: true,
      helpText: 'Rh+ (positive) is dominant over Rh- (negative)',
      options: [
        { label: 'Rh+', value: '+' },
        { label: 'Rh-', value: '-' },
      ],
    },
  ],
  explainSteps: (values) => {
    const rows = bloodTypeConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const { parent1Blood: b1, parent1Rh: r1, parent2Blood: b2, parent2Rh: r2 } = values;
    const abo = aboTally(b1, b2);
    const rh = rhTally(r1, r2);
    if (!abo.total || !rh.total) return [];
    const g1 = getPossibleAboGenotypes(b1);
    const g2 = getPossibleAboGenotypes(b2);
    const h1 = getPossibleRhGenotypes(r1);
    const h2 = getPossibleRhGenotypes(r2);
    const aboTypes = ['A', 'B', 'AB', 'O'].filter((t) => abo.counts[t] > 0);
    const rhTypes = ['+', '-'].filter((t) => rh.counts[t] > 0);
    const rhName = (t: string) => (t === '+' ? 'Rh+' : 'Rh-');
    const top = combinedOutcomes(abo, rh)[0];
    return finiteSteps([
      {
        label: 'List each parent’s possible genotypes',
        expr: `Parent 1 (${b1}${r1}): ${g1.join(' or ')} · ${h1.join(' or ')}   Parent 2 (${b2}${r2}): ${g2.join(' or ')} · ${h2.join(' or ')}`,
        note: 'Each possible genotype is treated as equally likely, as the calculator assumes.',
      },
      {
        label: 'Count the ABO outcomes',
        expr: `${g1.length} × ${g2.length} genotype pairs × 4 allele pairings = ${abo.total} combinations: ${aboTypes.map((t) => `${t} ${abo.counts[t]}`).join(' · ')}`,
      },
      {
        label: 'Turn the ABO counts into percentages',
        expr: aboTypes.map((t) => `${t}: ${abo.counts[t]} ÷ ${abo.total} = ${resultValue(rows, `abo${t}`)}`).join(' · '),
      },
      {
        label: 'Count and convert the Rh outcomes',
        expr: `${h1.length} × ${h2.length} × 4 = ${rh.total} combinations: ${rhTypes.map((t) => `${rhName(t)} ${rh.counts[t]} ÷ ${rh.total} = ${resultValue(rows, `rh${t === '+' ? 'Positive' : 'Negative'}`)}`).join(' · ')}`,
      },
      {
        label: 'Multiply the ABO and Rh chances (the two systems are treated as independent)',
        expr: `Most likely, ${top.label}: ${top.aboN}/${abo.total} × ${top.rhN}/${rh.total} × 100 = ${top.pct.toFixed(1)}%`,
        note: 'These are probabilities from possible genotype combinations, not guarantees.',
      },
    ]);
  },
  calculate: (values) => {
    const p1Blood = values.parent1Blood;
    const p1Rh = values.parent1Rh;
    const p2Blood = values.parent2Blood;
    const p2Rh = values.parent2Rh;

    if (!p1Blood || !p1Rh || !p2Blood || !p2Rh) return [];

    const { counts: aboCounts, total: aboTotal } = aboTally(p1Blood, p2Blood);
    const { counts: rhCounts, total: rhTotal } = rhTally(p1Rh, p2Rh);

    const aboPercentages: Record<string, string> = {};
    for (const bt of ['A', 'B', 'AB', 'O']) {
      aboPercentages[bt] = ((aboCounts[bt] / aboTotal) * 100).toFixed(1);
    }

    const rhPercentages: Record<string, string> = {};
    for (const rf of ['+', '-']) {
      rhPercentages[rf] = ((rhCounts[rf] / rhTotal) * 100).toFixed(1);
    }

    // ── Build results ──
    const results: ReturnType<CalculatorConfig['calculate']> = [];

    // ABO results
    const aboEntries = ['A', 'B', 'AB', 'O'].filter(bt => aboCounts[bt] > 0);
    for (const bt of aboEntries) {
      results.push({
        id: `abo${bt}`,
        label: `Blood Type ${bt}`,
        value: `${aboPercentages[bt]}%`,
        color: 'neutral',
      });
    }

    // Rh results
    const rhEntries = ['+', '-'].filter(rf => rhCounts[rf] > 0);
    for (const rf of rhEntries) {
      results.push({
        id: `rh${rf === '+' ? 'Positive' : 'Negative'}`,
        label: `Rh Factor ${rf}`,
        value: `${rhPercentages[rf]}%`,
        color: 'neutral',
      });
    }

    // Combined probabilities (top combinations)
    const combined = combinedOutcomes({ counts: aboCounts, total: aboTotal }, { counts: rhCounts, total: rhTotal });

    results.push({
      id: 'combinedHeader',
      label: 'Combined ABO + Rh Probabilities',
      value: combined.map(c => `${c.label}: ${c.pct.toFixed(1)}%`).join(' · '),
      highlight: true,
      color: 'positive',
    });

    results.push({
      id: 'disclaimer',
      label: 'Important Note',
      value: 'These are probabilities based on possible genotype combinations, not guarantees. Actual outcomes depend on the specific genotypes (e.g., AA vs AO) which cannot be determined from blood type alone.',
      color: 'neutral',
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BloodTypePanel, { values, results });
  },
  educational: {
    formula: 'ABO System: I^A and I^B are codominant to i (recessive). Rh System: Rh+ (R) dominant over Rh- (r).',
    formulaSource: 'Mendelian inheritance of the ABO (I^A, I^B, i) and RhD loci — see NCBI Bookshelf, "Blood Groups and Red Cell Antigens" (Daniels & Bromilow, NBK2261). A type-A or type-B parent is treated as AA/AO (BB/BO) with equal probability, and an Rh+ parent as RR/Rr with equal probability (a uniform prior, not Hardy-Weinberg population frequencies); the ABO and Rh results are multiplied because the loci are on different chromosomes.',
    formulaDescription:
      'Blood type inheritance follows Mendelian genetics. The ABO system uses three alleles: I^A, I^B, and i. A and B are codominant with each other and both dominant over O. The Rh factor has two alleles: R (dominant, Rh+) and r (recessive, Rh-).',
    diagram: {
      svg: '<svg viewBox="0 0 480 140" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">ABO Blood Type Inheritance</text>' +
        '<!-- Punnett square grid -->' +
        '<rect x="90" y="35" width="120" height="80" rx="4" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<line x1="150" y1="35" x2="150" y2="115" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<line x1="90" y1="75" x2="210" y2="75" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<text x="120" y="60" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" text-anchor="middle" font-weight="600">A</text>' +
        '<text x="180" y="60" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" text-anchor="middle" font-weight="600">O</text>' +
        '<text x="72" y="62" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-f59e0b)" text-anchor="end" font-weight="600">A</text>' +
        '<text x="72" y="100" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-f59e0b)" text-anchor="end" font-weight="600">O</text>' +
        '<text x="120" y="62" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle">AA</text>' +
        '<text x="180" y="62" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle">AO</text>' +
        '<text x="120" y="100" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle">AO</text>' +
        '<text x="180" y="100" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle">OO</text>' +
        '<text x="210" y="118" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">A × O Punnett Square</text>' +
        '<!-- Legend -->' +
        '<rect x="290" y="40" width="16" height="16" rx="3" fill="var(--svg-3b82f6)"/>' +
        '<text x="312" y="53" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)">Parent 1 allele</text>' +
        '<rect x="290" y="65" width="16" height="16" rx="3" fill="var(--svg-f59e0b)"/>' +
        '<text x="312" y="78" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)">Parent 2 allele</text>' +
        '<text x="290" y="105" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">25% AA · 50% AO · 25% OO</text>' +
        '<text x="290" y="120" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">= 75% Type A · 25% Type O</text>' +
        '</svg>',
      alt: 'Punnett square showing inheritance of ABO blood types from an A (AO) and O (OO) parent combination',
      caption: 'A parent with type A (genotype AO) and a parent with type O (genotype OO) have a 75% chance of type A and 25% chance of type O offspring',
    },
    variables: [
      { symbol: 'I^A', name: 'Allele A', description: 'One of three ABO alleles. Produces A antigens on red blood cells. Dominant over i (O) and codominant with I^B.' },
      { symbol: 'I^B', name: 'Allele B', description: 'One of three ABO alleles. Produces B antigens on red blood cells. Dominant over i (O) and codominant with I^A.' },
      { symbol: 'i', name: 'Allele O', description: 'The recessive ABO allele. Does not produce any A or B antigens. Only results in type O blood when two copies are inherited (ii).' },
      { symbol: 'R / r', name: 'Rh Alleles', description: 'R (Rh+ allele) is dominant. r (Rh- allele) is recessive. An Rh- person must have genotype rr. Rh+ people may be RR or Rr.' },
    ],
    howToUse: [
      'Select the blood type (A, B, AB, or O) for Parent 1.',
      'Select the Rh factor (+ or -) for Parent 1.',
      'Repeat for Parent 2.',
      'View the probability percentages for each possible child blood type.',
      'Review the combined ABO + Rh probabilities for a comprehensive picture.',
    ],
    explanation:
      'Human blood type is determined by two genetic systems inherited independently: the ABO system (discovered by Karl Landsteiner in 1901) and the Rh system (discovered in 1937). The ABO system uses three alleles: I^A, I^B, and i (often written as A, B, O). Since each person inherits one allele from each parent, there are six possible genotypes (AA, AO, BB, BO, AB, OO) that produce four possible blood types. A and B are codominant — if you inherit both, you express both (type AB). Both A and B are dominant over O. This means a person with type A could have genotype AA or AO — their child\'s blood type depends on which alleles they pass on. The Rh system is simpler: the Rh-positive allele (R) is dominant over the Rh-negative allele (r). An Rh-negative person must inherit the recessive allele from both parents (rr). An Rh-positive person could be RR or Rr. The combined system produces 8 possible blood types: A+, A-, B+, B-, AB+, AB-, O+, O-. The most common in the US is O+ (~37%), and the rarest is AB- (~1%). This calculator enumerates all possible genotype combinations and their resulting blood type probabilities. Note that these are probabilities based on the assumption that all possible genotypes for a given blood type are equally likely. In reality, population frequencies of the underlying alleles vary by ethnicity and geographic region.',
    faqs: [
      {
        question: 'Can two O parents have a child with type A, B, or AB?',
        answer: 'No. Two O parents (both genotype OO) can only pass on the O allele, so the child will always be type O (genotype OO). This is a classic example of recessive inheritance.',
      },
      {
        question: 'Can two A parents have a child with type O?',
        answer: 'Yes, if both parents are genotype AO. Each parent has a 50% chance of passing the O allele, giving a 25% chance of an OO (type O) child. If either parent is AA, then all children will be type A.',
      },
      {
        question: 'Is it possible for an AB parent and an O parent to have an AB child?',
        answer: 'No. An AB parent (genotype AB) can pass either A or B. An O parent (genotype OO) can only pass O. The possible genotypes are AO (type A) and BO (type B). The child cannot be AB or O.',
      },
      {
        question: 'What is Rh incompatibility?',
        answer: 'Rh incompatibility occurs when an Rh- mother carries an Rh+ child. If fetal blood enters the maternal circulation, the mother may produce anti-Rh antibodies. In subsequent Rh+ pregnancies, these antibodies can cross the placenta and cause hemolytic disease of the newborn. This is preventable with Rh immunoglobulin (RhoGAM) injections.',
      },
    
      {
        question: 'Do blood type probabilities change with multiple children?',
        answer: 'No — each pregnancy is an independent event with the same probability distribution. If a couple has a 25% chance of an O child, that does not mean exactly 1 in 4 children will be type O. It means each child independently has a 25% chance, similar to flipping a coin.',
      },],
    commonUses: [
      'Parenting education — understand the possible blood types for children based on both parents\' blood types, useful for curious parents or expectant families',
      'Biology and genetics education — observe Mendelian inheritance patterns through the ABO and Rh blood group systems in a practical Punnett square application',
      'Blood donation awareness — learn about the 8 possible blood types (A+/-, B+/-, AB+/-, O+/-) and how blood type inheritance determines compatibility for donation',
      'Medical and family history — resolve questions about blood type inheritance patterns that may come up in clinical settings or when discussing family medical history',
    ],
    
    workedExamples: [
      {
        scenario: 'James (A+) and Maria (B+) are expecting a child and are curious about all possible blood types for their baby. Neither knows whether they carry the recessive O or Rh- alleles, so the calculator considers all genotype possibilities.',
        inputs: {
          'Parent 1 Blood Type': 'A',
          'Parent 1 Rh Factor': '+',
          'Parent 2 Blood Type': 'B',
          'Parent 2 Rh Factor': '+',
        },
        result: 'AB: 56.3%, A: 18.8%, B: 18.8%, O: 6.3%. Rh+: 93.8%, Rh-: 6.3%. Combined: AB+ at 52.7%, A+ at 17.6%, B+ at 17.6%, AB- at 3.5%, A- at 1.2%, B- at 1.2%, O+ at 5.9%, O- at 0.4%.',
        insight: 'With two parents expressing A and B phenotypes, nearly every blood type is possible for their child — from AB+ (most likely, 52.7%) to O- (least likely, 0.4%). This happens because both parents could be heterozygous (AO and BO). Because both parents are Rh+, the calculator considers both RR and Rr genotypes equally likely, producing 93.8% Rh+ / 6.3% Rh- odds. If either parent\'s exact genotype were known (e.g., both are confirmed Rr), the Rh probabilities would shift. Similarly, if James were AA instead of AO, type O would be impossible for the child.',
      },
      {
        scenario: 'Priya (O-) and Ravi (AB+) are both first-time blood donors. Priya knows she is a universal donor (O-), but they want to understand what blood types their future children could have.',
        inputs: {
          'Parent 1 Blood Type': 'O',
          'Parent 1 Rh Factor': '-',
          'Parent 2 Blood Type': 'AB',
          'Parent 2 Rh Factor': '+',
        },
        result: 'A: 50.0%, B: 50.0%. Rh+: 75.0%, Rh-: 25.0%. Combined: A+ at 37.5%, B+ at 37.5%, A- at 12.5%, B- at 12.5%. Type AB and Type O are impossible for their children.',
        insight: 'Priya (OO) can only contribute an O allele, and Ravi (AB) can contribute A or B. So every child will be either AO (type A) or BO (type B) — the recessive O allele is always masked. Because Ravi could be RR or Rr (both equally likely in the model), the Rh- outcome sits at 25.0% overall — reflecting the chance that Ravi is Rr AND passes the r allele. If Ravi\'s exact Rh genotype were known to be RR, all children would be guaranteed Rh+. This is why knowing genotypes beyond phenotypes matters for precise prediction.',
      },
    ],

    proTips: [
      'O- is the universal red blood cell donor (no A/B antigens, no Rh antigen). AB+ is the universal plasma donor and universal red cell recipient. Knowing both ABO and Rh matters for transfusion compatibility.',
      'If both parents are Rh+ but produce an Rh- child, both must be heterozygous (Rr). This is a normal Mendelian outcome — about 25% chance per pregnancy when both carry the recessive allele.',
      'For the most probable child blood type, focus on the combined ABO+Rh result (highest percentage) rather than ABO and Rh separately, since the systems are inherited independently.',
      'Blood type probabilities depend on the assumption that all possible genotypes for a given phenotype are equally likely. In reality, population allele frequencies vary by ancestry — for example, the O allele frequency is higher in Indigenous American populations (~90%) than in South Asian populations (~50%).',
    ],

    quickReference: [
      { label: 'O+ (most common US)', value: '37% of US population' },
      { label: 'A+', value: '36% of US population' },
      { label: 'B+', value: '8% of US population' },
      { label: 'AB- (rarest US)', value: '1% of US population' },
      { label: 'Universal Donor', value: 'O- (RBCs), AB (plasma)' },
      { label: 'Universal Recipient', value: 'AB+ (RBCs)' },
      { label: 'ABO Alleles', value: 'I^A, I^B codominant; i recessive' },
      { label: 'Rh Alleles', value: 'R dominant (Rh+), r recessive (Rh-)' },
    ],

    limitations: [
      'This calculator assumes all possible genotypes for a given phenotype are equally likely, but real-world allele frequencies vary dramatically by ancestry and geography. Actual probabilities may differ from the calculated uniform-distribution estimates.',
      'Blood type alone cannot definitively establish or exclude parentage — only genetic testing with DNA markers can do that. A child with type O born to an AB parent is simply impossible, but a match does not prove parentage.',
      'This calculator models classical Mendelian inheritance of ABO and Rh only. It does not account for rare alleles (e.g., cis-AB, Bombay phenotype hh, weak D variants) that occur in specific populations.',
      'The combined ABO+Rh probability multiplies independent ABO and Rh outcomes, which assumes the two systems are genetically unlinked — this is correct (ABO is on chromosome 9, Rh on chromosome 1), but in small populations linkage disequilibrium can create subtle deviations.',
    ],
citations: [
      { source: 'American Red Cross — Blood Types', url: 'https://www.redcrossblood.org/donate-blood/blood-types.html' },
      { source: 'Wikipedia — ABO Blood Group System', url: 'https://en.wikipedia.org/wiki/ABO_blood_group_system' },
      { source: 'NIH — Blood Groups and Red Cell Antigens', url: 'https://www.ncbi.nlm.nih.gov/books/NBK2261/' },
    ],
  },
};

export default bloodTypeConfig;
