import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResultValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

function parseDollarValue(val: string): number {
  const m = /(-?[\d,.]+)/.exec(val);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, ''));
}

function ProfitBreakdownChart({
  sellingPrice,
  referralFee,
  fbaFee,
  storageFee,
  productCost,
  netProfit,
}: {
  sellingPrice: number;
  referralFee: number;
  fbaFee: number;
  storageFee: number;
  productCost: number;
  netProfit: number;
}) {
  const width = 280;
  const height = 200;
  const total = sellingPrice;

  const segments = [
    { label: 'Amazon Fees', value: referralFee + fbaFee + storageFee, color: '#ef4444' },
    { label: 'Product Cost', value: productCost, color: '#f59e0b' },
    { label: 'Profit', value: Math.max(0, netProfit), color: '#22c55e' },
  ];

  const activeSegments = segments.filter((s) => s.value > 0);
  const totalVal = activeSegments.reduce((sum, s) => sum + s.value, 0);
  const cx = width / 2;
  const cy = 100;
  const r = 75;
  const innerR = 40;

  let currentAngle = -Math.PI / 2;
  const slices = activeSegments.map((seg) => {
    const angle = (seg.value / totalVal) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${ix1.toFixed(1)} ${iy1.toFixed(1)}`,
      `L ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      `L ${ix2.toFixed(1)} ${iy2.toFixed(1)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)}`,
      'Z',
    ].join(' ');

    const midAngle = startAngle + angle / 2;
    const labelR = (r + innerR) / 2;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return { path, color: seg.color, label: seg.label, value: seg.value, lx, ly };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '210px' }} role="img" aria-label="Profit breakdown donut chart showing Amazon fees, product cost, and profit as percentage of selling price">
      {slices.map((slice) => (
        <g key={slice.label}>
          <path d={slice.path} fill={slice.color} opacity={0.85} stroke="currentColor" className="stroke-white dark:stroke-slate-800" strokeWidth={1} />
          <text
            x={slice.lx}
            y={slice.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            className="fill-white"
            fontWeight="bold"
          >
            {(slice.value / totalVal * 100).toFixed(0)}%
          </text>
        </g>
      ))}
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="bold">
        ${total.toFixed(2)}
      </text>
    </svg>
  );
}

function DimensionalWeightTier({ weight }: { weight: number }) {
  let tier: string;
  let color: string;
  if (weight <= 1) {
    tier = 'Small Standard';
    color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  } else if (weight <= 2) {
    tier = 'Large Standard';
    color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  } else if (weight <= 3) {
    tier = 'Large Standard';
    color = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (weight <= 21) {
    tier = 'Small Oversize';
    color = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (weight <= 90) {
    tier = 'Large Oversize';
    color = 'text-red-600 bg-red-50 border-red-200';
  } else {
    tier = 'Extra Large';
    color = 'text-red-600 bg-red-50 border-red-200';
  }

  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${color}`}>
      <div className="text-[9px] uppercase tracking-wider font-bold">Dimensional Tier</div>
      <div className="text-sm font-black">{tier}</div>
      <div className="text-[10px] opacity-75">{weight > 0 ? `${weight.toFixed(1)} lbs` : '—'}</div>
    </div>
  );
}

export default function AmazonFBAPanel({ values, results }: Props) {
  if (!results.length) return null;

  const sellingPrice = parseFloat(values.sellingPrice) || 0;
  const productCost = parseFloat(values.productCost) || 0;
  const weight = parseFloat(values.weight) || 0;
  const category = values.category || '15';

  const netProfitStr = getResultValue(results, 'netProfit');
  const marginStr = getResultValue(results, 'margin');
  const roiStr = getResultValue(results, 'roi');
  const referralFeeStr = getResultValue(results, 'referralFee');
  const fbaFeeStr = getResultValue(results, 'fbaFee');
  const storageFeeStr = getResultValue(results, 'storageFee');

  const netProfit = parseDollarValue(netProfitStr);
  const margin = parseFloat(marginStr);
  const referralFee = parseDollarValue(referralFeeStr);
  const fbaFee = parseDollarValue(fbaFeeStr);
  const storageFee = parseDollarValue(storageFeeStr);
  const totalFees = referralFee + fbaFee + storageFee;

  const categoryLabels: Record<string, string> = {
    '15': 'General / Standard',
    '17': 'Apparel',
    '8': 'Electronics',
    '20': 'Jewelry',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
          Amazon FBA Fee Breakdown
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Profit/Sale Result Card */}
        <div
          className={`rounded-xl border-2 px-4 py-3 text-center ${
            netProfit > 0
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">
            Net Profit per Unit
          </div>
          <div className={`text-2xl font-black ${netProfit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {netProfitStr}
          </div>
          <div className="flex justify-center gap-4 mt-1">
            <span className="text-xs text-slate-500">
              Margin: <strong className={margin > 20 ? 'text-emerald-600' : margin > 10 ? 'text-amber-600' : 'text-red-600'}>{marginStr}</strong>
            </span>
            <span className="text-xs text-slate-500">
              ROI: <strong className="text-slate-700">{roiStr}</strong>
            </span>
          </div>
        </div>

        {/* Profit Breakdown Donut */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Fee Breakdown (%, of selling price)
          </p>
          <div className="flex justify-center">
            <ProfitBreakdownChart
              sellingPrice={sellingPrice}
              referralFee={referralFee}
              fbaFee={fbaFee}
              storageFee={storageFee}
              productCost={productCost}
              netProfit={netProfit}
            />
          </div>
        </div>

        {/* Itemized Fee Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-red-500">Referral</div>
            <div className="text-sm font-black text-red-600">{referralFeeStr}</div>
            <div className="text-[9px] text-slate-500">{(categoryLabels[category] || 'General')}</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-red-500">FBA Fee</div>
            <div className="text-sm font-black text-red-600">{fbaFeeStr}</div>
            <div className="text-[9px] text-slate-500">{weight > 0 ? `${weight.toFixed(1)} lbs` : '—'}</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-red-500">Storage</div>
            <div className="text-sm font-black text-red-600">{storageFeeStr}</div>
            <div className="text-[9px] text-slate-500">Monthly</div>
          </div>
        </div>

        {/* Total Fees Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>Total Amazon Fees</span>
            <span className="font-bold text-red-600">${totalFees.toFixed(2)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500"
              style={{
                width: `${Math.min(100, (totalFees / Math.max(1, sellingPrice)) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
            <span>Fees as % of price: {((totalFees / Math.max(1, sellingPrice)) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Dimensional Weight Tier + Q4 Warning */}
        <div className="grid grid-cols-2 gap-2">
          <DimensionalWeightTier weight={weight} />
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-amber-600">Q4 Storage</div>
            <div className="text-sm font-black text-amber-700">3x Penalty</div>
            <div className="text-[10px] text-amber-600/75">Oct-Dec rates triple</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>Amazon Fees</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Product Cost</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Your Profit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
