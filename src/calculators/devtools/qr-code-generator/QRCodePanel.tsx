import { CalculatorResult } from '../../../types/calculator';
import { encodeQr, qrToSvgPath, type Ecl } from '../../../utils/qrcode';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const QUIET = 4;

function download(href: string, name: string) {
  const a = document.createElement('a');
  a.download = name;
  a.href = href;
  a.click();
}

export default function QRCodePanel({ values, results }: Props) {
  const infoResult = results.find((r) => r.id === 'info');
  const content = (values.content || '').trim();
  const ecl = (['L', 'M', 'Q', 'H'].includes(values.errorCorrection) ? values.errorCorrection : 'M') as Ecl;
  // Same pure encoder calculate() used: the symbol is regenerated from the inputs, never read back from text.
  const qr = content ? encodeQr(content, ecl) : null;

  if (!qr || !infoResult) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-8 text-center">
        <p className="text-sm text-slate-600">Enter content to generate a QR code.</p>
      </div>
    );
  }

  const requested = Number(values.size);
  const px = Math.round(Math.max(100, Math.min(500, Number.isFinite(requested) && requested > 0 ? requested : 200)));
  const total = qr.size + QUIET * 2;
  const path = qrToSvgPath(qr, QUIET);
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;

  const downloadSvg = () => download(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`, `qrcode-${Date.now()}.svg`);
  const downloadPng = () => {
    const canvas = document.createElement('canvas');
    const scale = Math.max(1, Math.floor(px / total));
    canvas.width = canvas.height = total * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    qr.modules.forEach((row, y) => row.forEach((dark, x) => dark && ctx.fillRect((x + QUIET) * scale, (y + QUIET) * scale, scale, scale)));
    download(canvas.toDataURL('image/png'), `qrcode-${Date.now()}.png`);
  };

  const btn =
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 active:bg-blue-900 text-white text-xs font-bold shadow-sm';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">QR Code Output</span>
      </div>

      <div className="p-6 flex flex-col items-center gap-5">
        <p className="text-xs text-slate-600 text-center max-w-full truncate">{infoResult.value}</p>

        <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <svg
            role="img"
            aria-label={`QR code (version ${qr.version}, error correction ${qr.ecl}) encoding: ${content.length > 80 ? content.slice(0, 80) + '...' : content}`}
            viewBox={`0 0 ${total} ${total}`}
            width={px}
            height={px}
            shapeRendering="crispEdges"
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          >
            <rect width={total} height={total} fill="#fff" />
            <path d={path} fill="#000" />
          </svg>
        </div>

        <p className="text-xs text-slate-600 text-center">
          Content: {content.length > 60 ? content.substring(0, 60) + '...' : content}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={downloadPng} className={btn}>
            Download PNG
          </button>
          <button type="button" onClick={downloadSvg} className={btn}>
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}
