import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResultValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

function ThroughputGauge({ rps, maxRpm }: { rps: number; maxRpm: number }) {
  const width = 240;
  const height = 130;
  const cx = width / 2;
  const cy = 105;
  const r = 85;
  const strokeW = 14;

  const pct = Math.min(1, rps / Math.max(1000, maxRpm / 10));
  const startAngle = -Math.PI * 0.7;
  const endAngle = Math.PI * 0.7;
  const totalArc = endAngle - startAngle;
  const needleAngle = startAngle + pct * totalArc;
  const needleLen = r - strokeW - 2;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const arcPath = (start: number, end: number, color: string) => {
    const sa = startAngle + start * totalArc;
    const ea = startAngle + end * totalArc;
    const large = ea - sa > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    return <path d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '150px' }} role="img" aria-label={`API throughput gauge showing ${rps.toFixed(0)} requests per second with low, moderate, and high zones`}>
      {arcPath(0, 0.33, '#10b981')}
      {arcPath(0.33, 0.66, '#f59e0b')}
      {arcPath(0.66, 1, '#ef4444')}

      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#1e293b" />

      <text x={cx} y={cy + 26} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#1e293b">
        {rps.toFixed(0)} RPS
      </text>

      <text x={cx - 70} y={height - 2} textAnchor="middle" fontSize={7} fill="#10b981">Low</text>
      <text x={cx} y={height - 2} textAnchor="middle" fontSize={7} fill="#f59e0b">Moderate</text>
      <text x={cx + 70} y={height - 2} textAnchor="middle" fontSize={7} fill="#ef4444">High</text>
    </svg>
  );
}

function TrafficFlow({ rps, serverLabel }: { rps: number; serverLabel: string }) {
  const userCount = Math.max(3, Math.min(8, Math.round(rps / 50)));
  const users = Array.from({ length: userCount }, (_, i) => i);
  const serverX = 240;
  const userStartX = 40;

  return (
    <svg viewBox="0 0 280 100" className="w-full" style={{ maxHeight: '110px' }} role="img" aria-label={`Network traffic flow diagram showing ${users.length} users connecting to ${serverLabel}`}>
      {/* Users */}
      {users.map((_, i) => {
        const x = userStartX + (i * 20);
        const y = 30 + (i % 2 === 0 ? 0 : 25);
        return (
          <g key={`item-${i}`}>
            <circle cx={x} cy={y} r={6} fill="#3b82f6" opacity={0.7} />
            <circle cx={x} cy={y} r={3} fill="#3b82f6" />
          </g>
        );
      })}

      {/* Arrow */}
      <line x1={userStartX + userCount * 20} y1={55} x2={serverX - 20} y2={55} stroke="#94a3b8" strokeWidth={1.5} />
      <polygon points={`${serverX - 16},55 ${serverX - 26},49 ${serverX - 26},61`} fill="#94a3b8" />

      {/* Server */}
      <rect x={serverX - 18} y={38} width={36} height={34} rx={5} fill="#1e293b" />
      <rect x={serverX - 12} y={44} width={24} height={22} rx={3} fill="#334155" />
      <text x={serverX} y={58} textAnchor="middle" fontSize={8} fill="#94a3b8">Server</text>

      <text x={130} y={90} textAnchor="middle" fontSize={7} fill="#94a3b8">
        {users.length} users → {serverLabel}
      </text>
    </svg>
  );
}

export default function RateLimitPanel({ values, results }: Props) {
  if (!results.length) return null;

  const rpsStr = getResultValue(results, 'rps');
  const bandwidthKbpsStr = getResultValue(results, 'bandwidthKbps');
  const bandwidthMbpsStr = getResultValue(results, 'bandwidthMbps');
  const dailyCapacityStr = getResultValue(results, 'dailyCapacity');
  const burstLimitStr = getResultValue(results, 'burstLimit');
  const maxConcurrentStr = getResultValue(results, 'maxConcurrent');
  const serverTypeStr = getResultValue(results, 'serverType');
  const perUserRpmStr = getResultValue(results, 'perUserRpm');

  const rps = parseFloat(rpsStr) || 0;
  const rpm = parseFloat(values.maxRpm) || 0;
  const serverType = values.serverType || 'custom';
  const serverLabel =
    serverType === 'aws-api-gateway'
      ? 'AWS API Gateway'
      : serverType === 'cloudflare'
      ? 'Cloudflare'
      : serverType === 'nginx'
      ? 'Nginx'
      : 'Custom';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-700">
          API Throughput Analysis
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Throughput Gauge + Traffic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">
              Throughput
            </p>
            <ThroughputGauge rps={rps} maxRpm={rpm} />
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">
              Traffic Flow
            </p>
            <TrafficFlow rps={rps} serverLabel={serverLabel} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              RPS
            </div>
            <div className="text-sm font-bold text-slate-700">{rpsStr}</div>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Bandwidth
            </div>
            <div className="text-sm font-bold text-slate-700">{bandwidthMbpsStr}</div>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Daily Capacity
            </div>
            <div className="text-sm font-bold text-slate-700">
              {dailyCapacityStr}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Server Type
            </div>
            <div className="text-sm font-bold text-slate-700">{serverTypeStr}</div>
          </div>
        </div>

        {/* Burst vs Steady State */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Burst vs. Sustained Capacity
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-500 mb-0.5">
                  Sustained (RPM)
                </div>
                <div className="text-lg font-black text-slate-800">
                  {(rpm || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-amber-500 mb-0.5">
                  Burst Limit
                </div>
                <div className="text-lg font-black text-slate-800">{burstLimitStr}</div>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500"
                style={{
                  width: `${Math.min(100, ((rpm || 0) / Math.max(1, parseFloat(burstLimitStr.replace(/,/g, '')) || rpm || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>Sustained</span>
              <span>Burst</span>
            </div>
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 px-2.5 py-1.5">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
              Bandwidth (KB/s)
            </div>
            <div className="text-xs font-bold text-slate-700">{bandwidthKbpsStr}</div>
          </div>
          <div className="rounded-lg border border-slate-200 px-2.5 py-1.5">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
              Max Concurrent
            </div>
            <div className="text-xs font-bold text-slate-700">{maxConcurrentStr}</div>
          </div>
          <div className="rounded-lg border border-slate-200 px-2.5 py-1.5">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
              RPM / User
            </div>
            <div className="text-xs font-bold text-slate-700">{perUserRpmStr}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
