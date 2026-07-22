import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function BACPanel({ results }: Props) {
  const bacResult = results.find(r => r.id === 'bac');
  const impairmentResult = results.find(r => r.id === 'impairment');

  if (!bacResult || !impairmentResult) return null;
  const bac = parseFloat(bacResult.value);

  // BAC scale visualization
  const thresholds = [
    { value: 0.0, label: '0.00', desc: 'Sober' },
    { value: 0.02, label: '0.02', desc: 'Mild' },
    { value: 0.05, label: '0.05', desc: 'Moderate' },
    { value: 0.08, label: '0.08', desc: 'Legal Limit' },
    { value: 0.15, label: '0.15', desc: 'Significant' },
    { value: 0.30, label: '0.30', desc: 'Severe' },
    { value: 0.40, label: '0.40', desc: 'Life Threatening' },
  ];

  const maxScale = 0.40;
  const bacPos = Math.min((bac / maxScale) * 100, 100);

  const getBarColor = (b: number) => {
    if (b <= 0) return 'bg-slate-300';
    if (b < 0.02) return 'bg-emerald-400';
    if (b < 0.05) return 'bg-amber-400';
    if (b < 0.08) return 'bg-orange-400';
    if (b < 0.15) return 'bg-red-400';
    if (b < 0.30) return 'bg-red-600';
    return 'bg-red-800';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">BAC Scale & Impairment Guide</span>
      </div>

      <div className="p-5 space-y-5">
        {/* BAC gauge */}
        <div className="space-y-2">
          <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getBarColor(bac)} transition-all`}
              style={{ width: `${bacPos}%` }}
            />
            {/* Threshold markers */}
            {thresholds.filter(t => t.value > 0).map((t) => {
              const pos = (t.value / maxScale) * 100;
              return (
                <div
                  key={t.value}
                  className="absolute top-0 h-full border-l border-white/60"
                  style={{ left: `${pos}%` }}
                >
                  <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 whitespace-nowrap">
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Your BAC marker */}
          <div className="relative h-6" style={{ left: `${bacPos}%`, width: 0 }}>
            <div className="absolute -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
              Your BAC: {bac.toFixed(3)}%
            </div>
          </div>
        </div>

        {/* Impairment Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
            <p className="text-xs font-bold text-emerald-700">0.00–0.02%</p>
            <p className="text-[10px] text-emerald-600">No detectable impairment</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
            <p className="text-xs font-bold text-amber-700">0.02–0.05%</p>
            <p className="text-[10px] text-amber-600">Reduced coordination</p>
          </div>
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-center">
            <p className="text-xs font-bold text-orange-700">0.05–0.08%</p>
            <p className="text-[10px] text-orange-600">Slowed reaction time</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-xs font-bold text-red-700">0.08%+</p>
            <p className="text-[10px] text-red-600">Significant impairment</p>
          </div>
        </div>

        {/* Bold Disclaimer — Full Width, Red */}
        <div className="rounded-xl border-2 border-red-400 bg-red-50 px-5 py-5">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-red-700 mb-2">⚠ Do Not Use This Calculator to Make Driving Decisions</p>
              <p className="text-xs text-red-600 leading-relaxed">
                <strong>This tool provides a rough estimate only and cannot be used to determine if it is legal
                or safe for you to drive.</strong> Everyone metabolizes alcohol differently. Your actual BAC may
                be significantly higher or lower than this estimate due to: individual metabolism, food consumption,
                medications, hydration status, liver function, and other factors. Even at BAC levels below the
                legal limit of 0.08%, your driving ability may be impaired. <strong>If you have consumed any
                alcohol, the only safe choice is not to drive.</strong> Arrange a designated driver, use a
                rideshare service, or wait significantly longer than this calculator suggests.
              </p>
            </div>
          </div>
        </div>

        {/* Standard Drink Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">What Counts as One Standard Drink?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-lg font-bold text-amber-600">12 oz</p>
              <p className="text-xs text-slate-600">Beer (5% ABV)</p>
              <p className="text-[10px] text-slate-500">~1 regular can/bottle</p>
            </div>
            <div className="text-center bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-lg font-bold text-amber-600">5 oz</p>
              <p className="text-xs text-slate-600">Wine (12% ABV)</p>
              <p className="text-[10px] text-slate-500">~1 standard glass</p>
            </div>
            <div className="text-center bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-lg font-bold text-amber-600">1.5 oz</p>
              <p className="text-xs text-slate-600">Distilled Spirits (40% ABV)</p>
              <p className="text-[10px] text-slate-500">~1 shot</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Each = 14 grams (0.6 oz) of pure ethyl alcohol</p>
        </div>
      </div>
    </div>
  );
}
