import { CalculatorResult } from '../../../types/calculator';
import { roundStrAuto } from '../../../lib/format';
import { solveRightTriangle } from './pythagoreanMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmt = (n: number) => roundStrAuto(n, 4);

export default function PythagoreanPanel({ values, results }: Props) {
  const solved = solveRightTriangle(values.mode, values.a, values.b, values.c);
  if (solved.kind !== 'ok' || results.length === 0) return null;
  const { mode, a: sideA, b: sideB, c: sideC, angleA, angleB } = solved.t;

  // The step text is built from the same solved sides the result rows show.
  const known = mode === 'hypotenuse' ? null : mode === 'leg_a' ? sideB : sideA;
  const stepText = mode === 'hypotenuse'
    ? `c² = a² + b² = ${fmt(sideA)}² + ${fmt(sideB)}² = ${fmt(sideA * sideA)} + ${fmt(sideB * sideB)} = ${fmt(sideA * sideA + sideB * sideB)}\nc = √(${fmt(sideA * sideA + sideB * sideB)}) = ${fmt(sideC)}`
    : `${mode === 'leg_a' ? 'a' : 'b'}² = c² − ${mode === 'leg_a' ? 'b' : 'a'}² = ${fmt(sideC)}² − ${fmt(known!)}² = ${fmt(sideC * sideC)} − ${fmt(known! * known!)} = ${fmt(sideC * sideC - known! * known!)}\n${mode === 'leg_a' ? 'a' : 'b'} = √(${fmt(sideC * sideC - known! * known!)}) = ${fmt(mode === 'leg_a' ? sideA : sideB)}`;
  const isolate = mode === 'hypotenuse' ? 'c = √(a² + b²)' : mode === 'leg_a' ? 'a = √(c² − b²)' : 'b = √(c² − a²)';

  // SVG right triangle: leg a vertical, leg b horizontal, right angle at the bottom-left corner.
  const svgW = 360;
  const svgH = 340;
  const scale = 240 / Math.max(sideA, sideB);
  const xA = 20;
  const yA = svgH - 20;
  const xB = xA + sideB * scale;
  const yC = yA - sideA * scale;

  const sinA = sideA / sideC;
  const cosA = sideB / sideC;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Right Triangle &amp; Step-by-Step Proof</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex justify-center overflow-x-auto">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img"
            aria-label={`Right triangle with legs a = ${fmt(sideA)} and b = ${fmt(sideB)} and hypotenuse c = ${fmt(sideC)}`}>
            <polyline points={`${xA + 20},${yA} ${xA + 20},${yA - 20} ${xA},${yA - 20}`} fill="none" stroke="#64748b" strokeWidth="1" />
            <polygon points={`${xA},${yA} ${xB},${yA} ${xA},${yC}`} fill="rgba(59,130,246,0.08)" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
            <text x={(xA + xB) / 2 + 14} y={(yA + yC) / 2 - 14} textAnchor="middle" fill="#b91c1c" fontSize="19" fontWeight="bold">c = {fmt(sideC)}</text>
            <text x={(xA + xB) / 2} y={yA + 30} textAnchor="middle" fill="#047857" fontSize="19" fontWeight="bold">b = {fmt(sideB)}</text>
            <text x={xA + 8} y={(yA + yC) / 2} textAnchor="start" fill="#6d28d9" fontSize="19" fontWeight="bold">a = {fmt(sideA)}</text>
            <circle cx={xA} cy={yA} r="5" fill="#2563eb" />
            <circle cx={xB} cy={yA} r="5" fill="#2563eb" />
            <circle cx={xA} cy={yC} r="5" fill="#2563eb" />
          </svg>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">Step-by-Step Proof</p>
          <div className="font-mono text-sm text-blue-800 whitespace-pre-wrap break-all">{stepText}</div>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-700"><strong>Isolate the variable:</strong> {isolate}</p>
          </div>
        </div>

        {mode === 'hypotenuse' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-2">SOH CAH TOA — Finding Angles</p>
            <div className="space-y-2 font-mono text-sm">
              <div className="bg-white rounded-lg border border-purple-200 p-2">
                <p className="text-purple-800">
                  <span className="font-bold">SOH</span> sin(α) = Opposite / Hypotenuse = a / c = {fmt(sideA)} / {fmt(sideC)} = {sinA.toFixed(4)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-purple-200 p-2">
                <p className="text-purple-800">
                  <span className="font-bold">CAH</span> cos(α) = Adjacent / Hypotenuse = b / c = {fmt(sideB)} / {fmt(sideC)} = {cosA.toFixed(4)}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-purple-200 p-2">
                <p className="text-purple-800">
                  <span className="font-bold">TOA</span> tan(α) = Opposite / Adjacent = a / b = {fmt(sideA)} / {fmt(sideB)} = {(sideA / sideB).toFixed(4)}
                </p>
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-2">
              α = sin⁻¹({sinA.toFixed(4)}) = {angleA.toFixed(4)}° &nbsp;|&nbsp; β = 90° − α = {angleB.toFixed(4)}°
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Leg a</p>
            <p className="text-sm font-bold font-mono text-slate-700 break-all">{fmt(sideA)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Leg b</p>
            <p className="text-sm font-bold font-mono text-slate-700 break-all">{fmt(sideB)}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-red-700 uppercase">Hypotenuse c</p>
            <p className="text-sm font-bold font-mono text-red-700 break-all">{fmt(sideC)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Pythagorean Theorem</p>
          <p className="text-lg font-mono font-bold text-slate-700 text-center">a² + b² = c²</p>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
            <div className="p-1 bg-white rounded border border-slate-200">
              <p className="text-slate-600">Hypotenuse</p>
              <p className="font-mono text-slate-700">c = √(a² + b²)</p>
            </div>
            <div className="p-1 bg-white rounded border border-slate-200">
              <p className="text-slate-600">Leg a</p>
              <p className="font-mono text-slate-700">a = √(c² − b²)</p>
            </div>
            <div className="p-1 bg-white rounded border border-slate-200">
              <p className="text-slate-600">Leg b</p>
              <p className="font-mono text-slate-700">b = √(c² − a²)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
