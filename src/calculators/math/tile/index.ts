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
  grid: 'Standard grid is the most efficient layout',
  brick: 'Brick pattern requires more edge cuts than grid',
  diagonal: 'Diagonal requires more complex edge cuts',
  herringbone: 'Herringbone has the highest waste due to complex angles',
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
    },
    {
      id: 'areaWidth',
      label: 'Room Width (ft)',
      type: 'number',
      placeholder: '10',
      min: 0.1,
      step: 0.25,
      required: true,
    },
    {
      id: 'tileLength',
      label: 'Tile Length (in)',
      type: 'number',
      placeholder: 'e.g., 12',
      min: 0.1,
      step: 0.5,
      required: true,
    },
    {
      id: 'tileWidth',
      label: 'Tile Width (in)',
      type: 'number',
      placeholder: 'e.g., 24',
      min: 0.1,
      step: 0.5,
      required: true,
    },
    {
      id: 'groutWidth',
      label: 'Grout Line Width (in)',
      type: 'number',
      placeholder: '0.125',
      defaultValue: '0.125',
      min: 0,
      step: 0.0625,
    },
    {
      id: 'layout',
      label: 'Layout Style',
      type: 'select',
      options: [
        { label: 'Standard Grid', value: 'grid' },
        { label: 'Brick / Staggered', value: 'brick' },
        { label: 'Diagonal', value: 'diagonal' },
        { label: 'Herringbone', value: 'herringbone' },
      ],
      required: true,
    },
    {
      id: 'pricePerTile',
      label: 'Price per Tile ($)',
      type: 'number',
      placeholder: '3.50',
      min: 0,
      step: 0.01,
      helpText: 'Optional: for cost estimate',
    },
    {
      id: 'wasteOverride',
      label: 'Custom Waste % (optional)',
      type: 'number',
      placeholder: 'e.g., 12',
      min: 0,
      max: 100,
      step: 1,
      helpText: 'Overrides layout-based waste',
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
    const boxesNeeded = Math.ceil(totalTiles / 10);

    const fmt = (n: number) => n.toFixed(1);

    const results = [
      {
        id: 'tilesNeeded',
        label: 'Tiles Needed',
        value: `${totalTiles} tiles`,
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
        id: 'boxesNeeded',
        label: 'Boxes (10/box)',
        value: `${boxesNeeded} boxes`,
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
        id: 'totalCost',
        label: 'Total Cost',
        value: !isNaN(price) && price > 0
          ? `$${(totalTiles * price).toFixed(2)}`
          : 'Enter price per tile',
        color: 'neutral' as const,
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
    formula: 'Total Tiles = ceil(Room Area / Tile Area x (1 + Waste %))',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Tile Grid Layout</text><!-- Tile grid 4x3 --><rect x="55" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="107" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="159" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="211" y="50" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="55" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="107" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="159" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="211" y="92" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="55" y="134" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="107" y="134" width="50" height="40" fill="rgba(59,130,246,0.2)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="2"/><rect x="159" y="134" width="50" height="40" fill="rgba(239,68,68,0.2)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="2"/><rect x="211" y="134" width="50" height="40" fill="rgba(239,68,68,0.2)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="2"/><text x="259" y="75" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">full</text><text x="259" y="155" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9">waste</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Grid: 10% waste &emsp; Diagonal: 15% &emsp; Herringbone: 20%</text></svg>',
      alt: 'Tile grid layout showing full tiles and waste/cut tiles at the edges',
      caption: 'Different layouts produce different waste percentages — always buy extra',
    },
    formulaDescription:
      'Tile quantity is calculated from room dimensions, tile size, and expected waste from the chosen layout pattern.',
    variables: [
      { symbol: 'Waste %', name: 'Waste Factor', description: '10% for grid/brick, 15% for diagonal, 20% for herringbone.' },
      { symbol: 'Tile Area', name: 'Tile Area (sq ft)', description: '(Tile Length in x Tile Width in) / 144' },
    ],
    howToUse: [
      'Enter the room length and width in feet.',
      'Enter your tile dimensions in inches.',
      'Choose the layout pattern.',
      'Optionally override the waste percentage.',
      'Add price per tile for cost estimate.',
    ],
    explanation:
      'Calculating tile quantities correctly is essential for any tiling project. Different layout patterns produce different amounts of waste due to edge cuts. Grid layouts are most efficient while herringbone produces the most waste. Always buy extra tiles and keep spares for future repairs. Practical example: tiling a 12x10 foot room (120 sq ft) with 12x24 inch tiles laid in a brick pattern. Each tile covers 2 sq ft, so you need at least 60 tiles. With the brick pattern 10% waste factor, you actually need 66 tiles, which means 7 boxes (assuming 10 tiles per box). Edge cases: rooms with alcoves, bay windows, or multiple corners require additional waste because more complex cuts are needed. For large-format tiles (oversized 24x48 inches), waste can be higher because a miscut costs more material. When tiling over radiant heating systems, use flexible thin-set mortar and account for expansion gaps — the tile layout may need slight adjustments around thermostat sensors. Always order an extra box beyond the calculated amount and store it in case of future breakage or if the tile line is discontinued.',
    faqs: [
      {
        question: 'How much extra tile should I buy?',
        answer: 'Buy 10-20% extra depending on your layout pattern. Grid = 10%, Diagonal = 15%, Herringbone = 20%. Keep at least a few extra tiles for future repairs.',
      },
      {
        question: 'Why do I need extra tiles?',
        answer: 'Tiles must be cut to fit edges, corners, and obstacles. Some break during cutting. Having extra ensures you can complete the job and match dye lots later.',
      },
      {
        question: 'Can I mix tile sizes in one room?',
        answer: 'Yes, mixing tile sizes creates a custom look, but it complicates the layout calculation. For a pattern mixing 12x12 and 6x6 tiles, calculate the area for each size separately. The waste factor increases because aligning different grid patterns requires more cuts. Subway tile layouts differ from squares: a 3x6 subway tile laid in a running bond pattern has a different coverage area per tile than a grid layout. Always lay out a dry run of tiles before applying mortar to verify the pattern works with your room dimensions. For diagonal layouts of mixed tiles, consider ordering 5-10% extra beyond the standard waste factor because angled cuts produce more waste than straight cuts.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Tile', url: 'https://en.wikipedia.org/wiki/Tile' },
      { source: 'Wolfram MathWorld', title: 'Tiling', url: 'https://mathworld.wolfram.com/Tiling.html' },
    ],
  },
};

export default tileConfig;
