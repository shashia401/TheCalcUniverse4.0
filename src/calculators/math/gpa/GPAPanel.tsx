import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { GRADES, SCALES, type ScaleId } from './gradeScale';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface CourseRow {
  name: string;
  grade: string;
  credits: number;
  points: number;
}

interface TargetData {
  needed: number;
  max: number;
  impossible: boolean;
  secured: boolean;
  current: number;
  target: number;
}

/** Colour bands by letter: A/B green, C yellow, D orange, F red (-700 shades for AA contrast on white). */
function getGradeColor(grade: string): { bar: string; text: string } {
  const letter = grade.charAt(0);
  if (letter === 'A' || letter === 'B') return { bar: 'bg-green-600', text: 'text-green-800' };
  if (letter === 'C') return { bar: 'bg-yellow-600', text: 'text-yellow-800' };
  if (letter === 'D') return { bar: 'bg-orange-600', text: 'text-orange-800' };
  return { bar: 'bg-red-600', text: 'text-red-800' };
}

const BAR_HEX: Record<string, string> = { A: '#15803d', B: '#15803d', C: '#a16207', D: '#c2410c', F: '#b91c1c' };

function GradeBar({ grade, points, maxPoints }: { grade: string; points: number; maxPoints: number }) {
  const pct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs font-bold text-slate-700 text-right">{grade}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`${grade}: ${parseFloat(points.toFixed(2))} grade points`}>
        <div
          className={`h-full rounded-full ${getGradeColor(grade).bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function GPAPanel({ results }: Props) {
  const mode = results.find((r) => r.id === 'gpa') ? 'calculate' : 'target';

  if (mode === 'calculate') {
    const gpa = results.find((r) => r.id === 'gpa');
    const totalCredits = results.find((r) => r.id === 'totalCredits');
    const totalGradePoints = results.find((r) => r.id === 'totalGradePoints');
    const courseCount = results.find((r) => r.id === 'courseCount');
    const gpaDataRaw = results.find((r) => r.id === '_gpaData');
    const scaleRaw = results.find((r) => r.id === '_scale')?.value;
    const scale: ScaleId = scaleRaw === 'thirds' ? 'thirds' : 'standard';

    if (!gpa || !gpaDataRaw) return null;

    let courses: CourseRow[] = [];
    try {
      courses = JSON.parse(gpaDataRaw.value);
    } catch {
      return null;
    }

    const maxPoints = Math.max(...courses.map((c) => c.points), 1);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">GPA Breakdown</span>
        </div>

        <div className="p-5 space-y-5">
          {/* GPA Result Card */}
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center">
            <p className="text-sm text-slate-700 mb-2">{gpa.label}</p>
            <p className="text-4xl font-bold text-green-700">{gpa.value}</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-slate-700">
              <span>{courseCount?.label}: {courseCount?.value}</span>
              <span>{totalCredits?.label}: {totalCredits?.value}</span>
              <span>Points: {totalGradePoints?.value}</span>
            </div>
          </div>

          {/* Grade points by course */}
          {courses.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
                Grade Points by Course (points × credits)
              </p>
              <SvgBarChart
                ariaLabel={`Bar chart of weighted grade points for ${courses.length} courses`}
                data={courses.map((c, i) => ({
                  label: c.name || `#${i + 1}`,
                  value: c.points,
                  color: BAR_HEX[c.grade.charAt(0)] ?? '#1d4ed8',
                }))}
                format={(n) => `${parseFloat(n.toFixed(2))} pts`}
              />
            </div>
          )}

          {/* Course Table */}
          {courses.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Course Breakdown</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200" tabIndex={0} role="region" aria-label="Course breakdown table">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      <th scope="col" className="px-3 py-2 text-left">Course</th>
                      <th scope="col" className="px-3 py-2 text-center">Grade</th>
                      <th scope="col" className="px-3 py-2 text-center">Credits</th>
                      <th scope="col" className="px-3 py-2 text-center">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c, i) => (
                      <tr key={`item-${i}`} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{c.name}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(c.grade).text} bg-slate-100`}>
                            {c.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">{c.credits}</td>
                        <td className="px-3 py-2 text-center font-mono text-slate-700">{c.points.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Color-coded Grade Bars */}
          {courses.length > 1 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Grade Distribution</p>
              <div className="space-y-1.5">
                {courses.map((c, i) => (
                  <GradeBar key={`item-${i}`} grade={c.grade} points={c.points} maxPoints={maxPoints} />
                ))}
              </div>
            </div>
          )}

          {/* GPA Scale Reference — driven by the selected scale, so it always matches the math */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
              GPA Scale Reference ({scale === 'thirds' ? 'thirds' : 'standard'})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
              {[...GRADES].reverse().map((letter) => (
                <div key={letter} className="flex items-center gap-1.5 p-1.5 bg-white rounded border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${getGradeColor(letter).bar}`} />
                  <span className="font-bold text-slate-700">{letter}</span>
                  <span className="text-slate-600">=</span>
                  <span className="text-slate-700">{SCALES[scale][letter]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -- Target mode --
  const neededGPA = results.find((r) => r.id === 'neededGPA');
  const neededGrade = results.find((r) => r.id === 'neededGrade');
  const currentGpa = results.find((r) => r.id === 'currentGpa');
  const targetGpa = results.find((r) => r.id === 'targetGpa');
  const totalCreditsResult = results.find((r) => r.id === 'totalCredits');
  const raw = results.find((r) => r.id === '_targetData');

  if (!neededGPA || !neededGrade || !raw) return null;
  let t: TargetData;
  try {
    t = JSON.parse(raw.value) as TargetData;
  } catch {
    return null;
  }
  const impossible = t.impossible;

  // Progress from current to target on a 0-5 bar
  const progressMax = 5.0;
  const currentPct = (Math.max(t.current, 0) / progressMax) * 100;
  const targetPct = (Math.max(t.target, 0) / progressMax) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Target GPA Analysis</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Needed GPA Card */}
        <div className={`rounded-xl bg-gradient-to-br p-6 text-center border ${
          impossible
            ? 'from-red-50 to-rose-50 border-red-200'
            : 'from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <p className="text-sm text-slate-700 mb-2">GPA Needed Per Course</p>
          <p className={`text-4xl font-bold ${impossible ? 'text-red-700' : 'text-blue-700'}`}>
            {neededGPA.value}
          </p>
          <p className="text-sm mt-2 text-slate-700">
            Grade per course: <span className="font-bold">{neededGrade.value}</span>
          </p>
        </div>

        {/* Impossible Warning */}
        {impossible && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-xs font-bold text-red-700 mb-1">Target Not Reachable</p>
            <p className="text-sm text-red-800">
              The required GPA of {neededGPA.value} exceeds the maximum possible on this scale ({t.max.toFixed(2)}). Consider
              taking additional credits (e.g., summer courses or extra AP classes) to increase your
              remaining credits and improve your chances.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {currentGpa && targetGpa && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              GPA Progress: {currentGpa.value} → {targetGpa.value}
            </p>
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden" role="img"
              aria-label={`Current GPA ${currentGpa.value}, target GPA ${targetGpa.value}, on a scale to 5.0`}>
              <div
                className="absolute h-full bg-blue-400 rounded-full"
                style={{ width: `${Math.min(currentPct, 100)}%` }}
              />
              <div
                className="absolute h-full bg-blue-600 rounded-full opacity-60"
                style={{
                  width: `${Math.min(targetPct, 100)}%`,
                  clipPath: `inset(0 ${100 - Math.min(targetPct, 100)}% 0 ${Math.min(currentPct, 100)}%)`,
                }}
              />
              {/* Target marker */}
              <div
                className="absolute top-0 w-0.5 h-full bg-slate-800"
                style={{ left: `${Math.min(targetPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>Current: {currentGpa.value}</span>
              <span>Target: {targetGpa.value}</span>
              <span>Max: 5.0</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Summary</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-600">Current GPA</span>
              <p className="font-bold text-slate-700">{currentGpa?.value}</p>
            </div>
            <div>
              <span className="text-slate-600">Target GPA</span>
              <p className="font-bold text-slate-700">{targetGpa?.value}</p>
            </div>
            <div>
              <span className="text-slate-600">GPA Needed</span>
              <p className={`font-bold ${impossible ? 'text-red-700' : 'text-blue-700'}`}>
                {neededGPA.value}
              </p>
            </div>
            <div>
              <span className="text-slate-600">Grade Needed</span>
              <p className="font-bold text-slate-700">{neededGrade.value}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-600">Credits</span>
              <p className="font-bold text-slate-700">{totalCreditsResult?.value}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
