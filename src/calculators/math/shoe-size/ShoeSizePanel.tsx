import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

const COLOR_CLASSES: Record<string, { gradient: string; text600: string; text700: string; }> = {
  blue: { gradient: 'from-blue-50 to-blue-100/60', text600: 'text-blue-600', text700: 'text-blue-700' },
  indigo: { gradient: 'from-indigo-50 to-indigo-100/60', text600: 'text-indigo-600', text700: 'text-indigo-700' },
  purple: { gradient: 'from-purple-50 to-purple-100/60', text600: 'text-purple-600', text700: 'text-purple-700' },
  emerald: { gradient: 'from-emerald-50 to-emerald-100/60', text600: 'text-emerald-600', text700: 'text-emerald-700' },
};

const SIZE_SYSTEMS = [
  { id: 'usSize', label: 'US', sublabel: 'Size', color: 'blue' },
  { id: 'ukSize', label: 'UK', sublabel: 'Size', color: 'indigo' },
  { id: 'euSize', label: 'EU', sublabel: 'Size', color: 'purple' },
  { id: 'jpSize', label: 'JP', sublabel: 'CM', color: 'emerald' },
] as const;

export default function ShoeSizePanel({ results }: Props) {
  const usSize = getValue(results, 'usSize');
  const ukSize = getValue(results, 'ukSize');
  const euSize = getValue(results, 'euSize');
  const jpSize = getValue(results, 'jpSize');
  const footLength = getValue(results, 'footLength');
  const genderLabel = getValue(results, 'genderLabel');
  const note = getValue(results, 'conversionNote');

  if (!usSize || !ukSize || !euSize || !jpSize) return null;

  const sizes = [usSize, ukSize, euSize, jpSize];
  const maxSize = Math.max(...sizes.map(Number));
  const minSize = Math.min(...sizes.map(Number));
  const range = maxSize - minSize || 1;

  return (
    <div className="space-y-5">
      {/* Size Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SIZE_SYSTEMS.map((sys, i) => {
          const val = sizes[i];
          return (
            <div
              key={sys.id}
              className={`rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden`}
            >
              <div
                className={`px-4 py-3 text-center border-b border-slate-100 bg-gradient-to-r ${COLOR_CLASSES[sys.color].gradient}`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${COLOR_CLASSES[sys.color].text600}`}
                >
                  {sys.label}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">
                  {sys.sublabel}
                </span>
              </div>
              <div className="py-5 text-center">
                <p
                  className={`text-3xl sm:text-4xl font-black tracking-tight ${COLOR_CLASSES[sys.color].text700}`}
                >
                  {val}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Ruler */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Size Comparison Ruler
          </span>
        </div>
        <div className="p-5">
          <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
            {SIZE_SYSTEMS.map((sys, i) => {
              const val = Number(sizes[i]);
              const left = ((val - minSize) / range) * 100;
              return (
                <div
                  key={sys.id}
                  className="absolute top-0 h-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    left: `${left}%`,
                    width: `${60 / 4}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="w-px h-full bg-white/40" />
                  <span
                    className={`absolute top-full mt-1 ${COLOR_CLASSES[sys.color].text600} font-bold text-xs`}
                  >
                    {sys.label} {sizes[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Foot Length + Gender Badge row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Foot Length */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50">
            <svg
              className="w-4 h-4 text-sky-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
              Foot Length
            </span>
          </div>
          <div className="py-4 px-5 text-center">
            <p className="text-3xl font-black tracking-tight text-sky-700">
              {footLength}
            </p>
          </div>
        </div>

        {/* Gender Badge */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              Size System
            </span>
          </div>
          <div className="py-4 px-5 text-center">
            <span className="inline-block rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700">
              {genderLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Brand disclaimer */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4">
          <svg
            className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
              Brand Disclaimer
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">{note}</p>
          </div>
        </div>
      </div>

      {/* Conversion Hint */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
          <svg
            className="w-4 h-4 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Conversion Hint
          </span>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            If you{'\''}re a US Men{'\''}s <strong>{usSize}</strong>, you{'\''}re approximately
            a UK <strong>{ukSize}</strong> and wear about a <strong>{euSize}</strong> in European sizing.
            Your foot is roughly <strong>{footLength}</strong> long.
          </p>
        </div>
      </div>
    </div>
  );
}
