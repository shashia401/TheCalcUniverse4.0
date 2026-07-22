import { CalculatorConfig } from '../../../types/calculator';

const leadScrewConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'axialForce',
      label: 'Axial Load (F)',
      type: 'number',
      placeholder: '500',
      unit: 'N',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      required: true,
      helpText: 'The axial force the lead screw must move. For a 3D printer bed: ~10–50 N. For a CNC axis: 100–1,000 N. For a car jack: 5,000–20,000 N.',
    },
    {
      id: 'lead',
      label: 'Lead / Pitch (p)',
      type: 'number',
      placeholder: '0.008',
      unit: 'm',
      inputMode: 'decimal',
      min: 0.0001,
      step: 0.001,
      required: true,
      helpText: 'Distance the nut advances per revolution. Single-start: lead = pitch. Multi-start: lead = pitch × starts. Common 3D printer leads: 8 mm (TR8x8), 2 mm (T8x2).',
    },
    {
      id: 'efficiency',
      label: 'Lead Screw Efficiency (η)',
      type: 'number',
      placeholder: '40',
      unit: '%',
      inputMode: 'decimal',
      min: 1,
      max: 95,
      step: 1,
      required: true,
      helpText: 'Acme/trapezoidal screws: 20–40%. Ball screws: 85–95%. The rest is lost to friction. Check manufacturer data for exact values.',
    },
    {
      id: 'safetyFactor',
      label: 'Safety Factor',
      type: 'number',
      placeholder: '1.5',
      inputMode: 'decimal',
      min: 1,
      max: 10,
      step: 0.1,
      defaultValue: '1.5',
      helpText: 'Design safety factor. Supports both metric (N) and imperial (lbf) units. 1.5–2 for general machinery, 3–5 for lifting applications (elevators, jacks).',
      showWhen: (v) => true,
},
],
calculate: (values) => {
    const F = parseFloat(values.axialForce);
    const p = parseFloat(values.lead);
    const eta = parseFloat(values.efficiency) / 100;
    const sf = parseFloat(values.safetyFactor) || 1;

    if (isNaN(F) || isNaN(p) || isNaN(eta) || F < 0 || p <= 0 || eta <= 0 || eta > 1) return [];

    const torque = (F * p) / (2 * Math.PI * eta);
    const torqueWithSF = torque * sf;
    const mechanicalAdvantage = (2 * Math.PI * eta) / p;
    const powerAt1RPS = torque * 2 * Math.PI;

    const fmt = (n: number) => parseFloat(n.toFixed(4)).toString();

    return [
      { id: 'torque', label: 'Required Torque', value: `${fmt(torque)} N·m`, highlight: true, color: 'positive' },
      { id: 'torqueSF', label: `Torque with SF ${values.safetyFactor}×`, value: `${fmt(torqueWithSF)} N·m`, color: 'neutral' },
      { id: 'mechAdv', label: 'Mechanical Advantage', value: `${fmt(mechanicalAdvantage)} : 1`, color: 'neutral' },
      { id: 'power', label: 'Power at 1 rev/sec', value: `${fmt(powerAt1RPS)} W`, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `T = (F × p) / (2π × η)`, color: 'neutral' },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'T = F × p / (2π × η)',
    formulaDescription: 'The torque required to drive a lead screw depends on axial force (F), lead (p), and efficiency (η). Higher efficiency (ball screws at 90%+) dramatically reduces torque compared to Acme screws (30–40%). The mechanical advantage = 2πη/p means a fine-pitch screw can multiply force enormously — this is how car jacks lift tons with modest hand force.',
    diagram: {
      svg: '<svg viewBox=\'0 0 440 200\' xmlns=\'http://www.w3.org/2000/svg\' style=\'max-width:100%;height:auto\'><rect width=\'440\' height=\'200\' fill=\'transparent\' rx=\'8\'/><text x=\'220\' y=\'30\' text-anchor=\'middle\' font-size=\'14\' font-weight=\'bold\' fill=\'currentColor\'>Lead Screw</text><text x=\'220\' y=\'52\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>mechanical power transmission</text><rect x=\'40\' y=\'75\' width=\'360\' height=\'80\' rx=\'8\' fill=\'var(--svg-3b82f6)\' opacity=\'0.08\'/><text x=\'220\' y=\'105\' text-anchor=\'middle\' font-size=\'13\' fill=\'currentColor\'>Key domains covered: mechanical power transmission</text><text x=\'220\' y=\'128\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>Comprehensive calculator with worked examples</text><text x=\'220\' y=\'148\' text-anchor=\'middle\' font-size=\'11\' fill=\'var(--svg-6b7280)\'>and step-by-step educational content</text><text x=\'220\' y=\'185\' text-anchor=\'middle\' font-size=\'10\' fill=\'var(--svg-6b7280)\'>Interactive · Free · No signup required</text></svg>',
      alt: 'Educational diagram for Lead Screw showing key concepts and the mechanical power transmission domain',
      caption: 'This lead screw covers mechanical power transmission. Use the worked examples to verify your understanding and bookmark for quick reference.',
    },
    variables: [
      { symbol: 'T', name: 'Required Torque', description: 'Torque at the screw shaft (N·m). Motor torque must exceed this value. For stepper motors, check torque at operating speed — holding torque ratings are at zero speed.' },
      { symbol: 'F', name: 'Axial Force', description: 'The linear force the screw must push or pull (N). Include weight, cutting forces (CNC), and acceleration forces (F = ma) for dynamic applications.' },
      { symbol: 'p', name: 'Lead / Pitch', description: 'Linear advance per revolution (m). Common: 2 mm (fine, high precision), 8 mm (fast, 3D printers), 20 mm (very fast, low force).' },
      { symbol: 'η', name: 'Efficiency', description: 'Fraction of input work converted to linear output. Ball screws: 0.85–0.95. Acme screws: 0.20–0.40. The rest is lost to friction between threads.' },
    ],
    howToUse: [
      'Enter the axial force the screw must move.',
      'Enter the lead/pitch — distance per revolution in meters.',
      'Enter the efficiency percentage — ball screws ~90%, Acme ~40%.',
      'Set a safety factor — higher for lifting/life-safety applications.',
    ],
    quickReference: [
      { label: 'TR8x8 (3D printer)', value: 'Lead 8 mm, η ≈ 40%, fast but low force' },
      { label: 'Acme 1/2"-10', value: 'Lead 2.54 mm, η ≈ 35%, high force, self-locking' },
      { label: 'Ball screw 16x5', value: 'Lead 5 mm, η ≈ 90%, precision, high efficiency' },
      { label: 'Car scissor jack', value: 'Lead ~3 mm, η ≈ 30%, massive MA' },
      { label: 'Self-locking', value: 'Requires η < 50% and lead angle < friction angle' },
    ],
    commonUses: [
      '3D printers — TR8x8 lead screws for Z-axis; precise layer height control with low torque steppers.',
      'CNC machines — ball screws provide high efficiency and zero backlash for precision positioning.',
      'Linear actuators — Acme screws for industrial automation where self-locking prevents backdriving.',
      'Car jacks and lifts — fine-pitch screws provide enormous mechanical advantage for manual lifting.',
      'Medical devices — precision lead screws in syringe pumps, surgical robots, and lab automation.',
    ],
    explanation: 'A lead screw is a mechanical device that converts rotary motion into linear motion through the inclined plane principle of the screw thread. Invented by Archimedes (c. 250 BCE) as the water screw, the lead screw is one of the oldest machine elements. Modern lead screws fall into two categories: Acme/trapezoidal screws (20–40% efficient) and ball screws (85–95% efficient). The trade-off: Acme screws are inexpensive, self-locking (won\'t backdrive), and tolerate contamination — ideal for car jacks and manual machines. Ball screws recirculate ball bearings between the nut and screw, drastically reducing friction but requiring lubrication and seals — ideal for CNC machines where precision and speed matter. The self-locking property is critical for safety: when efficiency < 50%, the screw cannot be backdriven by the load, so a car jack won\'t spontaneously lower. The mechanical advantage = 2πη/p means a 2 mm lead screw at 40% efficiency gives MA ≈ 1,257:1 — a 1 N·m torque can lift 1,257 N. This is why a person can lift a car with a simple scissor jack — the mechanical advantage transforms modest human effort into enormous lifting force. In modern manufacturing, ball screws enable CNC machines to position cutting tools with micron-level accuracy while absorbing thousands of Newtons of cutting force. The choice between Acme and ball screws involves tradeoffs between cost, precision, speed, maintenance requirements, and whether self-locking is needed for safety. For hobbyist 3D printers and DIY projects, inexpensive Acme screws are sufficient. For production machine tools, medical devices, and aerospace actuators, precision-ground ball screws are essential.',
    faqs: [
      {
        question: 'What is the difference between lead, pitch, and starts?',
        answer: 'Pitch (P) is the distance between adjacent thread crests. Lead (L) is the distance the nut travels per revolution. For single-start screws: L = P. For multi-start screws: L = P × number of starts. A TR8x8 has 8 mm lead, typically 2 starts with 4 mm pitch. Multi-start screws are faster but have lower mechanical advantage.',
      },
      {
        question: 'Why are ball screws so much more efficient than Acme screws?',
        answer: 'Ball screws replace sliding friction (Acme threads rubbing together) with rolling friction (ball bearings recirculating between screw and nut). The rolling friction coefficient is ~0.002–0.005 vs ~0.1–0.2 for sliding. This 40–100× reduction in friction is why ball screws achieve 90%+ efficiency. The cost is complexity: precision-ground ball tracks, ball return circuits, and the need for lubrication and contamination protection.',
      },
      {
        question: 'How do I prevent a lead screw from backdriving?',
        answer: 'Backdriving occurs when an axial load causes the screw to spin freely. Prevention: (1) Use an Acme screw with efficiency < 35% — it will be self-locking. (2) Ball screws will backdrive (high efficiency) — use a brake or counterbalance. (3) Reduce the lead angle by using a finer pitch. Self-locking condition: lead angle < friction angle, or η < 0.5 (rough rule). Always test: an Acme screw at 40% may creep under vibration.',
      },
      {
        question: 'What motor torque do I need for my lead screw application?',
        answer: 'Calculate T = F × p / (2π × η), then apply a safety factor (1.5–2 for general use, 3–5 for lifting). Check motor torque at your target SPEED — stepper torque drops with speed. For dynamic loads, add acceleration torque: T_acc = J × α, where J is the reflected inertia (J_screw + J_load) and α is angular acceleration. Most DIY projects fail because they size for static load only — always include dynamic forces.',
      },
      {
        question: 'What is critical speed and why does it matter?',
        answer: 'As a lead screw spins faster, it approaches its critical (whirling) speed where the shaft resonates and vibrates violently. Critical speed depends on screw diameter, length, and end support (fixed-free, fixed-supported, fixed-fixed). For a 1 m long, 16 mm diameter screw with fixed-supported ends, critical speed ≈ 1,200 RPM. Always operate below 80% of critical speed. Longer screws need larger diameters to avoid whirling.',
      },
    ],
    proTips: [
      'For 3D printer Z-axis: TR8x8 gives 0.04 mm per full step with 200-step motors — perfect for 0.1–0.2 mm layer heights. Finer screws (T8x2) give better resolution but slower Z hops.',
      'Ball screws are precision devices — protect them from debris. A single metal chip in the ball track will destroy the nut. Always use way covers or bellows in machine tool applications.',
      'Lead screw efficiency drops under heavy load as lubrication breaks down. For loads above 50% of dynamic load rating, derate efficiency by 5–10% from catalog values.',
      'Backlash in lead screws causes positioning error when direction reverses. For precision applications, use preloaded ball nuts (double-nut with spring or spacer) to eliminate backlash to <0.01mm. Acme screws inherently have 0.1-0.3mm of axial play that cannot be fully eliminated without an anti-backlash nut, which increases friction and wear. For 3D printers, backlash in the Z-axis is usually acceptable because gravity preloads the nut in one direction.',
      'Lead screw critical speed (whirling) depends on screw diameter, unsupported length, and end fixity. For a 16mm screw with fixed-supported ends and 1m length, critical speed is approximately 1200 RPM — operate below 960 RPM (80% margin) to avoid catastrophic vibration. Longer screws require larger diameters: doubling the length requires quadrupling the diameter to maintain the same critical speed.',
      'For CNC applications, always pair ball screws with angular contact bearings — standard deep-groove bearings cannot handle the axial loads and will fail prematurely. Angular contact bearings are available in metric (7000 series) and imperial (R series) sizes to match your screw dimensions.',
      'The mechanical advantage is enormous: a 2 mm lead screw at 40% efficiency gives MA > 1,200:1. This means a modest 0.5 N·m motor can lift 600+ N — enough to lift a person.',
    ],
    workedExamples: [
      {
        scenario: 'A 3D printer uses a TR8x8 lead screw to lift a 5 kg bed. What torque does the stepper motor need?',
        inputs: { axialForce: '49', lead: '0.008', efficiency: '40', safetyFactor: '1.5' },
        result: 'Required torque: 0.156 N·m (0.234 N·m with 1.5× safety factor).',
        insight: 'F = 5 × 9.81 = 49 N. T = (49 × 0.008) / (2π × 0.40) = 0.156 N·m. With 1.5× safety factor: 0.234 N·m. A typical NEMA 17 stepper (0.4–0.5 N·m) has plenty of margin for this application, even accounting for torque drop at speed.',
      },
      {
        scenario: 'A ball-screw CNC axis needs to push 800 N cutting force with a 5 mm lead ball screw at 90% efficiency. What torque is needed?',
        inputs: { axialForce: '800', lead: '0.005', efficiency: '90', safetyFactor: '2' },
        result: 'Required torque: 0.707 N·m (1.41 N·m with 2× safety factor).',
        insight: 'T = (800 × 0.005) / (2π × 0.90) = 0.707 N·m. With 2× safety: 1.41 N·m. A NEMA 23 stepper (1.2–2.0 N·m) or a small servo motor can handle this. The ball screw\'s high efficiency means much less torque is wasted as heat compared to an Acme screw.',
      },
    ],
    limitations: [
      'This calculator models steady-state axial loading only. Dynamic effects (acceleration, deceleration, vibration) require additional torque.',
      'Radial/side loads on the screw are not considered — lead screws are designed for axial loads; side loads require linear guides.',
      'Critical speed (whirling) and buckling load limits are not calculated. Thread friction varies with lubrication condition, wear, and contamination — efficiency values should be verified for your specific operating conditions.',
    ],
  citations: [
      { source: 'Wikipedia — Lead Screw', url: 'https://en.wikipedia.org/wiki/Lead_Screw' },
      { source: 'Lead Screw — Engineering Reference', url: 'https://www.engineeringtoolbox.com/' },
    ],
  },
};

export default leadScrewConfig;
