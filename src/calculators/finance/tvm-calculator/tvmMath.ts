import Decimal from 'decimal.js';

/** TVM engine (Excel/HP-12C sign convention: money you pay out is negative). Shared by index.ts and TVMPanel. */
export function tvmFV(pv: number, pmt: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(pv + pmt * n);
  const D = new Decimal(1).plus(r).pow(n);
  const annuityFactor = due
    ? D.minus(1).div(r).times(new Decimal(1).plus(r))
    : D.minus(1).div(r);
  return -(new Decimal(pv).times(D).plus(new Decimal(pmt).times(annuityFactor))).toNumber();
}

export function tvmPV(fv: number, pmt: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(fv + pmt * n);
  const D = new Decimal(1).plus(r).pow(n);
  const annuityFactor = due
    ? new Decimal(1).minus(new Decimal(1).div(D)).div(r).times(new Decimal(1).plus(r))
    : new Decimal(1).minus(new Decimal(1).div(D)).div(r);
  return -(new Decimal(fv).div(D).plus(new Decimal(pmt).times(annuityFactor))).toNumber();
}

export function tvmPMT(pv: number, fv: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(pv + fv) / n;
  const D = new Decimal(1).plus(r).pow(n);
  const dueMult = due ? new Decimal(1).div(new Decimal(1).plus(r)) : new Decimal(1);
  return -(new Decimal(pv).times(D).plus(fv))
    .div(D.minus(1).div(r))
    .times(dueMult)
    .toNumber();
}

export function tvmN(pv: number, fv: number, pmt: number, r: number, due: boolean): number {
  if (r === 0) {
    if (pmt === 0) return 0;
    return -(pv + fv) / pmt;
  }
  const dueMult = due ? new Decimal(1).plus(r) : new Decimal(1);
  const num = new Decimal(-fv).times(r).plus(new Decimal(pmt).times(dueMult));
  const den = new Decimal(pv).times(r).plus(new Decimal(pmt).times(dueMult));
  if (den.eq(0) || num.div(den).lte(0)) return NaN;
  return Decimal.ln(num.div(den)).div(Decimal.ln(new Decimal(1).plus(r))).toNumber();
}

export function tvmRate(pv: number, fv: number, pmt: number, n: number, due: boolean): number {
  if (n === 0) return 0;
  const scale = Math.max(1, Math.abs(fv), Math.abs(pv), Math.abs(pmt * n));
  // Newton-Raphson from several starting guesses; accept only a root that actually reproduces the target FV.
  for (const guess of [0.1, 0.01, 0.001, 0.5]) {
    let rate = guess;
    for (let i = 0; i < 200; i++) {
      const fvCalc = tvmFV(pv, pmt, rate, n, due);
      const delta = 1e-6;
      const deriv = (tvmFV(pv, pmt, rate + delta, n, due) - fvCalc) / delta;
      if (!isFinite(deriv) || Math.abs(deriv) < 1e-15) break;
      const next = Math.max(-0.9999, rate - (fvCalc - fv) / deriv);
      if (Math.abs(next - rate) < 1e-12) { rate = next; break; }
      rate = next;
    }
    if (isFinite(rate) && Math.abs(tvmFV(pv, pmt, rate, n, due) - fv) <= 1e-6 * scale) return rate;
  }
  return NaN;
}
