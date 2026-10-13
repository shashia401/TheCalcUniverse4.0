import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { NICHE_RANGES, DEFAULT_AD_RATE_PCT, computeYouTube, nicheMidCpm } from './youtubeMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd0 = (n: number) => `$${Math.round(n).toLocaleString(undefined)}`;

export default function YouTubeRevenuePanel({ values, results }: Props) {
  const dailyViews = parseFloat(values.dailyViews);
  const range = NICHE_RANGES[values.niche];
  if (!results.length || !(dailyViews > 0) || !range) return null;
  const custom = values.cpm !== '' && values.cpm !== undefined ? parseFloat(values.cpm) : NaN;
  const hasCustom = Number.isFinite(custom) && custom > 0;
  const cpm = hasCustom ? custom : nicheMidCpm(values.niche);
  const adRaw = values.adRate !== '' && values.adRate !== undefined ? parseFloat(values.adRate) : DEFAULT_AD_RATE_PCT;
  const adRate = Number.isFinite(adRaw) ? adRaw : DEFAULT_AD_RATE_PCT;

  const f = computeYouTube(dailyViews, cpm, adRate);
  const low = computeYouTube(dailyViews, range.min, adRate);
  const high = computeYouTube(dailyViews, range.max, adRate);
  const find = (id: string) => results.find((r) => r.id === id)?.value ?? '';

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-purple-900 shadow-lg p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-100">Estimated Monthly Revenue</p>
        <p className="text-4xl font-black mt-2">{find('monthlyRevenue')}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-violet-400/30">
          <div>
            <p className="text-[10px] text-violet-100">Daily</p>
            <p className="text-sm font-bold">{find('dailyRevenue')}</p>
          </div>
          <div>
            <p className="text-[10px] text-violet-100">Yearly</p>
            <p className="text-sm font-bold">{find('yearlyRevenue')}</p>
          </div>
          <div>
            <p className="text-[10px] text-violet-100">RPM</p>
            <p className="text-sm font-bold">{find('rpm')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Monthly revenue across the {range.label} CPM range</span>
        </div>
        <div className="p-6">
          <SvgBarChart
            ariaLabel={`Estimated monthly revenue at the low, selected and high CPM for ${range.label}`}
            data={[
              { label: `$${range.min} CPM`, value: low.monthly, color: '#64748b' },
              { label: hasCustom ? `Yours $${cpm}` : `Mid $${cpm}`, value: f.monthly, color: '#6d28d9' },
              { label: `$${range.max} CPM`, value: high.monthly, color: '#64748b' },
            ]}
            format={usd0}
          />
          <p className="text-[11px] text-slate-600 mt-3">
            The niche range ({`$${range.min}-$${range.max}`} CPM) is a rough planning estimate, not a YouTube figure. Real CPM depends heavily on where your viewers are, the season and the video format, so use your own CPM when you have it.
          </p>
        </div>
      </div>
    </div>
  );
}
