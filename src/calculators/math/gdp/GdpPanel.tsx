import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function r(id: string, results: CalculatorResult[]): CalculatorResult | undefined {
  return results.find((x) => x.id === id);
}

export default function GdpPanel({ values, results }: Props) {
  const gdp = r('gdp', results);
  const formula = r('gdpFormula', results);
  const consumptionShare = r('consumptionShare', results);
  const investmentShare = r('investmentShare', results);
  const governmentShare = r('governmentShare', results);
  const netExportShare = r('netExportShare', results);
  const netExports = r('netExports', results);
  const gdpType = r('gdpType', results);
  const deflatorNote = r('deflatorNote', results);

  if (!gdp) return null;

  const isReal = gdpType?.value === 'Real GDP';
  const C = parseFloat(values.consumption) || 0;
  const I = parseFloat(values.investment) || 0;
  const G = parseFloat(values.governmentSpending) || 0;
  const X = parseFloat(values.exports) || 0;
  const M = parseFloat(values.imports) || 0;
  const netExportsVal = X - M;
  const totalDomestic = C + I + G;
  const hasPositiveDomestic = totalDomestic > 0;

  const cPct = hasPositiveDomestic ? (C / totalDomestic) * 100 : 33.3;
  const iPct = hasPositiveDomestic ? (I / totalDomestic) * 100 : 33.3;
  const gPct = hasPositiveDomestic ? (G / totalDomestic) * 100 : 33.3;

  const isPositiveNX = netExportsVal >= 0;
  const nxColor = isPositiveNX ? 'text-emerald-600' : 'text-red-500';
  const nxBg = isPositiveNX ? 'bg-emerald-500' : 'bg-red-500';

  // Parse formula parts: "C = $17.50 trillion | I = $4.20 trillion | ..."
  const formulaParts = formula ? formula.value.split(' | ') : [];
  const formulaC = formulaParts[0]?.split(' = ')[1] || '';
  const formulaI = formulaParts[1]?.split(' = ')[1] || '';
  const formulaG = formulaParts[2]?.split(' = ')[1] || '';

  const shareItems = [
    { label: 'Consumption', pct: consumptionShare?.value || '—', barColor: 'bg-blue-500', textColor: 'text-blue-700' },
    { label: 'Investment', pct: investmentShare?.value || '—', barColor: 'bg-amber-500', textColor: 'text-amber-700' },
    { label: 'Government', pct: governmentShare?.value || '—', barColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { label: 'Net Exports', pct: netExportShare?.value || '—', barColor: nxBg, textColor: nxColor },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* GDP Hero Card */}
      <div className="px-6 py-8 text-center bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-200">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          {gdp.label}
        </p>
        <p className="text-4xl font-bold text-slate-800 tracking-tight">{gdp.value}</p>
        {isReal && deflatorNote && (
          <p className="text-xs text-blue-600 mt-2 font-medium">
            Inflation-adjusted using GDP Deflator
          </p>
        )}
      </div>

      {/* Stacked Bar Chart */}
      {hasPositiveDomestic && (
        <div className="px-6 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            GDP Component Breakdown (Domestic Share)
          </p>
          <div className="h-8 w-full rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${cPct}%` }}
              title={`Consumption: ${cPct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${iPct}%` }}
              title={`Investment: ${iPct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${gPct}%` }}
              title={`Government: ${gPct.toFixed(1)}%`}
            />
          </div>
          <div className="flex items-center gap-5 mt-2 text-[10px] text-slate-500">
            {shareItems.map((item) => (
              <span key={item.label} className={`flex items-center gap-1 ${item.textColor}`}>
                <span className={`w-2.5 h-2.5 rounded ${item.barColor} inline-block shrink-0`} />
                {item.label[0]} ({item.pct})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* NX Adjustment Bar */}
      {netExports && hasPositiveDomestic && (
        <div className="px-6 pt-4">
          <div className={`rounded-xl border px-4 py-3 ${isPositiveNX ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${nxColor}`}>
              Net Exports ({netExports.value})
            </p>
            <div className="mt-1.5 h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${nxBg} transition-all`}
                style={{
                  width: `${Math.min((Math.abs(netExportsVal) / totalDomestic) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {isPositiveNX ? 'Trade surplus adds to GDP' : 'Trade deficit subtracts from GDP'}
            </p>
          </div>
        </div>
      )}

      {/* Donut Shares */}
      {hasPositiveDomestic && (
        <div className="px-6 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            GDP Composition (as % of Nominal GDP)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {shareItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className="mx-auto mb-1.5 w-10 h-10 rounded-full flex items-center justify-center relative">
                  <div className={`w-10 h-10 rounded-full ${item.barColor} opacity-30`} />
                  <span className={`absolute text-[10px] font-bold ${item.textColor}`}>
                    {item.pct}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 truncate">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formula Breakdown */}
      {formula && (
        <div className="px-6 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Formula Breakdown
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-600">
              GDP = C + I + G + (X &minus; M)
            </p>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Consumption (C)</span>
                <span className="font-medium text-blue-700">{formulaC}</span>
              </div>
              <div className="flex justify-between">
                <span>Investment (I)</span>
                <span className="font-medium text-amber-700">{formulaI}</span>
              </div>
              <div className="flex justify-between">
                <span>Government (G)</span>
                <span className="font-medium text-emerald-700">{formulaG}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-0.5">
                <span>Net Exports (X&minus;M)</span>
                <span className={`font-medium ${isPositiveNX ? 'text-emerald-700' : 'text-red-600'}`}>{netExports?.value || ''}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-0.5 font-bold">
                <span className="text-slate-700">GDP</span>
                <span className="text-slate-800">{gdp.value}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real GDP Note */}
      {isReal && deflatorNote && (
        <div className="px-6 pt-4 pb-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Inflation Adjustment
            </p>
            <p className="text-xs text-amber-800 mt-1">
              {deflatorNote.value}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 pb-5 pt-4 mt-1">
        <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500">
          GDP Type: {gdpType?.value || 'Nominal GDP'} &middot; C + I + G + NX
        </div>
      </div>
    </div>
  );
}
