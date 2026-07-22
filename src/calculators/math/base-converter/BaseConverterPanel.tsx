import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function BaseConverterPanel({ results }: Props) {
  const result = results.find(r => r.id === 'result');
  const decimalValue = results.find(r => r.id === 'decimalValue');
  const length = results.find(r => r.id === 'length');

  if (!result || !decimalValue) return null;

  const decimal = parseInt(decimalValue.value, 10);
  if (isNaN(decimal)) return null;

  // Generate representations
  const hex = decimal.toString(16).toUpperCase();
  const binary = decimal.toString(2);
  const octal = decimal.toString(8);

  const bases = [
    { name: 'Binary', base: 2, value: binary, fill: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
    { name: 'Octal', base: 8, value: octal, fill: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    { name: 'Decimal', base: 10, value: decimal.toString(), fill: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    { name: 'Hexadecimal', base: 16, value: hex, fill: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  ];

  // Get the from/to base from the result label
  const resultLabel = result.label;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Base Representations</span>
      </div>
      <div className="p-5 space-y-2.5">
        {bases.map(({ name, value, fill, text }) => (
          <div key={name} className={`rounded-xl border ${fill} px-4 py-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wide ${text}`}>
                {name} (base {name === 'Hexadecimal' ? '16' : name === 'Decimal' ? '10' : name === 'Binary' ? '2' : '8'})
              </span>
              <span className={`text-xs font-mono font-bold ${text}`}>{value}</span>
            </div>
            {name === 'Decimal' && (
              <div className="mt-1 text-[10px] text-slate-400">
                Intermediate value used for conversion
              </div>
            )}
          </div>
        ))}

        {length && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Result Digit Count: </span>
            <span className="text-sm font-bold text-slate-700">{length.value} digits</span>
          </div>
        )}
      </div>
    </div>
  );
}
