import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import WireGaugePanel from './WireGaugePanel';
import { AMPACITY, AWG_SIZES, SMALL_CONDUCTOR_MAX_OCPD, conduitDerating, type Material } from './awgData';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

const wireGaugeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'current',
      label: 'Circuit Current (Amperes)',
      type: 'number',
      placeholder: '20',
      unit: 'A',
      inputMode: 'decimal',
      min: 0,
      max: 1000,
      step: 0.5,
      required: true,
      helpText: 'The load current / overcurrent-device (breaker) rating the wire must serve. Wires up to 10 AWG are also capped by the NEC 240.4(D) small-conductor rule (14 AWG: 15 A, 12 AWG: 20 A, 10 AWG: 30 A for copper).',
    },
    {
      id: 'loadType',
      label: 'Load Type',
      type: 'select',
      helpText: 'NEC 210.19(A) / 215.2 size continuous loads (running 3 hours or more, e.g. EV chargers, lighting) at 125% of the load.',
      options: [
        { label: 'Non-continuous', value: 'normal' },
        { label: 'Continuous (3+ hours) — size at 125%', value: 'continuous' },
      ],
    },
    {
      id: 'conductorMaterial',
      label: 'Conductor Material',
      type: 'select',
      required: true,
      helpText: 'Copper is standard; aluminum requires larger gauge for the same current',
      options: [
        { label: 'Copper', value: 'copper' },
        { label: 'Aluminum', value: 'aluminum' },
      ],
    },
    {
      id: 'insulationType',
      label: 'Insulation Temperature Rating',
      type: 'select',
      showWhen: (values) => values.conductorMaterial !== 'aluminum',
      options: [
        { label: '60°C (THHN/THWN in conduit, low temp)', value: '60' },
        { label: '75°C (THWN-2, most common)', value: '75' },
        { label: '90°C (THHN, dry locations)', value: '90' },
      ],
      helpText: 'Higher rating allows more current for the same wire gauge. Aluminum conductors in this calculator use the standard 75°C ampacity table.',
    },
    {
      id: 'numConductors',
      label: 'Conductors in Conduit',
      type: 'select',
      helpText: 'Number of CURRENT-CARRYING conductors (NEC 310.15(C)(1)). Equipment grounding conductors are not counted, and a neutral that only carries unbalanced current is not counted either.',
      options: [
        { label: '1-3 conductors (no derating)', value: '1' },
        { label: '4-6 conductors (80% derating)', value: '4' },
        { label: '7-9 conductors (70% derating)', value: '7' },
        { label: '10-20 conductors (50% derating)', value: '10' },
        { label: '21-30 conductors (45% derating)', value: '21' },
        { label: '31-40 conductors (40% derating)', value: '31' },
        { label: '41+ conductors (35% derating)', value: '41' },
      ],
    },
  ],
  calculate: (values) => {
    const current = parseFloat(values.current);
    const material: Material = values.conductorMaterial === 'aluminum' ? 'aluminum' : 'copper';
    const tempRating = values.insulationType || '75';
    const numConductors = parseInt(values.numConductors || '1', 10);
    const continuous = values.loadType === 'continuous';

    if (!Number.isFinite(current) || current <= 0) return [];

    const derating = conduitDerating(numConductors);
    const designBase = continuous ? current * 1.25 : current;
    const adjustedCurrent = designBase / derating;

    const tableKey = material === 'aluminum' ? 'aluminum75' : (`copper${['60', '75', '90'].includes(tempRating) ? tempRating : '75'}` as 'copper60' | 'copper75' | 'copper90');
    const table = AMPACITY[tableKey];
    const small = SMALL_CONDUCTOR_MAX_OCPD[material];

    const recommended = AWG_SIZES.map((awg) => ({ awg, amps: table[awg] })).find(
      (row) => row.amps !== undefined && row.amps >= adjustedCurrent && current <= (small[row.awg] ?? Infinity),
    );

    if (!recommended || recommended.amps === undefined) {
      return [
        { id: 'error', label: 'Wire size exceeds table', value: 'Larger than 4/0 AWG needed — use parallel conductors / consult an engineer', highlight: true, color: 'negative' as const },
      ];
    }

    return [
      {
        id: 'recommended',
        label: 'Recommended Wire Gauge',
        value: `${recommended.awg} AWG (${material}) — ${recommended.amps}A rated`,
        highlight: true,
        color: 'positive',
        ...(tempRating === '90' && material === 'copper'
          ? { warning: 'The 90°C column may be used for derating only. Unless the terminals at both ends are also rated 90°C (rare), NEC 110.14(C) limits the circuit to the 75°C (or 60°C) ampacity — check the 75°C result as well.' }
          : {}),
      },
      {
        id: 'designCurrent',
        label: continuous ? 'Design Current (125% continuous, after derating)' : 'Design Current (after derating)',
        value: `${adjustedCurrent.toFixed(1)} A`,
        color: 'neutral',
      },
      {
        id: 'derating',
        label: 'Derating Factor Applied',
        value: `${(derating * 100).toFixed(0)}%`,
        color: derating < 1 ? 'neutral' : 'positive',
      },
    ];
  },
  explainSteps: (values) => {
    const current = parseFloat(values.current);
    const material: Material = values.conductorMaterial === 'aluminum' ? 'aluminum' : 'copper';
    const tempRating = values.insulationType || '75';
    const numConductors = parseInt(values.numConductors || '1', 10);
    const continuous = values.loadType === 'continuous';
    if (!Number.isFinite(current) || current <= 0) return [];
    const derating = conduitDerating(numConductors);
    const designBase = continuous ? current * 1.25 : current;
    const adjusted = designBase / derating;
    const tableKey = material === 'aluminum' ? 'aluminum75' : (`copper${['60', '75', '90'].includes(tempRating) ? tempRating : '75'}` as 'copper60' | 'copper75' | 'copper90');
    const table = AMPACITY[tableKey];
    const small = SMALL_CONDUCTOR_MAX_OCPD[material];
    const rows = AWG_SIZES.map((awg) => ({ awg, amps: table[awg] }));
    const byAmps = rows.find((r) => r.amps !== undefined && r.amps >= adjusted);
    const pick = rows.find((r) => r.amps !== undefined && r.amps >= adjusted && current <= (small[r.awg] ?? Infinity));
    if (!pick || pick.amps === undefined || !byAmps) return [];
    const col = material === 'aluminum' ? '75 °C aluminum' : `${tableKey.replace('copper', '')} °C copper`;
    const f = (x: number) => String(parseFloat(x.toFixed(2)));
    const steps: ExplainStep[] = [];
    steps.push(continuous
      ? { label: 'Continuous load: size for 125%', expr: `${f(current)} A × 1.25 = ${f(designBase)} A`, note: 'A load that runs 3 hours or more is sized at 125%.' }
      : { label: 'Design current', expr: `${f(current)} A (not a continuous load, so no 125% uplift)` });
    steps.push({ label: 'Adjust for the number of conductors in the conduit', expr: `${f(designBase)} A ÷ ${derating} = ${adjusted.toFixed(1)} A`, note: derating < 1 ? `${numConductors} conductors in one raceway use a ${f(derating * 100)}% factor.` : '1 to 3 conductors need no derating.' });
    steps.push({ label: `Smallest wire whose ${col} ampacity covers it`, expr: `${byAmps.awg} AWG is rated ${byAmps.amps} A ≥ ${adjusted.toFixed(1)} A`, note: 'Ampacity comes from NEC Table 310.16 (30 °C ambient).' });
    if (pick.awg !== byAmps.awg) {
      steps.push({ label: 'Small-conductor overcurrent limit', expr: `${byAmps.awg} AWG ${material} is limited to ${small[byAmps.awg]} A of protection, below your ${f(current)} A, so step up to ${pick.awg} AWG (${pick.amps} A)`, note: 'NEC 240.4(D) caps the breaker size on the smallest conductors.' });
    }
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WireGaugePanel, { values, results });
  },
  educational: {
    formula: 'Required Ampacity = Load Current ÷ Derating Factor | Select next AWG at or above this ampacity',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="80" width="320" height="200" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" rx="8"/><rect x="100" y="110" width="240" height="8" fill="var(--svg-3b82f6)" rx="4"/><rect x="100" y="130" width="240" height="12" fill="var(--svg-3b82f6)" rx="4"/><rect x="100" y="155" width="240" height="18" fill="var(--svg-3b82f6)" rx="4"/><rect x="100" y="185" width="240" height="26" fill="var(--svg-3b82f6)" rx="4"/><rect x="100" y="225" width="240" height="35" fill="var(--svg-3b82f6)" rx="4"/><text x="80" y="118" text-anchor="end" font-size="10" fill="var(--svg-333333)">14</text><text x="80" y="140" text-anchor="end" font-size="10" fill="var(--svg-333333)">12</text><text x="80" y="168" text-anchor="end" font-size="10" fill="var(--svg-333333)">10</text><text x="80" y="202" text-anchor="end" font-size="10" fill="var(--svg-333333)">8</text><text x="80" y="248" text-anchor="end" font-size="10" fill="var(--svg-333333)">6</text><text x="360" y="118" font-size="10" fill="var(--svg-666666)">AWG</text><text x="220" y="310" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Smaller AWG = Thicker Wire = Higher Ampacity</text></svg>',
      alt: 'Horizontal bars of increasing thickness comparing wire gauges from 14 AWG to 6 AWG',
      caption: 'Wire gauge comparison — smaller AWG number means thicker wire with higher ampacity',
    },
    formulaDescription:
      'Wire gauge selection uses NEC Table 310.16 ampacity ratings (310.15(B)(16) in older editions), adjusted for continuous loads and conduit-fill derating. The table ampacity must equal or exceed the load (×125% if continuous) divided by the derating factor, and the NEC 240.4(D) small-conductor limits must also be met.',
    variables: [
      { symbol: 'AWG', name: 'American Wire Gauge', description: 'Smaller AWG number = thicker wire = higher ampacity. 14 AWG is the smallest common household wire. Each AWG step changes the cross-sectional area by about 26%; every three steps doubles it.' },
      { symbol: 'Derating', name: 'Conduit Fill Derating', description: 'Multiple current-carrying conductors in a raceway generate mutual heat, requiring derating (NEC 310.15(C)(1)): 80% for 4-6 conductors, 70% for 7-9, 50% for 10-20, then 45%, 40% and 35% for larger bundles. This means a 20A circuit in a conduit with 4 conductors must use wire rated for 25A (20 ÷ 0.8).' },
      { symbol: 'Ampacity', name: 'Current-Carrying Capacity', description: 'The maximum continuous current a wire can safely carry without exceeding its insulation temperature rating. Depends on gauge, material, and insulation type.' },
    ],
    howToUse: [
      'Enter the circuit current in amperes.',
      'Select copper or aluminum conductor.',
      'Select the insulation temperature rating.',
      'Say whether the load is continuous (3+ hours) and how many current-carrying conductors share the conduit.',
      'The calculator recommends the correct AWG gauge per NEC tables.',
      'Always consult a licensed electrician for actual installations — local codes may differ.',
    ],
    explanation:
      'Selecting the correct wire gauge is critical for electrical safety. Undersized wire overheats, degrades insulation, and can cause fires. The NEC (National Electrical Code) publishes ampacity tables based on wire gauge, material, and insulation type. When multiple conductors share a conduit, they generate mutual heat and must be derated. Always consult a licensed electrician for actual installations. Real-world scenario: you are running two 20A kitchen circuits in one conduit (four current-carrying conductors). At 80% derating, the required ampacity is 20 ÷ 0.8 equals 25A. With 75°C rated copper wire, 12 AWG is rated for 25A — just barely sufficient. If the ambient temperature is high (for example an attic), additional derating may push the requirement to 10 AWG. This is why professional electricians always verify ampacity for the specific installation conditions. Another common scenario: running a 50A EV charger circuit. At 75°C copper, 6 AWG is rated for 65A and would work. But if the run is in conduit with 4 other circuits (requiring 80% derating), the effective capacity of 6 AWG drops to 52A — still sufficient for 50A. If there are 7 conductors total, derating to 70% drops capacity to 45.5A, requiring an upgrade to 4 AWG.',
    faqs: [
      {
        question: 'Why is aluminum wiring a concern?',
        answer: 'Aluminum wire expands and contracts more than copper with temperature changes, which can loosen connections over time. It requires special connectors, outlets, and switches rated for aluminum (AL-Cu rated) to prevent fire hazards. Aluminum also has about 60% higher resistance than copper for the same gauge and lower ampacity, requiring larger wire sizes.',
      },
      {
        question: 'What AWG is used for common household circuits?',
        answer: 'Typical copper sizes: 14 AWG for 15A circuits (lighting, general outlets), 12 AWG for 20A circuits (kitchen, bathroom, garage), 10 AWG for 30A circuits (dryers, water heaters, AC units), 8 AWG for 40A circuits, 6 AWG for 55A circuits (60°C column). Always confirm against the code edition and equipment terminal ratings used locally.',
      },
      {
        question: 'What happens if I use wire that is too small for the circuit?',
        answer: 'Undersized wire overheats under load, which degrades the insulation over time and can eventually cause a short circuit or electrical fire. The circuit breaker is sized to protect the wire — never put a 20A breaker on 14 AWG wire (rated for 15A), as the wire would overheat before the breaker trips.',
      },
      {
        question: 'What is voltage drop and when should I worry about it?',
        answer: 'Voltage drop is the reduction in voltage along a wire due to its resistance. Long runs can cause significant voltage drop, which makes motors run hot, lights dim, and equipment malfunction. The NEC gives an informational recommendation (not a requirement) of 3% for branch circuits and 5% total for feeder plus branch. For a 120V, 20A circuit with 50 feet of one-way run in 12 AWG copper, the drop is 2 × 50 × 20 × 1.98 / 1000 = 3.96 V, or 3.3%, so 10 AWG (2.07%) would be the better choice; at 100 feet one-way, 12 AWG gives 6.6%. Use the Voltage Drop calculator for the exact figure.',
      },
      {
        question: 'What does "derating" mean and why is it necessary?',
        answer: 'Derating means reducing the ampacity of wire because of unfavorable installation conditions. The most common derating factor is conduit fill: when multiple current-carrying conductors share a conduit, they generate mutual heat that cannot dissipate as effectively. NEC 310.15(C)(1) requires derating to 80% for 4-6 current-carrying conductors, 70% for 7-9, 50% for 10-20, and less beyond that. Ambient temperature above 86°F (30°C) also requires correction. This is why a 20A circuit might need 10 AWG wire if it runs through a hot attic with multiple other circuits in the same conduit.',
      },
      {
        question: 'Can I mix copper and aluminum wire in the same circuit?',
        answer: 'Copper and aluminum should never be directly connected without an approved AL-CU rated connector or anti-oxidation compound. Direct contact causes galvanic corrosion — the two dissimilar metals react electrochemically in the presence of moisture, causing the connection to degrade and overheat over time. When transitioning from aluminum to copper (common in older homes with aluminum branch circuits), use a special connector approved for both metals. This is one of the most common fire hazards found in homes built between 1965 and 1973.',
      },
    ],
    quickReference: [
      { label: '14 AWG Copper (60°C)', value: '15 A (lighting, outlets)' },
      { label: '12 AWG Copper (60°C)', value: '20 A (kitchen, bathroom)' },
      { label: '10 AWG Copper (60°C)', value: '30 A (dryer, AC)' },
      { label: '8 AWG Copper (60°C)', value: '40 A (range, EV charger)' },
      { label: '6 AWG Copper (60°C)', value: '55 A (subpanel, large appliance)' },
      { label: 'Resistance of 12 AWG copper', value: '1.98 Ω/1000 ft (NEC Ch. 9 Table 8, 75°C)' },
      { label: 'Resistance of 14 AWG copper', value: '3.14 Ω/1000 ft (NEC Ch. 9 Table 8, 75°C)' },
      { label: 'Derating: 4-6 conductors', value: '80% of rated ampacity' },
      { label: 'Derating: 7-9 conductors', value: '70% of rated ampacity' },
      { label: 'Derating: 10-20 conductors', value: '50% of rated ampacity' },
      { label: 'Continuous load', value: 'Size at 125% of the load' },
    ],
    commonUses: [
      'Home electrical wiring — select the correct wire gauge for new circuits, whether running lighting in 14 AWG or installing a 50A EV charger circuit in 6 AWG copper',
      'Industrial panel building — size power and control wiring for motor control centers, PLC cabinets, and distribution panels per NEC code requirements',
      'Solar panel installation — calculate wire gauge between panels, inverter, and battery bank to minimize voltage drop over long DC runs at high current',
      'Automotive and marine wiring — choose wire sizes for 12V and 24V systems where voltage drop is more critical due to the lower voltage baseline',
      'Audio system installation — select appropriate speaker wire gauge based on run length and impedance to minimize signal loss and maintain audio quality',
    ],
    workedExamples: [
      {
        scenario: 'A homeowner is adding a 20A kitchen appliance circuit. The run is 50 feet through the attic (ambient temperature ~95F) in a conduit with 4 current-carrying conductors (two 2-wire circuits; grounds not counted). What gauge is needed per NEC?',
        inputs: { current: '20', conductorMaterial: 'copper', insulationType: '75', numConductors: '4' },
        result: 'Design current after derating: 25A (20A / 0.80). 14 AWG rated 20A at 75C is insufficient (and 14 AWG is also limited to a 15A breaker by NEC 240.4(D)). 12 AWG rated 25A at 75C exactly meets the requirement for the derated 25A load. Recommended: 12 AWG copper.',
        insight: 'Without the derating calculation, 14 AWG might seem adequate since it is rated 20A at 75C — exactly the circuit current — but NEC 240.4(D) already caps it at 15A. With 4 conductors in conduit, derating pushes the required ampacity to 25A, requiring 12 AWG. The attic temperature is a secondary concern — at 95F, NEC ambient temperature correction for 75C-rated wire is 0.94, which would further increase the required ampacity to 25/0.94 = 26.6A. In practice, this is still within 12 AWG\'s 25A rating margin, but barely. A conservative electrician might choose 10 AWG for the extra safety margin on a kitchen circuit that may see sustained high loads.',
      },
      {
        scenario: 'An electrician is installing a 50A circuit for an EV charger (continuous load) in a garage. The run is 30 feet through EMT conduit with only the two hot conductors and ground. Ambient temperature is normal (75F). What copper gauge at 75C?',
        inputs: { current: '50', loadType: 'continuous', conductorMaterial: 'copper', insulationType: '75', numConductors: '1' },
        result: 'Continuous load: design current 50 × 1.25 = 62.5A. At 75C copper: 8 AWG rated 50A (too low), 6 AWG rated 65A. Recommended: 6 AWG copper.',
        insight: 'Treated as a non-continuous load, 8 AWG at 75C (rated exactly 50A) would pass. EV charging is a continuous load (3+ hours), so NEC Article 625 and 210.19(A) require the circuit to be sized at 125% of the load: 50A × 1.25 = 62.5A, which pushes the requirement to 6 AWG (rated 65A at 75C). The 30-foot run length is short enough that voltage drop is not a concern (about 0.6% at 240V).',
      },
      {
        scenario: 'A solar installer is wiring a 30A DC circuit from solar panels to an inverter, a 150-foot run. The installer is using aluminum wire at 75C with 4 conductors in conduit. What gauge is needed?',
        inputs: { current: '30', conductorMaterial: 'aluminum', insulationType: '75', numConductors: '4' },
        result: 'Design current after 80% derating: 37.5A (30A / 0.80). At 75C aluminum: 10 AWG rated 25A (too low), 8 AWG rated 40A (meets 37.5A requirement). Recommended: 8 AWG aluminum.',
        insight: 'Aluminum is sometimes used for cost savings on long runs, but voltage drop over 150 feet at 30A is significant. 8 AWG aluminum is 1.28 Ω/1000 ft, so the drop is 2 × 150 × 30 × 0.00128 = 11.5V, which is 24% of a 48V nominal system — far over the 3% recommendation. 4 AWG aluminum (0.508 Ω/1000 ft) still drops 4.6V (9.5%); 2 AWG (0.319) 2.9V (6.0%); 1/0 AWG (0.201) 1.8V (3.8%); 3/0 AWG (0.126) 1.1V (2.4%). This is a case where ampacity alone is not sufficient — voltage drop governs the wire size, so run the Voltage Drop calculator too.',
      },
    ],
    proTips: [
      'Treat continuous loads (running 3+ hours) at 125% of the load — this calculator does it for you when you choose "Continuous". A 40A EV charger needs a 50A circuit, and the wire is then sized for 50A (the breaker), which is why many installers use 6 AWG copper.',
      'Voltage drop often becomes the governing factor — not ampacity — on long runs. For a 120V, 20A circuit with 12 AWG copper, 50 feet one-way drops about 3.96V (3.3%) and 100 feet one-way about 7.9V (6.6%). At 240V the percentage is half for the same current and wire. This calculator handles ampacity only; check voltage drop separately for long runs.',
      'Equipment grounding conductors do NOT count toward the number of current-carrying conductors for derating. A neutral that carries only the unbalanced current of a balanced multiwire circuit does not count either, but a neutral that carries harmonic or full return current does.',
      'Aluminum wire requires anti-oxidation compound on ALL connections, even those rated AL-CU. The oxide layer on aluminum is non-conductive and forms within minutes of exposure to air. Wire-brush the stripped conductor, apply anti-oxidant immediately, and torque connections to manufacturer specification. Re-torque after thermal cycling if accessible. Most aluminum wiring failures trace back to improper connection technique, not the wire itself.',
      'When in doubt between two gauges, choose the larger wire (smaller AWG number): a modest cost for a real safety and voltage-drop margin on residential runs.',
    ],
    limitations: [
      'This calculator uses NEC Table 310.16 ampacity values at 30C (86F) ambient with standard conduit-fill derating factors, plus the NEC 240.4(D) small-conductor limits. Terminal temperature limits (NEC 110.14(C)) and special rules such as the 83% service-entrance factor are not applied. Ambient temperature correction factors above 30C (attics, engine compartments, direct sunlight exposure) are not applied — a separate temperature correction may be required.',
      'Voltage drop over distance is NOT calculated. For runs over 100 feet, voltage drop may govern wire size rather than ampacity. A separate voltage drop calculation is required for long wire runs.',
      'Special occupancies with modified ampacity rules (healthcare facilities per NEC 517, hazardous locations per NEC 500-516, theaters, agricultural buildings, marinas) are not covered. These environments have stricter wiring requirements.',
      'Wire gauge selection is a life-safety decision. Always consult a licensed electrician and your local Authority Having Jurisdiction (AHJ) for actual installations. Local code amendments may be more restrictive than the NEC.',
    ],
    citations: [
      { source: 'Wikipedia', title: 'American Wire Gauge', url: 'https://en.wikipedia.org/wiki/American_wire_gauge' },

    ],
  },
};

export default wireGaugeConfig;
