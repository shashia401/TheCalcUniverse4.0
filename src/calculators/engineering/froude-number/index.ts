import { CalculatorConfig } from '../../../types/calculator';

const froudeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'velocity',
      label: 'Flow Velocity (v)',
      type: 'number',
      placeholder: '5',
      unit: 'm/s',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Supports both metric (SI) and imperial units. The characteristic velocity of the flow. For open channels, use average velocity (Q/A). For ships, use hull speed.',
      defaultValue: '5',
    },
    {
      id: 'gravity',
      label: 'Gravitational Acceleration (g)',
      type: 'number',
      placeholder: '9.81',
      unit: 'm/s²',
      inputMode: 'decimal',
      min: 0.01,
      step: 0.01,
      defaultValue: '9.81',
      helpText: 'Earth: 9.81 m/s², Mars: 3.72 m/s², Moon: 1.62 m/s². Change for non-Earth applications.',
    },
    {
      id: 'characteristicLength',
      label: 'Characteristic Length (L)',
      type: 'number',
      placeholder: '2',
      unit: 'm',
      inputMode: 'decimal',
      min: 0.001,
      step: 0.1,
      required: true,
      helpText: 'For open channels: hydraulic depth (A/T). For ships: waterline length. For weirs: head above crest.',
},
],
calculate: (values) => {
    const v = parseFloat(values.velocity);
    const g = parseFloat(values.gravity);
    const L = parseFloat(values.characteristicLength);

    if (isNaN(v) || isNaN(g) || isNaN(L) || v < 0 || g <= 0 || L <= 0) return [];

    const fr = v / Math.sqrt(g * L);
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 4 });

    let regime = '';
    let color: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (fr < 0.3) { regime = 'Subcritical (tranquil) flow — deep, slow, disturbances travel upstream'; color = 'positive'; }
    else if (fr < 0.9) { regime = 'Subcritical — approaching critical'; color = 'positive'; }
    else if (fr < 1.0) { regime = 'Subcritical — near critical, surface waves stationary'; color = 'neutral'; }
    else if (fr < 1.1) { regime = 'Critical flow (Fr = 1) — minimum specific energy, hydraulic jump possible'; color = 'neutral'; }
    else if (fr < 1.7) { regime = 'Supercritical (rapid) flow — shallow, fast, disturbances wash downstream'; color = 'negative'; }
    else { regime = 'Highly supercritical — shooting flow, standing waves, potential erosion risk'; color = 'negative'; }

    const waveSpeed = Math.sqrt(g * L);

    return [
      { id: 'froude', label: 'Froude Number (Fr)', value: fmt(fr), highlight: true, color },
      { id: 'regime', label: 'Flow Regime', value: regime, color },
      { id: 'waveSpeed', label: 'Wave Celerity (√gL)', value: `${parseFloat(waveSpeed.toPrecision(4))} m/s`, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `Fr = ${v} / √(${g} × ${L})`, color: 'neutral' },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'Fr = v / √(gL)',
    formulaDescription: 'The Froude number is the ratio of flow inertia to gravitational force. Fr < 1 = subcritical (tranquil) flow where gravity dominates and waves travel upstream. Fr = 1 = critical flow (minimum specific energy). Fr > 1 = supercritical (shooting) flow where inertia dominates and disturbances cannot travel upstream.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Froude Number</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>open channel hydraulics</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: open channel hydraulics</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Froude Number showing key concepts and the open channel hydraulics domain',
      caption: 'This froude number covers open channel hydraulics. Use the worked examples to verify your understanding and bookmark for quick reference.',
    },
    variables: [
      { symbol: 'v', name: 'Flow Velocity', description: 'Average cross-sectional velocity. For open channels: v = Q/A where Q is discharge (m³/s) and A is cross-sectional area (m²). For ships: hull speed relative to water.' },
      { symbol: 'g', name: 'Gravitational Acceleration', description: 'Earth standard: 9.80665 m/s². Differs on other planets. The key insight: Fr ties flow behavior to the gravitational environment — the same flow on Mars has a different Fr.' },
      { symbol: 'L', name: 'Characteristic Length', description: 'Depends on application. Open channels: hydraulic depth D = A/T (area/top width). Ships: waterline length L_wl. Spillways and weirs: head H above crest. The choice of L affects the numerical value of Fr.' },
    ],
    howToUse: [
      'Enter the flow velocity in m/s.',
      'Use the default Earth gravity (9.81) or enter a custom value for other planets.',
      'Enter the characteristic length — choose based on your application.',
      'Check the flow regime to determine if the flow is subcritical, critical, or supercritical.',
    ],
    quickReference: [
      { label: 'Fr < 1', value: 'Subcritical — tranquil, deep, slow' },
      { label: 'Fr = 1', value: 'Critical — min specific energy' },
      { label: 'Fr > 1', value: 'Supercritical — rapid, shallow, shooting' },
      { label: 'Typical river', value: 'Fr ≈ 0.1–0.5 (subcritical)' },
      { label: 'Mountain stream', value: 'Fr ≈ 0.5–2.0 (mixed)' },
      { label: 'Spillway chute', value: 'Fr ≈ 2–6 (supercritical)' },
      { label: 'Ship hull (Fr < 0.4)', value: 'Displacement mode' },
      { label: 'Ship hull (Fr > 0.4)', value: 'Semi-planing/planing' },
    ],
    commonUses: [
      'Open channel hydraulics — classifying flow in rivers, canals, and spillways for flood control and irrigation design.',
      'Naval architecture — ship resistance depends critically on Fr; hull speed is reached at Fr ≈ 0.4 (displacement hulls).',
      'Hydraulic jump design — stilling basins use hydraulic jumps (Fr > 1 → Fr < 1) to dissipate energy downstream of dams.',
      'Dam spillway design — ensuring supercritical flow on the spillway face to prevent cavitation and structural vibration.',
      'Stormwater management — culvert and weir design requires Fr analysis to prevent downstream erosion.',
    ],
    explanation: 'The Froude number (Fr), named after British engineer William Froude (1810–1879), is a dimensionless number that characterizes the relative importance of inertial forces to gravitational forces in a fluid flow. Froude pioneered the use of scale models for ship design, establishing the law of dynamic similarity: model and prototype behave similarly when Fr is matched. The Froude number governs all free-surface flows — rivers, spillways, ocean waves, and ship wakes. The critical value Fr = 1 represents a flow state of minimum specific energy. At this point, the flow velocity equals the wave propagation speed (celerity), and surface waves become stationary. A hydraulic jump forms when supercritical flow (Fr > 1) transitions to subcritical (Fr < 1), dissipating large amounts of energy. Hydraulic jumps are intentionally created in stilling basins to protect riverbeds downstream of dams. The Froude number also determines ship wave-making resistance: at "hull speed" (Fr ≈ 0.4 for displacement hulls), the wavelength of the bow wave equals the ship length, causing a sharp increase in drag. Planing hulls operate at Fr > 1, riding on top of their own bow wave.',
    faqs: [
      {
        question: 'What is the difference between subcritical and supercritical flow?',
        answer: 'Subcritical flow (Fr < 1) is deep, slow, and controlled by downstream conditions — a rock dropped in the water creates ripples that travel upstream. Supercritical flow (Fr > 1) is shallow, fast, and controlled by upstream conditions — ripples from a disturbance are swept downstream and cannot travel upstream. This is why you can see a hydraulic jump downstream of a weir but never upstream of one.',
      },
      {
        question: 'Why is the Froude number important for ship design?',
        answer: 'Ship wave-making resistance peaks at Fr ≈ 0.4 for displacement hulls — this is the "hull speed" limit. A longer waterline means higher hull speed (v_hull ≈ 1.34√L_wl in knots with L in feet). Above this, the ship must climb its own bow wave, which requires exponentially more power. Planing hulls overcome this by dynamically lifting onto the surface at Fr > 1. Every ship model test matches Fr between model and full-scale vessel to ensure wave patterns are correctly scaled.',
      },
      {
        question: 'How does the Froude number apply to hydraulic jumps?',
        answer: 'A hydraulic jump occurs when supercritical flow (Fr > 1) abruptly transitions to subcritical flow (Fr < 1). The energy dissipation depends on the upstream Fr: weak jump (1 < Fr < 1.7, < 5% energy loss), oscillating jump (1.7–2.5, 5–15%), steady jump (2.5–4.5, 15–45%), strong jump (4.5–9, 45–70%), and choppy jump (Fr > 9, up to 85% loss). Stilling basins are designed to produce steady jumps at design flow.',
      },
      {
        question: 'Does the Froude number matter for pipe flow?',
        answer: 'Generally no — Fr is primarily for free-surface flows where gravity is the restoring force. In full pipes, the conduit walls constrain the flow, and the Reynolds number (ratio of inertia to viscous forces) is the relevant dimensionless parameter. However, Fr matters in partially-full pipes (storm drains, sewers) where a free surface exists.',
      },
      {
        question: 'What happens at exactly Fr = 1?',
        answer: 'At critical flow (Fr = 1), the specific energy is at a minimum for a given discharge. The flow velocity equals the wave celerity — surface waves become stationary. Critical flow is unstable: small changes in channel slope, roughness, or discharge cause the flow to flip between subcritical and supercritical. Engineers avoid designing channels for critical flow near Fr = 1 because of this instability and potential for wave formation.',
      },
    ],
    proTips: [
      'For rectangular channels: Fr = v/√(gy) where y is the flow depth (not the channel depth!). This is the simplest and most common form — measure depth, not channel dimensions.',
      'When designing a stilling basin, target an upstream Fr between 2.5 and 4.5 for a steady, well-defined hydraulic jump. Below 2.5 the jump oscillates and creates surface waves that can overtop channel walls.',
      'Ship model testing: Fr similarity and Re similarity cannot be satisfied simultaneously at model scale. Model tests match Fr (gravity-dependent wave patterns) and correct for viscous (Re) effects analytically.',
      'For environmental flows: Fr < 0.1 is "deep, slow" — mixing is limited. Fr ≈ 0.2–0.5 is typical for lowland rivers. At these values, aeration is poor, and pollutants disperse slowly.',
    ],
    workedExamples: [
      {
        scenario: 'Water flows at 2 m/s in a rectangular channel 1.5 m deep. Is the flow subcritical or supercritical?',
        inputs: { velocity: '2', gravity: '9.81', characteristicLength: '1.5' },
        result: 'Fr = 0.521 — subcritical (tranquil) flow.',
        insight: 'Fr = 2 / √(9.81 × 1.5) = 2 / 3.836 = 0.521. Since Fr < 1, this is subcritical flow. A disturbance (like a rock) would create ripples that travel upstream. The flow is tranquil and controlled by downstream conditions. This is typical for a slow-moving irrigation canal or lowland river.',
      },
      {
        scenario: 'A dam spillway has water shooting down at 15 m/s with a depth of 0.3 m. What is the Froude number?',
        inputs: { velocity: '15', gravity: '9.81', characteristicLength: '0.3' },
        result: 'Fr = 8.75 — highly supercritical (choppy jump regime).',
        insight: 'Fr = 15 / √(9.81 × 0.3) = 15 / 1.715 = 8.75. This is highly supercritical flow — a "choppy jump" regime. At Fr ≈ 8.75, a hydraulic jump would dissipate about 75% of the incoming energy. A stilling basin is absolutely essential to prevent downstream scour.',
      },
    ],

    limitations: [
      'This calculator computes the bulk Froude number from average velocity and characteristic length. It does not compute local Fr variations.',
      'The characteristic length must match your application — using the wrong L gives a misleading Fr. For non-rectangular channels, use hydraulic depth (A/T) as the characteristic length.',
      'Fr does not account for viscous effects; the Reynolds number must be checked separately for complete flow characterization.',
    ],
  citations: [
      { source: 'Wikipedia — Froude Number', url: 'https://en.wikipedia.org/wiki/Froude_Number' },
      { source: 'Froude Number — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default froudeConfig;
