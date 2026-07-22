import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function AutoLoanPanel({ results }: Props) {
  const monthly = results.find(r => r.id === 'monthlyPayment');
  const financed = results.find(r => r.id === 'totalFinanced');
  const interest = results.find(r => r.id === 'totalInterest');
  const totalCost = results.find(r => r.id === 'totalCost');
  const otd = results.find(r => r.id === 'outTheDoor');

  if (!monthly || !financed) return null;

  const financedVal = parseNum(financed.value);
  const interestVal = interest ? parseNum(interest.value) : 0;
  const totalVal = interestVal > 0 ? financedVal + interestVal : financedVal;
  const maxVal = Math.max(financedVal, interestVal, totalVal);

  const bar = (label: string, val: number, color: string, highlight?: boolean) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    const barColor =
      color === 'green' ? 'bg-emerald-500' :
      color === 'red' ? 'bg-red-500' :
      color === 'blue' ? 'bg-blue-500' :
      'bg-slate-400';
    return (
      <div className={`flex items-center gap-3 py-1.5 ${highlight ? 'bg-blue-50/50 -mx-4 px-4 rounded-lg' : ''}`}>
        <span className="text-xs font-semibold text-slate-600 w-36 flex-shrink-0">{label}</span>
        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${barColor} transition-all flex items-center justify-end pr-1.5 ${pct < 12 ? 'min-w-[50px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[10px] font-bold text-white drop-shadow-sm">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Loan Breakdown</span>
      </div>
      <div className="p-5 space-y-2">
        {otd && bar('Out-the-Door Price', parseNum(otd.value), 'blue')}
        {bar('Amount Financed', financedVal, 'green', true)}
        {interestVal > 0 && bar('Total Interest', interestVal, 'red')}
        {totalCost && bar('Total Cost', parseNum(totalCost.value), 'slate')}
        {monthly && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Monthly Payment</p>
            <p className="text-lg font-bold text-slate-700">{monthly.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
