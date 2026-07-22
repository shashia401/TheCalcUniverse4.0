import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface Category {
  label: string;
  men: string;
  women: string;
}

const CATEGORIES: Category[] = [
  { label: 'Essential Fat', men: '2–6%', women: '10–14%' },
  { label: 'Athletic', men: '6–14%', women: '14–21%' },
  { label: 'Fitness', men: '14–18%', women: '21–25%' },
  { label: 'Average', men: '18–25%', women: '25–32%' },
  { label: 'Obese', men: '25%+', women: '32%+' },
];

const MEASUREMENT_GUIDE = [
  {
    label: 'Neck',
    men: 'Measure just below the larynx (Adam\'s apple). Tape should be perpendicular to the neck, not angled down. Pull snug but not tight.',
    women: 'Same as men — measure just below the larynx with the tape perpendicular to the neck.',
    image: 'neck',
  },
  {
    label: 'Abdomen (Men)',
    men: 'Measure at the level of the navel. Relax your stomach (do not suck in). Measure after exhaling normally.',
    women: 'Not used for women.',
    image: 'abdomen',
  },
  {
    label: 'Waist (Women)',
    men: 'Not used for men.',
    women: 'Measure at the narrowest point of the waist, typically halfway between the ribs and the iliac crest (hip bone).',
    image: 'waist',
  },
  {
    label: 'Hip (Women)',
    men: 'Not used for men.',
    women: 'Measure at the widest point of the hips/buttocks, typically at the level of the pubic symphysis.',
    image: 'hip',
  },
];

export default function BodyFatPanel({ values, results }: Props) {
  const bfResult = results.find(r => r.id === 'bodyFatPct');
  if (!bfResult) return null;

  const isMale = values.sex === 'male';

  // Extract the numeric BF%
  const bfPct = parseFloat(bfResult.value.replace(/%/g, ''));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Body Fat Classification & Measurement Guide</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Classification table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Category</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Men (% BF)</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Women (% BF)</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">You</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat, i) => {
                const isYou = i === CATEGORIES.findIndex(_c => {
                  if (isMale) {
                    if (cat.label === 'Essential Fat') return bfPct >= 2 && bfPct <= 6;
                    if (cat.label === 'Athletic') return bfPct > 6 && bfPct <= 14;
                    if (cat.label === 'Fitness') return bfPct > 14 && bfPct <= 18;
                    if (cat.label === 'Average') return bfPct > 18 && bfPct <= 25;
                    return bfPct > 25;
                  }
                  if (cat.label === 'Essential Fat') return bfPct >= 10 && bfPct <= 14;
                  if (cat.label === 'Athletic') return bfPct > 14 && bfPct <= 21;
                  if (cat.label === 'Fitness') return bfPct > 21 && bfPct <= 25;
                  if (cat.label === 'Average') return bfPct > 25 && bfPct <= 32;
                  return bfPct > 32;
                }) && i < CATEGORIES.length;

                return (
                  <tr key={cat.label} className={`border-b border-slate-100 last:border-0 ${isYou ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-700">{cat.label}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{cat.men}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{cat.women}</td>
                    <td className="px-3 py-2.5 text-center">
                      {isYou ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                          <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          You
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Measurement Guide */}
        <details className="group rounded-xl border border-slate-200 bg-white overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>Measurement Instructions</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100 px-4 py-3 space-y-3">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              For most accurate results: use a non-stretchable tape measure. Measure in the morning before meals.
              Take each measurement twice and average them. Have someone else measure you if possible.
            </p>
            {MEASUREMENT_GUIDE.map((guide) => {
              const isRelevant = isMale ? guide.label !== 'Waist (Women)' && guide.label !== 'Hip (Women)' : guide.label !== 'Abdomen (Men)';
              if (!isRelevant) return null;
              return (
                <div key={guide.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg aria-hidden="true" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">{guide.label}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{isMale ? guide.men : guide.women}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        {/* Medical Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Important Disclaimer</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            The U.S. Navy circumference method provides an <strong>estimate</strong> of body fat percentage with a standard error of ±2–3%.
            This is not a clinical diagnostic tool. Body composition measurements should be interpreted in context with
            other health indicators. Consult a healthcare provider, registered dietitian, or certified fitness professional
            for a comprehensive body composition assessment. Extremely low body fat (below essential fat levels) can impair
            hormonal function, immune response, and bone density.
          </p>
        </div>
      </div>
    </div>
  );
}
