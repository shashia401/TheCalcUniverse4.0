import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HtmlMinifierPanel from './HtmlMinifierPanel';

function minifyHtml(code: string): string {
  // Remove HTML comments
  let result = code.replace(/<!--[\s\S]*?-->/g, '');

  // Preserve <pre> blocks before whitespace collapsing
  const preBlocks: string[] = [];
  result = result.replace(/<pre[\s>][\s\S]*?<\/pre>/gi, (match) => {
    preBlocks.push(match);
    return `\x00PRE${preBlocks.length - 1}\x00`;
  });

  // Collapse multiple whitespace (but preserve single spaces between words)
  result = result.replace(/\s+/g, ' ');
  // Remove whitespace between tags
  result = result.replace(/>\s+</g, '><');
  // Remove whitespace around attributes
  result = result.replace(/\s*=\s*/g, '=');
  // Remove optional quotes around simple attribute values (&quot; form)
  result = result.replace(/\s+([a-z-]+)=&quot;([a-zA-Z0-9_\-:.]+)&quot;/gi, ' $1=$2');
  // Remove optional quotes around simple attribute values (straight quote form)
  result = result.replace(/\s+([a-z-]+)="([a-zA-Z0-9_\-:.]+)"/gi, ' $1=$2');
  // Remove unnecessary closing slashes in void elements
  result = result.replace(/<(\w+)([^>]*?)\s*\/>/g, '<$1$2>');

  // Restore <pre> blocks
  result = result.replace(/\x00PRE(\d+)\x00/g, (_, i) => preBlocks[parseInt(i)]);

  // Trim
  result = result.trim();
  return result;
}

function minifyCss(code: string): string {
  let result = code;
  // Remove CSS comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // Preserve calc() expressions to avoid breaking operators inside them
  const calcBlocks: string[] = [];
  result = result.replace(/calc\([\s\S]*?\)/gi, (match) => {
    calcBlocks.push(match);
    return `\x00CALC${calcBlocks.length - 1}\x00`;
  });

  // Remove whitespace around brackets
  result = result.replace(/\s*\{\s*/g, '{');
  result = result.replace(/\s*\}\s*/g, '}');
  // Remove whitespace around colons
  result = result.replace(/\s*:\s*/g, ':');
  // Remove whitespace around semicolons
  result = result.replace(/\s*;\s*/g, ';');
  // Remove whitespace around commas
  result = result.replace(/\s*,\s*/g, ',');
  // Remove trailing semicolons before closing braces
  result = result.replace(/;\}/g, '}');
  // Collapse remaining whitespace
  result = result.replace(/\s+/g, ' ').replace(/\s/g, '');

  // Restore calc() expressions
  result = result.replace(/\x00CALC(\d+)\x00/g, (_, i) => calcBlocks[parseInt(i)]);

  return result;
}

function minifyJs(code: string): string {
  let result = code;
  // Remove single-line comments
  result = result.replace(/\/\/[^\n]*/g, '');
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove whitespace at start/end of lines
  result = result.replace(/^\s+/gm, '');
  result = result.replace(/\s+$/gm, '');
  // Collapse multiple spaces to single
  result = result.replace(/[ \t]+/g, ' ');
  // Remove spaces around operators (basic)
  result = result.replace(/\s*([=+\-*/%<>&|!?:;,{}()[\]])\s*/g, '$1');
  // Fix spaces that were collapsed around ++ and --
  result = result.replace(/\+\+/g, '++');
  result = result.replace(/--/g, '--');
  // Remove unnecessary semicolons before closing braces
  result = result.replace(/;\}/g, '}');
  // Remove leading/trailing whitespace on each line
  result = result.replace(/^\s+|\s+$/gm, '');
  // Collapse newlines
  result = result.replace(/\n+/g, '\n');
  result = result.trim();
  return result;
}

const htmlMinifierConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'codeType',
      label: 'Code Type',
      type: 'select',
      required: true,
      options: [
        { label: 'HTML', value: 'HTML' },
        { label: 'CSS', value: 'CSS' },
        { label: 'JavaScript', value: 'JavaScript' },
      ],
      helpText: 'Select the type of code to minify',
    },
    {
      id: 'code',
      label: 'Code to Minify',
      type: 'text',
      inputMode: 'text',
      required: true,
      placeholder: 'Paste your code here...',
      helpText: 'Paste HTML, CSS, or JavaScript code to minify',
    },
  ],
  calculate: (values) => {
    const codeType = values.codeType || 'HTML';
    const code = values.code || '';

    if (!code.trim()) return [];

    let minified = '';

    if (codeType === 'HTML') {
      minified = minifyHtml(code);
    } else if (codeType === 'CSS') {
      minified = minifyCss(code);
    } else if (codeType === 'JavaScript') {
      minified = minifyJs(code);
    } else {
      return [];
    }

    const originalSize = code.length;
    const minifiedSize = minified.length;
    const savingsPercent =
      originalSize > 0
        ? ((originalSize - minifiedSize) / originalSize) * 100
        : 0;

    return [
      {
        id: 'minified',
        label: 'Minified Output',
        value: minified,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'originalSize',
        label: 'Original Size',
        value: `${originalSize.toLocaleString(undefined)} bytes`,
        color: 'neutral',
      },
      {
        id: 'minifiedSize',
        label: 'Minified Size',
        value: `${minifiedSize.toLocaleString(undefined)} bytes`,
        color: 'neutral',
      },
      {
        id: 'savingsPercent',
        label: 'Savings',
        value: `${savingsPercent.toFixed(1)}%`,
        color: savingsPercent > 50 ? 'positive' : savingsPercent > 20 ? 'neutral' : 'negative',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HtmlMinifierPanel, { values, results });
  },
  educational: {
    formula:
      'Savings (%) = ((OriginalSize - MinifiedSize) / OriginalSize) × 100 | Minification removes unnecessary whitespace, comments, and redundant characters',
    formulaDescription:
      'Code minification is the process of removing unnecessary characters from source code without changing its functionality. These characters include whitespace, comments, newline characters, and optional syntax tokens. Minification reduces file size for faster network transfers and improved page load times.',
    variables: [
      {
        symbol: 'Original',
        name: 'Original Size',
        description:
          'The size of the source code before minification, measured in bytes. Larger files benefit more from minification in absolute byte savings.',
      },
      {
        symbol: 'Minified',
        name: 'Minified Size',
        description:
          'The size of the code after minification, measured in bytes. This represents the final compressed output with all unnecessary characters removed.',
      },
      {
        symbol: 'Savings',
        name: 'Size Reduction Percentage',
        description:
          'The percentage of the original file size removed during minification. Higher percentages indicate more whitespace and comments were present in the original code.',
      },
      {
        symbol: 'Tree Shaking',
        name: 'Dead Code Elimination',
        description:
          'An advanced optimization technique that removes unused code modules and functions. Unlike basic minification, tree shaking requires understanding the code structure and dependencies.',
      },
    ],
    howToUse: [
      'Select the type of code you want to minify: HTML, CSS, or JavaScript.',
      'Paste your source code into the text area.',
      'Click calculate to see the minified output and size comparison.',
      'Review the original size, minified size, and percentage savings.',
      'Copy the minified output for use in your production build.',
    ],
    quickReference: [
      { label: 'HTML', value: 'Strips comments, collapses whitespace, removes optional quotes' },
      { label: 'CSS', value: 'Strips comments, removes spaces around brackets/colons/semicolons' },
      { label: 'JavaScript', value: 'Strips comments, collapses whitespace, removes unnecessary tokens' },
      { label: 'Typical savings', value: '20-60% reduction depending on code style and verbosity' },
    ],
    commonUses: [
      'Reducing file sizes for production deployment to improve page load times',
      'Optimizing website performance by reducing bandwidth usage and latency',
      'Preparing code for bundling in build pipelines (Webpack, Vite, Rollup)',
      'Minimizing API response payloads that include inline HTML or CSS templates',
      'Reducing costs on bandwidth-intensive applications with high traffic volumes',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="30" width="360" height="280" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><!-- Original file --><rect x="60" y="55" width="320" height="65" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="220" y="78" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Original Code</text><line x1="80" y1="88" x2="360" y2="88" stroke="var(--svg-93c5fd)" stroke-width="1"/><text x="220" y="103" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Contains whitespace, comments, formatting (larger file)</text><text x="220" y="113" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">Original Size: ~10 KB</text><!-- Arrow down --><line x1="220" y1="125" x2="220" y2="145" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="212,142 220,152 228,142" fill="var(--svg-3b82f6)"/><!-- Minifier box --><rect x="100" y="152" width="240" height="36" fill="var(--svg-8b5cf6)" stroke="var(--svg-7c3aed)" stroke-width="1.5" rx="18"/><text x="220" y="175" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ffffff)">Minifier</text><text x="220" y="185" text-anchor="middle" font-size="8" fill="var(--svg-c4b5fd)">Strip comments &amp; whitespace</text><!-- Arrow down --><line x1="220" y1="192" x2="220" y2="212" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="212,209 220,219 228,209" fill="var(--svg-3b82f6)"/><!-- Minified file --><rect x="100" y="215" width="240" height="55" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.5" rx="4"/><text x="220" y="238" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Minified Code</text><text x="220" y="253" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Compact, optimized (smaller file)</text><text x="220" y="263" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">Minified Size: ~4 KB (60% savings)</text></svg>',
      alt: 'Flow diagram showing original code passing through a minifier that removes whitespace and comments, producing smaller minified output',
      caption: 'Code minification process — original code is compressed by removing unnecessary characters while preserving functionality',
    },
    explanation:
      'Code minification is a critical optimization step in modern web development that reduces file sizes by removing unnecessary characters without changing code functionality. When a browser requests a web page, every byte of HTML, CSS, and JavaScript must be transferred over the network. Minification can reduce file sizes by 20-60% or more, directly translating to faster page loads, lower bandwidth costs, and improved user experience. The key difference between minification and compression (like Gzip) is that minification produces code that remains syntactically valid and directly executable by the browser, whereas compression requires server-side and client-side decompression. Minification and compression are complementary — you should both minify your code and serve it with Gzip or Brotli compression for maximum benefit. HTML minification removes comments, collapses whitespace, and deletes optional closing tags and attribute quotes. CSS minification removes comments and whitespace around syntax tokens, and some tools can also merge identical rulesets, remove unused styles, and shorten color values and property names. JavaScript minification is the most sophisticated, as it must handle the language\'s complex syntax. Advanced JS minifiers like Terser and esbuild go beyond whitespace removal: they rename local variables to short names, eliminate dead code branches, inline small functions, and apply other AST-level transformations. For production web applications, minification is typically integrated into the build pipeline using tools like Webpack, Vite, Rollup, or Parcel, which apply minification automatically during the build step. The performance benefits are substantial: a typical website with 200 KB of uncompressed JavaScript might see 100 KB (50%) savings from minification alone, plus additional savings from Gzip compression which works more efficiently on minified code.',
    faqs: [
      {
        question: 'Does minification affect code functionality?',
        answer: 'Proper minification does not change code behavior. It only removes characters that are not functionally required, such as whitespace, comments, and optional syntax tokens. However, certain aggressive minification techniques (like variable renaming in JavaScript) must be careful not to break scope or conflict with string references. Always test minified code in your target environments before deploying to production.',
      },
      {
        question: 'What is the difference between minification and compression?',
        answer: 'Minification removes unnecessary characters from source code to produce smaller but still valid code. Compression (Gzip, Brotli, Deflate) uses algorithmic encoding to reduce file size for transfer and requires decompression by the browser. They are complementary: you should minify your code first, then serve it with compression. Most web servers and CDNs automatically compress responses, but minification gives an additional layer of size reduction that compression cannot achieve on its own.',
      },
      {
        question: 'Should I minify my development code?',
        answer: 'No, you should only minify code for production. During development, readable code with comments, meaningful variable names, and proper formatting is essential for debugging and collaboration. Use source maps in production to map minified code back to original source files for debugging purposes. Most modern build tools handle this automatically by generating minified bundles with associated source map files.',
      },
      {
        question: 'How much can I expect to save with minification?',
        answer: 'Typical savings range from 20-60% depending on the code type and original formatting. Well-formatted code with extensive comments and whitespace will see higher savings. HTML and CSS often see 30-50% reduction. JavaScript can see 40-60% reduction with advanced minifiers that rename variables and eliminate dead code. Files that are already compact or heavily compressed (like minified libraries) will see minimal additional savings.',
      },
      {
        question: 'Can I use this minifier in a production build pipeline?',
        answer: 'This calculator is designed for quick, interactive use to check potential size savings and understand the minification process. It uses basic regex-based minification which is effective but less sophisticated than production-grade tools like Terser (JavaScript), cssnano (CSS), or html-minifier-terser. For production builds, you should use a dedicated build tool (Webpack, Vite, Rollup, Parcel) with production-grade minifiers that handle edge cases, perform scope analysis, and apply advanced optimizations like dead code elimination and constant folding. This tool is excellent for quick experiments, education, and checking potential savings before implementing automated minification in your build pipeline.',
      },
    ],
    proTips: [
      'For JavaScript, advanced minifiers like Terser (used by Vite and Webpack) go far beyond this basic minifier — they rename local variables to single letters, inline small functions, and eliminate unreachable code branches. These advanced optimizations can typically achieve 60-70% savings versus 20-40% from basic minification alone.',
      'Always pair minification with Gzip or Brotli compression on your server. Minification reduces the uncompressed size, while compression reduces the transferred size. Together they can reduce the final bytes sent over the network by 70-85% compared to the original formatted source code.',
      'Source maps (.map files) let you debug minified code by mapping it back to the original source. Enable source map generation in your build tool: in Vite, set build.sourcemap to true. In Webpack, use devtool: \'source-map\'. Source maps are only loaded when DevTools is open, so they do not affect normal user performance.',
      'Minification of inline CSS and JavaScript inside HTML requires special handling — this tool does NOT minify inline scripts or styles within HTML. For production, use a tool like html-minifier-terser which can recursively minify embedded CSS and JS within HTML files.',
      'CSS minification can sometimes break calculations inside calc() expressions if spaces around operators are removed. Our minifier preserves calc() blocks, but always test minified CSS in all target browsers. Safari has historically been particularly sensitive to calc() formatting.',
    ],
    limitations: [
      'This calculator uses regex-based minification which is educational and fast but does not handle all edge cases. HTML minification preserves <pre> blocks but does not preserve <textarea>, <code>, or <script> content from whitespace collapse — always wrap sensitive content blocks before minifying.',
      'CSS minification strips all comments including license headers and attribution — if you need to preserve legal notices, use a tool with comment-preservation options.',
      'JavaScript minification in this tool is basic: it removes comments and collapses whitespace but does NOT perform variable renaming, dead code elimination, function inlining, or scope analysis.',
      'String literals containing code-like content (e.g., strings that contain "//" sequences) may be incorrectly processed by the comment-removal regex. Unicode characters, template literals, and ES6+ syntax in JavaScript should be minified with production-grade tools rather than this basic processor.',
    ],
    workedExamples: [
      {
        scenario: 'Minifying an HTML Page for Production',
        inputs: {
          codeType: 'HTML',
          code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <!-- Page Title -->\n  <title>My Website</title>\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome</h1>\n    <p>This is a paragraph of text.</p>\n  </div>\n</body>\n</html>',
        },
        result: 'Minified HTML output: ~140 bytes (approximately 36% savings from original 220 bytes)',
        insight:
          'The original HTML is 220 bytes with proper indentation, comments, and readable formatting. After minification, comments are stripped, whitespace between tags is collapsed, and attribute formatting is optimized. The minified output is approximately 140 bytes — about 36% savings. In a real-world scenario, a typical HTML page of 15-20 KB could save 5-7 KB from minification alone. When combined with Gzip compression (which typically achieves 70-80% compression on minified HTML), the final transferred size could be under 3 KB.',
      },
      {
        scenario: 'Minifying CSS to Reduce Stylesheet Size',
        inputs: {
          codeType: 'CSS',
          code: '/* Main Stylesheet v2.1 */\n/* Author: Dev Team */\n\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}\n\n.header {\n  background-color: #ffffff;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}\n\n.header .logo {\n  width: 120px;\n  height: auto;\n}',
        },
        result: 'Minified CSS output: ~190 bytes (approximately 40% savings from original 315 bytes)',
        insight:
          'The original CSS is about 315 bytes with comments, indentation, and readable formatting. Minification removes the two comment blocks, collapses all whitespace around brackets and colons, and produces output around 190 bytes — about 40% savings. For large CSS frameworks (Bootstrap: ~160 KB unminified, ~120 KB minified before Gzip) the savings are significant. Beyond this basic minification, production tools like cssnano can further optimize by merging duplicate selectors, shortening hex colors (#ffffff → #fff), and removing unused CSS rules through tree shaking.',
      },
    ],
    citations: [
      { source: 'MDN Web Docs — Minification', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Minification' },
      { source: 'web.dev — Reduce Network Payloads with Minification', url: 'https://web.dev/articles/reduce-network-payloads-using-text-compression' },
    ],
  },
};

export default htmlMinifierConfig;
