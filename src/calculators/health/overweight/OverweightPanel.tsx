import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

type Tone = 'positive' | 'neutral' | 'negative';

// Colour classes per tone. Text is -700/-800 on a -50/-100 tint so every label keeps >= 4.5:1.
const TONE = {
  positive: { card: 'border-emerald-200 bg-emerald-50', big: 'text-emerald-700', sub: 'text-emerald-800', chip: 'bg-emerald-200 text-emerald-900', bar: 'bg-emerald-700', note: 'text-emerald-800' },
  neutral: { card: 'border-amber-200 bg-amber-50', big: 'text-amber-700', sub: 'text-amber-800', chip: 'bg-amber-200 text-amber-900', bar: 'bg-amber-700', note: 'text-amber-800' },
  negative: { card: 'border-red-200 bg-red-50', big: 'text-red-700', sub: 'text-red-800', chip: 'bg-red-200 text-red-900', bar: 'bg-red-700', note: 'text-red-800' },
} as const;

const BMI_DETAIL: Record<string, string> = {
  Underweight: 'A BMI below 18.5 is classed as underweight. It is associated with nutritional deficiency, bone loss and weaker immunity; a healthcare provider can help find the cause.',
  Normal: 'A BMI in the normal range (18.5–24.9) is associated with the lowest risk of chronic disease. Maintain your current weight through balanced nutrition and regular physical activity.',
  Overweight: 'A BMI in the overweight range (25–29.9) indicates excess body weight. Even modest weight loss of 5–10% can significantly improve health markers like blood pressure and insulin sensitivity.',
  Obese: 'A BMI in the obese range (30+) substantially increases risk for type 2 diabetes, cardiovascular disease, hypertension, and certain cancers. Consultation with a healthcare provider is recommended.',
};

const WHTR_DETAIL: Record<string, string> = {
  'Underweight range': 'A WHtR below 0.4 means your waist is less than 40% of your height. That can accompany being underweight or under-muscled.',
  'Healthy range': 'A WHtR below 0.5 means your waist circumference is less than half your height — the usual target for metabolic health. This suggests low levels of harmful visceral fat.',
  'Increased risk': 'A WHtR from 0.5 up to 0.6 indicates increased cardiometabolic risk. Visceral fat accumulation around organs begins to impact metabolic function.',
  'High risk': 'A WHtR of 0.6 or more indicates high risk. Excess visceral fat significantly raises the risk of metabolic syndrome, type 2 diabetes, and cardiovascular events.',
};

function MetricCard({ title, big, subtitle, chip, tone, barPct, footnote, detail }: {
  title: string; big: string; subtitle: string; chip: string; tone: Tone; barPct: number; footnote: string; detail: string;
}) {
  const t = TONE[tone];
  return (
    <div className={`rounded-xl border-2 p-5 text-center ${t.card}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${t.big}`}>{big}</p>
      <p className={`text-xs font-semibold mt-1 ${t.sub}`}>{subtitle}</p>
      <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${t.chip}`}>{chip}</span>
      <div role="img" aria-label={`${title} ${big}, ${chip}`} className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.min(Math.max(barPct, 0), 100)}%` }} />
      </div>
      <p className="text-[10px] text-slate-600 mt-2">{footnote}</p>
      <p className={`text-[11px] leading-relaxed mt-3 pt-3 border-t border-slate-200/80 text-left ${t.note}`}>{detail}</p>
    </div>
  );
}

export default function OverweightPanel({ results }: Props) {
  const bmiResult = results.find(r => r.id === 'bmiScore');
  const whtrResult = results.find(r => r.id === 'whtr');
  const riskResult = results.find(r => r.id === 'combinedRisk');

  if (!bmiResult || !whtrResult || !riskResult) return null;

  // Value, label and colour all come from index.ts ("27.0 — Overweight"), so the panel can never
  // disagree with the calculator (it used to re-classify and showed BMI 17 as "Normal Range").
  // Split on the FIRST separator only: the BMI label itself can contain one ("Obese (Class III — Severe)").
  const splitOnce = (v: string): [string, string] => {
    const i = v.indexOf(' — ');
    return i < 0 ? [v, ''] : [v.slice(0, i), v.slice(i + 3)];
  };
  const [bmiNum, bmiLabel] = splitOnce(bmiResult.value);
  const [whtrNum, whtrLabel] = splitOnce(whtrResult.value);
  const bmi = parseFloat(bmiNum) || 0;
  const whtr = parseFloat(whtrNum) || 0;
  const bmiKey = bmiLabel.startsWith('Obese') ? 'Obese' : bmiLabel.startsWith('Normal') ? 'Normal' : bmiLabel;

  const riskTone = (riskResult.color ?? 'neutral') as Tone;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Health Risk Dashboard</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Side-by-side BMI + WHtR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="BMI"
            big={bmi.toFixed(1)}
            subtitle="Body Mass Index"
            chip={bmiLabel}
            tone={(bmiResult.color ?? 'neutral') as Tone}
            barPct={(bmi / 40) * 100}
            footnote="BMI categories: Underweight <18.5 · Normal 18.5–24.9 · Overweight 25–29.9 · Obese 30+"
            detail={BMI_DETAIL[bmiKey] ?? ''}
          />
          <MetricCard
            title="WHtR"
            big={whtr.toFixed(2)}
            subtitle="Waist-to-Height Ratio"
            chip={whtrLabel}
            tone={(whtrResult.color ?? 'neutral') as Tone}
            barPct={(whtr / 0.7) * 100}
            footnote="WHtR target: keep your waist less than half your height (<0.5)"
            detail={WHTR_DETAIL[whtrLabel] ?? ''}
          />
        </div>

        {/* Risk Narrative */}
        <div className={`rounded-xl border px-5 py-4 ${TONE[riskTone].card}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${TONE[riskTone].big}`}>Combined Risk Assessment</p>
          <p className={`text-xs leading-relaxed ${TONE[riskTone].note}`}>{riskResult.value}</p>
        </div>

        {/* Visceral Fat Explanation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Why Fat Distribution Matters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Subcutaneous Fat</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Stored under the skin (pinchable). Produces beneficial hormones like leptin and adiponectin.
                Less metabolically harmful — primarily an energy reserve.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-red-700 mb-1">Visceral Fat</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Stored around internal organs (liver, pancreas). Secretes inflammatory cytokines,
                free fatty acids, and hormones that promote insulin resistance, inflammation,
                and cardiovascular disease. WHtR captures this risk.
              </p>
            </div>
          </div>
        </div>

        {/* Actionable Steps */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">Steps to Reduce Cardiovascular Risk</p>
          <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside leading-relaxed">
            <li><strong>Reduce waist circumference</strong> — even a modest reduction is linked to lower visceral fat and metabolic risk</li>
            <li><strong>Aim for 150+ min/week of moderate aerobic activity</strong> — brisk walking, cycling and swimming all help reduce visceral fat</li>
            <li><strong>Prioritize protein and fibre</strong> — increases satiety, preserves lean mass during weight loss, and improves metabolic health</li>
            <li><strong>Limit added sugar and refined carbs</strong> — high intakes are associated with more visceral fat</li>
            <li><strong>Get 7–9 hours of quality sleep</strong> — short sleep is associated with higher cortisol and more visceral fat</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
