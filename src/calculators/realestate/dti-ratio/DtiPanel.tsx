import { backEndBand, frontEndBand, shown, type Band } from './dtiMath';

const BAR_W = 400;
const BAR_H = 28;
const MAX_DTI = 55;
const toX = (pct: number) => (pct / MAX_DTI) * BAR_W;

interface Zone { from: number; to: number; color: string; label: string }

const BACK_ZONES: Zone[] = [
  { from: 0, to: 36, color: '#15803d', label: 'Excellent' },
  { from: 36, to: 43, color: '#c2410c', label: 'Acceptable' },
  { from: 43, to: 50, color: '#b91c1c', label: 'High' },
  { from: 50, to: MAX_DTI, color: '#991b1b', label: 'Needs work' },
];
const FRONT_ZONES: Zone[] = [
  { from: 0, to: 28, color: '#15803d', label: 'Excellent' },
  { from: 28, to: 31, color: '#c2410c', label: '' },
  { from: 31, to: MAX_DTI, color: '#b91c1c', label: 'High' },
];

function ZoneBar({ title, dti, zones, band, ariaLabel }: { title: string; dti: number; zones: Zone[]; band: Band; ariaLabel: string }) {
  const x = toX(Math.min(dti, MAX_DTI));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">{title}</span>
        <span className="text-lg font-black" style={{ color: band.hex }}>{shown(dti).toFixed(1)}%</span>
      </div>
      <svg viewBox={`0 0 ${BAR_W} ${BAR_H + 20}`} className="w-full" style={{ minWidth: '280px', maxWidth: '500px' }} role="img" aria-label={ariaLabel}>
        {zones.map((z) => (
          <rect key={z.from} x={toX(z.from)} y={4} width={toX(z.to) - toX(z.from)} height={BAR_H} fill={z.color} opacity={0.2} />
        ))}
        {zones.filter((z) => z.label && z.to - z.from > 8).map((z) => (
          <text key={z.label} x={toX((z.from + z.to) / 2)} y={4 + BAR_H / 2 + 4} textAnchor="middle" fontSize={9} fill={z.color} fontWeight="700">{z.label}</text>
        ))}
        {zones.slice(0, -1).map((z) => (
          <line key={z.to} x1={toX(z.to)} y1={2} x2={toX(z.to)} y2={4 + BAR_H + 2} stroke="#64748b" strokeWidth={1} strokeDasharray="2 2" />
        ))}
        <line x1={x} y1={0} x2={x} y2={4 + BAR_H + 8} stroke={band.hex} strokeWidth={2.5} />
        <circle cx={x} cy={4 + BAR_H + 10} r={4} fill={band.hex} />
      </svg>
      <p className="text-xs mt-1" style={{ color: band.hex }}>{band.label}. {band.note}</p>
    </div>
  );
}

export function DTIGauge({ frontEnd, backEnd }: { frontEnd: number; backEnd: number }) {
  const be = backEndBand(backEnd);
  const fe = frontEndBand(frontEnd);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">DTI Visual Gauge</span>
      </div>
      <div className="p-6 space-y-6">
        <ZoneBar title="Back-End DTI (All Debts)" dti={backEnd} zones={BACK_ZONES} band={be}
          ariaLabel={`Back-end DTI gauge showing ${shown(backEnd).toFixed(1)} percent, rated ${be.label}`} />
        <ZoneBar title="Front-End DTI (Housing Only)" dti={frontEnd} zones={FRONT_ZONES} band={fe}
          ariaLabel={`Front-end DTI gauge showing ${shown(frontEnd).toFixed(1)} percent, rated ${fe.label}`} />

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Common lender DTI benchmarks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div><span className="text-emerald-700 font-bold">28 / 36%</span> <span className="text-slate-600">Conventional guideline (front / back)</span></div>
            <div><span className="text-orange-700 font-bold">31 / 43%</span> <span className="text-slate-600">FHA baseline (front / back)</span></div>
            <div><span className="text-red-700 font-bold">45%</span> <span className="text-slate-600">Fannie Mae manual-underwriting max</span></div>
            <div><span className="text-red-800 font-bold">50%</span> <span className="text-slate-600">Fannie Mae DU max</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DtiPanel({ frontEnd, backEnd }: { frontEnd: number; backEnd: number }) {
  return <DTIGauge frontEnd={frontEnd} backEnd={backEnd} />;
}
