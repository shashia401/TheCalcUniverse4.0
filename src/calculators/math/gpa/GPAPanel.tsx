import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

function getGradeColor(grade: string): { bar: string; text: string } {
  const gpaValues: Record<string, number> = {
    'A+': 4.33, 'A': 4.0, 'A-': 3.67,
    'B+': 3.33, 'B': 3.0, 'B-': 2.67,
    'C+': 2.33, 'C': 2.0, 'C-': 1.67,
    'D+': 1.33, 'D': 1.0, 'D-': 0.67,
    'F': 0.0,
  };
  const gpa = gpaValues[grade] ?? 0;
  if (gpa >= 3.0) return { bar: 'bg-green-500', text: 'text-green-700' };
  if (gpa >= 2.0) return { bar: 'bg-yellow-500', text: 'text-yellow-700' };
  if (gpa >= 1.0) return { bar: 'bg-orange-500', text: 'text-orange-700' };
  return { bar: 'bg-red-500', text: 'text-red-700' };
}

function GradeBar({ grade, points, maxPoints }: { grade: string; points: number; maxPoints: number }) {
  const pct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs font-bold text-slate-600 text-right">{grade}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getGradeColor(grade).bar}`}
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

    if (!gpa || !gpaDataRaw) return null;

    let courses: CourseRow[] = [];
    try {
      courses = JSON.parse(gpaDataRaw.value);
    } catch {
      // fallback
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
            <p className="text-sm text-slate-500 mb-2">{gpa.label}</p>
            <p className="text-4xl font-bold text-green-700">{gpa.value}</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
              <span>{courseCount?.label}: {courseCount?.value}</span>
              <span>{totalCredits?.label}: {totalCredits?.value}</span>
              <span>Points: {totalGradePoints?.value}</span>
            </div>
          </div>

          {/* GPA by Course — Bar Chart */}
          {courses.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Grade Points by Course
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={courses} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    formatter={(_: unknown) => [typeof _ === 'number' ? _.toFixed(2) : _, 'Grade Points'] as any}
                  />
                  <Line type="monotone" dataKey="points" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Course Table */}
          {courses.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Course Breakdown</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
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
                        <td className="px-3 py-2 text-center text-slate-600">{c.credits}</td>
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
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Grade Distribution</p>
              <div className="space-y-1.5">
                {courses.map((c, i) => (
                  <GradeBar key={`item-${i}`} grade={c.grade} points={c.points} maxPoints={maxPoints} />
                ))}
              </div>
            </div>
          )}

          {/* GPA Scale Reference */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">GPA Scale Reference</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
              {[['4.33', 'A+', 'bg-green-500'], ['4.0', 'A', 'bg-green-500'], ['3.67', 'A-', 'bg-green-500'],
                ['3.33', 'B+', 'bg-green-400'], ['3.0', 'B', 'bg-green-400'], ['2.67', 'B-', 'bg-yellow-500'],
                ['2.33', 'C+', 'bg-yellow-500'], ['2.0', 'C', 'bg-yellow-500'], ['1.67', 'C-', 'bg-orange-500'],
                ['1.33', 'D+', 'bg-orange-500'], ['1.0', 'D', 'bg-orange-500'], ['0.67', 'D-', 'bg-red-400'],
                ['0.0', 'F', 'bg-red-500']].map(([gpaVal, letter, color]) => (
                <div key={letter} className="flex items-center gap-1.5 p-1.5 bg-white rounded border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="font-bold text-slate-600">{letter}</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-slate-500">{gpaVal}</span>
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

  if (!neededGPA || !neededGrade) return null;

  const neededGPAVal = parseFloat(neededGPA.value);
  const currentGPAVal = currentGpa ? parseFloat(currentGpa.value) : 0;
  const targetGPAVal = targetGpa ? parseFloat(targetGpa.value) : 0;
  const totalCreditsResult = results.find((r) => r.id === 'totalCredits');
  const impossible = neededGPAVal > 4.33;

  // Progress from current to target
  const progressBase = Math.max(currentGPAVal, 0);
  const progressTarget = Math.max(targetGPAVal, 0);
  const progressMax = 5.0;
  const currentPct = (progressBase / progressMax) * 100;
  const targetPct = (progressTarget / progressMax) * 100;

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
          <p className="text-sm text-slate-500 mb-2">GPA Needed Per Course</p>
          <p className={`text-4xl font-bold ${impossible ? 'text-red-600' : 'text-blue-700'}`}>
            {neededGPA.value}
          </p>
          <p className="text-sm mt-2 text-slate-600">
            Grade per course: <span className="font-bold">{neededGrade.value}</span>
          </p>
        </div>

        {/* Impossible Warning */}
        {impossible && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-xs font-bold text-red-600 mb-1">Target Not Reachable</p>
            <p className="text-sm text-red-700">
              The required GPA of {neededGPA.value} exceeds the maximum possible (4.33). Consider
              taking additional credits (e.g., summer courses or extra AP classes) to increase your
              remaining credits and improve your chances.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {currentGpa && targetGpa && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              GPA Progress: {currentGpa.value} → {targetGpa.value}
            </p>
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${Math.min(currentPct, 100)}%` }}
              />
              <div
                className="absolute h-full bg-blue-600 rounded-full transition-all opacity-60"
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
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Current: {currentGpa.value}</span>
              <span>Target: {targetGpa.value}</span>
              <span>Max: 5.0</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Summary</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Current GPA</span>
              <p className="font-bold text-slate-700">{currentGpa?.value}</p>
            </div>
            <div>
              <span className="text-slate-500">Target GPA</span>
              <p className="font-bold text-slate-700">{targetGpa?.value}</p>
            </div>
            <div>
              <span className="text-slate-500">GPA Needed</span>
              <p className={`font-bold ${impossible ? 'text-red-600' : 'text-blue-700'}`}>
                {neededGPA.value}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Grade Needed</span>
              <p className="font-bold text-slate-700">{neededGrade.value}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Credits</span>
              <p className="font-bold text-slate-700">{totalCreditsResult?.value}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
