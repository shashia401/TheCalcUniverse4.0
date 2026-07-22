export interface CategoryColor {
  bg: string;
  text: string;
  dot: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  finance: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  math: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  health: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
  engineering: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  industrial: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400' },
  everyday: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' },
  automotive: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  diy: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  ecommerce: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  devtools: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
};
