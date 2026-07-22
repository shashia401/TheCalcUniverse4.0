import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WeightPanel from './WeightPanel';

const massToKg = (v: number, u: string): number => {
  switch (u) {
    case 'g': return v / 1000;
    case 'kg': return v;
    case 'lb': return v * 0.45359237;
    default: return v;
  }
};

const PLANET_GRAVITY: Record<string, number> = {
  Earth: 9.81,
  Moon: 1.62,
  Mars: 3.71,
  Jupiter: 24.79,
  Sun: 274,
};

const GRAVITY_OPTIONS = [
  { label: 'Earth (9.81 m/s²)', value: 'Earth' },
  { label: 'Moon (1.62 m/s²)', value: 'Moon' },
  { label: 'Mars (3.71 m/s²)', value: 'Mars' },
  { label: 'Jupiter (24.79 m/s²)', value: 'Jupiter' },
  { label: 'Sun (274 m/s²)', value: 'Sun' },
  { label: 'Custom', value: 'custom' },
];

const fmt = (n: number): string => {
  if (!isFinite(n)) return 'Infinity';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toFixed(8)).toString();
};

const weightConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Solve for',
      type: 'select',
      required: true,
      options: [
        { label: 'Weight (W)', value: 'calcWeight' },
        { label: 'Mass (m)', value: 'calcMass' },
        { label: 'Gravity (g)', value: 'calcGravity' },
      ],
      helpText: 'Select which value you want to calculate',
    },
    {
      id: 'mass',
      label: 'Mass',
      type: 'number',
      placeholder: 'e.g. 70',
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.mode === 'calcWeight' || v.mode === 'calcGravity',
      helpText: 'Enter the mass of the object',
    },
    {
      id: 'massUnit',
      label: 'Mass Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'kg', value: 'kg' },
        { label: 'g', value: 'g' },
        { label: 'lb', value: 'lb' },
      ],
      showWhen: (v) => v.mode === 'calcWeight' || v.mode === 'calcGravity',
      helpText: 'Select the unit of mass',
    },
    {
      id: 'gravitySelect',
      label: 'Gravity',
      type: 'select',
      required: true,
      options: GRAVITY_OPTIONS,
      showWhen: (v) => v.mode === 'calcWeight' || v.mode === 'calcMass',
      helpText: 'Select a celestial body or enter custom gravity',
    },
    {
      id: 'gravityCustom',
      label: 'Custom Gravity (m/s²)',
      type: 'number',
      placeholder: 'e.g. 9.81',
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => (v.mode === 'calcWeight' || v.mode === 'calcMass') && v.gravitySelect === 'custom',
      helpText: 'Enter a custom gravitational acceleration in m/s²',
    },
    {
      id: 'weight',
      label: 'Weight (N)',
      type: 'number',
      placeholder: 'e.g. 686.7',
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.mode === 'calcMass' || v.mode === 'calcGravity',
      helpText: 'Enter the weight in Newtons',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'calcWeight';

    const getGravity = (): number => {
      const sel = values.gravitySelect || 'Earth';
      if (sel === 'custom') {
        const g = parseFloat(values.gravityCustom);
        return isNaN(g) ? 0 : g;
      }
      return PLANET_GRAVITY[sel] || 0;
    };

    const getGravityLabel = (): string => {
      const sel = values.gravitySelect || 'Earth';
      if (sel === 'custom') {
        const g = parseFloat(values.gravityCustom);
        return `${isNaN(g) ? 0 : g} m/s²`;
      }
      const g = PLANET_GRAVITY[sel];
      return `${sel} (${g} m/s²)`;
    };

    const buildComparisonResults = (mKg: number, _g: number): Array<{ id: string; label: string; value: string; color: 'neutral'; }> => {
      const entries: Array<{ id: string; label: string; value: string; color: 'neutral'; }> = [];
      const planets = ['Moon', 'Mars', 'Jupiter', 'Sun'] as const;
      for (const p of planets) {
        const w = mKg * (PLANET_GRAVITY[p] || 0);
        entries.push({
          id: `${p.toLowerCase()}Weight`,
          label: `Weight on ${p}`,
          value: `${fmt(w)} N`,
          color: 'neutral' as const,
        });
      }
      return entries;
    };

    if (mode === 'calcWeight') {
      const mass = parseFloat(values.mass);
      const g = getGravity();
      if (isNaN(mass) || g === 0) return [];

      const massKg = massToKg(mass, values.massUnit || 'kg');
      const weightN = massKg * g;
      const weightLbf = weightN * 0.224809;

      const results: Array<{ id: string; label: string; value: string; color?: string; highlight?: boolean }> = [
        {
          id: 'result',
          label: 'Weight (W)',
          value: `${fmt(weightN)} N`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'weightLbf',
          label: 'Weight (lbf)',
          value: `${fmt(weightLbf)} lbf`,
          color: 'neutral' as const,
        },
        {
          id: 'massKg',
          label: 'Mass',
          value: `${fmt(massKg)} kg`,
          color: 'neutral' as const,
        },
        {
          id: 'gravityUsed',
          label: 'Gravitational Acceleration',
          value: getGravityLabel(),
          color: 'neutral' as const,
        },
        {
          id: 'formula',
          label: 'Formula',
          value: 'W = m × g',
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `W = ${fmt(massKg)} kg × ${fmt(g)} m/s² = ${fmt(weightN)} N`,
          color: 'neutral' as const,
        },
      ];

      // Human weight conversion
      if (values.massUnit === 'kg' || values.massUnit === 'lb') {
        const m = massToKg(mass, values.massUnit || 'kg');
        if (m > 20 && m < 300) {
          const sel = values.gravitySelect || 'Earth';
          const gVal = getGravity();
          if (sel !== 'custom') {
            results.push({
              id: 'humanComparison',
              label: 'Weight Comparison',
              value: `A ${fmt(m)} kg person weighs ${fmt(m * gVal)} N on ${sel}`,
              color: 'neutral' as const,
            });
          }
        }
      }

      results.push(...buildComparisonResults(massKg, g));

      return results.map(r => ({
        ...r,
        color: (r.color || 'neutral') as 'positive' | 'negative' | 'neutral',
      }));
    }

    if (mode === 'calcMass') {
      const weight = parseFloat(values.weight);
      const g = getGravity();
      if (isNaN(weight) || g === 0) return [];

      const massKg = weight / g;
      const massG = massKg * 1000;
      const massLb = massKg / 0.45359237;

      return [
        {
          id: 'result',
          label: 'Mass (m)',
          value: `${fmt(massKg)} kg`,
          highlight: true,
          color: 'positive' as const,
        },
        { id: 'massG', label: 'Mass (g)', value: `${fmt(massG)} g`, color: 'neutral' as const },
        { id: 'massLb', label: 'Mass (lb)', value: `${fmt(massLb)} lb`, color: 'neutral' as const },
        { id: 'gravityUsed', label: 'Gravitational Acceleration', value: getGravityLabel(), color: 'neutral' as const },
        { id: 'formula', label: 'Formula', value: 'm = W / g', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `m = ${fmt(weight)} N ÷ ${fmt(g)} m/s² = ${fmt(massKg)} kg`,
          color: 'neutral' as const,
        },
      ];
    }

    if (mode === 'calcGravity') {
      const weight = parseFloat(values.weight);
      const mass = parseFloat(values.mass);
      if (isNaN(weight) || isNaN(mass)) return [];

      const massKg = massToKg(mass, values.massUnit || 'kg');
      if (massKg <= 0) {
        return [
          {
            id: 'error',
            label: 'Error',
            value: 'Mass must be greater than 0',
            color: 'negative' as const,
            highlight: true,
          },
        ];
      }
      const g = weight / massKg;

      return [
        {
          id: 'result',
          label: 'Gravitational Acceleration (g)',
          value: `${fmt(g)} m/s²`,
          highlight: true,
          color: 'positive' as const,
        },
        { id: 'massKg', label: 'Mass', value: `${fmt(massKg)} kg`, color: 'neutral' as const },
        { id: 'weightN', label: 'Weight', value: `${fmt(weight)} N`, color: 'neutral' as const },
        { id: 'formula', label: 'Formula', value: 'g = W / m', color: 'neutral' as const },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `g = ${fmt(weight)} N ÷ ${fmt(massKg)} kg = ${fmt(g)} m/s²`,
          color: 'neutral' as const,
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WeightPanel, { values, results });
  },
  educational: {
    formula: 'W = m × g  |  m = W / g  |  g = W / m',
    formulaDescription:
      'Weight is the force of gravity acting on a mass. On Earth, gravity pulls at 9.81 m/s², so a 70 kg person weighs 686.7 N (about 154 lbf). On the Moon, the same person would weigh only 113.4 N.',
    variables: [
      { symbol: 'W', name: 'Weight', description: 'The gravitational force on an object, measured in Newtons (N) or pounds-force (lbf).' },
      { symbol: 'm', name: 'Mass', description: 'The amount of matter in the object, measured in kilograms (kg).' },
      { symbol: 'g', name: 'Gravitational Acceleration', description: 'The acceleration due to gravity, approximately 9.81 m/s² on Earth.' },
    ],
    howToUse: [
      'Select what you want to solve for: Weight (W = m × g), Mass (m = W / g), or Gravity (g = W / m).',
      'Choose a gravity preset (Earth, Moon, Mars, Jupiter, Sun) or select "Custom" to enter your own gravitational acceleration value in m/s².',
      'Enter the known values — the field for the unknown variable will be hidden automatically based on your solve-for selection.',
      'View results in Newtons (N), pounds-force (lbf), and mass in kg. The planet comparison table shows what the same mass would weigh on each celestial body.',
    ],
    workedExamples: [
      {
        scenario: 'NASA engineer Ms. Chen is designing a landing system for a Mars rover. The rover has a mass of 1,025 kg on Earth. The Martian surface gravity is 3.71 m/s². What is the rover\'s weight on Mars, and how does this affect the parachute and thruster design compared to an Earth landing test?',
        inputs: { mode: 'calcWeight', mass: '1025', massUnit: 'kg', gravitySelect: 'Mars' },
        result: 'Weight on Mars: 3,802.75 N (855 lbf); Earth comparison: 10,055.25 N (2,260 lbf)',
        insight: 'On Earth: 1,025 kg × 9.81 m/s² = 10,055 N (2,260 lbf). On Mars: 1,025 kg × 3.71 m/s² = 3,803 N (855 lbf). The rover weighs only 38% as much on Mars as on Earth. This means the parachute system can be much smaller, the landing thrusters need less thrust, and the terminal velocity during descent is lower. However, the rover\'s mass (inertia during braking and cornering) is still 1,025 kg — mass is invariant — so the suspension and structural loads during driving are unchanged regardless of gravity.',
      },
      {
        scenario: 'Physics teacher Mr. Okonkwo is preparing a demonstration for his class. He has a 500-gram laboratory mass and a spring scale calibrated in Newtons. He wants to verify the scale\'s calibration by comparing the measured weight to the calculated weight using g = 9.81 m/s². The scale reads 4.91 N. Is the scale accurate?',
        inputs: { mode: 'calcWeight', mass: '500', massUnit: 'g', gravitySelect: 'Earth' },
        result: 'Weight: 4.905 N (1.103 lbf); Scale error: 0.005 N (0.1%)',
        insight: '500 g = 0.5 kg. Calculated weight: 0.5 × 9.81 = 4.905 N. The scale reads 4.91 N, giving an error of only 0.005 N (0.1%). The scale is well calibrated. For precise lab work, teachers should note that g varies slightly by location — the class should look up the exact local g value from a gravimetric map of their city for the most accurate calibration check.',
      },
      {
        scenario: 'Astronaut trainee Captain Davis is preparing for a lunar mission. On Earth, she and her spacesuit together have a mass of 160 kg, giving an Earth weight of 1,569.6 N (353 lbf). She needs to know her Moon weight for EVA (spacewalk) planning — how much force her boots and tethers need to handle.',
        inputs: { mode: 'calcWeight', mass: '160', massUnit: 'kg', gravitySelect: 'Moon' },
        result: 'Weight on Moon: 259.2 N (58.3 lbf); 16.5% of Earth weight (1,569.6 N)',
        insight: 'On the Moon: 160 kg × 1.62 m/s² = 259.2 N (58.3 lbf). Her Moon weight is only 16.5% of her Earth weight. For EVA planning: (a) boot traction needs are reduced — only 58 lbf of downward force compared to 353 lbf on Earth; (b) if she jumps with the same leg force as on Earth, she will reach much greater heights; (c) tool tethers rated for 100 lbf on Earth can handle the same loads on the Moon because mass (inertia) is unchanged, even though weight is less — a swinging 5 kg tool still has the same momentum.',
      },
    ],
    proTips: [
      'Mass is constant everywhere in the universe. Weight changes with gravity. When you hear "I weigh 70 kg," that is technically mass, not weight — the person\'s actual weight is 70 × 9.81 = 686.7 N. On the Moon, they would still be 70 kg in mass but weigh only 113.4 N.',
      'Use the custom gravity option to explore hypothetical planets or exoplanets. For example, the exoplanet Kepler-442b has an estimated surface gravity of approximately 1.3 × Earth (12.75 m/s²) — a 70 kg person would weigh 892.5 N there, equivalent to carrying an extra 46 lb backpack on Earth at all times.',
      'The planet comparison results are computed automatically for every calculation. When solving for mass or gravity, use the Moon/Mars/Jupiter/Sun weight values as sanity checks — they should be approximately 1/6, 3/8, 2.5×, and 28× the Earth weight respectively.',
      'For engineering applications, always work in Newtons (SI units), not pounds-force. The Newton is defined directly from base SI units (1 N = 1 kg·m/s²) and avoids the confusion between lb (mass) and lbf (force) that plagues imperial-unit calculations.',
      'When using the calcGravity mode (solving for g), you can experimentally determine the gravitational acceleration of an unknown environment. If an object of known mass experiences a measured force, g = F/m. This is how gravity is measured on other planets by lander missions.',
    ],
    limitations: [
      'This calculator uses the simplified W = mg formula assuming uniform gravitational fields. For very large objects (planetary scale) or very precise measurements, gravitational field variations across the object\'s volume (tidal forces) are not accounted for.',
      'The weight values shown are the gravitational force at the surface or at a specified reference radius. If you are at altitude (e.g., in orbit or on a mountain), the actual g value is slightly lower than the surface value — use the custom gravity option for altitude-adjusted calculations.',
      'The planetary gravity presets use average surface values. On Earth, g varies from 9.78 m/s² (equator) to 9.83 m/s² (poles). On Mars, g varies with the topography by about 0.5%. The calculator uses single average values for simplicity.',
      'For gas giants (Jupiter, Saturn), "surface gravity" is defined at the 1-bar pressure level in the atmosphere, not a solid surface. The gravity value provided corresponds to this reference level, which is the standard convention in planetary science.',
      'This calculator treats weight as a scalar quantity. In classical mechanics, weight is actually a vector (it has direction — toward the center of the gravitating body). For most applications, the scalar magnitude is sufficient; use a vector calculator if you need directional components.',
    ],
    quickReference: [
      { label: 'Earth gravity', value: '9.81 m/s²' },
      { label: 'Moon gravity', value: '1.62 m/s² (0.165 × Earth)' },
      { label: 'Mars gravity', value: '3.71 m/s² (0.378 × Earth)' },
      { label: 'Jupiter gravity', value: '24.79 m/s² (2.53 × Earth)' },
      { label: 'Sun gravity', value: '274 m/s² (27.9 × Earth)' },
      { label: '1 Newton to lbf', value: '0.224809 lbf' },
      { label: '1 lbf to Newtons', value: '4.44822 N' },
      { label: '1 kg to lb (mass)', value: '2.20462 lb' },
      { label: 'Weight formula', value: 'W = m × g' },
      { label: 'Mass invariance', value: 'Mass is constant; weight changes with g' },
    ],
    commonUses: [
      'Physics and engineering education — demonstrating the difference between mass (scalar, invariant) and weight (force, gravity-dependent)',
      'Space mission planning — calculating lander forces, rover traction, and astronaut mobility for different target bodies',
      'Laboratory calibration — verifying force sensors, spring scales, and load cells using known masses and the local gravitational acceleration',
      'Structural engineering — converting between mass loads (kg) and force loads (N or lbf) for beam, column, and foundation calculations',
      'Weightlifting and fitness — comparing the effective loads of barbells and dumbbells used on Earth (in Newtons) and hypothetical training scenarios on other planets',
    ],
    explanation:
      'Weight is not the same as mass. Weight is the force exerted by gravity on a mass: W = mg. While mass is constant, weight changes depending on where you are. On Earth, g = 9.81 m/s². The Moon has g = 1.62 m/s² (about 1/6 of Earth), and Jupiter has g = 24.79 m/s² (about 2.5× Earth). A 70 kg person weighs 686.7 N on Earth, but only 113.4 N on the Moon and a crushing 1735.3 N on Jupiter. Practical example: if you weigh 154 lbs on Earth (about 70 kg), your weight in Newtons is 70 × 9.81 = 686.7 N. To convert Newtons to pounds-force, multiply by 0.224809: 686.7 × 0.224809 = 154.3 lbf. On Mars (g = 3.71 m/s²), the same person weighs 70 × 3.71 = 259.7 N, or about 58.4 lbf — that is only 38% of your Earth weight. Edge cases: astronauts in orbit around Earth experience microgravity not because gravity is absent (gravity at the ISS altitude is still about 90% of surface gravity) but because they are in continuous free fall. Their apparent weight is near zero, but their mass is unchanged. For extremely precise measurements, gravity varies by location on Earth — it is about 9.78 m/s² at the equator and 9.83 m/s² at the poles due to Earth\'s rotation and equatorial bulge. Elevation also matters: at 5,000 meters, gravity is about 9.79 m/s². For springs and force gauges, weight is the force that stretches or compresses them. A spring scale calibrated on Earth would give incorrect readings on the Moon because it measures force (weight), not mass. A balance scale, which compares masses, would give the same reading anywhere.',
    faqs: [
      {
        question: 'What is the difference between mass and weight?',
        answer: 'Mass is the amount of matter in an object, measured in kilograms (kg), and is constant everywhere in the universe. Weight is the gravitational force acting on that mass, measured in Newtons (N), and changes depending on the local gravitational field. A 70 kg person has a mass of 70 kg on Earth, the Moon, and in deep space — but their weight changes from 686.7 N on Earth to 113.4 N on the Moon to nearly zero in deep space. Bathroom scales measure force (weight) and convert to kg by assuming Earth gravity, which is why the same scale would give wrong readings on the Moon.',
      },
      {
        question: 'How do I convert Newtons to pounds-force?',
        answer: '1 Newton = 0.224809 pounds-force (lbf). To convert N to lbf, multiply by 0.224809. For example, 686.7 N × 0.224809 ≈ 154.3 lbf. To convert lbf to N, multiply by 4.44822. Important: do not confuse pounds-force (lbf, a unit of force) with pounds-mass (lb, a unit of mass). In everyday language, "pounds" usually means pounds-mass on Earth, where 1 lb-mass weighs 1 lbf under standard gravity — but this equivalence only holds on Earth.',
      },
      {
        question: 'What is the value of g on other planets?',
        answer: 'Mercury: 3.7 m/s², Venus: 8.87 m/s², Earth: 9.81 m/s², Moon (Earth\'s): 1.62 m/s², Mars: 3.71 m/s², Jupiter: 24.79 m/s², Saturn: 10.44 m/s², Uranus: 8.69 m/s², Neptune: 11.15 m/s², Sun: 274 m/s². For comparison, a 70 kg person would weigh 260 N on Mars (about 58 lbf, or 38% of Earth weight), 1,735 N on Jupiter (390 lbf, about 2.5× Earth weight), and 19,180 N on the Sun (4,312 lbf, about 28× Earth weight).',
      },
      {
        question: 'Why do astronauts float in the International Space Station if gravity still exists at that altitude?',
        answer: 'At the ISS altitude (~400 km), Earth\'s gravity is still about 89% of surface gravity (approximately 8.7 m/s²). Astronauts float not because there is no gravity, but because they are in continuous free fall. The ISS is constantly falling toward Earth but moving forward fast enough (~17,500 mph) that the curvature of the Earth falls away beneath it at the same rate. This creates a state of microgravity (apparent weightlessness) where astronauts and the station fall together. Their mass is unchanged, and their actual gravitational weight (if they were standing on a platform at that altitude) would be 89% of their Earth weight — but since everything around them is falling at the same rate, their apparent weight relative to their surroundings is near zero.',
      },
      {
        question: 'Would I weigh the same at the equator vs. the North Pole?',
        answer: 'No. Your weight varies by about 0.5% between the equator and the poles for two reasons: (1) Earth\'s rotation creates a centrifugal effect that reduces apparent weight at the equator (maximum effect where rotational velocity is highest), and (2) the Earth is not a perfect sphere — it bulges at the equator due to rotation, placing you about 21 km farther from Earth\'s center there. At the equator, g ≈ 9.78 m/s²; at the poles, g ≈ 9.83 m/s². A 70 kg person weighs about 684.6 N at the equator and 688.1 N at the North Pole — a difference of about 0.8 lbf. This variation is measurable with precision instruments but not noticeable in daily life.',
      },
      {
        question: 'Why do we say "I weigh 70 kg" if kg is a unit of mass, not weight?',
        answer: 'This is a common linguistic shortcut that conflates mass and weight. In everyday life on Earth, gravity is nearly constant (g ≈ 9.81 m/s²), so mass and weight are proportional — a scale measures weight (force) but displays kilograms by dividing the force by 9.81. This works fine on Earth but would fail on the Moon. Scientists and engineers use Newtons for weight (force) and kilograms for mass to avoid ambiguity. A doctor\'s office scale showing "70 kg" is actually measuring approximately 686.7 N of force and converting. In physics classrooms, the distinction is drilled early: "mass is not weight." In formal SI usage, body weight should be reported in Newtons, but convention (and convenience) favors kilograms for medical and everyday contexts.',
      },
      {
        question: 'How are planetary gravity values measured without landing on the planet?',
        answer: 'For planets with moons, gravity is determined from the orbital radius and period of the moons using Kepler\'s third law: GM = 4π²r³/T². The mass M is computed first, then surface gravity g = GM/R² where R is the planet\'s radius. For planets without moons (Mercury, Venus), spacecraft flybys measure trajectory deflections — the planet\'s gravity bends the spacecraft\'s path, and the amount of bending reveals the mass. Once mass and radius are known, surface gravity is straightforward. For exoplanets, mass is estimated from the radial velocity wobble of the host star, and radius from transit depth — together giving surface gravity estimates with varying accuracy.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Weight = Mass × Gravity</text><rect x="30" y="40" width="90" height="46" rx="6" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="75" y="58" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)" font-weight="bold">Mass (m)</text><text x="75" y="75" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">70 kg</text><text x="135" y="68" text-anchor="middle" font-size="18" fill="var(--svg-333333)">×</text><rect x="155" y="40" width="90" height="46" rx="6" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="200" y="58" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)" font-weight="bold">Gravity (g)</text><text x="200" y="75" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">9.81 m/s²</text><text x="260" y="68" text-anchor="middle" font-size="18" fill="var(--svg-333333)">=</text><rect x="30" y="100" width="260" height="36" rx="6" fill="var(--svg-ef4444)" opacity="0.8"/><text x="160" y="118" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)" font-weight="bold">Weight (W) = 686.7 N</text><text x="160" y="132" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">≈ 154.3 pounds-force</text><text x="160" y="160" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Same 70 kg person across planets:</text><rect x="15" y="170" width="65" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.3"/><text x="47" y="183" text-anchor="middle" font-size="9" fill="var(--svg-333333)">Moon: 113 N</text><rect x="88" y="170" width="65" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="120" y="183" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Mars: 260 N</text><rect x="161" y="170" width="65" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="193" y="183" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Jupiter: 1735 N</text><rect x="234" y="170" width="72" height="18" rx="4" fill="var(--svg-ef4444)"/><text x="270" y="183" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Sun: 19180 N</text></svg>',
      alt: 'Weight formula diagram showing mass times gravity equals weight, with planet comparisons',
      caption: 'Weight (W = m × g) changes with gravity while mass stays constant across planets.',
    },
    citations: [
      { source: 'Wikipedia', title: 'Weight', url: 'https://en.wikipedia.org/wiki/Weight' },
      { source: 'Wolfram MathWorld', title: 'Weight', url: 'https://mathworld.wolfram.com/Weight.html' },
    ],
  },
};

export default weightConfig;
