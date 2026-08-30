import { CalculatorConfig } from '../../../types/calculator';

const bufferConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'pKa',
      label: 'Acid Dissociation Constant (pKa)',
      type: 'number',
      placeholder: '4.76',
      inputMode: 'decimal',
      min: -2,
      max: 16,
      step: 0.01,
      required: true,
      helpText: 'Supports both metric (SI) and imperial units. pKa of the weak acid in the buffer. Acetic acid: 4.76, Phosphoric acid (pKa1): 2.15, Carbonic acid: 6.35, Tris: 8.07, Ammonium: 9.25.',
    },
    {
      id: 'pH',
      label: 'Buffer pH',
      type: 'number',
      placeholder: '4.76',
      inputMode: 'decimal',
      min: -2,
      max: 16,
      step: 0.01,
      required: true,
      helpText: 'The pH at which you want to know the buffer capacity. Buffer capacity is maximum when pH = pKa.',
    },
    {
      id: 'concentration',
      label: 'Total Buffer Concentration (C)',
      type: 'number',
      placeholder: '0.1',
      unit: 'mol/L',
      inputMode: 'decimal',
      min: 0.0001,
      step: 0.01,
      required: true,
      helpText: 'Total concentration of the buffer system (acid + conjugate base). Typical lab buffers: 0.05–0.2 M.',
},
],
calculate: (values) => {
    const pKa = parseFloat(values.pKa);
    const pH = parseFloat(values.pH);
    const C = parseFloat(values.concentration);

    if (isNaN(pKa) || isNaN(pH) || isNaN(C) || C <= 0) return [];

    const Ka = Math.pow(10, -pKa);
    const H = Math.pow(10, -pH);
    const beta = 2.303 * C * (Ka * H) / Math.pow((Ka + H), 2);

    const fmt = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 4 });
    const ratio = Math.pow(10, pH - pKa);
    const baseFraction = (100 / (1 + (1/ratio))).toFixed(1);
    const acidFraction = (100 - parseFloat(baseFraction)).toFixed(1);

    let effectiveness = '';
    if (Math.abs(pH - pKa) < 0.5) effectiveness = 'Excellent — pH within ±0.5 of pKa, maximum buffering';
    else if (Math.abs(pH - pKa) < 1.0) effectiveness = 'Good — pH within 1 unit of pKa, strong buffering';
    else if (Math.abs(pH - pKa) < 2.0) effectiveness = 'Weak — pH more than 1 unit from pKa, buffering is declining';
    else effectiveness = 'Poor — pH too far from pKa. Choose a buffer with pKa closer to target pH';

    return [
      { id: 'bufferCapacity', label: 'Buffer Capacity (β)', value: fmt(beta) + ' mol/L·pH', highlight: true, color: 'positive' },
      { id: 'effectiveness', label: 'Buffering Effectiveness', value: effectiveness, color: Math.abs(pH - pKa) <= 1 ? 'positive' : 'negative' },
      { id: 'acidBaseRatio', label: 'Acid/Base Distribution', value: `${acidFraction}% acid (HA) / ${baseFraction}% base (A⁻)`, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `β = 2.303 × C × Ka[H⁺] / (Ka + [H⁺])²`, color: 'neutral' },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'β = 2.303 × C × (Ka × [H⁺]) / (Ka + [H⁺])²',
    formulaDescription: 'Buffer capacity (β) measures how much strong acid or base a buffer can neutralize before the pH changes by 1 unit. Maximum β occurs when pH = pKa (the concentrations of acid and conjugate base are equal). At this point, β_max = 0.576 × C. Buffer capacity drops sharply when |pH − pKa| > 1.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Buffer Capacity</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>acid-base buffer chemistry</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: acid-base buffer chemistry</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Buffer Capacity showing key concepts and the acid-base buffer chemistry domain',
      caption: 'This buffer capacity covers acid-base buffer chemistry. Use the worked examples to verify your understanding and bookmark for quick reference.',
    },
    variables: [
      { symbol: 'β', name: 'Buffer Capacity', description: 'Defined as dC/dpH — the moles of strong acid or base needed to change 1 L of buffer by 1 pH unit. Units: mol/(L·pH). Higher β means more resistance to pH change.' },
      { symbol: 'C', name: 'Total Buffer Concentration', description: 'Sum of weak acid [HA] and conjugate base [A⁻] concentrations in mol/L. Doubling C doubles β. Practical lab buffers are 0.05–0.2 M.' },
      { symbol: 'Ka', name: 'Acid Dissociation Constant', description: 'Ka = 10^(-pKa). The equilibrium constant for HA ⇌ H⁺ + A⁻. A smaller pKa means a stronger acid (larger Ka).' },
      { symbol: '[H⁺]', name: 'Hydrogen Ion Concentration', description: '[H⁺] = 10^(-pH). The proton concentration in mol/L. pH = −log₁₀[H⁺].' },
    ],
    howToUse: [
      'Enter the pKa of your weak acid (e.g., 4.76 for acetic acid).',
      'Enter the desired pH for the buffer solution.',
      'Enter the total buffer concentration in mol/L.',
      'Check the acid/base distribution to verify the buffer composition.',
      'If effectiveness is "Poor", choose a buffer with pKa closer to your target pH.',
    ],
    quickReference: [
      { label: 'pH = pKa', value: 'Max capacity: β = 0.576×C' },
      { label: 'pH = pKa ± 1', value: 'β drops to ~33% of max' },
      { label: 'pH = pKa ± 2', value: 'β drops to ~4% of max — too weak' },
      { label: 'Acetic acid buffer', value: 'pKa 4.76, effective range 3.76–5.76' },
      { label: 'Phosphate buffer (pKa2)', value: 'pKa 7.20, effective range 6.20–8.20' },
      { label: 'Tris buffer', value: 'pKa 8.07, effective range 7.07–9.07' },
      { label: 'Carbonate buffer', value: 'pKa 6.35, effective range 5.35–7.35' },
      { label: 'Ammonium buffer', value: 'pKa 9.25, effective range 8.25–10.25' },
    ],
    commonUses: [
      'Biochemistry labs — Tris, HEPES, and phosphate buffers maintain enzyme activity at physiological pH (6.8–8.0).',
      'Pharmaceutical formulation — drug stability depends critically on pH; buffer capacity determines shelf life.',
      'Blood pH regulation — the bicarbonate/carbonic acid buffer (pKa 6.35) maintains blood at pH 7.4.',
      'Swimming pool chemistry — carbonate buffer capacity prevents rapid pH swings from rain, swimmers, and chemicals.',
      'Industrial process control — fermentation, electroplating, and textile dyeing all require precise pH control.',
    ],
    explanation: 'Buffer capacity is one of the most important yet misunderstood concepts in chemistry. Discovered qualitatively by Lawrence Henderson (1908) and quantified by Karl Hasselbalch (1916), the Henderson-Hasselbalch equation (pH = pKa + log[A⁻]/[HA]) describes buffer equilibrium. Buffer capacity (β), formalized by Donald Van Slyke in 1922, goes further — it answers "how much acid or base can I add before the pH crashes?" The maximum capacity occurs at pH = pKa, where equal amounts of weak acid and conjugate base are present. At this sweet spot, β = 0.576 × C — adding 0.0576 moles of strong acid to 1 L of a 0.1 M buffer changes the pH by exactly 1 unit. This is a small fraction of the total buffer present, which is why buffers have limited capacity. The "buffer range" (pH = pKa ± 1) covers roughly two pH units where β > 33% of maximum — beyond this range, the buffer is essentially exhausted. Smart buffer design involves choosing a weak acid with pKa within 0.5 units of the target pH and using sufficient total concentration.',
    faqs: [
      {
        question: 'What is the maximum buffer capacity and when does it occur?',
        answer: 'Maximum buffer capacity β_max = 0.576 × C occurs when pH = pKa — exactly half the weak acid is deprotonated, so [HA] = [A⁻] = C/2. At this point, the buffer is equally capable of neutralizing added acid or base. This is why good buffer design always matches pKa to target pH.',
      },
      {
        question: 'Why does buffer capacity drop sharply when pH differs from pKa?',
        answer: 'When pH ≠ pKa, the acid/base ratio shifts dramatically: at pH = pKa + 1, [A⁻]/[HA] = 10/1 (91% base, 9% acid); at pH = pKa + 2, it jumps to 100/1 (99% base). With almost all buffer in one form, adding acid when the buffer is mostly base still works, but adding base when the buffer is mostly base — there is nothing left to neutralize it. This asymmetry is captured mathematically by the (Ka·[H⁺])/(Ka+[H⁺])² term.',
      },
      {
        question: 'How do I choose the right buffer for my experiment?',
        answer: 'Choose a weak acid with pKa within 0.5 units of your target pH. Consider: (1) biochemical compatibility — Tris and HEPES are biologically inert; phosphate can chelate Mg²⁺; (2) temperature sensitivity — Tris pKa shifts -0.028/°C, so a Tris buffer at pH 8.0 at 4°C becomes pH 7.3 at 37°C; (3) ionic strength effects — high salt concentrations shift apparent pKa values. Always calibrate your pH meter at the working temperature.',
      },
      {
        question: 'Can I use a strong acid or base as a buffer?',
        answer: 'No. Strong acids (HCl) and bases (NaOH) dissociate completely and provide zero buffer capacity near neutral pH. Buffering requires a weak acid and its conjugate base in equilibrium. Near pH 1 or pH 13, strong acids/bases DO provide some buffering simply because [H⁺] or [OH⁻] are so high that small additions are negligible — but this is not practical buffer design.',
      },
      {
        question: 'How does temperature affect buffer capacity?',
        answer: 'Temperature shifts pKa values (typically -0.002 to -0.03 per °C), which moves the buffer away from its optimal pH. Tris buffer is notorious: ΔpKa/°C = -0.028, so a Tris buffer prepared at pH 8.0 at room temperature (25°C) will be pH 8.56 in the cold room (4°C). Always prepare buffers at the temperature they will be used. Buffer capacity itself is temperature-independent (it depends only on C and the pKa-pH difference).',
      },
    ],
    proTips: [
      'The 1:1 rule: for maximum buffer capacity, make [HA] = [A⁻]. Weight out equal moles of weak acid and its conjugate base salt, or half-neutralize the weak acid with strong base.',
      'For biological work: phosphate buffer (pKa2 = 7.20) is excellent for pH 6.5–7.5 at 25°C, but avoid it when magnesium or calcium ions are present — they form insoluble phosphate precipitates.',
      'Buffer capacity is additive: a mixture of two buffers (e.g., acetate + phosphate) has capacity at both pKa values. This "universal buffer" approach covers a wide pH range.',
      'Always calculate capacity before running an experiment. If your reaction produces 0.01 M H⁺ and your buffer capacity is 0.005 mol/L·pH, your pH will drift by 2 units — enough to denature most proteins.',
    ],
    workedExamples: [
      {
        scenario: 'You need an acetic acid buffer at pH 4.76 with 0.1 M total concentration. What is the buffer capacity?',
        inputs: { pKa: '4.76', pH: '4.76', concentration: '0.1' },
        result: 'Buffer capacity β = 0.0576 mol/(L·pH) — maximum possible at pH = pKa.',
        insight: 'At pH = pKa, β = 0.576 × 0.1 = 0.0576 mol/(L·pH). This means adding 0.00576 moles of HCl to 1 L would change pH by 0.1 units. The buffer is 50% acetic acid, 50% acetate — perfectly balanced.',
      },
      {
        scenario: 'The same buffer is being used at pH 5.76 (1 unit above pKa). What happens to capacity?',
        inputs: { pKa: '4.76', pH: '5.76', concentration: '0.1' },
        result: 'Buffer capacity β = 0.019 mol/(L·pH) — dropped to 33% of maximum.',
        insight: 'At pH = pKa + 1, β = 2.303 × 0.1 × (1.74×10⁻⁵ × 1.74×10⁻⁶) / (1.74×10⁻⁵ + 1.74×10⁻⁶)² = 0.019 mol/(L·pH). Capacity has dropped to 33% of maximum — adding the same amount of acid would now shift pH 3× further. The buffer is 91% acetate, only 9% acetic acid — nearly exhausted for acid neutralization.',
      },
    ],

    limitations: [
      'This calculator uses the Van Slyke equation for a monoprotic weak acid buffer. It does not account for polyprotic buffers (phosphate, citrate, carbonate) which have multiple pKa values and overlapping buffer regions.',
      'Ionic strength effects on apparent pKa are not included. At very low concentrations (< 0.001 M), the autoionization of water contributes to buffering but is not modeled.',
      'The formula assumes ideal solution behavior — concentrated solutions (> 0.5 M) deviate from ideality.',
    ],
  citations: [
      { source: 'Wikipedia — Buffer Capacity', url: 'https://en.wikipedia.org/wiki/Buffer_solution' },
      { source: 'Buffer Capacity — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default bufferConfig;
