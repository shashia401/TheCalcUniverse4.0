import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RomanNumeralPanel from './RomanNumeralPanel';

const ROMAN_MAP: Array<{ value: number; symbol: string; notation: string }> = [
  { value: 1000, symbol: 'M', notation: 'M' },
  { value: 900, symbol: 'CM', notation: 'CM (1000-100)' },
  { value: 500, symbol: 'D', notation: 'D' },
  { value: 400, symbol: 'CD', notation: 'CD (500-100)' },
  { value: 100, symbol: 'C', notation: 'C' },
  { value: 90, symbol: 'XC', notation: 'XC (100-10)' },
  { value: 50, symbol: 'L', notation: 'L' },
  { value: 40, symbol: 'XL', notation: 'XL (50-10)' },
  { value: 10, symbol: 'X', notation: 'X' },
  { value: 9, symbol: 'IX', notation: 'IX (10-1)' },
  { value: 5, symbol: 'V', notation: 'V' },
  { value: 4, symbol: 'IV', notation: 'IV (5-1)' },
  { value: 1, symbol: 'I', notation: 'I' },
];

const ROMAN_CHARS: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return '';
  let remaining = n;
  let result = '';
  for (const { value, symbol } of ROMAN_MAP) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

function fromRoman(s: string): number {
  const cleaned = s.trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(cleaned)) return 0;
  let total = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const cur = ROMAN_CHARS[cleaned[i]] ?? 0;
    const next = ROMAN_CHARS[cleaned[i + 1]] ?? 0;
    if (cur < next) {
      total -= cur;
    } else {
      total += cur;
    }
  }
  return total;
}

function getBreakdown(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return '';
  const parts: string[] = [];
  let remaining = n;
  for (const { value, symbol, notation } of ROMAN_MAP) {
    if (remaining >= value) {
      const count = Math.floor(remaining / value);
      const symPart = symbol.length > 1 ? symbol : symbol.repeat(count);
      const note = symbol.length > 1 ? notation : `${symbol} (${value})`;
      parts.push(`${symPart} ${note}`);
      remaining -= count * value;
    }
  }
  return parts.join(' + ');
}

function fmtDate(year: number, month: number, day: number, format: string): string {
  const rYear = toRoman(year);
  const rMonth = toRoman(month);
  const rDay = toRoman(day);
  if (!rYear || !rMonth || !rDay) return '';
  if (format === 'dmy') return `${rDay}.${rMonth}.${rYear}`;
  return `${rMonth}.${rDay}.${rYear}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

const romanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Conversion Mode',
      type: 'select',
      options: [
        { label: 'Number to Roman', value: 'toRoman' },
        { label: 'Roman to Number', value: 'fromRoman' },
        { label: 'Date to Roman', value: 'date' },
      ],
      helpText: 'Select the conversion mode for the calculator',
    },
    {
      id: 'number',
      label: 'Number',
      type: 'number',
      min: 1,
      max: 3999,
      step: 1,
      placeholder: 'e.g., 1994',
      showWhen: (v) => v.mode === 'toRoman',
      helpText: 'Enter a whole number between 1 and 3999',
    },
    {
      id: 'romanInput',
      label: 'Roman Numeral',
      type: 'text',
      placeholder: 'e.g., MCMXCIV',
      showWhen: (v) => v.mode === 'fromRoman',
      helpText: 'Enter a Roman numeral to convert to a number',
    },
    {
      id: 'dateYear',
      label: 'Year',
      type: 'number',
      min: 1,
      max: 3999,
      step: 1,
      placeholder: 'e.g., 2024',
      showWhen: (v) => v.mode === 'date',
      helpText: 'Enter the year (1-3999) for the date conversion',
    },
    {
      id: 'dateMonth',
      label: 'Month',
      type: 'number',
      min: 1,
      max: 12,
      step: 1,
      placeholder: 'e.g., 4',
      showWhen: (v) => v.mode === 'date',
      helpText: 'Enter the month (1-12) for the date conversion',
    },
    {
      id: 'dateDay',
      label: 'Day',
      type: 'number',
      min: 1,
      max: 31,
      step: 1,
      placeholder: 'e.g., 4',
      showWhen: (v) => v.mode === 'date',
      helpText: 'Enter the day (1-31) for the date conversion',
    },
    {
      id: 'dateFormat',
      label: 'Date Format',
      type: 'select',
      options: [
        { label: 'Month Day, Year (e.g., IV.IV.MMXXIV)', value: 'mdy' },
        { label: 'Day Month Year', value: 'dmy' },
      ],
      showWhen: (v) => v.mode === 'date',
      helpText: 'Select the date format for Roman numeral output',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'toRoman';

    if (mode === 'toRoman') {
      const num = parseFloat(values.number);
      if (!Number.isInteger(num) || num < 1 || num > 3999) return [];
      const roman = toRoman(num);
      if (!roman) return [];
      return [
        {
          id: 'romanResult',
          label: 'Roman Numeral',
          value: roman,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'arabicValue',
          label: 'Value',
          value: String(num),
        },
        {
          id: 'breakdown',
          label: 'Subtractive Notation',
          value: `${getBreakdown(num)} = ${num}`,
        },
      ];
    }

    if (mode === 'fromRoman') {
      const input = (values.romanInput || '').trim().toUpperCase();
      if (!input || !/^[IVXLCDM]+$/.test(input)) return [];
      const num = fromRoman(input);
      if (num === 0) return [];
      const validRoman = toRoman(num);
      if (validRoman !== input) {
        return [
          {
            id: 'arabicResult',
            label: 'Number',
            value: String(num),
          },
          {
            id: 'romanOriginal',
            label: 'Roman',
            value: input,
          },
          {
            id: 'validationNote',
            label: 'Warning',
            value: `Not a valid Roman numeral (standard form: ${validRoman})`,
          },
        ];
      }
      return [
        {
          id: 'arabicResult',
          label: 'Number',
          value: String(num),
        },
        {
          id: 'romanOriginal',
          label: 'Roman',
          value: input,
        },
        {
          id: 'validationNote',
          label: 'Valid Roman Numeral',
          value: 'Yes',
        },
      ];
    }

    if (mode === 'date') {
      const year = parseInt(values.dateYear, 10);
      const month = parseInt(values.dateMonth, 10);
      const day = parseInt(values.dateDay, 10);
      const dateFormat = values.dateFormat || 'mdy';
      if (isNaN(year) || isNaN(month) || isNaN(day)) return [];
      if (year < 1 || year > 3999 || month < 1 || month > 12 || day < 1 || day > 31) return [];
      const romanDate = fmtDate(year, month, day, dateFormat);
      if (!romanDate) return [];
      return [
        {
          id: 'romanDate',
          label: 'Roman Date',
          value: romanDate,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'gregorianDate',
          label: 'Gregorian Date',
          value: `${dateFormat === 'dmy' ? `${pad(day)}/${pad(month)}/${year}` : `${pad(month)}/${pad(day)}/${year}`}`,
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RomanNumeralPanel, { values, results });
  },
  educational: {
    formula: 'I=1, V=5, X=10, L=50, C=100, D=500, M=1000',
    formulaDescription:
      'Roman numerals use combinations of letters from the Latin alphabet to represent numbers. The system is additive (symbols are combined and their values summed) with subtractive notation (placing a smaller value before a larger one indicates subtraction) for 4s and 9s. For example, VI = 5 + 1 = 6, while IV = 5 - 1 = 4. This subtractive convention avoids having four identical symbols in a row (IIII instead of IV). The symbols represent powers of ten (I, X, C, M) and halves of those powers (V, L, D).',
    variables: [
      {
        symbol: 'I',
        name: '1',
        description: 'One (unus in Latin). The smallest unit. Can be subtracted from V and X (IV=4, IX=9).',
      },
      {
        symbol: 'V',
        name: '5',
        description: 'Five (quinque). Cannot be subtracted. Appears only in additive position.',
      },
      {
        symbol: 'X',
        name: '10',
        description: 'Ten (decem). Can be subtracted from L and C (XL=40, XC=90).',
      },
      {
        symbol: 'L',
        name: '50',
        description: 'Fifty (quinquaginta). Cannot be subtracted.',
      },
      {
        symbol: 'C',
        name: '100',
        description: 'One hundred (centum). Can be subtracted from D and M (CD=400, CM=900).',
      },
      {
        symbol: 'D',
        name: '500',
        description: 'Five hundred (quingenti). Cannot be subtracted.',
      },
      {
        symbol: 'M',
        name: '1000',
        description: 'One thousand (mille). The largest standard symbol. Can be repeated up to three times (MMM=3000).',
      },
    ],
    howToUse: [
      'Choose the conversion mode: Number to Roman, Roman to Number, or Date to Roman.',
      'For Number to Roman, enter a whole number between 1 and 3999. The converter will break down each decimal place.',
      'For Roman to Number, enter a valid Roman numeral (e.g., MCMXCIV for 1994).',
      'For Date to Roman, enter the year, month, and day separately. Each component is converted independently.',
      'Review your converted result with a complete subtractive notation breakdown showing each step.',
    ],
    explanation:
      'Roman numerals originated in ancient Rome around 1000 BCE and remained the standard way of writing numbers throughout Europe for over a thousand years. The system uses seven letters from the Latin alphabet: I, V, X, L, C, D, and M. Numbers are formed by combining these symbols and adding their values. The subtractive notation convention (e.g., IV for 4 instead of IIII, IX for 9 instead of VIIII) was developed to prevent long strings of identical symbols and became the standard during the Middle Ages. This is why valid Roman numerals follow strict rules about placement: I can only precede V and X, X can only precede L and C, and C can only precede D and M. Symbols that represent 5s (V, L, D) are never subtracted and never repeated. Symbols representing powers of 10 (I, X, C, M) can be repeated up to three times in a row.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="12" font-weight="bold">Roman Numeral Reference</text><rect x="15" y="30" width="42" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="36" y="49" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">I</text><text x="36" y="72" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">1</text><rect x="60" y="30" width="42" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="81" y="49" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">V</text><text x="81" y="72" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">5</text><rect x="105" y="30" width="42" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="126" y="49" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">X</text><text x="126" y="72" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">10</text><rect x="150" y="30" width="42" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="171" y="49" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">L</text><text x="171" y="72" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">50</text><rect x="195" y="30" width="42" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="216" y="49" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">C</text><text x="216" y="72" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">100</text><rect x="240" y="30" width="42" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="261" y="49" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">D</text><text x="261" y="72" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">500</text><rect x="40" y="82" width="100" height="30" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="90" y="101" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="13" font-weight="bold">M</text><text x="90" y="122" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">1000</text><text x="210" y="100" text-anchor="middle" fill="var(--svg-374151)" font-size="10" font-weight="bold">Subtractive Notation</text><rect x="160" y="130" width="140" height="22" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="4"/><text x="230" y="144" text-anchor="middle" fill="var(--svg-991b1b)" font-size="10">IV = 4, IX = 9, XL = 40</text><rect x="160" y="158" width="140" height="22" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="4"/><text x="230" y="172" text-anchor="middle" fill="var(--svg-991b1b)" font-size="10">XC = 90, CD = 400, CM = 900</text><rect x="20" y="130" width="120" height="22" fill="var(--svg-d1fae5)" stroke="var(--svg-059669)" stroke-width="1.5" rx="4"/><text x="80" y="144" text-anchor="middle" fill="var(--svg-065f46)" font-size="9">1994 = MCMXCIV</text></svg>',
      alt: 'Roman numeral reference chart showing I, V, X, L, C, D, M with their values and subtractive notation examples',
      caption: 'Roman numerals use seven symbols. Subtractive notation places a smaller value before a larger one to indicate subtraction.',
    },
    quickReference: [
      { label: 'I', value: '1' },
      { label: 'V', value: '5' },
      { label: 'X', value: '10' },
      { label: 'L', value: '50' },
      { label: 'C', value: '100' },
      { label: 'D', value: '500' },
      { label: 'M', value: '1000' },
      { label: 'IV', value: '4 (5-1)' },
      { label: 'IX', value: '9 (10-1)' },
      { label: 'XL', value: '40 (50-10)' },
      { label: 'XC', value: '90 (100-10)' },
      { label: 'CD', value: '400 (500-100)' },
      { label: 'CM', value: '900 (1000-100)' },
    ],
    commonUses: [
      'Reading year dates on monuments, buildings, and movie copyrights (e.g., MMXXIV = 2024)',
      'Understanding page numbering in book front matter, appendices, and formal documents',
      'Interpreting Super Bowl numbering, Olympic Games enumeration, and event sequencing',
      'Decoding regnal numbers for monarchs, popes, and ecclesiastical figures (e.g., Elizabeth II)',
      'Recognizing chapter and section numbering in legal documents, legislation, and academic papers',
    ],
    faqs: [
      {
        question: 'Why is 4 written as IV and not IIII?',
        answer:
          'Subtractive notation avoids long runs of identical symbols. IV means "one before five" (5 - 1 = 4). This became the standard form during the Middle Ages for clarity and brevity, though IIII is still seen on some traditional clock faces (especially Big Ben in London) for aesthetic symmetry with the VIII on the opposite side.',
      },
      {
        question: 'What is the largest number that can be written in standard Roman numerals?',
        answer:
          'The largest number typically considered valid in standard Roman numerals is 3,999 (MMMCMXCIX). For larger numbers, a vinculum (horizontal bar placed above a symbol) multiplies its value by 1,000. For example, V with a bar = 5,000, M with a bar = 1,000,000. Some later extensions also use double bars or apostrophus notation for very large numbers.',
      },
      {
        question: 'Did Romans actually use subtractive notation as we do today?',
        answer:
          'Yes and no. While the Romans occasionally used subtractive forms (like IV for 4), they more commonly used additive forms (like IIII for 4 and VIIII for 9). The strict subtractive rules we follow today were formalized during the Middle Ages by scribes and scholars who standardized the system. Ancient Roman inscriptions actually show both forms, sometimes inconsistently within the same document.',
      },
      {
        question: 'Are Roman numerals still used today?',
        answer:
          'Yes! Roman numerals appear on clock faces and watches, in movie copyright dates (the year of production), for Super Bowl numbering (Super Bowl LVIII), in outlines (I, II, III, A, B, C), for monarch and pope names (Elizabeth II, Pope Francis I), in book chapter and volume numbering, for Olympic Games numbering, and sometimes in formal document dating.',
      },
      {
        question: 'What are the rules for forming Roman numerals?',
        answer: 'The rules are: (1) Symbols are read left to right, largest to smallest value. (2) When a smaller symbol precedes a larger one, it is subtracted (IV = 4). (3) Only powers of ten (I, X, C) can be used as subtractive prefixes. (4) The subtractive prefix must be exactly one order of magnitude smaller than the base symbol (I for V and X, X for L and C, C for D and M). (5) No symbol can repeat more than three times consecutively. (6) V, L, and D are never repeated.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Roman Numerals', url: 'https://en.wikipedia.org/wiki/Roman_numerals' },
      { source: 'Wolfram MathWorld', title: 'Roman Numerals', url: 'https://mathworld.wolfram.com/RomanNumerals.html' },
    ],
  },
};

export default romanConfig;
