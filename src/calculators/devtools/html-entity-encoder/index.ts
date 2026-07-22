import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HtmlEntityPanel from './HtmlEntityPanel';

const htmlEntityMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&iexcl;': '¡',
  '&cent;': '¢',
  '&pound;': '£',
  '&curren;': '¤',
  '&yen;': '¥',
  '&brvbar;': '¦',
  '&sect;': '§',
  '&uml;': '¨',
  '&copy;': '©',
  '&ordf;': 'ª',
  '&laquo;': '«',
  '&not;': '¬',
  '&shy;': '­',
  '&reg;': '®',
  '&macr;': '¯',
  '&deg;': '°',
  '&plusmn;': '±',
  '&sup2;': '²',
  '&sup3;': '³',
  '&acute;': '´',
  '&micro;': 'µ',
  '&para;': '¶',
  '&middot;': '·',
  '&cedil;': '¸',
  '&sup1;': '¹',
  '&ordm;': 'º',
  '&raquo;': '»',
  '&frac14;': '¼',
  '&frac12;': '½',
  '&frac34;': '¾',
  '&iquest;': '¿',
  '&times;': '×',
  '&divide;': '÷',
  '&euro;': '€',
};

// Build reverse map for encoding
const charToEntityMap: Record<string, string> = {};
for (const [entity, char] of Object.entries(htmlEntityMap)) {
  charToEntityMap[char] = entity;
}
// Override with the 5 essential HTML entities for encoding
charToEntityMap['&'] = '&amp;';
charToEntityMap['<'] = '&lt;';
charToEntityMap['>'] = '&gt;';
charToEntityMap['"'] = '&quot;';
charToEntityMap["'"] = '&#39;';

function encodeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => charToEntityMap[char] || char);
}

function decodeHtml(input: string): string {
  // Decode named entities first
  let result = input;
  // Sort by length (longest first) to avoid partial replacements
  const sortedEntities = Object.entries(htmlEntityMap).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [entity, char] of sortedEntities) {
    result = result.replace(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), char);
  }

  // Decode decimal entities &#123;
  result = result.replace(/&#(\d+);/g, (_match, dec) => {
    const codePoint = parseInt(dec, 10);
    return isNaN(codePoint) ? _match : String.fromCodePoint(codePoint);
  });

  // Decode hex entities &#x1F;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
    const codePoint = parseInt(hex, 16);
    return isNaN(codePoint) ? _match : String.fromCodePoint(codePoint);
  });

  return result;
}

const htmlEntityEncoderConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      helpText: 'Choose to encode special chars or decode entities back',
      options: [
        { label: 'Encode to Entities', value: 'encode' },
        { label: 'Decode to Text', value: 'decode' },
      ],
    },
    {
      id: 'input',
      label: 'Input Text',
      type: 'text',
      required: true,
      placeholder: 'Enter text to encode or decode...',
      helpText: 'Text containing special characters or HTML entities',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'encode';
    const input = values.input || '';

    if (!input.trim()) return [];

    let output: string;
    if (mode === 'encode') {
      output = encodeHtml(input);
    } else {
      output = decodeHtml(input);
    }

    return [
      {
        id: 'output',
        label: mode === 'encode' ? 'Encoded Output' : 'Decoded Output',
        value: output,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'charCount',
        label: 'Output Character Count',
        value: String(output.length),
        color: 'neutral',
      },
      {
        id: 'originalCharCount',
        label: 'Input Character Count',
        value: String(input.length),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HtmlEntityPanel, { values, results });
  },
  educational: {
    formula:
      'Encode: & &amp; | < &lt; | > &gt; | " &quot; | \' &#39;\nDecode: Named (&amp; → &), Decimal (&#38; → &), Hex (&#x26; → &)',
    diagram: {
      svg: '<svg viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="10" y="10" width="480" height="310" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="8"/><text x="250" y="35" text-anchor="middle" font-size="14" fill="var(--svg-1e293b)" font-weight="bold">HTML Entity Encoding / Decoding</text><rect x="30" y="55" width="440" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="250" y="75" text-anchor="middle" font-size="12" fill="var(--svg-1e293b)" font-weight="bold">Raw Text</text><text x="250" y="93" text-anchor="middle" font-size="13" fill="var(--svg-2563eb)">&lt;div class="main"&gt;Hello &amp; Welcome&lt;/div&gt;</text><line x1="250" y1="108" x2="250" y2="125" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><polygon points="250,128 244,118 256,118" fill="var(--svg-3b82f6)"/><text x="140" y="142" font-size="11" fill="var(--svg-2563eb)" font-weight="bold">Encode →</text><text x="360" y="142" font-size="11" fill="var(--svg-22c55e)" font-weight="bold">← Decode</text><rect x="30" y="155" width="440" height="50" fill="var(--svg-d1fae5)" stroke="var(--svg-22c55e)" stroke-width="1.5" rx="6"/><text x="250" y="175" text-anchor="middle" font-size="12" fill="var(--svg-1e293b)" font-weight="bold">HTML Entities</text><text x="250" y="193" text-anchor="middle" font-size="13" fill="var(--svg-22c55e)">&amp;lt;div class=&amp;quot;main&amp;quot;&amp;gt;Hello &amp;amp; Welcome&amp;lt;/div&amp;gt;</text><line x1="250" y1="208" x2="250" y2="225" stroke="var(--svg-22c55e)" stroke-width="1.5"/><polygon points="250,228 244,218 256,218" fill="var(--svg-22c55e)"/><text x="250" y="250" text-anchor="middle" font-size="12" fill="var(--svg-1e293b)" font-weight="bold">Character Mapping</text><rect x="60" y="260" width="90" height="24" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="3"/><text x="105" y="276" text-anchor="middle" font-size="11" fill="var(--svg-1e293b)">&amp;</text><text x="175" y="276" text-anchor="middle" font-size="13" fill="var(--svg-94a3b8)">⇄</text><rect x="195" y="260" width="100" height="24" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="3"/><text x="245" y="276" text-anchor="middle" font-size="11" fill="var(--svg-1e293b)">&amp;amp;</text><text x="315" y="276" text-anchor="middle" font-size="13" fill="var(--svg-94a3b8)">⇄</text><rect x="335" y="260" width="110" height="24" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="3"/><text x="390" y="276" text-anchor="middle" font-size="11" fill="var(--svg-1e293b)">&amp;#38;</text><text x="175" y="300" text-anchor="middle" font-size="13" fill="var(--svg-94a3b8)">⇄</text><rect x="195" y="293" width="100" height="24" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="3"/><text x="245" y="309" text-anchor="middle" font-size="11" fill="var(--svg-1e293b)">&amp;#x26;</text><text x="315" y="300" text-anchor="middle" font-size="13" fill="var(--svg-94a3b8)">⇄</text></svg>',
      alt: 'Diagram showing HTML entity encoding and decoding with raw text on top, HTML entities on bottom, and arrow indicating bidirectional conversion',
      caption: 'HTML entity encoding converts special characters to entity references; decoding reverses the process',
    },
    formulaDescription:
      'HTML entity encoding converts special characters (like <, >, &, ", \') into their corresponding HTML entity references so they display correctly in web pages without being interpreted as markup. Decoding reverses this process, converting entity references back to their original characters. Three formats are supported: named entities (&amp;), decimal numeric entities (&#38;), and hexadecimal entities (&#x26;).',
    variables: [
      {
        symbol: '&amp;',
        name: 'Named Entity',
        description: 'A mnemonic name for a character preceded by an ampersand and followed by a semicolon. Examples: &amp; for &, &lt; for <, &gt; for >.',
      },
      {
        symbol: '&#38;',
        name: 'Decimal Numeric Entity',
        description: 'A character reference using its Unicode code point in decimal format. The format is &# followed by the decimal number and a semicolon.',
      },
      {
        symbol: '&#x26;',
        name: 'Hexadecimal Numeric Entity',
        description: 'A character reference using its Unicode code point in hexadecimal format. The format is &#x followed by the hex number and a semicolon.',
      },
      {
        symbol: 'HTML Context',
        name: 'HTML Parsing Context',
        description: 'The HTML spec defines where entity parsing applies. Entities are resolved in HTML content but not inside <script> or <style> blocks in modern browsers, though they should still be encoded for safety.',
      },
    ],
    howToUse: [
      'Select the mode: "Encode to Entities" to convert special characters, or "Decode to Text" to convert entities back.',
      'Enter or paste your input text in the text area — either raw text with special characters or text containing HTML entities.',
      'View the encoded or decoded output result, along with character counts for both input and output.',
    ],
    quickReference: [
      { label: '& → &amp;amp;', value: 'Ampersand — must always be encoded in HTML to avoid ambiguous entity parsing' },
      { label: '< → &amp;lt;', value: 'Less-than — must be encoded to prevent being interpreted as an HTML tag opening' },
      { label: '> → &amp;gt;', value: 'Greater-than — encoded for symmetry with less-than, though not strictly required' },
      { label: '" → &amp;quot;', value: 'Double quote — must be encoded inside attribute values delimited by double quotes' },
    ],
    commonUses: [
      'Displaying code snippets on blogs and documentation sites without breaking the page layout',
      'Sanitizing user-generated content before rendering it in web applications to prevent XSS attacks',
      'Encoding special characters in HTML email templates to ensure consistent rendering across email clients',
      'Processing scraped web content that contains encoded characters back into readable text',
      'Preparing data for XML documents where certain characters have special meaning and must be escaped',
    ],
    explanation:
      'HTML entity encoding is a fundamental security and display technique in web development. When a web browser encounters HTML markup, it parses angle brackets (< >) as tag delimiters, ampersands (&) as entity starters, and quotes as attribute delimiters. If user-generated content or dynamic data containing these characters is inserted directly into HTML without encoding, it can break page rendering or introduce cross-site scripting (XSS) vulnerabilities. The encoding process converts these five essential characters into their corresponding entity references: & becomes &amp;, < becomes &lt;, > becomes &gt;, " becomes &quot;, and \' becomes &#39; (or &apos; in XHTML). The decoding process is more complex because there are three formats in widespread use. Named entities like &amp;, &lt;, and &copy; are defined by the HTML specification and provide human-readable mnemonics. Decimal numeric entities like &#38; reference characters by their Unicode code point in base 10. Hexadecimal numeric entities like &#x26; use base 16, which can be more convenient when referring to code points from Unicode charts. The HTML5 specification defines 2231 named character entities covering a wide range of symbols, punctuation, and international characters. When decoding, the entity parser must handle all three formats, plus edge cases like missing semicolons (which are tolerated in certain contexts per the HTML spec), invalid code points, and entities that decode to non-printable characters. This tool handles the full range of named entities and properly processes both decimal and hexadecimal numeric entities for comprehensive encoding and decoding support.',
    faqs: [
      {
        question: 'What characters should always be HTML-encoded?',
        answer: 'The five essential characters are: & (ampersand), < (less-than), > (greater-than), " (double quote), and \' (single quote/ apostrophe). The ampersand and less-than are the most critical because they directly affect how the browser parses HTML markup. Everything else is optional but recommended for special or non-ASCII characters.',
      },
      {
        question: 'Is HTML encoding the same as URL encoding?',
        answer: 'No. HTML encoding uses entities like &amp;lt; to display characters safely in HTML documents. URL encoding (also called percent-encoding) uses %20 for spaces and similar patterns to make data safe for URLs. They serve different purposes and are not interchangeable. For example, a space is &amp;nbsp; in HTML but %20 in a URL.',
      },
      {
        question: 'Does encoding prevent XSS attacks?',
        answer: 'HTML entity encoding is a critical defense against XSS but is not sufficient on its own. It prevents injection when inserting data into HTML body content but does not protect when inserting into <script> tags, event handlers (onclick), or CSS. A comprehensive XSS prevention strategy uses context-specific encoding (HTML, JavaScript, CSS, URL) combined with content security policies (CSP).',
      },
      {
        question: 'What is the difference between &#39; and &apos;?',
        answer: 'Both represent the apostrophe/single quote character (\'). &apos; is defined in the XHTML and XML specifications but is NOT a valid HTML4 entity. &#39; (the decimal numeric entity) works in all versions of HTML. For maximum compatibility, &#39; is preferred over &apos; when encoding apostrophes in HTML documents.',
      },
    ],
    citations: [
      { title: 'HTML Living Standard — Character References', url: 'https://html.spec.whatwg.org/multipage/named-characters.html' },
      { title: 'Cross-Site Scripting (XSS) Prevention on OWASP', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
    ],
  },
};

export default htmlEntityEncoderConfig;
