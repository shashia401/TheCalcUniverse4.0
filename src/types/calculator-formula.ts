export interface FormulaVariable {
  symbol: string;
  description: string;
  source?: { label: string; url: string };
}

export interface FormulaDefinition {
  latex: string;
  plain: string;
  variables: FormulaVariable[];
}
