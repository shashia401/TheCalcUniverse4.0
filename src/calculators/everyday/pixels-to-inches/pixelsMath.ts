// Pure pixel -> print-size maths shared by index.ts and the panel (the panel must not parse result strings).

export interface PixelInfo {
  pixels: number;
  pixelsB: number | null;
  dpi: number;
  inches: number;
  cm: number;
  mm: number;
  inchesB: number | null;
  cmB: number | null;
  /** megapixels of the whole image: pixels x pixelsB, or pixels^2 when only one side is given (square assumption) */
  megapixels: number;
  squareAssumed: boolean;
}

export function pixelInfo(values: Record<string, string>): PixelInfo | null {
  const pixels = parseFloat(values.pixels);
  const dpi = values.dpi === 'custom' ? parseFloat(values.customDpi) : parseFloat(values.dpi);
  if (!Number.isFinite(pixels) || pixels <= 0 || !Number.isFinite(dpi) || dpi <= 0) return null;
  const b = values.pixelsB?.trim() ? parseFloat(values.pixelsB) : NaN;
  const pixelsB = Number.isFinite(b) && b > 0 ? b : null;
  const inches = pixels / dpi;
  const inchesB = pixelsB === null ? null : pixelsB / dpi;
  return {
    pixels,
    pixelsB,
    dpi,
    inches,
    cm: inches * 2.54,
    mm: inches * 25.4,
    inchesB,
    cmB: inchesB === null ? null : inchesB * 2.54,
    megapixels: (pixels * (pixelsB ?? pixels)) / 1_000_000,
    squareAssumed: pixelsB === null,
  };
}
