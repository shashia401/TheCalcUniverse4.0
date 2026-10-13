import type React from 'react';
import { CalculatorResult } from '../../../types/calculator';
import MiniRing from '../../../components/calculator/MiniRing';
import { computeFraction, OP_SYMBOL } from './fractionMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function FractionPie({ numerator, denominator, label, color }: { numerator: number; denominator: number; label: string; color: string }) {
  if (denominator <= 0 || denominator > 20) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      <MiniRing value={numerator} total={denominator} color={color} label={`${label}: ${Math.min(Math.max(numerator, 0), denominator)} of ${denominator} parts`} />
      <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function FractionPanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const decimalRow = results.find(r => r.id === 'decimal');
  const outcome = computeFraction(values);
  if (outcome.kind !== 'ok' || !resultRow) return null;
  const { comp } = outcome;

  // Exact BigInt values from the shared computation, shown as strings (no float round-trip).
  const mode = comp.op;
  const opSymbol = OP_SYMBOL[mode];
  const small = (n: bigint) => Number(n); // only used for the <= 20-part pie charts, where n is tiny or clamped
  const abs = (n: bigint) => (n < 0n ? -n : n);
  const { n: aNum, d: aDen } = comp.a;
  const { n: bNum, d: bDen } = comp.b;

  const renderFraction = (num: bigint, den: bigint, size: 'sm' | 'md' = 'md') => {
    const textClass = size === 'md' ? 'text-sm' : 'text-xs';
    return (
      <span className={`inline-flex flex-col items-center mx-1 ${textClass}`}>
        <span className={`border-b border-slate-500 px-1.5 ${num < 0n ? 'text-red-600' : 'text-slate-800'}`}>
          {num.toString()}
        </span>
        <span className="px-1.5 text-slate-600">
          {den.toString()}
        </span>
      </span>
    );
  };

  let stepsContent: React.ReactNode;

  if (mode === 'add' || mode === 'subtract') {
    const commonLcm = comp.lcd!;
    const factorA = comp.factorA!;
    const factorB = comp.factorB!;
    const adjustedANum = comp.adjA!;
    const adjustedBNum = comp.adjB!;
    const resultNum = comp.rawN;
    const resultGcd = comp.gcd;
    const simplifiedNum = comp.result.n;
    const simplifiedDen = comp.result.d;

    stepsContent = (
      <div className="space-y-3">
        {/* Step 1: LCM */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Find LCM of Denominators</p>
          <p className="text-xs font-mono text-slate-700 mt-1">
            LCM({aDen.toString()}, {bDen.toString()}) = {commonLcm.toString()}
          </p>
        </div>

        {/* Step 2: Adjust fractions */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Convert to Common Denominator</p>
          <p className="text-xs font-mono text-slate-700 mt-2 flex items-center flex-wrap">
            {renderFraction(aNum, aDen)}
            <span className="text-slate-500 mx-1">→</span>
            {renderFraction(adjustedANum, commonLcm)}
            <span className="text-slate-500 mx-1">(×{factorA.toString()})</span>
          </p>
          <p className="text-xs font-mono text-slate-700 mt-1 flex items-center flex-wrap">
            {renderFraction(bNum, bDen)}
            <span className="text-slate-500 mx-1">→</span>
            {renderFraction(adjustedBNum, commonLcm)}
            <span className="text-slate-500 mx-1">(×{factorB.toString()})</span>
          </p>
        </div>

        {/* Step 3: Combine */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 3: {mode === 'add' ? 'Add' : 'Subtract'} Numerators</p>
          <p className="text-xs font-mono text-slate-700 mt-2 flex items-center flex-wrap">
            {renderFraction(adjustedANum, commonLcm)}
            <span className="text-slate-600 mx-1 font-bold">{opSymbol}</span>
            {renderFraction(adjustedBNum, commonLcm)}
            <span className="text-slate-500 mx-1">=</span>
            {renderFraction(resultNum, commonLcm)}
          </p>
        </div>

        {/* Step 4: Simplify */}
        {resultGcd > 1n && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 4: Simplify</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              GCD({abs(resultNum).toString()}, {commonLcm.toString()}) = {resultGcd.toString()}
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1 flex items-center flex-wrap">
              {renderFraction(resultNum, commonLcm)}
              <span className="text-slate-500 mx-1">=</span>
              {renderFraction(simplifiedNum, simplifiedDen)}
            </p>
          </div>
        )}

        {/* Final result */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Result</p>
          <p className="text-sm font-bold text-blue-700 mt-1 flex items-center flex-wrap">
            {resultRow.value}
          </p>
        </div>
      </div>
    );
  } else if (mode === 'multiply') {
    const resultNum = comp.rawN;
    const resultDen = comp.rawD;
    const resultGcd = comp.gcd;
    const simplifiedNum = comp.result.n;
    const simplifiedDen = comp.result.d;

    stepsContent = (
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Multiply Numerators &amp; Denominators</p>
          <p className="text-xs font-mono text-slate-700 mt-2 flex items-center flex-wrap">
            {renderFraction(aNum, aDen)}
            <span className="text-slate-500 mx-1">×</span>
            {renderFraction(bNum, bDen)}
            <span className="text-slate-500 mx-1">=</span>
            <span className="inline-flex flex-col items-center mx-1 text-sm">
              <span className="border-b border-slate-500 px-1.5 text-slate-800">{aNum.toString()}×{bNum.toString()}</span>
              <span className="px-1.5 text-slate-600">{aDen.toString()}×{bDen.toString()}</span>
            </span>
            <span className="text-slate-500 mx-1">=</span>
            {renderFraction(resultNum, resultDen)}
          </p>
        </div>
        {resultGcd > 1n && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Simplify</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              GCD({abs(resultNum).toString()}, {resultDen.toString()}) = {resultGcd.toString()}
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1 flex items-center flex-wrap">
              {renderFraction(resultNum, resultDen)}
              <span className="text-slate-500 mx-1">→</span>
              {renderFraction(simplifiedNum, simplifiedDen)}
            </p>
          </div>
        )}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Result</p>
          <p className="text-sm font-bold text-blue-700 mt-1">{resultRow.value}</p>
        </div>
      </div>
    );
  } else if (mode === 'divide') {
    const resultNum = comp.rawN;
    const resultDen = comp.rawD;
    const resultGcd = comp.gcd;
    const simplifiedNum = comp.result.n;
    const simplifiedDen = comp.result.d;

    stepsContent = (
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Flip the Second Fraction (Reciprocal)</p>
          <p className="text-xs font-mono text-slate-700 mt-2 flex items-center flex-wrap">
            {renderFraction(bNum, bDen)}
            <span className="text-slate-500 mx-1">→</span>
            {renderFraction(bDen, bNum)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Multiply by the Reciprocal</p>
          <p className="text-xs font-mono text-slate-700 mt-2 flex items-center flex-wrap">
            {renderFraction(aNum, aDen)}
            <span className="text-slate-500 mx-1">×</span>
            {renderFraction(bDen, bNum)}
            <span className="text-slate-500 mx-1">=</span>
            {renderFraction(resultNum, resultDen)}
          </p>
        </div>
        {resultGcd > 1n && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 3: Simplify</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              GCD({abs(resultNum).toString()}, {abs(resultDen).toString()}) = {resultGcd.toString()}
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1 flex items-center flex-wrap">
              {renderFraction(resultNum, resultDen)}
              <span className="text-slate-500 mx-1">→</span>
              {renderFraction(simplifiedNum, simplifiedDen)}
            </p>
          </div>
        )}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Result</p>
          <p className="text-sm font-bold text-blue-700 mt-1">{resultRow.value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Operation card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Operation</p>
          <p className="text-2xl font-bold text-blue-700 flex items-center justify-center gap-2">
            {renderFraction(aNum, aDen, 'md')}
            <span className="text-slate-500">{opSymbol}</span>
            {renderFraction(bNum, bDen, 'md')}
          </p>
        </div>

        {/* Fraction pie charts */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 text-center">Visual Representation</p>
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            <FractionPie numerator={small(abs(aNum))} denominator={small(aDen)} label={`${aNum}/${aDen}`} color="#3b82f6" />
            <span aria-hidden="true" className="text-xl font-bold text-slate-600">{opSymbol}</span>
            <FractionPie numerator={small(abs(bNum))} denominator={small(bDen)} label={`${bNum}/${bDen}`} color="#f59e0b" />
            <span aria-hidden="true" className="text-xl font-bold text-slate-600">=</span>
            <FractionPie
              numerator={small(abs(comp.result.n))}
              denominator={small(comp.result.d)}
              label={resultRow.value}
              color="#8b5cf6"
            />
          </div>
        </div>

        {stepsContent}

        {/* Decimal equivalent */}
        {decimalRow && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Decimal Equivalent</p>
            <p className="text-sm font-mono text-slate-700">{decimalRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
