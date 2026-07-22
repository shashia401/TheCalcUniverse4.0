import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { Sphere3D, Cube3D, Box3D, Cylinder3D, Cone3D, Pyramid3D, ShapeValues } from './ShapeRenderers';
import { ShapeNetView, netDescription } from './ShapeNets';
import { FormulaApplied } from './FormulaApplied';

const ThreeDScene = lazy(() => import('./ThreeDScene'));

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Shape Labels ─────────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<string, string> = {
  sphere: 'Sphere',
  cube: 'Cube',
  box: 'Rectangular Prism (Box)',
  cylinder: 'Cylinder',
  cone: 'Cone',
  pyramid: 'Square Pyramid',
};

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function VolumeSurfacePanel({ values, results }: Props) {
  const shape = values.shape || 'sphere';
  const d1 = parseFloat(values.dim1) || 0;
  const d2 = parseFloat(values.dim2) || 0;
  const d3 = parseFloat(values.dim3) || 0;
  const unit = ' units';

  const volume = results.find(r => r.id === 'volume');
  const surface = results.find(r => r.id === 'surface');

  if (!volume || !surface) return null;

  // Extract dimension values for net views
  const vals: ShapeValues = {};
  switch (shape) {
    case 'sphere': vals.r = d1; break;
    case 'cube': vals.s = d1; break;
    case 'box': vals.l = d1; vals.w = d2; vals.h = d3; break;
    case 'cylinder': vals.r = d1; vals.h = d2; break;
    case 'cone': vals.r = d1; vals.h = d2; break;
    case 'pyramid': vals.r = d1; vals.h = d2; break;
  }

  // ─── Interactive 3D rotation ──────────────────────────────────────────────
  const [rotX, setRotX] = useState(-15);
  const [rotY, setRotY] = useState(25);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, rotX: 0, rotY: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, rotX, rotY };
  }, [rotX, rotY]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setRotX(dragRef.current.rotY + dx * 0.5);
    setRotY(dragRef.current.rotX + dy * 0.5);
  }, [isDragging]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (isDragging) {
      e.preventDefault();
      setZoom(z => Math.max(0.5, Math.min(2.5, z - e.deltaY * 0.002)));
    }
  }, [isDragging]);

  const resetView = useCallback(() => {
    setRotX(-15); setRotY(25); setZoom(1);
  }, []);

  const [show3D, setShow3D] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">3D Shape Explorer &mdash; {SHAPE_LABELS[shape]}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Results card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Volume</p>
              <p className="text-2xl font-bold font-mono text-blue-700">{volume.value} cu{unit}</p>
            </div>
            <div className="w-px h-10 bg-blue-200" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Surface Area</p>
              <p className="text-2xl font-bold font-mono text-blue-700">{surface.value} sq{unit}</p>
            </div>
          </div>
        </div>

        {/* 3D Visualization + Net side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 3D View — interactive */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 select-none" onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">3D View</p>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-semibold">
                  <button onClick={() => { setShow3D(false); resetView(); }} className={`px-2 py-1 transition-colors ${!show3D ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>2D</button>
                  <button onClick={() => setShow3D(true)} className={`px-2 py-1 transition-colors ${show3D ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>3D</button>
                </div>
                <button onClick={resetView} className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors font-semibold" title="Reset view">&nearrow;</button>
              </div>
            </div>
            {show3D ? (
              <Suspense fallback={<div className="flex items-center justify-center min-h-[300px] bg-slate-50 rounded-lg"><p className="text-xs text-slate-400 animate-pulse">Loading 3D scene...</p></div>}>
                <ThreeDScene shape={shape} dim1={d1} dim2={d2} dim3={d3} />
              </Suspense>
            ) : (
              <div
                className="flex justify-center"
                style={{
                  perspective: '600px',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onWheel={onWheel}
              >
                <div style={{
                  transform: `rotateX(${rotY}deg) rotateY(${rotX}deg) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                  transformStyle: 'preserve-3d',
                }}>
                  {shape === 'sphere' && <Sphere3D r={d1} unit="" />}
                  {shape === 'cube' && <Cube3D s={d1} unit="" />}
                  {shape === 'box' && <Box3D l={d1} w={d2} h={d3} unit="" />}
                  {shape === 'cylinder' && <Cylinder3D r={d1} h={d2} unit="" />}
                  {shape === 'cone' && <Cone3D r={d1} h={d2} unit="" />}
                  {shape === 'pyramid' && <Pyramid3D b={d1} h={d2} unit="" />}
                </div>
              </div>
            )}
            <p className="text-[9px] text-slate-400 text-center mt-2">
              {show3D ? 'Drag to orbit • Scroll to zoom' : 'Drag to rotate • Scroll while dragging'}
            </p>
          </div>

          {/* Net View */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">The Net (Unfolded)</p>
            <div className="flex justify-center">
              <ShapeNetView shape={shape} r={d1} h={d2} l={d1} w={d2} unit="" />
            </div>
            {shape !== 'sphere' && (
              <p className="text-[9px] text-slate-500 text-center mt-2 italic">Imagine cutting along edges and flattening</p>
            )}
          </div>
        </div>

        {/* Net description */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">How the Net Works</p>
          <p className="text-xs text-amber-800 leading-relaxed">{netDescription(shape, vals)}</p>
        </div>

        {/* Formula Application */}
        <FormulaApplied shape={shape} vals={vals} results={results} />

        {/* Extra details for specific shapes */}
        {shape === 'sphere' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">Interesting Fact</p>
            <p className="text-xs text-purple-700 leading-relaxed">
              The sphere is the most efficient 3D shape &mdash; it has the largest volume for the smallest surface area.
              A sphere's surface area (4&pi;r&sup2;) is exactly 4 times the area of its great circle (&pi;r&sup2;).
            </p>
          </div>
        )}

        {shape === 'cylinder' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">Understanding the Net</p>
            <p className="text-xs text-purple-700 leading-relaxed">
              The rectangular part of the net has width = circumference = 2&pi;r and height = h.
              Its area (2&pi;rh) is the lateral surface area. Add the two circles (2 &times; &pi;r&sup2;) to get the total surface area.
            </p>
          </div>
        )}

        {shape === 'cone' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">Understanding the Net</p>
            <p className="text-xs text-purple-700 leading-relaxed">
              The lateral surface unfolds into a sector of a circle with radius = slant height (l = &radic;(r&sup2; + h&sup2;)).
              The sector's arc length equals the base circumference (2&pi;r), and its area = &pi;rl.
            </p>
          </div>
        )}

        {shape === 'pyramid' && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">Understanding the Net</p>
            <p className="text-xs text-purple-700 leading-relaxed">
              Each triangular face has base = b and height = slant height (l = &radic;(h&sup2; + (b/2)&sup2;)).
              The area of all 4 triangles = 2bl, plus the square base (b&sup2;) = total surface area.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
