import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import JsonFormatterPanel from './JsonFormatterPanel';

export interface JsonScan {
  formatted: string;
  unsafeNumbers: string[];
  duplicateKeys: string[];
}

/**
 * Pretty-prints already-validated JSON by re-flowing the ORIGINAL tokens instead of JSON.parse + JSON.stringify.
 * That keeps big integers exact (parse would turn 12345678901234567890 into 12345678901234567000), keeps duplicate
 * keys visible (parse silently keeps only the last), and keeps key order (stringify moves integer-like keys first).
 * Also reports integers beyond 2^53 and duplicated keys so the user knows what other tools would corrupt.
 */
export function scanAndFormatJson(text: string, indent: string): JsonScan {
  const unsafeNumbers: string[] = [];
  const duplicateKeys: string[] = [];
  const keyStack: Set<string>[] = [];
  let out = '';
  let depth = 0;
  const nl = () => '\n' + indent.repeat(depth);
  let i = 0;
  const n = text.length;
  const nextSignificant = (from: number) => {
    let j = from;
    while (j < n && /\s/.test(text[j])) j++;
    return j;
  };
  while (i < n) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const token = text.slice(i, j + 1);
      const after = text[nextSignificant(j + 1)];
      const top = keyStack[keyStack.length - 1];
      if (after === ':' && top) {
        const key = JSON.parse(token) as string;
        if (top.has(key)) duplicateKeys.push(key);
        top.add(key);
      }
      out += token;
      i = j + 1;
    } else if (c === '{' || c === '[') {
      const j = nextSignificant(i + 1);
      if (text[j] === (c === '{' ? '}' : ']')) {
        out += c + text[j];
        i = j + 1;
      } else {
        keyStack.push(new Set());
        depth++;
        out += c + nl();
        i++;
      }
    } else if (c === '}' || c === ']') {
      keyStack.pop();
      depth--;
      out += nl() + c;
      i++;
    } else if (c === ',') {
      out += ',' + nl();
      i++;
    } else if (c === ':') {
      out += ': ';
      i++;
    } else {
      let j = i;
      while (j < n && !/[\s,\]}:]/.test(text[j])) j++;
      const lit = text.slice(i, j);
      if (/^-?\d+$/.test(lit) && !Number.isSafeInteger(Number(lit))) unsafeNumbers.push(lit);
      out += lit;
      i = j;
    }
  }
  return { formatted: out, unsafeNumbers, duplicateKeys };
}

/** "Unexpected token } in JSON at position 12" -> "... (line 2, column 5)". Newer engines already include line/column. */
export function describeJsonError(message: string, input: string): string {
  if (/line \d+ column \d+/i.test(message)) return message;
  const m = /position (\d+)/.exec(message);
  if (!m) return message;
  const pos = Math.min(Number(m[1]), input.length);
  const before = input.slice(0, pos).split('\n');
  return `${message} (line ${before.length}, column ${before[before.length - 1].length + 1})`;
}

const jsonFormatterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'jsonInput',
      label: 'JSON Input',
      type: 'textarea',
      placeholder: 'Paste your JSON here...',
      required: true,
      helpText: 'Paste raw JSON to validate and format',
    },
    {
      id: 'indentSize',
      label: 'Indentation',
      type: 'select',
      helpText: 'Choose the indentation style for formatted output',
      options: [
        { label: '2 Spaces', value: '2' },
        { label: '4 Spaces', value: '4' },
        { label: 'Tab', value: 'tab' },
      ],
      required: true,
    },
  ],
  calculate: (values: Record<string, string>) => {
    const input = values.jsonInput || '';
    const indent = values.indentSize || '2';

    if (!input.trim()) return [];

    try {
      JSON.parse(input); // validation only: formatting re-flows the original tokens (see scanAndFormatJson)
      const indentStr = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent, 10) || 2);
      const scan = scanAndFormatJson(input, indentStr);
      const formatted = scan.formatted;
      const warnings: string[] = [];
      if (scan.unsafeNumbers.length) warnings.push(`Integer(s) beyond 2^53 lose precision in JavaScript (JSON.parse): ${scan.unsafeNumbers.slice(0, 3).join(', ')}. They are kept exactly here; use strings or BigInt-aware parsing in code.`);
      if (scan.duplicateKeys.length) warnings.push(`Duplicate key(s): ${[...new Set(scan.duplicateKeys)].slice(0, 5).join(', ')}. JSON.parse keeps only the last value of each.`);
      const charCount = input.length;
      const lineCount = formatted.split('\n').length;

      return [
        { id: 'status', label: 'Status', value: 'Valid JSON', color: 'positive', ...(warnings.length ? { warning: warnings.join(' ') } : {}) },
        { id: 'formatted', label: 'Formatted JSON', value: formatted, highlight: true },
        { id: 'charCount', label: 'Character Count', value: `${charCount}`, color: 'neutral' },
        { id: 'lineCount', label: 'Line Count', value: `${lineCount}`, color: 'neutral' },
      ];
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown parse error';
      return [
        { id: 'status', label: 'Status', value: `Invalid JSON: ${describeJsonError(message, input)}`, color: 'negative' },
        { id: 'formatted', label: 'Formatted JSON', value: '', color: 'neutral' },
        { id: 'charCount', label: 'Character Count', value: `${input.length}`, color: 'neutral' },
        { id: 'lineCount', label: 'Line Count', value: '0', color: 'neutral' },
      ];
    }
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(JsonFormatterPanel, { values, results });
  },
  educational: {
    formula: 'Validate with JSON.parse(input), then re-flow the original tokens with the chosen indent',
    diagram: {
      svg: '<svg viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="20" width="360" height="240" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><text x="220" y="48" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">JSON Formatter &amp; Validator</text><rect x="60" y="65" width="140" height="70" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="130" y="95" text-anchor="middle" font-size="11" fill="var(--svg-2563eb)">Raw JSON</text><text x="130" y="115" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">{"a":1,"b":2}</text><line x1="200" y1="100" x2="240" y2="100" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="240,95 252,100 240,105" fill="var(--svg-64748b)"/><rect x="255" y="60" width="140" height="80" fill="var(--svg-8b5cf6)" stroke="var(--svg-7c3aed)" stroke-width="1.5" rx="6"/><text x="325" y="95" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">JSON.parse()</text><text x="325" y="115" text-anchor="middle" font-size="10" fill="var(--svg-ddd6fe)">Validates syntax</text><line x1="325" y1="140" x2="325" y2="165" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="320,165 325,175 330,165" fill="var(--svg-64748b)"/><rect x="140" y="180" width="170" height="45" fill="var(--svg-22c55e)" stroke="var(--svg-16a34a)" stroke-width="1.5" rx="6"/><text x="225" y="200" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">JSON.stringify()</text><text x="225" y="216" text-anchor="middle" font-size="10" fill="var(--svg-bbf7d0)">Formatted output</text></svg>',
      alt: 'Flow diagram showing raw JSON being parsed by JSON.parse() and formatted by JSON.stringify()',
      caption: 'JSON formatting pipeline — parse, validate, then pretty-print with indentation',
    },
    formulaDescription:
      'The JSON formatter works by parsing the raw input string into a JavaScript object using JSON.parse(), which also validates the syntax. Then JSON.stringify() converts the object back to a formatted JSON string with the chosen indentation level (2 spaces, 4 spaces, or tabs). This round-trip process ensures the output is always valid, properly indented, and easy to read.',
    variables: [
      {
        symbol: 'JSON.parse()',
        name: 'JSON Parser',
        description: 'Parses a JSON string into a JavaScript object. Throws a SyntaxError if the input is not valid JSON.',
      },
      {
        symbol: 'JSON.stringify()',
        name: 'JSON Serializer',
        description: 'Converts a JavaScript object back to a formatted JSON string with optional indentation and replacer functions.',
      },
      {
        symbol: 'Indent',
        name: 'Indentation Level',
        description: 'The number of spaces or tab character used per indentation level in the formatted output.',
      },
      {
        symbol: 'Syntax Error',
        name: 'JSON Syntax Error',
        description: 'An error thrown when the input contains invalid JSON syntax, such as trailing commas, unquoted keys, or mismatched brackets.',
      },
    ],
    howToUse: [
      'Paste or type your raw JSON string into the input field.',
      'Select your preferred indentation size (2 spaces, 4 spaces, or tab).',
      'The formatted JSON and character/line counts update instantly as you type.',
      'If the JSON is invalid, the error message will highlight exactly what went wrong.',
    ],
    quickReference: [
      { label: 'Valid JSON keys', value: 'Must be double-quoted strings' },
      { label: 'Trailing commas', value: 'Not allowed in JSON' },
      { label: 'Comments', value: 'Not supported in standard JSON' },
    ],
    commonUses: [
      'Prettifying minified JSON from API responses for debugging.',
      'Validating JSON configuration files before deployment.',
      'Formatting JSON data for code reviews and documentation.',
      'Cleaning up JSON output from database exports and log files.',
    ],
    explanation:
      'JSON (JavaScript Object Notation) is a lightweight data interchange format that has become the standard for API communication, configuration files, and data storage. The JSON Formatter and Validator tool parses raw JSON strings and reformats them with proper indentation, making complex nested structures readable. JSON.parse() is strict: it requires double-quoted strings, no trailing commas, and no comments. When the parser encounters invalid syntax, it throws a SyntaxError with a message indicating the position of the problem. The formatted output uses JSON.stringify() with the specified indentation, which produces clean, human-readable output. Character count helps estimate payload sizes, and line count shows the vertical space the formatted JSON occupies. This tool is essential for any developer working with APIs, configuration management, or data serialization.',
    faqs: [
      {
        question: 'What is the difference between valid JSON and a valid JavaScript object?',
        answer: 'JSON is a subset of JavaScript object syntax. JSON requires all keys and string values to be double-quoted, does not allow trailing commas, does not support comments, and only supports a limited set of data types (strings, numbers, booleans, null, objects, and arrays). JavaScript objects can have single-quoted or unquoted keys, trailing commas, comments, and support many more types like functions, undefined, and symbols.',
      },
      {
        question: 'Why does my valid JavaScript object fail JSON parsing?',
        answer: 'Common reasons include: using single quotes for keys or strings, having trailing commas after the last property, including comments, using undefined or NaN values, and having functions as property values. JSON is more restrictive than JavaScript by design to ensure interoperability across different programming languages.',
      },
      {
        question: 'What is the recommended indentation for JSON files?',
        answer: '2 spaces is the most common convention for JSON files, especially in the JavaScript/Node.js ecosystem. 4 spaces is popular in Python and Java communities. Tabs are less common but some developers prefer them for accessibility since tab width can be adjusted by the reader.',
      },
    ],
    citations: [
      { title: 'JSON.org — Introducing JSON', url: 'https://www.json.org/json-en.html' },
      { title: 'MDN — JSON.stringify()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify' },
    ],
  },
};

export default jsonFormatterConfig;
