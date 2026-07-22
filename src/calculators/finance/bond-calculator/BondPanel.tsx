import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function PriceYieldCurve({ faceValue, couponRate, yearsToMaturity, frequency, currentYTM }: {
  faceValue: number; couponRate: number; yearsToMaturity: number; frequency: number; currentYTM: number;
}) {
  const calcPrice = (ytmPct: number) => {
    const couponPayment = (faceValue * couponRate / 100) / frequency;
    const rPeriod = ytmPct / 100 / frequency;
    const n = yearsToMaturity * frequency;
    let price = 0;
    for (let t = 1; t <= n; t++) price += couponPayment / Math.pow(1 + rPeriod, t);
    price += faceValue / Math.pow(1 + rPeriod, n);
    return price;
  };

  const minYTM = Math.max(0.5, currentYTM - 5);
  const maxYTM = currentYTM + 5;
  const steps = 40;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const ytm = minYTM + (i / steps) * (maxYTM - minYTM);
    return { ytm, price: calcPrice(ytm) };
  });

  const maxPrice = Math.max(...points.map((p) => p.price));
  const minPrice = Math.min(...points.map((p) => p.price));
  const priceRange = maxPrice - minPrice;

  const width = 480;
  const height = 200;
  const padL = 70;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (ytm: number) => padL + ((ytm - minYTM) / (maxYTM - minYTM)) * chartW;
  const toY = (price: number) => padT + (1 - (price - minPrice) / priceRange) * chartH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.ytm).toFixed(1)} ${toY(p.price).toFixed(1)}`).join(' ');
  const areaPath = [
    linePath,
    `L ${toX(maxYTM).toFixed(1)} ${toY(minPrice).toFixed(1)}`,
    `L ${toX(minYTM).toFixed(1)} ${toY(minPrice).toFixed(1)} Z`,
  ].join(' ');

  const currentX = toX(currentYTM);
  const currentPoint = points.reduce((a, b) => Math.abs(b.ytm - currentYTM) < Math.abs(a.ytm - currentYTM) ? b : a);
  const currentY = toY(currentPoint.price);

  const fmtK = (n: number) => `$${n.toFixed(0)}`;
  const yLabels = Array.from({ length: 5 }, (_, i) => minPrice + (i / 4) * priceRange);
  const xLabels = [minYTM, currentYTM, maxYTM];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Bond price chart">
        <defs>
          <linearGradient id="bondAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {yLabels.map((price) => {
          const y = toY(price);
          return (
            <g key={price}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtK(price)}</text>
            </g>
          );
        })}
        {xLabels.map((ytm) => {
          const x = toX(ytm);
          return (
            <g key={ytm}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke={ytm === currentYTM ? '#3b82f6' : '#e2e8f0'} strokeWidth={ytm === currentYTM ? 1.5 : 0.5} strokeDasharray={ytm === currentYTM ? '4 3' : 'none'} />
              <text x={x} y={padT + chartH + 13} textAnchor="middle" fontSize={9} fill={ytm === currentYTM ? '#3b82f6' : '#94a3b8'} fontWeight={ytm === currentYTM ? '700' : '400'}>{ytm.toFixed(2)}%</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#bondAreaGrad)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={padL} y1={toY(faceValue)} x2={padL + chartW} y2={toY(faceValue)} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
        <text x={padL + chartW + 3} y={toY(faceValue)} dominantBaseline="middle" fontSize={8} fill="#94a3b8">Par</text>
        <circle cx={currentX} cy={currentY} r={5} fill="#3b82f6" />
        <text x={currentX} y={currentY - 10} textAnchor="middle" fontSize={9} fontWeight="700" fill="#3b82f6">{fmtK(currentPoint.price)}</text>
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
      <p className="text-[10px] text-slate-500 text-center mt-1">Price-Yield curve — Blue dot = current market price at current YTM. Dashed = par value.</p>
    </div>
  );
}

function CashFlowTimeline({ faceValue, couponRate, yearsToMaturity, frequency }: {
  faceValue: number; couponRate: number; yearsToMaturity: number; frequency: number;
}) {
  const couponPayment = (faceValue * couponRate / 100) / frequency;
  const totalPeriods = Math.min(yearsToMaturity * frequency, 20);
  const showEvery = Math.max(1, Math.ceil(totalPeriods / 10));
  const periods = Array.from({ length: Math.ceil(totalPeriods) }, (_, i) => i + 1);
  const displayed = periods.filter((p) => p % showEvery === 0 || p === Math.ceil(totalPeriods));

  const maxVal = faceValue + couponPayment;
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Simplified Cash Flow Timeline</p>
      <div className="flex items-end gap-1 h-20 overflow-x-auto">
        {displayed.map((period) => {
          const isLast = period === Math.ceil(totalPeriods);
          const value = isLast ? faceValue + couponPayment : couponPayment;
          const heightPct = (value / maxVal) * 100;
          const label = frequency === 1 ? `Yr ${period}` : frequency === 2 ? `P${period}` : `P${period}`;
          return (
            <div key={period} className="flex flex-col items-center gap-0.5 flex-shrink-0" style={{ minWidth: '36px' }}>
              {isLast && (
                <span className="text-[9px] text-slate-500 text-center leading-tight">{fmt(faceValue)}</span>
              )}
              <div className="w-full rounded-t-md" style={{
                height: `${heightPct * 0.6}%`,
                minHeight: '8px',
                backgroundColor: isLast ? '#22c55e' : '#3b82f6',
                opacity: 0.8,
              }} />
              <span className="text-[8px] text-slate-500">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500 opacity-80" /><span className="text-[10px] text-slate-500">Coupon ({fmt(couponPayment)}/period)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500 opacity-80" /><span className="text-[10px] text-slate-500">Final (Coupon + Face)</span></div>
      </div>
    </div>
  );
}

export default function BondPanel({ values, results }: Props) {
  const faceValue = parseFloat(values.faceValue) || 1000;
  const couponRate = parseFloat(values.couponRate) || 0;
  const marketPrice = parseFloat(values.marketPrice) || 1000;
  const yearsToMaturity = parseFloat(values.yearsToMaturity) || 10;
  const frequency = parseInt(values.paymentFrequency) || 2;

  const ytmResult = results.find((r) => r.id === 'ytm');
  const currentYTM = ytmResult ? parseFloat(ytmResult.value.replace(/%/g, '')) : couponRate;

  const isDiscount = marketPrice < faceValue;
  const isPremium = marketPrice > faceValue;

  const freqLabel = frequency === 1 ? 'per year' : frequency === 2 ? 'semi-annually' : frequency === 4 ? 'quarterly' : 'monthly';
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Bond Analysis</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl border p-3 text-center ${isDiscount ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1">Market Price</p>
            <p className="text-lg font-black text-blue-700">{fmt(marketPrice)}</p>
            <p className="text-[10px] text-blue-400">{isDiscount ? 'Discount' : isPremium ? 'Premium' : 'At Par'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Par Value</p>
            <p className="text-lg font-black text-slate-700">{fmt(faceValue)}</p>
            <p className="text-[10px] text-slate-500">Redemption value</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Coupon</p>
            <p className="text-lg font-black text-slate-700">{couponRate.toFixed(2)}%</p>
            <p className="text-[10px] text-slate-500">{fmt((faceValue * couponRate / 100) / frequency)} {freqLabel}</p>
          </div>
        </div>

        {(isDiscount || isPremium) && (
          <div className={`rounded-xl px-5 py-3 border ${isDiscount ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-sm font-bold mb-1 ${isDiscount ? 'text-blue-700' : 'text-amber-700'}`}>
              {isDiscount ? 'Discount Bond — Why YTM > Coupon Rate' : 'Premium Bond — Why YTM < Coupon Rate'}
            </p>
            <p className={`text-xs ${isDiscount ? 'text-blue-600' : 'text-amber-600'}`}>
              {isDiscount
                ? `You pay ${fmt(marketPrice)} but receive ${fmt(faceValue)} at maturity — a ${fmt(faceValue - marketPrice)} capital gain. Combined with coupons, your YTM (${currentYTM.toFixed(4)}%) exceeds the stated ${couponRate.toFixed(2)}% coupon rate.`
                : `You pay ${fmt(marketPrice)} but receive only ${fmt(faceValue)} at maturity — a ${fmt(marketPrice - faceValue)} capital loss. Despite higher coupons, your YTM (${currentYTM.toFixed(4)}%) is below the stated ${couponRate.toFixed(2)}% coupon rate.`
              }
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Price-Yield Curve</p>
          <PriceYieldCurve
            faceValue={faceValue} couponRate={couponRate}
            yearsToMaturity={yearsToMaturity} frequency={frequency}
            currentYTM={currentYTM}
          />
        </div>

        <CashFlowTimeline faceValue={faceValue} couponRate={couponRate} yearsToMaturity={yearsToMaturity} frequency={frequency} />

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-600 mb-2">YTM Approximation Formula (Used in Finance Courses)</p>
          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 font-mono text-xs text-slate-700 leading-relaxed">
            <p>YTM ≈ (Annual Coupon + (Face − Price) / Years)</p>
            <p className="border-t border-slate-300 mt-2 pt-2">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;÷ ((Face + Price) / 2)
            </p>
            <p className="mt-2 text-[10px] text-slate-500 font-sans">
              ≈ ({fmt(faceValue * couponRate / 100)} + ({fmt(faceValue)} − {fmt(marketPrice)}) / {yearsToMaturity}) / (({fmt(faceValue)} + {fmt(marketPrice)}) / 2)
            </p>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            This approximation is commonly tested on finance exams. This calculator solves the exact YTM using binary search iteration for precision to 4 decimal places.
          </p>
        </div>
      </div>
    </div>
  );
}
