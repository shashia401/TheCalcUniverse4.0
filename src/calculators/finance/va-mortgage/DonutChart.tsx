import MiniDonut from '../../../components/calculator/MiniDonut';
import { VAData, fmt } from './vaTypes';

/** Monthly payment split, drawn with the shared MiniDonut (-700 colours keep 4.5:1 contrast on the legend swatches). */
export function DonutChart({ data }: { data: VAData }) {
  const { principalAndInterest, monthlyTax, monthlyInsurance, monthlyHOA } = data;
  const segments = [
    { label: 'Principal & Interest', value: principalAndInterest, color: '#1d4ed8' },
    { label: 'Property Tax', value: monthlyTax, color: '#b45309' },
    { label: 'Insurance', value: monthlyInsurance, color: '#475569' },
    { label: 'HOA', value: monthlyHOA, color: '#0f766e' },
  ].filter((s) => s.value > 0);

  return (
    <MiniDonut
      donut={{
        segments,
        centerLabel: 'per month',
        formatValue: (n) => `$${fmt(n)}`,
        caption: 'Monthly VA mortgage payment: principal and interest, property tax, insurance and HOA',
      }}
    />
  );
}
