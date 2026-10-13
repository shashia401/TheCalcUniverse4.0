import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import CBMPanel from './CBMPanel';
import { CONTAINER_CBM, computeCbm, formatCbm } from './cbm';

const cbmConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Length',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      placeholder: '100',
      inputMode: 'numeric' as const,
      helpText: 'Package length in the selected unit',
    },
    {
      id: 'width',
      label: 'Width',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      placeholder: '50',
      inputMode: 'numeric' as const,
      helpText: 'Package width in the selected unit',
    },
    {
      id: 'height',
      label: 'Height',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      placeholder: '40',
      inputMode: 'numeric' as const,
      helpText: 'Package height in the selected unit',
    },
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      options: [
        { label: 'Centimeters (cm)', value: 'cm' },
        { label: 'Meters (m)', value: 'm' },
        { label: 'Inches (in)', value: 'in' },
        { label: 'Feet (ft)', value: 'ft' },
      ],
      helpText: 'The measurement unit for all three dimensions',
    },
    {
      id: 'packages',
      label: 'Number of Packages',
      type: 'number',
      min: 1,
      step: 1,
      placeholder: '1',
      inputMode: 'numeric' as const,
      helpText: 'How many identical packages are in this shipment',
    },
    {
      id: 'actualWeight',
      label: 'Actual Weight (kg)',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      placeholder: '50',
      inputMode: 'numeric' as const,
      helpText: 'The total physical weight of the shipment in kilograms (use a scale)',
    },
    {
      id: 'shippingMode',
      label: 'Shipping Mode',
      type: 'select',
      options: [
        { label: 'Air Freight (dim divisor 6000)', value: 'air' },
        { label: 'Sea Freight (dim divisor 1000)', value: 'sea' },
        { label: 'Courier / Express (dim divisor 5000)', value: 'courier' },
      ],
      helpText: 'Shipping mode determines the dimensional weight divisor used for billing',
    },
  ],
  calculate: (values) => {
    const c = computeCbm(values);
    if (!c) return [];

    const results: CalculatorResult[] = [
      {
        id: 'cbm',
        label: `${c.packages > 1 ? 'Total ' : ''}CBM (Cubic Meters)`,
        value: formatCbm(c.cbm),
        highlight: true,
        color: 'positive',
      },
      { id: 'dimWeight', label: `Dimensional Weight (${c.dimLabel})`, value: `${c.dimWeight.toFixed(2)} kg`, color: 'neutral' },
      { id: 'actualWeightDisplay', label: 'Actual Weight', value: `${c.actualWeight.toFixed(2)} kg`, color: 'neutral' },
      {
        id: 'chargeableWeight',
        label: 'Chargeable Weight',
        value: `${c.chargeableWeight.toFixed(2)} kg`,
        highlight: true,
        color: c.chargeableWeight > c.actualWeight ? 'neutral' : 'positive',
      },
      {
        id: 'weightBasis',
        label: 'Billing Basis',
        value:
          c.chargeableWeight > c.actualWeight
            ? 'Dimensional weight (volumetric) — cargo is light for its size'
            : 'Actual weight — cargo is heavy for its size',
        color: 'neutral',
      },
    ];

    if (c.packages > 1) {
      results.push({ id: 'perUnitCbm', label: 'CBM per Package', value: formatCbm(c.perPackageCbm), color: 'neutral' });
    }

    results.push({
      id: 'containerEstimate',
      label: 'Container Estimate (volume only)',
      value: `${c.containers20}x 20ft container${c.containers20 > 1 ? 's' : ''} (~${CONTAINER_CBM.ft20} CBM each) or ${c.containers40}x 40ft container${c.containers40 > 1 ? 's' : ''} (~${CONTAINER_CBM.ft40} CBM each). Typical capacities; ignores payload limits and packing gaps.`,
      color: 'neutral',
    });

    results.push({
      id: 'volumeBreakdown',
      label: 'Single Package Volume',
      value: `${c.length} × ${c.width} × ${c.height} ${c.unit} = ${formatCbm(c.perPackageCbm)} CBM`,
      color: 'neutral',
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    const c = computeCbm(values);
    if (!c) return null;
    return createElement(CBMPanel, { cbmText: results.find((r) => r.id === 'cbm')?.value ?? formatCbm(c.cbm), actual: c.actualWeight, dim: c.dimWeight, chargeable: c.chargeableWeight, containerText: results.find((r) => r.id === 'containerEstimate')?.value ?? '' });
  },
  educational: {
    formula: 'CBM = Length (m) × Width (m) × Height (m) × Packages. Dimensional Weight (kg) = L(cm) × W(cm) × H(cm) × Packages ÷ Divisor. Chargeable Weight = max(Actual Weight, Dimensional Weight).',
    formulaDescription:
      'CBM (Cubic Meter) is the standard unit for freight volume in international shipping. Dimensional (volumetric) weight converts package volume into an equivalent billing weight using a carrier-specific divisor. The chargeable weight is always the greater of actual weight and dimensional weight — carriers bill for whichever is larger to account for the space-vs-weight economics of cargo.',
    formulaSource: 'The CBM calculation is based on geometric volume L × W × H, standardized in metric (SI) units. Dimensional (volumetric) weight exists so that light-but-bulky cargo pays for the space it takes. The air cargo standard is a volumetric factor of 6000 cm³ per kg (167 kg per m³); many express couriers use 5000 cm³ per kg (200 kg per m³), but each carrier publishes its own divisor. Sea freight typically uses 1 CBM = 1 metric tonne (1000 kg) as its volume-to-weight ratio, though this varies by carrier, route, and commodity type. Container dimensions follow ISO 668; internal volumes quoted here are typical values that vary by builder.',
    variables: [
      { symbol: 'CBM', name: 'Cubic Meter', description: 'The standard unit of volume for freight shipping. 1 CBM = 1 m × 1 m × 1 m = 1,000,000 cm³ = 35.31 ft³. One CBM is roughly the volume of a standard pallet (EUR pallet: 1.2 m × 0.8 m × 1.0 m = 0.96 CBM). The internal volume of shipping containers is measured in CBM.' },
      { symbol: 'Dimensional Weight', name: 'Dimensional / Volumetric Weight', description: 'A calculated weight derived from package volume rather than actual mass. Formula: (L × W × H in cm) ÷ divisor. Different shipping modes use different divisors: air freight = 6000, courier = 5000, sea freight = 1000. Dimensional weight was created to prevent carriers from losing money on large-but-light shipments like pillows, styrofoam, and empty boxes.' },
      { symbol: 'Chargeable Weight', name: 'Chargeable / Billable Weight', description: 'The greater of actual weight and dimensional weight. This is what the carrier charges for. If actual weight > dimensional weight, the cargo is "dense" and paid by mass. If dimensional weight > actual weight, the cargo is "volumetric" and paid by size. The chargeable weight principle ensures carriers are compensated fairly for both heavy-compact and light-bulky shipments.' },
      { symbol: 'Container Types', name: '20ft and 40ft Shipping Containers', description: 'Standard ISO shipping containers. 20ft container (TEU = Twenty-foot Equivalent Unit): internal ~5.9 m × 2.35 m × 2.39 m ≈ 33.1 CBM, max payload ~28,200 kg. 40ft container (FEU = Forty-foot Equivalent Unit): internal ~12.03 m × 2.35 m × 2.39 m ≈ 67.5 CBM, max payload ~29,600 kg. 40ft High Cube: ~76.3 CBM with 2.69 m internal height. These are the universal units of global trade — over 800 million TEU are shipped annually.' },
    ],
    howToUse: [
      'Measure your package dimensions: Length, Width, and Height. Use the longest point for each dimension, including any protruding parts (handles, wheels, corners).',
      'Select the measurement unit from the dropdown (cm, m, in, or ft). All three dimensions must use the same unit.',
      'Enter the number of identical packages in the shipment. For mixed-size shipments, calculate each package size separately and sum the CBMs.',
      'Enter the actual weight of the total shipment in kilograms. Use a calibrated scale — estimating weight leads to billing surprises.',
      'Select the shipping mode: Air Freight (divisor 6000), Sea Freight (divisor 1000), or Courier/Express (divisor 5000). The mode determines how dimensional weight is calculated.',
      'Review the results: CBM (total volume), dimensional weight, actual weight, and chargeable weight. The billing basis tells you whether you are paying by volume or by weight. Container estimates help plan logistics for large shipments.',
    ],
    quickReference: [
      { label: 'EUR pallet (1.2×0.8×1.2m)', value: '1.15 CBM / dim wt air: 192 kg / sea: 1,152 kg' },
      { label: 'US pallet (48×40×48 in)', value: '1.51 CBM / dim wt air: 252 kg / sea: 1,510 kg' },
      { label: 'Standard box (50×40×30 cm)', value: '0.06 CBM / dim wt air: 10 kg / courier: 12 kg' },
      { label: 'Large box (60×50×50 cm)', value: '0.15 CBM / dim wt air: 25 kg / courier: 30 kg' },
      { label: '20ft container', value: '~33 CBM internal / max payload ~28,200 kg' },
      { label: '40ft container', value: '~67 CBM internal / max payload ~29,600 kg' },
      { label: '40ft High Cube', value: '~76 CBM internal / max payload ~29,300 kg' },
      { label: '1 CBM (air freight)', value: '167 kg dimensional weight (100³ ÷ 6000)' },
      { label: '1 CBM (courier)', value: '200 kg dimensional weight (100³ ÷ 5000)' },
      { label: '1 CBM (sea freight)', value: '1,000 kg dimensional weight (100³ ÷ 1000)' },
    ],
    commonUses: [
      'Calculating total shipment volume in cubic meters for international freight shipping quotes by air, sea, or courier',
      'Determining dimensional weight and chargeable weight to accurately estimate shipping costs and avoid unexpected carrier surcharges',
      'Estimating how many standard 20-foot or 40-foot shipping containers are needed for a large export or import shipment',
      'Comparing shipping costs across air, sea, and courier modes by evaluating volumetric versus actual weight pricing on the same shipment',
      'Planning warehouse space: knowing the CBM of incoming inventory helps allocate rack and floor space before the shipment arrives',
      'FCL vs LCL decisions: Full Container Load vs Less than Container Load — if your CBM is close to container capacity, FCL may be cheaper per unit even if the container is not completely full',
    ],
    workedExamples: [
      {
        scenario: 'A furniture exporter in Vietnam is shipping 200 identical wooden chairs to Germany. Each chair is packed in a box measuring 55 cm × 50 cm × 90 cm and weighs 8 kg. Calculate the total CBM, dimensional weight, and chargeable weight for air freight. Determine if the shipment fits in one 40ft container.',
        inputs: { length: '55', width: '50', height: '90', unit: 'cm', packages: '200', actualWeight: '1600', shippingMode: 'air' },
        result: 'Single box: 0.55 × 0.50 × 0.90 = 0.2475 m³ per chair. Total CBM = 0.2475 × 200 = 49.5 CBM. Dim weight (air): 247,500 cm³ ÷ 6,000 = 41.25 kg/chair, total = 8,250 kg. Actual weight = 1,600 kg. Chargeable = 8,250 kg (volumetric). Fits in one 40ft container (67 CBM capacity) with 17.5 CBM to spare.',
        insight: 'This is a classic volumetric shipment: the dimensional weight (8,250 kg) is 5.2× the actual weight (1,600 kg). The exporter will be billed for 8,250 kg despite the chairs only weighing 1,600 kg. To reduce costs, the exporter could: (1) redesign the packaging to be more compact, (2) ship the chairs unassembled (IKEA-style) to reduce volume, or (3) compare sea freight — sea dimensional weight would be 49.5 CBM × 1,000 = 49,500 kg, but sea rates per kg are far lower than air, so sea is likely much cheaper for this shipment.',
      },
      {
        scenario: 'An e-commerce seller in California is shipping 150 units of a dense product to a fulfillment center. Each unit is in a box measuring 12" × 8" × 4" and weighs 3.2 lbs. They are using a courier service (divisor 5000). Calculate the total dimensional weight in kg and determine the chargeable weight.',
        inputs: { length: '12', width: '8', height: '4', unit: 'in', packages: '150', actualWeight: '217.7', shippingMode: 'courier' },
        result: 'Convert to cm: 30.48 × 20.32 × 10.16 = 6,292.6 cm³/box. Total: 6,292.6 × 150 = 943,895 cm³. Dim weight (courier): 943,895 ÷ 5,000 = 188.78 kg. Actual: 3.2 lb × 150 = 480 lb = 217.7 kg. Chargeable = max(217.7, 188.78) = 217.7 kg — billed by actual weight! Total CBM = 0.944 CBM.',
        insight: 'Unlike the chair example, this is a dense shipment — the actual weight (217.7 kg) exceeds the dimensional weight (188.8 kg), so the courier bills by actual weight. Dense products (books, metal parts, tools, bottled liquids) are typically billed by actual weight. Bulky products (pillows, lampshades, foam, empty containers) are billed by dimensional weight. The sweet spot is when actual and dimensional weight are roughly equal — you are maximizing the value per kg of your shipping spend.',
      },
      {
        scenario: 'An automotive parts supplier in Detroit is exporting engine blocks to Mexico by sea freight. The shipment is 45 engine blocks on pallets. Each pallet measures 120 cm × 100 cm × 80 cm and weighs 180 kg (engine block plus pallet). Calculate total CBM, dimensional weight (sea), chargeable weight, and container needs.',
        inputs: { length: '120', width: '100', height: '80', unit: 'cm', packages: '45', actualWeight: '8100', shippingMode: 'sea' },
        result: 'Single pallet: 1.20 × 1.00 × 0.80 = 0.96 CBM. Total CBM = 0.96 × 45 = 43.2 CBM. Dim weight (sea): 43.2 CBM = 43,200 kg. Actual: 180 × 45 = 8,100 kg. Chargeable = 43,200 kg (volumetric). Container: 43.2/33 = 2× 20ft, or 43.2/67 = 1× 40ft with 23.8 CBM spare. One 40ft is sufficient.',
        insight: 'Sea freight dimensional weight seems enormous (43,200 kg for 8,100 kg actual), but sea freight rates are quoted per CBM, not per kg — so the dimensional weight calculation from the CBM-to-1000kg ratio is less important than the pure CBM. Engine blocks are dense, but on pallets they become volumetric because of the empty space. Nesting the engine blocks without pallets or using custom steel stillages that stack efficiently could dramatically reduce the CBM. At ~$50-100/CBM for ocean freight, the 43.2 CBM costs $2,160-$4,320, which is reasonable for 45 engine blocks.',
      },
    ],
    proTips: [
      'Always measure the OUTER dimensions of the package, including any bulges, handles, wheels, or protruding parts. Carriers measure the largest point in each dimension and round up. A box that is 50.2 cm long is measured as 51 cm. Never round down — the carrier will correct your measurement and back-charge the difference.',
      'When consolidating multiple packages, consider the "dead space" between irregular shapes. Rectangular boxes nest cleanly; irregular items (bicycles, machinery, furniture legs) leave voids. A shipment of 100 CBM of loose irregular cargo may need 120-130 CBM of container space. Add at least 15% to your CBM estimate for irregular cargo packing efficiency losses.',
      'For FCL (Full Container Load), the 33 CBM (20ft) and 67 CBM (40ft) estimates are for ideal rectangular cargo. In practice, aim for 85-90% utilization: 28-30 CBM for 20ft, 57-60 CBM for 40ft. Palletized cargo has lower utilization because pallets leave gaps. Floor-loaded cargo (boxes stacked directly on the container floor) achieves higher utilization but is slower to load and unload.',
      'Compare shipping modes using the chargeable weight: divide the freight rate per kg by the chargeable weight to get the true cost. Air freight might quote $3.00/kg while sea freight quotes $0.05/kg, but if your chargeable weight for air is 100 kg vs 500 kg for sea (due to different divisors), the effective rates shift. Run both calculations — the cheaper mode is not always obvious.',
      'Dimensional weight divisors are not universal — always check your carrier\'s specific divisor. While the usual air cargo standard is 6000, many express couriers use 5000 and some carriers use other values. Sea freight LCL rates are per CBM or per 1,000 kg, whichever yields higher revenue. Always get carrier-specific dim factors in writing before quoting a customer.',
      'For Amazon FBA sellers: Amazon\'s fee tiers depend on unit dimensions and on the greater of unit weight and dimensional weight, using a divisor of 139 in³ per lb (about 5,000 cm³/kg, not the 6000 of air freight). Tier limits change, so check the current Seller Central fee schedule; use this calculator with the courier mode (5000) for a quick volume check.',
    ],
    limitations: [
      'This calculator provides CBM based on rectangular (box) dimensions only. For cylindrical, irregular, or oddly-shaped cargo, CBM should be calculated using the smallest rectangular box that can contain the item (the "dimensional envelope" method). Palletized cargo CBM includes the pallet itself: a EUR pallet is 144 mm high, so the empty pallet alone occupies about 0.14 CBM (1.2 × 0.8 × 0.144 m).',
      'Container capacity estimates (33 CBM for 20ft, 67 CBM for 40ft) are typical internal volumes for perfect rectangular cargo with zero wasted space; they ignore the payload limit. Actual usable capacity is typically 10-15% less due to: pallet gaps, container wall corrugations (reduces internal width by ~5 cm), door clearance requirements, and the impossibility of tessellating irregular package sizes perfectly. Always add a 15% buffer.',
      'Dimensional weight divisors (6000/5000/1000) are industry standards but individual carriers may use different divisors. Always verify the specific divisor with your carrier or freight forwarder. Some carriers also apply minimum chargeable weight rules (e.g., minimum 1 kg per shipment, or minimum 50 kg for air freight consolidation). This calculator does not include these minimums.',
      'Weight capacity is not the same as volume capacity. A 20ft container can technically hold 33 CBM but only 28,200 kg — if you load 33 CBM of steel (density ~7,850 kg/m³), that is ~259,000 kg, which would crush the container. Cargo with density > 850 kg/m³ (850 kg per CBM) is weight-limited before it is volume-limited. Cargo with density < 850 kg/m³ is volume-limited. This calculator shows volume limits but you must separately verify weight limits.',
      'This calculator does not handle mixed-size shipments where packages have different dimensions. For shipments with multiple package sizes, calculate each size group separately, sum the CBMs and sum the dimensional weights. The total chargeable weight is max(total actual weight, total dimensional weight). For container load planning, use a 3D bin-packing algorithm or consult with your freight forwarder for complex mixed-cargo consolidation.',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">CBM &amp; Chargeable Weight Flow</text>' +
        '<rect x="30" y="35" width="70" height="50" rx="4" fill="var(--svg-3b82f6)" opacity="0.2" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
        '<text x="65" y="60" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Dimensions</text>' +
        '<text x="65" y="72" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">L x W x H</text>' +
        '<text x="110" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-64748b)">→</text>' +
        '<rect x="140" y="35" width="70" height="50" rx="4" fill="var(--svg-22c55e)" opacity="0.2" stroke="var(--svg-22c55e)" stroke-width="2"/>' +
        '<text x="175" y="60" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">CBM</text>' +
        '<text x="175" y="72" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Volume</text>' +
        '<text x="220" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-64748b)">→</text>' +
        '<rect x="250" y="35" width="90" height="50" rx="4" fill="var(--svg-f59e0b)" opacity="0.2" stroke="var(--svg-f59e0b)" stroke-width="2"/>' +
        '<text x="295" y="60" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Dim Weight</text>' +
        '<text x="295" y="72" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Volumetric kg</text>' +
        '<text x="350" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-64748b)">→</text>' +
        '<rect x="370" y="35" width="95" height="50" rx="4" fill="var(--svg-ef4444)" opacity="0.2" stroke="var(--svg-ef4444)" stroke-width="2"/>' +
        '<text x="417" y="60" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Chargeable</text>' +
        '<text x="417" y="72" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">max(actual, dim)</text>' +
        '</svg>',
      alt: 'Flow diagram showing the CBM calculation pipeline from package dimensions to CBM to dimensional weight to chargeable weight',
      caption: 'Chargeable weight is the greater of actual weight and dimensional weight. You pay for whichever is larger — volume or mass.',
    },
    explanation:
      'CBM (Cubic Meter) is the universal unit of freight volume measurement in international shipping. Every shipment that crosses an ocean or border is measured in CBM, whether it travels in a shipping container, an aircraft cargo hold, or a courier van. The concept is elegantly simple: measure the three dimensions of a package in meters, multiply them together, and you have the volume in cubic meters. But the economics of freight introduce a crucial complication: not all cargo is dense. A cubic meter of steel weighs 7,850 kg, while a cubic meter of polystyrene foam weighs only about 20–50 kg — yet both occupy the same space on a ship, plane, or truck. Carriers solve this with "dimensional weight" (also called volumetric weight), a formula that converts package volume into a theoretical weight. The dimensional weight divisor varies by transport mode: air freight uses 6000 (cm³/kg), meaning 6,000 cm³ of space is billed as 1 kg. Courier services (FedEx, UPS, DHL) typically use 5000, making them more expensive for bulky items. Sea freight uses 1000 (or simply charges per CBM directly, with 1 CBM billed at the equivalent of 1,000 kg minimum). The "chargeable weight" is always the greater of the actual weight and the dimensional weight — ensuring carriers are compensated for both heavy items (billed by scale weight) and bulky items (billed by volume). The idea is old: an aircraft filled with feather pillows (very little weight, all the available space) earns far less than one filled with dense electronics, so carriers bill for the larger of weight and volume. Today, dimensional weight is a critical cost factor in e-commerce, manufacturing, and global trade. A shipment of 1,000 pillows might weigh only 200 kg but have a dimensional weight of 500 kg — and that is what you will actually pay for. Understanding CBM and chargeable weight is essential for anyone involved in importing, exporting, drop-shipping, or logistics.',
    faqs: [
      {
        question: 'What is the difference between actual weight, dimensional weight, and chargeable weight?',
        answer: 'Actual weight is what the shipment weighs on a calibrated scale — the physical mass in kilograms. Dimensional weight (volumetric weight) is a calculated value based on package size: (Length × Width × Height in centimeters) ÷ divisor. The divisor varies by shipping mode: 6000 for air freight, 5000 for courier, 1000 for sea freight. Chargeable weight is the greater of the two — it is what the carrier actually bills you for. If your actual weight exceeds dimensional weight, you are billed by mass (your cargo is "dense"). If dimensional weight exceeds actual weight, you are billed by volume (your cargo is "volumetric"). This system prevents carriers from losing money on light-but-bulky cargo like pillows, which take up valuable space but weigh very little.',
      },
      {
        question: 'Why do different shipping modes use different dimensional weight divisors?',
        answer: 'The divisor reflects the space-to-weight economics of each transport mode. Air freight uses 6000 because aircraft cargo holds are extremely space-constrained and expensive to operate — fuel burn per cubic meter is high, so bulky cargo must pay a premium. At 6000, 1 CBM = 167 kg dimensional weight, meaning air freight charges for 167 kg even if the actual weight is lower. Courier/express uses 5000 because their network relies on standardized sorting equipment and aircraft bellies — at 5000, 1 CBM = 200 kg, making courier slightly more expensive for bulky items than general air freight. Sea freight uses 1000 because ships have enormous cargo holds, fuel is relatively cheap per container, and space is less constrained — at 1000, 1 CBM = 1000 kg, but sea freight is usually quoted per CBM directly rather than per kg, so the 1000 divisor is mostly used for LCL (Less than Container Load) consolidation pricing.',
      },
      {
        question: 'How much can fit in a 20-foot vs 40-foot shipping container?',
        answer: 'A standard 20-foot container (TEU): internal dimensions ~5.90 m × 2.35 m × 2.39 m = ~33.1 CBM, maximum gross payload ~28,200 kg. A standard 40-foot container (FEU): internal ~12.03 m × 2.35 m × 2.39 m = ~67.5 CBM, maximum payload ~29,600 kg. A 40-foot High Cube (HC): internal ~12.03 m × 2.35 m × 2.69 m = ~76.3 CBM, max payload ~29,300 kg. Note that the 40ft container has about double the CBM of the 20ft (67 vs 33) but a similar payload limit (~28,000-29,000 kg), so dense cargo (above about 430 kg per CBM in a 40ft) hits the weight limit before the volume limit. Whether you run out of space or payload first depends on density: a 20ft container is weight-limited only above roughly 850 kg per CBM (28,200 kg ÷ 33 CBM). Typical consumer goods (150-300 kg/CBM) fill the volume first: a full 20ft of such goods weighs only about 5,000-10,000 kg, far below the payload limit.',
      },
      {
        question: 'How do I reduce shipping costs for bulky, lightweight items?',
        answer: 'If dimensional weight exceeds actual weight, focus on reducing package volume. Strategies: (1) Use the smallest possible box — making a 50 × 40 × 30 cm box 2 cm smaller on each dimension (48 × 38 × 28 cm) cuts its dimensional weight by about 15%. (2) Remove unnecessary void fill and use vacuum compression for soft goods (clothing, bedding). (3) Disassemble items to fit in smaller boxes — a chair shipped unassembled can be 40-60% smaller. (4) Use custom-sized boxes rather than standard sizes that leave empty headspace. (5) Ship dense and lightweight items together to balance the chargeable weight ratio. (6) For regular shipments, negotiate a custom dimensional factor with your carrier — high-volume shippers can often get the divisor increased (e.g., from 5000 to 6000 or 7000), directly reducing dimensional weight costs. (7) Consider sea freight for bulky items where speed is not critical — sea rates per CBM are usually far cheaper than air.',
      },
      {
        question: 'What is the typical CBM for standard pallet sizes?',
        answer: 'EUR pallet (800 mm × 1,200 mm × up to 1,200 mm including cargo): 1.15 CBM typical (1.2 × 0.8 × 1.2 m). EUR pallet with cargo at 1,600 mm height: ~1.54 CBM. US pallet (48" × 40" × 48" incl cargo = 1.22 × 1.02 × 1.22 m): ~1.51 CBM typical. UK pallet (1,000 × 1,200 × up to 1,200 mm): ~1.44 CBM. Asian pallet (1,100 × 1,100 mm): slightly larger base but same stacking height. A 20ft container fits about 10-11 EUR pallets single-stacked or about 20-22 double-stacked. A 40ft container fits about 23-25 EUR pallets single-stacked or about 46-50 double-stacked. Important: the empty EUR pallet itself occupies about 0.14 CBM (it is 144 mm high). Two-way vs four-way entry pallets have the same footprint but different handling characteristics. CHEP and PECO are the two dominant pallet pooling companies.',
      },
      {
        question: 'How does dimensional weight work for Amazon FBA sellers?',
        answer: 'Amazon\'s FBA fee tiers use the greater of unit weight and dimensional weight, where dimensional weight = (L × W × H in inches) ÷ 139 (in pounds). 139 in³ per lb is about 5,000 cm³ per kg, so the courier mode (5000) of this calculator is the closest match. The exact tier limits change, so check the current Seller Central fee schedule. Monthly storage fees are charged per cubic foot, so volume affects both shipping and storage costs. Pro tip: if your product has unnecessary packaging (like a large display box around a small item), removing it and using frustration-free packaging can save significantly on both FBA inbound shipping and monthly storage fees. Amazon\'s FBA Revenue Calculator includes dimensional weight estimation — use it before creating a shipment plan.',
      },
    ],
    citations: [
      { source: 'IATA - Cargo', url: 'https://www.iata.org/en/programs/cargo/' },
      { source: 'ISO 668 - Series 1 Freight Containers Classification and Dimensions', url: 'https://www.iso.org/standard/77314.html' },
    ],
  },
};

export default cbmConfig;
