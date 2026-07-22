import { CalculatorResult } from '../../../types/calculator';

interface Props {
  frontEnd: number;
  backEnd: number;
}

export default function DtiPanel({ frontEnd, backEnd }: Props) {
  return <DTIGauge frontEnd={frontEnd} backEnd={backEnd} />;
}

export function DTIGauge({ frontEnd, backEnd }: { frontEnd: number; backEnd: number }) {
  const maxDTI = 55;
  const zones = [
    { from: 0, to: 28, color: '#22c55e', label: 'Excellent' },
    { from: 28, to: 36, color: '#eab308', label: 'Good' },
    { from: 36, to: 43, color: '#f97316', label: 'Acceptable' },
    { from: 43, to: 50, color: '#ef4444', label: 'High' },
    { from: 50, to: maxDTI, color: '#dc2626', label: 'Needs Work' },
  ];

  const barW = 400;
  const barH = 28;
  const centerH = 36;

  const toX = (pct: number) => (pct / maxDTI) * barW;

  const frontEndLabel = frontEnd <= 28 ? 'Excellent' : frontEnd <= 36 ? 'Good' : frontEnd <= 43 ? 'Acceptable' : 'High';
  const backEndLabel = backEnd <= 36 ? 'Excellent' : backEnd <= 43 ? 'Acceptable' : backEnd <= 50 ? 'High' : 'Needs Work';

  const frontEndColor = frontEnd <= 28 ? '#22c55e' : frontEnd <= 36 ? '#eab308' : '#ef4444';
  const backEndColor = backEnd <= 36 ? '#22c55e' : backEnd <= 43 ? '#f97316' : backEnd <= 50 ? '#ef4444' : '#dc2626';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">DTI Visual Gauge</span>
      </div>
      <div className="p-6 space-y-6">
        {/* Back-end DTI bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">Back-End DTI (All Debts)</span>
            <span className="text-lg font-black" style={{ color: backEndColor }}>{backEnd.toFixed(1)}%</span>
          </div>
          <svg viewBox={`0 0 ${barW} ${centerH + 20}`} className="w-full" style={{ minWidth: '280px', maxWidth: '500px' }} role="img" aria-label={`Back-end DTI gauge showing ${backEnd.toFixed(1)} percent with color-coded zones from excellent to needs work`}>
            {/* Zone background */}
            {zones.map((z) => (
              <rect
                key={z.label}
                x={toX(z.from)}
                y={4}
                width={toX(z.to) - toX(z.from)}
                height={barH}
                fill={z.color}
                opacity={0.2}
                rx={z.from === 0 ? 6 : z.to === maxDTI ? 6 : 0}
              />
            ))}
            {/* Zone labels */}
            {zones.filter((z) => z.to - z.from > 8).map((z) => (
              <text
                key={z.label}
                x={toX((z.from + z.to) / 2)}
                y={4 + barH / 2 + 4}
                textAnchor="middle"
                fontSize={8}
                fill={z.color}
                fontWeight="700"
              >
                {z.label}
              </text>
            ))}
            {/* Threshold lines */}
            {zones.slice(0, -1).map((z) => (
              <line key={z.to} x1={toX(z.to)} y1={2} x2={toX(z.to)} y2={4 + barH + 2} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 2" />
            ))}
            {/* Back-end indicator */}
            <line x1={toX(Math.min(backEnd, maxDTI))} y1={0} x2={toX(Math.min(backEnd, maxDTI))} y2={4 + barH + 8} stroke={backEndColor} strokeWidth={2.5} />
            <circle cx={toX(Math.min(backEnd, maxDTI))} cy={4 + barH + 10} r={4} fill={backEndColor} />
          </svg>
          <p className="text-xs mt-1" style={{ color: backEndColor }}>
            {backEndLabel}.{' '}
            {backEnd <= 36 ? 'Well within conventional loan limits.' :
             backEnd <= 43 ? 'Meets most conventional lender requirements.' :
             backEnd <= 50 ? 'May qualify for FHA loans with compensating factors. Consider paying down debt.' :
             'Above most lender limits. Prioritize paying down debt before applying for a mortgage.'}
          </p>
        </div>

        {/* Front-end DTI bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">Front-End DTI (Housing Only)</span>
            <span className="text-lg font-black" style={{ color: frontEndColor }}>{frontEnd.toFixed(1)}%</span>
          </div>
          <svg viewBox={`0 0 ${barW} ${centerH + 20}`} className="w-full" style={{ minWidth: '280px', maxWidth: '500px' }} role="img" aria-label={`Front-end DTI gauge showing ${frontEnd.toFixed(1)} percent with color-coded zones from excellent to high`}>
            {[
              { from: 0, to: 28, label: 'Excellent', color: '#22c55e' },
              { from: 28, to: 36, label: 'Good', color: '#eab308' },
              { from: 36, to: maxDTI, label: 'High', color: '#ef4444' },
            ].map((z) => (
              <rect
                key={z.label}
                x={toX(z.from)}
                y={4}
                width={toX(Math.min(z.to, maxDTI)) - toX(z.from)}
                height={barH}
                fill={z.color}
                opacity={0.2}
                rx={z.from === 0 ? 6 : 0}
              />
            ))}
            {[
              { from: 0, to: 28, label: 'Excellent', color: '#22c55e' },
              { from: 28, to: 36, label: 'Good', color: '#eab308' },
            ].map((z) => (
              (z.to - z.from > 8) && (
                <text key={z.label} x={toX((z.from + z.to) / 2)} y={4 + barH / 2 + 4} textAnchor="middle" fontSize={8} fill={z.color} fontWeight="700">{z.label}</text>
              )
            ))}
            {[28, 36].map((t) => (
              <line key={t} x1={toX(t)} y1={2} x2={toX(t)} y2={4 + barH + 2} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 2" />
            ))}
            <line x1={toX(Math.min(frontEnd, maxDTI))} y1={0} x2={toX(Math.min(frontEnd, maxDTI))} y2={4 + barH + 8} stroke={frontEndColor} strokeWidth={2.5} />
            <circle cx={toX(Math.min(frontEnd, maxDTI))} cy={4 + barH + 10} r={4} fill={frontEndColor} />
          </svg>
          <p className="text-xs mt-1" style={{ color: frontEndColor }}>
            {frontEndLabel}.{' '}
            {frontEnd <= 28 ? 'Conventional lenders prefer front-end under 28%.' :
             frontEnd <= 36 ? 'Within acceptable range for most lenders.' :
             'Above the preferred 28% threshold. Consider a lower-priced home or larger down payment.'}
          </p>
        </div>

        {/* Quick Reference */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Lender DTI Thresholds</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div><span className="text-emerald-600 font-bold">28%</span> <span className="text-slate-500">Front-end (Conv.)</span></div>
            <div><span className="text-amber-500 font-bold">36%</span> <span className="text-slate-500">Back-end (Conv.)</span></div>
            <div><span className="text-orange-500 font-bold">43%</span> <span className="text-slate-500">Back-end max (most)</span></div>
            <div><span className="text-red-500 font-bold">50%</span> <span className="text-slate-500">Back-end (FHA max)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
