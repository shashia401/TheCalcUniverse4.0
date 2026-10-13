import { CalculatorConfig } from '../../../types/calculator';
import { sigFig4 as fmt } from '../../../lib/format';

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
      max: 100000,
      step: 0.0001,
      required: true,
      helpText: 'Dynamic viscosity. Water at 20°C: 0.001 Pa·s, Air at 20°C: 1.8×10⁻⁵ Pa·s, Engine oil: ~0.1–0.5 Pa·s.',
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
      max: 20000,
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
      max: 1000,
      step: 0.01,
      required: true,
      helpText: 'Thermal conductivity of the fluid. Air: ~0.026, Water: ~0.6, Mercury: ~8.5 W/m·K.',
},
],
calculate: (values) => {
    const mu = parseFloat(values.dynamicViscosity);
    const cp = parseFloat(values.specificHeat);
    const k = parseFloat(values.thermalConductivity);

    if (![mu, cp, k].every(Number.isFinite) || mu <= 0 || cp <= 0 || k <= 0) return [];

    // classify on the displayed (4 significant figure) value
    const pr = Number(((mu * cp) / k).toPrecision(4));

    let category = '';
    if (pr < 0.1) category = 'Liquid metal (very low Pr) — thermal diffusion dominates';
    else if (pr < 0.7) category = 'Low Pr (below typical gases) — heat diffuses faster than momentum';
    else if (pr < 1.0) category = 'Gas (Pr < 1) — thermal boundary layer slightly thicker than the velocity layer';
    else if (pr < 10) category = 'Water-like liquid — velocity boundary layer thicker than the thermal layer';
    else if (pr < 100) category = 'Viscous liquid — momentum diffuses much faster than heat';
    else category = 'Very viscous fluid (oil, glycerol) — extremely thin thermal boundary layer';

    return [
      { id: 'prandtl', label: 'Prandtl Number (Pr)', value: fmt(pr), highlight: true, color: 'positive' },
      { id: 'category', label: 'Fluid Category', value: category, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `Pr = (${mu} × ${cp}) / ${k} = ${fmt(pr)}`, color: 'neutral' },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'Pr = μ cp / k = ν / α',
    formulaDescription: 'The Prandtl number is the ratio of momentum diffusivity (kinematic viscosity ν) to thermal diffusivity (α). It describes the relative thickness of the velocity and thermal boundary layers. Pr < 1: heat diffuses faster than momentum (liquid metals; gases are just under 1 at about 0.7). Pr > 1: momentum diffuses faster (water, oils).',
    diagram: {
      svg: '<svg viewBox="0 0 440 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">Prandtl Number</text><rect x="20" y="40" width="400" height="44" rx="8" fill="var(--svg-3b82f6)" opacity="0.1"/><text x="220" y="68" text-anchor="middle" font-size="16" fill="currentColor">Pr = μ cp / k = ν / α</text><text x="220" y="100" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">Pr < 1 heat leads · Pr > 1 momentum leads</text></svg>',
      alt: 'Prandtl number formula: viscosity times specific heat divided by thermal conductivity',
      caption: 'Pr compares how fast momentum diffuses with how fast heat diffuses.',
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
      { label: 'Liquid metals', value: 'Pr ≈ 0.004–0.03 (sodium, mercury, NaK)' },
      { label: 'Air and most gases', value: 'Pr ≈ 0.7' },
      { label: 'Water', value: 'Pr ≈ 13.5 at 0°C, 7.0 at 20°C, 3.0 at 60°C, 1.75 at 100°C' },
      { label: 'Engine oil', value: 'Pr ≈ 10⁴ at 20°C, falling to a few hundred near 100°C' },
      { label: 'Glycerol, heavy oils', value: 'Pr in the thousands or more' },
    ],
    commonUses: [
      'Heat exchanger design — Pr appears in virtually every forced-convection Nusselt number correlation (Nu = C·Re^m·Pr^n).',
      'Boundary layer analysis — Pr tells you whether the thermal boundary layer is thicker (Pr < 1) or thinner (Pr > 1) than the velocity boundary layer.',
      'CFD simulations — Pr (or cp, μ and k separately) is a required fluid property input for heat transfer models.',
      'Coolant selection — high Pr fluids (water) maintain thin thermal boundary layers; low Pr fluids (liquid metals) diffuse heat rapidly.',
      'Aerodynamic heating — Pr ≈ 0.7 for air enters the recovery factor and the skin friction / heat transfer relationship in high-speed flow.',
    ],
    explanation: 'The Prandtl number (Pr), named after German physicist Ludwig Prandtl (1875–1953), is a dimensionless number that characterizes the relative effectiveness of momentum and energy transport in a fluid. Prandtl introduced the concept of the boundary layer in 1904, revolutionizing fluid dynamics. Pr < 1 means heat diffuses faster than momentum — the thermal boundary layer is thicker than the velocity boundary layer. This occurs in liquid metals (Pr ≈ 0.01), making them excellent coolants for nuclear reactors. Pr ≈ 0.7 for air and most simple gases — this near-unity value means the velocity and thermal boundary layers have similar thickness, which simplifies many heat transfer calculations. Pr > 1 means momentum diffuses faster — the velocity boundary layer extends beyond the thermal layer. Water at room temperature has Pr ≈ 7. Oils have Pr > 100, meaning the thermal boundary layer is extremely thin compared to the velocity layer. The Prandtl number is purely a fluid property — it depends only on the fluid state (temperature, pressure), not on flow geometry or velocity. This makes it one of the most useful dimensionless numbers: look up Pr for your fluid at the operating temperature, and it immediately tells you how heat and momentum will interact.',
    faqs: [
      {
        question: 'Why is the Prandtl number important in heat exchanger design?',
        answer: 'Pr appears in virtually every Nusselt number correlation used for heat exchanger design. The Dittus-Boelter correlation (Nu = 0.023·Re^0.8·Pr^0.4) uses Pr^0.4, meaning a 10× increase in Pr raises the Nusselt number by about 2.5× (10^0.4) — and therefore the heat transfer coefficient. Getting Pr right is essential for accurate heat exchanger sizing. For liquid metals (Pr ≈ 0.01), specialized correlations are needed because the standard turbulent correlations break down at very low Pr.',
      },
      {
        question: 'What is the Prandtl number of water, and why does it matter?',
        answer: 'Water at 20°C has Pr ≈ 7.0, decreasing to about 1.75 at 100°C. This temperature dependence matters: as water heats up, Pr decreases, meaning the thermal boundary layer grows thicker relative to the velocity layer. Engineers must account for this when designing boilers, condensers, and cooling systems where large temperature ranges occur. The high Pr at room temperature makes water excellent for cooling — momentum diffuses about 7× faster than heat, so the thermal boundary layer stays thinner than the velocity layer.',
      },
      {
        question: 'How does Pr differ for gases vs liquids?',
        answer: 'Gases typically have Pr ≈ 0.7 (air: 0.71, hydrogen: 0.69, CO2: 0.75) — remarkably consistent across different gases because cp, μ, and k scale similarly with molecular properties. Liquids span a huge range: liquid metals (0.004–0.03), water (about 1.75–13.5 between 100°C and 0°C), oils (hundreds to tens of thousands). The wide range comes from the strong temperature dependence of viscosity — a cold oil can have Pr above 10,000, while the same oil hot may be a few hundred.',
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
      'Pr for air varies only a little with temperature (roughly 0.74 at -50°C to 0.69 at 500°C), so a value near 0.7 is fine for preliminary estimates.',
      'When working with oils, viscosity changes by orders of magnitude with temperature while cp and k barely move. This means Pr essentially tracks viscosity. Always check Pr at your actual operating temperature, not room temperature.',
      'For CFD: if your simulation shows odd thermal boundary layer behavior, check your Pr input. A wrong Pr will silently produce wrong results — the solver assumes the fluid properties are physically consistent.',
      'The product Re·Pr (Peclet number for heat transfer) tells you whether convection or conduction dominates. High Pe means convection rules; low Pe means conduction.',
    ],
    workedExamples: [
      {
        scenario: 'You are designing a shell-and-tube heat exchanger using water at 60°C. μ = 0.000467 Pa·s, cp = 4184 J/kg·K, k = 0.654 W/m·K.',
        inputs: { dynamicViscosity: '0.000467', specificHeat: '4184', thermalConductivity: '0.654' },
        result: 'Pr = 2.988 — water at 60°C, lower than at room temperature.',
        insight: 'Pr = (0.000467 × 4184) / 0.654 = 2.988. At 60°C, water has Pr ≈ 3, lower than at 20°C (Pr ≈ 7). Use the Pr at your operating (film or bulk) temperature in the Nusselt correlation rather than the room-temperature value.',
      },
      {
        scenario: 'Air at 300°C flows over a turbine blade. μ = 2.93×10⁻⁵ Pa·s, cp = 1044 J/kg·K, k = 0.044 W/m·K.',
        inputs: { dynamicViscosity: '0.0000293', specificHeat: '1044', thermalConductivity: '0.044' },
        result: 'Pr = 0.695 — close to the usual ~0.7 for air.',
        insight: 'Pr = (2.93×10⁻⁵ × 1044) / 0.044 = 0.695. Even at 300°C, air Pr remains near 0.7; gases change little with temperature, which simplifies preliminary gas-side heat transfer estimates.',
      },
    ],

    limitations: [
      'This calculator computes Pr from bulk fluid properties. It does not account for temperature-dependent property variations within the thermal boundary layer.',
      'For fluids near their critical point, property variations can be extreme and this simple calculation may be insufficient.',
      'The category interpretation assumes standard engineering contexts at moderate temperatures and pressures.',
    ],
  citations: [
      { source: 'Wikipedia — Prandtl Number', url: 'https://en.wikipedia.org/wiki/Prandtl_Number' },
    ],
  },
};

export default prandtlConfig;
