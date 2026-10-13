// Oven temperature / UK gas mark table shared by everyday/oven-temperature-converter and
// industrial/oven-temperature-converter so the two can never disagree.
// Source: the conventional table reproduced by Wikipedia ("Gas mark") and UK cookery guides; Celsius values are the
// rounded kitchen figures, not an exact conversion of the Fahrenheit column (e.g. 350 F = 176.7 C is listed as 180 C).

export interface GasMarkRow {
  mark: number;
  fahrenheit: number;
  celsius: number;
  description: string;
}

export const GAS_MARK_TABLE: GasMarkRow[] = [
  { mark: 0.25, fahrenheit: 225, celsius: 110, description: 'Very Slow / Cool' },
  { mark: 0.5, fahrenheit: 250, celsius: 120, description: 'Very Slow / Cool' },
  { mark: 1, fahrenheit: 275, celsius: 140, description: 'Slow / Cool' },
  { mark: 2, fahrenheit: 300, celsius: 150, description: 'Slow' },
  { mark: 3, fahrenheit: 325, celsius: 170, description: 'Moderately Slow / Warm' },
  { mark: 4, fahrenheit: 350, celsius: 180, description: 'Moderate / Medium' },
  { mark: 5, fahrenheit: 375, celsius: 190, description: 'Moderate / Moderately Hot' },
  { mark: 6, fahrenheit: 400, celsius: 200, description: 'Moderately Hot' },
  { mark: 7, fahrenheit: 425, celsius: 220, description: 'Hot' },
  { mark: 8, fahrenheit: 450, celsius: 230, description: 'Hot / Very Hot' },
  { mark: 9, fahrenheit: 475, celsius: 240, description: 'Very Hot' },
  { mark: 10, fahrenheit: 500, celsius: 260, description: 'Extremely Hot' },
];

export const MIN_GAS_MARK = GAS_MARK_TABLE[0].mark;
export const MAX_GAS_MARK = GAS_MARK_TABLE[GAS_MARK_TABLE.length - 1].mark;

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;

/** Nearest table row by Celsius (a tie goes to the cooler mark); null when more than 10 C outside the table's range. */
export function closestGasMark(celsius: number): GasMarkRow | null {
  const first = GAS_MARK_TABLE[0];
  const last = GAS_MARK_TABLE[GAS_MARK_TABLE.length - 1];
  if (celsius < first.celsius - 10 || celsius > last.celsius + 10) return null;
  let best = first;
  for (const row of GAS_MARK_TABLE) if (Math.abs(celsius - row.celsius) < Math.abs(celsius - best.celsius)) best = row;
  return best;
}

/** Temperatures for a gas mark: exact table row, or linear interpolation between neighbours; null outside 1/4..10. */
export function gasMarkToTemps(mark: number): { fahrenheit: number; celsius: number; description: string; exact: boolean } | null {
  if (!(mark >= MIN_GAS_MARK && mark <= MAX_GAS_MARK)) return null;
  const exact = GAS_MARK_TABLE.find((r) => r.mark === mark);
  if (exact) return { fahrenheit: exact.fahrenheit, celsius: exact.celsius, description: exact.description, exact: true };
  for (let i = 0; i < GAS_MARK_TABLE.length - 1; i++) {
    const lo = GAS_MARK_TABLE[i];
    const hi = GAS_MARK_TABLE[i + 1];
    if (mark > lo.mark && mark < hi.mark) {
      const t = (mark - lo.mark) / (hi.mark - lo.mark);
      return {
        fahrenheit: Math.round(lo.fahrenheit + t * (hi.fahrenheit - lo.fahrenheit)),
        celsius: Math.round(lo.celsius + t * (hi.celsius - lo.celsius)),
        description: lo.description,
        exact: false,
      };
    }
  }
  return null;
}
