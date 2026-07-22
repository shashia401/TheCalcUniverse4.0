import { CalculatorConfig } from '../../../types/calculator';

const prandtlConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dynamicViscosity',
      label: 'Dynamic Viscosity (μ)',
      type: 'number',
      placeholder: '0.001',
      unit: 'Pa·s',
      inputMode: 'decimal',
      min: 0.000001,
      step: 0.0001,
      required: true,
      helpText: 'Supports both metric (SI) and imperial units. Dynamic viscosity. Water at 20°C: 0.001 Pa·s, Air at 20°C: 1.8×10⁻⁵ Pa·s, Engine oil: ~0.1–0.5 Pa·s.',
      defaultValue: '0.001',
    },
    {
      id: 'specificHeat',
      label: 'Specific Heat Capacity (cp)',
      type: 'number',
      placeholder: '4184',
      unit: 'J/kg·K',
      inputMode: 'decimal',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Specific heat at constant pressure. Water: 4184, Air: 1005, Engine oil: ~1900 J/kg·K.',
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
      helpText: 'Thermal conductivity of the fluid. Air: ~0.026, Water: ~0.6, Mercury: ~8.5 W/m·K.',
},
],
calculate: (values) => {
    const mu = parseFloat(values.dynamicViscosity);
    const cp = parseFloat(values.specificHeat);
    const k = parseFloat(values.thermalConductivity);

    if (isNaN(mu) || isNaN(cp) || isNaN(k) || mu <= 0 || cp <= 0 || k <= 0) return [];

    const pr = (mu * cp) / k;
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 4 });

    let category = '';
    if (pr < 0.01) category = 'Liquid metal (very low Pr) — thermal diffusion dominates';
    else if (pr < 0.7) category = 'Gas — momentum and thermal diffusion comparable';
    else if (pr < 1.0) category = 'Gas (Pr < 1) — thermal boundary layer thicker than velocity';
    else if (pr < 10) category = 'Common liquid (water-like) — velocity boundary layer thicker';
    else if (pr < 100) category = 'Oil — momentum diffuses much faster than heat';
    else category = 'Very viscous fluid — extremely thin thermal boundary layer';

    return [
      { id: 'prandtl', label: 'Prandtl Number (Pr)', value: fmt(pr), highlight: true, color: 'positive' },
      { id: 'category', label: 'Fluid Category', value: category, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `Pr = (${mu} × ${cp}) / ${k}`, color: 'neutral' },
      { id: 'momentumDiffusivity', label: 'Momentum Diffusivity (ν = μ/ρ)', value: `ν = ${fmt(mu)} / ρ (enter density for ν)`, color: 'neutral' },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'Pr = μ cp / k = ν / α',
    formulaDescription: 'The Prandtl number is the ratio of momentum diffusivity (kinematic viscosity ν) to thermal diffusivity (α). It describes the relative thickness of the velocity and thermal boundary layers. Pr < 1: heat diffuses faster than momentum (liquid metals). Pr ≈ 0.7: typical for gases. Pr > 1: momentum diffuses faster (water, oils).',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Prandtl Number</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>fluid dynamics and heat transfer</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: fluid dynamics and heat transfer</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Prandtl Number showing key concepts and the fluid dynamics and heat transfer domain',
      caption: 'This prandtl number covers fluid dynamics and heat transfer. Use the worked examples to verify your understanding and bookmark for quick reference.',
    },
    variables: [
      { symbol: 'μ', name: 'Dynamic Viscosity', description: 'Resistance to flow (Pa·s or kg/m·s). Higher μ means thicker, more resistant fluid. Water: 0.001, Air: 1.8×10⁻⁵, Honey: ~10 Pa·s.' },
      { symbol: 'cp', name: 'Specific Heat Capacity', description: 'Energy required to raise 1 kg of fluid by 1 K (J/kg·K). Water has an unusually high cp (4184), making it an excellent coolant.' },
      { symbol: 'k', name: 'Thermal Conductivity', description: 'Rate of heat conduction through the fluid (W/m·K). Metals conduct heat well (high k); gases and insulators do not (low k).' },
    ],
    howToUse: [
      'Enter the dynamic viscosity (μ) in Pa·s.',
      'Enter the specific heat capacity (cp) in J/kg·K.',
      'Enter the thermal conductivity (k) in W/m·K.',
      'The Prandtl number tells you whether heat or momentum diffuses faster.',
    ],
    quickReference: [
      { label: 'Pr ≈ 0.004–0.03', value: 'Liquid metals (sodium, mercury, NaK)' },
      { label: 'Pr ≈ 0.7', value: 'Air and most gases' },
      { label: 'Pr ≈ 1–2', value: 'Water at moderate temps' },
      { label: 'Pr ≈ 7', value: 'Water at 20°C' },
      { label: 'Pr ≈ 50–500', value: 'Light engine oils' },
      { label: 'Pr ≈ 1,000–10,000', value: 'Heavy oils, glycerol' },
      { label: 'Pr > 100,000', value: 'Silicone oils, polymers' },
    ],
    commonUses: [
      'Heat exchanger design — Pr appears in virtually every forced-convection Nusselt number correlation (Nu = C·Re^m·Pr^n).',
      'Boundary layer analysis — Pr tells you whether the thermal boundary layer is thicker (Pr < 1) or thinner (Pr > 1) than the velocity boundary layer.',
      'CFD simulations — Pr is a required fluid property input for conjugate heat transfer models in ANSYS Fluent, OpenFOAM, and COMSOL.',
      'Coolant selection — high Pr fluids (water) maintain thin thermal boundary layers; low Pr fluids (liquid metals) diffuse heat rapidly.',
      'Aerodynamic heating — Pr ≈ 0.7 for air determines the relationship between skin friction and heat transfer at supersonic speeds.',
    ],
    explanation: 'The Prandtl number (Pr), named after German physicist Ludwig Prandtl (1875–1953), is a dimensionless number that characterizes the relative effectiveness of momentum and energy transport in a fluid. Prandtl introduced the concept of the boundary layer in 1904, revolutionizing fluid dynamics. Pr < 1 means heat diffuses faster than momentum — the thermal boundary layer is thicker than the velocity boundary layer. This occurs in liquid metals (Pr ≈ 0.01), making them excellent coolants for nuclear reactors. Pr ≈ 0.7 for air and most diatomic gases — this near-unity value means the velocity and thermal boundary layers have similar thickness, which simplifies many heat transfer calculations. Pr > 1 means momentum diffuses faster — the velocity boundary layer extends beyond the thermal layer. Water at room temperature has Pr ≈ 7. Oils have Pr > 100, meaning the thermal boundary layer is extremely thin compared to the velocity layer. The Prandtl number is purely a fluid property — it depends only on the fluid state (temperature, pressure), not on flow geometry or velocity. This makes it one of the most useful dimensionless numbers: look up Pr for your fluid at the operating temperature, and it immediately tells you how heat and momentum will interact.',
    faqs: [
      {
        question: 'Why is the Prandtl number important in heat exchanger design?',
        answer: 'Pr appears in virtually every Nusselt number correlation used for heat exchanger design. The Dittus-Boelter correlation (Nu = 0.023·Re^0.8·Pr^0.4) uses Pr^0.4, meaning a 10× increase in Pr roughly doubles the Nusselt number — and therefore the heat transfer coefficient. Getting Pr right is essential for accurate heat exchanger sizing. For liquid metals (Pr ≈ 0.01), specialized correlations are needed because the standard turbulent correlations break down at very low Pr.',
      },
      {
        question: 'What is the Prandtl number of water, and why does it matter?',
        answer: 'Water at 20°C has Pr ≈ 7.0, decreasing to about 1.8 at 100°C. This temperature dependence matters: as water heats up, Pr decreases, meaning the thermal boundary layer grows thicker relative to the velocity layer. Engineers must account for this when designing boilers, condensers, and cooling systems where large temperature ranges occur. The high Pr at room temperature makes water excellent for cooling — momentum diffuses 7× faster than heat, so the thermal boundary layer stays thin and efficient.',
      },
      {
        question: 'How does Pr differ for gases vs liquids?',
        answer: 'Gases typically have Pr ≈ 0.7 (air: 0.71, hydrogen: 0.69, CO2: 0.75) — remarkably consistent across different gases because cp, μ, and k scale similarly with molecular properties. Liquids span a huge range: liquid metals (0.004–0.03), water (1–13), light oils (50–500), heavy oils (1,000–10,000). The wide range for liquids comes from the strong temperature dependence of viscosity — a cold oil can have Pr > 10,000, while the same oil at operating temperature might have Pr ≈ 100.',
      },
      {
        question: 'Why do liquid metals have such low Prandtl numbers?',
        answer: 'Liquid metals (sodium, mercury, NaK, lead-bismuth) have extremely high thermal conductivity (k ≈ 10–100 W/m·K) compared to other liquids, while their viscosity is low. Since Pr = μcp/k, high k drives Pr very low. This makes them exceptional coolants: heat diffuses 100× faster than momentum, so even slow-moving liquid metal transfers enormous amounts of heat. This is why liquid sodium is used as coolant in fast breeder nuclear reactors.',
      },
      {
        question: 'Can the Prandtl number be less than 0.1?',
        answer: 'Yes, but only for liquid metals. Sodium at 500°C has Pr ≈ 0.004. For these fluids, standard heat transfer correlations (like Dittus-Boelter) break down because the thermal boundary layer is much thicker than the velocity boundary layer. Special correlations (like Lyon-Martinelli for liquid metals) are required. Below Pr ≈ 0.1, molecular conduction dominates over turbulent mixing even in turbulent flow — a unique regime requiring specialized design approaches.',
      },
    ],
    proTips: [
      'Pr for air is nearly constant (~0.71) from -50°C to 500°C. Use this fact for quick estimates — you rarely need to adjust air Pr for temperature in preliminary calculations.',
      'When working with oils, viscosity changes by orders of magnitude with temperature while cp and k barely move. This means Pr essentially tracks viscosity. Always check Pr at your actual operating temperature, not room temperature.',
      'For CFD: if your simulation shows odd thermal boundary layer behavior, check your Pr input. A wrong Pr will silently produce wrong results — the solver assumes the fluid properties are physically consistent.',
      'The product Re·Pr (Peclet number for heat transfer) tells you whether convection or conduction dominates. High Pe means convection rules; low Pe means conduction.',
    ],
    workedExamples: [
      {
        scenario: 'You are designing a shell-and-tube heat exchanger using water at 60°C. μ = 0.000467 Pa·s, cp = 4184 J/kg·K, k = 0.654 W/m·K.',
        inputs: { dynamicViscosity: '0.000467', specificHeat: '4184', thermalConductivity: '0.654' },
        result: 'Pr = 2.99 — water at 60°C. Thermal boundary layer thicker than at room temperature.',
        insight: 'Pr = (0.000467 × 4184) / 0.654 = 2.99. At 60°C, water has Pr ≈ 3, which is lower than at room temperature (Pr ≈ 7). The thermal boundary layer is thicker at this temperature, which slightly reduces the convective heat transfer coefficient compared to cold-water flow. Use this Pr value in your Nusselt correlation for accurate heat exchanger sizing.',
      },
      {
        scenario: 'Air at 300°C flows over a turbine blade. μ = 2.93×10⁻⁵ Pa·s, cp = 1044 J/kg·K, k = 0.044 W/m·K.',
        inputs: { dynamicViscosity: '0.0000293', specificHeat: '1044', thermalConductivity: '0.044' },
        result: 'Pr = 0.695 — air Pr is remarkably constant at ~0.7 across a wide temperature range.',
        insight: 'Pr = (2.93×10⁻⁵ × 1044) / 0.044 = 0.695. Even at 300°C, air Pr remains near 0.7. This remarkable constancy across a wide temperature range is characteristic of diatomic gases and simplifies gas turbine cooling design considerably.',
      },
    ],

    limitations: [
      'This calculator computes Pr from bulk fluid properties. It does not account for temperature-dependent property variations within the thermal boundary layer.',
      'For fluids near their critical point, property variations can be extreme and this simple calculation may be insufficient.',
      'The category interpretation assumes standard engineering contexts at moderate temperatures and pressures.',
    ],
  citations: [
      { source: 'Wikipedia — Prandtl Number', url: 'https://en.wikipedia.org/wiki/Prandtl_Number' },
      { source: 'Prandtl Number — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default prandtlConfig;
