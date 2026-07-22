import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { PVData } from './presentValueTypes';
import { FormulaDisplay } from './FormulaDisplay';
import { TimeArrow } from './TimeArrow';
import { GrowthChart } from './GrowthChart';
import { CompoundingTable } from './CompoundingTable';
import { BenchmarkCard } from './BenchmarkCard';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function PresentValuePanel({ results }: Props) {
  const data = useMemo<PVData | null>(() => {
    const raw = results.find((r) => r.id === '_pvData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as PVData;
    } catch {
      return null;
    }
  }, [results]);

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-slate-500"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Present Value Deep Dive
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. Formula display */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Formula &amp; Calculation Breakdown
          </p>
          <FormulaDisplay data={data} />
        </div>

        {/* 2. Time arrow */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Time Value of Money Visualization
          </p>
          <TimeArrow data={data} />
        </div>

        {/* 3. Growth chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Growth Timeline &mdash; PV to FV
          </p>
          <GrowthChart data={data} />
        </div>

        {/* 4. Compounding comparison */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Compounding Frequency Comparison
          </p>
          <CompoundingTable data={data} />
        </div>

        {/* 5. Real-world benchmarks */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Real-World Benchmarks
          </p>
          <BenchmarkCard data={data} />
        </div>

        {/* Explanatory note */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4">
          <p className="text-xs font-bold text-blue-700 mb-1">Key Insight: Time Value of Money</p>
          <p className="text-xs text-blue-600">
            A dollar today is worth more than a dollar tomorrow because it can be invested to earn a
            return. Present Value quantifies exactly how much a future sum is worth in today's
            dollars. The higher the discount rate and the further in the future, the less a future
            dollar is worth today &mdash; which is why high-inflation environments dramatically erode the
            value of long-dated promises.
          </p>
        </div>
      </div>
    </div>
  );
}
