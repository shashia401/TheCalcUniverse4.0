// Build-time snapshot of a calculator's form, so the static HTML contains the real inputs and the
// default answer instead of a blank placeholder. CalculatorConfig holds functions and cannot cross
// the server→client island boundary, so this carries only plain data; the island renders the same
// markup from it on the server and on its first client render (identical markup = clean hydration),
// then loads the live config and takes over.
import type { CalcDonut, CalcGauge, CalculatorConfig, CalculatorResult, InputField } from '../types/calculator';

/** Default value for every input: explicit default → first select option → number in the placeholder. */
export function seedDefaults(inputs: InputField[]): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const input of inputs) {
    if (input.defaultValue !== undefined && input.defaultValue !== '') {
      defaults[input.id] = String(input.defaultValue);
    } else if (input.type === 'select' && input.options?.length) {
      defaults[input.id] = input.options[0].value;
    } else if ((input.type === 'number' || input.type === 'percentage') && input.placeholder) {
      const m = input.placeholder.replace(/,/g, '').match(/-?\d+\.?\d*/);
      defaults[input.id] = m ? m[0] : '';
    } else if ((input.type === 'text' || input.type === 'textarea') && input.placeholder) {
      // Seed a sample data list from placeholders like "Enter numbers: 1, 2, 3" (stats/vector calcs),
      // but NOT paste prompts ("Paste your JSON here").
      const list = input.placeholder.match(/-?\d[\d\s,.\-]*\d/);
      defaults[input.id] = list && (list[0].match(/\d+/g)?.length ?? 0) >= 2 ? list[0].trim() : '';
    } else {
      defaults[input.id] = '';
    }
  }
  return defaults;
}

// Out-of-range guard. `calculate()` runs on every keystroke, so a typed or deep-linked value far
// outside an input's declared min/max (e.g. 1e12 years) could freeze the tab in a long loop or
// produce NaN/Infinity. Blank and non-numeric text are left to each calculator's own handling.
export function rangeErrors(inputs: InputField[], vals: Record<string, string>): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const i of inputs) {
    if (i.type !== 'number' && i.type !== 'percentage') continue;
    if (i.showWhen && !i.showWhen(vals)) continue;
    const raw = (vals[i.id] ?? '').replace(/,/g, '').trim();
    if (raw === '') continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    if ((i.min !== undefined && n < i.min) || (i.max !== undefined && n > i.max)) {
      errs[i.id] =
        i.min !== undefined && i.max !== undefined
          ? `Enter a value between ${i.min.toLocaleString()} and ${i.max.toLocaleString()}.`
          : i.max !== undefined
            ? `Enter a value of ${i.max.toLocaleString()} or less.`
            : `Enter a value of ${i.min!.toLocaleString()} or more.`;
    }
  }
  return errs;
}

export interface InitialForm {
  inputs: InputField[];
  values: Record<string, string>;
  results: CalculatorResult[];
  gauge: CalcGauge | null;
  donut: CalcDonut | null;
  shapeTabs?: { label: string; value: string; slug: string }[];
}

/** null = render the placeholder as before (custom React inputs can't be serialised). */
export function buildInitialForm(config: CalculatorConfig): InitialForm | null {
  if (config.inputs.some((i) => i.type === 'custom')) return null;
  const values = seedDefaults(config.inputs);
  let results: CalculatorResult[] = [];
  try {
    results = Object.keys(rangeErrors(config.inputs, values)).length ? [] : config.calculate(values);
  } catch {
    results = [];
  }
  let gauge: CalcGauge | null = null;
  let donut: CalcDonut | null = null;
  try { gauge = config.gauge?.(values) ?? null; } catch { gauge = null; }
  try { donut = config.donut?.(values) ?? null; } catch { donut = null; }
  if (donut?.formatValue) {
    // MiniDonut formats the total and each segment; snapshot those strings (a function can't be serialised,
    // and the client's first render must print exactly what the server printed or React discards the tree).
    const fmt = donut.formatValue;
    const total = donut.segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
    const formatted: Record<string, string> = { [String(total)]: fmt(total) };
    for (const s of donut.segments) formatted[String(s.value)] = fmt(s.value);
    const { formatValue: _fn, ...rest } = donut;
    donut = { ...rest, formatted };
  }
  const inputs = config.inputs
    .filter((i) => !i.showWhen || i.showWhen(values))
    // functions can't be serialised; showWhen was applied above and the live config re-applies it
    .map(({ component: _component, showWhen: _showWhen, ...plain }) => plain as InputField);
  return {
    inputs,
    values,
    // "_"-prefixed results are internal data for extraPanel (large chart payloads), never rendered
    results: results.filter((r) => !r.id.startsWith('_')),
    gauge,
    donut,
    shapeTabs: config.shapeTabs,
  };
}
