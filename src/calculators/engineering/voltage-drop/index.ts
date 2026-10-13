import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import VoltageDropPanel from './VoltageDropPanel';
import { OHMS_PER_KFT, voltageDropVolts, type Awg, type Material } from '../wire-gauge/awgData';

const voltageDropConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'voltage',
      label: 'Source Voltage',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '120',
      unit: 'V',
      min: 0,
      max: 100000,
      step: 0.1,
      required: true,
      helpText: 'Supply voltage at the breaker panel (e.g., 120V, 240V)',
    },
    {
      id: 'current',
      label: 'Load Current',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '15',
      unit: 'A',
      min: 0,
      max: 10000,
      step: 0.1,
      required: true,
      helpText: 'Current drawn by the load (circuit breaker rating or nameplate)',
    },
    {
      id: 'wireLength',
      label: 'One-Way Wire Length',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '50',
      unit: 'ft',
      min: 0,
      max: 100000,
      step: 1,
      required: true,
      helpText: 'Distance from source to load (one way). Total circuit length is doubled.',
    },
    {
      id: 'wireGauge',
      label: 'Wire Gauge (AWG)',
      type: 'select',
      required: true,
      helpText: 'Select the wire gauge — smaller AWG means thicker wire with lower resistance',
      options: [
        { label: '14 AWG (15A circuit)', value: '14' },
        { label: '12 AWG (20A circuit)', value: '12' },
        { label: '10 AWG (30A circuit)', value: '10' },
        { label: '8 AWG (40A circuit)', value: '8' },
        { label: '6 AWG (55A circuit)', value: '6' },
        { label: '4 AWG (70A circuit)', value: '4' },
        { label: '3 AWG', value: '3' },
        { label: '2 AWG (95A circuit)', value: '2' },
        { label: '1 AWG', value: '1' },
        { label: '1/0 AWG (125A circuit)', value: '1/0' },
        { label: '2/0 AWG', value: '2/0' },
        { label: '3/0 AWG', value: '3/0' },
        { label: '4/0 AWG', value: '4/0' },
      ],
    },
    {
      id: 'conductorMaterial',
      label: 'Conductor Material',
      type: 'select',
      helpText: 'Copper has lower resistance than aluminum but costs more. Aluminum building wire starts at 12 AWG (NEC 310.106(B)).',
      options: [
        { label: 'Copper', value: 'copper' },
        { label: 'Aluminum', value: 'aluminum' },
      ],
    },
  ],
  calculate: (values) => {
    const sourceV = parseFloat(values.voltage);
    const current = parseFloat(values.current);
    const length = parseFloat(values.wireLength);
    const gauge = values.wireGauge || '12';
    const material = values.conductorMaterial || 'copper';

    if (![sourceV, current, length].every(Number.isFinite) || sourceV <= 0 || current <= 0 || length <= 0) return [];

    // NEC Chapter 9 Table 8 (stranded, 75 °C) - shared with wire-gauge and math/voltage-drop
    const mat: Material = material === 'aluminum' ? 'aluminum' : 'copper';
    // 14 AWG aluminium has no Table 8 entry: use the copper value x 1.64 (the 12 AWG Al/Cu ratio) as a labelled hypothetical
    const resistancePer1000ft = OHMS_PER_KFT[mat][gauge as Awg] ?? (mat === 'aluminum' && gauge === '14' ? OHMS_PER_KFT.copper['14']! * (3.25 / 1.98) : undefined);
    if (resistancePer1000ft === undefined) return [];

    const totalLength = length * 2;
    const wireResistance = (resistancePer1000ft / 1000) * totalLength;
    const voltageDrop = voltageDropVolts(current, length, resistancePer1000ft, 'single');
    const voltageDropPct = (voltageDrop / sourceV) * 100;
    const voltageAtLoad = sourceV - voltageDrop;

    const getDropColor = (pctIn: number): 'positive' | 'neutral' | 'negative' => {
      const pct = Math.round(pctIn * 100) / 100; // classify on the displayed 2-dp percentage
      if (pct <= 3) return 'positive';
      if (pct <= 5) return 'neutral';
      return 'negative';
    };

    const powerLossWatts = current * current * wireResistance;

    return [
      {
        id: 'voltageDrop',
        label: 'Voltage Drop',
        ...(mat === 'aluminum' && gauge === '14' ? { warning: 'Aluminum building wire is not made in 14 AWG (NEC 310.106(B) starts at 12 AWG); 14 AWG is shown only as a hypothetical.' } : {}),
        value: `${voltageDrop.toFixed(3)} V (${voltageDropPct.toFixed(2)}%)`,
        highlight: true,
        color: getDropColor(voltageDropPct),
      },
      {
        id: 'voltageAtLoad',
        label: 'Voltage at Load',
        value: `${voltageAtLoad.toFixed(2)} V`,
        color: Math.round(voltageDropPct * 100) / 100 <= 5 ? 'positive' : 'negative',
      },
      {
        id: 'wireResistance',
        label: 'Total Wire Resistance',
        value: `${wireResistance.toFixed(4)} Ω`,
        color: 'neutral',
      },
      {
        id: 'wattsLost',
        label: 'Power Loss in Wires',
        value: `${powerLossWatts.toFixed(2)} W (${((powerLossWatts / (sourceV * current)) * 100).toFixed(2)}% of total)`,
        color: powerLossWatts > 0.03 * sourceV * current ? 'negative' : 'neutral',
      },
      {
        id: 'nec',
        label: 'NEC Guideline (informational, not mandatory)',
        value: Math.round(voltageDropPct * 100) / 100 <= 3 ? 'Pass — within the 3% branch-circuit recommendation' : Math.round(voltageDropPct * 100) / 100 <= 5 ? 'Marginal — over 3% but within the 5% feeder + branch recommendation' : 'Fail — exceeds the 5% recommendation',
        color: getDropColor(voltageDropPct),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(VoltageDropPanel, { values, results });
  },
  educational: {
    formula: 'Voltage Drop = Current × (Resistance/1000 ft × Total Wire Length)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="120" y="60" width="200" height="50" fill="var(--svg-3b82f6)" rx="8"/><text x="220" y="90" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Power Source 120V</text><line x1="220" y1="110" x2="220" y2="150" stroke="var(--svg-666666)" stroke-width="2"/><rect x="80" y="150" width="280" height="4" fill="var(--svg-666666)"/><rect x="80" y="150" width="100" height="4" fill="var(--svg-ef4444)"/><rect x="260" y="150" width="100" height="4" fill="var(--svg-ef4444)"/><rect x="100" y="180" width="240" height="50" fill="var(--svg-22c55e)" rx="8"/><text x="220" y="210" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Load (Motor)</text><line x1="220" y1="230" x2="220" y2="260" stroke="var(--svg-666666)" stroke-width="2"/><rect x="80" y="260" width="280" height="4" fill="var(--svg-666666)"/><text x="130" y="145" font-size="11" fill="var(--svg-ef4444)">Drop</text><text x="330" y="145" font-size="11" fill="var(--svg-ef4444)">Drop</text><text x="220" y="295" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Voltage Drop = Wire Resistance x Current x Length</text></svg>',
      alt: 'Circuit diagram showing power source, wires with voltage drop, and a load',
      caption: 'Voltage drop occurs along both conductors between source and load',
    },
    formulaDescription:
      'Voltage drop is calculated using the wire resistance (NEC Chapter 9 Table 8, stranded conductors at 75°C) multiplied by the round-trip current path length. The NEC gives an informational recommendation (210.19(A), 215.2(A) notes) of 3% for branch circuits and 5% for feeder plus branch combined; it is not a mandatory requirement.',
    variables: [
      { symbol: 'R', name: 'Wire Resistance', description: 'Copper and aluminum have different resistivity values. Resistance increases with length and decreases with wire gauge (smaller AWG number = thicker wire = lower resistance).' },
      { symbol: 'NEC 3%', name: 'NEC Recommended Max', description: 'The National Electrical Code recommends voltage drop not exceed 3% for branch circuits and 5% for feeder + branch combined.' },
      { symbol: 'Conductor', name: 'Conductor Material', description: 'Aluminum has about 60% higher resistance than copper of the same gauge (copper is about 40% lower), but aluminum is lighter and cheaper. Aluminum requires special termination connectors.' },
    ],
    quickReference: [
      { label: '14 AWG Copper', value: '3.14 Ω/1000ft — 15A max circuit. Common for residential lighting/receptacle branch circuits.' },
      { label: '12 AWG Copper', value: '1.98 Ω/1000ft — 20A max circuit. Standard for kitchen, bathroom, and garage GFCI circuits.' },
      { label: '10 AWG Copper', value: '1.24 Ω/1000ft — 30A max circuit. Water heaters, dryers, air conditioners.' },
      { label: '8 AWG Copper', value: '0.778 Ω/1000ft — 40A max circuit. Electric ranges, small subpanels.' },
      { label: '6 AWG Copper', value: '0.491 Ω/1000ft — 55A max circuit. Large subpanels, EV chargers, hot tubs.' },
      { label: 'NEC 3% Rule', value: 'Branch circuits max 3% voltage drop. Feeder + branch combined max 5%. An informational note in NEC 210.19(A) and 215.2(A), not an enforceable rule.' },
      { label: 'Aluminum vs Copper', value: 'Aluminum has ~60% higher resistance per gauge and starts at 12 AWG. Requires anti-oxidant compound and AL-rated terminations.' },
    ],
    workedExamples: [
      {
        scenario: 'Outdoor shed 100ft away on 120V, 15A load, 14 AWG copper',
        inputs: { voltage: '120', current: '15', wireLength: '100', wireGauge: '14', conductorMaterial: 'copper' },
        result: 'Voltage drop: 9.42 V (7.85%) — FAILS NEC 3% recommendation. Upsize to 10 AWG or larger.',
        insight: 'The one-way run is 100 ft, so total circuit length is 200 ft. 14 AWG copper resistance is 3.14 Ω/1000ft, so total resistance = 0.628 Ω. Voltage drop = 15A x 0.628 Ω = 9.42V, or 7.85% — well over the 3% NEC recommendation. You will likely see dimmed lights, slow motor starting, and ~141W of power being wasted as heat in the wires. Upsize to at least 10 AWG copper to bring the drop to ~3% (or even 8 AWG for future-proofing).',
      },
      {
        scenario: '240V well pump 300ft from the house running 10A on 10 AWG copper',
        inputs: { voltage: '240', current: '10', wireLength: '300', wireGauge: '10', conductorMaterial: 'copper' },
        result: 'Voltage drop: 7.44 V (3.1%) — marginal, marginally over NEC 3% recommendation.',
        insight: 'Total circuit length = 600 ft. With 10 AWG copper at 1.24 Ω/1000ft, total resistance = 0.744 Ω. Voltage drop = 10A x 0.744 Ω = 7.44V (3.1%). This is marginally over the 3% recommendation. The pump will start noticeably slower and run hotter over its lifetime. Running 8 AWG copper reduces the drop to 1.9% — a modest upfront investment that saves energy and extends pump life over decades.',
      },
      {
        scenario: 'EV charger on 240V, 48A continuous load, 50ft run with 6 AWG copper',
        inputs: { voltage: '240', current: '48', wireLength: '50', wireGauge: '6', conductorMaterial: 'copper' },
        result: 'Voltage drop: 2.36 V (0.98%) — PASSES NEC 3% recommendation comfortably.',
        insight: 'Total circuit length = 100 ft. 6 AWG copper resistance = 0.491 Ω/1000ft, so total resistance = 0.0491 Ω. Voltage drop = 48A x 0.0491 Ω = 2.36V (0.98%). This passes comfortably. But note: for continuous loads like EV chargers, NEC requires sizing at 125% of the load (60A breaker for 48A charging). If you were on a 100 ft run instead, the drop would double to ~4.72V (1.97%) — still passing but getting marginal. For longer runs, consider 4 AWG or even 2 AWG copper.',
      },
    ],
    proTips: [
      'For continuous loads (3+ hours, like EV chargers, lighting, or HVAC), NEC requires sizing the circuit to 125% of the load. Always account for this before using the calculator values.',
      'Use the power loss result (wattsLost) to estimate energy waste over time. A 50W continuous loss at $0.15/kWh wastes about $66/year. Over a 30-year installation, that is nearly $2,000 — potentially more than the cost difference of upsizing the wire.',
      'For balanced 3-phase circuits the line-to-line drop is √3 × I × R × L instead of 2 × I × R × L, i.e. 0.866 times the single-phase figure for the same current and wire. This calculator is single-phase only; use the Math > Voltage Drop calculator for three-phase.',
      'Always measure the actual one-way distance along the wire path, not as the crow flies: wire follows joists, conduit bends and service loops, so the real run is usually longer than a straight-line measurement.',
      'If your calculated drop is borderline (2.5-3.5%), consider upsizing the wire. The marginal cost of the next gauge is usually modest compared to the labor of replacing it later, and the energy savings compound over the life of the building.',
    ],
    limitations: [
      'Resistances are NEC Chapter 9 Table 8 values for stranded conductors at 75°C. A conductor running cooler is less resistive (copper changes about 0.4% per °C), so a lightly loaded wire at 25-30°C drops about 20% less than shown, while one near its 90°C rating drops more.',
      'The calculator assumes single-phase circuits (or DC). For 3-phase multiply the single-phase result by 0.866. It does not account for power factor (reactance), which becomes significant for wire sizes larger than 2 AWG or for motor loads with low power factor.',
      'Conduit fill, ambient temperature derating, and termination temperature ratings (60C vs 75C column in NEC ampacity tables) are also not considered. Always consult a licensed electrician for critical installations and verify compliance with your local electrical code requirements.',
    ],
    howToUse: [
      'Enter the source voltage and load current.',
      'Enter the one-way wire run length in feet.',
      'Select the wire gauge and conductor material.',
      'The calculator checks compliance with the 3% NEC recommended maximum.',
      'Check the power loss (wattsLost) to understand energy waste over time.',
      'If voltage drop exceeds 3%, try a larger gauge wire or shorter run.',
    ],
    explanation:
      'Excessive voltage drop causes motors to run hot, lights to dim, and sensitive electronics to malfunction. The NEC recommends a maximum 3% voltage drop for branch circuits. If your calculation shows more than 3% drop, upsize the wire gauge. Each step of two AWG sizes (e.g., 12 to 10) reduces resistance by about 37% (1.98 to 1.24 Ω/1000 ft). Long wire runs — to outbuildings, outdoor lighting, or subpanels — are the most common sources of voltage drop problems. Real-world example: running 120V to a shed 100 feet away with a 15A load on 14 AWG copper. One-way equals 100 ft, round-trip equals 200 ft. Resistance of 14 AWG copper is 3.14 Ω per 1,000 ft, so total resistance equals 0.628 Ω. Voltage drop equals 15A times 0.628 Ω which is 9.42V, or 7.85 percent — well over the 3% NEC recommendation and likely to cause dim lights and slow motor starting. Upsizing to 10 AWG copper (1.24 Ω per 1000ft) drops resistance to 0.248 Ω and voltage drop to 3.72V (3.1 percent) — just within acceptable range. For a 240V well pump 300 feet from the house running at 10A, even 10 AWG copper produces a drop of 7.44V (3.1 percent). 8 AWG drops it to 4.67V (1.9 percent) — a safer choice that also reduces energy waste over the lifetime of the installation.',
    commonUses: [
      'Sizing electrical wire gauges for residential, commercial, or industrial wiring projects to meet NEC code requirements',
      'Planning long wire runs to outbuildings, subpanels, outdoor lighting, or well pumps where voltage drop is a concern',
      'Choosing between copper and aluminum conductors based on resistance, cost, and installation requirements for a given circuit length',
    ],
    faqs: [
      {
        question: 'Why does voltage drop matter?',
        answer: 'Voltage drop makes motors run hotter and start poorly, reduces lighting output (incandescent output falls steeply with voltage), and can cause sensitive electronics to malfunction or fail to start. It also wastes energy as heat in the wire.',
      },
      {
        question: 'Should I use the one-way or round-trip distance?',
        answer: 'Enter the one-way distance — the calculator automatically doubles it to account for both the hot and neutral (or return) conductors of the complete circuit. For 3-phase circuits, the calculation differs and requires a different formula. Multiply the single-phase result by 0.866 for balanced 3-phase.',
      },
      {
        question: 'Does aluminum wire need special handling?',
        answer: 'Yes. Aluminum wire requires anti-oxidant compound at connections, special AL-CU rated outlets and switches, and torque-wrench tightening. Aluminum expands and contracts more than copper with temperature changes, which can loosen connections over time — a known fire hazard if not installed correctly.',
      },
      {
        question: 'How does temperature affect voltage drop?',
        answer: 'Copper resistance changes by about 0.4% per degree Celsius. The table values used here are for 75C conductor temperature, so a wire running at 25C has roughly 20% less resistance, and one running hotter than 75C has more. The NEC ampacity correction factors for ambient temperature (Table 310.15(B)(1)) are a separate matter from voltage drop.',
      },
      {
        question: 'What gauge wire do I need for a 200-amp residential service?',
        answer: 'For 200A residential service entrance, typical requirements are 2/0 AWG copper or 4/0 AWG aluminum. However, service entrance calculations are different from branch circuit voltage drop — they involve NEC load calculations, local utility requirements, and are not simply determined by voltage drop alone. This calculator is designed for branch circuits and feeders, not service entrances. Always consult a licensed electrician for service panel installations.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Voltage Drop', url: 'https://en.wikipedia.org/wiki/Voltage_drop' },
      { source: 'Wikipedia', title: 'Voltage', url: 'https://en.wikipedia.org/wiki/Voltage' },
      { source: 'NFPA 70 (NEC)', title: 'National Electrical Code, Article 210.19', url: 'https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70' },
    ],
  },
};

export default voltageDropConfig;
