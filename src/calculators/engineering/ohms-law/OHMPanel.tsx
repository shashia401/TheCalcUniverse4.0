import { CalculatorResult } from '../../../types/calculator';
import { solvePair, type VarName } from './ohmsMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function OHMPanel({ values, results }: Props) {
  const solveFor = values.solveFor || 'voltage';
  const formula = results.find((r) => r.id === 'formula');

  // Recompute from the inputs with the shared solver (never parse the formatted result strings).
  const n = (id: string) => parseFloat(values[id]);
  const pair: [VarName, number, VarName, number] =
    solveFor === 'voltage' ? ['I', n('current'), 'R', n('resistance')]
    : solveFor === 'current' ? ['V', n('voltage'), 'R', n('resistance')]
    : ['V', n('voltage'), 'I', n('current')];
  const solved = solvePair(...pair);
  const V = solved?.V ?? 0;
  const I = solved?.I ?? 0;
  const R = solved?.R ?? 0;
  const P = solved?.P ?? (solveFor === 'power' ? n('voltage') * n('current') || 0 : 0);

  if (!results.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ohm's Law Wheel</span>
      </div>
      <div className="p-5">
        {/* The Ohm's Law wheel - 4 quadrants */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <WheelQuadrant
            label="V = I × R"
            value={V > 0 ? `${V.toFixed(2)} V` : '-'}
            color="bg-red-50 border-red-200"
            textColor="text-red-700"
            highlight={solveFor === 'voltage'}
          />
          <WheelQuadrant
            label="I = V ÷ R"
            value={I > 0 ? `${I.toFixed(3)} A` : '-'}
            color="bg-blue-50 border-blue-200"
            textColor="text-blue-700"
            highlight={solveFor === 'current'}
          />
          <WheelQuadrant
            label="R = V ÷ I"
            value={R > 0 ? `${R.toFixed(2)} Ω` : '-'}
            color="bg-emerald-50 border-emerald-200"
            textColor="text-emerald-700"
            highlight={solveFor === 'resistance'}
          />
          <WheelQuadrant
            label="P = V × I"
            value={P > 0 ? `${P.toFixed(2)} W` : '-'}
            color="bg-amber-50 border-amber-200"
            textColor="text-amber-700"
            highlight={solveFor === 'power'}
          />
        </div>

        {/* Derived formulas */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold mb-2 text-center">
            Derived Values
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <DerivedRow label="P = I²R" value={I > 0 && R > 0 ? `${(I * I * R).toFixed(2)} W` : '-'} />
            <DerivedRow label="P = V²/R" value={V > 0 && R > 0 ? `${(V * V / R).toFixed(2)} W` : '-'} />
            <DerivedRow label="V = √(P × R)" value={P > 0 && R > 0 ? `${Math.sqrt(P * R).toFixed(2)} V` : '-'} />
            <DerivedRow label="I = √(P / R)" value={P > 0 && R > 0 ? `${Math.sqrt(P / R).toFixed(2)} A` : '-'} />
          </div>
        </div>

        {/* Formula used */}
        {formula && (
          <div className="mt-3 text-center text-xs text-slate-600">
            {formula.value}
          </div>
        )}
      </div>
    </div>
  );
}

function WheelQuadrant({
  label,
  value,
  color,
  textColor,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  textColor: string;
  highlight: boolean;
}) {
  return (
    <div className={`rounded-xl border ${color} px-3 py-3 text-center ${highlight ? 'ring-2 ring-indigo-400' : ''}`}>
      <p className="text-xs font-bold mb-1">{label}</p>
      <p className={`text-base font-bold ${textColor}`}>{value}</p>
      {highlight && (
        <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-indigo-700">
          Solved
        </span>
      )}
    </div>
  );
}

function DerivedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="font-semibold text-slate-600 font-mono text-[11px]">{label}</span>
      <span className="font-bold text-slate-700">{value}</span>
    </div>
  );
}
