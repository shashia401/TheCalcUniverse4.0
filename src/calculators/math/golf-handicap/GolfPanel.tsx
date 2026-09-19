import { CalculatorResult } from '../../../types/calculator';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface DifferentialEntry {
  round: number;
  score: number;
  rating: number;
  slope: number;
  differential: number;
  used: boolean;
}

function getCategory(index: number): { label: string; color: string; bg: string } {
  if (index <= 0) return { label: 'Scratch', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  if (index <= 5) return { label: 'Pro', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  if (index <= 15) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
  if (index <= 25) return { label: 'Average', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  return { label: 'High', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
}

export default function GolfPanel({ results }: Props) {
  const handicapIndex = getValue(results, 'handicapIndex');
  const differentialsRaw = getValue(results, '_differentials');
  const roundsUsed = getValue(results, 'roundsUsed');
  const averageDifferential = getValue(results, 'averageDifferential');
  const courseHandicap = getValue(results, 'courseHandicap');

  if (!handicapIndex) return null;

  const index = parseFloat(handicapIndex);
  const category = getCategory(index);
  const diffs: DifferentialEntry[] = (() => {
    try { return JSON.parse(differentialsRaw); } catch { return []; }
  })();

  const usedCount = diffs.filter((d) => d.used).length;

  return (
    <div className="space-y-5">
      {/* Large Handicap Index Display */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Handicap Index
          </span>
        </div>
        <div className="p-8 text-center">
          <p className="text-6xl sm:text-7xl font-black tracking-tight text-emerald-700">
            {handicapIndex}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-emerald-600">
            <span>{roundsUsed}</span>
            <span className="text-emerald-300">&middot;</span>
            <span>Avg Diff: {averageDifferential}</span>
          </div>
        </div>
      </div>

      {/* Handicap Category Badge */}
      <div className={`rounded-2xl border ${category.bg} shadow-sm overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-3">
          <span className={`text-sm font-bold ${category.color}`}>
            {category.label} Handicap
          </span>
          <span className={`text-xs ${category.color} opacity-70`}>
            Course Handicap: {courseHandicap}
          </span>
        </div>
      </div>

      {/* Differential Table */}
      {diffs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              Round Differentials
            </span>
            <span className="text-[10px] text-slate-500 ml-auto font-medium">
              Used: {usedCount} / {diffs.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th scope="col" className="px-4 py-2 text-left font-medium text-slate-500">#</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-slate-500">Score</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-slate-500">Rating</th>
                  <th scope="col" className="px-4 py-2 text-left font-medium text-slate-500">Slope</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium text-slate-500">Diff</th>
                  <th scope="col" className="px-4 py-2 text-center font-medium text-slate-500">Used</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map((d) => (
                  <tr
                    key={d.round}
                    className={`border-b border-slate-50 ${d.used ? 'bg-emerald-50/50' : ''}`}
                  >
                    <td className="px-4 py-2 text-slate-600">{d.round}</td>
                    <td className="px-4 py-2 text-slate-700 font-medium">{d.score}</td>
                    <td className="px-4 py-2 text-slate-600">{d.rating}</td>
                    <td className="px-4 py-2 text-slate-600">{d.slope}</td>
                    <td className={`px-4 py-2 text-right font-medium ${d.used ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {d.differential.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {d.used ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WHS Calculation Steps */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            WHS Calculation Steps
          </span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">Score Differential</p>
              <p className="text-xs text-slate-500 mt-0.5">Each round: (Score - Course Rating) &times; 113 &divide; Slope Rating</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">Select Lowest</p>
              <p className="text-xs text-slate-500 mt-0.5">Take the lowest differentials: {roundsUsed}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">Average</p>
              <p className="text-xs text-slate-500 mt-0.5">Average of selected differentials: {averageDifferential}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">4</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">Apply Factor</p>
              <p className="text-xs text-slate-500 mt-0.5">Multiply by 0.96 and round to 1 decimal: {handicapIndex}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {diffs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
            Differentials Used
          </p>
          <div className="flex gap-0.5 h-4 rounded-full overflow-hidden">
            {diffs.map((d) => (
              <div
                key={d.round}
                className={`flex-1 ${d.used ? 'bg-emerald-400' : 'bg-slate-200'}`}
                title={`Round ${d.round}: ${d.differential.toFixed(1)} (${d.used ? 'Used' : 'Not used'})`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-500">Lowest diffs selected</span>
            <span className="text-[10px] text-slate-500">{usedCount}/{diffs.length} used</span>
          </div>
        </div>
      )}
    </div>
  );
}
