import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  // Strip $ and commas, extract number
  const cleaned = s.replace(/[$,]/g, '').trim();
  const m = cleaned.match(/^[\d,]+/);
  return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
}

export default function ClosingCostsPanel({ results }: Props) {
  const totalBuyer = results.find(r => r.id === 'totalBuyer');
  const totalSeller = results.find(r => r.id === 'totalSeller');

  // Collect itemized costs (skip headers and totals)
  const costItems = results.filter(r =>
    !r.id.endsWith('Header') &&
    !r.id.startsWith('total') &&
    r.id !== 'formula'
  );

  if (costItems.length === 0) return null;

  // Build category totals
  const categories: { name: string; items: { label: string; value: number }[]; color: string }[] = [];
  let currentCategory: typeof categories[0] | null = null;

  for (const r of results) {
    if (r.id.endsWith('Header')) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = {
        name: r.label.replace(/^\s+/, ''),
        items: [],
        color: r.id === 'loanFeesHeader' ? 'blue' : r.id === 'titleFeesHeader' ? 'red' : 'green',
      };
      continue;
    }
    if (r.id.startsWith('total') || r.id === 'formula') continue;
    if (r.id.endsWith('Header')) continue;
    if (currentCategory) {
      currentCategory.items.push({
        label: r.label.replace(/^\s+/, ''),
        value: parseNum(r.value),
      });
    }
  }
  if (currentCategory) categories.push(currentCategory);

  const grandTotal = totalBuyer
    ? parseNum(totalBuyer.value)
    : totalSeller
      ? parseNum(totalSeller.value)
      : costItems.reduce((s, r) => s + parseNum(r.value), 0);

  const barMax = Math.max(grandTotal, 1);

  const barColor = (cat: string) => {
    switch (cat) {
      case 'blue': return 'bg-blue-500';
      case 'red': return 'bg-red-400';
      case 'green': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Closing Costs Breakdown</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Total prominently */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">
            {totalBuyer ? 'Total Buyer Closing Costs' : 'Total Seller Closing Costs'}
          </p>
          <p className="text-2xl font-bold text-blue-700">
            {(totalBuyer || totalSeller)?.value.split(' (')[0] || ''}
          </p>
          {(totalBuyer || totalSeller) && (
            <p className="text-xs text-blue-500 mt-1">
              {totalBuyer?.value.match(/\(([^)]+)\)/)?.[1] || totalSeller?.value.match(/\(([^)]+)\)/)?.[1] || ''}
            </p>
          )}
        </div>

        {/* Bar chart of categories */}
        <div className="space-y-3">
          {costItems.map(item => {
            const val = parseNum(item.value);
            const pct = barMax > 0 ? (val / barMax) * 100 : 0;
            if (val <= 0) return null;
            return (
              <div key={item.id} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-600 truncate mr-2">{item.label.replace(/^\s+/, '')}</span>
                  <span className="text-[10px] font-bold text-slate-700 flex-shrink-0">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total bar */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">Total Cash Needed</span>
            <span className="text-sm font-bold text-slate-800">
              {(totalBuyer || totalSeller)?.value.split(' (')[0] || ''}
            </span>
          </div>
          <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-600" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
