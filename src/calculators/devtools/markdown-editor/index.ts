import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MarkdownPanel from './MarkdownPanel';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '';
  }
  return trimmed;
}

function parseInlineCode(text: string): string {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function parseInlineFormatting(text: string): string {
  let result = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match: string, alt: string, url: string) =>
      `<img src="${sanitizeUrl(url)}" alt="${alt}" style="max-width:100%" />`
  );
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match: string, text: string, url: string) =>
      `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`
  );
  result = parseInlineCode(result);
  return result;
}

function parseMarkdown(markdown: string): string {
  if (!markdown || !markdown.trim()) return '';

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];

  let inCodeBlock = false;
  let codeBlockContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        htmlParts.push(
          `<pre><code>${escapeHtml(codeBlockContent.trimEnd())}</code></pre>`
        );
        codeBlockContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    const trimmed = line.trim();

    if (/^-{3,}$/.test(trimmed)) {
      htmlParts.push('<hr />');
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const content = parseInlineFormatting(escapeHtml(trimmed.slice(2)));
      htmlParts.push(`<blockquote>${content}</blockquote>`);
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^#{1,6}/)![0].length;
      const content = parseInlineFormatting(
        escapeHtml(trimmed.slice(level).trim())
      );
      htmlParts.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = parseInlineFormatting(
        escapeHtml(trimmed.replace(/^[-*+]\s+/, ''))
      );
      htmlParts.push(`<li>${content}</li>`);
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = parseInlineFormatting(
        escapeHtml(trimmed.replace(/^\d+\.\s+/, ''))
      );
      htmlParts.push(`<li style="list-style-type:decimal">${content}</li>`);
      continue;
    }

    if (trimmed === '') {
      htmlParts.push('__PARAGRAPH_BREAK__');
      continue;
    }

    const content = parseInlineFormatting(escapeHtml(trimmed));
    htmlParts.push(`<p>${content}</p>`);
  }

  if (inCodeBlock) {
    htmlParts.push(
      `<pre><code>${escapeHtml(codeBlockContent.trimEnd())}</code></pre>`
    );
  }

  const wrappedHtml = htmlParts
    .join('\n')
    .replace(/(<li[^>]*>.*?<\/li>(\n<li[^>]*>.*?<\/li>)*)/g, (match) => {
      if (match.includes('style="list-style-type:decimal"')) {
        const cleaned = match.replace(
          /<li style="list-style-type:decimal">/g,
          '<li>'
        );
        return `<ol>\n${cleaned}\n</ol>`;
      }
      return `<ul>\n${match}\n</ul>`;
    })
    .replace(/__PARAGRAPH_BREAK__/g, '');

  return wrappedHtml;
}

const markdownConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'markdown',
      label: 'Markdown Input',
      type: 'text',
      defaultValue: '# Hello World\n\nThis is **bold** and *italic* text with a [link](https://example.com).\n\n- List item 1\n- List item 2\n\n`inline code` example.',
      placeholder: 'Write markdown here...',
      helpText: 'Enter markdown text to see the rendered HTML preview',
    },
    {
      id: 'outputFormat',
      label: 'Output Format',
      type: 'select',
      defaultValue: 'Preview',
      options: [
        { label: 'Preview', value: 'Preview' },
        { label: 'HTML Source', value: 'HTML Source' },
      ],
      helpText: 'Choose whether to show the rendered preview or the HTML source code',
    },
    {
      id: 'lineNumbers',
      label: 'Show Line Numbers',
      type: 'select',
      defaultValue: 'no',
      helpText: 'Toggle line numbers in the preview panel for easier reference',
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
      showWhen: (values) => (values.markdown || '').trim().length > 0,
    },
  ],
  calculate: (values) => {
    const markdown = values.markdown || '';
    const outputFormat = values.outputFormat || 'Preview';

    if (!markdown.trim()) return [];

    const html = parseMarkdown(markdown);
    const lineCount = markdown.split('\n').length;
    if (isNaN(lineCount)) return [];

    const results = [];

    if (outputFormat === 'HTML Source') {
      results.push({
        id: 'html',
        label: 'HTML Output',
        value: html,
        highlight: true,
        color: 'positive' as const,
      });
    }

    results.push({
      id: 'lineCount',
      label: 'Line Count',
      value: lineCount.toLocaleString(),
      color: 'neutral' as const,
    });

    results.push({
      id: '_markdownData',
      label: '',
      value: JSON.stringify({ html, markdown }),
      color: 'neutral' as const,
    });

    return results;
  },
  extraPanel: (values, results) => {
    const hasContent = values.markdown && values.markdown.trim().length > 0;
    if (!hasContent || !results.length) return null;
    return createElement(MarkdownPanel, { values, results });
  },
  educational: {
    formula:
      'Markdown → HTML: headings (# → h1-h6), bold (** → strong), italic (* → em), links ([text](url) → a), code (`code` → code), lists (-/1. → ul/ol)',
    formulaDescription:
      'Markdown is a lightweight markup language created by John Gruber in 2004 that allows you to write formatted text using a plain-text syntax. It converts to structurally valid HTML and is widely used for documentation, readme files, forums, and static site generators.',
    variables: [
      {
        symbol: '# ## ###',
        name: 'Headings (h1-h6)',
        description:
          'One to six hash symbols followed by a space create heading levels h1 through h6. Each level represents a different section hierarchy.',
      },
      {
        symbol: '**text**',
        name: 'Bold Formatting',
        description:
          'Double asterisks around text render as <strong> HTML tags, producing bold text. Use for strong emphasis on important content.',
      },
      {
        symbol: '[text](url)',
        name: 'Hyperlinks',
        description:
          'Square brackets around link text followed by parentheses containing the URL render as anchor (<a>) tags with the specified href attribute.',
      },
      {
        symbol: '```code```',
        name: 'Code Blocks',
        description:
          'Triple backticks create fenced code blocks rendered as <pre><code> elements. Optionally specify a language after the opening backticks for syntax highlighting.',
      },
      {
        symbol: '- / 1.',
        name: 'Lists',
        description:
          'Hyphens create unordered (<ul>) lists while numbers followed by periods create ordered (<ol>) lists. Nested lists use indentation.',
      },
    ],
    howToUse: [
      'Type or paste markdown text into the input field at the top of the page. The preview will update automatically as you type.',
      'Use markdown syntax: # heading, **bold**, *italic*, [link](url), `code`, - list item, > blockquote, and ``` for code blocks.',
      'Switch between "Preview" and "HTML Source" output formats using the dropdown menu to see either the rendered output or the raw HTML.',
      'In Preview mode, see the rendered HTML with headings, formatted text, links, images, lists, blockquotes, and code blocks displayed as they would appear in a browser.',
      'Copy the generated HTML from the HTML Source view or use the live preview to check your formatting before pasting into your documentation or content system.',
    ],
    quickReference: [
      { label: '# Heading 1', value: '<h1>Heading 1</h1>' },
      { label: '**bold**', value: '<strong>bold</strong>' },
      { label: '`code`', value: '<code>code</code>' },
      { label: '[Link](url)', value: '<a href="url">Link</a>' },
    ],
    commonUses: [
      'Writing README files for GitHub, GitLab, and Bitbucket repositories with formatted documentation.',
      'Creating documentation for software projects, API references, and developer guides.',
      'Writing forum posts and comments on platforms like Reddit, Stack Overflow, and Discourse.',
      'Authoring content for static site generators like Jekyll, Hugo, Gatsby, and Next.js.',
      'Formatting text in note-taking apps like Obsidian, Notion, Bear, and Joplin.',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="20" y="30" width="185" height="280" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="6"/><text x="30" y="52" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Raw Markdown</text><text x="30" y="75" font-size="11" fill="var(--svg-3b82f6)"># Hello World</text><text x="30" y="95" font-size="11" fill="var(--svg-64748b)">This has **bold** and</text><text x="30" y="112" font-size="11" fill="var(--svg-64748b)">*italic* text.</text><text x="30" y="135" font-size="11" fill="var(--svg-3b82f6)">- List item 1</text><text x="30" y="152" font-size="11" fill="var(--svg-3b82f6)">- List item 2</text><text x="30" y="175" font-size="11" fill="var(--svg-64748b)">A [link](url) here.</text><line x1="30" y1="195" x2="190" y2="195" stroke="var(--svg-94a3b8)" stroke-width="1"/><text x="30" y="215" font-size="11" fill="var(--svg-64748b)">`code` inline.</text><line x1="30" y1="245" x2="190" y2="245" stroke="var(--svg-d1d5db)" stroke-width="1" stroke-dasharray="4,3"/><text x="110" y="270" text-anchor="middle" font-size="10" fill="var(--svg-94a3b8)">→ Parser</text><line x1="205" y1="170" x2="235" y2="170" stroke="var(--svg-3b82f6)" stroke-width="2" marker-end="url(#arrow)"/><rect x="235" y="30" width="185" height="280" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="6"/><text x="245" y="52" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Rendered HTML</text><text x="245" y="75" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">Hello World</text><text x="245" y="95" font-size="11" fill="var(--svg-64748b)">This has <tspan font-weight="bold">bold</tspan> and</text><text x="245" y="112" font-size="11" fill="font-style:italic">italic</text><text x="245" y="135" font-size="11" fill="var(--svg-64748b)">• List item 1</text><text x="245" y="152" font-size="11" fill="var(--svg-64748b)">• List item 2</text><text x="245" y="175" font-size="11" fill="var(--svg-3b82f6)">link</text><text x="245" y="195" font-size="11" fill="var(--svg-64748b)">code inline.</text><defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--svg-3b82f6)"/></marker></defs></svg>',
      alt: 'Side-by-side comparison of raw markdown text and its rendered HTML output with headings, bold, italic, lists, links, and code formatting',
      caption: 'Markdown source (left) is parsed into rendered HTML (right) through the markdown processor',
    },
    explanation:
      `Markdown is a lightweight markup language with plain-text formatting syntax, created by John Gruber in 2004 with significant contributions from Aaron Swartz. The primary design goal was to make it possible to write formatted text using a simple, readable syntax that could be converted to HTML without requiring the user to know HTML tags. Markdown has since become one of the most widely used markup languages in the world, particularly in the software development community. It is the default formatting language on platforms like GitHub, GitLab, Stack Overflow, Reddit, and many others. The philosophy behind Markdown is that the raw text should be readable and publishable as-is, without looking like it has been marked up with formatting instructions. This means that Markdown syntax is intentionally minimal compared to HTML or other markup languages. For example, a heading is indicated by hash symbols (#) rather than angle-bracket tags. While the original Markdown specification by Gruber defined the core syntax, several extensions have emerged over time to add features like tables, footnotes, task lists, strikethrough text, and automatic URL linking. The most notable of these is CommonMark, a standardized specification that resolves ambiguities in the original Markdown. GitHub Flavored Markdown (GFM) builds on CommonMark and adds features specific to GitHub's platform, such as task lists, emoji shortcuts, and table alignment. Markdown is supported by virtually every static site generator, content management system, and documentation tool in use today, making it an essential skill for developers, technical writers, and content creators.`,
    faqs: [
      {
        question: 'Who created Markdown and when?',
        answer: 'Markdown was created by John Gruber in 2004, in collaboration with Aaron Swartz. Gruber wanted a formatting syntax that was easy to write and easy to read in its raw form, without looking cluttered. The original specification was published on Gruber\'s website, Daring Fireball, and included a Perl-based reference implementation for converting Markdown to HTML.',
      },
      {
        question: 'What is the difference between Markdown and CommonMark?',
        answer: 'Original Markdown had several ambiguities and inconsistencies in its specification, leading to different implementations producing different HTML from the same input. CommonMark is a standardized, unambiguous specification for Markdown developed by a community of Markdown implementers and users. It defines exactly how Markdown should be parsed, eliminating the inconsistencies between implementations. Most modern Markdown parsers support CommonMark.',
      },
      {
        question: 'Can I use HTML directly inside Markdown?',
        answer: 'Yes, you can embed raw HTML directly inside Markdown. Any HTML tags will be passed through to the output unchanged. This is useful for features not supported by Markdown syntax, such as tables, div containers, or custom styling. However, the block-level HTML elements must be separated from surrounding content by blank lines.',
      },
      {
        question: 'Does this editor support GitHub Flavored Markdown (GFM)?',
        answer: 'This editor supports the core Markdown syntax including headings, bold, italic, links, images, code blocks, inline code, lists, blockquotes, and horizontal rules. Full GFM support (tables, task lists, strikethrough, emoji) may not be included, but the basic syntax works for most documentation needs.',
      },
      {
        question: 'How do I create a table in Markdown?',
        answer: 'Tables use pipes (|) to separate columns and hyphens (-) to define the header row. Example: | Name | Age | City |\n|------|-----|------|\n| Alice | 30 | NYC |\n| Bob | 25 | LA |. Alignment is controlled by colons in the separator row: :--- for left, :---: for center, ---: for right.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A developer is writing a README.md for a new open-source project on GitHub. They need a heading, description paragraph, a feature list, and a code example showing installation instructions.',
        inputs: {
          'Markdown Input': '# MyProject\n\nA lightweight utility library for data processing.\n\n## Features\n\n- Fast parsing with zero dependencies\n- Streaming support for large files\n- TypeScript definitions included\n\n## Install\n\n`npm install my-project`',
          'Output Format': 'Preview',
        },
        result: 'Rendered HTML with h1 heading, description paragraph, h2 features heading, unordered list with 3 items, h2 install heading, and inline code block (6 lines of markdown)',
        insight: 'This markdown structure follows the standard README convention: project name as h1, one-line description, feature list using bullet points, and installation instructions with inline code. The inline code format (`npm install my-project`) ensures the command is rendered in a monospace font for easy copying.',
      },
      {
        scenario: 'A technical writer is documenting an API endpoint and needs to include a curl example, a JSON response block, and important notes in a blockquote for rate limiting information.',
        inputs: {
          'Markdown Input': '## GET /api/users\n\nFetches a paginated list of users.\n\n`GET https://api.example.com/v1/users?page=1&limit=20`\n\n```json\n{\n  "data": [\n    { "id": 1, "name": "Alice" },\n    { "id": 2, "name": "Bob" }\n  ],\n  "total": 42\n}\n```\n\n> **Rate Limit**: 100 requests per minute per API key. Exceeding this returns HTTP 429.',
          'Output Format': 'Preview',
        },
        result: 'Rendered HTML with h2 heading, description paragraph, inline code for endpoint URL, fenced code block with JSON content, and a blockquote for the rate limit warning (8 lines of markdown)',
        insight: 'API documentation combines multiple Markdown elements effectively. The inline code format makes the endpoint URL visually distinct. Fenced code blocks preserve JSON formatting exactly as written, including indentation. Blockquotes are excellent for callouts like rate limits.',
      },
    ],
    proTips: [
      'Use reference-style links for documents with many repeated URLs: define [label]: url at the bottom and reference as [text][label] throughout. This keeps the raw markdown cleaner and makes URL updates a single-point change.',
      'For README files, follow the "fold principle": structure content so the most important information (what it does, how to install, basic usage) is visible without scrolling. Secondary details (advanced config, contributing guide, license) can go below the fold.',
      'When writing documentation, alternate between headings (structure), paragraphs (explanation), and code blocks (examples). This rhythm helps readers scan for what they need — heading to identify the topic, code block to copy the solution, paragraph for the "why" behind the code.',
      'For nested lists, indent sub-items with 4 spaces or 1 tab. Two-space indentation is not standard Markdown and may not render as nested on all platforms.',
      'Always separate block-level elements (headings, paragraphs, lists, code blocks) with blank lines. Without blank lines, some Markdown parsers will merge adjacent elements, producing unexpected output.',
    ],
    limitations: [
      'This editor implements a subset of Markdown syntax and does not support all CommonMark or GFM extensions. Tables, task lists, strikethrough, emoji shortcodes, footnotes, and definition lists are not rendered. When not to use: for complex documentation requiring GFM-specific features like tables or task lists.',
      'The HTML generation is a simplified parser that operates line by line. It does not handle nested inline formatting within links (e.g., [**bold link**](url)), which more sophisticated parsers like marked or markdown-it support.',
      'HTML tags embedded directly in Markdown are escaped rather than passed through. This means you cannot use raw HTML for tables, divs, or custom styling within the markdown. When not to use: for documents relying on embedded HTML for layout or custom components.',
      'The parser does not validate URL safety beyond protocol checks (javascript:, data:, vbscript:). For production use where untrusted users can submit markdown, use a more comprehensive sanitizer like DOMPurify.',
      'Code blocks do not support syntax highlighting — all code is rendered as plain monospaced text. For syntax-highlighted code blocks, use a library like Prism.js or highlight.js in conjunction with a full Markdown parser.',
    ],
    citations: [
      { source: 'Daring Fireball — Markdown Syntax Documentation', url: 'https://daringfireball.net/projects/markdown/syntax' },
      { source: 'CommonMark — A Standardized Markdown Specification', url: 'https://commonmark.org/' },
    ],
  },
};

export default markdownConfig;
