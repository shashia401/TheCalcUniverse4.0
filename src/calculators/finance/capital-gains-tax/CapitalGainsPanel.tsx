import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function findResult(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((r) => r.id === id);
}

function parseMoney(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function TaxBreakdownChart(props: {
  gain: number;
  federalTax: number;
  niitTax: number;
  stateTax: number;
  afterTax: number;
}) {
  const { gain, federalTax, niitTax, stateTax, afterTax } = props;
  if (gain <= 0 || (federalTax + niitTax + stateTax) <= 0) return null;

  const maxVal = Math.max(gain, afterTax, 1);
  const items = [
    { label: 'Federal Tax', value: federalTax, color: 'bg-red-400' },
    { label: 'NIIT (3.8%)', value: niitTax, color: 'bg-orange-400' },
    { label: 'State Tax', value: stateTax, color: 'bg-yellow-500' },
    { label: 'Net After Tax', value: afterTax, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-2.5">
      {items.filter((i) => i.value > 0).map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-28 text-right flex-shrink-0">
            <span className="text-xs font-medium text-slate-600">{item.label}</span>
          </div>
          <div className="flex-1 h-6 bg-slate-100 rounded-sm overflow-hidden relative">
            <div className={'absolute left-0 top-0 h-full rounded-sm ' + item.color + ' opacity-70 transition-all duration-500'} style={{ width: ((item.value / maxVal) * 100) + '%' }} />
            <span className="absolute left-2 top-0 text-[10px] text-white font-bold leading-6 drop-shadow-md">
              {'$' + (item.value >= 1_000_000 ? (item.value / 1_000_000).toFixed(1) + 'M' : item.value.toLocaleString(undefined, { maximumFractionDigits: 0 }))}
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
        <div className="w-28 text-right flex-shrink-0">
          <span className="text-xs font-bold text-slate-700">Total Gain</span>
        </div>
        <div className="flex-1 text-xs font-bold text-slate-700">
          {'$' + gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="font-normal text-slate-500 ml-2">
            Effective rate: {(federalTax + niitTax + stateTax) / gain * 100}.toFixed(1) + '%'
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CapitalGainsPanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;

  const hasError = results.some((r) => r.id === 'error');
  if (hasError) return null;

  const gainResult = findResult(results, 'gainLoss');
  const holdingPeriodResult = findResult(results, 'holdingPeriod');
  const holdingTypeResult = findResult(results, 'holdingPeriodType');
  const federalResult = findResult(results, 'federalTax');
  const niitResult = findResult(results, 'niitTax');
  const stateResult = findResult(results, 'stateTax');
  const totalTaxResult = findResult(results, 'totalTax');
  const effectiveRateResult = findResult(results, 'effectiveRate');
  const afterTaxResult = findResult(results, 'afterTaxProceeds');

  const gain = parseMoney(gainResult?.value);
  const federalTax = parseMoney(federalResult?.value);
  const niitTax = parseMoney(niitResult?.value);
  const stateTax = parseMoney(stateResult?.value);
  const totalTax = parseMoney(totalTaxResult?.value);
  const afterTax = parseMoney(afterTaxResult?.value);

  const saleProceeds = parseFloat(values.saleProceeds || '0');
  const costBasis = parseFloat(values.costBasis || '0');
  const isShortTerm = holdingTypeResult?.value?.includes('Short-Term') ?? false;
  const isGain = gain > 0;

  const holdingPeriodDays = holdingPeriodResult ? parseFloat(holdingPeriodResult.value.replace(/[^0-9]/g, '')) : 0;

  function fmtMoney(n: number): string {
    return (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Build waterfall chart data
  const waterfallItems = isGain && saleProceeds > 0 && costBasis > 0
    ? [
        { label: 'Sale Proceeds', value: saleProceeds, color: 'bg-blue-400', type: 'total' },
        { label: 'Cost Basis', value: -costBasis, color: 'bg-red-400', type: 'negative' },
        { label: 'Capital Gain', value: gain, color: 'bg-emerald-500', type: 'positive' },
        { label: 'Federal Tax', value: -federalTax, color: 'bg-red-400', type: 'negative' },
        { label: 'NIIT', value: -niitTax, color: 'bg-orange-400', type: 'negative' },
        { label: 'State Tax', value: -stateTax, color: 'bg-yellow-500', type: 'negative' },
        { label: 'Net Proceeds', value: afterTax, color: 'bg-emerald-600', type: 'total' },
      ].filter((i) => Math.abs(i.value) > 0.01)
    : [];

  const wfMaxVal = waterfallItems.length > 0
    ? Math.max(...waterfallItems.map((i) => Math.abs(i.value)), 1)
    : 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Capital Gains Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Gain / Loss status */}
        <div className="rounded-xl border bg-slate-50 border-slate-200 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capital Gain</p>
            <p className="text-lg font-black text-emerald-600">{fmtMoney(gain)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Holding Period</p>
            <p className="text-sm font-semibold text-slate-700">{holdingPeriodDays} days</p>
            <p className={'text-xs font-medium ' + (isShortTerm ? 'text-red-500' : 'text-emerald-600')}>
              {isShortTerm ? 'Short-Term' : 'Long-Term'}
            </p>
          </div>
        </div>

        {/* Tax breakdown chart */}
        {isGain && totalTax > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Gain vs. Tax Breakdown
            </p>
            <TaxBreakdownChart
              gain={gain}
              federalTax={federalTax}
              niitTax={niitTax}
              stateTax={stateTax}
              afterTax={afterTax}
            />
          </div>
        )}

        {/* Waterfall chart */}
        {waterfallItems.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Transaction Waterfall: Proceeds to Net
            </p>
            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 560 220" className="w-full" style={{ minWidth: '400px' }} role="img" aria-label="Capital gains waterfall chart">
                {waterfallItems.map(function(item, i) {
                  const barW = 48;
                  const gap = 16;
                  const itemCount = waterfallItems.length;
                  const chartContentW = itemCount * (barW + gap) - gap;
                  const chartStartX = (560 - chartContentW) / 2;
                  const cx = chartStartX + i * (barW + gap) + barW / 2;
                  const barH = (Math.abs(item.value) / wfMaxVal) * 160;
                  const y = item.value >= 0 ? 190 - barH : 190;
                  const runningSum = waterfallItems.slice(0, i + 1).reduce(function(s, it) { return s + it.value; }, 0);
                  const connectorY = 190 - (runningSum / wfMaxVal) * 160;

                  return (
                    <g key={item.label}>
                      <rect
                        x={cx - barW / 2}
                        y={y}
                        width={barW}
                        height={Math.max(barH, 2)}
                        rx={3}
                        className={item.color}
                        opacity={item.type === 'total' ? 0.85 : 0.7}
                      />
                      <text
                        x={cx}
                        y={item.value >= 0 ? y - 6 : y + barH + 14}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#64748b"
                        fontWeight="bold"
                      >
                        {(item.value >= 0 ? '+' : '') + '$' + (Math.abs(item.value) >= 1_000_000
                          ? (Math.abs(item.value) / 1_000_000).toFixed(1) + 'M'
                          : Math.abs(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        )}
                      </text>
                      <text
                        x={cx}
                        y={y + barH + 30}
                        textAnchor="middle"
                        fontSize={8}
                        fill={item.type === 'total' ? '#0f172a' : '#64748b'}
                        fontWeight={item.type === 'total' ? 'bold' : 'normal'}
                      >
                        {item.label}
                      </text>
                      {i < waterfallItems.length - 1 && (
                        <line
                          x1={cx + barW / 2 + 1}
                          y1={connectorY}
                          x2={cx + barW / 2 + gap - 1}
                          y2={connectorY}
                          stroke="#94a3b8"
                          strokeWidth={1}
                          strokeDasharray="3 2"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-400 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500">Income (+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-400 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500">Reductions (-)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 flex-shrink-0 opacity-80" />
                  <span className="text-[10px] text-slate-500">Net (+)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {federalTax > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Federal Tax</p>
              <p className="text-sm font-bold text-red-700">{fmtMoney(federalTax)}</p>
            </div>
          )}
          {niitTax > 0 && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">NIIT (3.8%)</p>
              <p className="text-sm font-bold text-orange-700">{fmtMoney(niitTax)}</p>
            </div>
          )}
          {stateTax > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">State Tax</p>
              <p className="text-sm font-bold text-yellow-700">{fmtMoney(stateTax)}</p>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Tax</p>
            <p className="text-sm font-bold text-slate-700">{fmtMoney(totalTax)}</p>
          </div>
          {effectiveRateResult && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Effective Rate</p>
              <p className="text-sm font-bold text-slate-700">{effectiveRateResult.value}</p>
            </div>
          )}
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Net Proceeds</p>
            <p className="text-sm font-bold text-emerald-700">{fmtMoney(afterTax)}</p>
          </div>
        </div>

        {/* Asset info */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-600">
            <strong>Asset:</strong> {values.assetType || 'N/A'} &middot;{' '}
            <strong>Filed as:</strong> {values.filingStatus || 'Single'} &middot;{' '}
            <strong>Ordinary Income:</strong> {'$' + parseInt(values.annualIncome || '0').toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
