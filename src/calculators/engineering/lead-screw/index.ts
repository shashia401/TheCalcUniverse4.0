import { CalculatorConfig } from '../../../types/calculator';
import { roundStr4 as fmt } from '../../../lib/format';
import { finiteSteps } from '../../../utils/explainGuard';

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
      max: 10000000,
      step: 1,
      required: true,
      helpText: 'The axial force the lead screw must move (weight, cutting force and friction). A 5 kg load is about 49 N.',
    },
    {
      id: 'lead',
      label: 'Lead / Pitch (p)',
      type: 'number',
      placeholder: '0.008',
      unit: 'm',
      inputMode: 'decimal',
      min: 0.0001,
      max: 0.5,
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
      helpText: 'Acme/trapezoidal screws are typically about 20–40% efficient and ball screws about 85–95%. The rest is lost to friction. Check manufacturer data for exact values.',
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
      helpText: 'Design margin applied to the calculated torque. Pick it from the standard or code for your application; the higher values are used where failure endangers people (lifting, jacks).',
    },
],
calculate: (values) => {
    const F = parseFloat(values.axialForce);
    const p = parseFloat(values.lead);
    const eta = parseFloat(values.efficiency) / 100;
    const sf = parseFloat(values.safetyFactor) || 1;

    if (![F, p, eta].every(Number.isFinite) || F < 0 || p <= 0 || eta <= 0 || eta > 1) return [];

    const torque = (F * p) / (2 * Math.PI * eta);
    const torqueWithSF = torque * sf;
    const mechanicalAdvantage = (2 * Math.PI * eta) / p;
    const powerAt1RPS = torque * 2 * Math.PI;

    return [
      { id: 'torque', label: 'Required Torque', value: `${fmt(torque)} N·m`, highlight: true, color: 'positive' },
      { id: 'torqueSF', label: `Torque with SF ${sf}×`, value: `${fmt(torqueWithSF)} N·m`, color: 'neutral' },
      { id: 'mechAdv', label: 'Mechanical Advantage', value: `${fmt(mechanicalAdvantage)} : 1`, color: 'neutral' },
      { id: 'power', label: 'Power at 1 rev/sec', value: `${fmt(powerAt1RPS)} W`, color: 'neutral' },
      { id: 'formula', label: 'Formula Used', value: `T = (F × p) / (2π × η)`, color: 'neutral' },
    ];
  },

  explainSteps: (values) => {
    const F = parseFloat(values.axialForce);
    const p = parseFloat(values.lead);
    const etaPct = parseFloat(values.efficiency);
    const eta = etaPct / 100;
    const sf = parseFloat(values.safetyFactor) || 1;
    if (![F, p, eta].every(Number.isFinite) || F < 0 || p <= 0 || eta <= 0 || eta > 1) return [];
    const torque = (F * p) / (2 * Math.PI * eta);
    return finiteSteps([
      { label: 'Torque to push the load', expr: `T = (F × p) ÷ (2π × η) = (${fmt(F)} N × ${fmt(p)} m) ÷ (2π × ${fmt(eta)}) = ${fmt(torque)} N·m`, note: 'One revolution moves the load one lead; efficiency η covers thread friction.' },
      { label: 'Apply the safety factor', expr: `${fmt(torque)} N·m × ${sf} = ${fmt(torque * sf)} N·m` },
      { label: 'Mechanical advantage', expr: `2π × η ÷ p = 2π × ${fmt(eta)} ÷ ${fmt(p)} = ${fmt((2 * Math.PI * eta) / p)} : 1` },
      { label: 'Power at 1 revolution per second', expr: `P = T × 2π × 1 rev/s = ${fmt(torque)} × 2π = ${fmt(torque * 2 * Math.PI)} W` },
    ]);
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return null;
  },
  educational: {
    formula: 'T = F × p / (2π × η)',
    formulaDescription: 'The torque required to drive a lead screw depends on axial force (F), lead (p), and efficiency (η). Higher efficiency (ball screws at 90%+) dramatically reduces torque compared to Acme screws (30–40%). The mechanical advantage = 2πη/p means a fine-pitch screw can multiply force enormously — this is how car jacks lift tons with modest hand force.',
    diagram: {
      svg: '<svg viewBox="0 0 440 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">Lead Screw Torque</text><rect x="20" y="40" width="400" height="44" rx="8" fill="var(--svg-3b82f6)" opacity="0.1"/><text x="220" y="68" text-anchor="middle" font-size="16" fill="currentColor">T = F · p / (2π · η)</text><text x="220" y="100" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">F in N · p in m · η as a fraction</text></svg>',
      alt: 'Lead screw torque formula: axial force times lead divided by two pi times efficiency',
      caption: 'Torque to turn a lead screw rises with load and lead and falls with efficiency.',
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
      { label: 'TR8x8 (P2) 3D printer screw', value: 'Lead 8 mm (4 starts, 2 mm pitch)' },
      { label: 'Acme 1/2"-10', value: 'Lead 2.54 mm (1/10 inch), self-locking in typical use' },
      { label: 'Ball screw 16x5', value: 'Lead 5 mm, high efficiency, will backdrive' },
      { label: 'Self-locking', value: 'Requires η < 50% (lead angle below the friction angle)' },
      { label: 'Mechanical advantage', value: '2π η / p (N of force per N·m of torque)' },
    ],
    commonUses: [
      '3D printers — TR8x8 lead screws for the Z-axis; precise layer height control with low-torque steppers.',
      'CNC machines — ball screws provide high efficiency and zero backlash for precision positioning.',
      'Linear actuators — Acme screws for industrial automation where self-locking prevents backdriving.',
      'Car jacks and lifts — fine-pitch screws provide enormous mechanical advantage for manual lifting.',
      'Medical devices — precision lead screws in syringe pumps, surgical robots, and lab automation.',
    ],
    explanation: 'A lead screw is a mechanical device that converts rotary motion into linear motion through the inclined plane principle of the screw thread. The screw as a machine element goes back to antiquity (the water screw is traditionally attributed to Archimedes), making it one of the oldest machine elements. Modern lead screws fall into two categories: Acme/trapezoidal screws (20–40% efficient) and ball screws (85–95% efficient). The trade-off: Acme screws are inexpensive, self-locking (won\'t backdrive), and tolerate contamination — ideal for car jacks and manual machines. Ball screws recirculate ball bearings between the nut and screw, drastically reducing friction but requiring lubrication and seals — ideal for CNC machines where precision and speed matter. The self-locking property is critical for safety: when efficiency < 50%, the screw cannot be backdriven by the load, so a car jack won\'t spontaneously lower. The mechanical advantage = 2πη/p means a 2 mm lead screw at 40% efficiency gives MA ≈ 1,257:1 — a 1 N·m torque can lift 1,257 N. This is why a person can lift a car with a simple scissor jack — the mechanical advantage transforms modest human effort into enormous lifting force. In modern manufacturing, ball screws enable CNC machines to position cutting tools with micron-level accuracy while absorbing thousands of Newtons of cutting force. The choice between Acme and ball screws involves tradeoffs between cost, precision, speed, maintenance requirements, and whether self-locking is needed for safety. For hobbyist 3D printers and DIY projects, inexpensive Acme screws are sufficient. For production machine tools, medical devices, and aerospace actuators, precision-ground ball screws are essential.',
    faqs: [
      {
        question: 'How do I convert lead screw torque to force (or force to torque)?',
        answer: 'The same formula runs both directions. Force to torque: T = (F × p) / (2π × η). Torque to force: F = (T × 2π × η) / p. For example, a TR8x8 screw (8 mm lead) at 40% efficiency needs T = (49 × 0.008) / (2π × 0.40) ≈ 0.156 N·m to push a 49 N load (a 5 kg 3D-printer bed) — and working backwards, a stepper delivering 0.156 N·m through that same screw produces 49 N of axial force. This calculator solves the force-to-torque direction directly above; rearrange the formula for the reverse.',
      },
      {
        question: 'How do I calculate ball screw torque?',
        answer: 'Use T = (F × p) / (2π × η), where F is the axial force in newtons, p is the screw lead in meters, and η is the efficiency as a decimal (ball screws typically run 0.85–0.95). For example, an 800 N cutting load on a 5 mm lead ball screw at 90% efficiency needs T = (800 × 0.005) / (2π × 0.90) ≈ 0.71 N·m — then apply a safety factor appropriate to your design standard before sizing the motor.',
      },
      {
        question: 'What is the difference between lead, pitch, and starts?',
        answer: 'Pitch (P) is the distance between adjacent thread crests. Lead (L) is the distance the nut travels per revolution. For single-start screws: L = P. For multi-start screws: L = P × number of starts. A common TR8x8 (P2) screw has an 8 mm lead made of 4 starts with 2 mm pitch. Multi-start screws are faster but have lower mechanical advantage.',
      },
      {
        question: 'Why are ball screws so much more efficient than Acme screws?',
        answer: 'Ball screws replace sliding friction (Acme threads rubbing together) with rolling friction (ball bearings recirculating between screw and nut). The effective friction coefficient of a ball screw is on the order of 0.01 or less, versus roughly 0.1–0.2 for lubricated sliding threads. That large reduction is why ball screws reach about 90% efficiency. The cost is complexity: precision-ground ball tracks, ball return circuits, and the need for lubrication and contamination protection.',
      },
      {
        question: 'How do I prevent a lead screw from backdriving?',
        answer: 'Backdriving occurs when an axial load makes the screw turn by itself. Prevention: (1) use an Acme screw with efficiency below 50% — the screw is then self-locking (lead angle below the friction angle), though vibration can still creep it. (2) Ball screws (high efficiency) will backdrive — use a brake, a self-locking gearbox or a counterbalance. (3) A smaller lead lowers the lead angle.',
      },
      {
        question: 'What motor torque do I need for my lead screw application?',
        answer: 'Calculate T = F × p / (2π × η), then apply a safety factor suited to your application. Check motor torque at your target SPEED — stepper torque drops with speed. For dynamic loads, add acceleration torque: T_acc = J × α, where J is the reflected inertia (J_screw + J_load) and α is angular acceleration. Most DIY projects fail because they size for static load only — always include dynamic forces.',
      },
      {
        question: 'What is critical speed and why does it matter?',
        answer: 'As a lead screw spins faster it approaches its critical (whirling) speed, where the shaft resonates and vibrates violently. Critical speed scales with screw diameter divided by the square of the unsupported length (n ∝ d / L²) and depends strongly on the end supports (fixed-fixed is highest, simple-simple lowest). Manufacturers publish critical-speed charts or formulas for their screws; keep operating speed well below the limit (a margin of about 20–30% is commonly used) and use a larger diameter or intermediate support for long screws.',
      },
    ],
    proTips: [
      'For 3D printer Z-axis: TR8x8 gives 0.04 mm per full step with 200-step motors — perfect for 0.1–0.2 mm layer heights. Finer screws (T8x2) give better resolution but slower Z hops.',
      'Ball screws are precision devices — protect them from debris. A single metal chip in the ball track will destroy the nut. Always use way covers or bellows in machine tool applications.',
      'Catalog efficiency is measured under specific lubrication and load conditions; worn, dry or heavily loaded screws can be less efficient, so verify the figure for your conditions.',
      'Backlash in lead screws causes positioning error when direction reverses. Precision applications use preloaded ball nuts (double-nut with spring or spacer) or anti-backlash nuts on Acme screws, which remove play but add friction and wear. For 3D printers, Z-axis backlash is usually tolerable because gravity preloads the nut in one direction.',
      'Lead screw critical speed (whirling) depends on screw diameter, unsupported length and end fixity, scaling as d / L². Doubling the length therefore needs four times the diameter to keep the same critical speed.',
      'For CNC applications, pair ball screws with bearings rated for axial load (angular-contact or dedicated screw-support bearings); ordinary deep-groove bearings are not meant for heavy thrust.',
      'Mechanical advantage is 2πη/p: a 2 mm lead at 40% efficiency gives about 1,257 N of axial force per N·m of torque, so a 0.5 N·m motor can push roughly 630 N (before friction in bearings and guides).',
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
      { source: 'Wikipedia — Lead Screw', url: 'https://en.wikipedia.org/wiki/Leadscrew' },
    ],
  },
};

export default leadScrewConfig;
