import { divisorsOf, gcdNum } from '../../../utils/numberTheory';

/** Everything the calculator and its panel show, from one exact computation (a, b safe positive integers). */
export function analyzeCommonFactors(a: number, b: number) {
  const gcf = gcdNum(a, b);
  const factorsA = divisorsOf(a);
  const factorsB = divisorsOf(b);
  const common = divisorsOf(gcf); // the common factors of a and b are exactly the divisors of gcd(a, b)
  const lcm = (BigInt(a) / BigInt(gcf)) * BigInt(b);
  return { gcf, factorsA, factorsB, common, lcm };
}
