export function PaybackVisual({
  paybackPeriod,
  totalYears,
}: {
  paybackPeriod: number;
  totalYears: number;
}) {
  const maxYears = Math.max(totalYears, paybackPeriod + 1, 10);
  const paybackPct = Math.min((paybackPeriod / maxYears) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span className="font-bold text-slate-700">Year 0</span>
        <span className="font-bold text-slate-700">Year {Math.ceil(maxYears)}</span>
      </div>
      <div className="relative h-6 bg-slate-100 rounded-full overflow-visible">
        <div
          className="absolute left-0 top-0 h-full bg-red-400 rounded-full transition-all duration-500"
          style={{ width: `${paybackPct}%` }}
        />
        <div
          className="absolute top-0 h-full bg-emerald-400 rounded-full transition-all duration-500"
          style={{ left: `${paybackPct}%`, right: 0 }}
        />
        <div
          className="absolute top-0 h-full flex items-center"
          style={{ left: `${paybackPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-1 h-full bg-slate-800 rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
          <span className="text-slate-500">Recovery period: <strong className="text-slate-700">{paybackPeriod.toFixed(1)} yrs</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-slate-500">Profitable after payback</span>
        </div>
      </div>
    </div>
  );
}
