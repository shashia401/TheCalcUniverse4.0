import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { TX_TYPES, computeGasFee, fmtEth, fmtUsd, fmtGwei, SLOW_MULTIPLIER, FAST_MULTIPLIER } from './gasFee';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function EthGasFeePanel({ values }: Props) {
  const gasPrice = parseFloat(values.gasPriceGwei);
  const fee = computeGasFee(values.transactionType || 'standard-transfer', gasPrice, parseFloat(values.ethPrice));
  if (!fee) return null;

  const { usd, eth, tx, gasLimit } = fee;
  const maxUsd = Math.max(usd.slow, usd.std, usd.fast, 1e-12);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ethereum Gas Fee Estimator</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Speed tiers */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Speed Tiers (illustrative multiples of your gas price)</p>
          <HBarRow label={`Slow ${SLOW_MULTIPLIER}x`} value={usd.slow} max={maxUsd} display={fmtUsd(usd.slow)} color="bg-emerald-700" labelWidth="w-20" />
          <HBarRow label="Standard 1x" value={usd.std} max={maxUsd} display={fmtUsd(usd.std)} color="bg-blue-700" labelWidth="w-20" />
          <HBarRow label={`Fast ${FAST_MULTIPLIER}x`} value={usd.fast} max={maxUsd} display={fmtUsd(usd.fast)} color="bg-red-700" labelWidth="w-20" />
        </div>

        {/* USD Fee Card */}
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Estimated Gas Fee (USD)</p>
          <p className="text-3xl font-bold font-mono text-blue-700 mt-1">{fmtUsd(usd.std)}</p>
          <div className="mt-2 flex justify-center gap-4 text-[11px] text-blue-700">
            <span>Slow: {fmtUsd(usd.slow)}</span>
            <span aria-hidden="true">|</span>
            <span>Fast: {fmtUsd(usd.fast)}</span>
          </div>
          <p className="mt-2 text-[10px] text-blue-700">Based on the gas and ETH prices you entered, not live data.</p>
        </div>

        {/* ETH Fee */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Gas Fee (ETH)</p>
          <p className="text-xl font-bold font-mono text-slate-700">{fmtEth(eth.std)}</p>
        </div>

        {/* Transaction Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Transaction Details</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Type</span>
              <span className="font-medium text-slate-700">{tx.label}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Gas Limit</span>
              <span className="font-mono font-medium text-slate-700">{gasLimit.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Gas Price</span>
              <span className="font-mono font-medium text-slate-700">{fmtGwei(gasPrice)}</span>
            </div>
          </div>
        </div>

        {/* Transaction Type Quick Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Transaction Type Reference</p>
          <div className="space-y-1 text-xs">
            {Object.values(TX_TYPES).map((t) => (
              <div key={t.label} className="flex justify-between px-2 py-1 rounded bg-white">
                <span className="text-slate-600">{t.label}</span>
                <span className="font-mono text-slate-700">{t.approx ? '~' : ''}{t.gasLimit.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
