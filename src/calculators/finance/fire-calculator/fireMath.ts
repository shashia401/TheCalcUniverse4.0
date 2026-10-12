// Pure FIRE math shared by index.ts and FIREPanel.tsx (the panel used to re-parse formatted
// result strings such as "$1.20M" as 1.2, which broke its chart and progress bar).

export const COAST_RETIREMENT_AGE = 65;
/** Fat FIRE adds a 1.5x spending cushion to the entered expenses (a planning convention, not a standard). */
export const FAT_FIRE_MULTIPLIER = 1.5;
export const MAX_YEARS = 100;

export interface FireInputs {
  currentAge: number;
  netWorth: number;
  /** Annual take-home income (after tax) */
  income: number;
  expenses: number;
  /** Optional: percent of income saved. When given it drives annual savings instead of income - expenses. */
  savingsRatePct?: number;
  /** Real (inflation-adjusted) annual return, percent */
  returnPct: number;
  withdrawalPct: number;
  fireType: string;
}

/** Returns null when required inputs are missing or invalid. */
export function parseFireInputs(values: Record<string, string>): FireInputs | null {
  const currentAge = parseFloat(values.currentAge);
  const netWorth = parseFloat(values.currentNetWorth);
  const income = parseFloat(values.annualIncome);
  const expenses = parseFloat(values.annualExpenses);
  if (isNaN(currentAge) || isNaN(netWorth) || isNaN(income) || isNaN(expenses)) return null;
  if (currentAge < 0 || netWorth < 0 || income <= 0 || expenses < 0) return null;

  const returnRaw = parseFloat(values.investmentReturn);
  const withdrawalRaw = parseFloat(values.targetWithdrawalRate);
  const rateRaw = parseFloat(values.currentSavingsRate);
  return {
    currentAge,
    netWorth,
    income,
    expenses,
    savingsRatePct: !isNaN(rateRaw) && rateRaw > 0 ? Math.min(100, rateRaw) : undefined,
    returnPct: isNaN(returnRaw) ? 7 : returnRaw, // 0% is a valid return
    withdrawalPct: !isNaN(withdrawalRaw) && withdrawalRaw > 0 ? withdrawalRaw : 4,
    fireType: values.fireType || 'standard',
  };
}

/**
 * Year-by-year balance with contributions at the end of each year:
 *   B(t) = B(t-1) x (1 + r) + savings.
 * Stops the first year the balance reaches the target. `reached` is false when it never does.
 */
export function projectToTarget(netWorth: number, annualSavings: number, target: number, returnPct: number) {
  const r = returnPct / 100;
  const balances = [netWorth];
  let b = netWorth;
  let years = 0;
  while (b < target && years < MAX_YEARS) {
    const next = b * (1 + r) + annualSavings;
    if (!(next > b)) break; // not growing: will never get there
    b = next;
    years++;
    balances.push(b);
  }
  return { years, balances, reached: b >= target };
}

export function computeFire(i: FireInputs) {
  const wr = i.withdrawalPct / 100;
  const r0 = i.returnPct / 100;

  const annualSavings = Math.max(
    0,
    i.savingsRatePct !== undefined ? (i.income * i.savingsRatePct) / 100 : i.income - i.expenses,
  );
  const savingsRate = Math.min(100, (annualSavings / i.income) * 100);

  const baseNumber = i.expenses / wr;
  const fireNumber = i.fireType === 'fat' ? baseNumber * FAT_FIRE_MULTIPLIER : baseNumber;

  let coastFireNumber: number | null = null;
  if (i.fireType === 'coast') {
    const yearsToRetirement = Math.max(0, COAST_RETIREMENT_AGE - i.currentAge);
    coastFireNumber = fireNumber / Math.pow(1 + r0, yearsToRetirement);
  }
  // Coast FIRE: years of contributions until net worth alone can compound to the FIRE number by 65.
  const target = coastFireNumber ?? fireNumber;
  const proj = projectToTarget(i.netWorth, annualSavings, target, i.returnPct);
  const achievable = proj.reached;
  const yearsToFire = achievable ? proj.years : Infinity;

  return {
    annualSavings,
    savingsRate,
    fireNumber,
    coastFireNumber,
    target,
    yearsToFire,
    fireAge: i.currentAge + (achievable ? proj.years : 0),
    achievable,
    monthlySavings: annualSavings / 12,
    nwAtRetirement: achievable ? proj.balances[proj.balances.length - 1] : i.netWorth,
    totalContributions: i.netWorth + (achievable ? annualSavings * proj.years : 0),
    balances: proj.balances,
  };
}
