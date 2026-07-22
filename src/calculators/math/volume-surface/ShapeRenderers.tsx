export interface ShapeValues {
  r?: number;
  s?: number;
  l?: number;
  w?: number;
  h?: number;
}

// ─── 3D Isometric Shape Views ────────────────────────────────────────────────

export function Sphere3D({ r, unit }: { r: number; unit: string }) {
  const cx = 220, cy = 175;
  const radius = Math.min(Math.max(r * 6, 40), 120);
  return (
    <svg width="100%" height="auto" viewBox="0 0 440 360" role="img" aria-label={'Sphere 3D diagram showing radius r equals ' + r + unit} style={{ maxWidth: '440px' }}>
      <defs>
        <radialGradient id="sphereGrad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.25)" />
          <stop offset="60%" stopColor="rgba(59,130,246,0.12)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.04)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={radius} fill="url(#sphereGrad)" stroke="#3b82f6" strokeWidth="2" />
      <ellipse cx={cx} cy={cy} rx={radius} ry={radius * 0.35} fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="1" strokeDasharray="4 3" />
      <ellipse cx={cx} cy={cy} rx={radius * 0.35} ry={radius} fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="1" strokeDasharray="4 3" />
      <ellipse cx={cx - radius * 0.25} cy={cy - radius * 0.25} rx={radius * 0.15} ry={radius * 0.08} fill="rgba(255,255,255,0.4)" />
      <line x1={cx} y1={cy} x2={cx + radius} y2={cy} stroke="#ef4444" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="2.5" fill="#ef4444" />
      <text x={cx + radius / 2} y={cy - 6} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">r = {r}{unit}</text>
      <text x={cx} y={cy + radius + 18} textAnchor="middle" fill="#64748b" fontSize="10">Sphere</text>
      <text x={cx} y={cy + radius + 28} textAnchor="middle" fill="#94a3b8" fontSize="9">V = &sup4;&frasl;&#8323;&pi;r&sup3; &nbsp; SA = 4&pi;r&sup2;</text>
    </svg>
  );
}

export function Cube3D({ s, unit }: { s: number; unit: string }) {
  const side = Math.min(Math.max(s * 2.5, 20), 65);
  const dx = side * 0.3, dy = side * 0.2;
  const ox = 100 - side / 2, oy = 95 - side / 2 - dy;
  const pts = {
    f1: `${ox},${oy + dy} ${ox + side},${oy + dy} ${ox + side},${oy + side + dy} ${ox},${oy + side + dy}`,
    t: `${ox + dx},${oy} ${ox + side + dx},${oy} ${ox + side},${oy + dy} ${ox},${oy + dy}`,
    r: `${ox + side},${oy + dy} ${ox + side + dx},${oy} ${ox + side + dx},${oy + side} ${ox + side},${oy + side + dy}`,
  };
  return (
    <svg width="360" height="310" viewBox="0 0 360 310" role="img" aria-label={'Cube 3D diagram showing side length s equals ' + s + unit}>
      <polygon points={pts.t} fill="rgba(59,130,246,0.06)" stroke="#94a3b8" strokeWidth="1" />
      <polygon points={pts.r} fill="rgba(59,130,246,0.08)" stroke="#94a3b8" strokeWidth="1" />
      <polygon points={pts.f1} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="2" />
      <text x={ox + side / 2} y={oy + side + dy + 16} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">s = {s}{unit}</text>
      <text x={ox + side + 6} y={oy + dy + side / 2} textAnchor="start" fill="#10b981" fontSize="10" fontWeight="bold">s</text>
      <text x={ox + dx / 2 - 4} y={oy + dy / 2} textAnchor="end" fill="#8b5cf6" fontSize="10" fontWeight="bold">s</text>
      <text x={100} y={oy + side + dy + 28} textAnchor="middle" fill="#94a3b8" fontSize="9">V = s&sup3; &nbsp; SA = 6s&sup2;</text>
    </svg>
  );
}

export function Box3D({ l, w, h, unit }: { l: number; w: number; h: number; unit: string }) {
  const maxD = Math.max(l || 1, w || 1, h || 1, 1);
  const scale = Math.min(55 / maxD, 12);
  const sL = Math.max((l || 1) * scale, 25);
  const sW = Math.max((w || 1) * scale, 15);
  const sH = Math.max((h || 1) * scale, 15);
  const dx = sW * 0.4, dy = sH * 0.15;
  const ox = 100 - sL / 2, oy = 95 - sH / 2 - dy;
  const pts = {
    f: `${ox},${oy + dy} ${ox + sL},${oy + dy} ${ox + sL},${oy + sH + dy} ${ox},${oy + sH + dy}`,
    t: `${ox + dx},${oy} ${ox + sL + dx},${oy} ${ox + sL},${oy + dy} ${ox},${oy + dy}`,
    r: `${ox + sL},${oy + dy} ${ox + sL + dx},${oy} ${ox + sL + dx},${oy + sH} ${ox + sL},${oy + sH + dy}`,
  };
  return (
    <svg width="360" height="310" viewBox="0 0 360 310" role="img" aria-label={'Rectangular prism 3D diagram showing length l equals ' + l + unit + ', width w equals ' + w + unit + ', height h equals ' + h + unit}>
      <polygon points={pts.t} fill="rgba(59,130,246,0.06)" stroke="#94a3b8" strokeWidth="1" />
      <polygon points={pts.r} fill="rgba(59,130,246,0.08)" stroke="#94a3b8" strokeWidth="1" />
      <polygon points={pts.f} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="2" />
      <text x={ox + sL / 2} y={oy + sH + dy + 16} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">l = {l}{unit}</text>
      <text x={ox + sL + 6} y={oy + dy + sH / 2} textAnchor="start" fill="#10b981" fontSize="10" fontWeight="bold">w = {w}{unit}</text>
      <text x={ox + dx / 2 - 4} y={oy + dy / 2} textAnchor="end" fill="#8b5cf6" fontSize="10" fontWeight="bold">h = {h}{unit}</text>
      <text x={100} y={oy + sH + dy + 28} textAnchor="middle" fill="#94a3b8" fontSize="9">V = lwh &nbsp; SA = 2(lw+lh+wh)</text>
    </svg>
  );
}

export function Cylinder3D({ r, h, unit }: { r: number; h: number; unit: string }) {
  const radius = Math.min(Math.max(r * 5, 20), 45);
  const height = Math.min(Math.max(h * 2.5, 25), 55);
  const cx = 100;
  const topY = 55 - height / 2;
  const botY = 55 + height / 2;
  return (
    <svg width="360" height="310" viewBox="0 0 360 310" role="img" aria-label={'Cylinder 3D diagram showing radius ' + r + unit + ' and height ' + h + unit}>
      <ellipse cx={cx} cy={botY} rx={radius} ry={radius * 0.3} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="2" />
      <rect x={cx - radius} y={topY + radius * 0.3} width={radius * 2} height={botY - topY - radius * 0.3 * 2} fill="rgba(59,130,246,0.04)" stroke="none" />
      <line x1={cx - radius} y1={topY + radius * 0.3} x2={cx - radius} y2={botY - radius * 0.3} stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx + radius} y1={topY + radius * 0.3} x2={cx + radius} y2={botY - radius * 0.3} stroke="#3b82f6" strokeWidth="2" />
      <ellipse cx={cx} cy={topY} rx={radius} ry={radius * 0.3} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx} y1={topY} x2={cx + radius} y2={topY} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
      <text x={cx + radius / 2} y={topY - 6} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">r = {r}{unit}</text>
      <line x1={cx + radius + 15} y1={topY} x2={cx + radius + 15} y2={botY} stroke="#10b981" strokeWidth="1" />
      <text x={cx + radius + 18} y={(topY + botY) / 2} textAnchor="start" fill="#10b981" fontSize="10" fontWeight="bold" dominantBaseline="middle">h = {h}{unit}</text>
      <text x={cx} y={botY + radius * 0.3 + 18} textAnchor="middle" fill="#94a3b8" fontSize="9">V = &pi;r&sup2;h &nbsp; SA = 2&pi;r(r+h)</text>
    </svg>
  );
}

export function Cone3D({ r, h, unit }: { r: number; h: number; unit: string }) {
  const radius = Math.min(Math.max(r * 5, 20), 45);
  const height = Math.min(Math.max(h * 2.5, 25), 55);
  const cx = 100;
  const tipY = 55 - height / 2;
  const baseY = 55 + height / 2;
  return (
    <svg width="360" height="310" viewBox="0 0 360 310" role="img" aria-label={'Cone 3D diagram showing radius ' + r + unit + ' and height ' + h + unit}>
      <ellipse cx={cx} cy={baseY} rx={radius} ry={radius * 0.3} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="2" />
      <path d={`M ${cx - radius} ${baseY} L ${cx} ${tipY} L ${cx + radius} ${baseY}`} fill="rgba(59,130,246,0.04)" stroke="none" />
      <line x1={cx - radius} y1={baseY} x2={cx} y2={tipY} stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx + radius} y1={baseY} x2={cx} y2={tipY} stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx - radius} y1={baseY} x2={cx} y2={baseY} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
      <text x={cx - radius / 2} y={baseY + 14} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">r = {r}{unit}</text>
      <line x1={cx + radius + 12} y1={tipY} x2={cx + radius + 12} y2={baseY} stroke="#10b981" strokeWidth="1" />
      <text x={cx + radius + 15} y={(tipY + baseY) / 2} textAnchor="start" fill="#10b981" fontSize="10" fontWeight="bold" dominantBaseline="middle">h = {h}{unit}</text>
      <line x1={cx + radius} y1={baseY} x2={cx} y2={tipY} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3 3" />
      <text x={cx + radius * 0.6} y={(tipY + baseY) / 2 - 6} textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold">l</text>
      <text x={cx} y={baseY + radius * 0.3 + 18} textAnchor="middle" fill="#94a3b8" fontSize="9">V = &frac13;&pi;r&sup2;h &nbsp; SA = &pi;r(r+l)</text>
    </svg>
  );
}

export function Pyramid3D({ b, h, unit }: { b: number; h: number; unit: string }) {
  const base = Math.min(Math.max(b * 2.5, 20), 55);
  const height = Math.min(Math.max(h * 2.5, 25), 55);
  const cx = 100;
  const baseY = 95;
  const tipY = baseY - height;
  return (
    <svg width="360" height="310" viewBox="0 0 360 310" role="img" aria-label={'Pyramid 3D diagram showing base ' + b + unit + ' and height ' + h + unit}>
      <polygon points={`${cx - base / 2},${baseY} ${cx + base / 2},${baseY} ${cx + base / 2 + base * 0.25},${baseY + base * 0.15} ${cx - base / 2 + base * 0.25},${baseY + base * 0.15}`}
        fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx - base / 2} y1={baseY} x2={cx} y2={tipY} stroke="#94a3b8" strokeWidth="1" />
      <line x1={cx + base / 2 + base * 0.25} y1={baseY + base * 0.15} x2={cx + base * 0.125} y2={tipY} stroke="#94a3b8" strokeWidth="1" />
      <line x1={cx + base / 2} y1={baseY} x2={cx} y2={tipY} stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx - base / 2 + base * 0.25} y1={baseY + base * 0.15} x2={cx + base * 0.125} y2={tipY} stroke="#3b82f6" strokeWidth="2" />
      <line x1={cx - base / 2} y1={baseY + base * 0.15 + 5} x2={cx + base / 2} y2={baseY + base * 0.15 + 5} stroke="#ef4444" strokeWidth="1" />
      <text x={cx} y={baseY + base * 0.15 + 16} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">b = {b}{unit}</text>
      <line x1={cx + base / 2 + 10} y1={tipY} x2={cx + base / 2 + 10} y2={baseY} stroke="#10b981" strokeWidth="1" />
      <text x={cx + base / 2 + 13} y={(tipY + baseY) / 2} textAnchor="start" fill="#10b981" fontSize="10" fontWeight="bold" dominantBaseline="middle">h = {h}{unit}</text>
      <text x={cx} y={baseY + base * 0.15 + 28} textAnchor="middle" fill="#94a3b8" fontSize="9">V = &frac13;b&sup2;h &nbsp; SA = b&sup2; + 2bl</text>
    </svg>
  );
}
