import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import MulchTopsoilPanel from './MulchTopsoilPanel';

const mulchTopsoilConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'material',
      label: 'Material',
      type: 'select',
      required: true,
      helpText: 'Choose the landscaping material you need',
      options: [
        { label: 'Mulch (2–3 inch layer recommended)', value: 'mulch' },
        { label: 'Topsoil (4–6 inch layer for new beds)', value: 'topsoil' },
        { label: 'Compost (2–3 inch amendment layer)', value: 'compost' },
        { label: 'Gravel / Pea Gravel', value: 'gravel' },
        { label: 'Sand', value: 'sand' },
      ],
    },
    {
      id: 'length',
      label: 'Area Length',
      type: 'number',
      placeholder: '30',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Length of the garden or landscape area',
    },
    {
      id: 'width',
      label: 'Area Width',
      type: 'number',
      placeholder: '10',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Width of the garden or landscape area',
    },
    {
      id: 'depth',
      label: 'Layer Depth',
      type: 'number',
      placeholder: '3',
      unit: 'inches',
      min: 0.5,
      max: 24,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Desired depth of the mulch or topsoil layer',
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const depthIn = parseFloat(values.depth);
    const material = values.material || 'mulch';

    if ([length, width, depthIn].some(isNaN) || length <= 0 || width <= 0 || depthIn <= 0) return [];

    const depthFt = depthIn / 12;
    const cubicFeet = length * width * depthFt;
    const cubicYards = cubicFeet / 27;
    const withWaste = cubicYards * 1.1;

    const bagSizeCuFt = 2;
    const bagsNeeded = Math.ceil(cubicFeet * 1.1 / bagSizeCuFt);

    const materialNames: Record<string, string> = {
      mulch: 'Mulch',
      topsoil: 'Topsoil',
      compost: 'Compost',
      gravel: 'Gravel',
      sand: 'Sand',
    };

    return [
      {
        id: 'cubicYards',
        label: `${materialNames[material] ?? 'Unknown material'} — Cubic Yards`,
        value: `${withWaste.toFixed(2)} cu yd`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'cubicFeet',
        label: 'Cubic Feet',
        value: `${(cubicFeet * 1.1).toFixed(1)} cu ft`,
        color: 'neutral',
      },
      {
        id: 'bags',
        label: '2 Cu Ft Bags (if bagged)',
        value: `${bagsNeeded} bags`,
        color: 'neutral',
      },
      {
        id: 'area',
        label: 'Coverage Area',
        value: `${(length * width).toFixed(0)} sq ft`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MulchTopsoilPanel, { values, results });
  },
  educational: {
    formula: 'Cubic Yards = (Length × Width × Depth in ft) ÷ 27',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="140" width="320" height="140" fill="var(--svg-92400e)" rx="4"/><rect x="60" y="100" width="320" height="50" fill="var(--svg-78350f)" rx="4"/><text x="220" y="130" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Mulch Layer 3 in</text><text x="220" y="195" text-anchor="middle" font-size="14" fill="var(--svg-fef3c7)">Soil / Garden Bed</text><text x="220" y="230" text-anchor="middle" font-size="12" fill="var(--svg-fef3c7)">Length x Width</text><line x1="60" y1="280" x2="60" y2="300" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="380" y1="280" x2="380" y2="300" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="220" y="320" text-anchor="middle" font-size="13" fill="var(--svg-ef4444)">Length: 12 ft</text></svg>',
      alt: 'Garden bed cross-section with a mulch layer on top of soil',
      caption: 'Mulch volume = length x width x depth, converted to cubic yards',
    },
    formulaDescription:
      'Mulch, topsoil, and landscape materials are sold in cubic yards by bulk suppliers and in 2 cubic foot bags at retail stores.',
    variables: [
      { symbol: 'Length × Width', name: 'Area in Square Feet', description: 'The footprint of the garden bed or area to be covered, measured in feet.' },
      { symbol: 'Depth in ft', name: 'Layer Depth in Feet', description: 'Desired material depth converted from inches to feet (divide inches by 12).' },
      { symbol: '27', name: 'Cubic Feet per Cubic Yard', description: 'One cubic yard equals 27 cubic feet (3 ft × 3 ft × 3 ft), the standard unit for bulk landscape material orders.' },
    ],
    quickReference: [
      { label: '1 cu yd mulch at 3 in deep', value: 'Covers ~108 sq ft (roughly a 10×10 ft bed)' },
      { label: '1 cu yd topsoil at 6 in deep', value: 'Covers ~54 sq ft (roughly a 9×6 ft bed)' },
      { label: '1 cu yd gravel at 2 in deep', value: 'Covers ~162 sq ft (roughly a 12×14 ft area)' },
      { label: 'Mulch depth: 2–3 in', value: 'Ideal for weed suppression and moisture retention' },
      { label: 'Topsoil depth: 4–6 in', value: 'Ideal for new garden beds or lawn installation' },
      { label: 'Compost depth: 2–3 in', value: 'As an amendment worked into existing soil' },
      { label: '1 bulk cu yd (27 cu ft)', value: 'Equals 13.5 bags of 2 cu ft retail bags' },
      { label: 'Typical pickup truck bed', value: 'Holds ~2 cu yd of mulch (full-size truck, heaped)' },
    ],
    howToUse: [
      'Select the material you need (mulch, topsoil, compost, gravel, or sand).',
      'Enter the area dimensions (length and width in feet).',
      'Enter the desired layer depth in inches.',
      'The result shows cubic yards for bulk orders and the number of 2 cu ft bags if buying bagged retail.',
      'Use the bulk option for large landscaping projects and bagged for small garden beds or containers.',
    ],
    explanation:
      'Mulch is typically applied at 2-3 inches for weed suppression and moisture retention. Deeper than 3 inches can cause root problems. Topsoil for new garden beds typically requires 4-6 inches of depth. Bulk material delivery is cost-effective for orders above 2-3 cubic yards. Below that, bagged material from a garden center is usually more practical. Different types of mulch offer different benefits: shredded hardwood mulch breaks down slowly and enriches soil over time, making it ideal for perennial beds. Pine bark nuggets last longer but can float away in heavy rain. Cedar mulch naturally repels insects but is more expensive. Rubber mulch is long-lasting but does not add nutrients to the soil. For vegetable gardens, consider using straw or leaf compost instead of wood-based mulches. When preparing a new garden bed, first remove grass and weeds, loosen the soil to at least 6 inches deep, and mix in compost or organic matter before applying topsoil or mulch on top. Gravel and sand are heavier materials typically used for pathways, driveways, or as a base layer for pavers rather than for planting areas. Compost is best used as a soil amendment mixed into existing soil rather than as a top dressing.',
    commonUses: [
      'Ordering the right amount of bulk mulch or topsoil for garden beds, landscaping projects, or new lawns',
      'Deciding between bulk delivery and bagged material when planning small vs large landscape projects',
      'Calculating material needs for different depths — from a 2-inch mulch layer to 6 inches of new topsoil for garden beds',
      'Estimating gravel or sand quantity for pathways, driveway topping, or paver base layers',
    ],
    faqs: [
      {
        question: 'How deep should I apply mulch?',
        answer: '2-3 inches is ideal. Less than 2 inches is insufficient for weed control. More than 4 inches can create a mulch volcano effect that suffocates roots and promotes rot. Pull mulch away from tree trunks and plant stems by 2-3 inches to prevent moisture-related damage.',
      },
      {
        question: 'When is bulk material better than bagged?',
        answer: 'For orders over 2-3 cubic yards, bulk delivery is significantly cheaper per yard. A typical delivery minimum is 1-2 yards. Smaller quantities are more economical as bagged material. Bulk also means less plastic waste from bags. However, bulk deliveries require a driveway or street access for the dump truck.',
      },
      {
        question: 'Which type of mulch is best for flower beds?',
        answer: 'Shredded hardwood mulch is the most popular choice for flower beds because it stays in place well, breaks down slowly to improve soil structure, and has a natural dark color. Pine bark nuggets are better for slopes since they interlock. Avoid using dyed mulches near edible plants due to potential chemical leaching.',
      },
      {
        question: 'Should I remove old mulch before applying new mulch?',
        answer: 'If the old mulch layer is 1 inch or less, you can simply add new mulch on top. If the old layer is more than 2 inches deep, rake or remove some to prevent the total layer from exceeding 3 inches. Old mulch that has compacted into a mat should be loosened or removed to allow water penetration.',
      },
      {
        question: 'How do I measure my garden area for this calculator?',
        answer: 'For rectangular beds, simply measure length and width. For irregular shapes, divide the area into rectangles, calculate each separately, and add them together. For circular planting areas, measure the diameter and use the formula pi times radius squared to find the square footage. Round up slightly when entering dimensions to account for imperfect shapes.',
      },
      {
        question: 'How do I know if my existing soil needs topsoil or compost?',
        answer: 'For hard, compacted, or clay-heavy soil, add 4–6 inches of new topsoil on top after loosening the existing soil. For soil that is already decent but depleted of nutrients, work 2–3 inches of compost into the top 6 inches of existing soil instead of adding topsoil. A simple soil test kit ($10–15 at garden centers) can tell you the pH and nutrient levels. If the soil drains poorly (water pools for hours after rain), adding compost is more effective than topsoil at improving drainage structure.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Emily is mulching her 30×10 ft perennial flower bed with 3 inches of shredded hardwood mulch to suppress weeds for the growing season.',
        inputs: { material: 'mulch', length: '30', width: '10', depth: '3' },
        result: 'Area = 300 sq ft, volume = 2.78 cu yd without waste, 3.06 cu yd with 10% buffer. Equivalent to 42 two-cu-ft bags.',
        insight: 'At just over 3 cubic yards, Emily is at the sweet spot where bulk delivery is economical. Bulk mulch costs $25–40/yard delivered (with a 3–5 yard minimum) vs. $3–5 per 2 cu ft bag retail. At 3 yards bulk: ~$75–120 vs. 42 bags retail: ~$126–210. Even with a delivery fee, bulk is cheaper and means no hauling and no plastic waste. If Emily has her own pickup, she can self-haul up to ~2 yards per trip. She should apply mulch after the soil has warmed in late spring and pull it 2–3 inches away from plant stems to prevent rot.',
      },
      {
        scenario: 'Raj is building a new 20×5 ft raised vegetable bed and needs to fill it with 6 inches of topsoil mixed with compost for optimal growing conditions.',
        inputs: { material: 'topsoil', length: '20', width: '5', depth: '6' },
        result: 'Area = 100 sq ft, volume = 1.85 cu yd without waste, 2.04 cu yd with 10% buffer. Equivalent to 28 two-cu-ft bags.',
        insight: 'Raj needs about 2 cubic yards of topsoil. Since vegetable beds benefit from compost mixed in, a good strategy is 1.5 yards of screened topsoil + 0.5 yards of compost mixed together. At 2 yards total, this might be below some bulk suppliers\' minimum delivery (often 3–5 yards), so Raj should either order from a landscape supply with a 2-yard minimum or plan to pick up with a truck. If bagged, 28 bags × $3–4 = $84–112. Raj should also consider installing a weed barrier or layer of cardboard at the bottom of the raised bed to prevent grass and weeds from growing up through the new soil.',
      },
      {
        scenario: 'A city parks department is refreshing the mulch on 10 tree rings, each 6 ft in diameter. They need 3 inches of fresh mulch on each ring.',
        inputs: { material: 'mulch', length: '30', width: '10', depth: '3' },
        result: 'Tree ring area each = pi × (3 ft)² = 28.3 sq ft × 10 rings = 283 sq ft total. For rectangular approximation: treat as 28×10 ft = 280 sq ft. Volume = 2.59 cu yd without waste, 2.85 cu yd with 10% buffer. About 39 two-cu-ft bags.',
        insight: 'While the calculator uses a rectangular approximation, for circular tree rings the parks department should calculate separately or use a slightly larger rectangle to be safe. At 2.85 cu yd, they are in bulk delivery range. For municipal orders, they should also factor in that some mulch will blow away or be scattered by pedestrians, so ordering 3 full yards is safer. Parks departments often use coarser mulch (wood chips) that lasts longer than shredded hardwood — wood chips can go 2 seasons without refreshing while shredded mulch typically needs annual replenishment. They should also ensure the mulch is not piled against tree trunks ("volcano mulching"), which causes bark rot and invites pests.',
      },
    ],
    proTips: [
      'Before ordering bulk mulch or topsoil, measure your garden beds and mark the exact dump location with cones or flags. Bulk delivery trucks need 10–12 ft of overhead clearance (no tree branches) and a firm, level surface. A full-size dump truck weighs 20+ tons when loaded and will destroy a soft lawn or crack a driveway if not properly positioned. Lay plywood sheets on the lawn to protect it.',
      'Fresh wood mulch can temporarily deplete soil nitrogen as it decomposes — microbes consume nitrogen to break down the wood, sometimes "stealing" it from plant roots. For flower beds near heavy feeder plants (roses, tomatoes, annuals), apply a light scattering of balanced 10-10-10 fertilizer before mulching, or use aged/composted mulch that has already begun decomposition.',
      'Mulch color matters beyond aesthetics: dark brown or black mulch absorbs heat and warms the soil faster in spring (beneficial for heat-loving plants like tomatoes and peppers). Light-colored mulch reflects heat and keeps soil cooler (better for cool-season crops and shallow-rooted plants like azaleas and rhododendrons). Dyed mulches may contain chemical colorants — avoid using them in vegetable gardens.',
      'For new lawns, topsoil depth is critical: 4–6 inches for cool-season grasses (fescue, bluegrass) and 3–4 inches for warm-season grasses (Bermuda, zoysia) over existing soil. More than 6 inches of fresh topsoil can settle unevenly and create a lumpy lawn. After spreading, compact lightly with a lawn roller at half-full water capacity, then rake smooth before seeding or laying sod.',
      'Compost is NOT the same as topsoil, and using pure compost as a growing medium can burn plants with excess nutrients. Compost is a soil amendment — mix 1 part compost with 3 parts existing soil or topsoil for vegetable beds. Using this calculator for compost: enter the depth of compost you want to ADD (not fill with), typically 2–3 inches, and the result tells you how much compost to spread and work in.',
      'Gravel for pathways: use 2–3 inches for pedestrian paths, 4–6 inches for driveways. Always include a compacted gravel base (3–4 inches of larger crushed stone like #57 stone) under the decorative top layer. Use landscape fabric between the subsoil and gravel to prevent gravel from sinking into mud. The calculator gives the top layer volume — order base layer separately using a 4-inch depth.',
    ],
    limitations: [
      'This calculator provides an estimate based on rectangular areas with uniform depth. It does not account for irregularly shaped beds (kidney-shaped, circular, or curved borders), sloped terrain where depth varies, or material compaction which occurs naturally over time (mulch and compost settle 20-30% within the first season; gravel settles 5-10% after compaction).',
      'Different material densities and quality variations are not factored in — a cubic yard of dry shredded mulch weighs ~400-600 lbs, while wet mulch can weigh 800+ lbs, and gravel weighs 2,400-3,000 lbs per cubic yard. Bag-to-bulk conversion is based on 2 cu ft bags — some products come in 1.5 cu ft or 3 cu ft bags.',
      'Delivery minimums from bulk suppliers (commonly 3-5 cubic yards) may make small orders uneconomical, and seasonal pricing fluctuations can affect costs — mulch and topsoil are typically 15-30% cheaper in fall/winter than spring peak season.',
      'For commercial landscaping projects, always add 10% contingency to the calculated volume. For steep slopes, consider erosion control measures like erosion blankets or terracing in addition to the calculated material volume.',
    ],
    citations: [
      { source: 'U.S. Department of Agriculture', url: 'https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil' },
      { source: 'OSHA', url: 'https://www.osha.gov/SLTC/landscaping/' },
    ],
  },
};

export default mulchTopsoilConfig;
