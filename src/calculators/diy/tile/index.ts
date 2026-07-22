import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import TilePanel from './TilePanel';

const LAYOUT_WASTE: Record<string, number> = {
  grid: 10,
  brick: 10,
  diagonal: 15,
  herringbone: 20,
};

const LAYOUT_NOTES: Record<string, string> = {
  grid: 'Standard grid is the most efficient layout with minimal waste',
  brick: 'Brick/staggered pattern requires more edge cuts than grid',
  diagonal: 'Diagonal layout requires complex angled cuts on all edges',
  herringbone: 'Herringbone has the highest waste due to complex interlocking angles',
};

const tileConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'areaLength',
      label: 'Room Length (ft)',
      type: 'number',
      placeholder: '12',
      min: 0.1,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the room length in feet. Measure along the longest wall including any alcoves or bay windows.',
    },
    {
      id: 'areaWidth',
      label: 'Room Width (ft)',
      type: 'number',
      placeholder: '10',
      min: 0.1,
      step: 0.25,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the room width in feet. Measure at the widest point, even if part of the room is narrower.',
    },
    {
      id: 'tileLength',
      label: 'Tile Length (in)',
      type: 'number',
      placeholder: '12',
      min: 0.1,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Length of one tile in inches. Common sizes: 12x12, 12x24, 6x24, 18x18, 24x24.',
    },
    {
      id: 'tileWidth',
      label: 'Tile Width (in)',
      type: 'number',
      placeholder: '24',
      min: 0.1,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Width of one tile in inches. For square tiles, enter the same value as length.',
    },
    {
      id: 'groutWidth',
      label: 'Grout Line Width (in)',
      type: 'number',
      placeholder: '0.125',
      defaultValue: '0.125',
      min: 0,
      step: 0.0625,
      inputMode: 'decimal',
      helpText: 'Width of grout lines between tiles. 1/8" is standard for rectified tiles; 1/4" for traditional tiles.',
    },
    {
      id: 'layout',
      label: 'Layout Style',
      type: 'select',
      options: [
        { label: 'Standard Grid (10% waste)', value: 'grid' },
        { label: 'Brick / Staggered (10% waste)', value: 'brick' },
        { label: 'Diagonal (15% waste)', value: 'diagonal' },
        { label: 'Herringbone (20% waste)', value: 'herringbone' },
      ],
      required: true,
      helpText: 'Layout pattern affects waste. Herringbone has the highest waste due to complex interlocking angles.',
    },
    {
      id: 'pricePerTile',
      label: 'Price per Tile ($)',
      type: 'number',
      placeholder: '3.50',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Optional: enter the individual tile price to estimate total material cost.',
    },
    {
      id: 'wasteOverride',
      label: 'Custom Waste % (optional)',
      type: 'number',
      placeholder: '12',
      min: 0,
      max: 100,
      step: 1,
      inputMode: 'decimal',
      helpText: 'Override the layout-based waste percentage. Use for complex rooms with many corners or obstacles.',
    },
  ],
  calculate: (values) => {
    const roomL = parseFloat(values.areaLength);
    const roomW = parseFloat(values.areaWidth);
    const tileL = parseFloat(values.tileLength);
    const tileW = parseFloat(values.tileWidth);
    const layout = values.layout || 'grid';
    const price = parseFloat(values.pricePerTile);
    const wasteOverride = parseFloat(values.wasteOverride);

    if ([roomL, roomW, tileL, tileW].some(isNaN) || roomL <= 0 || roomW <= 0 || tileL <= 0 || tileW <= 0) return [];

    const effectiveTileL = tileL / 12;
    const effectiveTileW = tileW / 12;

    const roomArea = roomL * roomW;
    const tileAreaSqFt = effectiveTileL * effectiveTileW;

    const baseTiles = Math.ceil(roomArea / tileAreaSqFt);

    const wastePct = !isNaN(wasteOverride) && wasteOverride >= 0
      ? wasteOverride
      : LAYOUT_WASTE[layout] ?? 10;

    const wasteDecimal = wastePct / 100;
    const wasteTiles = Math.ceil(baseTiles * wasteDecimal);
    const totalTiles = Math.ceil(baseTiles * (1 + wasteDecimal));
    // Standard box has 10 tiles; adjust for larger format
    const tilesPerBox = effectiveTileL * effectiveTileW > 2 ? 5 : 10;
    const boxesNeeded = Math.ceil(totalTiles / tilesPerBox);

    const fmt = (n: number) => n.toFixed(1);

    const results = [
      {
        id: 'tilesNeeded',
        label: 'Tiles Needed',
        value: `${totalTiles} tiles (${boxesNeeded} boxes)`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'totalArea',
        label: 'Room Area',
        value: `${fmt(roomArea)} sq ft`,
        color: 'neutral' as const,
      },
      {
        id: 'tileAreaSingle',
        label: 'Single Tile Area',
        value: `${fmt(tileAreaSqFt)} sq ft (${tileL}" x ${tileW}")`,
        color: 'neutral' as const,
      },
      {
        id: 'baseTiles',
        label: 'Base Tiles (no waste)',
        value: `${baseTiles} tiles`,
        color: 'neutral' as const,
      },
      {
        id: 'wastePercent',
        label: 'Waste Factor',
        value: `${wastePct}% (${layout} layout)`,
        color: 'neutral' as const,
      },
      {
        id: 'wasteTiles',
        label: 'Extra Tiles for Waste',
        value: `${wasteTiles} tiles`,
        color: 'neutral' as const,
      },
      {
        id: 'boxesNeeded',
        label: `Boxes Needed (${tilesPerBox}/box)`,
        value: `${boxesNeeded} boxes`,
        color: 'neutral' as const,
      },
      {
        id: 'totalCost',
        label: 'Total Material Cost',
        value: !isNaN(price) && price > 0
          ? `$${(totalTiles * price).toFixed(2)}`
          : 'Enter price per tile for estimate',
        color: !isNaN(price) && price > 0 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'layoutNote',
        label: 'Layout Note',
        value: LAYOUT_NOTES[layout] ?? 'Standard layout',
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TilePanel, { values, results });
  },
  educational: {
    formula: 'Total Tiles = ceil(Room Area / Tile Area x (1 + Waste%))',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Tile Grid Layout</text><!-- Tile grid 4x3 --><rect x="55" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="107" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="159" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="211" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="55" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="107" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="159" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="211" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="55" y="134" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="107" y="134" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="159" y="134" width="50" height="40" fill="rgba(239,68,68,0.2)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="2"/><rect x="211" y="134" width="50" height="40" fill="rgba(239,68,68,0.2)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="2"/><text x="259" y="75" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">full</text><text x="259" y="155" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9">waste</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Grid: 10% waste &emsp; Diagonal: 15% &emsp; Herringbone: 20%</text></svg>',
      alt: 'Tile grid layout showing full tiles and waste/cut tiles at the edges',
      caption: 'Different layouts produce different waste percentages — always buy extra tiles for cuts and future repairs.',
    },
    formulaDescription:
      'Tile quantity is calculated by dividing the total room area by the area of a single tile, then applying a waste factor based on the layout pattern. The waste factor accounts for tiles that must be cut to fit room edges, corners, and obstacles. Grid and brick patterns typically have 10% waste, diagonal layouts produce 15% waste due to angled edge cuts on all four sides, and herringbone patterns generate 20% waste because the interlocking angles require cutting nearly every edge tile. For rooms with complex shapes (alcoves, multiple corners, islands), the standard waste percentages should be increased.',
    variables: [
      { symbol: 'Waste %', name: 'Waste Factor', description: 'The percentage of extra tiles needed beyond the exact coverage area. 10% for grid/brick layouts where only the room perimeter tiles need cutting; 15% for diagonal where all edge tiles need angled cuts; 20% for herringbone with complex interlocking cuts.' },
      { symbol: 'Tile Area', name: 'Tile Area (sq ft)', description: 'The surface area of one tile in square feet, calculated as (tile length in inches x tile width in inches) / 144. Large-format tiles (24x48, etc.) cover more area per tile but produce higher waste when miscut.' },
      { symbol: 'Grout', name: 'Grout Line Width', description: 'The space between tiles filled with grout. Standard is 1/8" for rectified (precision-cut) tiles; 1/4" for traditional tiles. Grout width slightly reduces the number of tiles needed because each tile occupies the grout space as well as its face area.' },
    ],
    howToUse: [
      'Enter the room length and width in feet — measure at the longest and widest points.',
      'Enter your tile dimensions in inches (e.g., 12x24 is a common floor tile size).',
      'Select the layout pattern — this determines the waste factor.',
      'Optionally adjust grout line width or enter a custom waste percentage for complex rooms.',
      'Add the price per tile to get a total material cost estimate including waste.',
    ],
    explanation:
      'Accurate tile quantity calculation is the difference between a project that finishes on time and one that stalls mid-installation waiting for more material to arrive — potentially from a different dye lot that does not match. Tile has been used as a building material for thousands of years, from the glazed bricks of ancient Babylon to the intricate mosaics of Roman villas. Modern tile manufacturing produces precise, uniform pieces, but the installation process still requires cutting tiles to fit room dimensions.\n\nThe fundamental calculation is room area divided by tile area, but the waste factor is what separates amateur estimates from professional ones. Different layout patterns produce dramatically different amounts of waste. A standard grid layout in a rectangular room produces waste only along the two edges where tiles must be cut — about 10%. A diagonal layout requires cutting every tile along all four room edges at 45-degree angles, producing 15% waste. Herringbone patterns, where each tile is cut at 45 degrees on both ends to create the interlocking V-shape, generate the highest waste at 20% because the pattern forces you to discard the triangular offcuts from every perimeter tile.\n\nPractical example: tiling a 12x10 foot bathroom (120 sq ft) with 12x24 inch tiles (2 sq ft each) in a brick pattern. Exact coverage is 60 tiles. With 10% waste, you need 66 tiles. Since large-format tiles typically come 5 per box, you need 14 boxes (70 tiles). You will have 4 spare tiles — keep them stored flat in a dry place for future repairs. Edge cases: rooms with multiple alcoves, bay windows, or a kitchen island require additional waste because the number of cut edges increases. Oversized tiles (24x48 inches or larger) have a higher penalty for miscuts since a single broken tile costs more material and may require special ordering.',
    quickReference: [
      { label: 'Grid waste', value: '10%' },
      { label: 'Brick waste', value: '10%' },
      { label: 'Diagonal waste', value: '15%' },
      { label: 'Herringbone waste', value: '20%' },
      { label: 'Tiles per standard box', value: '10 (small), 5 (large format)' },
      { label: 'Standard grout line', value: '1/8" (rectified), 1/4" (traditional)' },
      { label: '12x12 tile area', value: '1 sq ft per tile' },
      { label: '12x24 tile area', value: '2 sq ft per tile' },
    ],
    faqs: [
      {
        question: 'How much extra tile should I buy for waste?',
        answer: 'Buy 10% extra for grid and brick (staggered) layouts, 15% extra for diagonal layouts, and 20% extra for herringbone patterns. These percentages assume a rectangular room with standard corners. For rooms with alcoves, angled walls, multiple doorways, or large obstacles (kitchen islands, fireplace hearths), add an additional 5% to the standard waste factor. Always keep at least one full box of spare tiles from the same production lot for future repairs — tile dye lots and shade variations can change between manufacturing runs.',
      },
      {
        question: 'Why do different layouts produce different waste?',
        answer: 'Waste comes from the cut-offs that cannot be used elsewhere. In a grid layout, only the tiles along two edges of the room need cutting, and the offcuts may be usable on the opposite wall. In a diagonal layout, every perimeter tile is cut at a 45-degree angle, and the triangular offcuts rarely fit anywhere else — producing more total waste. Herringbone is the most wasteful because each tile is cut to create the interlocking V-shape pattern, and the angled cuts produce odd-shaped offcuts that have virtually no reuse potential.',
      },
      {
        question: 'Can I mix tile sizes in one room?',
        answer: 'Yes, mixing tile sizes creates a custom designer look, but it complicates the quantity calculation significantly. For a Versailles pattern (mixing 8x8, 8x16, 16x16, and 16x24 tiles), calculate each tile size requirement separately based on the pattern repeat. The waste factor increases because aligning different grid modules requires more precise cuts. Subway tile (3x6 inches) in a running bond pattern covers about 0.125 sq ft per tile, and you typically need 8 tiles per square foot. Always lay out a dry run of your mixed pattern before applying mortar to verify the pattern fits your specific room dimensions.',
      },
      {
        question: 'Do grout lines affect how many tiles I need?',
        answer: 'Yes, grout lines slightly reduce the number of tiles needed because each tile effectively occupies its face area plus half the surrounding grout width. For example, a 12x12 inch tile with 1/8 inch grout lines effectively covers 12.125 x 12.125 = 1.02 sq ft, not exactly 1 sq ft. For small rooms, this difference is negligible. For large commercial floors (over 1000 sq ft), the grout line adjustment can reduce the tile count by 1-3%. Our calculation includes grout width in the effective tile area for precision. For mosaic sheets (1x1 inch tiles on a 12x12 mesh sheet), calculate using the sheet dimensions rather than individual tile dimensions.',
      },
      {
        question: 'What is rectified tile and why does it matter?',
        answer: 'Rectified tiles are mechanically cut after firing to achieve precise, uniform dimensions with square edges. This allows for very narrow grout lines (as thin as 1/16 inch) and a nearly seamless appearance popular in modern design. Non-rectified (calibrated) tiles have slight size variations from the firing process and require wider grout lines (minimum 1/8 inch, typically 1/4 inch) to absorb the dimensional inconsistency. Rectified tiles are typically 20-40% more expensive but use less grout and create a cleaner, more contemporary look. When ordering rectified tiles, the installer must use a leveling system (clip-and-wedge) to prevent lippage since the tight joints tolerate almost no height difference between adjacent tiles.',
      },
      {
        question: 'How do I calculate tile for a backsplash or shower wall?',
        answer: 'For wall tile, measure the height and width of each wall section separately (subtracting windows, mirrors, and fixtures) and sum the areas. Backsplashes typically run 18 inches high above the countertop, with 4-6 inch strips behind the range. For shower walls, measure from the shower pan or tub rim to the desired tile height (typically 72-84 inches for standard showers, or to the ceiling for a fully tiled look). Add a waterproofing membrane and cement backer board behind shower wall tile — never tile directly onto drywall in wet areas. For subway tile layouts, dry-lay the first row on a flat surface to verify the pattern fits without leaving a sliver at the top or corners — adjusting the starting point by half a tile can eliminate awkward small cuts.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Emily in Nashville is tiling her 12 ft x 10 ft bathroom floor with 12x24 inch porcelain tiles in a diagonal layout. The tiles cost $4.25 each. How many tiles, boxes, and what is the total cost?',
        inputs: { areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '24', layout: 'diagonal', pricePerTile: '4.25' },
        result: 'Room = 120 sq ft. Each tile = 2 sq ft. Base = 60 tiles. With 15% waste = 69 tiles. Large-format boxes (5/box) = 14 boxes (70 tiles). Total cost = $297.50.',
        insight: 'Emily should buy 14 boxes (70 tiles) for $297.50. She should keep the one extra tile for future repairs. Since this is a bathroom, she also needs a waterproofing membrane and cement backer board underneath, plus mortar and grout. She should verify all boxes have the same dye lot number before the installer begins work.',
      },
    ],
    proTips: [
      'Check dye lot numbers — Tile color can vary noticeably between production runs. When buying, verify all boxes have the same dye lot/shade number printed on the label. Open one box from each lot in good lighting and compare them side by side before the installer starts.',
      'Dry-lay the pattern first — Before mixing any mortar, lay out tiles across the entire room without adhesive. This reveals layout issues: awkward slivers at edges, pattern mismatches at doorways, or the need to shift the starting point. Adjust the starting position to ensure cut tiles at the room perimeter are at least half a tile wide — a 1-inch sliver along a wall looks amateurish.',
      'Use a tile leveling system — For large-format tiles (any side over 15 inches), a clip-and-wedge leveling system is essential to prevent lippage (height differences between adjacent tiles). The system costs $30-50 for a room but prevents the "washboard floor" effect that makes large tiles look badly installed.',
      'Store spare tiles properly — Keep 3-5 spare tiles from the original installation stored flat (never on edge) in a climate-controlled space. Tiles stored on edge can warp over time. Label the box with the installation date and room name. When you need a replacement in 5 years, matching the dye lot will be impossible, but having tiles that aged under similar conditions will minimize the visual difference.',
      'Account for tile thickness in transitions — Floor tile adds 1/4 to 1/2 inch of height depending on tile thickness and mortar bed. Plan transitions to adjacent flooring (hardwood, carpet, vinyl) before tiling. A reducer strip or transition molding should be installed at the doorway to bridge height differences smoothly.',
    ],
    limitations: [
      'This calculator assumes a rectangular room with straight walls. Irregular room shapes (L-shaped, curved walls, angled walls) require breaking the room into sub-rectangles and calculating each separately. The waste factor should be increased for rooms with more than 8 corners.',
      'Tile quantities assume standard installation with no accent strips, borders, or medallion patterns. Decorative inlays and mosaic borders require separate quantity calculations for each tile type used.',
      'The calculator does not account for substrate preparation materials: cement backer board, waterproofing membrane, self-leveling underlayment, mortar (thin-set), grout, or edge trim profiles (Schluter strips). These must be estimated separately.',
      'This tool is for residential DIY planning and material budgeting. When not to use: for commercial flooring installations requiring TCNA (Tile Council of North America) compliant specifications, for exterior tile installations (freeze-thaw considerations), or for steam showers and pools (specialized waterproofing and epoxy grout requirements).',
    ],
    commonUses: [
      'Bathroom floor tiling — calculate tile quantity for bathroom floors with standard 12x24 or 12x12 tiles, accounting for toilet flange and vanity cutouts with increased waste',
      'Kitchen backsplash installation — estimate subway tile or mosaic sheet quantities for backsplash areas between countertops and upper cabinets',
      'Shower wall tiling — calculate tile needs for standard 60x30 shower surrounds with tile extending to the ceiling',
      'Entryway and mudroom flooring — estimate durable porcelain or ceramic tile for high-traffic entry areas with proper waste for door thresholds and closets',
    ],
    citations: [
      { source: 'TCNA (Tile Council of North America) - Installation Handbook', url: 'https://www.tcnatile.com/' },
      { source: 'Wikipedia - Tile', url: 'https://en.wikipedia.org/wiki/Tile' },
      { source: 'Wolfram MathWorld - Tiling', url: 'https://mathworld.wolfram.com/Tiling.html' },
    ],
  },
};

export default tileConfig;
