import { CalculatorConfig } from '../../../types/calculator';
import { sigFig4 as fmt } from '../../../lib/format';
import { finiteSteps } from '../../../utils/explainGuard';

const nusseltConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'heatTransferCoeff',
      label: 'Convective Heat Transfer Coefficient (h)',
      type: 'number',
      placeholder: '50',
      unit: 'W/m²·K',
      inputMode: 'decimal',
      min: 0,
      max: 1000000,
      step: 0.1,
      required: true,
      helpText: 'The convective heat transfer coefficient. Typical values: air (natural) 5-25, air (forced) 10-200, water 500-10,000 W/m²·K.',
    },
    {
      id: 'characteristicLength',
      label: 'Characteristic Length (L)',
      type: 'number',
      placeholder: '0.1',
      unit: 'm',
      inputMode: 'decimal',
      min: 0,
      max: 1000,
      step: 0.001,
      required: true,
      helpText: 'The characteristic length. For a flat plate, use plate length. For a pipe, use diameter. For a sphere, use diameter.',
    },
    {
      id: 'thermalConductivity',
      label: 'Thermal Conductivity (k)',
      type: 'number',
      placeholder: '0.6',
      unit: 'W/m·K',
      inputMode: 'decimal',
      min: 0.001,
      max: 1000,
      step: 0.01,
      required: true,
      helpText: 'Thermal conductivity of the fluid. Air: ~0.026, Water: ~0.6, Engine oil: ~0.15 W/m·K at room temperature.',
},
],
calculate: (values) => {
    const h = parseFloat(values.heatTransferCoeff);
    const L = parseFloat(values.characteristicLength);
    const k = parseFloat(values.thermalConductivity);

    if (![h, L, k].every(Number.isFinite) || h <= 0 || L <= 0 || k <= 0) return [];

    const nu = Number(((h * L) / k).toPrecision(6)); // trims float noise so Nu = 1 is recognised

    return [
      { id: 'nusselt', label: 'Nusselt Number (Nu)', value: fmt(nu), highlight: true, color: 'positive' },
      { id: 'formula', label: 'Formula Used', value: `Nu = (${h} × ${L}) / ${k} = ${fmt(nu)}`, color: 'neutral' },
      { id: 'interpretation', label: 'Interpretation', value: nu > 1 ? 'Convection enhances heat transfer beyond pure conduction' : nu === 1 ? 'Equivalent to pure conduction across a layer of thickness L (Nu = 1)' : 'Nu < 1: heat transfer is poorer than conduction across a stagnant layer of thickness L — check the characteristic length and h', color: nu > 1 ? 'positive' : 'neutral' },
    ];
  },

  explainSteps: (values) => {
    const h = parseFloat(values.heatTransferCoeff);
    const L = parseFloat(values.characteristicLength);
    const k = parseFloat(values.thermalConductivity);
    if (![h, L, k].every(Number.isFinite) || h <= 0 || L <= 0 || k <= 0) return [];
    const nu = Number(((h * L) / k).toPrecision(6));
    return finiteSteps([
      { label: 'Multiply the heat transfer coefficient by the length', expr: `h × L = ${h} × ${L} = ${fmt(h * L)} W/m·K` },
      { label: 'Divide by the fluid conductivity', expr: `Nu = ${fmt(h * L)} ÷ ${k} = ${fmt(nu)}`, note: 'Nu compares convection with pure conduction through the same layer.' },
      { label: 'Compare with 1', expr: nu > 1 ? `Nu = ${fmt(nu)} > 1: convection beats pure conduction` : nu === 1 ? 'Nu = 1: same as pure conduction' : `Nu = ${fmt(nu)} < 1: worse than conduction through a still layer, so check h and L` },
    ]);
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'Nu = hL / k',
    formulaDescription: 'The Nusselt number represents the ratio of convective to conductive heat transfer across a boundary. A Nu > 1 indicates convection enhances heat transfer beyond conduction across a stagnant fluid layer of thickness L. Nu = 1 corresponds to pure conduction. Higher Nu means more effective convection.',
    diagram: {
      svg: '<svg viewBox="0 0 440 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">Nusselt Number</text><rect x="20" y="40" width="400" height="44" rx="8" fill="var(--svg-3b82f6)" opacity="0.1"/><text x="220" y="68" text-anchor="middle" font-size="16" fill="currentColor">Nu = h L / k</text><text x="220" y="100" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">h in W/m²·K · L in m · k in W/m·K</text></svg>',
      alt: 'Nusselt number formula: heat transfer coefficient times length divided by thermal conductivity',
      caption: 'Nu compares convective heat transfer with conduction through the same fluid layer.',
    },
    variables: [
      { symbol: 'h', name: 'Convective Heat Transfer Coefficient', description: 'Rate of heat transfer between a surface and a fluid per unit area per unit temperature difference (W/m²·K). Depends on fluid properties, flow velocity, and geometry.' },
      { symbol: 'L', name: 'Characteristic Length', description: 'The reference dimension of the geometry. For a flat plate: plate length. For a cylinder/pipe: diameter. For a sphere: diameter. For non-circular ducts: hydraulic diameter (4A/P).' },
      { symbol: 'k', name: 'Thermal Conductivity', description: 'A measure of the fluid\'s ability to conduct heat (W/m·K). Higher k means heat conducts more easily through the fluid. Air: ~0.026, Water: ~0.6, Mercury: ~8.5.' },
    ],
    howToUse: [
      'Enter the convective heat transfer coefficient (h) in W/m²·K.',
      'Enter the characteristic length (L) in meters.',
      'Enter the thermal conductivity of the fluid (k) in W/m·K.',
      'Review the Nusselt number and interpretation.',
    ],
    quickReference: [
      { label: 'Nu = 1', value: 'Conduction across a layer of thickness L' },
      { label: 'Nu > 1', value: 'Convection enhances heat transfer' },
      { label: 'h from Nu', value: 'h = Nu × k / L' },
      { label: 'Laminar flat plate (average)', value: 'Nu = 0.664 Re^0.5 Pr^(1/3)' },
      { label: 'Turbulent pipe (Dittus-Boelter)', value: 'Nu = 0.023 Re^0.8 Pr^0.4 (heating)' },
    ],
    commonUses: [
      'Heat exchanger design — sizing and rating shell-and-tube, plate, and finned exchangers.',
      'Electronics cooling — calculating whether natural or forced convection is needed for component temperatures.',
      'Building HVAC — determining heat loss/gain through walls, windows, and ducts under various flow conditions.',
      'Aerospace thermal protection — designing re-entry shields and engine cooling systems.',
      'Chemical reactor design — ensuring adequate heat removal for exothermic reactions.',
    ],
    explanation: 'The Nusselt number (Nu) is one of the most important dimensionless numbers in heat transfer. Named after Wilhelm Nusselt (1882–1957), it quantifies the enhancement of heat transfer due to convection relative to conduction alone. A Nusselt number of 1 means heat transfers as if by conduction alone across a fluid layer of thickness L. A Nu of 100 means convection increases the heat transfer rate 100-fold compared to pure conduction. Engineers use Nu correlations for specific geometries: Nu = 0.664·Re^(1/2)·Pr^(1/3) for the average over a flat plate in laminar flow (Re below about 5×10⁵, Pr ≥ 0.6), and Nu = 0.023·Re^(4/5)·Pr^n for fully turbulent flow in smooth pipes (Dittus-Boelter: n = 0.4 for heating the fluid, 0.3 for cooling; Re above about 10,000, 0.6 < Pr < 160, L/D above 10). Nu is typically well above 1 for forced convection. Understanding Nu is essential for designing radiators, heat sinks, condensers, boilers, and any system where heat must be moved efficiently between a solid surface and a fluid.',
    faqs: [
      {
        question: 'What does a Nusselt number of 1 mean?',
        answer: 'A Nu = 1 means heat moves as if by conduction alone across a fluid layer of thickness L, with no convective enhancement. For a truly stagnant fluid between two walls Nu is exactly 1; for flow over a surface a value near 1 means the flow barely helps.',
      },
      {
        question: 'What is a typical Nusselt number for natural convection?',
        answer: 'It depends on geometry and the Rayleigh number (buoyancy strength): for natural convection Nu is usually modest, far below the values for forced convection, and it rises with the temperature difference that drives the buoyant flow. Use a correlation for your geometry (for example Churchill-Chu for a vertical plate) instead of a rule-of-thumb number.',
      },
      {
        question: 'How does the Nusselt number relate to the heat transfer coefficient?',
        answer: 'The relationship is direct: h = Nu × k / L. Once you know Nu (from a correlation or measurement), you can calculate the convective heat transfer coefficient h. This is the standard approach in heat transfer design — find Nu from geometry-specific correlations, then compute h, then compute heat flow Q = hAΔT.',
      },
      {
        question: 'Why is it called the Nusselt number?',
        answer: 'It is named after Wilhelm Nusselt, a German engineer who made fundamental contributions to convective heat transfer in the early 20th century. His 1915 paper "Das Grundgesetz des Wärmeübergangs" (The Fundamental Law of Heat Transfer) laid the foundation for modern heat exchanger design. Nusselt also pioneered dimensional analysis in heat transfer, showing that complex convection problems could be reduced to relationships between dimensionless numbers (Nu, Re, Pr).',
      },
      {
        question: 'What is the difference between local and average Nusselt number?',
        answer: 'The local Nusselt number varies along a surface — it is highest at the leading edge of a flat plate (where the thermal boundary layer is thinnest) and decreases downstream. The average Nusselt number is integrated over the entire surface length. For a flat plate in laminar flow, Nu_avg = 2 × Nu_local(at x=L). Most engineering calculations use the average Nu for simplicity. This calculator computes the overall Nu from bulk values.',
      },
    ],
    proTips: [
      'For fully turbulent flow in smooth pipes, Nu ≈ 0.023·Re^0.8·Pr^0.4 (Dittus-Boelter, heating) is a good first estimate; check its validity range (Re above about 10,000, 0.6 < Pr < 160, L/D above 10) and use Gnielinski for better accuracy.',
      'The characteristic length L must match the geometry used in your Nu correlation. Using the wrong L (e.g., pipe radius instead of diameter) will give results off by a factor of 2 or more.',
      'If your calculation gives Nu well below 1, check whether the characteristic length is appropriate or whether h is unrealistically low.',
      'Nu, Re, and Pr form the core trio of convective heat transfer. Once you understand how they relate (Nu = f(Re, Pr) for forced convection, Nu = f(Gr, Pr) for natural), you can tackle virtually any convection problem.',
    ],
    workedExamples: [
      {
        scenario: 'Air flows over a 0.5 m flat plate. h = 25 W/m²·K, k_air = 0.026 W/m·K. What is Nu and what does it tell us?',
        inputs: { heatTransferCoeff: '25', characteristicLength: '0.5', thermalConductivity: '0.026' },
        result: 'Nu = 480.8 — convection about 480× more effective than conduction across a 0.5 m layer of air.',
        insight: 'Nu = (25 × 0.5) / 0.026 = 480.8. This high Nusselt number means convection moves heat roughly 480 times better than conduction through a 0.5 m air layer would; it is large mainly because air conducts heat so poorly (k = 0.026) while h = 25 W/m²·K is a typical forced-air value.',
      },
      {
        scenario: 'Water flows through a 25 mm diameter tube. h = 8,000 W/m²·K, k_water = 0.6 W/m·K. What is Nu?',
        inputs: { heatTransferCoeff: '8000', characteristicLength: '0.025', thermalConductivity: '0.6' },
        result: 'Nu = 333.3 — convection about 330× more effective than conduction across a 25 mm water layer.',
        insight: 'Nu = (8000 × 0.025) / 0.6 = 333.3. Water gives a high h (8,000 W/m²·K here) and a high k, and Nu = hL/k ties them to the tube diameter. Compare air: reaching the same Nu with air would need a far higher h relative to its low k.',
      },
    ],

    limitations: [
      'This calculator computes the Nusselt number from known h, L, and k values. It does NOT compute h from flow conditions — for that, you need Reynolds and Prandtl numbers plus a geometry-specific correlation.',
      'The characteristic length must be appropriate for your geometry; using incorrect L will produce a misleading Nu.',
      'The interpretation guide assumes typical engineering contexts and may not apply to micro/nanoscale heat transfer or compressible flow regimes.',
    ],
  citations: [
      { source: 'Wikipedia — Nusselt Number', url: 'https://en.wikipedia.org/wiki/Nusselt_Number' },
    ],
  },
};

export default nusseltConfig;
