import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import TileFlooringPanel from './TileFlooringPanel';

const tileFlooringConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'roomLength',
      label: 'Room Length',
      type: 'number',
      placeholder: '12',
      unit: 'ft',
      min: 0,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Length of the room where tile will be installed',
    },
    {
      id: 'roomWidth',
      label: 'Room Width',
      type: 'number',
      placeholder: '10',
      unit: 'ft',
      min: 0,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Width of the room where tile will be installed',
    },
    {
      id: 'tileSize',
      label: 'Tile Size',
      type: 'select',
      required: true,
      helpText: 'Select the tile dimensions you plan to use',
      options: [
        { label: '6×6 inch', value: '0.25' },
        { label: '12×12 inch (1 sq ft)', value: '1' },
        { label: '12×24 inch', value: '2' },
        { label: '18×18 inch', value: '2.25' },
        { label: '24×24 inch', value: '4' },
        { label: '36×36 inch', value: '9' },
      ],
    },
    {
      id: 'wastePercent',
      label: 'Waste / Cut Allowance',
      type: 'select',
      helpText: 'Extra tiles for cuts, breakage, and future repairs',
      options: [
        { label: '10% (straight lay)', value: '10' },
        { label: '15% (diagonal layout)', value: '15' },
        { label: '20% (complex layout or high waste)', value: '20' },
      ],
    },
    {
      id: 'pricePerSqFt',
      label: 'Tile Cost per Sq Ft (optional)',
      type: 'number',
      placeholder: '3.50',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Optional: enter to estimate total tile cost',
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.roomLength);
    const width = parseFloat(values.roomWidth);
    const tileSqFt = parseFloat(values.tileSize || '1');
    const wastePct = parseFloat(values.wastePercent || '10') / 100;
    const price = parseFloat(values.pricePerSqFt);

    if ([length, width, tileSqFt].some(isNaN) || length <= 0 || width <= 0) return [];

    const roomSqFt = length * width;
    const totalSqFtNeeded = roomSqFt * (1 + wastePct);
    const tilesNeeded = Math.ceil(totalSqFtNeeded / tileSqFt);
    const sqFtPerBox = 20;
    const boxesNeeded = Math.ceil(totalSqFtNeeded / sqFtPerBox);

    const fmt = (n: number) => n.toFixed(1);

    const results = [
      {
        id: 'sqFt',
        label: `Total Sq Ft (with ${(wastePct * 100).toFixed(0)}% waste)`,
        value: `${fmt(totalSqFtNeeded)} sq ft`,
        highlight: true,
        color: 'positive' as const,
      },
      { id: 'tiles', label: 'Individual Tiles Needed', value: `${tilesNeeded.toLocaleString(undefined)} tiles`, color: 'neutral' as const },
      { id: 'boxes', label: 'Approx. Boxes (20 sq ft/box)', value: `${boxesNeeded} boxes`, color: 'neutral' as const },
      { id: 'roomArea', label: 'Room Area', value: `${fmt(roomSqFt)} sq ft`, color: 'neutral' as const },
    ];

    if (!isNaN(price) && price > 0) {
      const totalCost = totalSqFtNeeded * price;
      results.push({ id: 'cost', label: 'Estimated Tile Cost', value: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'neutral' as const });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TileFlooringPanel, { values, results });
  },
  educational: {
    formula: 'Total Sq Ft = Room Sq Ft × (1 + Waste %) | Tiles = Total Sq Ft ÷ Tile Sq Ft',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="250" fill="var(--svg-f3f4f6)" stroke="var(--svg-d1d5db)" stroke-width="1"/><rect x="70" y="60" width="90" height="90" fill="var(--svg-3b82f6)" stroke="var(--svg-ffffff)" stroke-width="2" rx="2"/><rect x="170" y="60" width="90" height="90" fill="var(--svg-3b82f6)" stroke="var(--svg-ffffff)" stroke-width="2" rx="2"/><rect x="270" y="60" width="90" height="90" fill="var(--svg-3b82f6)" stroke="var(--svg-ffffff)" stroke-width="2" rx="2"/><rect x="70" y="160" width="90" height="90" fill="var(--svg-3b82f6)" stroke="var(--svg-ffffff)" stroke-width="2" rx="2"/><rect x="170" y="160" width="90" height="90" fill="var(--svg-3b82f6)" stroke="var(--svg-ffffff)" stroke-width="2" rx="2"/><rect x="270" y="160" width="90" height="90" fill="var(--svg-3b82f6)" stroke="var(--svg-ffffff)" stroke-width="2" rx="2"/><text x="220" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Tile Layout: Area + Waste</text></svg>',
      alt: 'Grid of six square tiles showing a tile flooring layout pattern',
      caption: 'Tile flooring — total tiles needed equals room area plus waste allowance',
    },
    formulaDescription:
      'Tile quantity is calculated from room square footage plus a waste allowance for cuts, breakage, and future repairs.',
    variables: [
      { symbol: 'Waste %', name: 'Waste Allowance', description: '10% for straight layouts, 15% for diagonal, 20% for complex patterns or irregular rooms.' },
    ],
    quickReference: [
      { label: '12×12 inch tile', value: '1 sq ft per tile, 20 tiles per box (20 sq ft/box)' },
      { label: '12×24 inch tile', value: '2 sq ft per tile, 10 tiles per box (20 sq ft/box)' },
      { label: '6×6 inch tile (backsplash)', value: '0.25 sq ft per tile, 80 tiles per box' },
      { label: 'Straight lay pattern', value: '10% waste (lowest waste, easiest DIY)' },
      { label: 'Diagonal (45 deg) pattern', value: '15% waste (more cuts, classic look)' },
      { label: 'Herringbone pattern', value: '20% waste (complex cuts, premium look)' },
      { label: '10×10 ft room, 12×12 tile', value: '110 sq ft with waste, 110 tiles, 6 boxes' },
      { label: 'Grout width standard', value: '1/8 in (rectified) or 3/16 in (non-rectified tile)' },
    ],
    howToUse: [
      'Enter the room dimensions in feet (length and width).',
      'Select the tile size you plan to use from common options.',
      'Select the waste percentage based on your installation layout complexity.',
      'Optionally enter the tile cost per square foot to estimate total material cost.',
      'Always round up and buy extra — it is difficult to match tile colors and lots later.',
    ],
    explanation:
      'Calculating tile quantities correctly saves money and avoids project delays. Always add a waste margin: 10% for simple straight-lay patterns, 15% for diagonal or herringbone patterns, and 20% for complex rooms or irregular shapes. Buy 5-10% extra beyond the calculated amount and keep leftover tiles for future repairs. Tile lots can vary slightly in color (dye lots), so having matching extras is valuable. When planning your tiling project, also consider the subfloor condition: concrete slabs need to be clean and level, while wooden subfloors may require cement backer board for tile installation. The tile size you choose affects not only aesthetics but also installation difficulty: larger tiles (18x18 or 24x24 inches) cover more area quickly but require a perfectly flat subfloor, while smaller tiles are more forgiving of uneven surfaces. Grout width also matters: 1/8 inch is standard for rectified tiles (precision-cut edges), while 3/16 inch is common for non-rectified tiles. Wider grout lines make pattern alignment easier but require more cleaning maintenance. For first-time tilers, starting with a medium-sized tile like 12x12 inches in a straight-lay pattern is the most beginner-friendly approach. Porcelain and ceramic are the most common tile materials, with porcelain being denser, more water-resistant, and better suited for high-traffic areas and bathrooms.',
    commonUses: [
      'Calculating how many boxes of tile to purchase for a bathroom, kitchen, or flooring installation project',
      'Determining the right waste allowance for different tile patterns such as straight lay, diagonal, or herringbone layouts',
      'Estimating total material cost for tile projects including a buffer for breakage during installation and future repairs',
    ],
    faqs: [
      {
        question: 'Why do I need extra tiles beyond the room square footage?',
        answer: 'Tiles must be cut to fit edges, corners, and around obstacles. Cuts create waste. Some tiles break during installation. Having extra ensures you can complete the job without a gap. It is nearly impossible to find an exact color match years later for repairs, so storing extra tiles from the original purchase is highly recommended.',
      },
      {
        question: 'What is a dye lot and why does it matter?',
        answer: 'Tile manufacturers batch-produce tiles in lots that can have slight color variations. Buying all tiles from the same lot at once ensures consistent color throughout the room. Check the lot number on the box before purchasing and verify all boxes share the same number.',
      },
      {
        question: 'Should I install tile myself or hire a professional?',
        answer: 'Simple straight-lay tile installation in a small bathroom or backsplash is a manageable DIY project for an experienced homeowner. However, large-format tiles, diagonal patterns, complex layouts with many cuts, and tiling over uneven subfloors are best left to professionals. Poor tile installation can lead to cracks, uneven surfaces, and water damage.',
      },
      {
        question: 'What tools do I need for tile installation?',
        answer: 'Essential tools include a tile cutter or wet saw, notched trowel for spreading thinset, tile spacers for consistent grout lines, a level, rubber mallet for setting tiles, grout float, and sponge for cleanup. For cutting curved shapes around toilets or pipes, a rotary tool with a tile bit or a manual tile nipper is needed.',
      },
      {
        question: 'How do I prepare the subfloor for tiling?',
        answer: 'The subfloor must be clean, dry, flat, and structurally sound. For concrete slabs, fill any cracks and ensure the surface is level. For wooden subfloors, install cement backer board (CBU) screwed every 6-8 inches, with taped and mudded seams. Over existing vinyl or tile, use a dedicated uncoupling membrane. An uneven subfloor will cause lippage where tile edges are not flush with each other.',
      },
      {
        question: 'How long does tile installation take?',
        answer: 'A standard 10x12 foot room typically takes 2-3 days: one day for subfloor prep and laying tile, a second day for the thinset to cure, and a third day for grouting and sealing. Grout needs 24-48 hours to cure before walking on the floor and 7 days before heavy use or cleaning with water.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Maria is renovating her 12×10 ft bathroom floor with 12×24 inch porcelain tiles in a straight-lay pattern. The tiles cost $4.50 per sq ft from the local flooring store.',
        inputs: { roomLength: '12', roomWidth: '10', tileSize: '2', wastePercent: '10', pricePerSqFt: '4.50' },
        result: 'Room = 120 sq ft. With 10% waste = 132 sq ft needed. Each tile is 2 sq ft, so 66 tiles. Boxes: 7 (at 20 sq ft/box). Estimated cost: $594.00.',
        insight: 'Maria should buy 7 boxes (140 sq ft coverage) which gives her about 20 sq ft extra — perfect for future repairs. At $4.50/sq ft, the tile cost is $594. She should also budget for thinset mortar (~$30–50), grout (~$20–30), and tools if she doesn\'t own them. The 12×24 large-format tiles require a very flat subfloor — if the floor has any dips over 1/8 inch in 10 ft, she will need self-leveling compound before tiling, adding $30–50 and an extra day of prep.',
      },
      {
        scenario: 'David is tiling his kitchen backsplash with 6×6 inch ceramic tiles in a diagonal pattern. The backsplash area is 15 linear feet by 18 inches high behind the counter.',
        inputs: { roomLength: '15', roomWidth: '1.5', tileSize: '0.25', wastePercent: '15', pricePerSqFt: '2.00' },
        result: 'Area = 22.5 sq ft. With 15% waste = 25.9 sq ft. Each tile is 0.25 sq ft, so 104 tiles. Boxes: 2. Cost: $51.75.',
        insight: 'David needs only 2 boxes for the backsplash — a small project well within DIY range. The diagonal pattern creates a diamond visual that makes small kitchens feel larger, but the 15% waste is important because diagonal cuts produce more waste triangles that cannot be reused. For a backsplash, David should also buy matching bullnose trim tiles for the exposed edges, which may cost $3–5 per linear foot additionally.',
      },
      {
        scenario: 'A flooring contractor is bidding a 25×20 ft open-plan living area with 24×24 inch large-format tiles in a herringbone pattern. The tiles are premium Italian porcelain at $12/sq ft.',
        inputs: { roomLength: '25', roomWidth: '20', tileSize: '4', wastePercent: '20', pricePerSqFt: '12.00' },
        result: 'Area = 500 sq ft. With 20% waste = 600 sq ft. Each tile is 4 sq ft, so 150 tiles. Boxes: 30. Estimated cost: $7,200.00.',
        insight: 'At 600 sq ft including waste, this is a large professional installation. The 20% herringbone waste is non-negotiable — every border tile requires a precise 45-degree cut. The contractor should verify the subfloor flatness with a 10 ft straightedge: for 24×24 tiles, the floor must be flat to within 1/16 inch over 10 ft, which is stricter than standard. Large-format tiles also require a special large-format thinset mortar that costs more but prevents lippage. The contractor should factor in 3–4 days of labor for this size project at professional rates.',
      },
    ],
    proTips: [
      'Always dry-lay (arrange without adhesive) a few rows of tile before mixing thinset. This helps you visualize the pattern, find the best starting point to minimize visible cut tiles, and confirm that you have enough tiles in matching dye lots.',
      'Buy all tile boxes at once and check lot numbers on every box before accepting delivery. Even "identical" tiles from different manufacturing lots can have subtle shade differences. Keep at least 3–5 extra tiles stored flat (not on edge) for future repairs — finding an exact match years later is nearly impossible.',
      'For large-format tiles (anything over 15 inches on any side), use a tile leveling system (like Lev-Tec or Spin Doctor clips). These wedge systems hold adjacent tiles flush during setting and prevent lippage (uneven edges) that catches toes and looks unprofessional. The clips add about $0.50–1.00/sq ft to materials but are worth every penny for a professional-quality floor.',
      'Check your subfloor deflection before starting — use the "jump test": jump in the middle of the floor. If you feel vibration or hear dishes rattle in adjacent rooms, the subfloor is too bouncy for tile. Wood subfloors may need additional plywood underlayment to reach the L/360 deflection rating required for ceramic tile (L/720 for natural stone).',
      'Start tiling from the center of the room, not from a wall. Walls are rarely perfectly straight, and starting from a wall can leave you with visibly tapered cut tiles at the opposite wall. Snap chalk lines for both center axes and dry-lay from the center outward to confirm the layout leaves at least half a tile at each border.',
      'Back-butter large tiles: for tiles larger than 12×12 inches, apply a thin layer of thinset to the back of the tile in addition to troweling the floor. This "back-buttering" ensures 95%+ mortar coverage (required for wet areas and heavy-traffic floors) and prevents hollow-sounding spots that can crack under load.',
    ],
    limitations: [
      'This calculator provides an estimate based on rectangular rooms with straight walls. It does not account for irregular room shapes (L-shaped, curved, or angled walls) that increase waste beyond the selected percentage, or obstacles like toilets, cabinets, kitchen islands, or pillars that require complex cuts.',
      'Specific tile pattern matching can increase waste (e.g., matching wood-look tile grain patterns requires sequential layout). Some tile types (glass, natural stone, very thin porcelain) are more fragile than standard ceramic and may need a higher waste percentage.',
      'Subfloor condition, grout, thinset quantities, and labor costs are not estimated and vary dramatically by region and tile complexity. Stair installations require specialized step-nosing tiles and different calculations.',
      'For rooms with many obstructions, add 5% to the waste allowance. For natural stone (marble, travertine, slate), use 20% minimum waste regardless of pattern due to natural variations and fragility. Always consult the tile manufacturer\'s installation guidelines for specific requirements.',
    ],
    citations: [
      { source: 'Tile Council of North America', url: 'https://www.tileusa.com/' },
      { source: 'OSHA', url: 'https://www.osha.gov/silica' },
    ],
  },
};

export default tileFlooringConfig;
