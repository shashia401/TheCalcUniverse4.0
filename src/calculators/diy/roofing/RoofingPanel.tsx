import { CalculatorResult } from '../../../types/calculator';

interface Materials {
  bundles: number;
  squares: number;
  feltRolls: number;
  nailsLbs: number;
  ridgeLength: string;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResult(results: Props['results'], id: string) {
  return results.find((r) => r.id === id);
}

function RoofDiagramSVG({ pitch, roofType }: { pitch: string; roofType: string }) {
  const pitchNum = pitch == null ? 6 : parseInt(pitch) || 0;
  const angle = Math.atan(pitchNum / 12) * (180 / Math.PI);
  const isHip = roofType === 'hip';

  const w = 280;
  const h = 160;
  const peakY = 40;
  const baseY = 140;
  const leftX = 40;
  const rightX = 240;
  const midX = (leftX + rightX) / 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px]" role="img" aria-label={'Roof diagram showing ' + (isHip ? 'hip roof' : 'gable roof') + ' with pitch ' + pitch + '/12'}>
      {isHip ? (
        <>
          <polygon points={`${leftX},${baseY} ${midX},${peakY} ${rightX},${baseY}`} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={2} />
          <polygon points={`${midX},${peakY} ${rightX},${baseY} ${midX + (rightX - midX) / 2},${baseY}`} fill="#bae6fd" stroke="#0ea5e9" strokeWidth={1} opacity={0.5} />
          <polygon points={`${leftX},${baseY} ${midX - (midX - leftX) / 2},${baseY} ${midX},${peakY}`} fill="#7dd3fc" stroke="#0ea5e9" strokeWidth={1} opacity={0.5} />
        </>
      ) : (
        <>
          <rect x={leftX} y={baseY - 8} width={rightX - leftX} height={8} fill="#d1d5db" stroke="#9ca3af" strokeWidth={1} rx={1} />
          <polygon points={`${leftX},${baseY} ${midX},${peakY} ${rightX},${baseY}`} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={2} />
        </>
      )}
      <line x1={leftX} y1={baseY} x2={midX} y2={peakY} stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="4 2" />
      <line x1={midX} y1={baseY} x2={midX} y2={peakY} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={midX} y1={baseY} x2={rightX} y2={baseY} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />
      <text x={midX + 8} y={(baseY + peakY) / 2} fontSize={10} fill="#475569" fontWeight="bold">
        {pitchNum}/12
      </text>
      <text x={midX} y={baseY + 16} textAnchor="middle" fontSize={10} fill="#64748b">
        {isHip ? 'Hip Roof (5% extra)' : 'Gable Roof'}
      </text>
      <text x={leftX - 4} y={baseY + 16} textAnchor="end" fontSize={9} fill="#94a3b8">
        {angle.toFixed(1)}&deg;
      </text>
    </svg>
  );
}

function PitchBarSVG({ pitch }: { pitch: string }) {
  const pitchNum = pitch == null ? 6 : parseInt(pitch) || 0;
  const maxPitch = 12;
  const pct = (pitchNum / maxPitch) * 100;

  return (
    <div className="w-full">
      <svg viewBox="0 0 260 40" className="w-full" role="img" aria-label="Roof pitch bar scale from 0/12 to 12/12">
        <rect x={0} y={14} width={240} height={12} rx={6} fill="#e2e8f0" />
        <rect x={0} y={14} width={pct * 2} height={12} rx={6} fill={pitchNum >= 8 ? '#f59e0b' : '#22c55e'} />
        {[2, 4, 6, 8, 10, 12].map((v) => (
          <g key={v}>
            <line x1={(v / 12) * 240} y1={14} x2={(v / 12) * 240} y2={26} stroke="#94a3b8" strokeWidth={0.5} />
            <text x={(v / 12) * 240} y={36} textAnchor="middle" fontSize={8} fill="#94a3b8">{v}/12</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function RoofingPanel({ values, results }: Props) {
  const matStr = getResult(results, 'materialsList')?.value;
  let mats: Materials | null = null;
  if (matStr) {
    try {
      mats = JSON.parse(matStr);
      // Guard against NaN values in material counts
      if (mats) {
        mats.bundles = isFinite(mats.bundles) ? mats.bundles : 0;
        mats.squares = isFinite(mats.squares) ? mats.squares : 0;
        mats.feltRolls = isFinite(mats.feltRolls) ? mats.feltRolls : 0;
        mats.nailsLbs = isFinite(mats.nailsLbs) ? mats.nailsLbs : 0;
        mats.ridgeLength = isFinite(parseFloat(mats.ridgeLength)) ? mats.ridgeLength : '0';
      }
    } catch { /* ignore */ }
  }

  const squaresRes = getResult(results, 'squares');
  const bundlesRes = getResult(results, 'bundles');

  if (!mats) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Roofing Material Estimate</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-center">
            <p className="text-3xl font-black text-blue-700">{squaresRes?.value?.replace(' squares', '') || '0'}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mt-1">Squares Needed</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-center">
            <p className="text-3xl font-black text-emerald-700">{bundlesRes?.value?.replace(' bundles', '') || '0'}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mt-1">Shingle Bundles</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 justify-center">
          <RoofDiagramSVG pitch={values.pitch || '6'} roofType={values.roofType || 'gable'} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Pitch Multiplier</p>
          <PitchBarSVG pitch={values.pitch || '6'} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Shopping List</p>
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            {[
              { label: 'Shingle Bundles', value: `${mats.bundles} bundles (${mats.squares} squares)` },
              { label: 'Felt Paper Rolls', value: `${mats.feltRolls} rolls (covers ~400 sq ft each)` },
              { label: 'Roofing Nails', value: `~${mats.nailsLbs} lbs (2 lbs per square)` },
              { label: 'Ridge Length', value: `${mats.ridgeLength} ft` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <p className="text-sm font-bold text-amber-800">Home Depot Ready</p>
          <p className="text-sm text-amber-700 mt-1">
            Take this list to Home Depot or your local supplier.
            Standard architectural shingles come in 3-bundle squares.
            Felt paper comes in rolls covering ~400 sq ft each.
          </p>
        </div>
      </div>
    </div>
  );
}
