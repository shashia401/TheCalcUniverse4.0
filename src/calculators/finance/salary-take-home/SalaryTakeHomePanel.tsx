import { Briefcase } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SalaryTakeHomePanel({ results }: Props) {
  if (!results.length) return null;

  const grossRes = results.find((r) => r.id === 'grossAnnual');
  const fedRes = results.find((r) => r.id === 'totalFederalTax');
  const ficaRes = results.find((r) => r.id === 'totalFICA');
  const stateRes = results.find((r) => r.id === 'totalStateTax');
  const deductionsRes = results.find((r) => r.id === 'preTaxDeductions');
  const netRes = results.find((r) => r.id === 'netAnnual');
  const taxRes = results.find((r) => r.id === 'totalTax');
  const effRateRes = results.find((r) => r.id === 'effectiveTaxRate');

  if (!grossRes || !netRes) return null;

  const gross = parseVal(grossRes.value);
  const federalTax = fedRes ? parseVal(fedRes.value) : 0;
  const fica = ficaRes ? parseVal(ficaRes.value) : 0;
  const stateTax = stateRes ? parseVal(stateRes.value) : 0;
  const preTaxDeductions = deductionsRes ? parseVal(deductionsRes.value) : 0;
  const totalTax = taxRes ? parseVal(taxRes.value) : 0;
  const net = parseVal(netRes.value);
  const effRate = effRateRes ? parseVal(effRateRes.value) : 0;

  const maxBar = gross;
  const bar = (v: number) => (v / maxBar) * 100;

  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Briefcase size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Salary Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Stacked bar */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            How Your Salary Is Split
          </p>
          <div className="h-11 bg-slate-100 rounded-full overflow-hidden flex">
            {federalTax > 0 && (
              <div
                className="h-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ width: `${bar(federalTax)}%`, backgroundColor: '#ef4444', minWidth: federalTax > 0 ? '4px' : '0' }}
                title={`Federal Tax: ${fmtD(federalTax)}`}
              >
                {bar(federalTax) > 10 && 'Federal'}
              </div>
            )}
            {fica > 0 && (
              <div
                className="h-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ width: `${bar(fica)}%`, backgroundColor: '#f59e0b', minWidth: fica > 0 ? '4px' : '0' }}
                title={`FICA: ${fmtD(fica)}`}
              >
                {bar(fica) > 8 && 'FICA'}
              </div>
            )}
            {stateTax > 0 && (
              <div
                className="h-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ width: `${bar(stateTax)}%`, backgroundColor: '#8b5cf6', minWidth: stateTax > 0 ? '4px' : '0' }}
                title={`State Tax: ${fmtD(stateTax)}`}
              >
                {bar(stateTax) > 6 && 'State'}
              </div>
            )}
            {preTaxDeductions > 0 && (
              <div
                className="h-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ width: `${bar(preTaxDeductions)}%`, backgroundColor: '#06b6d4', minWidth: preTaxDeductions > 0 ? '4px' : '0' }}
                title={`Pre-Tax Deductions: ${fmtD(preTaxDeductions)}`}
              >
                {bar(preTaxDeductions) > 6 && 'Deduct'}
              </div>
            )}
            {net > 0 && (
              <div
                className="h-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ width: `${bar(net)}%`, backgroundColor: '#10b981', minWidth: net > 0 ? '4px' : '0' }}
                title={`Take-Home: ${fmtD(net)}`}
              >
                {bar(net) > 15 && 'Take-Home'}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {federalTax > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-slate-500">Federal Tax: {fmtD(federalTax)}</span>
            </div>
          )}
          {fica > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-slate-500">FICA: {fmtD(fica)}</span>
            </div>
          )}
          {stateTax > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }} />
              <span className="text-slate-500">State Tax: {fmtD(stateTax)}</span>
            </div>
          )}
          {preTaxDeductions > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#06b6d4' }} />
              <span className="text-slate-500">Pre-Tax Deductions: {fmtD(preTaxDeductions)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#10b981' }} />
            <span className="text-slate-500">Take-Home Pay: {fmtD(net)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">Effective Tax Rate</span>
            <span className="text-sm font-black text-slate-700">{effRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Total income: {fmtD(gross)} &middot; Total taxes: {fmtD(totalTax)} &middot; Net: {fmtD(net)}
          </p>
        </div>
      </div>
    </div>
  );
}
