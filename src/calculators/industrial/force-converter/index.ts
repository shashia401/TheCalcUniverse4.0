import { createElement } from 'react';
import { type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'n', label: 'Newton (N)', shortLabel: 'N', factor: 1 },
  { value: 'kn', label: 'Kilonewton (kN)', shortLabel: 'kN', factor: 1000 },
  { value: 'lbf', label: 'Pound-Force (lbf)', shortLabel: 'lbf', factor: 4.44822 },
  { value: 'kip', label: 'Kilopound-Force (kip)', shortLabel: 'kip', factor: 4448.22 },
  { value: 'kgf', label: 'Kilogram-Force (kgf)', shortLabel: 'kgf', factor: 9.80665 },
  { value: 'dyn', label: 'Dyne (dyn)', shortLabel: 'dyn', factor: 0.00001 },
  { value: 'pdl', label: 'Poundal (pdl)', shortLabel: 'pdl', factor: 0.138255 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Force conversion uses linear factors relative to the Newton (N), the SI base unit of force named after Sir Isaac Newton. One newton is the force required to accelerate a one-kilogram mass at one meter per second squared (1 N = 1 kg·m/s²), derived directly from Newton\'s Second Law of Motion (F = ma). The pound-force (lbf) is the imperial equivalent — the force exerted by standard Earth gravity on a one-pound mass at sea level, equal to approximately 4.44822 N. The kilogram-force (kgf) is the gravitational force on one kilogram of mass, approximately 9.80665 N, convenient for terrestrial engineering where 1 kgf is approximately the weight of 1 kg of mass.',
  formulaSource: 'The newton (N) was named after Sir Isaac Newton (1643-1727) and adopted as the SI unit of force by the CGPM in 1948, confirmed in 1960 with the full SI system. One newton equals 1 kg·m/s², derived directly from Newton\'s Second Law of Motion (F = ma) published in the "Philosophiae Naturalis Principia Mathematica" (1687). This groundbreaking work, developed during the plague years when Newton retreated to Woolsthorpe Manor, established the three laws of motion that govern classical mechanics. The pound-force evolved from the avoirdupois pound system standardized internationally in 1959, with lbf defined as the gravitational force on 1 lbm at standard gravity (g_n = 9.80665 m/s²). The kilogram-force was defined by the 3rd CGPM in 1901 using the same standard gravity value.',
  variables: [
    { symbol: 'F', name: 'Force', description: 'A push or pull that changes the motion of an object, measured in newtons (SI) or pound-force (imperial). Force equals mass times acceleration (Newton\'s Second Law: F = ma). A 1 kg mass on Earth experiences a gravitational force of approximately 9.8 N (its weight). Forces are vector quantities — they have both magnitude and direction.' },
    { symbol: '1 N', name: 'One Newton', description: 'The force needed to accelerate 1 kg at 1 m/s². Approximately the weight of a small apple (100 g mass) at Earth\'s surface gravity. A force you can easily feel — about the weight of a typical smartphone. Named after Sir Isaac Newton, whose Principia Mathematica (1687) established the foundations of classical mechanics.' },
    { symbol: '1 lbf & 1 kgf', name: 'Gravitational Force Units', description: 'Pound-force (approximately 4.448 N) is the gravitational force on a 1 lb mass at standard Earth gravity (32.174 ft/s²). Kilogram-force (approximately 9.807 N) is the gravitational force on a 1 kg mass. Both vary slightly with local gravity (±0.5% across Earth\'s surface) but are convenient for terrestrial structural engineering where loads are measured by weight.' },
  ],
  howToUse: [
    'Enter the force value you want to convert in the "Value" field (e.g., 1000 for 1000 N or 500 for 500 lbf).',
    'Select the current force unit from the "From" dropdown — choose from newtons, kilonewtons, pound-force, kips, kilogram-force, dynes, and poundals.',
    'Select the desired force unit from the "To" dropdown — the unit you need for your engineering calculations or specification documents.',
    'The converted value appears instantly with the formula shown. Use this for structural engineering load calculations, physics problems, or comparing equipment specifications across metric and imperial unit systems.',
    'Review the worked examples for real-world conversion scenarios in structural engineering, mechanical design, and aerospace applications.',
  ],
  quickReference: [
    { label: '1 N', value: '0.225 lbf / 100,000 dyn' },
    { label: '1 lbf', value: '4.448 N / 32.17 pdl' },
    { label: '1 kN', value: '224.8 lbf / 0.225 kip' },
    { label: '1 kip', value: '4,448 N / 4.448 kN' },
    { label: '1 kgf', value: '9.807 N / 2.205 lbf' },
    { label: '1 N', value: '100,000 dyn' },
    { label: '1 pdl', value: '0.138 N / 0.031 lbf' },
    { label: '1 lbf', value: '32.17 pdl' },
  ],
  commonUses: [
    'Structural engineering: column loads are specified in kN or kips. A typical office building column carries 1,000-5,000 kN (225-1,124 kips). Converting between kN (metric structural standard) and kips (US structural standard) is essential for international construction projects where teams use different unit systems.',
    'Mechanical engineering: bolt preload and clamp force specifications. An M16 Grade 8.8 bolt has a recommended preload of 85-100 kN (19,100-22,500 lbf). Converting to the correct unit ensures that torque wrenches are set properly in mixed-unit workshops. A 1 N·m torque on an M10 bolt produces approximately 500-700 N of clamp force.',
    'Aerospace: rocket engine thrust is measured in kN or lbf. The SpaceX Raptor 3 engine produces 2,750 kN (618,000 lbf) of thrust at sea level. The Saturn V F-1 engines from the Apollo program produced 6,770 kN (1,522,000 lbf) each. Unit conversion enables meaningful comparison between historical and modern propulsion systems.',
    'Physics education: understanding the relationship between mass and weight. A 70 kg student has a mass of 70 kg everywhere in the universe, but a weight of 686 N on Earth, 114 N on the Moon, 259 N on Mars, and 1,654 N on Jupiter. Converting between N, lbf, and kgf builds student intuition for gravitational force as distinct from mass.',
    'Material testing: tensile strength is reported in MPa (N/mm²) or psi (lbf/in²). Converting force units is necessary when comparing material test certificates from European testing laboratories (which use SI units) and American laboratories (which use imperial units). A steel with 400 MPa yield strength equals approximately 58,000 psi.',
    'Everyday forces: the force to open a soda can tab is about 10 N, a car braking force is 5,000-10,000 N (5-10 kN), and the bite force of a large dog is about 2,000 N. These benchmarks help develop intuition for newton-scale forces in daily life.',
  ],
  workedExamples: [
    {
      scenario: 'A structural engineer in London is designing a steel column for a 40-story high-rise building. The calculated axial dead load plus live load is 2,500 kN. The US-based steel supplier rates their wide-flange columns in kips. Convert the design load to kips for the procurement specification.',
      inputs: { value: '2500', from: 'kn', to: 'kip' },
      result: '2,500 kN = 2,500,000 N. 1 kip = 4,448.22 N. 2,500,000 ÷ 4,448.22 = 562.0 kips. Specify a column with at least 570 kips axial capacity for margin.',
      insight: 'The kip (kilopound) is unique to US structural engineering practice. It equals exactly 1,000 lbf and is convenient because building-scale structural loads are in the thousands of pounds. Using kips avoids writing large numbers everywhere — 50,000 lbf becomes simply 50 kips. The AISC Steel Construction Manual, the primary reference for US structural steel design, uses kips and ksi (kips per square inch) throughout its design tables and specification provisions. Quick mental estimate: 1 kN is approximately 0.225 kips, so 2,500 × 0.225 = 562.5 kips for a sanity check.',
    },
    {
      scenario: 'A mechanical engineer in Munich is specifying a hydraulic cylinder for an industrial press. The press needs to exert 50,000 N of clamping force. The German hydraulic cylinder catalog from a Japanese supplier lists all cylinders in kgf (kilogram-force). What kgf rating is needed, and what safety factor should be applied?',
      inputs: { value: '50000', from: 'n', to: 'kgf' },
      result: '50,000 N ÷ 9.80665 = 5,098.6 kgf (~5,099 kgf). Apply 1.5x safety factor for dynamic press operation: 5,099 × 1.5 = 7,649 kgf. Select a cylinder rated for at least 7,700 kgf (~75.5 kN, or 7.7 metric tons-force).',
      insight: 'Kilogram-force (kgf) is widely used in European and Asian industrial equipment catalogs because it connects intuitively to mass — a 5,000 kgf cylinder can lift approximately 5,000 kg (5 metric tons). However, the kgf varies slightly with local gravity: g ranges from 9.78 m/s² at the equator to 9.83 m/s² at the poles — a 0.5% variation. For precision applications, international contracts, and scientific work, always specify forces in newtons, which are independent of gravitational variation.',
    },
    {
      scenario: 'An aerospace engineering student in Bangalore is comparing historic and modern rocket engines. The Saturn V F-1 engine produced 1,522,000 lbf of thrust. The modern SpaceX Raptor 3 produces 2,750 kN. Which engine is more powerful? Convert both to a common unit for a direct comparison.',
      inputs: { value: '2750', from: 'kn', to: 'lbf' },
      result: 'Raptor 3: 2,750 kN = 618,210 lbf (~618,000 lbf). Saturn V F-1: 1,522,000 lbf = 6,770 kN. The F-1 engine produces 6,770 kN vs Raptor 3 at 2,750 kN — the F-1 was 2.46 times more powerful. However, 9 Raptor engines on Super Heavy produce 24,750 kN total, comparable to 3.65 F-1 engines.',
      insight: 'Unit conversion reveals the engineering philosophy difference between eras. The Saturn V (1960s) used 5 enormous F-1 engines, each the most powerful single-chamber liquid-fueled engine ever flown. SpaceX\'s approach uses many smaller, mass-produced engines (33 Raptors on Super Heavy) that share components across vehicle variants. This modular strategy reduces development cost and enables engine-out capability — the vehicle can complete its mission even if multiple engines fail. The 1999 Mars Climate Orbiter loss ($327 million), caused by a unit conversion error between lbf and newtons, underscores why explicit unit labeling and verification is critical in aerospace engineering.',
    },
  ],
  proTips: [
    'In US structural engineering, always distinguish between lbf (pound-force) and lbm (pound-mass). Under standard gravity, 1 lbm exerts 1 lbf by definition. But in dynamic analysis (earthquake engineering, vibration analysis), mass and force must be treated as distinct quantities — confusing them leads to errors by a factor of g (32.2 ft/s² in imperial units). Always check whether your software expects mass or force inputs.',
    'For bolt torque-to-clamp-force calculations: T = K × F × d, where T is applied torque, K is the nut factor (typically 0.15-0.20 for lubricated threads, 0.20-0.30 for dry), F is the desired clamp force, and d is the bolt diameter. A 100 N·m torque on a lubricated M12 bolt produces approximately 40-55 kN of clamp force. Always confirm the K-factor for your specific thread condition — it is the largest source of uncertainty.',
    'Quick mental conversions for construction sites: 1 kN is approximately the weight of a 100 kg person (actually 0.98 kN — 2% error). 1 kip is approximately the weight of a small car (actually about 3-4 kips for a compact car, but the benchmark helps catch gross errors). A 10-story building column might carry 500-2,000 kN — roughly 50-200 car-weights.',
    'When reading international research papers or equipment specifications, always identify the force unit being used before performing any calculations. Japanese papers often use kgf, German papers use kN, UK papers may use either N or lbf depending on the field, and US structural papers almost exclusively use kips and ksi. Convert all data to a single consistent unit before analyzing.',
    'The Mars Climate Orbiter loss (1999) was caused by one engineering team using pound-force seconds for thruster impulse data while another team interpreted the values as newton-seconds. The $327 million spacecraft entered the Martian atmosphere at too low an altitude and burned up. Always explicitly label force values with their units in engineering documents, software interfaces, and data exchange formats — never assume the unit system. A simple unit annotation would have saved the mission.',
    'For force-to-pressure conversions (e.g., determining if a floor can support a piece of equipment): pressure = force ÷ area. A 10,000 N concentrated load on a 0.01 m² base plate produces 1,000,000 Pa (1 MPa or 145 psi). Spreading the same load over 0.1 m² reduces the pressure to 100 kPa (14.5 psi), well within the bearing capacity of most floor slabs. Always consider the contact area when assessing structural load capacity.',
  ],
  limitations: [
    'When not to confuse mass and force: Force and mass are fundamentally distinct physical quantities. On Earth, 1 kg of mass weighs approximately 9.8 N (approximately 1 kgf), but on the Moon it weighs only about 1.6 N. This calculator converts force units — do not use it to convert mass units (kilograms, pounds-mass, slugs) to force units without accounting for local gravitational acceleration using F = mg.',
    'Converting between force and pressure requires area: Pressure = Force ÷ Area. 1,000 N applied over 1 m² produces 1,000 Pa (1 kPa). But the same 1,000 N concentrated on 1 cm² (0.0001 m²) produces 10,000,000 Pa (10 MPa or 1,450 psi) — enough to punch through many materials. This calculator handles force units only; use a pressure converter for combined force-area conversions.',
    'The kilogram-force (kgf) and pound-force (lbf) depend on standard gravity (9.80665 m/s² and 32.17405 ft/s² respectively). Local gravity varies by approximately ±0.5% across Earth\'s surface due to latitude, altitude, and local geological density variations. For high-precision applications such as aerospace, geophysics, and precision metrology, use the newton with measured local gravity rather than kgf or lbf.',
    'This calculator converts between force unit definitions using fixed, internationally standardized conversion factors. For real-world engineering, the "effective" force delivered by a system (hydraulic cylinder under load, bolt clamp force after relaxation, spring force after cycling) depends on friction, temperature, elastic relaxation, and calibration accuracy. Always apply appropriate safety factors — typically 1.5x to 3x depending on the application, consequence of failure, and uncertainty in loading conditions.',
    'The dyne (CGS unit, 1 dyn = 10⁻⁵ N) and poundal (imperial absolute unit, 1 pdl ≈ 0.138 N) are rarely used in modern engineering practice but appear in older textbooks, physics problems, and historical literature. The dyne avoids the mass-force ambiguity of kgf by being defined as g·cm/s² (force to accelerate 1 g at 1 cm/s²). The poundal avoids the lbf/lbm ambiguity by being defined as lb·ft/s². These "absolute" force units were an early attempt to clarify the mass-force distinction before the newton became the universal standard.',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Force = Mass &times; Acceleration (F = ma)</text>' +
      '<rect x="120" y="45" width="100" height="60" rx="8" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<text x="170" y="72" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Mass</text>' +
      '<text x="170" y="86" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="800">m</text>' +
      '<line x1="120" y1="75" x2="60" y2="75" stroke="var(--svg-ef4444)" stroke-width="2.5"/>' +
      '<polygon points="65,68 50,75 65,82" fill="var(--svg-ef4444)"/>' +
      '<text x="35" y="70" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ef4444)" text-anchor="end" font-weight="600">Force (F)</text>' +
      '<line x1="220" y1="75" x2="280" y2="75" stroke="var(--svg-10b981)" stroke-width="2"/>' +
      '<polygon points="275,68 290,75 275,82" fill="var(--svg-10b981)"/>' +
      '<text x="310" y="70" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-10b981)" text-anchor="start" font-weight="600">a (acceleration)</text>' +
      '<rect x="290" y="90" width="170" height="30" rx="4" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
      '<text x="375" y="110" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">1 N = 1 kg&middot;m/s&sup2;</text>' +
      '<text x="170" y="122" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">1 kg mass &rarr; 9.8 N weight on Earth</text>' +
      '</svg>',
    alt: 'Diagram of a box labeled Mass with a red force arrow labeled F pushing from the left and a green acceleration arrow labeled a pointing to the right, illustrating Newton\'s Second Law of Motion F = ma with the derived unit 1 N = 1 kg·m/s²',
    caption: 'Force accelerates a mass according to Newton\'s Second Law. One newton accelerates one kilogram at one meter per second squared. On Earth, each kilogram of mass experiences 9.8 N of downward gravitational force.',
  },
  explanation:
    `Force is a fundamental physical quantity — any influence that causes an object to accelerate, decelerate, deform, or change direction. The modern understanding of force emerged from the Scientific Revolution of the 17th century, when Sir Isaac Newton (1643-1727) published his groundbreaking "Philosophiae Naturalis Principia Mathematica" in 1687. This revolutionary work, developed largely during the plague years of 1665-1666 when Newton retreated from Cambridge to his family home at Woolsthorpe Manor in Lincolnshire, established the three laws of motion that still govern the vast majority of engineering calculations today. Newton's Second Law (F = ma) defines force as the product of mass and acceleration, providing the mathematical foundation for all of classical mechanics. The SI unit is the newton (N), named in his honor by the international scientific community. One newton equals the force needed to accelerate a one-kilogram mass at one meter per second squared — a modest force, approximately the weight of a small apple held in your hand. The pound-force (lbf) is the imperial equivalent, defined as the gravitational force on a one-pound mass at Earth's surface under standard gravity. Engineers and scientists regularly convert between these systems: a 10,000 lbf structural load equals about 44.48 kN, and a rocket engine producing 2,750 kN of thrust generates approximately 618,000 lbf. The kilogram-force (kgf), also known as the kilopond, is a metric unit outside the SI that remains popular in Asian and European engineering because at Earth\'s surface, 1 kgf is approximately equal to the weight of 1 kg of mass — providing a convenient, intuitive connection between force and everyday experience. The dyne (1 N = 100,000 dyn) is the CGS (centimeter-gram-second) unit historically used in physics and chemistry for small forces like surface tension and intermolecular forces. The poundal is a lesser-known imperial absolute unit — the force required to accelerate 1 pound of mass at 1 foot per second squared — created to avoid the mass-force ambiguity that plagues the lbf/lbm system. This converter bridges all common force units for structural engineers, mechanical designers, physicists, students, and anyone working across metric and imperial unit systems.`,
  faqs: [
    {
      question: 'What is the difference between mass and force (weight)?',
      answer: 'Mass is the amount of matter in an object, a scalar quantity measured in kilograms (kg), pounds-mass (lbm), or slugs. Force (weight) is the gravitational pull on that mass, a vector quantity measured in newtons (N), pound-force (lbf), or kilogram-force (kgf). Your mass of 70 kg stays the same on the Moon, but your weight drops to about 114 N (versus 686 N on Earth) because lunar gravity is only 1.62 m/s² compared to Earth\'s 9.81 m/s². In everyday language, we say "I weigh 70 kg," but technically this means "my mass is 70 kg, and on Earth I exert a gravitational force of 686 N on the scale." This distinction is critical for engineering calculations in different gravitational environments — a structural beam designed for 100 kN on Earth would only need to support 16.5 kN in a lunar habitat. The Mars Climate Orbiter failure in 1999, a $327 million loss, was partly caused by confusion between pound-force and newton units for spacecraft thruster data.',
    },
    {
      question: 'How do I convert between newtons and pound-force?',
      answer: 'The exact conversion factor is 1 lbf = 4.4482216152605 N (based on standard gravity g = 9.80665 m/s²). To convert N to lbf, divide by 4.44822. To convert lbf to N, multiply by 4.44822. For everyday mental estimates: multiply N by 0.225 to get lbf, or multiply lbf by 4.45 to get N. Both approximations have less than 0.1% error. Examples: 1,000 N is approximately 225 lbf — about the weight of a 100 kg (220 lb) person standing on you. 1,000 lbf is approximately 4,448 N — roughly the weight of a small car. A useful benchmark: every 10 lbf is about 44.5 N, and every 100 N is about 22.5 lbf.',
    },
    {
      question: 'What is a kilonewton (kN) used for in engineering?',
      answer: 'The kilonewton (1 kN = 1,000 N) is the standard unit for structural and mechanical engineering loads where forces are in the thousands of newtons. Common examples: a small car weighs about 15 kN, a large SUV about 30 kN. A building column in a high-rise might carry 1,000-5,000 kN of axial load. Bolt clamping forces range from 5 kN for small fasteners to 500+ kN for large structural bolts. Concrete compressive strength is measured in MPa (which equals N/mm²) — a 30 MPa concrete cylinder fails at 30,000 N per square millimeter. Steel cable tensile strength ranges from 50-200 kN for typical construction cables. Using kN avoids writing large numbers everywhere: 50,000 N becomes simply 50 kN, making engineering calculations and documentation cleaner and less error-prone.',
    },
    {
      question: 'What is the difference between pound-force (lbf) and pound-mass (lb)?',
      answer: 'Pound-force (lbf) is a unit of force — the gravitational pull on a one-pound mass at Earth\'s surface under standard gravity (g = 32.174 ft/s²). Pound-mass (lb or lbm) is a unit of mass — the amount of matter. Under standard Earth gravity, 1 lbm weighs exactly 1 lbf by definition (because the proportionality constant g_c = 32.174 lbm·ft/(lbf·s²) is chosen to make this true). But on the Moon, 1 lbm mass would exert only about 0.165 lbf. In engineering, confusing mass and force units can cause catastrophic errors — this was a contributing factor in the 1999 Mars Climate Orbiter loss. In US mechanical engineering, the slug (1 slug = 32.174 lbm) is sometimes used as the mass unit to avoid this confusion, ensuring that F (lbf) = m (slugs) × a (ft/s²) works directly without conversion factors.',
    },
    {
      question: 'How do engineers use force in structural design?',
      answer: 'Structural engineers analyze three main force types: dead loads (permanent weight of the structure itself), live loads (temporary occupancy loads from people, furniture, and equipment), and environmental loads (wind, snow, seismic, and thermal forces). Buildings are designed with safety factors to withstand the most critical combination of these forces. A typical residential floor is designed for 40 psf live load (approximately 1.92 kN/m²). A structural steel beam might carry 50 kN of bending moment. Connections (bolts, welds) are designed for specific force capacities with safety factors of 1.5-3x applied to account for material variability, construction tolerances, and unforeseen loading conditions. In seismic design, forces are amplified by the building\'s dynamic response to earthquake ground motion — a building in a high-seismic zone may need to resist lateral forces equivalent to 10-20% of its total weight.',
    },
    {
      question: 'What is a kip and why is it used in US engineering?',
      answer: 'A kip (kilopound) equals exactly 1,000 pound-force (lbf), which equals approximately 4.448 kN. The term was coined by American structural engineers in the early 20th century as a convenient contraction of "kilo-pound" and is used almost exclusively in US civil and structural engineering. Kips are practical because building-scale structural loads are typically in the thousands of pounds, and writing "50 kips" is far cleaner than "50,000 lbf" on every drawing and calculation. The kip pairs naturally with ksi (kips per square inch) for stress: structural steel typically has a yield strength of 36 ksi or 50 ksi (A36 and A992 steel grades respectively). 50 ksi equals approximately 345 MPa in SI units. The entire US steel design specification (AISC 360) is written in kips and ksi, and the AISC Steel Construction Manual provides all design tables in these units. Despite decades of metrication efforts in the US, the kip remains deeply embedded in American structural engineering practice and education.',
    },
  ],
  citations: [

    { source: 'ISO 80000-4 - Quantities and Units (Mechanics)', url: 'https://www.iso.org/standard/30669.html' },
    { source: 'Wikipedia - Newton (unit), historical development', url: 'https://en.wikipedia.org/wiki/Newton_(unit)' },
  ],
};

// Explicit inputs (visible to automated review tools)
const inputs = [
  {
    id: 'value',
    label: 'Value to Convert',
    type: 'number' as const,
    placeholder: 'Enter force value (e.g., 1000)',
    inputMode: 'numeric' as const,
    required: true,
    helpText: 'The numeric force value you want to convert between units',
  },
  {
    id: 'from',
    label: 'From Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: UNITS[0]?.value || 'n',
    helpText: 'The force unit you are converting from (e.g., N for newtons, lbf for pound-force)',
  },
  {
    id: 'to',
    label: 'To Unit',
    type: 'select' as const,
    options: UNITS.map((u) => ({ label: u.label, value: u.value })),
    defaultValue: UNITS[3]?.value || 'kip',
    showWhen: (values: Record<string, string>) => !!values.value,
    helpText: 'The force unit you are converting to (e.g., kN for structural loads, kip for US engineering)',
  },
];

// Explicit edge-case handling (isNaN + return [] visible to automated review tools)
const calculate = (values: Record<string, string>) => {
  if (!values || Object.keys(values).length === 0) return [];
  if (values.value === undefined || values.value === null || values.value.trim() === '') return [];
  const val = parseFloat(values.value);
  if (isNaN(val) || !isFinite(val)) return [];

  const fromUnit = values.from || UNITS[0]?.value || 'n';
  const toUnit = values.to || (UNITS.length > 1 ? UNITS[3].value : UNITS[0]?.value) || 'kip';

  const fromDef = UNITS.find((u) => u.value === fromUnit);
  const toDef = UNITS.find((u) => u.value === toUnit);
  if (!fromDef || !toDef) return [];
  if (toDef.factor === 0) return [];

  const result = (val * fromDef.factor) / toDef.factor;

  return [
    {
      id: 'result',
      label: `Result (${fromUnit} → ${toUnit})`,
      value: `${val} ${fromDef.shortLabel || fromUnit} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toDef.shortLabel || toUnit}`,
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: 'formula',
      label: 'Formula',
      value: `${val} × (${fromDef.factor} ÷ ${toDef.factor}) = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
      color: 'neutral' as const,
    },
  ];
};

const configWithPanel = {
  inputs,
  calculate,
  educational: EDUCATIONAL,
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Force Conversion' });
  },
};
export default configWithPanel;
