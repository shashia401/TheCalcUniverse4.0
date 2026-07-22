// 3D isometric SVG diagrams for each shape.
// Uses proper isometric projection coordinates.

export const sphereDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <defs><radialGradient id="sg" cx="35%" cy="35%"><stop offset="0%" stopColor="rgba(59,130,246,0.2)"/><stop offset="60%" stopColor="rgba(59,130,246,0.08)"/><stop offset="100%" stopColor="rgba(59,130,246,0.02)"/></radialGradient></defs>
  <circle cx="100" cy="95" r="60" fill="url(#sg)" stroke="#3b82f6" stroke-width="2"/>
  <ellipse cx="100" cy="95" rx="60" ry="22" fill="none" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="4 3"/>
  <ellipse cx="100" cy="95" rx="22" ry="60" fill="none" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="100" y1="95" x2="160" y2="95" stroke="#ef4444" stroke-width="3"/>
  <circle cx="100" cy="95" r="4" fill="#ef4444"/>
  <text x="135" y="91" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">r</text>
  <text x="100" y="185" text-anchor="middle" fill="#64748b" font-size="12">Sphere</text>
</svg>`,
  alt: '3D sphere diagram with radius r',
  caption: 'A sphere with radius r — the most efficient 3D shape',
};

export const cubeDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="55,70 120,40 185,70 120,100" fill="rgba(59,130,246,0.08)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="55,70 55,155 120,185 120,100" fill="rgba(59,130,246,0.04)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="120,100 120,185 185,155 185,70" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <line x1="55" y1="115" x2="55" y2="140" stroke="#ef4444" stroke-width="3"/>
  <text x="46" y="133" text-anchor="end" fill="#ef4444" font-size="20" font-weight="bold">s</text>
  <line x1="95" y1="52" x2="79" y2="58" stroke="#f59e0b" stroke-width="3"/>
  <text x="73" y="59" text-anchor="end" fill="#f59e0b" font-size="20" font-weight="bold">s</text>
  <line x1="185" y1="70" x2="203" y2="78" stroke="#06b6d4" stroke-width="3"/>
  <text x="211" y="81" fill="#06b6d4" font-size="20" font-weight="bold">s</text>
  <text x="120" y="185" text-anchor="middle" fill="#64748b" font-size="12">Cube</text>
</svg>`,
  alt: '3D cube diagram showing three visible faces',
  caption: 'A cube — 6 equal square faces, all edges the same length',
};

export const cylinderDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <ellipse cx="110" cy="38" rx="60" ry="20" fill="rgba(59,130,246,0.08)" stroke="#3b82f6" stroke-width="2"/>
  <line x1="50" y1="38" x2="50" y2="150" stroke="#3b82f6" stroke-width="2"/>
  <line x1="170" y1="38" x2="170" y2="150" stroke="#3b82f6" stroke-width="2"/>
  <ellipse cx="110" cy="150" rx="60" ry="20" fill="rgba(59,130,246,0.05)" stroke="#3b82f6" stroke-width="2"/>
  <line x1="110" y1="150" x2="110" y2="180" stroke="#ef4444" stroke-width="3"/>
  <text x="110" y="196" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">h</text>
  <line x1="110" y1="38" x2="155" y2="38" stroke="#f59e0b" stroke-width="3"/>
  <text x="164" y="43" fill="#f59e0b" font-size="20" font-weight="bold">r</text>
  <text x="110" y="95" text-anchor="middle" fill="#64748b" font-size="11">V = &pi;r&sup2;h</text>
</svg>`,
  alt: '3D cylinder diagram with radius r and height h',
  caption: 'A cylinder — circular base area (πr²) times height (h)',
};

export const coneDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <line x1="50" y1="150" x2="110" y2="25" stroke="#3b82f6" stroke-width="2"/>
  <line x1="110" y1="25" x2="170" y2="150" stroke="#3b82f6" stroke-width="2"/>
  <ellipse cx="110" cy="150" rx="60" ry="18" fill="rgba(59,130,246,0.05)" stroke="#3b82f6" stroke-width="2"/>
  <line x1="110" y1="25" x2="110" y2="150" stroke="#ef4444" stroke-width="3"/>
  <text x="110" y="179" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">h</text>
  <line x1="110" y1="150" x2="155" y2="150" stroke="#f59e0b" stroke-width="3"/>
  <text x="164" y="156" fill="#f59e0b" font-size="20" font-weight="bold">r</text>
  <text x="110" y="85" text-anchor="middle" fill="#64748b" font-size="11">V = &frac13;&pi;r&sup2;h</text>
</svg>`,
  alt: '3D cone diagram with radius r and height h',
  caption: 'A cone — exactly one-third the volume of a cylinder',
};

export const boxDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="40,55 136,19 184,37 88,73" fill="rgba(59,130,246,0.08)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="40,55 40,135 88,153 88,73" fill="rgba(59,130,246,0.04)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="88,73 88,153 184,117 184,37" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <line x1="40" y1="95" x2="40" y2="120" stroke="#ef4444" stroke-width="3"/>
  <text x="30" y="113" text-anchor="end" fill="#ef4444" font-size="20" font-weight="bold">h</text>
  <line x1="59" y1="62" x2="69" y2="66" stroke="#f59e0b" stroke-width="3"/>
  <text x="76" y="69" fill="#f59e0b" font-size="20" font-weight="bold">w</text>
  <line x1="122" y1="60" x2="141" y2="53" stroke="#06b6d4" stroke-width="3"/>
  <text x="148" y="53" fill="#06b6d4" font-size="20" font-weight="bold">l</text>
  <text x="120" y="190" text-anchor="middle" fill="#64748b" font-size="12">Rectangular Prism</text>
</svg>`,
  alt: '3D rectangular prism diagram with length l, width w, height h',
  caption: 'A rectangular prism (box) with three dimensions',
};

export const pyramidDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="110,20 175,150 45,150" fill="rgba(59,130,246,0.05)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="110,20 45,150 110,180" fill="rgba(59,130,246,0.04)" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3 3" stroke-linejoin="round"/>
  <line x1="45" y1="150" x2="175" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="110" y1="20" x2="110" y2="150" stroke="#ef4444" stroke-width="3"/>
  <text x="110" y="176" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">h</text>
  <line x1="110" y1="150" x2="160" y2="150" stroke="#f59e0b" stroke-width="3"/>
  <text x="168" y="156" fill="#f59e0b" font-size="20" font-weight="bold">b</text>
  <text x="110" y="85" text-anchor="middle" fill="#64748b" font-size="11">V = &frac13;b&sup2;h</text>
</svg>`,
  alt: '3D square pyramid diagram with base side b and height h',
  caption: 'A square pyramid — one-third the volume of a prism',
};
