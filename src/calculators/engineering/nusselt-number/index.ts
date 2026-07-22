import { CalculatorConfig } from '../../../types/calculator';

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
      step: 0.1,
      required: true,
      helpText: 'Supports both metric (SI) and imperial units. The convective heat transfer coefficient. Typical values: air (natural) 5-25, air (forced) 10-200, water 500-10,000 W/m²·K.',
    },
    {
      id: 'characteristicLength',
      label: 'Characteristic Length (L)',
      type: 'number',
      placeholder: '0.1',
      unit: 'm',
      inputMode: 'decimal',
      min: 0,
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
      step: 0.01,
      required: true,
      helpText: 'Thermal conductivity of the fluid. Air: ~0.026, Water: ~0.6, Engine oil: ~0.15 W/m·K at room temperature.',
},
],
calculate: (values) => {
    const h = parseFloat(values.heatTransferCoeff);
    const L = parseFloat(values.characteristicLength);
    const k = parseFloat(values.thermalConductivity);

    if (isNaN(h) || isNaN(L) || isNaN(k) || h <= 0 || L <= 0 || k <= 0) return [];

    const nu = (h * L) / k;

    const fmt = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 4 });

    return [
      { id: 'nusselt', label: 'Nusselt Number (Nu)', value: fmt(nu), highlight: true, color: 'positive' },
      { id: 'formula', label: 'Formula Used', value: `Nu = (${h} × ${L}) / ${k} = ${fmt(nu)}`, color: 'neutral' },
      { id: 'interpretation', label: 'Interpretation', value: nu > 1 ? 'Convection dominates conduction' : nu === 1 ? 'Pure conduction (Nu = 1)' : 'Check inputs — Nu < 1 is unusual for natural convection', color: nu > 1 ? 'positive' : 'neutral' },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'Nu = hL / k',
    formulaDescription: 'The Nusselt number represents the ratio of convective to conductive heat transfer across a boundary. A Nu > 1 indicates convection enhances heat transfer beyond pure conduction. Nu = 1 represents pure conduction. Higher Nu means more effective convection.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Nusselt Number</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>convective heat transfer</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: convective heat transfer</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Nusselt Number showing key concepts and the convective heat transfer domain',
      caption: 'This nusselt number covers convective heat transfer. Use the worked examples to verify your understanding and bookmark for quick reference.',
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
      { label: 'Nu = 1', value: 'Pure conduction (no convection enhancement)' },
      { label: 'Nu = 3–5', value: 'Weak natural convection' },
      { label: 'Nu = 10–100', value: 'Moderate forced convection' },
      { label: 'Nu = 100–1,000', value: 'Strong forced convection' },
      { label: 'Nu > 1,000', value: 'Turbulent flow, very efficient heat transfer' },
    ],
    commonUses: [
      'Heat exchanger design — sizing and rating shell-and-tube, plate, and finned exchangers.',
      'Electronics cooling — calculating whether natural or forced convection is needed for component temperatures.',
      'Building HVAC — determining heat loss/gain through walls, windows, and ducts under various flow conditions.',
      'Aerospace thermal protection — designing re-entry shields and engine cooling systems.',
      'Chemical reactor design — ensuring adequate heat removal for exothermic reactions.',
    ],
    explanation: 'The Nusselt number (Nu) is one of the most important dimensionless numbers in heat transfer. Named after Wilhelm Nusselt (1882–1957), it quantifies the enhancement of heat transfer due to convection relative to conduction alone. A Nusselt number of 1 means the fluid is stationary and heat transfers only by conduction. A Nu of 100 means convection increases the heat transfer rate 100-fold compared to pure conduction. Engineers use Nu correlations for specific geometries: Nu = 0.664·Re^(1/2)·Pr^(1/3) for laminar flow over a flat plate, and Nu = 0.023·Re^(4/5)·Pr^(0.4) for turbulent flow in pipes (Dittus-Boelter). The Nusselt number is always ≥ 1 for natural convection and typically >> 1 for forced convection. Understanding Nu is essential for designing radiators, heat sinks, condensers, boilers, and any system where heat must be moved efficiently between a solid surface and a fluid.',
    faqs: [
      {
        question: 'What does a Nusselt number of 1 mean?',
        answer: 'A Nu = 1 means pure conduction — the fluid is stagnant and heat transfers solely by molecular conduction through the fluid. There is no convective enhancement. This is the theoretical minimum and occurs when fluid velocity is zero at the wall (no-slip condition).',
      },
      {
        question: 'What is a typical Nusselt number for natural convection?',
        answer: 'For natural (free) convection, Nu typically ranges from 1 to 25. A vertical plate in still air might have Nu ≈ 10–20. A horizontal cylinder in air might have Nu ≈ 5–15. Higher values occur with larger temperature differences that drive stronger buoyant flows.',
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
      'For quick estimates, remember: Nu ≈ 0.023·Re^0.8·Pr^0.4 for turbulent pipe flow (Dittus-Boelter). This single correlation covers most industrial pipe-flow heat transfer calculations.',
      'The characteristic length L must match the geometry used in your Nu correlation. Using the wrong L (e.g., pipe radius instead of diameter) will give results off by a factor of 2 or more.',
      'Nu is always ≥ 1 for any physically meaningful case. If your calculation gives Nu < 1, check whether the characteristic length is appropriate or if the convection coefficient is unrealistically low.',
      'Nu, Re, and Pr form the core trio of convective heat transfer. Once you understand how they relate (Nu = f(Re, Pr) for forced convection, Nu = f(Gr, Pr) for natural), you can tackle virtually any convection problem.',
    ],
    workedExamples: [
      {
        scenario: 'Air flows over a 0.5 m flat plate. h = 25 W/m²·K, k_air = 0.026 W/m·K. What is Nu and what does it tell us?',
        inputs: { heatTransferCoeff: '25', characteristicLength: '0.5', thermalConductivity: '0.026' },
        result: 'Nu = 480.8 — strong forced convection, ~500× more effective than pure conduction.',
        insight: 'Nu = (25 × 0.5) / 0.026 = 480.8. This is a high Nusselt number indicating strong forced convection — the convective heat transfer is nearly 500× more effective than pure conduction. This is typical for airflow over a surface at moderate speeds.',
      },
      {
        scenario: 'Water flows through a 25 mm diameter tube. h = 8,000 W/m²·K, k_water = 0.6 W/m·K. What is Nu?',
        inputs: { heatTransferCoeff: '8000', characteristicLength: '0.025', thermalConductivity: '0.6' },
        result: 'Nu = 333.3 — turbulent flow with efficient heat transfer typical of water systems.',
        insight: 'Nu = (8000 × 0.025) / 0.6 = 333.3. This high Nu is typical for water — its high thermal conductivity and the turbulent flow produce efficient heat transfer. Compare with air: achieving Nu = 333 with air would require much higher velocities.',
      },
    ],

    limitations: [
      'This calculator computes the Nusselt number from known h, L, and k values. It does NOT compute h from flow conditions — for that, you need Reynolds and Prandtl numbers plus a geometry-specific correlation.',
      'The characteristic length must be appropriate for your geometry; using incorrect L will produce a misleading Nu.',
      'The interpretation guide assumes typical engineering contexts and may not apply to micro/nanoscale heat transfer or compressible flow regimes.',
    ],
  citations: [
      { source: 'Wikipedia — Nusselt Number', url: 'https://en.wikipedia.org/wiki/Nusselt_Number' },
      { source: 'Nusselt Number — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default nusseltConfig;
