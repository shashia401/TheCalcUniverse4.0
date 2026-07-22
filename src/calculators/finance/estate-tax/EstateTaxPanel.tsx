import { Shield } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/[MK]/g, '')) || 0;
}

export default function EstateTaxPanel({ values, results }: Props) {
  const adjustedRes = results.find((r) => r.id === 'adjustedEstate');
  const fedTaxableRes = results.find((r) => r.id === 'federalTaxableEstate');
  const fedTaxRes = results.find((r) => r.id === 'federalTax');
  const totalTaxRes = results.find((r) => r.id === 'totalTax');
  const netRes = results.find((r) => r.id === 'netToHeirs');
  const stateTaxRes = results.find((r) => r.id === 'stateTax');

  if (!adjustedRes || !totalTaxRes || !netRes) return null;

  const grossEstate = parseFloat(values.totalAssets) || 0;
  const debts = parseFloat(values.debtsDeductions) || 0;
  const adjusted = grossEstate - debts;
  const totalTax = parseVal(totalTaxRes.value.replace(/[^0-9.]/g, ''));
  const netToHeirs = adjusted - totalTax;
  const fedExemption = results.find((r) => r.id === 'notice')?.value || '';

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  const maxVal = Math.max(grossEstate, 1);
  const bar = (v: number) => (v / maxVal) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Shield size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Estate Tax Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-600">Gross Estate</span>
              <span className="font-semibold text-slate-700">{fmt(grossEstate)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(grossEstate)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-600">Debts & Deductions</span>
              <span className="font-semibold text-red-500">−{fmt(debts)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-red-300" style={{ width: `${bar(debts)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-600">Adjusted Estate</span>
              <span className="font-semibold text-slate-700">{fmt(adjusted)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${bar(adjusted)}%` }} />
            </div>
          </div>
          {totalTax > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-600">Estate Tax Due</span>
                <span className="font-semibold text-red-600">−{fmt(totalTax)}</span>
              </div>
              <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${bar(totalTax)}%` }} />
              </div>
            </div>
          )}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-600">Net to Heirs</span>
              <span className="font-semibold text-emerald-600">{fmt(netToHeirs)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${bar(netToHeirs)}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Federal Exemption</p>
            <p className="text-sm font-black text-blue-700">{fedExemption}</p>
          </div>
          <div className={`rounded-xl px-4 py-3 text-center ${totalTax > 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: totalTax > 0 ? '#dc2626' : '#16a34a' }}>
              Total Tax
            </p>
            <p className="text-lg font-black" style={{ color: totalTax > 0 ? '#dc2626' : '#16a34a' }}>
              {totalTax > 0 ? fmt(totalTax) : '$0'}
            </p>
          </div>
        </div>

        {totalTax > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-600">
              Of {fmt(adjusted)} adjusted estate, an estimated <strong className="text-red-600">{fmt(totalTax)}</strong> goes to taxes.
              Heirs receive approximately <strong className="text-emerald-600">{fmt(netToHeirs)}</strong>.
              {fedTaxRes && parseVal(fedTaxRes.value.replace(/[^0-9.]/g, '')) > 0 && (
                <span className="block mt-1 text-slate-500">Federal tax: {fedTaxRes.value}{stateTaxRes ? ` | State tax: ${stateTaxRes.value}` : ''}</span>
              )}
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
