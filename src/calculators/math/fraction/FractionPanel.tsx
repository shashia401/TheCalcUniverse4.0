import type React from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function FractionPie({ numerator, denominator, label, color }: { numerator: number; denominator: number; label: string; color: string }) {
  if (denominator <= 0 || denominator > 20) return null;
  const filled = Math.min(Math.max(numerator, 0), denominator);
  const data = [
    { name: 'Filled', value: filled },
    { name: 'Empty', value: denominator - filled },
  ];
  return (
    <div className="flex flex-col items-center gap-1">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={45} startAngle={90} endAngle={-270} paddingAngle={0}>
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export default function FractionPanel({ values, results }: Props) {
  const operationRow = results.find(r => r.id === 'operation');
  const resultRow = results.find(r => r.id === 'result');
  const decimalRow = results.find(r => r.id === 'decimal');
  if (!operationRow || !resultRow) return null;

  const mode = values.mode || 'add';
  const aNum = parseInt(values.aNum) || 0;
  const aDen = parseInt(values.aDen) || 1;
  const bNum = parseInt(values.bNum) || 0;
  const bDen = parseInt(values.bDen) || 1;

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(4).replace(/\.?0+$/, '');
  };

  const opSymbols: Record<string, string> = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷',
  };
  const opSymbol = opSymbols[mode] || '+';

  const renderFraction = (num: number, den: number, size: 'sm' | 'md' = 'md') => {
    const textClass = size === 'md' ? 'text-sm' : 'text-xs';
    return (
      <span className={`inline-flex flex-col items-center mx-1 ${textClass}`}>
        <span className={`border-b border-slate-500 px-1.5 ${num < 0 ? 'text-red-600' : 'text-slate-800'}`}>
          {fmt(num)}
        </span>
        <span className="px-1.5 text-slate-600">
          {fmt(den)}
        </span>
      </span>
    );
  };

  let stepsContent: React.ReactNode;

  if (mode === 'add' || mode === 'subtract') {
    const commonLcm = lcm(aDen, bDen);
    const factorA = commonLcm / aDen;
    const factorB = commonLcm / bDen;
    const adjustedANum = aNum * factorA;
    const adjustedBNum = bNum * factorB;
    const resultNum = mode === 'add' ? adjustedANum + adjustedBNum : adjustedANum - adjustedBNum;
    const resultGcd = gcd(Math.abs(resultNum), commonLcm);
    const simplifiedNum = resultNum / resultGcd;
    const simplifiedDen = commonLcm / resultGcd;

    stepsContent = (
      <div className="space-y-3">
        {/* Step 1: LCM */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Find LCM of Denominators</p>
          <p className="text-xs font-mono text-slate-700 mt-1">
            LCM({aDen}, {bDen}) = {commonLcm}
          </p>
        </div>

        {/* Step 2: Adjust fractions */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Convert to Common Denominator</p>
          <p className="text-xs font-mono text-slate-700 mt-2 flex items-center flex-wrap">
            {renderFraction(aNum, aDen)}
            <span className="text-slate-500 mx-1">→</span>
            {renderFraction(adjustedANum, commonLcm)}
            <span className="text-slate-300 mx-1">(×{fmt(factorA)})</span>
          </p>
          <p className="text-xs font-mono text-slate-700 mt-1 flex items-center flex-wrap">
            {renderFraction(bNum, bDen)}
            <span className="text-slate-500 mx-1">→</span>
            {renderFraction(adjustedBNum, commonLcm)}
            <span className="text-slate-300 mx-1">(×{fmt(factorB)})</span>
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
        {resultGcd > 1 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 4: Simplify</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              GCD({fmt(Math.abs(resultNum))}, {commonLcm}) = {resultGcd}
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
    const resultNum = aNum * bNum;
    const resultDen = aDen * bDen;
    const resultGcd = gcd(Math.abs(resultNum), resultDen);
    const simplifiedNum = resultNum / resultGcd;
    const simplifiedDen = resultDen / resultGcd;

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
              <span className="border-b border-slate-500 px-1.5 text-slate-800">{aNum}×{bNum}</span>
              <span className="px-1.5 text-slate-600">{aDen}×{bDen}</span>
            </span>
            <span className="text-slate-500 mx-1">=</span>
            {renderFraction(resultNum, resultDen)}
          </p>
        </div>
        {resultGcd > 1 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Simplify</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              GCD({fmt(Math.abs(resultNum))}, {resultDen}) = {resultGcd}
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
    const resultNum = aNum * bDen;
    const resultDen = bNum !== 0 ? aDen * bNum : 1;
    const resultGcd = gcd(Math.abs(resultNum), Math.abs(resultDen));
    const simplifiedNum = resultNum / resultGcd;
    const simplifiedDen = resultDen / resultGcd;

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
        {resultGcd > 1 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 3: Simplify</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              GCD({fmt(Math.abs(resultNum))}, {Math.abs(resultDen)}) = {resultGcd}
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
            <FractionPie numerator={aNum} denominator={aDen} label={`${Math.abs(aNum)}/${aDen}`} color="#3b82f6" />
            <span className="text-xl font-bold text-slate-400">{opSymbol}</span>
            <FractionPie numerator={bNum} denominator={bDen} label={`${Math.abs(bNum)}/${bDen}`} color="#f59e0b" />
            <span className="text-xl font-bold text-slate-400">=</span>
            <FractionPie
              numerator={parseInt((results.find(r => r.id === 'result')?.value || '0').split('/')[0])}
              denominator={parseInt((results.find(r => r.id === 'result')?.value || '1').split('/')[1] || '1')}
              label={results.find(r => r.id === 'result')?.value || ''}
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
