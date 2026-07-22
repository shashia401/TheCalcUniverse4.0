export interface HELOCData {
  homeValue: number;
  mortgageBalance: number;
  maxLTV: number;
  maxBorrowable: number;
  totalEquity: number;
  tapableEquity: number;
  requiredCushion: number;
  currentLTV: number;
  helocRate: number;
  actualDraw: number;
  drawAmount: number;
  monthlyInterestOnDraw: number;
  monthlyInterestOnMax: number;
}

export function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
