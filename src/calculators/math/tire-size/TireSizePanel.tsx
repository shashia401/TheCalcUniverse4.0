import React from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface TireSpec {
  width: number;
  aspect: number;
  rim: number;
  sidewall: number;
  diameter: number;
  circ: number;
  revs: number;
}

interface TireDiff {
  diamDiffPct: number;
  sidewallDiffIn: number;
  diamDiff: number;
  revDiff: number;
  actualSpeed: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResult(results: Props['results'], id: string) {
  return results.find((r) => r.id === id);
}

function SpeedometerSVG({ actualSpeed }: { actualSpeed: number }) {
  const cx = 120;
  const cy = 120;
  const r = 90;
  const startAngle = 225;
  const endAngle = -45;

  function polarToCartesian(angle: number, radius: number) {
    const rad = ((angle - 180) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(from: number, to: number, radius: number) {
    const start = polarToCartesian(from, radius);
    const end = polarToCartesian(to, radius);
    const large = to - from > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  const speed = Math.max(0, Math.min(120, actualSpeed));
  const needleAngle = startAngle - (speed / 120) * 270;
  const needleLen = r * 0.7;
  const needleEnd = polarToCartesian(needleAngle, needleLen);

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= 120; i += 10) {
    const angle = startAngle - (i / 120) * 270;
    const outer = polarToCartesian(angle, r - 5);
    const inner = polarToCartesian(angle, r - 14);
    ticks.push(
      <line key={`tick-${i}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#475569" strokeWidth={i % 20 === 0 ? 2 : 1} />
    );
    if (i % 20 === 0) {
      const label = polarToCartesian(angle, r - 22);
      ticks.push(
        <text key={`label-${i}`} x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#64748b" fontWeight="bold">
          {i}
        </text>
      );
    }
  }

  return (
    <svg viewBox="0 0 240 150" className="w-full max-w-[260px]" role="img" aria-label={'Speedometer gauge showing ' + actualSpeed.toFixed(1) + ' mph'}>
      <defs>
        <linearGradient id="speedGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="speedRed" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <path d={describeArc(startAngle, startAngle - 240, r)} fill="none" stroke="#22c55e" strokeWidth={8} opacity={0.15} />
      <path d={describeArc(startAngle - 240, endAngle, r)} fill="none" stroke="#ef4444" strokeWidth={8} opacity={0.15} />
      {ticks}
      <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#dc2626" />
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize={11} fill="#475569" fontWeight="bold">
        {actualSpeed.toFixed(1)} mph
      </text>
    </svg>
  );
}

function TireCircleSVG({ oemDiam, newDiam }: { oemDiam: number; newDiam: number }) {
  const maxD = Math.max(oemDiam, newDiam);
  const scale = maxD > 0 ? 80 / maxD : 1;
  const oemR = (oemDiam / 2) * scale;
  const newR = (newDiam / 2) * scale;

  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[300px]" role="img" aria-label="Tire size comparison diagram showing OEM and new tire diameters">
      <circle cx={70} cy={60} r={oemR} fill="none" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 3" opacity={0.7} />
      <text x={70} y={112} textAnchor="middle" fontSize={10} fill="#3b82f6" fontWeight="bold">OEM</text>
      <circle cx={130} cy={60} r={newR} fill="none" stroke="#f59e0b" strokeWidth={3} opacity={0.8} />
      <text x={130} y={112} textAnchor="middle" fontSize={10} fill="#f59e0b" fontWeight="bold">New</text>
      {oemR !== newR && (
        <>
          <line x1={70} y1={60 - oemR} x2={130} y2={60 - newR} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" />
          <text x={100} y={Math.min(60 - oemR, 60 - newR) - 6} textAnchor="middle" fontSize={9} fill="#64748b">
            {(newDiam - oemDiam).toFixed(2)}" diff
          </text>
        </>
      )}
    </svg>
  );
}

export default function TireSizePanel({ results }: Props) {
  const tireDataStr = getResult(results, 'tireData')?.value;
  let oem: TireSpec | null = null;
  let nw: TireSpec | null = null;
  let diff: TireDiff | null = null;
  if (tireDataStr) {
    try {
      const parsed = JSON.parse(tireDataStr);
      oem = parsed.oem;
      nw = parsed.new;
      diff = parsed.diff;
    } catch { /* ignore */ }
  }

  const diamDiffRes = getResult(results, 'diameterDiff');
  const speedErrorRes = getResult(results, 'speedometerError');
  const isUnsafe = diamDiffRes?.color === 'negative';
  const diamDiffVal = diff ? diff.diamDiffPct : 0;

  if (!oem || !nw || !diff) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Tire Size Comparison</span>
      </div>

      <div className="p-6 space-y-6">
        {isUnsafe && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4">
            <p className="text-sm font-bold text-red-700">Safety Warning</p>
            <p className="text-sm text-red-600 mt-1">
              Diameter change of {Math.abs(diamDiffVal).toFixed(1)}% exceeds the safe 3% threshold.
              This can affect speedometer accuracy, ABS, traction control, and may cause tire rubbing.
            </p>
          </div>
        )}

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4">
          <p className="text-lg font-black text-blue-900">
            {speedErrorRes?.value || ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-6 justify-center">
          <TireCircleSVG oemDiam={oem.diameter} newDiam={nw.diameter} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 text-center">Speedometer</p>
            <SpeedometerSVG actualSpeed={diff.actualSpeed} />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Specification Comparison</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Spec</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider">OEM</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-amber-500 uppercase tracking-wider">New</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider">Diff</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Width</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{oem.width} mm</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nw.width} mm</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                    {(nw.width - oem.width) > 0 ? '+' : ''}{(nw.width - oem.width).toFixed(0)} mm
                  </td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Aspect Ratio</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{oem.aspect}%</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nw.aspect}%</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                    {(nw.aspect - oem.aspect) > 0 ? '+' : ''}{(nw.aspect - oem.aspect).toFixed(0)}%
                  </td>
                </tr>
                <tr className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Rim Diameter</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{oem.rim}"</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nw.rim}"</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                    {(nw.rim - oem.rim) > 0 ? '+' : ''}{(nw.rim - oem.rim).toFixed(1)}"
                  </td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Sidewall Height</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{(oem.sidewall / 25.4).toFixed(2)}"</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{(nw.sidewall / 25.4).toFixed(2)}"</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{diff.sidewallDiffIn.toFixed(2)}"</td>
                </tr>
                <tr className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Overall Diameter</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{oem.diameter.toFixed(2)}"</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nw.diameter.toFixed(2)}"</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{diff.diamDiff.toFixed(2)}"</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Circumference</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{oem.circ.toFixed(1)}"</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nw.circ.toFixed(1)}"</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                    {(nw.circ - oem.circ) > 0 ? '+' : ''}{(nw.circ - oem.circ).toFixed(1)}"
                  </td>
                </tr>
                <tr className="bg-white last:border-0">
                  <td className="px-4 py-2.5 font-medium text-slate-700">Revs per Mile</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{oem.revs.toFixed(0)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{nw.revs.toFixed(0)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                    {diff.revDiff > 0 ? '+' : ''}{diff.revDiff.toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
