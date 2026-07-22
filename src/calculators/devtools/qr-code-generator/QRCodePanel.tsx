import { useRef } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface QRData {
  content: string;
  size: number;
  imageUrl: string;
}

export default function QRCodePanel({ results }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrResult = results.find((r) => r.id === '_qrData');
  const infoResult = results.find((r) => r.id === 'info');

  if (!qrResult || !qrResult.value) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-8 text-center">
        <p className="text-sm text-slate-400">Enter content and click calculate to generate a QR code.</p>
      </div>
    );
  }

  let qrData: QRData | null = null;
  try {
    qrData = JSON.parse(qrResult.value) as QRData;
  } catch {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-8 text-center">
        <p className="text-sm text-slate-400">Unable to load QR code data.</p>
      </div>
    );
  }

  if (!qrData || !qrData.imageUrl) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-8 text-center">
        <p className="text-sm text-slate-400">No QR code data available.</p>
      </div>
    );
  }

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = qrData!.size;
      canvas.height = qrData!.size;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrData.imageUrl;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">QR Code Output</span>
      </div>

      <div className="p-6 flex flex-col items-center gap-5">
        {infoResult && (
          <p className="text-xs text-slate-500 text-center max-w-full truncate">{infoResult.value}</p>
        )}

        <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <img
            src={qrData.imageUrl}
            alt={`QR code for: ${qrData.content}`}
            width={qrData.size}
            height={qrData.size}
            loading="lazy"
            decoding="async"
            className="block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          Content: {qrData.content.length > 60 ? qrData.content.substring(0, 60) + '...' : qrData.content}
        </p>

        <button type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PNG
        </button>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
