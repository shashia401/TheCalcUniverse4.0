import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import Base64Panel from './base64Panel';

export function calculate(
  values: Record<string, unknown>
): CalculatorResult[] {
  const inputText = String(values.inputText ?? '');
  const mode = String(values.mode || 'Encode');

  if (!inputText.trim()) {
    return [];
  }

  const originalChars = inputText.length;

  if (mode === 'Encode') {
    const encoded = btoa(inputText);
    return [
      { id: 'Output', label: 'Output', value: encoded },
      { id: 'Original Character Count', label: 'Original Character Count', value: String(originalChars) },
      { id: 'Encoded Character Count', label: 'Encoded Character Count', value: String(encoded.length) },
      { id: 'Mode', label: 'Mode', value: 'Encode' },
    ];
  }

  if (mode === 'Decode') {
    try {
      const decoded = atob(inputText);
      return [
        { id: 'Output', label: 'Output', value: decoded },
        { id: 'Original Character Count', label: 'Original Character Count', value: String(originalChars) },
        { id: 'Decoded Character Count', label: 'Decoded Character Count', value: String(decoded.length) },
        { id: 'Mode', label: 'Mode', value: 'Decode' },
      ];
    } catch {
      return [
        { id: 'Output', label: 'Output', value: '[Invalid Base64]' },
        { id: 'Original Character Count', label: 'Original Character Count', value: String(originalChars) },
        { id: 'Mode', label: 'Mode', value: 'Decode' },
      ];
    }
  }

  return [];
}

const base64Config: CalculatorConfig = {
  inputs: [
    { id: 'inputText', label: 'Input Text', type: 'text', placeholder: 'Enter text to encode or decode', required: true, helpText: 'Enter text to encode or Base64 string to decode' },
    {
      id: 'mode', label: 'Mode', type: 'select', required: true,
      options: [
        { value: 'Encode', label: 'Encode (Text → Base64)' },
        { value: 'Decode', label: 'Decode (Base64 → Text)' },
      ],
      helpText: 'Choose whether to encode or decode the input',
    },
  ],

  calculate: (values): CalculatorResult[] => calculate(values),

  extraPanel: (values, results) => createElement(Base64Panel, { values, results }),

  educational: {
    formula: 'Base64(text) = 64-char alphabet encoding',
    formulaDescription:
      'Base64 encodes binary and text data into a safe 64-character alphabet (A-Z, a-z, 0-9, +, /) for transmission over text-based protocols that might misinterpret binary data. It works by grouping input bytes into 24-bit chunks (3 bytes), splitting each chunk into four 6-bit values, and mapping each 6-bit value to one of 64 printable ASCII characters. If the input length is not a multiple of 3 bytes, = padding is added to make the output a multiple of 4 characters.',
    variables: [
      { symbol: 'input', name: 'Input Text', description: 'The text to encode or the Base64 string to decode.' },
      { symbol: 'encoded', name: 'Encoded Output', description: 'Base64-encoded string (about 33% larger than input).' },
      { symbol: 'decoded', name: 'Decoded Output', description: 'Original text recovered from Base64 by reversing the encoding process.' },
    ],
    howToUse: [
      'Select Encode mode to convert text to Base64, or Decode mode to convert Base64 back to plain text.',
      'Enter your input text in the text area — supports plain text, numbers, and special characters.',
      'The encoded or decoded output appears instantly as you type or paste.',
      'Use the Copy button to copy the result to your clipboard for use in code, emails, or configuration files.',
      'Character counts show the size difference: the encoded output is roughly 4/3 the size of the original due to Base64 overhead.',
    ],
    explanation:
      'Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format using 64 safe characters (A-Z, a-z, 0-9, +, /), with = used for padding. It is commonly used for embedding images directly in HTML or CSS as data URIs (data:image/png;base64,...), encoding email attachments via MIME, storing binary data in JSON or XML, and transmitting credentials in HTTP Basic Authentication headers. Each 3 bytes of input becomes 4 Base64 characters, adding approximately 33% overhead. Because Base64 uses only safe printable ASCII characters, it is immune to character encoding issues and transmission corruption from control characters that binary data might contain. A common variant, Base64URL, replaces + and / with - and _ and omits padding, making it safe for use in URLs and filenames.',
    faqs: [
      {
        question: 'Why is Base64 output longer than the input?',
        answer: 'Base64 encodes 3 bytes of input (24 bits) into 4 ASCII output characters. Since each output character represents only 6 bits of data (64 possible values = 2^6), 4 characters × 6 bits = 24 bits = 3 bytes. The output is always 4/3 the size of the input — a 33% increase. For example, "Man" (3 bytes) encodes to "TWFu" (4 characters). If the input is only 1 or 2 bytes, padding increases the overhead further.',
      },
      {
        question: 'What is the = padding at the end of Base64?',
        answer: 'The = character is padding added when the input length is not a multiple of 3 bytes. One = means 1 byte of padding was needed (2 input bytes became 3 Base64 characters + 1 =), and two == means 2 bytes of padding were needed (1 input byte became 2 Base64 characters + 2 ==). The padding ensures the output length is always a multiple of 4, which simplifies decoding algorithms.',
      },
      {
        question: 'When would I use Base64 encoding in practice?',
        answer: 'Common use cases include: embedding small images directly in HTML as data URIs to reduce HTTP requests, encoding email attachments in MIME format (the "Content-Transfer-Encoding: base64" header), storing binary data in JSON web tokens (JWTs), encoding HTTP Basic Authentication credentials, and representing cryptographic keys in PEM format (the base64-encoded content between ---BEGIN CERTIFICATE--- markers).',
      },
      {
        question: 'Is Base64 encryption?',
        answer: 'No, absolutely not. Base64 is an encoding scheme, not encryption. Anyone can decode Base64 back to the original data using any of thousands of freely available online tools. Base64 should never be used to protect sensitive information — it only ensures safe transmission through text-based channels. For security, use proper encryption algorithms like AES or RSA.',
      },
      {
        question: 'What is the difference between Base64 and Base64URL?',
        answer: 'Standard Base64 uses + and / characters, which have special meaning in URLs (a + becomes a space in query strings, and / is a path separator). Base64URL is a variant that replaces + with - and / with _, and omits the = padding entirely. This makes Base64URL-encoded strings safe in URLs, query parameters, and filenames without additional percent-encoding, and it is commonly used in JSON Web Tokens (JWTs).',
      },
    ],
    citations: [
      { source: 'RFC 4648 - The Base16, Base32, and Base64 Data Encodings', url: 'https://datatracker.ietf.org/doc/html/rfc4648' },
      { source: 'Wikipedia - Base64', url: 'https://en.wikipedia.org/wiki/Base64' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Base64 Encoding Flow</text><rect x="20" y="35" width="80" height="36" rx="6" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="60" y="50" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Input</text><text x="60" y="65" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">"Man"</text><line x1="100" y1="48" x2="125" y2="48" stroke="var(--svg-333333)" stroke-width="2"/><polygon points="125,43 135,48 125,53" fill="var(--svg-333333)"/><rect x="135" y="28" width="70" height="50" rx="6" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="170" y="44" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">3 bytes</text><text x="170" y="58" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">24 bits</text><text x="170" y="72" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">4 × 6-bit</text><line x1="205" y1="48" x2="230" y2="48" stroke="var(--svg-333333)" stroke-width="2"/><polygon points="230,43 240,48 230,53" fill="var(--svg-333333)"/><rect x="240" y="35" width="70" height="36" rx="6" fill="var(--svg-ef4444)" opacity="0.8"/><text x="275" y="50" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Output</text><text x="275" y="65" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">"TWFu"</text><rect x="15" y="90" width="290" height="100" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="110" text-anchor="middle" font-size="10" fill="var(--svg-555555)" font-weight="bold">Alphabet: A–Z, a–z, 0–9, +, /</text><text x="160" y="130" text-anchor="middle" font-size="10" fill="var(--svg-555555)">= padding when input not multiple of 3 bytes</text><line x1="20" y1="140" x2="300" y2="140" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="158" font-size="10" fill="var(--svg-333333)">Encoding size: +33% overhead</text><text x="310" y="158" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)">4/3 × input</text><line x1="20" y1="165" x2="300" y2="165" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="183" font-size="10" fill="var(--svg-ef4444)">Not encryption! Anyone can decode Base64.</text></svg>',
      alt: 'Base64 encoding flow showing 3 input bytes becoming 4 Base64 characters',
      caption: 'Base64 encodes 3 bytes into 4 ASCII characters using a 64-character alphabet, adding ~33% overhead.',
    },
  },
};

export default base64Config;
