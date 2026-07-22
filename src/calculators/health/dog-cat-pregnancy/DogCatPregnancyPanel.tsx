import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DogCatPregnancyPanel({ values, results }: Props) {
  const species = values.species || 'dog';
  const dueDateResult = results.find(r => r.id === 'dueDate');
  const daysRemainingResult = results.find(r => r.id === 'daysRemaining');
  const trimesterResult = results.find(r => r.id === 'trimester');

  if (!dueDateResult || !trimesterResult) return null;

  const gestationDays = species === 'dog' ? 63 : 65;
  const daysRemainingText = daysRemainingResult?.value || '';
  const daysRemainingMatch = daysRemainingText.match(/(\d+)/);
  const daysRemaining = daysRemainingMatch ? parseInt(daysRemainingMatch[1]) : 0;
  const daysSinceDue = daysRemainingText.includes('ago');

  // Calculate days elapsed
  const breedingDateStr = values.breedingDate;
  let daysElapsed = 0;
  if (breedingDateStr) {
    const breeding = new Date(breedingDateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    daysElapsed = Math.round((now.getTime() - breeding.getTime()) / (1000 * 60 * 60 * 24));
  }

  const progressPct = Math.min(Math.max((daysElapsed / gestationDays) * 100, 0), 100);

  // Trimester definitions
  const trimesters = [
    { label: 'Early', daysStart: 1, daysEnd: Math.floor(gestationDays / 3), color: '#22c55e' },
    { label: 'Mid', daysStart: Math.floor(gestationDays / 3) + 1, daysEnd: Math.floor(gestationDays * 2 / 3), color: '#f59e0b' },
    { label: 'Late', daysStart: Math.floor(gestationDays * 2 / 3) + 1, daysEnd: gestationDays, color: '#ef4444' },
  ];

  // Week markers
  const totalWeeks = Math.ceil(gestationDays / 7);
  const weekMarkers = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pregnancy Timeline</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Due date card */}
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-white">
          <p className="text-[11px] opacity-80 mb-1">{species === 'dog' ? 'Whelping' : 'Queening'} Due Date</p>
          <p className="text-xl font-bold">{dueDateResult.value}</p>
          <p className="text-[11px] opacity-80 mt-1">
            {daysSinceDue
              ? `Due ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} ago`
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
            }
          </p>
        </div>

        {/* SVG Progress Bar */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Gestation Progress</p>
          <svg viewBox="0 0 420 120" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxWidth: '100%', height: 'auto' }}>
            {/* Full gestation bar background */}
            <rect x={10} y={25} width={400} height={24} rx={6} fill="#f1f5f9" />

            {/* Trimester segments in the bar */}
            {trimesters.map((t) => {
              const segStart = 10 + ((t.daysStart - 1) / gestationDays) * 400;
              const segWidth = ((t.daysEnd - t.daysStart + 1) / gestationDays) * 400;
              return (
                <rect
                  key={t.label}
                  x={segStart}
                  y={25}
                  width={segWidth}
                  height={24}
                  rx={2}
                  fill={t.color}
                  opacity={0.25}
                />
              );
            })}

            {/* Progress fill */}
            <rect x={10} y={25} width={(progressPct / 100) * 400} height={24} rx={6} fill="#3b82f6" opacity={0.75} />

            {/* Progress percentage text */}
            <text x={210} y={41} textAnchor="middle" fill={progressPct > 20 ? '#fff' : '#64748b'} fontSize={12} fontWeight="bold">
              {progressPct.toFixed(0)}% Complete
            </text>

            {/* Week markers */}
            {weekMarkers.map((w) => {
              const wx = 10 + (w / totalWeeks) * 400;
              return (
                <g key={w}>
                  <line x1={wx} y1={50} x2={wx} y2={58} stroke="#cbd5e1" strokeWidth={1} />
                  <text x={wx} y={69} textAnchor="middle" fill="#94a3b8" fontSize={8}>W{w}</text>
                </g>
              );
            })}

            {/* Current position marker */}
            <line x1={10 + (progressPct / 100) * 400} y1={15} x2={10 + (progressPct / 100) * 400} y2={58} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4,3" />

            {/* Day 0 and full gestation labels */}
            <text x={10} y={85} fill="#94a3b8" fontSize={9}>Day 0</text>
            <text x={410} y={85} textAnchor="end" fill="#94a3b8" fontSize={9}>Day {gestationDays}</text>

            {/* Trimester labels below */}
            {trimesters.map((t) => {
              const cx = 10 + (((t.daysStart + t.daysEnd) / 2 - 1) / gestationDays) * 400;
              return (
                <g key={t.label}>
                  <line x1={cx} y1={90} x2={cx} y2={98} stroke="#cbd5e1" strokeWidth={1} />
                  <text x={cx} y={108} textAnchor="middle" fill={t.color} fontSize={9} fontWeight="bold">{t.label}</text>
                  <text x={cx} y={118} textAnchor="middle" fill="#94a3b8" fontSize={8}>Day {t.daysStart}–{t.daysEnd}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Current Trimester */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current Trimester</p>
          <div className="flex items-center gap-4">
            {trimesters.map((t) => {
              const isActive = trimesterResult.value.toLowerCase().startsWith(t.label.toLowerCase());
              const currentDay = daysElapsed > 0 ? daysElapsed : 0;
              return (
                <div key={t.label} className={`flex-1 rounded-lg border-2 p-3 text-center ${
                  isActive
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-white opacity-50'
                }`}>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: t.color }} />
                  <p className={`text-xs font-bold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>{t.label}</p>
                  {isActive && (
                    <p className="text-[10px] text-blue-500 font-semibold">Current</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Week calendar details */}
        <details className="group rounded-xl border border-slate-200 overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
            <span>Development by Week</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100">
            {species === 'dog' ? (
              <div className="divide-y divide-slate-100 text-[11px]">
                {[
                  { week: '1–2', event: 'Fertilization; embryos travel to uterine horns' },
                  { week: '3', event: 'Implantation in uterine lining (~day 18–20)' },
                  { week: '4', event: 'Embryos detectable via ultrasound; morning sickness possible' },
                  { week: '5', event: 'Fetuses begin to take shape; palpable by vet (~day 28–30)' },
                  { week: '6', event: 'Rapid growth; skeleton calcifies; visible on X-ray (~day 45)' },
                  { week: '7', event: 'Fetuses fully formed; mother shows visible weight gain' },
                  { week: '8', event: 'Prepare whelping box; nests; appetite may decrease' },
                  { week: '9', event: 'Mammary development; temperature drop before labor' },
                ].map(item => (
                  <div key={item.week} className="flex gap-4 px-4 py-2">
                    <span className="w-12 flex-shrink-0 font-bold text-slate-600">Wk {item.week}</span>
                    <span className="text-slate-600">{item.event}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-[11px]">
                {[
                  { week: '1–2', event: 'Fertilization; embryos travel to uterine horns' },
                  { week: '3', event: 'Implantation in uterine lining' },
                  { week: '4', event: 'Embryos detectable via ultrasound; nipples redden ("pinking up")' },
                  { week: '5', event: 'Fetuses palpable; morning sickness possible' },
                  { week: '6', event: 'Rapid growth; visible weight gain; increased appetite' },
                  { week: '7', event: 'Fetuses fully formed; nesting behavior may begin' },
                  { week: '8', event: 'Mammary development; prepare queening area' },
                  { week: '9', event: 'Decreased appetite; restlessness before labor' },
                ].map(item => (
                  <div key={item.week} className="flex gap-4 px-4 py-2">
                    <span className="w-12 flex-shrink-0 font-bold text-slate-600">Wk {item.week}</span>
                    <span className="text-slate-600">{item.event}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* Veterinary Alert */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">Veterinary Guidance</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                This timeline is an estimate. Actual gestation varies by breed, litter size, and individual factors.
                Always consult a veterinarian for pregnancy confirmation, prenatal care, and delivery planning.
                If the due date range passes with no signs of labor, contact your vet immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
