export interface UnitDef {
  value: string;
  label: string;
  shortLabel: string;
  factor: number;
}

interface CreateConverterParams {
  units: UnitDef[];
  defaultFrom?: string;
  defaultTo?: string;
  educational: Record<string, unknown>;
}

export function createConverter({
  units,
  defaultFrom,
  defaultTo,
  educational,
}: CreateConverterParams) {
  const from = defaultFrom || units[0]?.value || '';
  const to = defaultTo || (units.length > 1 ? units[1].value : units[0]?.value || '');

  return {
    inputs: [
      {
        id: 'value',
        label: 'Value to Convert',
        type: 'number' as const,
        placeholder: 'Enter value',
        defaultValue: '1',
        required: true,
        inputMode: 'decimal' as const,
        helpText: 'The numeric value you want to convert',
      },
      {
        id: 'from',
        label: 'From',
        type: 'select' as const,
        options: units.map((u) => ({ label: u.label, value: u.value })),
        defaultValue: from,
        helpText: 'The unit you are converting from',
      },
      {
        id: 'to',
        label: 'To',
        type: 'select' as const,
        options: units.map((u) => ({ label: u.label, value: u.value })),
        defaultValue: to,
        helpText: 'The unit you are converting to',
      },
    ],
    calculate: (values: Record<string, string>) => {
      if (values.value === undefined || values.value === '') return [];

      const val = parseFloat(values.value);
      const fromUnit = values.from || from;
      const toUnit = values.to || to;

      if (isNaN(val)) return [];

      const fromDef = units.find((u) => u.value === fromUnit);
      const toDef = units.find((u) => u.value === toUnit);
      if (!fromDef || !toDef) return [];
      if (toDef.factor === 0) return [];

      const result = (val * fromDef.factor) / toDef.factor;

      return [
        {
          id: 'result',
          label: `Result (${fromUnit} → ${toUnit})`,
          value: `${val} ${fromDef.shortLabel || fromUnit} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toDef.shortLabel || toUnit}`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'formula',
          label: 'Formula',
          value: `${val} × (${fromDef.factor} ÷ ${toDef.factor}) = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
          color: 'neutral' as const,
        },
      ];
    },
    educational,
  };
}
