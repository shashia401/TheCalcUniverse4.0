import { Home } from 'lucide-react';

interface Props {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: number;
  dtiLimit: number;
  interestRate: number;
  loanTermYears: number;
}

function DTIGauge({ backEndDTI, dtiLimit }: { backEndDTI: number; dtiLimit: number }) {
  const max = 50;
  const pct = Math.min(backEndDTI / max, 1);
  const limitPct = Math.min(dtiLimit / max, 1);

  const cx = 120;
  const cy = 100;
  const r = 80;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  const describeArc = (startA: number, endA: number) => {
    const s = polarToCartesian(startA);
    const e = polarToCartesian(endA);
    const large = startA - endA > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  const needleAngle = 180 - pct * 180;
  const needleEnd = polarToCartesian(needleAngle);
  const limitAngle = 180 - limitPct * 180;
  const limitPos = polarToCartesian(limitAngle);

  const zone = backEndDTI <= 28 ? 'safe' : backEndDTI <= 36 ? 'moderate' : backEndDTI <= 43 ? 'stretching' : 'danger';
  const zoneColors: Record<string, string> = {
    safe: '#22c55e',
    moderate: '#f59e0b',
    stretching: '#f97316',
    danger: '#ef4444',
  };
  const zoneLabels: Record<string, string> = {
    safe: 'Safe Zone',
    moderate: 'Moderate',
    stretching: 'Stretching',
    danger: 'Over Limit',
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 110" className="w-full max-w-xs" role="img" aria-label="Debt-to-income ratio gauge chart">
        <path d={describeArc(180, 151)} fill="none" stroke="#22c55e" strokeWidth={18} strokeLinecap="butt" opacity={0.85} />
        <path d={describeArc(151, 126)} fill="none" stroke="#f59e0b" strokeWidth={18} strokeLinecap="butt" opacity={0.85} />
        <path d={describeArc(126, 93)} fill="none" stroke="#f97316" strokeWidth={18} strokeLinecap="butt" opacity={0.85} />
        <path d={describeArc(93, 0)} fill="none" stroke="#ef4444" strokeWidth={18} strokeLinecap="butt" opacity={0.85} />

        <line
          x1={cx} y1={cy}
          x2={limitPos.x} y2={limitPos.y}
          stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 2"
        />
        <circle cx={limitPos.x} cy={limitPos.y} r={3} fill="#94a3b8" />

        <line
          x1={cx} y1={cy}
          x2={needleEnd.x} y2={needleEnd.y}
          stroke="#1e293b" strokeWidth={3} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} className="fill-slate-800 dark:fill-slate-200" />
        <circle cx={cx} cy={cy} r={3} className="fill-white dark:fill-slate-800" />

        <text x={cx} y={cy - 15} textAnchor="middle" fontSize={18} fontWeight="900" fill={zoneColors[zone]}>{backEndDTI.toFixed(1)}%</text>
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={10} fontWeight="700" className="fill-slate-500 dark:fill-slate-400">Back-End DTI</text>

        <text x={18} y={106} fontSize={9} className="fill-slate-400 dark:fill-slate-500">0%</text>
        <text x={cx} y={20} textAnchor="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500">25%</text>
        <text x={222} y={106} textAnchor="end" fontSize={9} className="fill-slate-400 dark:fill-slate-500">50%</text>
      </svg>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: zoneColors[zone] }} />
        <span className="text-sm font-black" style={{ color: zoneColors[zone] }}>{zoneLabels[zone]}</span>
      </div>

      <div className="flex gap-3 mt-3 text-[10px] text-slate-500">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500 opacity-85" /><span>≤28% Safe</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-400 opacity-85" /><span>28–36% Moderate</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-orange-400 opacity-85" /><span>36–43% Stretching</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500 opacity-85" /><span>&gt;43% Danger</span></div>
      </div>
    </div>
  );
}

function AffordabilityComparison({ annualIncome, monthlyDebts, downPayment, interestRate, loanTermYears }: Props) {
  const calcMaxHome = (dti: number) => {
    const monthlyIncome = annualIncome / 12;
    const monthlyRate = (interestRate / 100) / 12;
    const n = loanTermYears * 12;
    const maxHousing = monthlyIncome * dti - monthlyDebts;
    if (maxHousing <= 0) return 0;
    const maxPI = maxHousing * 0.8;
    const maxLoan = monthlyRate === 0
      ? maxPI * n
      : maxPI * (1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate;
    return maxLoan + downPayment;
  };

  const dtis = [
    { label: 'Conservative', pct: 0.28, color: '#22c55e' },
    { label: 'Moderate', pct: 0.36, color: '#f59e0b' },
    { label: 'Aggressive', pct: 0.43, color: '#f97316' },
  ];

  const maxVal = Math.max(...dtis.map((d) => calcMaxHome(d.pct)));

  const fmtK = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-3">
      {dtis.map((d) => {
        const val = calcMaxHome(d.pct);
        const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return (
          <div key={d.label}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-bold text-slate-600">{d.label} ({(d.pct * 100).toFixed(0)}% DTI)</span>
              <span className="text-sm font-black" style={{ color: d.color }}>{fmtK(val)}</span>
            </div>
            <div className="h-5 rounded-lg bg-slate-100 overflow-hidden">
              <div className="h-full rounded-lg transition-all" style={{ width: `${barPct}%`, backgroundColor: d.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HouseAffordabilityPanel(props: Props) {
  const { annualIncome, monthlyDebts, dtiLimit } = props;
  const monthlyIncome = annualIncome / 12;
  const maxHousing = monthlyIncome * dtiLimit - monthlyDebts;
  const backEndDTI = ((maxHousing + monthlyDebts) / monthlyIncome) * 100;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Home size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Affordability Analysis</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">DTI Risk Zone</p>
          <DTIGauge backEndDTI={Math.min(backEndDTI, 50)} dtiLimit={dtiLimit} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Max Home Price by DTI Scenario</p>
          <AffordabilityComparison {...props} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Monthly Budget Breakdown</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">Monthly Income</p>
                <p className="text-sm font-black text-slate-700">${fmt(monthlyIncome)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">Existing Debts</p>
                <p className="text-sm font-black text-red-500">${fmt(monthlyDebts)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">For Housing</p>
                <p className="text-sm font-black text-emerald-600">${fmt(Math.max(0, maxHousing))}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-sm font-bold text-blue-700 mb-1">Pro Tip: The 28% Rule</p>
          <p className="text-xs text-blue-600">
            Conventional lenders prefer your housing payment not exceed 28% of gross income.
            At your income, that's <strong>${fmt(monthlyIncome * 0.28)}/mo</strong> — a useful upper boundary regardless of DTI limit selected.
          </p>
        </div>
      </div>
    </div>
  );
}
