import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function YouTubeRevenuePanel({ results }: Props) {
  const dailyRevenue = results.find((r) => r.id === 'dailyRevenue')?.value ?? '$0.00';
  const monthlyRevenue = results.find((r) => r.id === 'monthlyRevenue')?.value ?? '$0.00';
  const yearlyRevenue = results.find((r) => r.id === 'yearlyRevenue')?.value ?? '$0.00';
  const effectiveCpm = results.find((r) => r.id === 'effectiveCpm')?.value ?? '$0.00';
  const rpm = results.find((r) => r.id === 'rpm')?.value ?? '$0.00';
  const niche = results.find((r) => r.id === 'niche')?.value ?? '';
  const dailyViews = results.find((r) => r.id === 'dailyViews')?.value ?? '0';

  const dailyNum = parseFloat(dailyRevenue.replace(/[^0-9.]/g, ''));
  const monthlyNum = parseFloat(monthlyRevenue.replace(/[^0-9.]/g, ''));
  const yearlyNum = parseFloat(yearlyRevenue.replace(/[^0-9.]/g, ''));
  const maxBar = Math.max(dailyNum, monthlyNum / 30, yearlyNum / 365, 1);

  const barHeight = (val: number, max: number) => Math.max((val / max) * 120, 4);

  return (
    <div className="space-y-5">
      {/* Bar Chart Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <rect x="4" y="12" width="4" height="8" rx="1" />
            <rect x="10" y="6" width="4" height="14" rx="1" />
            <rect x="16" y="9" width="4" height="11" rx="1" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Revenue Comparison</span>
        </div>
        <div className="p-6">
          {/* SVG Bar Chart */}
          <div className="flex items-end justify-center gap-8 mb-4 h-36">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">Daily</span>
              <svg width="32" role="img" height="120" viewBox="0 0 32 120" aria-label={`Daily revenue bar: ${dailyRevenue}`}>
                <rect x="4" y={120 - barHeight(dailyNum, maxBar)} width="24" height={barHeight(dailyNum, maxBar)} rx="4" fill="#3b82f6" opacity="0.8" />
              </svg>
              <span className="text-[9px] font-bold text-slate-600">{dailyRevenue}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">Monthly</span>
              <svg width="32" role="img" height="120" viewBox="0 0 32 120" aria-label={`Monthly revenue bar: ${monthlyRevenue}`}>
                <rect x="4" y={120 - barHeight(monthlyNum / 30, maxBar)} width="24" height={barHeight(monthlyNum / 30, maxBar)} rx="4" fill="#8b5cf6" opacity="0.8" />
              </svg>
              <span className="text-[9px] font-bold text-slate-600">{monthlyRevenue}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">Yearly</span>
              <svg width="32" role="img" height="120" viewBox="0 0 32 120" aria-label={`Yearly revenue bar: ${yearlyRevenue}`}>
                <rect x="4" y={120 - barHeight(yearlyNum / 365, maxBar)} width="24" height={barHeight(yearlyNum / 365, maxBar)} rx="4" fill="#22c55e" opacity="0.8" />
              </svg>
              <span className="text-[9px] font-bold text-slate-600">{yearlyRevenue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Card - Prominent */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Estimated Monthly Revenue</p>
        <p className="text-4xl font-black mt-2">{monthlyRevenue}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-violet-400/30">
          <div>
            <p className="text-[10px] text-violet-200">Daily</p>
            <p className="text-sm font-bold">{dailyRevenue}</p>
          </div>
          <div>
            <p className="text-[10px] text-violet-200">Yearly</p>
            <p className="text-sm font-bold">{yearlyRevenue}</p>
          </div>
          <div>
            <p className="text-[10px] text-violet-200">CPM</p>
            <p className="text-sm font-bold">{effectiveCpm}</p>
          </div>
        </div>
      </div>

      {/* CPM & Metrics Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">CPM & Performance Metrics</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Niche</p>
              <p className="text-lg font-black text-slate-700 mt-1">{niche}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Effective CPM</p>
              <p className="text-lg font-black text-slate-700 mt-1">{effectiveCpm}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">RPM</p>
              <p className="text-lg font-black text-slate-700 mt-1">{rpm}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Views (Daily)</p>
              <p className="text-lg font-black text-slate-700 mt-1">{dailyViews}</p>
            </div>
          </div>

          {/* CPM Range Visualization */}
          <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">CPM Range for {niche}</p>
            <div className="relative h-4 bg-indigo-100 rounded-full overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 100 16" preserveAspectRatio="none" className="absolute inset-0" aria-hidden="true">
                <defs>
                  <linearGradient id="cpmGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#c7d2fe" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="16" rx="8" fill="url(#cpmGradient)" />
              </svg>
              <div
                className="absolute top-0 h-4 w-1 bg-white border-2 border-indigo-600 rounded-full shadow-md"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-indigo-500 mt-1">
              <span>$0</span>
              <span className="font-bold text-indigo-700">{effectiveCpm}</span>
              <span>$25+</span>
            </div>
          </div>

          {/* Yearly Revenue Prominent */}
          <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="24" aria-hidden="true" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">At this rate you would earn</p>
                <p className="text-2xl font-black text-emerald-700">{yearlyRevenue} / year</p>
              </div>
            </div>
          </div>

          {/* Social sharing style card */}
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="20" aria-hidden="true" height="20" viewBox="0 0 24 24" fill="#dc2626">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <p>Share your estimated YouTube revenue projection.</p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  Based on {dailyViews} daily views in the {niche} niche with {effectiveCpm} CPM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
