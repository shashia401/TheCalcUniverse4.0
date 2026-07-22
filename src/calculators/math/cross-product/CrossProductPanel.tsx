import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend,
} from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COMPONENT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

export default function CrossProductPanel({ values, results }: Props) {
  const crossProduct = results.find(r => r.id === 'crossProduct');
  const magnitude = results.find(r => r.id === 'magnitude');
  const unitVector = results.find(r => r.id === 'unitVector');
  const verification = results.find(r => r.id === 'verification');
  const area = results.find(r => r.id === 'area');

  if (!crossProduct || !magnitude || !area) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Cross Product Results
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Cross product vector */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{crossProduct.label}</p>
          <p className="text-2xl font-bold text-purple-700 font-mono">{crossProduct.value}</p>
        </div>

        {/* Magnitude and area */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">{magnitude.label}</p>
            <p className="text-xl font-bold text-slate-700 font-mono mt-0.5">{magnitude.value}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-green-600 uppercase">{area.label}</p>
            <p className="text-xl font-bold text-green-700 font-mono mt-0.5">{area.value}</p>
          </div>
        </div>

        {/* Unit vector */}
        {unitVector && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{unitVector.label}</p>
            <p className="text-sm font-mono text-slate-700 break-all">{unitVector.value}</p>
          </div>
        )}

        {/* Verification */}
        {verification && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">{verification.label}</p>
            <p className="text-sm font-mono text-amber-700 break-all">{verification.value}</p>
            <p className="text-[10px] text-amber-500 mt-1">Values should be near zero if cross product is correct (orthogonal to both inputs)</p>
          </div>
        )}

        {/* Component bar chart */}
        {(() => {
          const v1x = parseFloat(values.v1x);
          const v1y = parseFloat(values.v1y);
          const v1z = parseFloat(values.v1z);
          const v2x = parseFloat(values.v2x);
          const v2y = parseFloat(values.v2y);
          const v2z = parseFloat(values.v2z);
          if ([v1x, v1y, v1z, v2x, v2y, v2z].some(isNaN)) return null;
          const crossX = v1y * v2z - v1z * v2y;
          const crossY = v1z * v2x - v1x * v2z;
          const crossZ = v1x * v2y - v1y * v2x;
          const barData = [
            { name: 'a', x: v1x, y: v1y, z: v1z },
            { name: 'b', x: v2x, y: v2y, z: v2z },
            { name: 'a × b', x: crossX, y: crossY, z: crossZ },
          ];
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Vector Components</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    iconType="rect"
                    formatter={(value: string) => <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>{value}</span>}
                  />
                  <Bar dataKey="x" name="X" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="y" name="Y" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="z" name="Z" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
