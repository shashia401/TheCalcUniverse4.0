import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function BettingOddsPanel({ results }: Props) {
  const impliedRow = results.find(r => r.id === 'impliedProbability');
  const payoutRow = results.find(r => r.id === 'payout');
  const profitRow = results.find(r => r.id === 'profit');
  const americanRow = results.find(r => r.id === 'americanOddsOut');
  const decimalRow = results.find(r => r.id === 'decimalOddsOut');
  const fractionalRow = results.find(r => r.id === 'fractionalOddsOut');

  if (!impliedRow) return null;

  const impliedVal = parseFloat(impliedRow.value) || 0;
  const inversePct = 100 - impliedVal;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Probability &amp; Payout View</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Implied probability bar */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Implied Probability</p>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${Math.min(impliedVal, 100)}%` }}>
              {impliedVal > 8 ? `${impliedVal.toFixed(1)}%` : ''}
            </div>
            <div className="h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500" style={{ width: `${Math.max(100 - impliedVal, 0)}%` }}>
              {inversePct > 8 ? `${inversePct.toFixed(1)}%` : ''}
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>Hit {impliedVal.toFixed(1)}%</span>
            <span>Miss {inversePct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Odds comparison */}
        <div className="grid grid-cols-3 gap-2">
          {americanRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">American</p>
              <p className="text-sm font-bold font-mono text-slate-800">{americanRow.value}</p>
            </div>
          )}
          {decimalRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Decimal</p>
              <p className="text-sm font-bold font-mono text-slate-800">{decimalRow.value}</p>
            </div>
          )}
          {fractionalRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Fractional</p>
              <p className="text-sm font-bold font-mono text-slate-800">{fractionalRow.value}</p>
            </div>
          )}
        </div>

        {/* Payout */}
        {payoutRow && profitRow && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Payout</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-emerald-700">Total Return: <strong>{payoutRow.value}</strong></span>
              <span className="text-sm text-emerald-700">Profit: <strong>{profitRow.value}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
