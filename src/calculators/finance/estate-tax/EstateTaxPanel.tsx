import { Shield } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeEstate } from './estateMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

export default function EstateTaxPanel({ values, results }: Props) {
  if (!results.some((r) => r.id === 'totalTax')) return null;

  // Same pure function as index.ts, so the panel never re-parses formatted result strings.
  const est = computeEstate({
    totalAssets: parseFloat(values.totalAssets) || 0,
    debts: Math.max(0, parseFloat(values.debtsDeductions) || 0),
    married: values.filingStatus === 'married',
    spouseEstate: parseFloat(values.spouseEstate) || 0,
    stateKey: values.stateResidence || 'none',
  });
  const { gross: grossEstate, adjusted, totalTax, netToHeirs, federalTax, stateTax } = est;
  const debts = grossEstate - adjusted;
  const fedExemption = results.find((r) => r.id === 'notice')?.value || '';
  const hasState = est.state.topRate > 0;

  const max = Math.max(grossEstate, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Shield size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Estate Tax Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-1">
          <HBarRow label="Gross Estate" value={grossEstate} max={max} display={fmt(grossEstate)} color="bg-blue-700" labelWidth="w-36" />
          <HBarRow label="Debts & Deductions" value={debts} max={max} display={`−${fmt(debts)}`} color="bg-slate-700" labelWidth="w-36" />
          <HBarRow label="Adjusted Estate" value={adjusted} max={max} display={fmt(adjusted)} color="bg-amber-700" labelWidth="w-36" />
          {totalTax > 0 && (
            <HBarRow label="Estate Tax Due" value={totalTax} max={max} display={`−${fmt(totalTax)}`} color="bg-red-700" labelWidth="w-36" />
          )}
          <HBarRow label="Net to Heirs" value={netToHeirs} max={max} display={fmt(netToHeirs)} color="bg-emerald-700" labelWidth="w-36" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Federal Exemption</p>
            <p className="text-sm font-black text-blue-700">{fedExemption}</p>
          </div>
          <div className={`rounded-xl px-4 py-3 text-center ${totalTax > 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${totalTax > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              Total Tax
            </p>
            <p className={`text-lg font-black ${totalTax > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {totalTax > 0 ? fmt(totalTax) : '$0'}
            </p>
          </div>
        </div>

        {totalTax > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-600">
              Of {fmt(adjusted)} adjusted estate, an estimated <strong className="text-red-700">{fmt(totalTax)}</strong> goes to taxes.
              Heirs receive approximately <strong className="text-emerald-700">{fmt(netToHeirs)}</strong>.
              <span className="block mt-1 text-slate-600">
                Federal tax: {fmt(federalTax)}{hasState ? ` | State tax: ${fmt(stateTax)}` : ''}
              </span>
            </p>
          </div>
        )}

        {totalTax === 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center">
            <p className="text-xs font-bold text-emerald-700">No estate tax is due — the estate is within the exemption threshold.</p>
          </div>
        )}
      </div>
    </div>
  );
}
