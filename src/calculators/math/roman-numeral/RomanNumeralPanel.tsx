import { CalculatorResult } from '../../../types/calculator';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RomanNumeralPanel({ results }: Props) {
  const romanResult = getValue(results, 'romanResult');
  const breakdown = getValue(results, 'breakdown');
  const arabicResult = getValue(results, 'arabicResult');
  const romanOriginal = getValue(results, 'romanOriginal');
  const validationNote = getValue(results, 'validationNote');
  const romanDate = getValue(results, 'romanDate');
  const gregorianDate = getValue(results, 'gregorianDate');
  const arabicValue = getValue(results, 'arabicValue');

  const isToRoman = romanResult.length > 0;
  const isFromRoman = arabicResult.length > 0 && !romanDate;
  const isDate = romanDate.length > 0;
  const isWarning = validationNote === 'Not a valid Roman numeral' || validationNote.startsWith('Not');

  if (!romanResult && !arabicResult && !romanDate) return null;

  return (
    <div className="space-y-5">
      {/* Large Roman Numeral Display (tattoo-style typography) */}
      {isToRoman && romanResult && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md shadow-amber-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Roman Numeral
              </span>
            </div>
            <div className="p-8 text-center">
              <p className="text-6xl sm:text-7xl md:text-8xl font-serif font-black tracking-widest text-amber-900 select-all">
                {romanResult}
              </p>
              <p className="mt-4 text-sm text-amber-600">
                Value: {arabicValue}
              </p>
            </div>
          </div>

          {/* Subtractive Notation Explanation */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
              <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Subtractive Notation
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                {breakdown}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Roman to Number Result */}
      {isFromRoman && (
        <>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Converted Value
              </span>
            </div>
            <div className="p-8 text-center">
              <p className="text-6xl sm:text-7xl font-black tracking-tight text-emerald-700">
                {arabicResult}
              </p>
              <p className="mt-3 text-sm text-emerald-600 font-medium">
                {romanOriginal}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border ${isWarning ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'} shadow-sm overflow-hidden`}>
            <div className="flex items-start gap-3 px-5 py-4">
              <svg aria-hidden="true" className={`w-5 h-5 ${isWarning ? 'text-red-500' : 'text-emerald-500'} mt-0.5 shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isWarning ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <p className={`text-xs ${isWarning ? 'text-red-700' : 'text-emerald-700'} font-medium`}>
                {validationNote}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Date Mode */}
      {isDate && (
        <>
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md shadow-indigo-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-indigo-100">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Roman Date
              </span>
            </div>
            <div className="p-8 text-center">
              <p className="text-5xl sm:text-6xl md:text-7xl font-serif font-black tracking-widest text-indigo-800 select-all">
                {romanDate}
              </p>
              <p className="mt-3 text-sm text-indigo-500">
                {gregorianDate}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Tattoo Verification Humorous Note */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4">
          <svg aria-hidden="true" className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-700 mb-1">
              Tattoo Verification
            </p>
            <p className="text-xs text-pink-800 leading-relaxed">
              Double-check this before getting inked! Always verify your Roman numeral tattoo with a second source.
            </p>
          </div>
        </div>
      </div>

      {/* History Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4">
          <svg aria-hidden="true" className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">
              How Romans Used Numerals
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Romans developed their numeral system around 500 BC. Unlike our place-value system, Roman numerals are purely additive and subtractive. Romans used them for counting, trade, recording dates, and numbering chapters. The system persisted in Europe throughout the medieval period and can still be found on monuments, clock faces, and in formal contexts today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
