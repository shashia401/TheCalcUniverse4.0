import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function EngagementRatePanel({ results }: Props) {
  const er = results.find(r => r.id === 'engagementRate');
  const totalEng = results.find(r => r.id === 'totalEngagements');
  const followers = results.find(r => r.id === 'followersUsed');
  const benchmark = results.find(r => r.id === 'benchmark');
  const tier = results.find(r => r.id === 'influencerTier');

  if (!er) return null;

  const erVal = parseNum(er.value);
  const maxER = 10;
  const pct = Math.min((erVal / maxER) * 100, 100);

  const getBarColor = (v: number) =>
    v >= 3.5 ? 'bg-emerald-500' : v >= 1 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Engagement Rate</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-pink-600">Engagement Rate</p>
          <p className="text-3xl font-bold text-pink-700">{er.value}</p>
          {tier && <p className="text-xs text-pink-500 mt-1 font-medium">{tier.value}</p>}
        </div>

        <div>
          <div className={`h-3 rounded-full bg-slate-200 overflow-hidden`}>
            <div className={`h-full rounded-full ${getBarColor(erVal)} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>Low (0%)</span>
            <span>Avg (3.5%)</span>
            <span>High (10%)</span>
          </div>
        </div>

        {totalEng && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Total Engagements</span>
            <span className="text-sm font-bold text-slate-700">{totalEng.value}</span>
          </div>
        )}
        {followers && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Followers</span>
            <span className="text-sm font-bold text-slate-700">{followers.value}</span>
          </div>
        )}
        {benchmark && (
          <div className={`rounded-lg border px-3 py-2 ${benchmark.color === 'positive' ? 'bg-emerald-50 border-emerald-200' : benchmark.color === 'negative' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <span className={`text-xs font-bold ${benchmark.color === 'positive' ? 'text-emerald-700' : benchmark.color === 'negative' ? 'text-red-700' : 'text-amber-700'}`}>
              {benchmark.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
