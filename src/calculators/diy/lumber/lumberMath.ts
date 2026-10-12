/** Board feet = thickness (in) x width (in) x length (ft) / 12. */
export const boardFeet = (thicknessIn: number, widthIn: number, lengthFt: number) => (thicknessIn * widthIn * lengthFt) / 12;

/** Surfaced (S4S) softwood: nominal -> actual. 2x4 = 1.5 x 3.5, 2x8 = 1.5 x 7.25, 1x6 = 0.75 x 5.5. */
export function actualThickness(nominal: number): number {
  return nominal >= 2 ? nominal - 0.5 : nominal - 0.25;
}
export function actualWidth(nominal: number): number {
  return nominal >= 8 ? nominal - 0.75 : nominal >= 2 ? nominal - 0.5 : nominal - 0.25;
}

export interface Lumber {
  thickness: number;
  width: number;
  length: number;
  quantity: number;
  perBoard: number;
  totalBdFt: number;
  linearFt: number;
  actualT: number;
  actualW: number;
  actualBdFt: number;
}

/** null = incomplete or non-physical input (zero/negative size, or a nominal size too small to have an actual size). */
export function lumber(values: Record<string, string>): Lumber | null {
  const thickness = parseFloat(values.thickness);
  const width = parseFloat(values.width);
  const length = parseFloat(values.length);
  const quantity = parseFloat(values.quantity);
  if (![thickness, width, length, quantity].every(Number.isFinite) || thickness <= 0 || width <= 0 || length <= 0 || quantity <= 0) return null;
  const actualT = actualThickness(thickness);
  const actualW = actualWidth(width);
  if (!(actualT > 0) || !(actualW > 0)) return null;
  const perBoard = boardFeet(thickness, width, length);
  return {
    thickness, width, length, quantity, perBoard,
    totalBdFt: perBoard * quantity,
    linearFt: length * quantity,
    actualT, actualW,
    actualBdFt: boardFeet(actualT, actualW, length) * quantity,
  };
}
