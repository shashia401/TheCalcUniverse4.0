/**
 * Ohm's-law solver shared by engineering/ohms-law (index + panel) and math/ohms-law (twin).
 * Given any two of V, I, R, P (all >= 0), returns all four. Returns null when the pair cannot determine the others
 * (a division by zero, e.g. V and I with I = 0 leaves R undefined).
 *   V = I R,  P = V I = I^2 R = V^2 / R
 */
export type VarName = 'V' | 'I' | 'R' | 'P';

export interface OhmSolved {
  V: number;
  I: number;
  R: number;
  P: number;
}

export function solvePair(a: VarName, va: number, b: VarName, vb: number): OhmSolved | null {
  if (!Number.isFinite(va) || !Number.isFinite(vb) || va < 0 || vb < 0) return null;
  const key = [a, b].sort().join('') as 'IV' | 'RV' | 'PV' | 'IR' | 'IP' | 'PR';
  const get = (n: VarName) => (n === a ? va : vb);
  let out: OhmSolved;
  switch (key) {
    case 'IV': { const V = get('V'), I = get('I'); out = { V, I, R: V / I, P: V * I }; break; }
    case 'RV': { const V = get('V'), R = get('R'); out = { V, I: V / R, R, P: (V * V) / R }; break; }
    case 'PV': { const V = get('V'), P = get('P'); out = { V, I: P / V, R: (V * V) / P, P }; break; }
    case 'IR': { const I = get('I'), R = get('R'); out = { V: I * R, I, R, P: I * I * R }; break; }
    case 'IP': { const I = get('I'), P = get('P'); out = { V: P / I, I, R: P / (I * I), P }; break; }
    case 'PR': { const P = get('P'), R = get('R'); out = { V: Math.sqrt(P * R), I: Math.sqrt(P / R), R, P }; break; }
    default:
      return null; // same variable twice
  }
  return Object.values(out).every(Number.isFinite) ? out : null;
}
