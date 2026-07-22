import { HELOCData, fmt } from './helocTypes';

export function EquityStackedBar({ data }: { data: HELOCData }) {
  const { homeValue, mortgageBalance, maxBorrowable, requiredCushion, maxLTV } = data;

  if (homeValue <= 0) return null;

  const mortgagePct = (mortgageBalance / homeValue) * 100;
  const helocPct = (maxBorrowable / homeValue) * 100;
  const cushionPct = (requiredCushion / homeValue) * 100;

  const segments = [
    {
      label: 'Current Mortgage',
      pct: mortgagePct,
      value: mortgageBalance,
      color: '#ef4444',
      textColor: 'text-red-700',
      bg: 'bg-red-400',
    },
    {
      label: 'Available HELOC Line',
      pct: helocPct,
      value: maxBorrowable,
      color: '#10b981',
      textColor: 'text-emerald-700',
      bg: 'bg-emerald-500',
    },
    {
      label: 'Required Equity Cushion',
      pct: cushionPct,
      value: requiredCushion,
      color: '#e2e8f0',
      textColor: 'text-slate-500',
      bg: 'bg-slate-200',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex h-12 rounded-xl overflow-hidden border border-slate-200">
          {segments
            .filter((s) => s.pct > 0)
            .map((seg) => (
              <div
                key={seg.label}
                className={`${seg.bg} flex items-center justify-center transition-all`}
                style={{ width: `${Math.max(seg.pct, 0)}%` }}
              >
                {seg.pct > 8 && (
                  <span
                    className={`text-[10px] font-bold truncate px-1 ${
                      seg.color === '#e2e8f0' ? 'text-slate-500' : 'text-white'
                    }`}
                  >
                    {seg.pct.toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
        </div>

        <div
          className="absolute top-0 h-12 flex flex-col items-center"
          style={{ left: `${maxLTV}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-0.5 h-full bg-amber-500" style={{ borderLeft: '2px dashed #f59e0b' }} />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500">
        <span>0%</span>
        <span className="text-amber-600 font-bold">{maxLTV}% CLTV limit</span>
        <span>100%</span>
      </div>

      <div className="space-y-2">
        {segments.map((seg) => {
          const valuePct = homeValue > 0 ? (seg.value / homeValue) * 100 : 0;
          return (
            <div key={seg.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-200"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs text-slate-600 truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-bold ${seg.textColor}`}>${fmt(seg.value)}</span>
                <span className="text-[10px] text-slate-500 w-10 text-right">
                  {valuePct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm border-2 border-slate-400 bg-transparent flex-shrink-0" />
            <span className="text-xs text-slate-600 font-bold">Total Home Value</span>
          </div>
          <span className="text-xs font-black text-slate-800">${fmt(homeValue)}</span>
        </div>
      </div>
    </div>
  );
}
