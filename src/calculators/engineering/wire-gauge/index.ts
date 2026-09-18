import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import WireGaugePanel from './WireGaugePanel';

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
      step: 0.5,
      required: true,
      helpText: 'The load current the wire must safely carry (breaker rating)',
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
      helpText: 'More conductors in conduit requires derating',
      options: [
        { label: '1-3 conductors (no derating)', value: '1' },
        { label: '4-6 conductors (80% derating)', value: '4' },
        { label: '7-9 conductors (70% derating)', value: '7' },
        { label: '10+ conductors (50% derating)', value: '10' },
      ],
    },
  ],
  calculate: (values) => {
    const current = parseFloat(values.current);
    const material = values.conductorMaterial || 'copper';
    const tempRating = values.insulationType || '75';
    const numConductors = parseInt(values.numConductors || '1');

    if (isNaN(current) || current <= 0) return [];

    const derating = numConductors >= 10 ? 0.5 : numConductors >= 7 ? 0.7 : numConductors >= 4 ? 0.8 : 1.0;
    const adjustedCurrent = current / derating;

    const ampacity: Record<string, Record<string, { awg: string; amps: number }[]>> = {
      copper: {
        '60': [
          { awg: '14', amps: 15 }, { awg: '12', amps: 20 }, { awg: '10', amps: 30 },
          { awg: '8', amps: 40 }, { awg: '6', amps: 55 }, { awg: '4', amps: 70 },
          { awg: '3', amps: 85 }, { awg: '2', amps: 95 }, { awg: '1', amps: 110 },
          { awg: '1/0', amps: 125 }, { awg: '2/0', amps: 145 }, { awg: '3/0', amps: 165 },
        ],
        '75': [
          { awg: '14', amps: 20 }, { awg: '12', amps: 25 }, { awg: '10', amps: 35 },
          { awg: '8', amps: 50 }, { awg: '6', amps: 65 }, { awg: '4', amps: 85 },
          { awg: '3', amps: 100 }, { awg: '2', amps: 115 }, { awg: '1', amps: 130 },
          { awg: '1/0', amps: 150 }, { awg: '2/0', amps: 175 }, { awg: '3/0', amps: 200 },
        ],
        '90': [
          { awg: '14', amps: 25 }, { awg: '12', amps: 30 }, { awg: '10', amps: 40 },
          { awg: '8', amps: 55 }, { awg: '6', amps: 75 }, { awg: '4', amps: 95 },
          { awg: '3', amps: 110 }, { awg: '2', amps: 130 }, { awg: '1', amps: 150 },
          { awg: '1/0', amps: 170 }, { awg: '2/0', amps: 195 }, { awg: '3/0', amps: 225 },
        ],
      },
      aluminum: {
        '75': [
          { awg: '12', amps: 20 }, { awg: '10', amps: 25 }, { awg: '8', amps: 40 },
          { awg: '6', amps: 50 }, { awg: '4', amps: 65 }, { awg: '3', amps: 75 },
          { awg: '2', amps: 90 }, { awg: '1', amps: 100 }, { awg: '1/0', amps: 120 },
          { awg: '2/0', amps: 135 }, { awg: '3/0', amps: 155 },
        ],
      },
    };

    const tableKey = material === 'aluminum' ? '75' : tempRating;
    const table = (ampacity[material] as Record<string, { awg: string; amps: number }[]>)[tableKey] ?? [];

    const recommended = table.find((row) => row.amps >= adjustedCurrent);

    if (!recommended) return [
      { id: 'error', label: 'Wire size exceeds table', value: 'Use 3/0 AWG or larger / consult engineer', highlight: true, color: 'negative' as const },
    ];

    return [
      {
        id: 'recommended',
        label: 'Recommended Wire Gauge',
        value: `${recommended.awg} AWG (${material}) — ${recommended.amps}A rated`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'designCurrent',
        label: 'Design Current (after derating)',
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
      'Wire gauge selection uses NEC Table 310.15 ampacity ratings, adjusted for temperature rating and conduit fill derating factors. The required ampacity must equal or exceed the load current divided by the derating factor.',
    variables: [
      { symbol: 'AWG', name: 'American Wire Gauge', description: 'Smaller AWG number = thicker wire = higher ampacity. 14 AWG is the smallest common household wire. Each gauge step (e.g., 14 to 12) approximately doubles the cross-sectional area.' },
      { symbol: 'Derating', name: 'Conduit Fill Derating', description: 'Multiple conductors in conduit generate mutual heat, requiring derating: 80% for 4-6 conductors, 70% for 7-9, 50% for 10+. This means a 20A circuit in a conduit with 4 conductors must use wire rated for 25A (20 ÷ 0.8).' },
      { symbol: 'Ampacity', name: 'Current-Carrying Capacity', description: 'The maximum continuous current a wire can safely carry without exceeding its insulation temperature rating. Depends on gauge, material, and insulation type.' },
    ],
    howToUse: [
      'Enter the circuit current in amperes.',
      'Select copper or aluminum conductor.',
      'Select the insulation temperature rating.',
      'Select how many conductors share the conduit.',
      'The calculator recommends the correct AWG gauge per NEC tables.',
      'Always consult a licensed electrician for actual installations — local codes may differ.',
    ],
    explanation:
      'Selecting the correct wire gauge is critical for electrical safety. Undersized wire overheats, degrades insulation, and can cause fires. The NEC (National Electrical Code) publishes ampacity tables based on wire gauge, material, and insulation type. When multiple conductors share a conduit, they generate mutual heat and must be derated. Always consult a licensed electrician for actual installations. Real-world scenario: you are running a 20A kitchen circuit with 4 conductors in a conduit (two hots sharing a neutral, plus ground). At 80% derating, the required ampacity is 20 ÷ 0.8 equals 25A. With 75°C rated copper wire, 12 AWG is rated for 25A — just barely sufficient. If the ambient temperature is high (for example an attic), additional derating may push the requirement to 10 AWG. This is why professional electricians always verify ampacity for the specific installation conditions. Another common scenario: running a 50A EV charger circuit. At 75°C copper, 6 AWG is rated for 65A and would work. But if the run is in conduit with 4 other circuits (requiring 80% derating), the effective capacity of 6 AWG drops to 52A — still sufficient for 50A. If there are 7 conductors total, derating to 70% drops capacity to 45.5A, requiring an upgrade to 4 AWG.',
    faqs: [
      {
        question: 'Why is aluminum wiring a concern?',
        answer: 'Aluminum wire expands and contracts more than copper with temperature changes, which can loosen connections over time. It requires special connectors, outlets, and switches rated for aluminum (AL-Cu rated) to prevent fire hazards. Aluminum also has about 40% higher resistance than copper for the same gauge, requiring larger wire sizes.',
      },
      {
        question: 'What AWG is used for common household circuits?',
        answer: '14 AWG for 15A circuits (lighting, general outlets), 12 AWG for 20A circuits (kitchen, bathroom, garage), 10 AWG for 30A circuits (dryers, water heaters, AC units), 8 AWG for 40A circuits (ranges, EV chargers), 6 AWG for 55A circuits (large appliances, subpanels).',
      },
      {
        question: 'What happens if I use wire that is too small for the circuit?',
        answer: 'Undersized wire overheats under load, which degrades the insulation over time and can eventually cause a short circuit or electrical fire. The circuit breaker is sized to protect the wire — never put a 20A breaker on 14 AWG wire (rated for 15A), as the wire would overheat before the breaker trips.',
      },
      {
        question: 'What is voltage drop and when should I worry about it?',
        answer: 'Voltage drop is the reduction in voltage along a wire due to its resistance. Long runs of wire can cause significant voltage drop, which makes motors run hot, lights dim, and equipment malfunction. The NEC recommends keeping voltage drop below 3% for branch circuits and 5% total for the feeder plus branch circuit. For a 120V, 20A circuit at 100 feet with 12 AWG copper, voltage drop is approximately 3.6%, which exceeds the 3% recommendation — you would need to upgrade to 10 AWG for that run length.',
      },
      {
        question: 'What does "derating" mean and why is it necessary?',
        answer: 'Derating means reducing the ampacity of wire because of unfavorable installation conditions. The most common derating factor is conduit fill: when multiple current-carrying conductors share a conduit, they generate mutual heat that cannot dissipate as effectively. NEC Table 310.15(B)(3)(a) requires derating to 80% for 4-6 conductors, 70% for 7-9, and 50% for 10+. Ambient temperature above 86°F (30°C) also requires derating. This is why a 20A circuit might need 10 AWG wire if it runs through a hot attic with multiple other circuits in the same conduit.',
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
      { label: 'Resistance of 12 AWG', value: '~0.0016 Ω/ft' },
      { label: 'Resistance of 14 AWG', value: '~0.0025 Ω/ft' },
      { label: 'Derating: 4-6 conductors', value: '80% of rated ampacity' },
      { label: 'Derating: 7-9 conductors', value: '70% of rated ampacity' },
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
        scenario: 'A homeowner is adding a 20A kitchen appliance circuit. The run is 50 feet through the attic (ambient temperature ~95F) with 4 conductors in the conduit (two hots sharing a neutral, plus ground). What gauge is needed per NEC?',
        inputs: { current: '20', conductorMaterial: 'copper', insulationType: '75', numConductors: '4' },
        result: 'Design current after derating: 25A (20A / 0.80). 14 AWG rated 20A at 75C is insufficient. 12 AWG rated 25A at 75C exactly meets the requirement for the derated 25A load. Recommended: 12 AWG copper.',
        insight: 'Without the derating calculation, 14 AWG might seem adequate since it is rated 20A at 75C — exactly the circuit current. But with 4 conductors in conduit, derating pushes the required ampacity to 25A, requiring 12 AWG. The attic temperature is a secondary concern — at 95F, NEC ambient temperature correction for 75C-rated wire is 0.94, which would further increase the required ampacity to 25/0.94 = 26.6A. In practice, this is still within 12 AWG\'s 25A rating margin, but barely. A conservative electrician might choose 10 AWG for the extra safety margin on a kitchen circuit that may see sustained high loads.',
      },
      {
        scenario: 'An electrician is installing a 50A circuit for a Tesla Wall Connector in a garage. The run is 30 feet through EMT conduit with only the two hot conductors and ground. Ambient temperature is normal (75F). What copper gauge at 75C?',
        inputs: { current: '50', conductorMaterial: 'copper', insulationType: '75', numConductors: '1' },
        result: 'With 1-3 conductors, no derating applies. Design current: 50A. At 75C copper: 10 AWG rated 35A (too low), 8 AWG rated 50A (exact match), 6 AWG rated 65A (ample margin). Recommended: 8 AWG copper.',
        insight: '8 AWG at 75C is rated exactly 50A, which technically meets code. However, EV charging is a continuous load (3+ hours). NEC Article 625 requires EV chargers to be treated as continuous loads, which means the circuit must be sized at 125% of the continuous load: 50A x 1.25 = 62.5A. This pushes the requirement to 6 AWG (rated 65A at 75C). Many electricians use 6 AWG for 50A EV circuits as standard practice for this reason. The 30-foot run length is short enough that voltage drop is not a concern (less than 0.5% at 240V).',
      },
      {
        scenario: 'A solar installer is wiring a 30A DC circuit from solar panels to an inverter, a 150-foot run. The installer is using aluminum wire at 75C with 4 conductors in conduit. What gauge is needed?',
        inputs: { current: '30', conductorMaterial: 'aluminum', insulationType: '75', numConductors: '4' },
        result: 'Design current after 80% derating: 37.5A (30A / 0.80). At 75C aluminum: 10 AWG rated 25A (too low), 8 AWG rated 40A (meets 37.5A requirement). Recommended: 8 AWG aluminum.',
        insight: 'Aluminum wire is common in solar installations for cost savings on long runs. However, voltage drop over 150 feet at 30A DC is significant. Using 8 AWG aluminum (resistance ~0.001 ohm/ft at DC), voltage drop = 2 x 150 x 30 x 0.001 = 9V. At a 48V nominal system voltage, that is 18.75% — far exceeding the 3% recommendation. The installer should consider upsizing to 4 AWG aluminum (voltage drop ~4.7%) or even 2 AWG (voltage drop ~3%) to minimize power loss. This is a case where ampacity alone is not sufficient — voltage drop governs the wire size selection.',
      },
    ],
    proTips: [
      'Always treat continuous loads (running 3+ hours) at 125% of the nameplate rating. A 40A EV charger on a 50A breaker is actually a 50A continuous load per NEC 625 — size wire for 62.5A, not 50A. This is the most common mistake in residential EV charger installations.',
      'Voltage drop becomes the governing factor — not ampacity — on runs longer than 100 feet. For 120V circuits, a 100-foot run with 12 AWG at 20A loses about 3.6V (3%), which is right at the NEC recommendation. For 240V circuits at the same length, the voltage drop percentage is half (since the voltage is double), giving you more headroom. Always check voltage drop separately for long runs — this calculator handles ampacity only.',
      'The ground wire does NOT count toward the conductor count for derating purposes per NEC 310.15(B)(6). If you have 2 hots, 1 neutral, and 1 ground in a conduit, that counts as 3 conductors for derating (ground excluded), keeping you in the 80% derating tier rather than the 70% tier. The neutral only counts if it carries current under normal conditions (not just for fault conditions).',
      'Aluminum wire requires anti-oxidation compound on ALL connections, even those rated AL-CU. The oxide layer on aluminum is non-conductive and forms within minutes of exposure to air. Wire-brush the stripped conductor, apply anti-oxidant immediately, and torque connections to manufacturer specification. Re-torque after thermal cycling if accessible. Most aluminum wiring failures trace back to improper connection technique, not the wire itself.',
      'When in doubt between two gauges, choose the larger wire (smaller AWG number). The marginal cost of upsizing one gauge step is usually minimal for residential runs under 100 feet, but the safety margin is substantial. The cost difference between 14 AWG and 12 AWG Romex is roughly $0.15/foot — on a 50-foot circuit, that is $7.50 for significantly more safety margin and future-proofing.',
    ],
    limitations: [
      'This calculator uses NEC Table 310.15 ampacity values at 30C (86F) ambient with standard derating factors for conduit fill. Ambient temperature correction factors above 30C (attics, engine compartments, direct sunlight exposure) are not applied — a separate temperature correction may be required.',
      'Voltage drop over distance is NOT calculated. For runs over 100 feet, voltage drop may govern wire size rather than ampacity. A separate voltage drop calculation is required for long wire runs.',
      'Continuous vs. non-continuous load classification per NEC Article 100 is not handled. Continuous loads (3+ hours) require 125% sizing — the user must apply this multiplier to the input current before using the calculator.',
      'Special occupancies with modified ampacity rules (healthcare facilities per NEC 517, hazardous locations per NEC 500-516, theaters, agricultural buildings, marinas) are not covered. These environments have stricter wiring requirements.',
      'Wire gauge selection is a life-safety decision. Always consult a licensed electrician and your local Authority Having Jurisdiction (AHJ) for actual installations. Local code amendments may be more restrictive than the NEC.',
    ],
    citations: [
      { source: 'Wikipedia', title: 'American Wire Gauge', url: 'https://en.wikipedia.org/wiki/American_wire_gauge' },

    ],
  },
};

export default wireGaugeConfig;
