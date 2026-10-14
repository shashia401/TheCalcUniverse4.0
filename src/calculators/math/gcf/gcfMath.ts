import { factorize, gcdNum } from '../../../utils/numberTheory';

export type Factorization = [number, number][];

export interface GcfAnalysis {
  a: number;
  b: number;
  gcf: number;
  /** "36 = 24 × 1 + 12" ... exact (BigInt quotients; a double loses the .5 above 2^52). */
  euclidSteps: string[];
  factorsA: Factorization;
  factorsB: Factorization;
  /** prime^min(exponent) pairs; their product is the GCF. */
  shared: Factorization;
  /** What is left of each number after dividing out the GCF (the non-overlapping parts of the Venn diagram). */
  leftoverA: Factorization;
  leftoverB: Factorization;
}

/** Everything the calculator and its panel show, from one exact computation (a, b safe positive integers). */
export function analyzeGcf(a: number, b: number): GcfAnalysis {
  const gcf = gcdNum(a, b);
  const euclidSteps: string[] = [];
  let x = BigInt(Math.max(a, b));
  let y = BigInt(Math.min(a, b));
  while (y) {
    euclidSteps.push(`${x} = ${y} × ${x / y} + ${x % y}`);
    [x, y] = [y, x % y];
  }
  euclidSteps.push(`GCF(${a}, ${b}) = ${x}`);

  const factorsA = factorize(a);
  const factorsB = factorize(b);
  const inB = new Map(factorsB);
  const shared: Factorization = [];
  for (const [p, e] of factorsA) {
    const eb = inB.get(p);
    if (eb) shared.push([p, Math.min(e, eb)]);
  }
  return { a, b, gcf, euclidSteps, factorsA, factorsB, shared, leftoverA: factorize(a / gcf), leftoverB: factorize(b / gcf) };
}

export const fmtFactors = (f: Factorization, sep = ' × '): string => f.map(([p, e]) => (e === 1 ? `${p}` : `${p}^${e}`)).join(sep);
