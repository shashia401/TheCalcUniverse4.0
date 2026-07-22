import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function EthGasFeePanel({ results }: Props) {
  const gasFeeUsd = results.find(r => r.id === 'gasFeeUsd');
  const gasFeeEth = results.find(r => r.id === 'gasFeeEth');
  const gasLimit = results.find(r => r.id === 'gasLimit');
  const gasPriceGwei = results.find(r => r.id === 'gasPriceGwei');
  const gasFeeUsdSlow = results.find(r => r.id === 'gasFeeUsdSlow');
  const gasFeeUsdFast = results.find(r => r.id === 'gasFeeUsdFast');
  const transactionType = results.find(r => r.id === 'transactionType');

  const parseEthUsd = (r?: CalculatorResult) => {
    if (!r) return 0;
    const s = r.value.replace(/[\$,]/g, '');
    return parseFloat(s);
  };

  const slowUsd = parseEthUsd(gasFeeUsdSlow);
  const stdUsd = parseEthUsd(gasFeeUsd);
  const fastUsd = parseEthUsd(gasFeeUsdFast);
  const maxUsd = Math.max(slowUsd, stdUsd, fastUsd, 0.01);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ethereum Gas Fee Estimator</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Gas Meter */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Speed Tiers</p>
          <div className="space-y-2">
            {/* Slow */}
            <div className="flex items-center gap-3">
              <span className="w-10 text-[10px] font-bold text-emerald-500">Slow</span>
              <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(slowUsd / maxUsd) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs font-mono font-bold text-slate-600">{gasFeeUsdSlow?.value || '$0'}</span>
            </div>
            {/* Standard */}
            <div className="flex items-center gap-3">
              <span className="w-10 text-[10px] font-bold text-blue-500">Std</span>
              <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(stdUsd / maxUsd) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs font-mono font-bold text-slate-600">{gasFeeUsd?.value || '$0'}</span>
            </div>
            {/* Fast */}
            <div className="flex items-center gap-3">
              <span className="w-10 text-[10px] font-bold text-red-500">Fast</span>
              <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 transition-all duration-500"
                  style={{ width: `${(fastUsd / maxUsd) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs font-mono font-bold text-slate-600">{gasFeeUsdFast?.value || '$0'}</span>
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>0.9x gas price</span>
            <span>1.0x gas price</span>
            <span>1.5x gas price</span>
          </div>
        </div>

        {/* USD Fee Card */}
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Estimated Gas Fee (USD)</p>
          <p className="text-3xl font-bold font-mono text-blue-700 mt-1">{gasFeeUsd?.value || '$0.00'}</p>
          <div className="mt-2 flex justify-center gap-4 text-[11px] text-blue-500">
            <span>Slow: {gasFeeUsdSlow?.value || '$0'}</span>
            <span>|</span>
            <span>Fast: {gasFeeUsdFast?.value || '$0'}</span>
          </div>
        </div>

        {/* ETH Fee */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gas Fee (ETH)</p>
          <p className="text-xl font-bold font-mono text-slate-700">{gasFeeEth?.value || '0 ETH'}</p>
        </div>

        {/* Transaction Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Transaction Details</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Type</span>
              <span className="font-medium text-slate-700">{transactionType?.value || '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Gas Limit</span>
              <span className="font-mono font-medium text-slate-700">{gasLimit?.value || '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Gas Price</span>
              <span className="font-mono font-medium text-slate-700">{gasPriceGwei?.value || '-'}</span>
            </div>
          </div>
        </div>

        {/* Transaction Type Quick Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Transaction Type Reference</p>
          <div className="space-y-1 text-xs">
            {[
              { type: 'ETH Transfer', gas: '21,000' },
              { type: 'ERC-20 Token', gas: '65,000' },
              { type: 'Uniswap Swap', gas: '~180,000' },
              { type: 'NFT Mint', gas: '~300,000' },
              { type: 'Complex Contract', gas: '~500,000' },
            ].map(t => (
              <div key={t.type} className="flex justify-between px-2 py-1 rounded bg-white">
                <span className="text-slate-600">{t.type}</span>
                <span className="font-mono text-slate-700">{t.gas}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
