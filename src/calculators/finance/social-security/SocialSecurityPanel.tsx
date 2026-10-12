import { Shield } from 'lucide-react';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { fraLabel } from './ssMath';

interface Props {
  fra: number;
  pia: number;
  benefitAt62: number;
  benefitAtFRA: number;
  benefitAt70: number;
  benefitAtChosen: number;
  retirementAge: number;
  birthYear: number;
  annualIncome: number;
}

const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtK = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`);

export default function SocialSecurityPanel({ fra, pia, benefitAt62, benefitAtFRA, benefitAt70, benefitAtChosen, retirementAge }: Props) {
  const pct = (b: number) => (benefitAtFRA > 0 ? ((b / benefitAtFRA) * 100).toFixed(0) : '0');
  // Cumulative benefits received by each age if claiming at 62, FRA or 70 (flat benefits, no COLA or discounting).
  const ages = Array.from({ length: 26 }, (_, i) => 62 + i);
  const cumulative = (benefit: number, start: number) => ages.map((age) => ({ x: age, y: Math.max(0, age - start) * 12 * benefit }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Shield size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Social Security Benefit Comparison</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Monthly Benefit by Claiming Age</p>
          <SvgBarChart
            ariaLabel={`Monthly benefit at 62, at full retirement age ${fraLabel(fra)} and at 70; your choice is age ${retirementAge} at ${fmt(benefitAtChosen)}`}
            data={[
              { label: 'Age 62', value: benefitAt62, color: '#c2410c' },
              { label: `FRA ${fraLabel(fra)}`, value: benefitAtFRA, color: '#1d4ed8' },
              { label: 'Age 70', value: benefitAt70, color: '#047857' },
            ]}
            format={fmt}
            height={200}
            maxBarWidth={80}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-3 text-center">
            <p className="text-[10px] text-orange-800 font-semibold uppercase tracking-wider">Age 62</p>
            <p className="text-base font-black text-orange-800">{fmt(benefitAt62)}<span className="text-xs font-normal">/mo</span></p>
            <p className="text-[10px] text-orange-800">{pct(benefitAt62)}% of FRA</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-3 text-center">
            <p className="text-[10px] text-blue-800 font-semibold uppercase tracking-wider">FRA ({fraLabel(fra)})</p>
            <p className="text-base font-black text-blue-800">{fmt(benefitAtFRA)}<span className="text-xs font-normal">/mo</span></p>
            <p className="text-[10px] text-blue-800">100% — PIA</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 text-center">
            <p className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">Age 70</p>
            <p className="text-base font-black text-emerald-800">{fmt(benefitAt70)}<span className="text-xs font-normal">/mo</span></p>
            <p className="text-[10px] text-emerald-800">{pct(benefitAt70)}% of FRA</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Lifetime Cumulative Benefits</p>
          <SvgLineChart
            ariaLabel="Cumulative Social Security benefits by age for claiming at 62, at full retirement age, and at 70"
            series={[
              { name: 'Claim at 62', color: '#c2410c', points: cumulative(benefitAt62, 62) },
              { name: `Claim at FRA ${fraLabel(fra)}`, color: '#1d4ed8', points: cumulative(benefitAtFRA, fra) },
              { name: 'Claim at 70', color: '#047857', points: cumulative(benefitAt70, 70) },
            ]}
            xFormat={(n) => `Age ${n}`}
            yFormat={fmtK}
          />
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1 text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-orange-700" />Claim at 62</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-blue-700" />Claim at FRA {fraLabel(fra)}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-emerald-700" />Claim at 70</span>
          </div>
          <p className="text-xs text-slate-600 mt-2">Where lines cross = break-even age. Living longer than the crossing point favors delaying claims.</p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-sm font-bold text-blue-800 mb-1">Your PIA (Primary Insurance Amount)</p>
          <p className="text-xs text-blue-800">
            Your estimated PIA is <strong>{fmt(pia)}/mo</strong> — this is what you would receive at exactly Age {fraLabel(fra)} (FRA).
            Get your official estimate at <strong>ssa.gov/myaccount</strong> for the most accurate projection based on your actual earnings record.
          </p>
        </div>
      </div>
    </div>
  );
}
