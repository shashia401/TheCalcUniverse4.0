import type React from 'react';

export type InputFieldType = 'number' | 'text' | 'textarea' | 'select' | 'percentage' | 'date' | 'custom';

export interface SelectOption {
  label: string;
  value: string;
}

export interface InputField {
  id: string;
  label: string;
  type: InputFieldType;
  defaultValue?: string;
  placeholder?: string;
  unit?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  helpText?: string;
  options?: SelectOption[];
  /** HTML inputmode attribute for better mobile keyboards: 'decimal', 'numeric', 'text', etc. */
  inputMode?: string;
  /**
   * "Living Answer" — when set, this input renders a range slider synced to the
   * number field, so the result and chart redraw as the user drags. Only for
   * number/percentage inputs. min/max/step here are the SLIDER bounds (often
   * wider or coarser than the input's validation min/max).
   */
  slider?: { min: number; max: number; step: number };
  /**
   * Custom render component for 'custom' type fields.
   * Receives the current value, onChange callback, and errors.
   */
  component?: React.ComponentType<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    errors?: Record<string, string>;
  }>;
  /**
   * Optional predicate controlling whether this input is rendered.
   * Receives the live form values map. Return false to hide the field.
   * Hidden fields are also excluded from validation.
   */
  showWhen?: (values: Record<string, string>) => boolean;
}

export interface CalculatorResult {
  id: string;
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  color?: 'positive' | 'negative' | 'neutral';
  /**
   * Plain-English, value-specific explanation of what this result means
   * (threshold bands, benchmarks). Shown under the primary result.
   * Must be computed from the actual inputs — never generic boilerplate.
   */
  interpretation?: string;
  /**
   * Optional caution shown as a warning banner (e.g. out-of-range or impossible
   * inputs — "you can't reach that target on the final"). Set by calculate()
   * when a result is valid to compute but the scenario is unusual or unreachable.
   */
  warning?: string;
}

/** Strict variant used by calculators that guarantee highlight + color are set */
export type StrictCalculatorResult = Required<Pick<CalculatorResult, 'id' | 'label' | 'value' | 'highlight' | 'color'>> & Partial<Pick<CalculatorResult, 'unit'>>;

export interface EducationalVariable {
  symbol: string;
  name: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface WorkedExample {
  scenario: string;
  inputs: Record<string, string>;
  result: string;
  insight: string;
}

export interface EducationalContent {
  formula?: string;
  formulaDescription?: string;
  /** Academic source / derivation of the core formula (who derived it, when, and how it is applied) */
  formulaSource?: string;
  variables?: EducationalVariable[];
  howToUse?: string[];
  /** Quick reference conversion pairs rendered as a table (e.g. "1 PSI = 0.0689 Bar"). Each entry is { label: "1 PSI", value: "0.0689 Bar" } */
  quickReference?: { label: string; value: string }[];
  /** Real-world applications / common uses shown as a bullet list */
  commonUses?: string[];
  explanation?: string;
  faqs?: FAQ[];
  /** Optional inline SVG diagram to illustrate the concept, rendered between formula and explanation sections */
  diagram?: EducationalSvgDiagram;
  /** Optional academic references and sources for the educational content */
  citations?: { source?: string; url: string; title?: string }[];
  /** Worked examples with real-world scenarios, inputs, and insights */
  workedExamples?: WorkedExample[];
  /** Pro tips for getting the most out of the calculator */
  proTips?: string[];
  /** Limitations and when NOT to use this calculator */
  limitations?: string[];
}

export interface EducationalSvgDiagram {
  /** Raw SVG markup. Use currentColor or explicit colors (theme-aware). */
  svg: string;
  /** Accessible label for screen readers */
  alt: string;
  /** Optional caption displayed below the diagram */
  caption?: string;
}

/** One line of a live worked solution: an expression plus an optional teaching note */
export interface ExplainStep {
  /** What this step does, e.g. "Convert APR to a monthly rate" */
  label: string;
  /** The math with the user's actual numbers substituted, e.g. "r = 6.5% ÷ 12 = 0.5417%" */
  expr: string;
  /** Optional one-line why, in plain English */
  note?: string;
}

/**
 * "Living Answer" chart data. Built client-side from the user's inputs and
 * rendered as a hand-rolled SVG stacked-area chart (MiniAreaChart) — no chart
 * library, theme-aware via CSS variables. Series stack in array order (index 0
 * on the bottom). Colors are CSS custom-property names or hex strings.
 */
export interface CalcChart {
  /** X-axis points; each carries one value per series, in seriesLabels order */
  points: { x: number; values: number[] }[];
  seriesLabels: string[];
  /** CSS color per series (e.g. 'var(--brand-default)' or '#f59e0b') */
  seriesColors: string[];
  xAxisLabel?: string;
  /** Formats the tooltip/end-cap money value, e.g. n => `$${Math.round(n)}` */
  formatValue?: (n: number) => string;
  /** Short caption under the chart explaining what it shows */
  caption?: string;
}

/**
 * "Living Answer" donut — the at-a-glance total split of the user's actual
 * result (e.g. principal vs interest). Rendered as a hand-rolled SVG donut
 * (MiniDonut) from the real numbers, redrawing as inputs change. Complements
 * the time-series `chart` (which shows the split *over time*).
 */
export interface CalcDonut {
  segments: { label: string; value: number; color: string }[];
  /** Small label under the center total, e.g. "total cost" */
  centerLabel?: string;
  formatValue?: (n: number) => string;
  caption?: string;
}

/**
 * "Living Answer" gauge — a horizontal band with a live marker showing WHERE the
 * user's result falls (e.g. BMI on the underweight→obese scale). Answers "am I
 * okay?" at a glance. Rendered as a hand-rolled SVG (MiniGauge).
 */
export interface CalcGauge {
  value: number;
  min: number;
  max: number;
  /** Label shown at the marker, e.g. "Your BMI: 24.4 — Normal" */
  valueLabel?: string;
  /** Ordered bands by ascending upper bound; the last `to` should equal max */
  bands: { to: number; label: string; color: string }[];
  caption?: string;
}

export interface CalculatorConfig {
  inputs: InputField[];
  calculate: (values: Record<string, string>) => CalculatorResult[];
  /**
   * "Living Answer" — optional band gauge showing where the user's result lands
   * on a scale. Return null when inputs are incomplete.
   */
  gauge?: (values: Record<string, string>) => CalcGauge | null;
  /**
   * "Living Answer" — optional. Given the user's inputs, return the one chart
   * that tells this calculator's story (redraws live as inputs change). Return
   * null when inputs are incomplete.
   */
  chart?: (values: Record<string, string>) => CalcChart | null;
  /**
   * "Living Answer" — optional at-a-glance donut of the actual result split
   * (e.g. principal vs interest). Return null when inputs are incomplete.
   */
  donut?: (values: Record<string, string>) => CalcDonut | null;
  /**
   * Optional live walkthrough: given the user's inputs, return the solution
   * step by step WITH their numbers substituted — like a teacher at a whiteboard.
   * Rendered under the results. Return [] when inputs are incomplete.
   */
  explainSteps?: (values: Record<string, string>) => ExplainStep[];
  educational: EducationalContent;
  /** Optional map of shape-specific educational content (for multi-shape calculators).
   *  Key is the shape value from the form, value is the educational content to display. */
  educationalByShape?: Record<string, EducationalContent>;
  /** Optional shape tabs config for multi-shape calculators. Renders a tab bar above the inputs. */
  shapeTabs?: { label: string; value: string; slug: string }[];
  extraPanel?: (values: Record<string, string>, results: CalculatorResult[]) => React.ReactNode;
}

export interface CalculatorMeta {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  category: string;
  categorySlug: string;
  subCategory?: string;
  seoKeywords: string[];
  schema: 'SoftwareApplication' | 'FAQPage' | 'MathSolver' | 'both';
  mathSolverExpression?: string;
  lastVerified?: string;        // ISO date string, e.g. '2026-01-15'
  relatedPosts?: string[];      // Blog post slugs
  /** IDs of calculators manually curated as closely related, regardless of category */
  relatedIds?: string[];
  /** Name + credentials of the domain expert who reviewed this calculator's formulas */
  reviewedBy?: string;
  /** Feature flags for optional UI components */
  features?: {
    aiProofWizard?: boolean;  // Shows the multi-step AI-proof wizard on investment calculators
  };
}

export interface CalculatorEntry extends CalculatorMeta {
  loader: () => Promise<{ default: CalculatorConfig }>;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
  icon: string;
  description: string;
}

// ─── Type-safe subcategory taxonomy ───────────────────────────────────────
// Keeping subCategory typed as `string` on CalculatorMeta for backward compatibility,
// but exporting these unions so new entries get autocomplete + the validation
// script (scripts/validate-calculators.mjs) can flag typos at build time.

export const SUBCATEGORIES = {
  finance: [
    'Personal Finance',
    'Business & Accounting',
    'Real Estate',
    'Real Estate Finance',
    'Mortgages',
    'Home Equity',
    'Retirement',
    'Taxes',
    'Debt Management',
    'Investing',
  ],
  everyday: ['Time & Date', 'Conversions', 'Shopping & Discounts', 'Gaming', 'Astronomy', 'Travel', 'Misc'],
  health: ['Fitness', 'Nutrition', 'Pregnancy', 'Body Composition', 'Reproductive Health', 'Medical', 'Pet Health'],
  ecommerce: ['Pricing & Margin', 'Pricing & Profitability', 'Marketing & Ads', 'Operations'],
  math: ['Algebra', 'Geometry', 'Statistics', 'Number Theory', 'General'],
  diy: ['Paint & Coatings', 'Materials', 'Concrete & Masonry', 'General'],
  automotive: ['Loans & Leasing', 'Car Leasing', 'Car Buying', 'Fuel & Efficiency', 'Performance & Maintenance'],
  engineering: ['Electrical', 'Mechanical', 'Reliability', 'General'],
  industrial: ['Unit Converters', 'Industrial & Trades'],
  devtools: ['Data Formats', 'Text & Code', 'Encoders & Decoders'],
} as const;

// ─── Review system ──────────────────────────────────────────────────────────

export interface Review {
  id: string;
  calculatorId: string;
  rating: number; // 1–5
  title: string;
  content: string;
  author: string;
  createdAt: string; // ISO 8601
}

export interface AggregateRatingData {
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
}

export type FinanceSubCategory = (typeof SUBCATEGORIES.finance)[number];
export type EverydaySubCategory = (typeof SUBCATEGORIES.everyday)[number];
export type AnySubCategory = (typeof SUBCATEGORIES)[keyof typeof SUBCATEGORIES][number];
