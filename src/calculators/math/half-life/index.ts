import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HalfLifePanel from './HalfLifePanel';

const halfLifeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'Solve For',
      type: 'select',
      required: true,
      options: [
        { label: 'Remaining Quantity (Nt)', value: 'remainingQuantity' },
        { label: 'Initial Quantity (N₀)', value: 'initialQuantity' },
        { label: 'Half-Life (t₁₂⁄₂)', value: 'halfLife' },
        { label: 'Time Elapsed (t)', value: 'timeElapsed' },
      ],
    },
    {
      id: 'initialQuantity',
      label: 'Initial Quantity (N₀)',
      type: 'number',
      placeholder: '100',
      min: 0,
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The starting amount of the substance at t = 0',
      showWhen: (v) => v.solveFor !== 'initialQuantity',
    },
    {
      id: 'remainingQuantity',
      label: 'Remaining Quantity (Nₜ)',
      type: 'number',
      placeholder: '25',
      min: 0,
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The amount remaining after time t',
      showWhen: (v) => v.solveFor !== 'remainingQuantity',
    },
    {
      id: 'halfLife',
      label: 'Half-Life (t₁₂⁄₂)',
      type: 'number',
      placeholder: '5',
      min: 0,
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The time required for the quantity to reduce to half its initial value',
      showWhen: (v) => v.solveFor !== 'halfLife',
    },
    {
      id: 'timeElapsed',
      label: 'Time Elapsed (t)',
      type: 'number',
      placeholder: '10',
      min: 0,
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The total time that has passed',
      showWhen: (v) => v.solveFor !== 'timeElapsed',
    },
  ],
  calculate: (values) => {
    const solveFor = values.solveFor;

    let N0 = NaN;
    let Nt = NaN;
    let t12 = NaN;
    let t = NaN;

    if (solveFor === 'remainingQuantity') {
      N0 = parseFloat(values.initialQuantity);
      t12 = parseFloat(values.halfLife);
      t = parseFloat(values.timeElapsed);
      if ([N0, t12, t].some(isNaN) || N0 <= 0 || t12 <= 0 || t < 0) return [];
      Nt = N0 * Math.pow(0.5, t / t12);
    } else if (solveFor === 'initialQuantity') {
      Nt = parseFloat(values.remainingQuantity);
      t12 = parseFloat(values.halfLife);
      t = parseFloat(values.timeElapsed);
      if ([Nt, t12, t].some(isNaN) || Nt <= 0 || t12 <= 0 || t < 0) return [];
      N0 = Nt / Math.pow(0.5, t / t12);
    } else if (solveFor === 'halfLife') {
      N0 = parseFloat(values.initialQuantity);
      Nt = parseFloat(values.remainingQuantity);
      t = parseFloat(values.timeElapsed);
      if ([N0, Nt, t].some(isNaN) || N0 <= 0 || Nt <= 0 || Nt >= N0 || t <= 0) return [];
      // t1/2 = t * ln(2) / ln(N0 / Nt)
      t12 = (t * Math.LN2) / Math.log(N0 / Nt);
    } else if (solveFor === 'timeElapsed') {
      N0 = parseFloat(values.initialQuantity);
      Nt = parseFloat(values.remainingQuantity);
      t12 = parseFloat(values.halfLife);
      if ([N0, Nt, t12].some(isNaN) || N0 <= 0 || Nt <= 0 || Nt >= N0 || t12 <= 0) return [];
      // t = t1/2 * ln(N0 / Nt) / ln(2)
      t = (t12 * Math.log(N0 / Nt)) / Math.LN2;
    } else {
      return [];
    }

    if (!isFinite(Nt) || !isFinite(N0) || !isFinite(t12) || !isFinite(t)) return [];

    const fmt = (n: number): string => {
      if (!isFinite(n)) return '—';
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toPrecision(10)).toString();
    };

    return [
      {
        id: solveFor,
        label:
          solveFor === 'remainingQuantity'
            ? 'Remaining Quantity (Nₜ)'
            : solveFor === 'initialQuantity'
              ? 'Initial Quantity (N₀)'
              : solveFor === 'halfLife'
                ? 'Half-Life (t₁₂⁄₂)'
                : 'Time Elapsed (t)',
        value: fmt(
          solveFor === 'remainingQuantity'
            ? Nt
            : solveFor === 'initialQuantity'
              ? N0
              : solveFor === 'halfLife'
                ? t12
                : t
        ),
        highlight: true,
        color: 'positive',
      },
      { id: 'initialQuantity', label: 'Initial Quantity (N₀)', value: fmt(N0), color: 'neutral' },
      { id: 'remainingQuantity', label: 'Remaining Quantity (Nₜ)', value: fmt(Nt), color: 'neutral' },
      { id: 'halfLife', label: 'Half-Life (t₁₂⁄₂)', value: fmt(t12), color: 'neutral' },
      { id: 'timeElapsed', label: 'Time Elapsed (t)', value: fmt(t), color: 'neutral' },
      { id: 'halfLives', label: 'Half-Lives Elapsed', value: t12 > 0 ? fmt(t / t12) : '—', color: 'neutral' },
      {
        id: 'percentRemaining',
        label: 'Percentage Remaining',
        value: N0 > 0 ? `${parseFloat(((Nt / N0) * 100).toPrecision(6))}%` : '—',
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HalfLifePanel, { values, results });
  },
  educational: {
    formula: 'N(t) = N₀ × (1/2)^(t / t₁₂⁄₂)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Exponential Decay &amp; Half-Life</text><line x1="40" y1="290" x2="400" y2="290" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="294" font-size="12" fill="var(--svg-666666)">Time</text><line x1="60" y1="290" x2="60" y2="40" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="66" y="38" font-size="12" fill="var(--svg-666666)">N</text><path d="M60,60 C80,70 100,85 140,120 C180,155 220,175 280,200 C320,212 360,220 400,225" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="5" fill="var(--svg-ef4444)"/><text x="45" y="52" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">N&#8320;</text><line x1="140" y1="120" x2="140" y2="300" stroke="var(--svg-22c55e)" stroke-width="1.5" stroke-dasharray="5,3"/><text x="140" y="315" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-22c55e)">t&#8321;&#8260;&#8322; (half-life)</text><circle cx="140" cy="120" r="5" fill="var(--svg-22c55e)"/><text x="155" y="115" font-size="12" font-weight="bold" fill="var(--svg-22c55e)">N&#8320;/2</text><line x1="220" y1="175" x2="220" y2="300" stroke="var(--svg-22c55e)" stroke-width="1.5" stroke-dasharray="5,3"/><text x="220" y="315" text-anchor="middle" font-size="12" fill="var(--svg-22c55e)">2 &times; t&#8321;&#8260;&#8322;</text><circle cx="220" cy="175" r="5" fill="var(--svg-22c55e)"/><text x="235" y="170" font-size="12" font-weight="bold" fill="var(--svg-22c55e)">N&#8320;/4</text><text x="220" y="248" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Decay Formula</text><text x="220" y="270" text-anchor="middle" font-size="14" fill="var(--svg-555555)">N(t) = N&#8320; &times; (1/2)^(t / t&#8321;&#8260;&#8322;)</text></svg>',
      alt: 'Exponential decay curve on a coordinate plane showing initial quantity N0 decreasing by half after each half-life period',
      caption: 'The half-life is the time required for a quantity to reduce to half its initial value',
    },
    formulaDescription:
      'The radioactive decay formula describes how a quantity of a radioactive substance decreases over time. The half-life (t₁₂⁄₂) is the time required for the quantity to reduce to half its initial value. After each half-life, exactly half of the remaining atoms decay, producing an exponential decay curve. This same formula applies to any process that follows first-order kinetics, including drug elimination from the body and capacitor discharge.',
    variables: [
      {
        symbol: 'N₀, N(t)',
        name: 'Initial & Remaining Quantity',
        description: 'N₀ is the starting amount of the substance at time t = 0. N(t) is the amount remaining after time t has passed. Both can be measured in atoms, grams, moles, or any proportional unit.',
      },
      {
        symbol: 't₁₂⁄₂',
        name: 'Half-Life',
        description: 'The characteristic time constant: the time required for the quantity to fall to exactly half its current value. Each isotope has a unique half-life.',
      },
      {
        symbol: 't',
        name: 'Time Elapsed',
        description: 'The total elapsed time since the initial measurement. Measured in the same time units as the half-life.',
      },
    ],
    howToUse: [
      'Select which variable you want to solve for using the dropdown menu.',
      'Enter values for the three known variables (the field for the unknown variable will be hidden).',
      'All values must be positive numbers. The remaining quantity must be less than the initial quantity when solving for half-life or time elapsed.',
      'Review the detailed results, including the number of half-lives elapsed and the percentage remaining.',
      'Explore the decay progression table and the SVG decay curve in the panel below the results.',
    ],
    workedExamples: [
      {
        scenario: 'Archaeologist Dr. Chen is carbon-dating a wooden tool found at a dig site in Peru. Living wood contains approximately 1.0 units of carbon-14. The sample now shows 0.35 units. Carbon-14 has a half-life of 5,730 years. How old is the artifact, and is it likely from the Inca period (1400-1532 CE) or an earlier civilization?',
        inputs: { solveFor: 'timeElapsed', initialQuantity: '1', remainingQuantity: '0.35', halfLife: '5730' },
        result: 'Time elapsed ≈ 8,679 years (about 1.5 half-lives)',
        insight: 'Time elapsed ≈ 8,679 years. This places the artifact at approximately 6,650 BCE — much older than the Inca period. This date corresponds to the Late Archaic period in South America. Dr. Chen should consider whether the site stratigraphy supports this date, as it suggests a pre-ceramic hunter-gatherer culture rather than the Inca. Carbon dating is reliable up to about 50,000 years (roughly 8-9 half-lives of C-14), after which the remaining C-14 is too small to measure accurately — this 8,679-year date is well within the reliable range.',
      },
      {
        scenario: 'Pharmacist Ms. Rodriguez is counseling a patient taking a new antibiotic. The drug has an elimination half-life of 4 hours, and the effective therapeutic level is 15 mg in the bloodstream. The patient takes a 500 mg dose at 8:00 AM. At what time will the drug level drop below the therapeutic threshold, indicating it is time for the next dose?',
        inputs: { solveFor: 'timeElapsed', initialQuantity: '500', remainingQuantity: '15', halfLife: '4' },
        result: 'Time elapsed ≈ 20.2 hours (about 5.05 half-lives)',
        insight: 'Time elapsed ≈ 20.2 hours. The drug level drops below the therapeutic threshold around 4:12 AM the next morning — well before the next scheduled dose at 8:00 AM. This is a dosing gap of nearly 4 hours where the infection is not being effectively treated. Ms. Rodriguez should recommend either a more frequent dosing schedule (every 16-18 hours) or a higher initial dose to maintain coverage through the night. Many antibiotics use a loading dose strategy precisely to avoid this problem.',
      },
      {
        scenario: 'Nuclear safety engineer Mr. Thompson is evaluating a spent fuel rod from a decommissioned reactor. The rod initially contained 50 kg of Strontium-90 (half-life 28.8 years). Regulations require the radioactivity to drop to 0.1% of original levels before the rod can be moved to long-term geological storage. How many years must the rod cool in the spent fuel pool?',
        inputs: { solveFor: 'timeElapsed', initialQuantity: '50', remainingQuantity: '0.05', halfLife: '28.8' },
        result: 'Time elapsed ≈ 287 years (about 10 half-lives)',
        insight: 'Time elapsed ≈ 287 years. Strontium-90 requires storage and monitoring for approximately 287 years to reach 0.1% of its original activity level. This illustrates why nuclear waste management is a multi-generational challenge — the waste created today will need to be managed by societies centuries from now. In practice, spent fuel pools provide initial cooling for 5-10 years, after which dry cask storage is used for the remaining centuries.',
      },
    ],
    proTips: [
      'Use consistent time units for half-life and elapsed time. If the half-life is in years, enter elapsed time in years. The calculator handles pure numbers — you are responsible for unit consistency.',
      'After about 10 half-lives, less than 0.1% of the original quantity remains (1/2^10 = 1/1024 ≈ 0.098%). For practical purposes, a radioactive source is considered "negligible" after 10 half-lives, and "essentially gone" after 20 half-lives.',
      'The Solve For dropdown is your most powerful feature — you can calculate any of the four variables (N0, Nt, t1/2, t) from the other three. This makes the calculator useful for carbon dating (solve for t), dose planning (solve for t), material identification (solve for t1/2), and waste management (solve for Nt).',
      'For drug half-life problems: most medications follow first-order elimination kinetics and this formula applies. However, alcohol and some drugs (phenytoin, aspirin at high doses) follow zero-order kinetics — a constant amount is eliminated per hour, not a constant fraction. This calculator will give wrong results for zero-order drugs.',
      'The decay constant (λ = ln(2) / t1/2) is a useful derived value. If λ = 0.0693 per year, that means approximately 6.93% of the substance decays each year. Multiply by the current quantity to estimate annual decay rate.',
    ],
    limitations: [
      'This formula assumes pure exponential decay (first-order kinetics). It does not apply to processes with zero-order kinetics (constant absolute rate) or other decay patterns such as logistic decay or bathtub-curve failure rates.',
      'For very small remaining quantities (below 1 × 10^-15 of original), floating-point precision in JavaScript may introduce rounding errors. For subatomic quantities, use specialized nuclear physics software with arbitrary precision.',
      'The calculator treats all quantities as dimensionless numbers. You must ensure unit consistency between initial quantity, remaining quantity, and between half-life and elapsed time. Mixing grams with moles or days with years will produce numerically correct but physically meaningless results.',
      'This calculator models single, isolated decay processes. It does not account for decay chains (where a daughter product is also radioactive and undergoes further decay), which require solving coupled differential equations.',
      'Environmental factors (temperature, pressure, chemical bonding, electromagnetic fields) have negligible effects on radioactive decay rates for most isotopes. However, for electron capture decay modes, extreme pressure or chemical environments can cause measurable (though very small) changes to the half-life — this calculator assumes constant half-life regardless of conditions.',
    ],
    quickReference: [
      { label: '1 half-life', value: '50% remains' },
      { label: '2 half-lives', value: '25% remains' },
      { label: '3 half-lives', value: '12.5% remains' },
      { label: '4 half-lives', value: '6.25% remains' },
      { label: '5 half-lives', value: '3.125% remains' },
      { label: '7 half-lives', value: '~0.78% remains' },
      { label: '10 half-lives', value: '~0.098% remains (negligible)' },
      { label: 'Decay constant (λ)', value: 'λ = ln(2) / t₁₂⁄₂' },
      { label: 'C-14 half-life', value: '5,730 years' },
      { label: 'U-238 half-life', value: '4.468 billion years' },
    ],
    commonUses: [
      'Carbon-14 dating in archaeology and paleontology to determine the age of organic artifacts up to ~50,000 years old',
      'Pharmacokinetics — calculating drug elimination rates, dosing intervals, and time to reach steady-state concentration',
      'Nuclear medicine — determining the shelf life of radiopharmaceuticals and planning patient isolation times after radioisotope therapy',
      'Nuclear waste management — calculating storage duration requirements for spent fuel to decay below regulatory thresholds',
      'Environmental science — modeling the persistence of pollutants and pesticides in soil and groundwater using half-life degradation rates',
    ],
    explanation:
      'Radioactive decay is a random process at the atomic level, but for large numbers of atoms, it follows a precise exponential law. The half-life is independent of the starting amount: after one half-life, half of the original atoms remain; after two half-lives, one-quarter remain; after three, one-eighth; and so on. This means the quantity never reaches zero — it asymptotically approaches it. The number of half-lives elapsed (n = t / t₁₂⁄₂) determines the fraction remaining: (1/2)^n. This concept extends beyond radioactivity to carbon dating, pharmacokinetics (drug half-life), nuclear medicine, environmental science, and any system exhibiting first-order exponential decay.',
    faqs: [
      {
        question: 'Can the remaining quantity ever reach exactly zero?',
        answer: 'No. Exponential decay is asymptotic — the quantity gets closer and closer to zero but never reaches it in finite time. In practice, after about 10 half-lives, less than 0.1% of the original quantity remains (1/2¹⁰ ≈ 0.00098), which is often below detection limits and treated as zero for practical purposes.',
      },
      {
        question: 'What is the difference between half-life and mean lifetime?',
        answer: 'The half-life (t₁₂⁄₂) is the time for half the atoms to decay. The mean lifetime (τ) is the average time an atom survives before decaying. They are related by τ = t₁₂⁄₂ / ln(2) ≈ 1.443 × t₁₂⁄₂. The decay constant λ = 1/τ = ln(2) / t₁₂⁄₂.',
      },
      {
        question: 'Can I use this calculator for drug half-life / pharmacokinetics?',
        answer: 'Yes. Many drugs follow first-order elimination kinetics, meaning a constant fraction of the drug is eliminated per unit time. The same formula applies: the amount of drug in the body decreases by half each half-life. However, some drugs follow zero-order kinetics (constant rate elimination), for which this formula does not apply.',
      },
      {
        question: 'What units should I use?',
        answer: 'Any consistent time units for half-life and elapsed time (seconds, minutes, hours, years, etc.). The initial and remaining quantities can be in any proportional unit (grams, moles, atoms, Becquerels, etc.) as long as they use the same unit. The calculator handles pure numbers — you provide the units context.',
      },
      {
        question: 'Why must the remaining quantity be less than the initial quantity?',
        answer: 'For radioactive decay (and exponential decay in general), the remaining quantity after any positive time must be less than the initial quantity. If the "remaining" amount equals or exceeds the initial amount, either no time has passed (t = 0) or the quantity has grown, which corresponds to exponential growth, not decay. Use an exponential growth formula instead.',
      },
      {
        question: 'Can I use this calculator for population decline or other non-nuclear decay processes?',
        answer: 'Yes, any process that follows first-order exponential decay will work. Examples include: population decline of endangered species (if death rate is proportional to population), capacitor discharge in electronics (RC circuit voltage decay follows V(t) = V0 * e^(-t/RC), which is mathematically identical to radioactive decay with half-life = RC * ln(2)), the cooling of coffee (Newton\'s law of cooling), depreciation of some assets, and the fading of ink or pigments over time. However, many real-world decay processes are better modeled by second-order kinetics or complex multi-compartment models — verify your process follows first-order kinetics before using this formula.',
      },
      {
        question: 'What happens if I calculate beyond 10 half-lives — does the formula still work?',
        answer: 'Yes, the formula works mathematically for any number of half-lives. After 20 half-lives, the fraction remaining is (1/2)^20 = 1/1,048,576 ≈ 0.000095%. However, for radioactive decay, there is a practical limit: when the number of remaining atoms becomes very small (fewer than ~100 atoms), the statistical nature of decay becomes apparent, and the smooth exponential curve no longer accurately describes individual atom behavior. For carbon-14 dating (t1/2 = 5,730 years), the practical limit is about 50,000 years (8-9 half-lives) — beyond this, accelerator mass spectrometry is required because the remaining C-14 is below the detection limit of conventional beta counting.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Half-Life', url: 'https://en.wikipedia.org/wiki/Half-life' },
      { source: 'NIH - Radioactivity: Half-Life', url: 'https://www.niehs.nih.gov/health/topics/agents/radon' },
    ],
  },
};

export default halfLifeConfig;
