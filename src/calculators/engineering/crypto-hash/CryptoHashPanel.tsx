import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CryptoHashPanel({ results }: Props) {
  const hash = results.find(r => r.id === 'hash');
  const algorithm = results.find(r => r.id === 'algorithm');
  const inputLength = results.find(r => r.id === 'inputLength');
  const hashBytes = results.find(r => r.id === 'hashBytes');

  const algo = algorithm?.value || 'SHA-256';
  const hashVal = hash?.value || '';
  const isSecure = algo !== 'MD5' && algo !== 'SHA-1';

  const handleCopy = () => {
    if (hashVal) navigator.clipboard.writeText(hashVal);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        {/* Lock icon */}
        <svg aria-hidden="true" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Zero-Knowledge Hashing</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Local Only</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Zero-Knowledge Badge */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg aria-hidden="true" className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-700">Zero-Knowledge Proof</p>
            <p className="text-[11px] text-emerald-600">Your data never leaves this device. All hashing is performed locally in your browser.</p>
          </div>
        </div>

        {/* Algorithm Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isSecure ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isSecure ? 'Secure' : 'Deprecated'}
            </span>
            <span className="text-xs font-medium text-slate-500">{algo}</span>
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${isSecure ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {hashBytes?.value || ''}
          </span>
        </div>

        {/* Hash Output */}
        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hash Output</p>
            <button type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="font-mono text-xs break-all text-slate-700 leading-relaxed select-all">
              {hashVal || 'Enter text to generate hash...'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Input Length</p>
            <p className="text-sm font-bold font-mono text-slate-700">{inputLength?.value || '0 characters'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Hash Size</p>
            <p className="text-sm font-bold font-mono text-slate-700">{hashBytes?.value || '0 bits'}</p>
          </div>
        </div>

        {/* Algorithm comparison */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Algorithm Comparison</p>
          <div className="space-y-1.5">
            {[
              { name: 'MD5', bits: 128, secure: false },
              { name: 'SHA-1', bits: 160, secure: false },
              { name: 'SHA-256', bits: 256, secure: true },
              { name: 'SHA-384', bits: 384, secure: true },
              { name: 'SHA-512', bits: 512, secure: true },
              { name: 'Keccak-256', bits: 256, secure: true },
            ].map(a => (
              <div key={a.name} className={`flex items-center justify-between px-2 py-1 rounded ${a.name === algo ? 'bg-indigo-100 ring-1 ring-indigo-300' : 'bg-white'}`}>
                <span className="text-xs font-medium text-slate-700">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{a.bits}-bit</span>
                  {a.secure
                    ? <svg aria-hidden="true" className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    : <svg aria-hidden="true" className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
