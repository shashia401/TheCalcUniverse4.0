// Shared by diy/tile, diy/tile-flooring and math/tile.
/**
 * Tile is sold by the carton and carton coverage is SKU-specific. Retail listings for 12x24 porcelain show
 * roughly 15.5-16 sq ft per carton (e.g. Daltile 15.6, MSI 16, Corso Italia 15.5), so 15.5 is the default.
 */
export const DEFAULT_SQFT_PER_BOX = 15.5;
export const DEFAULT_GROUT_IN = 0.125;

export const LAYOUT_WASTE: Record<string, number> = { grid: 10, brick: 10, diagonal: 15, herringbone: 20 };

export interface TileEstimate {
  roomSqFt: number;
  /** Area of one tile plus its share of grout joint (the "pitch" cell). */
  cellSqFt: number;
  tileSqFt: number;
  baseTiles: number;
  wastePct: number;
  wasteTiles: number;
  totalTiles: number;
  tilesPerBox: number;
  boxes: number;
  /** Square feet you actually buy (boxes x coverage). */
  boxedSqFt: number;
}

const ceil = (n: number) => Math.ceil(+n.toFixed(9));

export function tileEstimate(opts: {
  roomLengthFt: number;
  roomWidthFt: number;
  tileLengthIn: number;
  tileWidthIn: number;
  groutIn?: number;
  wastePct: number;
  sqFtPerBox?: number;
}): TileEstimate {
  const grout = opts.groutIn && opts.groutIn > 0 ? opts.groutIn : 0;
  const sqFtPerBox = opts.sqFtPerBox && opts.sqFtPerBox > 0 ? opts.sqFtPerBox : DEFAULT_SQFT_PER_BOX;
  const roomSqFt = opts.roomLengthFt * opts.roomWidthFt;
  const tileSqFt = (opts.tileLengthIn * opts.tileWidthIn) / 144;
  const cellSqFt = ((opts.tileLengthIn + grout) * (opts.tileWidthIn + grout)) / 144;
  const baseTiles = ceil(roomSqFt / cellSqFt);
  const wasteTiles = ceil(baseTiles * (opts.wastePct / 100));
  const totalTiles = ceil(baseTiles * (1 + opts.wastePct / 100));
  const tilesPerBox = Math.max(1, Math.round(sqFtPerBox / tileSqFt));
  const boxes = ceil(totalTiles / tilesPerBox);
  return { roomSqFt, cellSqFt, tileSqFt, baseTiles, wastePct: opts.wastePct, wasteTiles, totalTiles, tilesPerBox, boxes, boxedSqFt: boxes * tilesPerBox * tileSqFt };
}
