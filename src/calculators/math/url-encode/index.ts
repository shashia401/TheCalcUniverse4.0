import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import UrlEncodePanel from './urlEncodePanel';

export function calculate(
  values: Record<string, unknown>
): CalculatorResult[] {
  const inputText = String(values.inputText ?? '');
  const mode = String(values.mode || 'Encode');

  if (!inputText) {
    return [];
  }

  const originalChars = inputText.length;

  if (mode === 'Encode') {
    const normalized = inputText.normalize('NFC');
    const encoded = encodeURIComponent(normalized);
    return [
      { id: 'Output', label: 'Output', value: encoded },
      { id: 'Original Character Count', label: 'Original Character Count', value: String(originalChars) },
      { id: 'Encoded Character Count', label: 'Encoded Character Count', value: String(encoded.length) },
      { id: 'Mode', label: 'Mode', value: 'Encode' },
    ];
  }

  if (mode === 'Decode') {
    try {
      const decoded = decodeURIComponent(inputText);
      return [
        { id: 'Output', label: 'Output', value: decoded },
        { id: 'Original Character Count', label: 'Original Character Count', value: String(originalChars) },
        { id: 'Decoded Character Count', label: 'Decoded Character Count', value: String(decoded.length) },
        { id: 'Mode', label: 'Mode', value: 'Decode' },
      ];
    } catch {
      return [
        { id: 'Output', label: 'Output', value: '[Invalid URL Encoding]' },
        { id: 'Original Character Count', label: 'Original Character Count', value: String(originalChars) },
        { id: 'Mode', label: 'Mode', value: 'Decode' },
      ];
    }
  }

  return [];
}

const urlEncodeConfig: CalculatorConfig = {
  inputs: [
    { id: 'inputText', label: 'Input Text', type: 'text', placeholder: 'Enter text to URL-encode or decode', required: true, helpText: 'Enter text to URL-encode or a percent-encoded string to decode' },
    {
      id: 'mode', label: 'Mode', type: 'select', required: true,
      options: [
        { value: 'Encode', label: 'Encode' },
        { value: 'Decode', label: 'Decode' },
      ],
      helpText: 'Choose whether to encode or decode the input',
    },
  ],

  calculate: (values): CalculatorResult[] => calculate(values),

  extraPanel: (values, results) => createElement(UrlEncodePanel),

  educational: {
    formula: 'URL Encoding = % + hex code (e.g., space → %20)',
    formulaDescription:
      'URL encoding (percent-encoding) converts characters into a format that can be safely transmitted in URLs by replacing unsafe characters with % followed by their two-digit hex code. Every character has an ASCII code, and percent-encoding simply writes that code in hexadecimal preceded by a percent sign. For example, the space character has ASCII code 32 decimal, which is 20 in hex, so it encodes as %20. This scheme ensures that URLs remain unambiguous and compatible across all web servers, proxies, and browsers, regardless of the underlying character encoding of the page.',
    variables: [
      { symbol: 'input', name: 'Input Text', description: 'The text to URL-encode or the percent-encoded string to decode.' },
      { symbol: 'encoded', name: 'Encoded Output', description: 'Percent-encoded string safe for use in URLs.' },
    ],
    howToUse: [
      'Select Encode mode to convert special characters to percent-encoding for use in URL query parameters or path segments.',
      'Select Decode mode to convert percent-encoded strings back to plain readable text, for example when debugging encoded URLs.',
      'The encoding map shows which characters in your input were encoded and what their hex codes are.',
      'Character counts show how encoding affects the length — strings with many special characters can grow significantly.',
    ],
    explanation:
      'URL encoding (percent-encoding) replaces unsafe ASCII characters in URLs with a % followed by their two-digit hexadecimal code. For example, a space becomes %20, an ampersand (&) becomes %26, and a hash (#) becomes %23. Only alphanumeric characters (A-Z, a-z, 0-9) and the unreserved characters (- _ . ~) remain unencoded. Reserved characters like ?, /, :, @, &, =, +, $, and # must be encoded when they appear in data rather than as URL syntax delimiters. Without percent-encoding, special characters in query parameters would break URL parsing: if a search query contains "&", the server would misinterpret it as a parameter separator, so encoding it as %26 solves this problem. Modern browsers automatically encode certain characters in the address bar, but when constructing URLs programmatically in JavaScript, encodeURIComponent() encodes query parameter values safely while encodeURI() preserves structural characters like slashes.',
    faqs: [
      {
        question: 'Why do spaces in URLs become %20?',
        answer: 'Spaces are not allowed in URLs because they break parsing — a URL with a space would be ambiguous. The %20 encoding is the hex representation of the space character (ASCII 32 = 0x20). In the query string portion of a URL (after the ?), a + sign may also represent a space, following the application/x-www-form-urlencoded convention from HTML forms. However, in other parts of the URL, only %20 is valid for encoding spaces.',
      },
      {
        question: 'What characters need URL encoding?',
        answer: 'All characters except A-Z, a-z, 0-9, and - _ . ~ need encoding in URLs. This includes spaces, punctuation marks (quotes, brackets, commas), and special characters like & ? # % = that have structural meaning in URLs. If a query parameter value contains an &, it must be encoded as %26 or the server will interpret it as the start of a new parameter, causing data corruption.',
      },
      {
        question: 'What is the difference between encodeURI() and encodeURIComponent()?',
        answer: 'encodeURI() encodes a complete URI while preserving characters that have special meaning in the URI structure, such as :, /, ?, and #. Use it when encoding an entire URL string. encodeURIComponent() encodes all characters including structural ones, making it suitable for encoding individual query parameter values. Using the wrong function can break your URL: encodeURI("page.html?q=hello&world") produces "page.html?q=hello&world" (unchanged), while encodeURIComponent("hello&world") produces "hello%26world".',
      },
    ],
    citations: [
      { source: 'RFC 3986 - Uniform Resource Identifier (URI)', url: 'https://datatracker.ietf.org/doc/html/rfc3986' },
      { source: 'Wikipedia - Percent-Encoding', url: 'https://en.wikipedia.org/wiki/Percent-encoding' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">URL Encoding (Percent-Encoding)</text><rect x="20" y="35" width="120" height="36" rx="6" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="80" y="50" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Input</text><text x="80" y="65" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">hello world</text><line x1="140" y1="48" x2="165" y2="48" stroke="var(--svg-333333)" stroke-width="2"/><polygon points="165,43 175,48 165,53" fill="var(--svg-333333)"/><rect x="175" y="30" width="120" height="36" rx="6" fill="var(--svg-ef4444)" opacity="0.8"/><text x="235" y="45" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Encoded</text><text x="235" y="60" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">hello%20world</text><text x="160" y="90" text-anchor="middle" font-size="11" fill="var(--svg-555555)">Unsafe characters → % + hex code</text><rect x="15" y="104" width="290" height="86" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="124" text-anchor="middle" font-size="10" fill="var(--svg-555555)" font-weight="bold">Common Encodings</text><text x="20" y="144" font-size="10" fill="var(--svg-333333)">Space → %20</text><text x="170" y="144" font-size="10" fill="var(--svg-333333)">&amp; → %26</text><text x="20" y="162" font-size="10" fill="var(--svg-333333)"># → %23</text><text x="170" y="162" font-size="10" fill="var(--svg-333333)">% → %25</text><text x="20" y="180" font-size="10" fill="var(--svg-333333)">+ → %2B</text><text x="170" y="180" font-size="10" fill="var(--svg-333333)">/ → %2F</text><text x="160" y="198" text-anchor="middle" font-size="9" fill="var(--svg-888888)">A-Z, a-z, 0-9, -_.~ are always safe (unencoded)</text></svg>',
      alt: 'URL encoding diagram showing how unsafe characters are percent-encoded',
      caption: 'URL encoding replaces unsafe characters with % followed by their two-digit hex code for safe URL transmission.',
    },
  },
};

export default urlEncodeConfig;
