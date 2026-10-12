// Pure helpers shared by index.ts and DebtConsolidationPanel.tsx (single source of truth).

export interface Debt {
  name: string;
  balance: number;
  rate: number; // APR, percent
  payment: number; // monthly
}

/** Parse the JSON array written by DebtInputs. Rows without a balance, an APR (0 is allowed) or a payment are ignored. */
export function parseDebts(raw: string | undefined): Debt[] {
  try {
    const rows = JSON.parse(raw || '[]');
    if (!Array.isArray(rows)) return [];
    return rows
      .map((d: { name?: string; balance?: string; rate?: string; payment?: string }) => ({
        name: d.name || 'Debt',
        balance: parseFloat(d.balance as string),
        rate: parseFloat(d.rate as string),
        payment: parseFloat(d.payment as string),
      }))
      .filter((d) => d.balance > 0 && d.rate >= 0 && d.payment > 0);
  } catch {
    return [];
  }
}

/** JSON rows from DebtInputs, falling back to the flat debt1balance/debt1rate/debt1payment keys (up to 3 debts) used by API-style callers. */
export function debtsFromValues(values: Record<string, string>): Debt[] {
  const debts = parseDebts(values.debts);
  if (debts.length) return debts;
  for (let i = 1; i <= 3; i++) {
    const balance = parseFloat(values[`debt${i}balance`]);
    const rate = parseFloat(values[`debt${i}rate`]);
    const payment = parseFloat(values[`debt${i}payment`]);
    if (balance > 0 && rate >= 0 && payment > 0) debts.push({ name: values[`debt${i}name`] || `Debt ${i}`, balance, rate, payment });
  }
  return debts;
}

export interface CurrentPlan {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** Total balance at month 0..months */
  progression: number[];
  paidOff: boolean;
  /** Name of a debt whose payment never covers its monthly interest (if any). */
  stuckDebt?: string;
}

export const MAX_MONTHS = 600;

/** Each debt keeps its own payment until it is paid off; freed-up payments are not redirected. */
export function simulateCurrentPlan(debts: Debt[]): CurrentPlan {
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const stuck = debts.find((d) => d.payment <= d.balance * (d.rate / 100 / 12) + 1e-9);
  if (stuck) {
    return { months: 0, totalInterest: 0, totalPaid: 0, progression: [totalBalance], paidOff: false, stuckDebt: stuck.name };
  }
  const balances = debts.map((d) => d.balance);
  const rates = debts.map((d) => d.rate / 100 / 12);
  let month = 0;
  let totalInterest = 0;
  const progression: number[] = [totalBalance];
  while (balances.some((b) => b > 0.005) && month < MAX_MONTHS) {
    month++;
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] <= 0) continue;
      const interest = balances[i] * rates[i];
      totalInterest += interest;
      balances[i] = Math.max(0, balances[i] + interest - debts[i].payment);
    }
    progression.push(Math.round(balances.reduce((s, b) => s + b, 0) * 100) / 100);
  }
  const paidOff = !balances.some((b) => b > 0.005);
  return { months: month, totalInterest, totalPaid: totalBalance + totalInterest, progression, paidOff };
}
