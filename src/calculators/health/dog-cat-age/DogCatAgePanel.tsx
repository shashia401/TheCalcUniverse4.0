import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DogCatAgePanel({ values, results }: Props) {
  const species = values.species || 'dog';
  const petAge = parseFloat(values.petAgeYears || '0');

  const lifeStage = results.find(r => r.id === 'lifeStage');

  if (!petAge || !lifeStage) return null;

  // Calculate human age equivalents (same logic as the main calculator)
  let traditionalHuman: number;
  let epigeneticHuman: number | null = null;

  if (species === 'dog') {
    // Traditional method
    if (petAge < 1) {
      traditionalHuman = petAge * 15;
    } else if (petAge < 2) {
      traditionalHuman = 15;
    } else {
      traditionalHuman = 15 + 9 + (petAge - 2) * 4;
    }
    // Epigenetic method (age >= 1)
    if (petAge >= 1) {
      epigeneticHuman = 16 * Math.log(petAge) + 31;
    }
  } else {
    // Cat
    if (petAge < 1) {
      traditionalHuman = petAge * 15;
    } else {
      traditionalHuman = 15 + 9 + Math.max(0, (petAge - 2)) * 4;
    }
  }

  const maxHumanAge = Math.max(
    traditionalHuman,
    epigeneticHuman || 0,
    100
  );

  const barWidth = (val: number) => Math.max((val / maxHumanAge) * 100, 5);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pet Age vs Human Age Comparison</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Pet info card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{species === 'dog' ? 'Dog' : 'Cat'}</p>
              <p className="text-sm font-bold text-slate-700">{petAge.toFixed(1)} years old</p>
              {species === 'dog' && values.dogSize && (
                <p className="text-[11px] text-slate-500 capitalize">{values.dogSize} breed</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Life Stage</p>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                lifeStage.value === 'Puppy' || lifeStage.value === 'Kitten' || lifeStage.value === 'Junior'
                  ? 'bg-emerald-100 text-emerald-700'
                  : lifeStage.value === 'Adult'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {lifeStage.value}
              </span>
            </div>
          </div>
        </div>

        {/* SVG comparison bars */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Human Age Equivalents</p>
          <svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxWidth: '100%', height: 'auto' }}>
            {/* Traditional method bar */}
            <text x={10} y={28} fill="#64748b" fontSize={11} fontWeight="bold">Traditional (×7 Method)</text>
            <rect x={10} y={38} width={barWidth(traditionalHuman) * 2.5} height={30} rx={6} fill="#3b82f6" opacity={0.8} />
            <text x={10 + barWidth(traditionalHuman) * 2.5 + 8} y={58} fill="#1e293b" fontSize={13} fontWeight="bold">
              {Math.round(traditionalHuman)} yrs
            </text>

            {/* Epigenetic method bar (dogs only, age >= 1) */}
            {epigeneticHuman !== null && (
              <>
                <text x={10} y={98} fill="#64748b" fontSize={11} fontWeight="bold">Epigenetic (NIH 2020)</text>
                <rect x={10} y={108} width={barWidth(epigeneticHuman) * 2.5} height={30} rx={6} fill="#8b5cf6" opacity={0.8} />
                <text x={10 + barWidth(epigeneticHuman) * 2.5 + 8} y={128} fill="#1e293b" fontSize={13} fontWeight="bold">
                  {epigeneticHuman.toFixed(1)} yrs
                </text>
              </>
            )}

            {/* Scale bar */}
            <line x1={10} y1={165} x2={400} y2={165} stroke="#e2e8f0" strokeWidth={2} />
            <text x={10} y={180} fill="#94a3b8" fontSize={9}>0</text>
            <text x={100} y={180} fill="#94a3b8" fontSize={9}>{Math.round(maxHumanAge * 0.25)}</text>
            <text x={205} y={180} textAnchor="middle" fill="#94a3b8" fontSize={9}>{Math.round(maxHumanAge * 0.5)}</text>
            <text x={310} y={180} textAnchor="middle" fill="#94a3b8" fontSize={9}>{Math.round(maxHumanAge * 0.75)}</text>
            <text x={400} y={180} textAnchor="end" fill="#94a3b8" fontSize={9}>{Math.round(maxHumanAge)}</text>
            <text x={205} y={194} textAnchor="middle" fill="#94a3b8" fontSize={8}>Human Years</text>
          </svg>
        </div>

        {/* Pet vs Human age milestones */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Age Milestones</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{species === 'dog' ? 'Dog Age' : 'Cat Age'}</th>
                  <th scope="col" className="text-center px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Traditional Human Age</th>
                  {epigeneticHuman !== null && (
                    <th scope="col" className="text-center px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Epigenetic Human Age</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {[
                  { pet: 1, trad: species === 'dog' ? 15 : 15, epi: species === 'dog' ? 31 : null },
                  { pet: 2, trad: species === 'dog' ? 24 : 24, epi: species === 'dog' ? 42.1 : null },
                  { pet: 3, trad: species === 'dog' ? 28 : 28, epi: species === 'dog' ? 48.6 : null },
                  { pet: 5, trad: species === 'dog' ? 36 : 36, epi: species === 'dog' ? 56.8 : null },
                  { pet: 7, trad: species === 'dog' ? 44 : 44, epi: species === 'dog' ? 62.1 : null },
                  { pet: 10, trad: species === 'dog' ? 56 : 56, epi: species === 'dog' ? 67.8 : null },
                  { pet: 15, trad: species === 'dog' ? 76 : 76, epi: species === 'dog' ? 74.3 : null },
                ].filter(row => row.pet <= petAge + 5).slice(0, 5).map((row, i) => (
                  <tr key={row.pet} className={`border-b border-slate-100 last:border-0 ${Math.abs(row.pet - petAge) < 0.5 ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className={`px-4 py-2 font-bold ${Math.abs(row.pet - petAge) < 0.5 ? 'text-blue-700' : 'text-slate-700'}`}>{row.pet} yr{row.pet > 1 ? 's' : ''}</td>
                    <td className={`px-3 py-2 text-center font-bold tabular-nums ${Math.abs(row.pet - petAge) < 0.5 ? 'text-blue-700' : 'text-slate-700'}`}>{row.trad} yrs</td>
                    {epigeneticHuman !== null && (
                      <td className={`px-3 py-2 text-center font-bold tabular-nums ${Math.abs(row.pet - petAge) < 0.5 ? 'text-blue-700' : 'text-slate-500'}`}>
                        {row.epi !== null ? `${row.epi.toFixed(1)} yrs` : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aging explanation */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Why the ×7 Rule Is Inaccurate</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            The traditional "multiply by 7" rule assumes aging is constant, but {species === 'dog' ? 'dogs' : 'cats'} age much faster
            in early years. A {species === 'dog' ? '1-year-old dog (~31 human years)' : '1-year-old cat (~15 human years)'} is
            reproductively mature — equivalent to a young adult human, not a 7-year-old child.
            {species === 'dog' && (
              <span> The NIH 2020 epigenetic study revealed that dog aging follows a logarithmic curve:
              rapid early development that decelerates with age.</span>
            )}
          </p>
        </div>

        {/* Life stage timeline */}
        <details className="group rounded-xl border border-slate-200 overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
            <span>Life Stage Chart — {species === 'dog' ? 'Dog' : 'Cat'}</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100 px-4 py-3">
            {species === 'dog' ? (
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between"><span><strong>Puppy</strong> — Birth to 1 year</span><span className="text-emerald-600 font-bold">Current</span></div>
                <div className="flex justify-between"><span><strong>Junior</strong> — 1–2 years</span></div>
                <div className="flex justify-between"><span><strong>Adult</strong> — 2–6 years (small/medium) / 2–5 years (large)</span></div>
                <div className="flex justify-between"><span><strong>Mature</strong> — 7–10 years (small) / 5–10 years (large)</span></div>
                <div className="flex justify-between"><span><strong>Senior</strong> — 11–14 years</span></div>
                <div className="flex justify-between"><span><strong>Geriatric</strong> — 15+ years</span></div>
              </div>
            ) : (
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between"><span><strong>Kitten</strong> — Birth to 1 year</span></div>
                <div className="flex justify-between"><span><strong>Junior</strong> — 1–2 years</span></div>
                <div className="flex justify-between"><span><strong>Adult</strong> — 2–6 years</span></div>
                <div className="flex justify-between"><span><strong>Mature</strong> — 7–10 years</span></div>
                <div className="flex justify-between"><span><strong>Senior</strong> — 11–14 years</span></div>
                <div className="flex justify-between"><span><strong>Geriatric</strong> — 15+ years</span></div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
