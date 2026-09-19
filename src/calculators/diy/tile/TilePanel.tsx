import React from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { findResult as getResult } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function TileGridSVG({ layout }: { layout: string }) {
  const w = 240;
  const h = 160;
  const tileW = 40;
  const tileH = 30;

  const rows = Math.floor(h / tileH);
  const cols = Math.floor(w / tileW);

  const tiles: React.ReactNode[] = [];
  let key = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let x: number;
      let y: number;

      if (layout === 'brick') {
        const offset = row % 2 === 0 ? 0 : tileW / 2;
        x = col * tileW + offset;
        y = row * tileH;
      } else if (layout === 'diagonal') {
        const tileD = tileW * 0.7;
        x = col * tileD + (row % 2 === 0 ? 0 : tileD / 2);
        y = row * tileD * 0.5;
      } else if (layout === 'herringbone') {
        const isEven = (row + col) % 2 === 0;
        x = col * (isEven ? tileW : tileH) + (row * 5);
        y = row * (isEven ? tileH : tileW) + (col * 3);
      } else {
        x = col * tileW;
        y = row * tileH;
      }

      tiles.push(
        <rect
          key={key++}
          x={x}
          y={y}
          width={tileW - 2}
          height={tileH - 2}
          rx={2}
          fill={
            (row + col) % 2 === 0 ? '#e0f2fe' : '#f0f9ff'
          }
          stroke="#0ea5e9"
          strokeWidth={1}
          opacity={0.8}
        />
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: '180px' }} role="img" aria-label="Tile layout diagram">
      {tiles}
    </svg>
  );
}

function WasteBreakdownCard({ layout, wastePct }: { layout: string; wastePct: string }) {
  const wasteLevels: Record<string, { color: string; label: string }> = {
    grid: { color: '#22c55e', label: 'Most Efficient' },
    brick: { color: '#22c55e', label: 'Efficient' },
    diagonal: { color: '#f59e0b', label: 'Moderate Waste' },
    herringbone: { color: '#ef4444', label: 'Highest Waste' },
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Waste Factor by Layout</p>
      <div className="space-y-2">
        {Object.entries(wasteLevels).map(([key, val]) => {
          const isSelected = key === layout;
          return (
            <div
              key={key}
              className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                isSelected ? 'bg-slate-100 font-bold' : ''
              }`}
            >
              <span className="capitalize">{key}</span>
              <span className="font-semibold" style={{ color: val.color }}>
                {key === 'grid' ? '10%' : key === 'brick' ? '10%' : key === 'diagonal' ? '15%' : '20%'}
              </span>
            </div>
          );
        })}
        {wastePct && (
          <div className="mt-2 pt-2 border-t border-slate-200 text-center">
            <span className="text-sm font-bold text-slate-700">Your Waste: {wastePct}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TilePanel({ values, results }: Props) {
  const tilesRes = getResult(results, 'tilesNeeded');
  const wasteRes = getResult(results, 'wastePercent');
  const costRes = getResult(results, 'totalCost');
  const areaRes = getResult(results, 'totalArea');
  const noteRes = getResult(results, 'layoutNote');
  const layout = values.layout || 'grid';
  const wastePct = wasteRes?.value || '';

  const tileCount = tilesRes?.value?.replace(' tiles', '') || '0';
  const hasCost = costRes?.value && !costRes.value.includes('Enter');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Tile Layout & Materials</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-center">
          <p className="text-4xl font-black text-blue-700">{tileCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mt-1">Tiles Required</p>
        </div>

        <TileGridSVG layout={layout} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
          {areaRes && (
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-bold text-slate-700">{areaRes.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Room Area</p>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="font-bold text-slate-700">{values.areaLength || '0'} x {values.areaWidth || '0'} ft</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dimensions</p>
          </div>
          {values.tileLength && values.tileWidth && (
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-bold text-slate-700">{values.tileLength} x {values.tileWidth} in</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tile Size</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WasteBreakdownCard layout={layout} wastePct={wastePct} />

          <div className="space-y-3">
            {hasCost && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Total Cost</p>
                <p className="text-xl font-black text-emerald-800">{costRes?.value}</p>
              </div>
            )}
            {noteRes && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Layout Note</p>
                <p className="text-sm text-amber-800">{noteRes.value}</p>
              </div>
            )}
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Pro Tip</p>
              <p className="text-sm text-indigo-800">Always order 1-2 extra boxes for future repairs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
