import { Shield } from 'lucide-react';

interface Props {
  fra: number;
  pia: number;
  benefitAt62: number;
  benefitAtFRA: number;
  benefitAt70: number;
  benefitAtChosen: number;
  retirementAge: number;
  birthYear: number;
  annualIncome: number;
}

function BenefitBarChart({ benefitAt62, benefitAtFRA, benefitAt70, retirementAge, fra }: Pick<Props, 'benefitAt62' | 'benefitAtFRA' | 'benefitAt70' | 'benefitAtChosen' | 'retirementAge' | 'fra'>) {
  const bars = [
    { label: 'Age 62', sublabel: 'Earliest (Reduced)', value: benefitAt62, color: '#f97316' },
    { label: `Age ${fra}`, sublabel: 'Full Retirement Age', value: benefitAtFRA, color: '#3b82f6' },
    { label: 'Age 70', sublabel: 'Maximum (Delayed)', value: benefitAt70, color: '#22c55e' },
  ];

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const maxVal = Math.max(...bars.map((b) => b.value)) * 1.1;

  const width = 460;
  const height = 180;
  const padL = 20;
  const padR = 20;
  const padT = 16;
  const padB = 55;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const barW = Math.min(80, chartW / bars.length * 0.55);
  const gap = chartW / bars.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Social Security benefits comparison bar chart">
      <defs>
        {bars.map((b) => (
          <linearGradient key={b.label} id={`ssGrad${b.label.replace(' ', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={b.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.5" />
          </linearGradient>
        ))}
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const y = padT + (1 - g) * chartH;
        return <line key={g} x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />;
      })}

      {bars.map((b, i) => {
        const cx = padL + gap * i + gap / 2;
        const bh = (b.value / maxVal) * chartH;
        const x = cx - barW / 2;
        const y = padT + chartH - bh;
        const isChosen = Math.abs(retirementAge - (i === 0 ? 62 : i === 2 ? 70 : fra)) < 0.5;
        return (
          <g key={b.label}>
            <rect x={x} y={y} width={barW} height={bh}
              fill={`url(#ssGrad${b.label.replace(' ', '')})`}
              rx={6}
              strokeWidth={isChosen ? 2 : 0} stroke={isChosen ? b.color : 'none'} />
            <text x={cx} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="800" fill={b.color}>{fmt(b.value)}</text>
            <text x={cx} y={padT + chartH + 13} textAnchor="middle" fontSize={10} fontWeight="700" fill="#475569">{b.label}</text>
            <text x={cx} y={padT + chartH + 25} textAnchor="middle" fontSize={8} fill="#94a3b8">{b.sublabel}</text>
            {isChosen && (
              <text x={cx} y={padT + chartH + 37} textAnchor="middle" fontSize={8} fontWeight="700" fill={b.color}>← Your choice</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function LifetimeCumulativeChart({ benefitAt62, benefitAtFRA, benefitAt70, fra }: Pick<Props, 'benefitAt62' | 'benefitAtFRA' | 'benefitAt70' | 'fra'>) {
  const ages = Array.from({ length: 26 }, (_, i) => 62 + i);

  const cumulative62 = ages.map((age) => Math.max(0, (age - 62)) * 12 * benefitAt62);
  const cumulativeFRA = ages.map((age) => age < fra ? 0 : (age - fra) * 12 * benefitAtFRA);
  const cumulative70 = ages.map((age) => age < 70 ? 0 : (age - 70) * 12 * benefitAt70);

  const maxVal = Math.max(...cumulative62, ...cumulativeFRA, ...cumulative70);

  const width = 460;
  const height = 180;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (i: number) => padL + (i / (ages.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / Math.max(maxVal, 1)) * chartH;

  const linePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');

  const fmtY = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;

  const xLabels = ages.filter((a) => a % 5 === 0);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Social Security lifetime cumulative benefits chart">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g * maxVal)}</text>
            </g>
          );
        })}
        {xLabels.map((a) => {
          const x = toX(ages.indexOf(a));
          return (
            <g key={a}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Age {a}</text>
            </g>
          );
        })}
        <path d={linePath(cumulative62)} fill="none" stroke="#f97316" strokeWidth={2} strokeLinejoin="round" />
        <path d={linePath(cumulativeFRA)} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
        <path d={linePath(cumulative70)} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-orange-500" /><span className="text-[10px] text-slate-500">Claim at 62</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-blue-500" /><span className="text-[10px] text-slate-500">Claim at FRA {fra}</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-emerald-500" /><span className="text-[10px] text-slate-500">Claim at 70</span></div>
      </div>
    </div>
  );
}

export default function SocialSecurityPanel({ fra, pia, benefitAt62, benefitAtFRA, benefitAt70, benefitAtChosen, retirementAge }: Props) {
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Shield size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Social Security Benefit Comparison</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Monthly Benefit by Claiming Age</p>
          <BenefitBarChart
            benefitAt62={benefitAt62} benefitAtFRA={benefitAtFRA}
            benefitAt70={benefitAt70} benefitAtChosen={benefitAtChosen}
            retirementAge={retirementAge} fra={fra}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-3 text-center">
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Age 62</p>
            <p className="text-base font-black text-orange-600">{fmt(benefitAt62)}<span className="text-xs font-normal">/mo</span></p>
            <p className="text-[10px] text-orange-400">{benefitAtFRA > 0 ? ((benefitAt62 / benefitAtFRA) * 100).toFixed(0) : "0"}% of FRA</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-3 text-center">
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">FRA (Age {fra})</p>
            <p className="text-base font-black text-blue-600">{fmt(benefitAtFRA)}<span className="text-xs font-normal">/mo</span></p>
            <p className="text-[10px] text-blue-400">100% — PIA</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 text-center">
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Age 70</p>
            <p className="text-base font-black text-emerald-600">{fmt(benefitAt70)}<span className="text-xs font-normal">/mo</span></p>
            <p className="text-[10px] text-emerald-400">{benefitAtFRA > 0 ? ((benefitAt70 / benefitAtFRA) * 100).toFixed(0) : "0"}% of FRA</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Lifetime Cumulative Benefits</p>
          <LifetimeCumulativeChart benefitAt62={benefitAt62} benefitAtFRA={benefitAtFRA} benefitAt70={benefitAt70} fra={fra} />
          <p className="text-xs text-slate-500 mt-2">Where lines cross = break-even age. Living longer than the crossing point favors delaying claims.</p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-sm font-bold text-blue-700 mb-1">Your PIA (Primary Insurance Amount)</p>
          <p className="text-xs text-blue-600">
            Your estimated PIA is <strong>{fmt(pia)}/mo</strong> — this is what you would receive at exactly Age {fra} (FRA).
            Get your official estimate at <strong>ssa.gov/myaccount</strong> for the most accurate projection based on your actual earnings record.
          </p>
        </div>
      </div>
    </div>
  );
}
