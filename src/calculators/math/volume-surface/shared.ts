export function calculate(shape: string, d1: number, d2: number, d3: number) {
  const pi = Math.PI;
  const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();

  if (shape === 'sphere') {
    if (isNaN(d1) || d1 <= 0) return [];
    const r = d1;
    return [
      { id: 'volume', label: 'Volume', value: fmt(4/3 * pi * r * r * r), highlight: true, color: 'positive' as const },
      { id: 'surface', label: 'Surface Area', value: fmt(4 * pi * r * r), color: 'neutral' as const },
      { id: 'diameter', label: 'Diameter', value: fmt(2 * r), color: 'neutral' as const },
    ];
  }

  if (shape === 'cube') {
    if (isNaN(d1) || d1 <= 0) return [];
    const s = d1;
    return [
      { id: 'volume', label: 'Volume', value: fmt(s * s * s), highlight: true, color: 'positive' as const },
      { id: 'surface', label: 'Surface Area', value: fmt(6 * s * s), color: 'neutral' as const },
      { id: 'diagonal', label: 'Space Diagonal', value: fmt(s * Math.sqrt(3)), color: 'neutral' as const },
    ];
  }

  if (shape === 'box') {
    if (isNaN(d1) || isNaN(d2) || isNaN(d3)) return [];
    const [l, w, h] = [d1, d2, d3];
    return [
      { id: 'volume', label: 'Volume', value: fmt(l * w * h), highlight: true, color: 'positive' as const },
      { id: 'surface', label: 'Surface Area', value: fmt(2 * (l * w + l * h + w * h)), color: 'neutral' as const },
      { id: 'diagonal', label: 'Space Diagonal', value: fmt(Math.sqrt(l * l + w * w + h * h)), color: 'neutral' as const },
    ];
  }

  if (shape === 'cylinder') {
    if (isNaN(d1) || isNaN(d2)) return [];
    const [r, h] = [d1, d2];
    return [
      { id: 'volume', label: 'Volume', value: fmt(pi * r * r * h), highlight: true, color: 'positive' as const },
      { id: 'surface', label: 'Total Surface Area', value: fmt(2 * pi * r * r + 2 * pi * r * h), color: 'neutral' as const },
      { id: 'lateral', label: 'Lateral Surface Area', value: fmt(2 * pi * r * h), color: 'neutral' as const },
    ];
  }

  if (shape === 'cone') {
    if (isNaN(d1) || isNaN(d2)) return [];
    const [r, h] = [d1, d2];
    const s = Math.sqrt(r * r + h * h);
    return [
      { id: 'volume', label: 'Volume', value: fmt(pi * r * r * h / 3), highlight: true, color: 'positive' as const },
      { id: 'surface', label: 'Total Surface Area', value: fmt(pi * r * r + pi * r * s), color: 'neutral' as const },
      { id: 'slant', label: 'Slant Height', value: fmt(s), color: 'neutral' as const },
    ];
  }

  if (shape === 'pyramid') {
    if (isNaN(d1) || isNaN(d2)) return [];
    const [b, h] = [d1, d2];
    const vol = b * b * h / 3;
    const slantH = Math.sqrt((b/2) * (b/2) + h * h);
    const latArea = 2 * b * slantH;
    return [
      { id: 'volume', label: 'Volume', value: fmt(vol), highlight: true, color: 'positive' as const },
      { id: 'surface', label: 'Total Surface Area', value: fmt(b * b + latArea), color: 'neutral' as const },
      { id: 'slant', label: 'Slant Height', value: fmt(slantH), color: 'neutral' as const },
    ];
  }

  return [];
}
