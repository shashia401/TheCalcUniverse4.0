import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import ConcreteSlabPanel from './ConcreteSlabPanel';

const concreteSlabConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Length',
      type: 'number',
      placeholder: '20',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Length of the concrete slab in feet',
    },
    {
      id: 'width',
      label: 'Width',
      type: 'number',
      placeholder: '15',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Width of the concrete slab in feet',
    },
    {
      id: 'depth',
      label: 'Thickness',
      type: 'select',
      required: true,
      helpText: 'Slab thickness determines load capacity',
      options: [
        { label: '2 inches (light duty, pathways)', value: '2' },
        { label: '3 inches (patios, sidewalks)', value: '3' },
        { label: '4 inches (standard driveways, slabs)', value: '4' },
        { label: '5 inches (heavy vehicle driveways)', value: '5' },
        { label: '6 inches (commercial, heavy loads)', value: '6' },
        { label: '8 inches (structural foundations)', value: '8' },
      ],
    },
    {
      id: 'wastePct',
      label: 'Waste Allowance',
      type: 'select',
      helpText: 'Extra material to account for spillage and uneven ground',
      options: [
        { label: '5% (flat, well-defined area)', value: '5' },
        { label: '10% (recommended standard)', value: '10' },
        { label: '15% (irregular shape or steep grade)', value: '15' },
      ],
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const depthIn = parseFloat(values.depth || '4');
    const wastePct = parseFloat(values.wastePct || '10') / 100;

    if ([length, width, depthIn].some(isNaN) || length <= 0 || width <= 0) return [];

    const depthFt = depthIn / 12;
    const cubicFeet = length * width * depthFt;
    const cubicYards = cubicFeet / 27;
    const withWaste = cubicYards * (1 + wastePct);
    const bags60lb = Math.ceil(withWaste * 27 / 0.45);
    const bags80lb = Math.ceil(withWaste * 27 / 0.6);

    const fmt = (n: number) => n.toFixed(2);

    return [
      {
        id: 'cubicYards',
        label: 'Cubic Yards Needed',
        value: `${fmt(withWaste)} cu yd`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'cubicFeet',
        label: 'Cubic Feet',
        value: `${fmt(cubicFeet * (1 + wastePct))} cu ft`,
        color: 'neutral',
      },
      {
        id: 'bags60',
        label: '60-lb Bags Equivalent',
        value: `${bags60lb.toLocaleString(undefined)} bags`,
        color: 'neutral',
      },
      {
        id: 'bags80',
        label: '80-lb Bags Equivalent',
        value: `${bags80lb.toLocaleString(undefined)} bags`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConcreteSlabPanel, { values, results });
  },
  educational: {
    formula: 'Cubic Yards = (Length × Width × Thickness in ft) ÷ 27',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="100" width="280" height="160" fill="var(--svg-cbd5e1)" stroke="var(--svg-64748b)" stroke-width="2" rx="4"/><line x1="80" y1="280" x2="80" y2="300" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="360" y1="280" x2="360" y2="300" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="80" y1="295" x2="360" y2="295" stroke="var(--svg-ef4444)" stroke-width="2"/><polygon points="360,295 355,290 355,300" fill="var(--svg-ef4444)"/><text x="220" y="315" text-anchor="middle" font-size="13" fill="var(--svg-ef4444)">Length: 20 ft</text><line x1="60" y1="100" x2="60" y2="260" stroke="var(--svg-22c55e)" stroke-width="2"/><line x1="40" y1="100" x2="40" y2="260" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="45" y="185" text-anchor="middle" font-size="13" fill="var(--svg-22c55e)" transform="rotate(-90,45,185)">Width: 10 ft</text><rect x="80" y="85" width="280" height="15" fill="var(--svg-ef4444)" rx="2"/><text x="220" y="96" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Thickness: 4 in</text></svg>',
      alt: 'Concrete slab diagram with length, width, and thickness dimensions labeled',
      caption: 'Concrete volume = Length x Width x Thickness, converted to cubic yards',
    },
    formulaDescription:
      'Concrete volume is calculated in cubic yards (27 cubic feet per cubic yard), the standard unit used when ordering ready-mix concrete.',
    variables: [
      { symbol: '27 cu ft', name: 'Cubic Yards Conversion', description: 'One cubic yard equals 27 cubic feet (3ft × 3ft × 3ft).' },
    ],
    quickReference: [
      { label: '1 cubic yard', value: '27 cubic feet (3×3×3 ft cube)' },
      { label: '10×10 ft slab at 4 in thick', value: '1.23 cu yd (~2 cu yd with waste)' },
      { label: '20×20 ft two-car driveway, 4 in', value: '4.94 cu yd (~5.5 cu yd with waste)' },
      { label: '1 cu yd from 80-lb bags', value: '45 bags (each yields ~0.6 cu ft)' },
      { label: '1 cu yd from 60-lb bags', value: '60 bags (each yields ~0.45 cu ft)' },
      { label: '4 in thickness', value: 'Standard for driveways, patios, walkways' },
      { label: '6 in thickness', value: 'Heavy vehicles (RVs, trucks), commercial' },
      { label: 'Ready-mix truck minimum', value: 'Typically 1–2 cu yd, varies by supplier' },
    ],
    howToUse: [
      'Enter the length and width of the slab area in feet.',
      'Select the concrete thickness for your specific application (e.g., 4 inches for driveways).',
      'Select a waste allowance based on site complexity.',
      'The result shows cubic yards for ordering ready-mix and equivalent 60-lb and 80-lb bag counts.',
      'Compare bag counts against ready-mix for your project size: under 1 yard = bags are practical, over 2 yards = ready-mix saves labor and ensures consistent quality.',
    ],
    explanation:
      'Concrete is ordered in cubic yards from ready-mix suppliers. One cubic yard is enough for a 10x10 ft slab at 3 inches thick. For small projects, bagged concrete (60 lb or 80 lb bags) can be used: an 80-lb bag makes approximately 0.6 cubic feet. Always add a waste margin — coming up short mid-pour is a serious problem because concrete starts setting. A 4-inch slab is standard for residential driveways; 6 inches for heavy vehicles like RVs or trucks. Proper site preparation is critical for a durable concrete slab: the ground must be compacted, a gravel base of 4-6 inches should be added for drainage, and reinforcement such as wire mesh or rebar should be placed before pouring. Control joints should be cut into the slab within 24 hours of pouring to prevent random cracking as the concrete cures. Weather conditions significantly affect concrete work: ideal temperatures are 50-80 degrees Fahrenheit, concrete should not be poured on frozen ground, and hot weather requires adding water or retarder to prevent rapid drying that causes cracking. Freshly poured concrete needs to stay moist for at least 7 days to reach proper strength, a process called curing. For a professional-looking finish, use a bull float to smooth the surface immediately after pouring, then follow with an edging tool to create rounded edges and a jointer tool to cut control joints at intervals of 2-3 times the slab thickness in inches.',
    commonUses: [
      'Ordering the right amount of ready-mix concrete for a patio, driveway, or foundation to avoid costly shortages or waste',
      'Estimating bagged concrete quantity for small DIY projects like fence posts, walkways, or shed pads',
      'Comparing costs between ready-mix delivery and bagged concrete for projects of different sizes',
      'Planning slab thickness based on expected loads — from light pathways to heavy vehicle parking areas',
    ],
    faqs: [
      {
        question: 'How thick should a concrete driveway be?',
        answer: 'Residential driveways handling passenger cars should be at least 4 inches thick. If you park heavy vehicles like trucks or RVs, use 5-6 inches. Commercial lots often use 6-8 inches. Thicker slabs also require more reinforcement and a stronger subbase.',
      },
      {
        question: 'When should I use ready-mix concrete vs. bags?',
        answer: 'Ready-mix is cost-effective for pours over 1 cubic yard. Below that, bagged concrete is practical. Pouring more than 2-3 yards from bags is extremely labor-intensive. Ready-mix also ensures consistent quality, while bag mix quality can vary if not properly measured and mixed.',
      },
      {
        question: 'How long does concrete take to cure?',
        answer: 'Concrete reaches about 70% of its full strength within 7 days and achieves full design strength after 28 days of proper curing. Keep the concrete moist for at least the first 7 days by covering with wet burlap, applying curing compound, or using a soaker hose. Avoid heavy loads on the slab for at least 7 days.',
      },
      {
        question: 'Why do concrete slabs crack?',
        answer: 'Concrete shrinks as it cures and expands and contracts with temperature changes. Control joints (cut grooves) direct cracking to predetermined locations where it is less visible and structurally harmless. Without control joints, cracks will still occur but in random, potentially unsightly patterns. Proper reinforcement, subbase preparation, and curing all help minimize cracking.',
      },
      {
        question: 'What is the best concrete mix for a DIY slab?',
        answer: 'For DIY slabs, use a pre-mixed concrete blend designed for projects like walkways, patios, and driveways. 4,000 PSI mix is standard for residential slabs — it provides good strength for most applications. Ready-mix concrete labels typically specify the PSI rating. For bagged concrete, look for "high-strength" or "4000 PSI" mixes. Add fiber reinforcement or wire mesh for crack resistance. For structural applications like footings or foundations, use 4,500+ PSI mix.',
      },
      {
        question: 'Can I pour concrete in cold or hot weather?',
        answer: 'Ideal pouring temperature is 50–80 degrees Fahrenheit. In cold weather (below 40 degrees F), concrete sets very slowly and can freeze before gaining strength — frozen concrete must be removed and re-poured. Use cold-weather admixtures or heated water, and cover with insulated blankets. In hot weather (above 90 degrees F), concrete sets too quickly, which can cause cracking from rapid drying. Use cool water, pour early morning or evening, apply evaporation retarder, and start curing immediately. Never pour on frozen or muddy ground.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Tom is pouring a 20×15 ft driveway extension for his second car. Standard 4-inch thickness with 10% waste for the slightly uneven subgrade.',
        inputs: { length: '20', width: '15', depth: '4', wastePct: '10' },
        result: 'Volume = 3.70 cu yd without waste, 4.07 cu yd with 10% waste. Equivalent: 245 sixty-lb bags or 184 eighty-lb bags.',
        insight: 'At just over 4 cubic yards, Tom is well above the bagged-concrete threshold. He should order a ready-mix truck (4.5 yards, the supplier minimum is usually 4 yards). Cost: ~$125–150/yard × 4.5 = $560–675 plus a short-load fee if the minimum isn\'t met. Bagged would cost ~$800+ and take a full day of heavy labor mixing. Ready-mix saves both money and time at this volume. Tom needs to prepare a gravel base, build wood forms, and arrange for a wheelbarrow and helpers since the truck has limited pour time.',
      },
      {
        scenario: 'Priya needs to set 8 fence posts, each requiring a 12-inch diameter hole 30 inches deep. She\'s buying 80-lb bags from the hardware store.',
        inputs: { length: '0', width: '0', depth: '4', wastePct: '10' },
        result: 'Each post hole volume: pi × (0.5 ft)² × 2.5 ft = 1.96 cu ft × 8 posts = 15.7 cu ft total. At 0.6 cu ft per 80-lb bag = ~27 bags with 10% waste (but run the posts through a cylinder volume formula separately).',
        insight: 'This calculator is designed for slab pours. For cylindrical post holes, use a separate formula: volume = pi × radius² × depth. Each 12-inch × 30-inch hole = ~2 cu ft. With 8 posts and 10% waste: ~18 cu ft total. At 0.6 cu ft per 80-lb bag, that\'s 30 bags. Priya should buy 32 bags for safety. For post-setting, use a fast-setting concrete mix specifically made for fence posts rather than standard slab mix — it sets in 20–40 minutes so you don\'t need to brace posts overnight.',
      },
      {
        scenario: 'A landscape contractor is pouring a 30×25 ft patio at 4 inches thick for a restaurant outdoor dining area. The site is flat and well-prepared, so 5% waste is sufficient.',
        inputs: { length: '30', width: '25', depth: '4', wastePct: '5' },
        result: 'Volume = 9.26 cu yd without waste, 9.72 cu yd with 5% waste. Equivalent: 584 sixty-lb bags or 438 eighty-lb bags.',
        insight: 'At nearly 10 cubic yards, this is a full ready-mix truck (typical capacity is 8–10 yards). The contractor should order 10 yards, which is the safe round-up. At ~$125/yard, that\'s $1,250 for concrete. The 5% waste is acceptable because the site is flat and the crew is experienced, but the contractor might still round up to 10.5 yards if the subbase has any undulation. For a restaurant dining area, the contractor should use a broom finish for slip resistance and consider integral color or stamped concrete for aesthetics. He should plan for a crew of 3–4 people for the pour and finishing.',
      },
    ],
    proTips: [
      'Never pour concrete on dry, uncompacted, or frozen ground. Excavate to the required depth, compact the soil with a plate compactor (rent for ~$50/day), add 4–6 inches of compacted gravel base for drainage, and dampen the gravel before pouring to prevent the dry base from sucking water out of the concrete too quickly, which weakens the slab.',
      'Order slightly more concrete than calculated — coming up short mid-pour creates a "cold joint" (a weak seam between old and new concrete) that will crack and looks terrible. Most suppliers allow you to return unused concrete (check their policy), so the cost of over-ordering 0.25–0.5 yards is far less than the cost of a short load or structural failure.',
      'Cut control joints within 6–18 hours of finishing — while the concrete is still green but has hardened enough to hold an edge. Joints should be 1/4 the slab thickness deep and spaced at 2–3 times the slab thickness in feet (e.g., for 4-inch slab, cut joints every 8–12 ft). Control joints don\'t prevent cracking; they direct cracks to a straight, hidden line where they are less visible.',
      'Curing is not the same as drying — concrete cures through a chemical reaction with water (hydration), not by drying out. Keep the slab continuously moist for at least 7 days after pouring. Use a soaker hose, wet burlap, plastic sheeting, or spray-on curing compound. Concrete that dries out too quickly can lose up to 40% of its design strength.',
      'Use reinforcement: welded wire mesh (WWF) or rebar is cheap insurance. For a 4-inch residential slab, 6×6 W1.4/W1.4 wire mesh placed at mid-depth (use chairs or pull it up during the pour — never lay it on the ground and pour over it) adds about $0.25/sq ft and dramatically reduces random cracking. For structural slabs, use #4 rebar spaced 12–18 inches.',
      'When mixing from bags, rent a concrete mixer (about $40–60/day) instead of mixing in a wheelbarrow. A mixer produces more consistent concrete, saves hours of labor, and reduces the risk of weak spots from improperly mixed bags. One person operating a mixer can produce about 1 cubic yard per hour — enough for a small patio. For anything over 1.5 yards, ready-mix is more economical.',
    ],
    limitations: [
      'This calculator provides an estimate for rectangular slabs with uniform thickness. It does not account for irregular slab shapes (L-shaped patios, curved walkways), variable-depth sections like thickened edges, or below-grade foundation walls and footings.',
      'Quantities for reinforcement (rebar, wire mesh), formwork lumber, gravel base material, and finishing tools are not included — these must be estimated separately based on your specific project and local building codes.',
      'The bag conversion uses approximate yields at standard water ratios: 80-lb bag yields ~0.6 cu ft, 60-lb bag yields ~0.45 cu ft. Actual yields vary slightly by mix design and water content.',
      'For structural slabs, foundations, or any load-bearing application, consult a licensed structural engineer. For projects over 1 cubic yard, always compare ready-mix pricing — it is typically cheaper, faster, and higher quality than bagged concrete.',
    ],
    citations: [
      { source: 'Portland Cement Association', url: 'https://www.cement.org/concrete' },
      { source: 'International Building Code', url: 'https://www.iccsafe.org/products-and-services/standards/' },
    ],
  },
};

export default concreteSlabConfig;
