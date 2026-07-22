import { VAData, fmt } from './vaTypes';

export function DonutChart({ data }: { data: VAData }) {
  const {
    principalAndInterest,
    monthlyTax,
    monthlyInsurance,
    monthlyHOA,
    totalMonthlyPayment,
  } = data;

  const segments = [
    { label: 'Principal & Interest', value: principalAndInterest, color: '#3b82f6' },
    { label: 'Property Tax', value: monthlyTax, color: '#f59e0b' },
    { label: 'Insurance', value: monthlyInsurance, color: '#94a3b8' },
    ...(monthlyHOA > 0 ? [{ label: 'HOA', value: monthlyHOA, color: '#cbd5e1' }] : []),
  ].filter((s) => s.value > 0);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return null;

  const cx = 90;
  const cy = 90;
  const outerR = 78;
  const innerR = 50;
  const viewBoxSize = 180;

  let cumulAngle = -90;

  const paths = segments.map((seg) => {
    const sliceDeg = (seg.value / total) * 360;
    const startAngle = cumulAngle;
    const endAngle = cumulAngle + sliceDeg;
    cumulAngle = endAngle;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + outerR * Math.cos(toRad(startAngle));
    const y1 = cy + outerR * Math.sin(toRad(startAngle));
    const x2 = cx + outerR * Math.cos(toRad(endAngle));
    const y2 = cy + outerR * Math.sin(toRad(endAngle));
    const ix1 = cx + innerR * Math.cos(toRad(endAngle));
    const iy1 = cy + innerR * Math.sin(toRad(endAngle));
    const ix2 = cx + innerR * Math.cos(toRad(startAngle));
    const iy2 = cy + innerR * Math.sin(toRad(startAngle));
    const large = sliceDeg > 180 ? 1 : 0;

    const d = [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
      'Z',
    ].join(' ');

    return { ...seg, d, startAngle, endAngle, sliceDeg };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className="w-44 h-44"
            role="img"
            aria-label="VA mortgage monthly payment breakdown donut chart"
          >
            {paths.map((p) => (
              <path key={p.label} d={p.d} fill={p.color} stroke="white" strokeWidth={2} />
            ))}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
              fontWeight="700"
            >
              TOTAL/MO
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fontSize={14}
              fill="#1e293b"
              fontWeight="900"
            >
              ${fmt(totalMonthlyPayment)}
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {segments.map((seg) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            return (
              <div key={seg.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs text-slate-600 truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-800">${fmt(seg.value)}</span>
                  <span className="text-[10px] text-slate-500">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-xs">&#10003;</span>
        </div>
        <p className="text-sm font-bold text-emerald-700">
          No PMI Required &mdash; VA Loan Benefit
        </p>
      </div>
    </div>
  );
}
