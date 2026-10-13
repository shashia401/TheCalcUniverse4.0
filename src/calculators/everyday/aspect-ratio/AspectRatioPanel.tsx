import { CalculatorResult } from '../../../types/calculator';
import { aspectInfo } from './aspectMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function AspectRatioPanel({ values, results }: Props) {
  // Same pure function index.ts uses - never parse the formatted result strings.
  const a = aspectInfo(values);
  const orientationR = results.find(r => r.id === 'orientation');
  const widthR = results.find(r => r.id === 'widthResult' || r.id === 'givenWidth');
  const heightR = results.find(r => r.id === 'heightResult' || r.id === 'givenHeight');
  const presetR = results.find(r => r.id === 'presetMatch');

  if (!a) return null;

  const ratioStr = `${a.ratioW}:${a.ratioH}`;
  const maxDim = Math.max(a.width, a.height);
  const rectW = Math.max((a.width / maxDim) * 180, 6);
  const rectH = Math.max((a.height / maxDim) * 180, 6);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ratio Visual</span>
      </div>
      <div className="p-5 flex flex-col items-center gap-4">
        {/* SVG rectangle */}
        <svg role="img" aria-label={`Rectangle drawn to the ${ratioStr} aspect ratio`} width={Math.max(rectW + 40, 100)} height={rectH + 40} viewBox={`0 0 ${Math.max(rectW + 40, 100)} ${rectH + 40}`} className="max-w-full">
          <rect x="20" y="20" width={rectW} height={rectH} rx="4" fill="#1d4ed8" fillOpacity="0.12" stroke="#1d4ed8" strokeWidth="2" />
          <text x={20 + rectW / 2} y={20 + rectH / 2 + 4} fontFamily="system-ui,sans-serif" fontSize="13" fill="#1d4ed8" fontWeight="700" textAnchor="middle">{ratioStr}</text>
        </svg>

        {/* Dimensions */}
        {widthR && heightR && (
          <div className="flex gap-4 text-center">
            <div className="rounded-lg border border-slate-200 px-4 py-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase">Width</p>
              <p className="text-sm font-bold text-slate-700">{widthR.value}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-4 py-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase">Height</p>
              <p className="text-sm font-bold text-slate-700">{heightR.value}</p>
            </div>
          </div>
        )}

        {orientationR && (
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              orientationR.value === 'Square' ? 'bg-amber-100 text-amber-700' :
              orientationR.value === 'Portrait' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {orientationR.value}
            </span>
            {presetR && (
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                {presetR.value}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
