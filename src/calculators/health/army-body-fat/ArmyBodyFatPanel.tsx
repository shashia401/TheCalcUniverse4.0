import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const AGE_BRACKETS = [
  { label: '17–21', maxAge: 21, male: '20%', female: '30%' },
  { label: '22–27', maxAge: 27, male: '22%', female: '32%' },
  { label: '28–33', maxAge: 33, male: '24%', female: '34%' },
  { label: '34–39', maxAge: 39, male: '26%', female: '36%' },
  { label: '40–45', maxAge: 45, male: '28%', female: '38%' },
  { label: '46–55', maxAge: 55, male: '30%', female: '40%' },
  { label: '56–65', maxAge: 65, male: '32%', female: '42%' },
];

export default function ArmyBodyFatPanel({ values, results }: Props) {
  const bfResult = results.find(r => r.id === 'bodyFatArmy');
  const maxBfResult = results.find(r => r.id === 'maxAllowedBf');
  const passFail = results.find(r => r.id === 'passFail');
  if (!bfResult || !passFail) return null;

  const isMale = values.sex === 'male';
  const bfPct = parseFloat(bfResult.value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">AR 600-9 Body Fat Standards</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Pass/Fail Banner */}
        <div className={`rounded-xl px-5 py-4 ${passFail.value.startsWith('PASS') ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            {passFail.value.startsWith('PASS') ? (
              <svg aria-hidden="true" className="w-8 h-8 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-8 h-8 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <p className={`text-sm font-bold ${passFail.value.startsWith('PASS') ? 'text-emerald-700' : 'text-red-700'}`}>
                {passFail.value.startsWith('PASS') ? 'PASS' : 'FAIL'}
              </p>
              <p className={`text-xs ${passFail.value.startsWith('PASS') ? 'text-emerald-600' : 'text-red-600'}`}>
                {bfPct.toFixed(1)}% body fat — {maxBfResult ? `Maximum allowable: ${maxBfResult.value}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Standards table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Age Bracket</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Male Max</th>
                <th scope="col" className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Female Max</th>
              </tr>
            </thead>
            <tbody>
              {AGE_BRACKETS.map((b, i) => {
                // Better: just check if this row's max matches the result
                const rowMaxMale = parseInt(b.male);
                const rowMaxFemale = parseInt(b.female);
                const resultMax = maxBfResult ? parseInt(maxBfResult.value) : 0;
                const matches = resultMax === rowMaxMale || (isMale === false && resultMax === rowMaxFemale);

                return (
                  <tr key={b.label} className={`border-b border-slate-100 last:border-0 ${matches ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-700">{b.label}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{b.male}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{b.female}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Regulation quote */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Regulation Reference</p>
          <blockquote className="text-xs text-slate-600 italic leading-relaxed border-l-2 border-slate-300 pl-3">
            AR 600-9, The Army Body Composition Program, establishes the body fat standards and screening weight
            tables used to assess Soldier fitness and appearance. Per AR 600-9, Soldiers exceeding the screening
            weight will have their body fat assessed via circumference measurement. Soldiers exceeding the maximum
            allowable body fat for their age and gender will be enrolled in the Army Body Composition Program.
          </blockquote>
          <p className="text-[10px] text-slate-500 mt-2">Source: Army Regulation 600-9 (2023)</p>
        </div>

        {/* Measurement Guide */}
        <details className="group rounded-xl border border-slate-200 overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
            <span>Measurement Instructions (AR 600-9 Protocol)</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100 px-4 py-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1 h-full min-h-[20px] bg-slate-200 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-bold text-slate-700">Neck</p>
                <p className="text-[11px] text-slate-500">Tape is placed just below the larynx perpendicular to the neck axis. The tape should be snug but not tight, and measurements are rounded up to the nearest 0.5 inch.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-full min-h-[20px] bg-slate-200 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-bold text-slate-700">Waist (Men)</p>
                <p className="text-[11px] text-slate-500">Measured at the level of the navel (umbilicus). The Soldier stands erect with arms at sides, relaxed. Tape is placed parallel to the floor and measurements are taken after a normal exhale.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-full min-h-[20px] bg-slate-200 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-bold text-slate-700">Waist (Women)</p>
                <p className="text-[11px] text-slate-500">Measured at the narrowest point between the ribs and the iliac crest (natural waist). If the natural waist is not clearly defined, measure at the midpoint between the bottom rib and the iliac crest.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-full min-h-[20px] bg-slate-200 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-bold text-slate-700">Hips (Women)</p>
                <p className="text-[11px] text-slate-500">Measured at the widest point of the hips/buttocks, typically at the level of the pubic symphysis. Tape is parallel to the floor.</p>
              </div>
            </div>
          </div>
        </details>

        {/* Medical Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Important Notice</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            This calculator provides an <strong>estimate</strong> of body fat percentage based on AR 600-9 equations.
            Official Army tape tests are conducted by trained personnel following strict measurement protocols.
            Results from this tool should not be considered equivalent to an official Army Body Composition Assessment.
            AR 600-9 standards change periodically — consult the latest regulation for current thresholds.
          </p>
        </div>
      </div>
    </div>
  );
}
