// A decision tool is one form feeding a few linked answers and a plain verdict. The generic island
// (src/components/decisions/DecisionTool.tsx) renders any tool from one of these descriptions; each tool
// supplies only its inputs, math, wording and links. Keep the math in a pure module under src/lib/ so the
// server renders the same numbers the browser recomputes and unit tests can pin it to independent values.

export type VerdictLevel = 'comfortable' | 'tight' | 'over';

export interface FieldDef<K extends string = string> {
  key: K;
  label: string;
  /** '$' gets thousands separators as you type; any other prefix is shown as plain text */
  prefix?: string;
  suffix?: string;
  help?: string;
}

export interface FieldGroup<K extends string = string> {
  title: string;
  hint: string;
  fields: FieldDef<K>[];
}

export interface Line {
  label: string;
  value: string;
  strong?: boolean;
}

export interface StepSpec {
  title: string;
  /** one sentence that answers the step's question with the visitor's numbers */
  answer: string;
  lines: Line[];
  note?: { text: string; tone: 'positive' | 'neutral' | 'negative' };
  /** deep link into the full calculator, carrying the inputs already entered */
  href: string;
  linkLabel: string;
}

export interface VerdictSpec {
  level: VerdictLevel;
  title: string;
  line: string;
  /** the handful of numbers shown in the verdict card */
  lines: Line[];
  reasons: string[];
}

export interface DecisionEngine<I extends { [K in keyof I]: number }, D> {
  /** prefix for input element ids, e.g. 'hd' gives #hd-price */
  idPrefix: string;
  /** localStorage key for saved scenarios */
  storageKey: string;
  defaults: I;
  groups: FieldGroup<Extract<keyof I, string>>[];
  validate: (i: I) => boolean;
  evaluate: (i: I) => D;
  fromQuery: (search: string) => I;
  toQuery: (i: I) => string;
  verdict: (d: D, i: I) => VerdictSpec;
  steps: (d: D, i: I) => StepSpec[];
  /** rows of the side-by-side comparison of saved scenarios */
  compareRows: { label: string; value: (d: D, i: I) => string }[];
  invalidMessage: string;
  /** shown when the form is empty or invalid */
  emptyMessage: string;
  /** what the empty-comparison hint tells people to change, e.g. "the price, down payment or rate" */
  compareHint: string;
}
