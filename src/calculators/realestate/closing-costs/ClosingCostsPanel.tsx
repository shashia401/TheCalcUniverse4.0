import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { closingCosts, parseClosing, type CostLine } from './closingMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const clean = (label: string) => label.trim();

function Section({ title, total, lines, color, max }: { title: string; total: number; lines: CostLine[]; color: string; max: number }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{title}</h3>
        <span className="text-xs font-bold text-slate-700">{usd(total)}</span>
      </div>
      {lines.map((l) => (
        <HBarRow key={l.id} label={clean(l.label)} value={l.amount} max={max} display={usd(l.amount)} color={color} labelWidth="w-44" height="h-5" className="py-1" />
      ))}
    </div>
  );
}

export default function ClosingCostsPanel({ values, results }: Props) {
  const p = parseClosing(values);
  if (!p || !results.length) return null;
  const c = closingCosts(p.homePrice, p.downPct, p.annualRate);
  const showBuyer = p.party !== 'seller';
  const showSeller = p.party !== 'buyer';
  const colors = ['bg-blue-700', 'bg-red-700', 'bg-emerald-700'];
  const max = Math.max(...c.buyerGroups.flatMap((g) => g.lines.map((l) => l.amount)), ...c.sellerLines.map((l) => l.amount), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Closing Costs Breakdown</span>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {showBuyer && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Buyer closing costs</p>
              <p className="text-2xl font-bold text-blue-800">{usd(c.totalBuyer)}</p>
              <p className="text-xs text-blue-700 mt-1">{((c.totalBuyer / p.homePrice) * 100).toFixed(1)}% of price</p>
            </div>
          )}
          {showSeller && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Seller closing costs</p>
              <p className="text-2xl font-bold text-amber-900">{usd(c.totalSeller)}</p>
              <p className="text-xs text-amber-800 mt-1">{((c.totalSeller / p.homePrice) * 100).toFixed(1)}% of price</p>
            </div>
          )}
        </div>

        {showBuyer && c.buyerGroups.map((g, i) => (
          <Section key={g.id} title={g.label.toLowerCase().replace(/^\w/, (ch) => ch.toUpperCase())} total={g.total} lines={g.lines} color={colors[i % colors.length]} max={max} />
        ))}
        {showSeller && <Section title="Seller costs" total={c.totalSeller} lines={c.sellerLines} color="bg-amber-700" max={max} />}
      </div>
    </div>
  );
}
