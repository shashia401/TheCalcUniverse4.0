import type { CalculatorResult } from '../../../types/calculator';
import { Ruler, Info, ArrowLeftRight, AlertTriangle } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

interface SisterSize {
  band: number;
  cup: string;
  size: string;
}

interface Measurements {
  unit: string;
  underbustSnug: string;
  bustAverage: number;
  difference: number;
}

export default function BraSizePanel({ results }: Props) {
  const size = getValue(results, 'size');
  const bandSize = getValue(results, 'bandSize');
  const cupSize = getValue(results, 'cupSize');
  const sisterSizesRaw = getValue(results, 'sisterSizes');
  const measurementsRaw = getValue(results, 'measurements');

  if (!size) return null;

  // Parse sister sizes from {"sisterDown":{...},"sisterUp":{...}}
  let sisterDown: SisterSize | null = null;
  let sisterUp: SisterSize | null = null;
  try {
    const parsed = JSON.parse(sisterSizesRaw);
    sisterDown = parsed.sisterDown ?? null;
    sisterUp = parsed.sisterUp ?? null;
  } catch {
    // ignore parse errors
  }

  // Parse measurements
  let measurements: Measurements | null = null;
  try {
    measurements = JSON.parse(measurementsRaw) as Measurements;
  } catch {
    // ignore
  }

  const unit = measurements?.unit === 'cm' ? 'cm' : 'in';

  return (
    <div className="space-y-6">
      {/* Recommended Size Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-pink-50 to-rose-50">
          <Ruler size={18} className="text-pink-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-pink-600">
            Your Recommended Size
          </span>
        </div>
        <div className="p-8 text-center">
          <p className="text-6xl sm:text-7xl font-black tracking-tight text-pink-700">
            {size}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Band <strong>{bandSize}</strong> &middot; Cup <strong>{cupSize}</strong>
          </p>
        </div>
      </div>

      {/* Sister Sizes Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
          <ArrowLeftRight size={16} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Sister Sizes (Same Cup Volume)
          </span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-2xl font-bold text-slate-500">
                {sisterDown?.size || (isFinite(parseInt(bandSize, 10)) ? `${parseInt(bandSize, 10) - 2}?` : '—')}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                Smaller Band
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-pink-50 border-2 border-pink-300 shadow-sm">
              <p className="text-2xl font-black text-pink-700">{size}</p>
              <p className="text-xs text-pink-500 mt-1 font-medium uppercase tracking-wide">
                Recommended
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-2xl font-bold text-slate-500">
                {sisterUp?.size || (isFinite(parseInt(bandSize, 10)) ? `${parseInt(bandSize, 10) + 2}?` : '—')}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                Larger Band
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 text-center leading-relaxed">
            Sister sizes hold the same cup volume on different band lengths.
            Try the recommended size first, then experiment with sister sizes if needed.
          </p>
        </div>
      </div>

      {/* Measurements Summary */}
      {measurements && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <Info size={16} className="text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              Measurements Used
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-slate-100">
            <div className="p-5 text-center">
              <p className="text-lg font-bold text-slate-700">
                {measurements.underbustSnug}
                <span className="text-xs text-slate-500 ml-0.5">{unit}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                Snug Underbust
              </p>
            </div>
            <div className="p-5 text-center">
              <p className="text-lg font-bold text-slate-700">
                {measurements.bustAverage.toFixed(1)}
                <span className="text-xs text-slate-500 ml-0.5">{unit}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                Avg Bust
              </p>
            </div>
            <div className="p-5 text-center">
              <p className="text-lg font-bold text-slate-700">
                {measurements.difference.toFixed(1)}
                <span className="text-xs text-slate-500 ml-0.5">in</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                Difference
              </p>
            </div>
            <div className="p-5 text-center">
              <p className="text-lg font-bold text-emerald-700">{size}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                Final Size
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Why 6 Measurements */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <AlertTriangle size={16} className="text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Why Six Measurements?
          </span>
        </div>
        <div className="p-6 space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong className="text-amber-700">Your body is 3-dimensional.</strong> A single bust
            measurement can't capture the full picture. Breast tissue shifts — it spreads out when
            you lie down, projects forward when you lean, and settles naturally when you stand.
          </p>
          <p>
            <strong className="text-amber-700">Three underbust measurements</strong> (loose, snug,
            tight) help determine the ideal band size that is supportive without being
            uncomfortable. The snug measurement is the primary reference, while loose and tight
            provide context for tissue compressibility.
          </p>
          <p>
            <strong className="text-amber-700">Three bust measurements</strong> (standing, leaning,
            lying) together give a much more accurate estimate of cup volume than any single
            measurement. The average accounts for different breast shapes and tissue densities.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            This is the &ldquo;A Bra That Fits&rdquo; (ABTF) methodology, widely regarded as the
            most accurate approach to bra sizing available without professional fitting.
          </p>
        </div>
      </div>
    </div>
  );
}
