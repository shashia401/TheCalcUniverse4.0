import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { analyzeLcm, multiplesOf, parseLcmInput } from './lcmMath';
import { formatFactorization } from '../../../utils/numberTheory';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const SHOWN = 3; // numbers whose multiples are listed
const MAX_MULTIPLES = 60;
const SERIES_COLORS = ['#2563eb', '#dc2626', '#047857'];

export default function LCMPanel({ values, results }: Props) {
  const parsed = parseLcmInput(values.numbers);
  const nums = parsed.kind === 'ok' ? parsed.nums : [];
  const analysis = useMemo(() => (nums.length ? analyzeLcm(nums) : null), [values.numbers]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!analysis || results.length === 0) return null;
  const { lcm, gcd, steps, factors, lcmFactors } = analysis;
  const lcmText = lcm.toString();

  // Multiples of the first few numbers, up to (and including) the LCM when it comes within MAX_MULTIPLES.
  const lists = nums.slice(0, SHOWN).map((n) => {
    const upToLcm = lcm / n; // exact: n divides the LCM
    const count = upToLcm <= BigInt(MAX_MULTIPLES) ? Number(upToLcm) : MAX_MULTIPLES;
    return { n, multiples: multiplesOf(n, count), reachesLcm: upToLcm <= BigInt(MAX_MULTIPLES) };
  });
  const plottable = lists.every((l) => l.multiples !== null);
  const lcmNum = lcm <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(lcm) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">LCM — Two Methods</span>
      </div>

      <div className="p-5 space-y-4">
        {/* LCM Result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Least Common Multiple</p>
          <p className="text-3xl font-bold font-mono text-emerald-700 break-all">{lcmText}</p>
        </div>

        {/* Multiples comparison chart */}
        {plottable && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Multiples Comparison</p>
            <SvgLineChart
              ariaLabel={`Multiples of ${lists.map((l) => l.n).join(', ')} plotted against the multiplier; the LCM is ${lcmText}`}
              height={200}
              series={lists.map((l, i) => ({
                name: `Multiples of ${l.n}`,
                color: SERIES_COLORS[i],
                points: (l.multiples ?? []).map((m, k) => ({ x: k + 1, y: m })),
              }))}
              refLines={lcmNum !== null && lists.every((l) => l.reachesLcm) ? [{ y: lcmNum, label: `LCM = ${lcmText}`, color: '#047857' }] : []}
              xFormat={(v) => `×${v}`}
            />
            <p className="text-[10px] text-slate-600 mt-1 text-center">
              {lists.map((l) => `× ${l.n}`).join(', ')} — x is the multiplier, y the multiple. All lines meet at the LCM when it is reached.
            </p>
          </div>
        )}

        {/* Method 1: List of Multiples */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">Method 1 — List of Multiples</p>
          <div className="space-y-2">
            {lists.map((l) => (
              <div key={l.n.toString()}>
                <p className="text-xs font-bold text-blue-700 mb-1">Multiples of {l.n.toString()}:</p>
                {l.multiples ? (
                  <div className="flex flex-wrap gap-1">
                    {l.multiples.map((m, i) => (
                      <span key={`item-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${l.reachesLcm && i === l.multiples!.length - 1 ? 'bg-emerald-200 text-emerald-900 ring-2 ring-emerald-500' : 'bg-white text-blue-700'}`}>
                        {m}
                      </span>
                    ))}
                    {!l.reachesLcm && <span className="text-xs text-blue-700 self-center">… (the LCM is multiple #{(lcm / l.n).toString()})</span>}
                  </div>
                ) : (
                  <p className="text-xs text-blue-700">Too large to list — the LCM is multiple #{(lcm / l.n).toString()} of {l.n.toString()}.</p>
                )}
              </div>
            ))}
            <p className="text-xs text-blue-700 mt-1">The first multiple shared by every number is the LCM: <strong className="break-all">{lcmText}</strong></p>
          </div>
        </div>

        {/* Method 2: Prime Factorization */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-2">Method 2 — Prime Factorization</p>
          <div className="space-y-1">
            {nums.map((n, i) => (
              <p key={`item-${i}`} className="text-sm font-mono text-purple-800 break-all">
                {n.toString()} = {factors[i] ? formatFactorization(factors[i]!) : 'too large to factor here'}
              </p>
            ))}
            {lcmFactors && <p className="text-sm font-mono font-bold text-purple-900 break-all">LCM = {formatFactorization(lcmFactors)} = {lcmText}</p>}
            <p className="text-xs text-purple-700 mt-1">Take the highest exponent of each prime factor across all numbers.</p>
          </div>
        </div>

        {/* Formula card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">LCM Formula</p>
          <p className="text-sm font-mono text-slate-700">LCM(a, b) = (a × b) / GCD(a, b)</p>
          <div className="text-xs text-slate-600 mt-1 font-mono space-y-0.5 break-all">
            {steps.map((s, i) => (
              <p key={`item-${i}`}>{s}</p>
            ))}
            <p>GCD of all numbers = {gcd.toString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
