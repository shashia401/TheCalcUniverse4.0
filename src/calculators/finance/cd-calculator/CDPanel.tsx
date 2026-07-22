import { PiggyBank } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  const cleaned = s.replace(/[$M,%+\s]/g, '').replace(/,/g, '');
  if (cleaned.includes('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1_000_000;
  }
  return parseFloat(cleaned) || 0;
}

export default function CDPanel({ results }: Props) {
  if (!results.length) return null;

  const balanceRes = results.find((r) => r.id === 'balance');
  const principalRes = results.find((r) => r.id === 'totalPrincipal');
  const interestRes = results.find((r) => r.id === 'totalInterest');
  const apyRes = results.find((r) => r.id === 'apyResult');
  const compoundingRes = results.find((r) => r.id === 'compoundingResult');

  if (!balanceRes || !principalRes || !interestRes) return null;

  const balance = parseVal(balanceRes.value);
  const principal = parseVal(principalRes.value);
  const interest = parseVal(interestRes.value);
  const apy = apyRes ? parseVal(apyRes.value) : 0;
  const compounding = compoundingRes?.value || '';

  const maxBar = Math.max(balance, 1);
  const bar = (v: number) => (v / maxBar) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <PiggyBank size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Maturity Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600">Principal Deposited</span>
              <span className="text-xs font-bold text-slate-700">
                {principal >= 1_000_000
                  ? `$${(principal / 1_000_000).toFixed(2)}M`
                  : `$${principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(principal)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-600">Interest Earned</span>
              <span className="text-xs font-bold text-slate-700">
                {interest >= 1_000_000
                  ? `$${(interest / 1_000_000).toFixed(2)}M`
                  : `$${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${bar(interest)}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Balance at Maturity</p>
            <p className="text-lg font-black text-emerald-700">
              {balance >= 1_000_000
                ? `$${(balance / 1_000_000).toFixed(2)}M`
                : `$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Interest % of Total</p>
            <p className="text-lg font-black text-blue-700">{balance > 0 ? ((interest / balance) * 100).toFixed(1) : '0.0'}%</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-1">CD Details</p>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>APY: {apy.toFixed(2)}%</span>
            <span>{compounding}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
