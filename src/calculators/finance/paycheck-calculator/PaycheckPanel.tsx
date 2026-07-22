import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { STANDARD_DEDUCTION, FICA, FilingStatus, calculateFederalTax } from '../../../utils/taxData';
import { Banknote } from 'lucide-react';

// ─── State Tax Data (Simplified effective rates for paycheck estimation) ──
interface StateInfo { name: string; rate: number; noIncomeTax?: boolean }
const STATE_TAX: Record<string, StateInfo> = {
  AL: { name: 'Alabama', rate: 0.05 },
  AK: { name: 'Alaska', rate: 0, noIncomeTax: true },
  AZ: { name: 'Arizona', rate: 0.025 },
  AR: { name: 'Arkansas', rate: 0.049 },
  CA: { name: 'California', rate: 0.093 },
  CO: { name: 'Colorado', rate: 0.044 },
  CT: { name: 'Connecticut', rate: 0.05 },
  DE: { name: 'Delaware', rate: 0.066 },
  FL: { name: 'Florida', rate: 0, noIncomeTax: true },
  GA: { name: 'Georgia', rate: 0.0575 },
  HI: { name: 'Hawaii', rate: 0.08 },
  ID: { name: 'Idaho', rate: 0.058 },
  IL: { name: 'Illinois', rate: 0.0495 },
  IN: { name: 'Indiana', rate: 0.0305 },
  IA: { name: 'Iowa', rate: 0.057 },
  KS: { name: 'Kansas', rate: 0.057 },
  KY: { name: 'Kentucky', rate: 0.045 },
  LA: { name: 'Louisiana', rate: 0.0425 },
  ME: { name: 'Maine', rate: 0.0715 },
  MD: { name: 'Maryland', rate: 0.0575 },
  MA: { name: 'Massachusetts', rate: 0.05 },
  MI: { name: 'Michigan', rate: 0.0425 },
  MN: { name: 'Minnesota', rate: 0.0785 },
  MS: { name: 'Mississippi', rate: 0.05 },
  MO: { name: 'Missouri', rate: 0.049 },
  MT: { name: 'Montana', rate: 0.068 },
  NE: { name: 'Nebraska', rate: 0.0664 },
  NV: { name: 'Nevada', rate: 0, noIncomeTax: true },
  NH: { name: 'New Hampshire', rate: 0, noIncomeTax: true },
  NJ: { name: 'New Jersey', rate: 0.0637 },
  NM: { name: 'New Mexico', rate: 0.049 },
  NY: { name: 'New York', rate: 0.0685 },
  NC: { name: 'North Carolina', rate: 0.0475 },
  ND: { name: 'North Dakota', rate: 0.029 },
  OH: { name: 'Ohio', rate: 0.0399 },
  OK: { name: 'Oklahoma', rate: 0.0475 },
  OR: { name: 'Oregon', rate: 0.09 },
  PA: { name: 'Pennsylvania', rate: 0.0307 },
  RI: { name: 'Rhode Island', rate: 0.0599 },
  SC: { name: 'South Carolina', rate: 0.064 },
  SD: { name: 'South Dakota', rate: 0, noIncomeTax: true },
  TN: { name: 'Tennessee', rate: 0, noIncomeTax: true },
  TX: { name: 'Texas', rate: 0, noIncomeTax: true },
  UT: { name: 'Utah', rate: 0.0485 },
  VT: { name: 'Vermont', rate: 0.066 },
  VA: { name: 'Virginia', rate: 0.0575 },
  WA: { name: 'Washington', rate: 0, noIncomeTax: true },
  WV: { name: 'West Virginia', rate: 0.065 },
  WI: { name: 'Wisconsin', rate: 0.0765 },
  WY: { name: 'Wyoming', rate: 0, noIncomeTax: true },
};

const PAY_FREQUENCIES: Record<string, { label: string; periods: number }> = {
  weekly: { label: 'Weekly (52/year)', periods: 52 },
  biweekly: { label: 'Bi-Weekly (26/year)', periods: 26 },
  semimonthly: { label: 'Semi-Monthly (24/year)', periods: 24 },
  monthly: { label: 'Monthly (12/year)', periods: 12 },
};

type PayMode = 'salary' | 'hourly';
type PayFreq = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export default function PaycheckPanel({ values }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const mode = (values.payMode || 'salary') as PayMode;
  const salary = parseFloat(values.annualSalary) || 0;
  const hourlyWage = parseFloat(values.hourlyWage) || 0;
  const hoursPerWeek = parseFloat(values.hoursPerWeek) || 40;
  const stateCode = values.state || 'TX';
  const status = (values.filingStatus || 'single') as FilingStatus;
  const preTaxDed = parseFloat(values.preTaxDeductions) || 0;
  const freq = (values.payFrequency || 'biweekly') as PayFreq;

  const grossAnnual = mode === 'salary' ? salary : hourlyWage * hoursPerWeek * 52;
  const ficaWages = Math.max(0, grossAnnual - preTaxDed);
  const fedAGI = ficaWages; // no 401k input simplified
  const stdDed = STANDARD_DEDUCTION[status];
  const taxable = Math.max(0, fedAGI - stdDed);

  const fedResult = useMemo(() => calculateFederalTax(taxable, status), [taxable, status]);
  const { ss, medicare, additionalMedicare } = (() => {
    const ss = Math.min(ficaWages, FICA.socialSecurityWageBase) * FICA.socialSecurityRate;
    const medicare = ficaWages * FICA.medicareRate;
    const threshold = status === 'mfj' ? FICA.additionalMedicareThreshold.mfj : FICA.additionalMedicareThreshold.single;
    const additionalMedicare = ficaWages > threshold ? (ficaWages - threshold) * FICA.additionalMedicareRate : 0;
    return { ss, medicare, additionalMedicare };
  })();
  const ficaTotal = ss + medicare + additionalMedicare;

  const stateInfo = STATE_TAX[stateCode];
  const stateTax = stateInfo?.noIncomeTax ? 0 : grossAnnual * (stateInfo?.rate || 0);
  const totalTax = fedResult.totalTax + ficaTotal + stateTax;
  const netAnnual = grossAnnual - totalTax - preTaxDed;

  const freqInfo = PAY_FREQUENCIES[freq];
  const periods = freqInfo.periods;
  const netPerPaycheck = netAnnual / periods;
  const fedPerPaycheck = fedResult.totalTax / periods;
  const ficaPerPaycheck = ficaTotal / periods;
  const statePerPaycheck = stateTax / periods;
  const deductionsPerPaycheck = preTaxDed / periods;

  if (grossAnnual <= 0) return null;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  const items = [
    { label: 'Federal Income Tax', value: fedPerPaycheck, color: '#3b82f6', pct: (fedResult.totalTax / grossAnnual) * 100 },
    { label: 'FICA (SS + Medicare)', value: ficaPerPaycheck, color: '#f59e0b', pct: (ficaTotal / grossAnnual) * 100 },
    { label: 'State Income Tax', value: statePerPaycheck, color: '#ef4444', pct: (stateTax / grossAnnual) * 100 },
  ];

  if (preTaxDed > 0) {
    items.push({ label: 'Pre-Tax Deductions', value: deductionsPerPaycheck, color: '#8b5cf6', pct: (preTaxDed / grossAnnual) * 100 });
  }

  const netPct = (netAnnual / grossAnnual) * 100;
  const totalWedge = 360;
  let currentAngle = -90;

  const cx = 90, cy = 90, r = 72, innerR = 40;

  const getPath = (startAngle: number, endAngle: number) => {
    const s = startAngle * Math.PI / 180;
    const e = endAngle * Math.PI / 180;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)}
            A ${r} ${r} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}
            L ${cx + innerR * Math.cos(e)} ${cy + innerR * Math.sin(e)}
            A ${innerR} ${innerR} 0 ${endAngle - startAngle > 180 ? 1 : 0} 0 ${cx + innerR * Math.cos(s)} ${cy + innerR * Math.sin(s)} Z`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Banknote size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Paycheck Breakdown &mdash; {freqInfo.label}</span>
      </div>
      <div className="p-6 space-y-6">
        {/* Donut chart */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0" role="img" aria-label="Paycheck breakdown donut chart">
            {items.map((item) => {
              const wedge = (item.pct / 100) * totalWedge;
              const path = getPath(currentAngle, currentAngle + wedge);
              currentAngle += wedge;
              return <path key={item.label} d={path} fill={item.color} opacity={0.88} />;
            })}
            {/* Net pay wedge */}
            {(() => {
              const netWedge = (netPct / 100) * totalWedge;
              const path = getPath(currentAngle, currentAngle + netWedge);
              return <path d={path} fill="#22c55e" opacity={0.88} />;
            })()}
            <text x={cx} y={cy - 7} textAnchor="middle" fontSize={11} fontWeight="800" fill="#1e293b">{fmt(netPerPaycheck)}</text>
            <text x={cx} y={cy + 7} textAnchor="middle" fontSize={8} fill="#94a3b8">net / {freq}</text>
          </svg>
          <div className="flex flex-col gap-2 w-full">
            {items.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-bold text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">{fmt(item.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.pct)}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
            <div key="net" className="mt-1">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#22c55e' }} />
                  <span className="text-[11px] font-bold text-emerald-600">Net Pay (Take Home)</span>
                </div>
                <span className="text-sm font-black text-emerald-700">{fmt(netPerPaycheck)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, netPct)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Per-paycheck summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Net Pay / {freq}</p>
            <p className="text-lg font-black text-emerald-700">{fmt(netPerPaycheck)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Federal / {freq}</p>
            <p className="text-lg font-black text-blue-700">{fmt(fedPerPaycheck)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">FICA / {freq}</p>
            <p className="text-lg font-black text-amber-700">{fmt(ficaPerPaycheck)}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">State / {freq}</p>
            <p className="text-lg font-black text-red-600">{fmt(statePerPaycheck)}</p>
          </div>
        </div>

        {/* Annual summary */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Annual Summary</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
            <div><span className="text-slate-500">Gross:</span> <strong className="text-slate-800">{fmt(grossAnnual)}</strong></div>
            <div><span className="text-slate-500">Federal:</span> <strong className="text-blue-700">{fmt(fedResult.totalTax)}</strong></div>
            <div><span className="text-slate-500">FICA:</span> <strong className="text-amber-700">{fmt(ficaTotal)}</strong></div>
            <div><span className="text-slate-500">State:</span> <strong className="text-red-600">{fmt(stateTax)}</strong></div>
            <div><span className="text-slate-500">Net:</span> <strong className="text-emerald-700">{fmt(netAnnual)}</strong></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Marg. rate: <strong>{(fedResult.marginalRate * 100).toFixed(0)}%</strong> &middot;
            Fed. effective: <strong>{((fedResult.totalTax / grossAnnual) * 100).toFixed(1)}%</strong> &middot;
            All-in effective: <strong>{((totalTax / grossAnnual) * 100).toFixed(1)}%</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
