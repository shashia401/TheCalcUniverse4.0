// Per-category accent colors — shared by the homepage category grid and the
// category listing pages so the color language stays consistent. Full static
// Tailwind class strings so the JIT compiler detects them (no dynamic
// concatenation of color tokens).

export interface CategoryAccent {
  tint: string;
  text: string;
  border: string;
}

const CAT_ACCENT: Record<string, CategoryAccent> = {
  finance: { tint: 'bg-accent-emerald-500/12', text: 'text-accent-emerald-600', border: 'hover:border-accent-emerald-500' },
  health: { tint: 'bg-accent-rose-500/12', text: 'text-accent-rose-600', border: 'hover:border-accent-rose-500' },
  math: { tint: 'bg-accent-sky-500/12', text: 'text-accent-sky-600', border: 'hover:border-accent-sky-500' },
  everyday: { tint: 'bg-accent-amber-500/15', text: 'text-accent-amber-600', border: 'hover:border-accent-amber-500' },
  ecommerce: { tint: 'bg-accent-violet-500/12', text: 'text-accent-violet-600', border: 'hover:border-accent-violet-500' },
  diy: { tint: 'bg-accent-orange-500/12', text: 'text-accent-orange-600', border: 'hover:border-accent-orange-500' },
  automotive: { tint: 'bg-accent-cyan-500/12', text: 'text-accent-cyan-600', border: 'hover:border-accent-cyan-500' },
  engineering: { tint: 'bg-accent-amber-500/12', text: 'text-accent-amber-700', border: 'hover:border-accent-amber-500' },
  industrial: { tint: 'bg-accent-teal-500/12', text: 'text-accent-teal-600', border: 'hover:border-accent-teal-500' },
  devtools: { tint: 'bg-accent-violet-500/12', text: 'text-accent-violet-700', border: 'hover:border-accent-violet-500' },
  realestate: { tint: 'bg-accent-emerald-500/12', text: 'text-accent-emerald-700', border: 'hover:border-accent-emerald-500' },
};

const FALLBACK: CategoryAccent = {
  tint: 'bg-[var(--brand-default)]/10',
  text: 'text-[var(--brand-default)]',
  border: 'hover:border-[var(--brand-default)]',
};

export const accentFor = (slug: string): CategoryAccent => CAT_ACCENT[slug] ?? FALLBACK;
