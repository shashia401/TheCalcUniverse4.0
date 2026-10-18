// "Am I saving enough to retire?" — one set of inputs, linked answers. Pure functions only, so the server renders
// the same numbers the browser recomputes. Compound-growth and annuity helpers are the shared ones in
// src/utils/financial.ts (the same fvWithContributions the retirement calculator uses).
//
// Everything is in REAL (inflation-adjusted) terms, i.e. today's dollars. The page states this plainly:
//   real return      = (1 + nominal) / (1 + inflation) - 1, per phase (saving, retired)
//   monthly rate     = (1 + real return)^(1/12) - 1          (the annual rate is an effective annual rate)
//   contributions    = flat in today's dollars: the same real amount is added at the END of every month
//                      (so in nominal terms they rise with inflation; the retirement calculator keeps them flat)
//   balance at retirement = savings x (1+m)^n + monthly x ((1+m)^n - 1) / m,  n = months from now to retirement
//   net need         = spend - benefit  (benefit = Social Security or pension, today's dollars, starts at retirement
//                      and is assumed to keep pace with inflation); spend is before tax and is withdrawn monthly
//   nest egg needed  = present value of a level real annuity-due: (net need / 12) at the START of each month from
//                      retirement to the plan age, discounted at the real retirement rate
//   4% rule          = net need / 0.04, shown only as a rule-of-thumb cross-check (it is built for ~30 years)
//   extra saving     = shortfall / ((1+m)^n - 1) / m   (exact: the added contributions grow at the same real rate)
//   runs out         = the first month the balance cannot cover a full withdrawal, month-by-month
//
// Verdict (guidelines, not predictions): funded ratio = balance at retirement / nest egg needed.
//   comfortable at 100% or more, tight from 75% up to 100%, over (not on track) below 75%.
// Not modelled: taxes, fees, market sequence risk, healthcare shocks, changing spending, benefits that start later.
import { fvWithContributions } from '../utils/financial';

export interface RetirementInputs {
  age: number; // current age, whole years
  retireAge: number; // age you stop working, whole years
  lifeAge: number; // plan to this age, whole years
  savings: number; // current retirement savings, $
  monthly: number; // contribution per month now, $ (today's dollars)
  returnPct: number; // nominal annual return while saving, percent
  retireReturnPct: number; // nominal annual return in retirement, percent
  inflationPct: number; // annual inflation, percent
  spend: number; // desired spending per year in retirement, today's dollars, before tax
  benefit: number; // Social Security or pension per year, today's dollars (0 allowed)
}

/** Example scenario shown before the visitor types anything. The returns are example inputs, not forecasts. */
export const RETIREMENT_DEFAULTS: RetirementInputs = {
  age: 35,
  retireAge: 67,
  lifeAge: 95,
  savings: 60000,
  monthly: 800,
  returnPct: 6.5,
  retireReturnPct: 4.5,
  inflationPct: 2.5,
  spend: 70000,
  benefit: 24000,
};

/** Guideline numbers the page states out loud. */
export const RETIREMENT_ASSUMPTIONS = {
  comfortablePct: 100, // funded ratio at or above this: comfortable
  tightPct: 75, // funded ratio from here up to 100: tight; below: over
  ruleOfThumbPct: 4, // the "4% rule" cross-check
} as const;

export type Verdict = 'comfortable' | 'tight' | 'over';

export interface RetirementDecision {
  valid: boolean;
  inputs: RetirementInputs;
  yearsToRetire: number;
  yearsInRetirement: number;
  realSaveReturnPct: number; // real return while saving, percent
  realRetireReturnPct: number; // real return in retirement, percent
  // 1. what you will have
  projected: number; // balance at retirement, today's dollars
  contributed: number; // savings + monthly x months (today's dollars, no growth)
  // 2. what you need
  netNeed: number; // max(0, spend - benefit)
  needed: number; // nest egg that funds netNeed from retirement to lifeAge
  ruleOfThumb: number; // netNeed / 4%
  // 3. the gap and the fix
  gap: number; // projected - needed (negative = shortfall)
  shortfall: number; // max(0, needed - projected)
  surplus: number; // max(0, projected - needed)
  extraMonthly: number; // extra $ a month (today's dollars) that closes the shortfall, 0 if none
  fundedPct: number; // projected / needed x 100 (Infinity when nothing is needed)
  // 4. how long it lasts
  runOutAge: number | null; // age the money runs out at the planned spending; null = lasts to lifeAge
  sustainableSpend: number; // yearly spending (incl. benefit) the projected balance can carry to lifeAge
  verdict: Verdict;
  reasons: string[];
}

const finite = (n: number) => Number.isFinite(n);
const EPS = 1e-9;
const MONTHLY = (annualRate: number) => Math.pow(1 + annualRate, 1 / 12) - 1;

export const fmtMoney = (n: number): string =>
  `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

export function validateRetirement(i: RetirementInputs): boolean {
  return (
    Object.values(i).every(finite) &&
    [i.age, i.retireAge, i.lifeAge].every(Number.isInteger) &&
    i.age >= 16 && i.age <= 90 &&
    i.retireAge > i.age && i.retireAge <= 100 &&
    i.lifeAge > i.retireAge && i.lifeAge <= 110 &&
    i.savings >= 0 && i.savings <= 1e9 &&
    i.monthly >= 0 && i.monthly <= 1e7 &&
    i.spend > 0 && i.spend <= 1e8 &&
    i.benefit >= 0 && i.benefit <= 1e8 &&
    i.returnPct >= -5 && i.returnPct <= 15 &&
    i.retireReturnPct >= -5 && i.retireReturnPct <= 15 &&
    i.inflationPct >= 0 && i.inflationPct <= 15
  );
}

/** Future-value factor of $1 added at the end of each month for n months at monthly rate m. */
const fvFactor = (m: number, n: number) => fvWithContributions(0, 1, m, n);

/** Present value, at retirement, of $1 withdrawn at the START of each of L months at monthly rate m (annuity due). */
function pvDueFactor(m: number, L: number): number {
  if (Math.abs(m) < 1e-10) return L;
  return ((1 - Math.pow(1 + m, -L)) / m) * (1 + m);
}

export function evaluateRetirement(i: RetirementInputs): RetirementDecision {
  const A = RETIREMENT_ASSUMPTIONS;
  const n = (i.retireAge - i.age) * 12;
  const L = (i.lifeAge - i.retireAge) * 12;
  const realSave = (1 + i.returnPct / 100) / (1 + i.inflationPct / 100) - 1;
  const realRetire = (1 + i.retireReturnPct / 100) / (1 + i.inflationPct / 100) - 1;
  const mSave = MONTHLY(realSave);
  const mRet = MONTHLY(realRetire);

  const projected = fvWithContributions(i.savings, i.monthly, mSave, n);
  const contributed = i.savings + i.monthly * n;

  const netNeed = Math.max(0, i.spend - i.benefit);
  const w = netNeed / 12;
  const factor = pvDueFactor(mRet, L);
  const needed = (netNeed * factor) / 12;
  const ruleOfThumb = (netNeed * 100) / A.ruleOfThumbPct;

  const gap = projected - needed;
  const fundedPct = needed > 0 ? (projected / needed) * 100 : Infinity;
  const funded = fundedPct >= A.comfortablePct - EPS;
  const shortfall = funded ? 0 : needed - projected;
  const surplus = Math.max(0, gap);
  const extraMonthly = shortfall > 0 ? shortfall / fvFactor(mSave, n) : 0;

  // How long the money lasts, month by month: withdraw at the start of the month, then grow.
  let runOutAge: number | null = null;
  if (!funded) {
    let balance = projected;
    let months = 0;
    while (months < L && balance >= w * (1 - EPS)) {
      balance = (balance - w) * (1 + mRet);
      months++;
    }
    if (months < L) runOutAge = i.retireAge + months / 12;
  }
  const sustainableSpend = i.benefit + (12 * projected) / factor;

  const verdict: Verdict = fundedPct >= A.comfortablePct - EPS ? 'comfortable' : fundedPct >= A.tightPct - EPS ? 'tight' : 'over';

  const reasons: string[] = [];
  if (netNeed === 0) {
    reasons.push(`Your ${fmtMoney(i.benefit)} a year of Social Security or pension covers the ${fmtMoney(i.spend)} a year you plan to spend, so no savings are needed to fund it.`);
  } else if (verdict === 'comfortable') {
    reasons.push(`You are projected to have ${fmtMoney(projected)} at ${i.retireAge}, ${fmtMoney(surplus)} more than the ${fmtMoney(needed)} this plan needs (${fundedPct.toFixed(1)}% funded).`);
  } else {
    reasons.push(`You are projected to have ${fmtMoney(projected)} at ${i.retireAge}, ${fmtMoney(shortfall)} short of the ${fmtMoney(needed)} this plan needs (${fundedPct.toFixed(1)}% funded).`);
    if (runOutAge !== null) reasons.push(`At ${fmtMoney(i.spend)} a year the money would run out around age ${runOutAge.toFixed(1)}, not ${i.lifeAge}.`);
    reasons.push(`Saving about ${fmtMoney(extraMonthly)} more a month would close the gap, or the same balance would carry about ${fmtMoney(sustainableSpend)} a year to ${i.lifeAge}.`);
  }

  return {
    valid: validateRetirement(i),
    inputs: i,
    yearsToRetire: i.retireAge - i.age,
    yearsInRetirement: i.lifeAge - i.retireAge,
    realSaveReturnPct: realSave * 100,
    realRetireReturnPct: realRetire * 100,
    projected,
    contributed,
    netNeed,
    needed,
    ruleOfThumb,
    gap,
    shortfall,
    surplus,
    extraMonthly,
    fundedPct,
    runOutAge,
    sustainableSpend,
    verdict,
    reasons,
  };
}

// ---- shareable link: every input in the query string -------------------------------------------

const KEYS: Record<keyof RetirementInputs, string> = {
  age: 'age', retireAge: 'retire', lifeAge: 'life', savings: 'saved', monthly: 'monthly',
  returnPct: 'ret', retireReturnPct: 'rret', inflationPct: 'infl', spend: 'spend', benefit: 'benefit',
};

/** Only keys this tool owns are read; values are capped at 12 characters and must be plain numbers. */
export function inputsFromQuery(search: string): RetirementInputs {
  const params = new URLSearchParams(search);
  const out: RetirementInputs = { ...RETIREMENT_DEFAULTS };
  for (const field of Object.keys(KEYS) as (keyof RetirementInputs)[]) {
    const raw = params.get(KEYS[field]);
    if (raw === null || raw.length > 12) continue;
    const n = Number(raw.replace(/,/g, ''));
    if (raw.trim() !== '' && Number.isFinite(n)) out[field] = n;
  }
  return out;
}

export function queryFromInputs(i: RetirementInputs): string {
  const params = new URLSearchParams();
  for (const field of Object.keys(KEYS) as (keyof RetirementInputs)[]) params.set(KEYS[field], String(i[field]));
  return params.toString();
}
