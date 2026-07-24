import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RoofingPanel from './RoofingPanel';

const PITCH_MULTIPLIERS: Record<string, number> = {
  '0': 1.000,
  '2': 1.014,
  '4': 1.054,
  '6': 1.118,
  '8': 1.202,
  '10': 1.302,
  '12': 1.414,
};

const roofingConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Building Length (ft)',
      type: 'number',
      placeholder: '40',
      min: 1,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the length of the building footprint in feet (the longer side of the rectangle).',
    },
    {
      id: 'width',
      label: 'Building Width (ft)',
      type: 'number',
      placeholder: '30',
      min: 1,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the width of the building footprint in feet (the shorter side of the rectangle).',
    },
    {
      id: 'pitch',
      label: 'Roof Pitch',
      type: 'select',
      options: [
        { label: 'Flat (0/12)', value: '0' },
        { label: 'Low (2/12)', value: '2' },
        { label: 'Moderate (4/12)', value: '4' },
        { label: 'Standard (6/12)', value: '6' },
        { label: 'Steep (8/12)', value: '8' },
        { label: 'Very Steep (10/12)', value: '10' },
        { label: 'Max (12/12)', value: '12' },
      ],
      required: true,
      helpText: 'Roof pitch expressed as inches of rise per 12 inches of horizontal run. 6/12 is standard for most residential roofs (26.6-degree angle).',
    },
    {
      id: 'overhang',
      label: 'Eave Overhang (ft)',
      type: 'number',
      placeholder: '1',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      helpText: 'Distance the roof extends beyond the exterior walls. Typically 1-2 ft for standard residential construction.',
    },
    {
      id: 'roofType',
      label: 'Roof Type',
      type: 'select',
      options: [
        { label: 'Gable (simple — two sloping sides)', value: 'gable' },
        { label: 'Hip (four sloping sides — +5% material)', value: 'hip' },
      ],
      required: true,
      helpText: 'Gable roofs have two sloping sides and are more economical. Hip roofs have four sloping sides and need about 5% extra material due to complex diagonal cuts.',
    },
    {
      id: 'wasteFactor',
      label: 'Waste Factor',
      type: 'select',
      options: [
        { label: '5% (simple roof — few penetrations)', value: '5' },
        { label: '10% (standard — typical residential roof)', value: '10' },
        { label: '15% (complex — multiple valleys, dormers)', value: '15' },
      ],
      helpText: 'Waste accounts for cut-offs, starter strips, and errors. Use higher percentages for roofs with multiple valleys, dormers, chimneys, or skylights.',
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const pitch = values.pitch || '6';
    const overhangRaw = parseFloat(values.overhang);
    const overhang = !isNaN(overhangRaw) ? overhangRaw : 1;
    const roofType = values.roofType || 'gable';
    const wastePct = parseFloat(values.wasteFactor || '10') / 100;

    if ([length, width].some(isNaN) || length <= 0 || width <= 0) return [];

    const pitchMulti = PITCH_MULTIPLIERS[pitch] ?? 1.118;

    const effL = length + 2 * overhang;
    const effW = width + 2 * overhang;
    const footprintArea = effL * effW;

    const hipFactor = roofType === 'hip' ? 0.05 : 0;
    const roofArea = footprintArea * pitchMulti * (1.0 + wastePct + hipFactor);
    const squares = Math.ceil(roofArea / 100);
    const bundles = squares * 3;

    const ridgeLength = roofType === 'gable' ? effL : (effL > effW ? effL : effW);
    const feltRolls = Math.ceil(roofArea / 400);
    const nailsLbs = squares * 2;
    const iceWaterShield = Math.ceil(effL * 3 * 2 / 100);
    const ridgeCapBundles = Math.ceil(ridgeLength / 33);

    const fmt = (n: number) => parseFloat(n.toFixed(1)).toString();

    const results = [
      {
        id: 'roofArea',
        label: 'Total Roof Area',
        value: `${fmt(roofArea)} sq ft`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'squares',
        label: 'Roofing Squares Needed',
        value: `${squares} squares`,
        color: 'neutral' as const,
      },
      {
        id: 'bundles',
        label: 'Shingle Bundles Needed',
        value: `${bundles} bundles (3 bundles per square)`,
        color: 'neutral' as const,
      },
      {
        id: 'footprintArea',
        label: 'Building Footprint Area',
        value: `${fmt(footprintArea)} sq ft`,
        color: 'neutral' as const,
      },
      {
        id: 'pitchMultiplier',
        label: 'Pitch Multiplier',
        value: `${pitchMulti} (${pitch}/12 pitch)`,
        color: 'neutral' as const,
      },
      {
        id: 'ridgeLength',
        label: 'Ridge Length',
        value: `${fmt(ridgeLength)} ft`,
        color: 'neutral' as const,
      },
      {
        id: 'feltRolls',
        label: 'Felt Underlayment Rolls',
        value: `${feltRolls} rolls (400 sq ft each)`,
        color: 'neutral' as const,
      },
      {
        id: 'nailsLbs',
        label: 'Roofing Nails',
        value: `${nailsLbs} lbs (approx. ${nailsLbs * 140} nails)`,
        color: 'neutral' as const,
      },
      {
        id: 'ridgeCap',
        label: 'Ridge Cap Shingles',
        value: `${ridgeCapBundles} bundles`,
        color: 'neutral' as const,
      },
      {
        id: 'iceWaterShield',
        label: 'Ice & Water Shield',
        value: `${iceWaterShield} rolls (eave protection)`,
        color: 'neutral' as const,
      },
      {
        id: '_materialsList',
        label: 'Complete Materials List',
        value: JSON.stringify({
          squares,
          bundles,
          feltRolls,
          nailsLbs,
          ridgeLength: fmt(ridgeLength),
          ridgeCapBundles,
          iceWaterShield,
          roofType,
          pitch: `${pitch}/12`,
        }),
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RoofingPanel, { values, results });
  },
  educational: {
    formula: 'Roof Area = Footprint Area x Pitch Multiplier x (1 + Waste%) x (1 + Hip Factor)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Roof Pitch Cross-Section</text><!-- House walls --><rect x="70" y="100" width="180" height="70" fill="rgba(59,130,246,0.1)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="160" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">House</text><!-- Roof --><polygon points="50,100 160,30 270,100" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linejoin="round"/><!-- Rafter line --><line x1="160" y1="100" x2="160" y2="160" stroke="var(--svg-3b82f6)" stroke-width="1" stroke-dasharray="4,3"/><!-- Rise and Run labels --><line x1="160" y1="30" x2="160" y2="100" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="165" y="68" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Rise</text><line x1="160" y1="100" x2="270" y2="100" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="215" y="96" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Run</text><text x="160" y="190" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Pitch = Rise / Run (e.g., 6/12) = 26.6 deg</text></svg>',
      alt: 'House roof cross-section showing pitch as rise over run with labeled dimensions',
      caption: 'Roof pitch = rise / run, measured in inches per 12 inches of horizontal run',
    },
    formulaDescription:
      'Roofing material quantities are calculated by adjusting the building footprint for three key factors. First, the pitch multiplier converts flat footprint area to actual sloped roof surface area — steeper pitches have larger multipliers (6/12 = 1.118, 12/12 = 1.414). Second, the eave overhang extends the effective dimensions on all four sides before the area calculation. Third, the waste factor accounts for cut-offs, starter strips, and job-site errors (5-15% depending on roof complexity). For hip roofs, an additional 5% material factor covers the complex diagonal cuts where four roof planes meet. The industry standard "square" equals 100 square feet, and standard shingles are packaged 3 bundles per square.',
    variables: [
      { symbol: 'Pitch Multiplier', name: 'Pitch Multiplier', description: 'Factor that converts flat footprint area to actual sloped roof surface area. A 6/12 pitch has a multiplier of 1.118 (roof is 11.8% larger than footprint). Steeper pitches require significantly more material.' },
      { symbol: 'Square', name: 'Roofing Square', description: 'The industry standard unit: 1 square = 100 square feet of roof surface. All materials (shingles, underlayment, nails) are quoted per square. Three bundles of shingles cover one square.' },
      { symbol: 'Hip Factor', name: 'Hip Roof Penalty', description: 'A 5% additional material allowance for hip roofs due to the angled cuts where four roof planes intersect. Each hip intersection produces triangular waste offcuts that cannot be used elsewhere.' },
    ],
    howToUse: [
      'Enter the building length and width — measure the footprint at the exterior walls.',
      'Select your roof pitch from the dropdown (6/12 is the most common residential pitch).',
      'Choose gable (two sloping sides) or hip (four sloping sides) roof type.',
      'Enter the eave overhang distance (1-2 feet is standard) and select a waste factor.',
      'Review the complete materials list: squares, shingle bundles, underlayment rolls, nails, ridge caps, and ice-and-water shield.',
    ],
    explanation:
      'Roofing is one of the most critical — and expensive — components of any building. The roof protects the entire structure from water, wind, and weather, making accurate material estimation essential for budgeting and avoiding mid-project shortages. In the roofing industry, materials are universally measured in "squares," where 1 square equals 100 square feet of roof surface area.\n\nThe key challenge in roofing estimation is that the roof surface area is always larger than the building footprint. The steeper the pitch, the greater the difference. A flat roof (0/12 pitch) has a multiplier of exactly 1.000 — the roof area equals the footprint. But a steep 12/12 pitch has a multiplier of 1.414, meaning the roof surface is 41.4% larger than the footprint. This dramatic difference is why two houses with identical floor plans but different roof pitches can have wildly different roofing costs.\n\nPractical example: a house measuring 40 feet by 30 feet with a 6/12 pitch and 1 foot overhang on all sides. The effective footprint is (40 + 2) x (30 + 2) = 42 x 32 = 1,344 sq ft. Using the pitch multiplier of 1.118 for 6/12, the roof surface area before waste is 1,344 x 1.118 = 1,503 sq ft. With 10% waste on a gable roof: 1,503 x 1.10 = 1,653 sq ft, which rounds up to 17 squares requiring 51 bundles of shingles.\n\nEdge cases: for roofs with multiple valleys, dormers, or chimneys, waste can reach 20% because of complex flashing and cutting around obstructions. For flat or low-slope roofs (below 2/12 pitch), shingles are not appropriate at all — use built-up roofing (BUR), modified bitumen, or single-ply membrane systems instead. In high-wind coastal areas, building codes may require upgraded underlayment and six nails per shingle instead of the standard four.',
    quickReference: [
      { label: '1 square', value: '100 sq ft of roof surface' },
      { label: 'Shingles per square', value: '3 bundles' },
      { label: 'Felt per roll', value: '~400 sq ft coverage' },
      { label: 'Nails per square', value: '~320 nails (2 lbs)' },
      { label: 'Flat roof (0/12)', value: 'Pitch multiplier 1.000' },
      { label: 'Standard (6/12)', value: 'Pitch multiplier 1.118' },
      { label: 'Steep (12/12)', value: 'Pitch multiplier 1.414' },
      { label: 'Hip roof penalty', value: '+5% material' },
    ],
    faqs: [
      {
        question: 'What is a roofing square?',
        answer: 'A roofing square is 100 square feet of roof surface area — the standard unit of measurement in the roofing industry. Material estimates for shingles, underlayment, and fasteners are all quoted per square. For example, a 2,000 sq ft roof is described as a "20-square roof." Shingles are packaged in bundles that cover one-third of a square each, so 3 bundles = 1 square. Always round up to the nearest square and the nearest bundle when ordering materials.',
      },
      {
        question: 'How many shingle bundles do I need per square?',
        answer: 'Standard three-tab architectural shingles come 3 bundles per square. Each bundle covers approximately 33.3 square feet. Some premium or laminated shingles may require 4 bundles per square in certain exposure patterns — always check the manufacturer specification on the bundle wrapper. Starter strip shingles (for the eaves) and ridge cap shingles are ordered separately from the field shingles and are not included in the bundles-per-square calculation.',
      },
      {
        question: 'How do I calculate roofing for a complex roof with valleys and dormers?',
        answer: 'For complex roofs, divide the roof into individual geometric planes (rectangles and triangles), calculate each plane area separately using the appropriate pitch multiplier, and sum them all. A hip roof with a front-facing dormer might require 5 or more separate plane calculations. Valleys where two roof planes intersect require metal flashing extending 6-8 inches on each side and additional underlayment. Each dormer adds flashing at the sidewalls and a small additional roof plane. For skylights, account for the flashing kit and extra shingle cutting around the curb. Use 15-20% waste for complex roofs instead of the standard 10%. Always include ridge vent material for proper attic ventilation.',
      },
      {
        question: 'What underlayment do I need under shingles?',
        answer: 'Standard asphalt-saturated felt underlayment (often called "tar paper") comes in rolls covering approximately 400 square feet. At minimum, you need enough rolls to cover the entire roof deck. Building codes in most regions require either #15 felt (lighter) or #30 felt (heavier). In cold climates, building codes require ice and water shield — a self-adhering waterproof membrane — applied along the eaves for the first 3 feet past the exterior wall line and in all valleys. For high-end installations, synthetic underlayment offers better tear resistance, lighter weight, and longer UV exposure tolerance but costs about 2-3 times more than traditional felt.',
      },
      {
        question: 'What is the difference between architectural and three-tab shingles?',
        answer: 'Three-tab shingles are the traditional flat shingle with three uniform tabs per strip, creating a repetitive rectangular pattern. They are the most economical option, typically rated for 20-25 years, and cost about $30-40 per square for materials only. Architectural (dimensional) shingles have a thicker, multi-layer construction with random tab patterns that create a textured, wood-shake appearance. They last 30-50 years, have higher wind ratings (up to 130 mph vs. 60-70 mph for three-tab), and cost $50-80 per square. Architectural shingles now dominate the residential market, representing over 80% of new installations because the improved aesthetics and durability justify the 30-50% cost premium.',
      },
      {
        question: 'When should I replace rather than repair my roof?',
        answer: 'A typical asphalt shingle roof lasts 20-30 years depending on climate, ventilation, and installation quality. Signs you need replacement include: curled or cupped shingle edges, missing granules with visible asphalt substrate, cracked or broken shingles, and loss of the protective mineral granule coating (visible as bare spots or granules collecting in gutters). If 30% or more of the roof surface shows these signs, replacement is more cost-effective than spot repairs. Inside the house, look for water stains on ceilings, peeling wallpaper, or musty attic odors — these indicate the underlayment has failed even if shingles look intact from the outside.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Tom in Chicago needs to reroof his 45 ft x 28 ft ranch house with a 6/12 gable roof and 1.5 ft overhangs. He plans to use architectural shingles and wants a complete materials estimate.',
        inputs: { length: '45', width: '28', pitch: '6', overhang: '1.5', roofType: 'gable', wasteFactor: '10' },
        result: 'Footprint = (45+3) x (28+3) = 1,488 sq ft. Roof area = 1,488 x 1.118 x 1.10 = 1,830 sq ft. 19 squares, 57 bundles, 5 rolls felt, 38 lbs nails, 4 rolls ice & water shield.',
        insight: 'Tom lives in Chicago where ice dams are a serious concern. The 4 rolls of ice and water shield are critical — applied at least 3 feet past the heated wall line along all eaves. His total material cost for architectural shingles will be roughly $3,000-3,800 before labor.',
      },
      {
        scenario: 'Maria is a contractor bidding on a hip roof replacement for a 40 ft x 50 ft house with an 8/12 pitch and 1.5 ft overhang. She uses 15% waste for the hip design complexity.',
        inputs: { length: '50', width: '40', pitch: '8', overhang: '1.5', roofType: 'hip', wasteFactor: '15' },
        result: 'Roof area approximately 2,900 sq ft, requiring 29 squares and 87 bundles.',
        insight: 'The hip roof adds about 5% more surface area than a gable roof of the same footprint. The 8/12 pitch multiplier of 1.202 means the roof surface is 20% larger than the floor area. Maria should order materials with a 5% buffer beyond the calculated waste to avoid mid-project shortages.',
      },
    ],
    proTips: [
      'Order all shingles from the same production lot — Shingle dye lots can vary noticeably between manufacturing runs. Order everything at once and verify the lot numbers on the bundles match. Keep 1-2 extra bundles for future repairs.',
      'Use synthetic underlayment for steep roofs — On pitches 8/12 and steeper, synthetic underlayment provides much better walkability and tear resistance than traditional felt. The higher upfront cost is offset by improved safety and faster installation.',
      'Ventilate properly — Inadequate attic ventilation is the #1 cause of premature shingle failure. Install ridge vent along the entire peak combined with soffit vents to create continuous airflow. The rule is 1 sq ft of net free vent area per 300 sq ft of attic floor.',
      'Check local code for ice barrier requirements — Most northern states require ice and water shield to extend 24 inches past the heated wall line. In severe climate zones, this extends to the entire eave area up to the ridge. Missing this detail is the most common roofing inspection failure.',
      'Schedule for the right season — Asphalt shingles need warm temperatures (above 40 degrees Fahrenheit) for proper adhesion of the self-sealing strips. Cold-weather installation requires hand-sealing each shingle tab, which adds significant labor cost. The ideal roofing season is late spring through early fall.',
    ],
    limitations: [
      'This calculator is designed for standard residential gable and hip roofs with uniform pitch. Complex roof geometries with intersecting gables, turrets, mansard configurations, or curved roof sections require manual measurement and a professional roofing estimate.',
      'Material quantities assume standard 3-tab or architectural shingles at 3 bundles per square. Premium or designer shingles may require 4-5 bundles per square. Metal roofing, tile, slate, and wood shake have entirely different material units and must not use this calculator.',
      'Local building codes may require additional materials beyond those calculated here. Wind-borne debris regions (coastal areas) require enhanced fastening patterns. Wildfire-prone areas require Class A fire-rated materials. High-wind regions may require ring-shank nails and six-nail patterns per shingle.',
      'This tool provides material estimates for budgeting and DIY planning purposes only. When not to use: for structural roof design (truss/rafter sizing), for snow load capacity calculations, or for commercial flat roof systems requiring tapered insulation and drainage calculations. Always consult a licensed roofing contractor for installation.',
    ],
    commonUses: [
      'Residential re-roofing — estimate shingle bundles, squares, underlayment, and fasteners for stripping and replacing an existing asphalt shingle roof on a standard single-family home',
      'New construction roofing — calculate materials for roofing a new home or addition, including the complete system: underlayment, field shingles, ridge caps, and ventilation components',
      'Shed and detached garage roofing — estimate materials for small outbuilding roofs using the gable option with 5% waste for simple single-plane roofs',
      'Insurance claim verification — cross-check contractor estimates against calculated material quantities to verify that quoted squares and bundles match the actual roof area',
    ],
    citations: [
      { source: 'NRCA (National Roofing Contractors Association) - Roofing Manual', url: 'https://www.nrca.net/' },
      { source: 'Wikipedia - Roof pitch multiplier', url: 'https://en.wikipedia.org/wiki/Roof' },
      { source: 'IRC 2024 - International Residential Code, Chapter 9: Roof Assemblies', url: 'https://codes.iccsafe.org/' },
    ],
  },
};

export default roofingConfig;
