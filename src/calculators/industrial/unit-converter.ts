import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult, EducationalContent, ExplainStep, InputField } from '../../types/calculator';
import { formatQty, runConversion, type ConversionOutcome, type UnitDef } from '../../utils/unitConvert';
import ConverterPanel from './ConverterPanel';

export type { UnitDef } from '../../utils/unitConvert';

export interface ConverterOptions {
  units: UnitDef[];
  /** Panel header, e.g. 'Length Conversion' */
  label: string;
  /** Noun used in placeholders / help text, e.g. 'length' */
  quantity: string;
  defaultFrom?: string;
  defaultTo?: string;
  educational: EducationalContent;
  /** Reject negative inputs (frequency, pressure): calculate() returns [] */
  nonNegative?: boolean;
  /** Extra inputs rendered after From/To (e.g. density for viscosity) */
  extraInputs?: InputField[];
  /**
   * Custom conversion (viscosity needs density; electrical needs same-category units).
   * Return an outcome, an error message string, or null for incomplete input.
   */
  compute?: (values: Record<string, string>, units: UnitDef[]) => ConversionOutcome | string | null;
  /** Reject an otherwise valid outcome (temperature below absolute zero). Return the message to show. */
  validate?: (o: ConversionOutcome) => string | null;
  /** Text for the "Formula" row. Defaults to value x (from factor / to factor). */
  formula?: (o: ConversionOutcome) => string;
  /** Optional plain-English note shown under the primary result. */
  interpret?: (o: ConversionOutcome) => string;
  /** Reject zero and negative inputs (reciprocal units such as mpg). */
  positiveOnly?: boolean;
  /** Input ids, when a converter must keep legacy ids for shareable URLs. Defaults to value / from / to. */
  inputIds?: { value: string; from: string; to: string };
  /** Extra result rows after Formula (e.g. the L/100km base equivalent for fuel economy). */
  extraResults?: (o: ConversionOutcome) => CalculatorResult[];
  /** Initial value in the value field (default '1'). */
  defaultValue?: string;
  errorLabel?: string;
}

const defaultFormula = (o: ConversionOutcome) =>
  o.note ??
  `${formatQty(o.input)} × (${formatQty(o.from.factor)} ÷ ${formatQty(o.to.factor)}) = ${formatQty(o.result)}`;

/**
 * Builds a full CalculatorConfig for a unit converter on top of the shared engine (src/utils/unitConvert.ts).
 * calculate(), the panel and the live walkthrough all read ONE ConversionOutcome, so they cannot disagree.
 */
export function createConverter(opts: ConverterOptions): CalculatorConfig {
  const { units, label, quantity, educational } = opts;
  const from = opts.defaultFrom || units[0]?.value || '';
  const to = opts.defaultTo || (units.length > 1 ? units[1].value : units[0]?.value || '');
  const selectOptions = units.map((u) => ({ label: u.label, value: u.value }));

  const ids = opts.inputIds ?? { value: 'value', from: 'from', to: 'to' };

  const resolve = (values: Record<string, string>): ConversionOutcome | string | null => {
    const o = opts.compute
      ? opts.compute(values, units)
      : runConversion(values[ids.value], units, values[ids.from] || from, values[ids.to] || to);
    if (o === null || typeof o === 'string') return o;
    if (opts.nonNegative && o.input < 0) return null;
    if (opts.positiveOnly && o.input <= 0) return null;
    return opts.validate?.(o) ?? o;
  };

  return {
    inputs: [
      {
        id: ids.value,
        label: 'Value to Convert',
        type: 'number',
        placeholder: `Enter ${quantity}`,
        defaultValue: opts.defaultValue ?? '1',
        required: true,
        inputMode: 'decimal',
        helpText: `The ${quantity} value you want to convert`,
      },
      {
        id: ids.from,
        label: 'From',
        type: 'select',
        options: selectOptions,
        defaultValue: from,
        helpText: `The ${quantity} unit you are converting from`,
      },
      {
        id: ids.to,
        label: 'To',
        type: 'select',
        options: selectOptions,
        defaultValue: to,
        helpText: `The ${quantity} unit you are converting to`,
      },
      ...(opts.extraInputs ?? []),
    ],
    calculate: (values) => {
      const o = resolve(values);
      if (o === null) return [];
      if (typeof o === 'string') {
        return [{ id: 'error', label: opts.errorLabel ?? 'Cannot convert', value: o, highlight: true, color: 'negative' }];
      }
      const out = formatQty(o.result);
      const results: CalculatorResult[] = [
        {
          id: 'result',
          label: `Result (${o.from.shortLabel} → ${o.to.shortLabel})`,
          value: `${formatQty(o.input)} ${o.from.shortLabel} = ${out} ${o.to.shortLabel}`,
          highlight: true,
          color: 'positive',
          ...(opts.interpret ? { interpretation: opts.interpret(o) } : {}),
        },
        { id: 'formula', label: 'Formula', value: (opts.formula ?? defaultFormula)(o), color: 'neutral' },
        ...(opts.extraResults ? opts.extraResults(o) : []),
      ];
      return results;
    },
    explainSteps: (values): ExplainStep[] => {
      const o = resolve(values);
      if (o === null || typeof o === 'string') return [];
      return [
        { label: 'Convert to the base unit', expr: `${formatQty(o.input)} ${o.from.shortLabel} → ${formatQty(o.from.toBase ? o.from.toBase(o.input) : o.input * o.from.factor)} (base unit)` },
        { label: 'Convert to the target unit', expr: `= ${formatQty(o.result)} ${o.to.shortLabel}` },
      ];
    },
    extraPanel: (values, results) => {
      if (!results.some((r) => r.id === 'result')) return null;
      const o = resolve(values);
      if (o === null || typeof o === 'string') return null;
      return createElement(ConverterPanel, {
        input: o.input,
        result: o.result,
        fromUnit: o.from.shortLabel,
        toUnit: o.to.shortLabel,
        formula: (opts.formula ?? defaultFormula)(o),
        label,
      });
    },
    educational,
  };
}
