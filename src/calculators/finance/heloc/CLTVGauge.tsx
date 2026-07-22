import { HELOCData } from './helocTypes';

export function CLTVGauge({ data }: { data: HELOCData }) {
  const { currentLTV, maxLTV } = data;

  let statusLabel = '';
  let statusColor = 'text-emerald-600';
  let statusBg = 'bg-emerald-50 border-emerald-200';

  if (currentLTV < 60) {
    statusLabel = 'Excellent equity position &mdash; strong HELOC candidate';
    statusColor = 'text-emerald-700';
    statusBg = 'bg-emerald-50 border-emerald-200';
  } else if (currentLTV < 75) {
    statusLabel = 'Good equity position';
    statusColor = 'text-blue-700';
    statusBg = 'bg-blue-50 border-blue-200';
  } else if (currentLTV <= 80) {
    statusLabel = 'Approaching lender limits';
    statusColor = 'text-amber-700';
    statusBg = 'bg-amber-50 border-amber-200';
  } else {
    statusLabel = 'May not qualify &mdash; insufficient equity at current CLTV';
    statusColor = 'text-red-700';
    statusBg = 'bg-red-50 border-red-200';
  }

  const currentPct = Math.min(currentLTV, 100);
  const maxPct = Math.min(maxLTV, 100);

  return (
    <div className="space-y-3">
      <div className="relative h-8 bg-slate-100 rounded-xl overflow-visible">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 rounded-l-xl transition-all"
          style={{ width: `${currentPct}%` }}
        />
        <div
          className="absolute top-0 h-full flex items-center"
          style={{ left: `${maxPct}%`, transform: 'translateX(-50%)' }}
        >
          <div
            className="w-0.5 h-full"
            style={{ borderLeft: '2px dashed #f59e0b' }}
          />
        </div>
        <div
          className="absolute top-0 h-full bg-red-200 rounded-r-xl transition-all opacity-50"
          style={{ left: `${maxPct}%`, right: 0 }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500">
        <span>0%</span>
        <div className="flex flex-col items-center">
          <span className="text-amber-600 font-bold">{maxLTV}% limit</span>
        </div>
        <span className="text-red-500">100%</span>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0" />
          <span className="text-slate-600">
            Current LTV: <strong className="text-blue-700">{currentLTV.toFixed(1)}%</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 flex-shrink-0" style={{ borderLeft: '2px dashed #f59e0b', width: 12 }} />
          <span className="text-slate-600">
            Max CLTV: <strong className="text-amber-600">{maxLTV}%</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-200 flex-shrink-0" />
          <span className="text-slate-600">Over limit zone</span>
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 ${statusBg}`}>
        <p className={`text-sm font-bold ${statusColor}`}>{statusLabel}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Current LTV is {currentLTV.toFixed(1)}% &mdash; lender limit is {maxLTV}% CLTV.
        </p>
      </div>
    </div>
  );
}
