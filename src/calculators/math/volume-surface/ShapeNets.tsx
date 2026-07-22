// ─── Shape Nets (Unfolded 3D Shapes) ─────────────────────────────────────────

export function CubeNetImproved() {
  const s = 30;
  return (
    <svg width={320} height={420} viewBox="0 0 160 210" role="img" aria-label="Cube net diagram showing 6-square cross shape">
      <g transform="translate(5, 5)" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="1.5">
        <rect x={s} y={0} width={s} height={s} />
        <rect x={s} y={s} width={s} height={s} />
        <rect x={0} y={s} width={s} height={s} />
        <rect x={s * 2} y={s} width={s} height={s} />
        <rect x={s} y={s * 2} width={s} height={s} />
        <rect x={s} y={s * 3} width={s} height={s} />
        {[{x:s+s/2,y:3},{x:5,y:s+s/2},{x:s*2+5,y:s+s/2},{x:s+s/2,y:s*3+3}].map((p,i) => (
          <circle key={`item-${i}`} cx={p.x} cy={p.y} r="2" fill="#3b82f6" opacity="0.5" />
        ))}
      </g>
      <text x={80} y={205} textAnchor="middle" fill="#64748b" fontSize="9">6 equal squares &mdash; fold along edges</text>
    </svg>
  );
}

export function CylinderNetImproved({ r, h, unit }: { r: number; h: number; unit: string }) {
  const rn = Math.min(Math.max(r * 3, 12), 25);
  const hh = Math.min(Math.max(h * 2, 20), 45);
  const rectW = 2 * Math.PI * rn;
  return (
    <svg width={360} height={240} viewBox="0 0 180 120" role="img" aria-label="Cylinder net diagram showing two circles and a rectangle">
      <circle cx={rn + 8} cy={rn + 5} r={rn} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx={rn + 8} cy={95 - rn} r={rn} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={rn + 8} y={rn + 5} textAnchor="middle" fill="#64748b" fontSize="8" dominantBaseline="middle">{r}&pi;</text>
      <rect x={rn * 2 + 14} y={95 - hh - 10} width={rectW} height={hh} fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="1.5" rx="1" />
      <text x={rn * 2 + 14 + rectW / 2} y={95 - hh - 10 + hh / 2} textAnchor="middle" fill="#64748b" fontSize="8" dominantBaseline="middle">2&pi;r = {rectW.toFixed(0)}</text>
      <text x={rn * 2 + 14 + rectW + 6} y={95 - 10} textAnchor="start" fill="#64748b" fontSize="8">h = {h}{unit}</text>
      <text x={90} y={115} textAnchor="middle" fill="#64748b" fontSize="8">2 circles + 1 rectangle</text>
    </svg>
  );
}

export function ConeNetImproved({ r, h, unit }: { r: number; h: number; unit: string }) {
  const rn = Math.min(Math.max(r * 3, 12), 22);
  const slant = Math.sqrt(r * r + h * h);
  const slantPx = Math.min(Math.max(slant * 2, 20), 50);
  const cx = 120, cy = 100;
  return (
    <svg width={400} height={240} viewBox="0 0 200 120" role="img" aria-label="Cone net diagram showing a circle base and lateral sector">
      <circle cx={rn + 8} cy={100 - rn} r={rn} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={rn + 8} y={100 - rn} textAnchor="middle" fill="#64748b" fontSize="8" dominantBaseline="middle">Base</text>
      <path d={`M ${cx} ${cy} L ${cx + slantPx} ${cy} A ${slantPx} ${slantPx} 0 0 1 ${cx - slantPx * 0.6} ${cy - slantPx * 0.8} Z`}
        fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={cx + slantPx * 0.3} y={cy - slantPx * 0.3} textAnchor="middle" fill="#64748b" fontSize="8">Sector (lateral)</text>
      <text x={cx + slantPx * 0.5} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="7">l = {slant.toFixed(1)}{unit}</text>
      <text x={100} y={115} textAnchor="middle" fill="#64748b" fontSize="8">Circle base + lateral sector</text>
    </svg>
  );
}

export function SphereNetImproved() {
  return (
    <svg width={400} height={160} viewBox="0 0 200 80" role="img" aria-label="Sphere net diagram showing orange-peel gores">
      <g fill="rgba(59,130,246,0.04)" stroke="#3b82f6" strokeWidth="0.8">
        {[-40, -20, 0, 20, 40].map((dx, i) => (
          <ellipse key={`item-${i}`} cx={100 + dx} cy="35" rx="10" ry="28" fill="rgba(59,130,246,0.05)" stroke="#94a3b8" strokeWidth="0.8" />
        ))}
      </g>
      <text x={100} y={62} textAnchor="middle" fill="#64748b" fontSize="9">A sphere has NO flat net &mdash; its surface is curved</text>
      <text x={100} y={73} textAnchor="middle" fill="#94a3b8" fontSize="8">Surface area = 4&pi;r&sup2; (same as 4 great circles)</text>
    </svg>
  );
}

export function BoxNetImproved({ l, w, h }: { l: number; w: number; h: number }) {
  const scale = Math.min(8 / Math.max(l || 1, w || 1, h || 1, 1), 8);
  const sL = Math.max((l || 1) * scale, 28);
  const sW = Math.max((w || 1) * scale, 18);
  const sH = Math.max((h || 1) * scale, 18);
  return (
    <svg width={360} height={300} viewBox="0 0 180 150" role="img" aria-label="Rectangular prism net diagram showing 6 rectangles in a cross pattern">
      <g transform="translate(5, 5)" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="1.5">
        <rect x={sW} y={0} width={sL} height={sH} />
        <rect x={0} y={sH} width={sW} height={sH} />
        <rect x={sW} y={sH} width={sL} height={sH} />
        <rect x={sW + sL} y={sH} width={sW} height={sH} />
        <rect x={sW} y={sH * 2} width={sL} height={sH} />
      </g>
      <text x={90} y={140} textAnchor="middle" fill="#64748b" fontSize="8">3 pairs of congruent rectangles</text>
    </svg>
  );
}

export function PyramidNetImproved({ b }: { b: number }) {
  const base = Math.min(Math.max(b * 2, 20), 40);
  return (
    <svg width={300} height={300} viewBox="0 0 150 150" role="img" aria-label="Pyramid net diagram showing a square base with four surrounding triangles">
      <g transform="translate(5, 5)" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="1.5">
        <rect x={75 - base / 2} y={75 - base / 2} width={base} height={base} fill="rgba(59,130,246,0.1)" />
        <polygon points={`${75 - base / 2},${75 - base / 2} ${75 + base / 2},${75 - base / 2} ${75},${75 - base / 2 - base * 0.7}`} />
        <polygon points={`${75 + base / 2},${75 - base / 2} ${75 + base / 2},${75 + base / 2} ${75 + base / 2 + base * 0.7},${75}`} />
        <polygon points={`${75 + base / 2},${75 + base / 2} ${75 - base / 2},${75 + base / 2} ${75},${75 + base / 2 + base * 0.7}`} />
        <polygon points={`${75 - base / 2},${75 + base / 2} ${75 - base / 2},${75 - base / 2} ${75 - base / 2 - base * 0.7},${75}`} />
      </g>
      <text x={80} y={142} textAnchor="middle" fill="#64748b" fontSize="8">1 square base + 4 triangles</text>
    </svg>
  );
}

// ─── Net Selector ───────────────────────────────────────────────────────────

export function ShapeNetView({ shape, r, h, l, w, unit }: { shape: string; r: number; h: number; l: number; w: number; unit: string }) {
  switch (shape) {
    case 'cube': return <CubeNetImproved />;
    case 'cylinder': return <CylinderNetImproved r={r} h={h} unit={unit} />;
    case 'cone': return <ConeNetImproved r={r} h={h} unit={unit} />;
    case 'sphere': return <SphereNetImproved />;
    case 'box': return <BoxNetImproved l={l} w={w} h={h} />;
    case 'pyramid': return <PyramidNetImproved b={r} />;
    default: return null;
  }
}

export function netDescription(shape: string, vals: { r?: number; h?: number; l?: number; w?: number; s?: number }) {
  switch (shape) {
    case 'cube': return `A cube has 6 congruent square faces. When unfolded, they form a cross. Each square has side length ${vals.s || 's'}. All edges are equal.`;
    case 'cylinder': return `A cylinder unfolds into 2 circles (top + bottom, area = &pi;r&sup2; each) and 1 rectangle (the lateral surface). The rectangle's width equals the circumference (2&pi;r &asymp; ${(2 * Math.PI * (vals.r || 0)).toFixed(1)}) and its height equals the cylinder height (${vals.h || 'h'}).`;
    case 'cone': return `A cone unfolds into 1 circle (the base, area = &pi;r&sup2;) and 1 sector of a larger circle (the lateral surface). The sector's radius equals the slant height (l = &radic;(r&sup2; + h&sup2;) &asymp; ${Math.sqrt((vals.r || 0) ** 2 + (vals.h || 0) ** 2).toFixed(2)}).`;
    case 'sphere': return `A sphere is unique among 3D shapes &mdash; it has NO flat net because its surface is continuously curved. Unlike polyhedra, a sphere cannot be unfolded into flat polygons without distortion (similar to how you cannot flatten an orange peel without tearing). Use formulas directly: SA = 4&pi;r&sup2;.`;
    case 'box': return `A rectangular prism (box) has 6 faces in 3 congruent pairs: top/bottom (l&times;w), front/back (l&times;h), and left/right (w&times;h). The net shows all 6 rectangles unfolded in a cross pattern.`;
    case 'pyramid': return `A square pyramid unfolds into 1 square base (area = b&sup2;) and 4 congruent isosceles triangles. Each triangle has base = side length (${vals.r || 'b'}) and height equal to the slant height (l = &radic;(h&sup2; + (b/2)&sup2;) &asymp; ${Math.sqrt((vals.h || 0) ** 2 + ((vals.r || 0) / 2) ** 2).toFixed(2)}).`;
    default: return '';
  }
}
