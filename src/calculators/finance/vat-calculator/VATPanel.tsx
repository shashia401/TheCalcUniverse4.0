import { CalculatorResult } from '../../../types/calculator';
import { ExternalLink } from 'lucide-react';
import { VAT_COUNTRY_LIST } from '../../../utils/taxData';

export default function VATPanel({}: { results: CalculatorResult[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <ExternalLink size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Worldwide VAT Rates (2026)</span>
      </div>

      <div className="p-6">
        <p className="text-xs text-slate-500 mb-4">
          Standard VAT rates across major economies. Many countries apply reduced rates to specific goods (food, medicine, books).
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Country</th>
                <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Standard Rate</th>
                <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] hidden sm:table-cell">Code</th>
              </tr>
            </thead>
            <tbody>
              {VAT_COUNTRY_LIST.map((c, i) => (
                <tr
                  key={c.code}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="px-4 py-2 font-bold text-slate-700">{c.name}</td>
                  <td className="px-4 py-2 text-right font-bold text-slate-800">{c.standard}%</td>
                  <td className="px-4 py-2 text-right text-slate-500 hidden sm:table-cell">{c.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Rates shown are standard VAT/GST rates as of {new Date().getFullYear()}. Reduced rates may apply to specific goods and services.
          Always verify current rates with local tax authorities. For official VAT rates, visit the relevant country's tax authority website.
        </p>
      </div>
    </div>
  );
}
