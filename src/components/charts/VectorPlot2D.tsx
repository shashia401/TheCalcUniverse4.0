// 2D vector plot (arrows from the origin drawn as segments + tip dots) built on SvgLineChart,
// replacing the recharts ScatterChart the vector panels used. x/y axes are independently scaled.

import SvgLineChart from './SvgLineChart';

export interface PlotVector {
  name: string;
  x: number;
  y: number;
  color: string;
  dashed?: boolean;
}

export default function VectorPlot2D({ vectors, height = 240 }: { vectors: PlotVector[]; height?: number }) {
  const ok = vectors.filter((v) => Number.isFinite(v.x) && Number.isFinite(v.y));
  if (!ok.length) return null;
  const label = ok.map((v) => `${v.name} = (${+v.x.toPrecision(6)}, ${+v.y.toPrecision(6)})`).join('; ');
  return (
    <SvgLineChart
      height={height}
      ariaLabel={`2D plot of vectors from the origin: ${label}`}
      refLines={[
        { x: 0, color: '#cbd5e1', dashed: false },
        { y: 0, color: '#cbd5e1', dashed: false },
      ]}
      series={ok.map((v) => ({
        name: v.name,
        color: v.color,
        dashed: v.dashed,
        points: [{ x: 0, y: 0 }, { x: v.x, y: v.y }],
      }))}
      dots={ok.map((v) => ({ x: v.x, y: v.y, label: v.name, color: v.color }))}
    />
  );
}
