import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface Milestone {
  week: number;
  label: string;
  description: string;
  category: 'screening' | 'development' | 'milestone' | 'appointment';
}

const MILESTONES: Milestone[] = [
  { week: 4, label: 'Pregnancy Detected', description: 'Home pregnancy tests typically show positive. hCG levels measurable in blood.', category: 'milestone' },
  { week: 5, label: 'Embryonic Heartbeat Begins', description: 'Heart begins beating at ~100 bpm. May be visible on transvaginal ultrasound.', category: 'development' },
  { week: 6, label: 'Ultrasound May Show Heartbeat', description: 'First ultrasound often scheduled. Gestational sac and yolk sac visible.', category: 'screening' },
  { week: 8, label: 'First Prenatal Visit', description: 'Confirmation of pregnancy, health history review, blood work, and dating ultrasound.', category: 'appointment' },
  { week: 10, label: 'NIPT Screening Available', description: 'Non-Invasive Prenatal Testing (cell-free DNA) can screen for chromosomal conditions.', category: 'screening' },
  { week: 12, label: 'NT Scan / First Trimester Screen', description: 'Nuchal translucency ultrasound and blood work. Screens for Down syndrome and other conditions.', category: 'screening' },
  { week: 13, label: 'End of First Trimester', description: 'All major organs formed. Miscarriage risk drops significantly after week 12.', category: 'milestone' },
  { week: 16, label: 'Quad Screen (Optional)', description: 'Blood test screening for neural tube defects, Down syndrome, and trisomy 18.', category: 'screening' },
  { week: 18, label: 'Quickening (Early Fetal Movement)', description: 'First fetal movements felt. Earlier in subsequent pregnancies; may be later in first.', category: 'development' },
  { week: 20, label: 'Anatomy Scan (Level II Ultrasound)', description: 'Detailed ultrasound checking fetal anatomy, organs, and gender determination.', category: 'screening' },
  { week: 24, label: 'Viability Threshold', description: 'Fetus may survive outside the womb with intensive medical support. ~50% survival at 24 weeks.', category: 'milestone' },
  { week: 26, label: 'Glucose Screening (GD Test)', description: 'Screening for gestational diabetes. Follow-up 3-hour test if elevated.', category: 'screening' },
  { week: 28, label: 'Third Trimester Begins', description: 'Increased prenatal visit frequency (every 2 weeks). Rhogam shot if Rh-negative.', category: 'appointment' },
  { week: 30, label: 'Fetal Movement Counting', description: 'Begin kick counts. Most practitioners recommend tracking daily fetal movements.', category: 'appointment' },
  { week: 32, label: 'Growth Ultrasound (If Indicated)', description: 'Follow-up ultrasound to check fetal growth, positioning, and amniotic fluid levels.', category: 'screening' },
  { week: 34, label: 'Group B Strep Screening', description: 'GBS swab test. Positive results require IV antibiotics during labor.', category: 'screening' },
  { week: 36, label: 'Weekly Prenatal Visits', description: 'Visits every week until delivery. Cervical checks, fetal position assessment.', category: 'appointment' },
  { week: 37, label: 'Full Term Begins', description: 'Baby considered early term. Lungs are mature. Planned C-sections scheduled from here.', category: 'milestone' },
  { week: 39, label: 'Full Term', description: 'Optimal delivery window. Baby fully developed — lungs, brain, and immune system mature.', category: 'milestone' },
  { week: 40, label: 'Due Date', description: 'Estimated Due Date. Only ~5% of babies arrive on the exact due date. Normal range: 37–42 weeks.', category: 'milestone' },
  { week: 41, label: 'Post-Term Monitoring', description: 'Additional monitoring if undelivered. Discussion of induction options.', category: 'appointment' },
];

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function MilestonesPanel({ results }: Props) {
  const dueDateResult = results.find(r => r.id === 'dueDate');
  if (!dueDateResult) return null;

  // Parse due date from result format "Friday, January 15, 2026"
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dueDateMatch = dueDateResult.value.match(/^[^,]+, (\w+) (\d+), (\d+)$/);
  if (!dueDateMatch) return null;
  const monthIdx = MONTH_NAMES.indexOf(dueDateMatch[1]);
  if (monthIdx === -1) return null;
  const dueDate = new Date(parseInt(dueDateMatch[3]), monthIdx, parseInt(dueDateMatch[2]));
  if (isNaN(dueDate.getTime())) return null;

  // Parse current gestational age
  const lmpDate = new Date(dueDate);
  lmpDate.setDate(lmpDate.getDate() - 280);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getMilestoneDate = (week: number): Date => {
    const d = new Date(lmpDate);
    d.setDate(d.getDate() + week * 7);
    return d;
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = MILESTONES.filter(m => {
    const md = getMilestoneDate(m.week);
    return md >= now;
  }).slice(0, 3);

  const catColor = (cat: string) => {
    switch (cat) {
      case 'screening': return { dot: 'bg-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Screening' };
      case 'development': return { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Development' };
      case 'milestone': return { dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Milestone' };
      case 'appointment': return { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Appointment' };
      default: return { dot: 'bg-slate-500', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', label: 'Other' };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pregnancy Milestones Timeline</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Upcoming milestones */}
        {upcoming.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Upcoming Milestones</p>
            <div className="space-y-2">
              {upcoming.map((m) => {
                const md = getMilestoneDate(m.week);
                const cc = catColor(m.category);
                return (
                  <div key={m.week} className={`rounded-xl border ${cc.bg} px-4 py-3`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cc.dot}`} />
                        <span className="text-xs font-bold text-slate-800">{m.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${cc.text}`}>{cc.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 ml-4">{m.description}</p>
                    <p className="text-[10px] text-slate-500 ml-4 mt-1">
                      Week {m.week} — {fmtDate(md)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed timeline */}
        <details className="group rounded-xl border border-slate-200 overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
            <span>Full Timeline ({MILESTONES.length} milestones)</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100">
            {MILESTONES.map((m, i) => {
              const md = getMilestoneDate(m.week);
              const cc = catColor(m.category);
              const isPast = md < now;
              const isCurrent = !isPast && i > 0 && getMilestoneDate(MILESTONES[i - 1].week) < now;

              return (
                <div
                  key={m.week}
                  className={`flex items-start gap-4 px-4 py-3 border-b border-slate-100 last:border-0 ${isCurrent ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex flex-col items-center w-10 flex-shrink-0">
                    <span className={`text-[10px] font-bold ${isPast ? 'text-slate-500' : 'text-slate-600'}`}>W{m.week}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isPast ? 'bg-slate-300' : isCurrent ? 'bg-blue-500' : cc.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>{m.label}</span>
                      {isCurrent && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Current</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{m.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(md)}</p>
                  </div>
                  <span className={`text-[10px] font-bold flex-shrink-0 ${cc.text}`}>{cc.label}</span>
                </div>
              );
            })}
          </div>
        </details>

        {/* Medical Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Medical Disclaimer</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            This timeline is for informational and educational purposes only. Every pregnancy is unique.
            Milestone timing varies based on individual factors, equipment quality, and fetal positioning.
            Always follow your healthcare provider&apos;s recommended screening and appointment schedule.
            If you have concerns about any milestone or symptom, contact your OB/GYN or midwife immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
