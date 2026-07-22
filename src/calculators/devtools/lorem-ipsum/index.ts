import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import LoremIpsumPanel from './LoremIpsumPanel';

const LOREM_IPSUM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(
    ' '
  );

const LOREM_IPSUM_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?',
  'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
];

function generateWords(count: number): string {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(LOREM_IPSUM_WORDS[i % LOREM_IPSUM_WORDS.length]);
  }
  return words.join(' ');
}

function generateSentences(count: number): string {
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(LOREM_IPSUM_SENTENCES[i % LOREM_IPSUM_SENTENCES.length]);
  }
  return sentences.join(' ');
}

function generateParagraphs(count: number): string {
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    const sentenceCount = 3 + (i % 4);
    const sentenceArr: string[] = [];
    for (let j = 0; j < sentenceCount; j++) {
      sentenceArr.push(
        LOREM_IPSUM_SENTENCES[(i + j) % LOREM_IPSUM_SENTENCES.length]
      );
    }
    paragraphs.push(sentenceArr.join(' '));
  }
  return paragraphs.join('\n\n');
}

const loremIpsumConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'count',
      label: 'Count',
      type: 'number',
      inputMode: 'numeric',
      defaultValue: '5',
      min: 1,
      max: 50,
      helpText: 'Number of paragraphs, sentences, or words to generate (1-50)',
    },
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      defaultValue: 'Paragraphs',
      options: [
        { label: 'Paragraphs', value: 'Paragraphs' },
        { label: 'Sentences', value: 'Sentences' },
        { label: 'Words', value: 'Words' },
      ],
      helpText: 'Choose what type of unit to generate',
    },
    {
      id: 'startWithClassic',
      label: 'Start with "Lorem ipsum dolor sit amet"',
      type: 'select',
      defaultValue: 'yes',
      helpText: 'Whether to begin the generated text with the classic opening phrase',
      options: [
        { label: 'Yes — classic opening', value: 'yes' },
        { label: 'No — random start', value: 'no' },
      ],
      showWhen: (values) => values.unit === 'Paragraphs',
    },
  ],
  calculate: (values) => {
    const countRaw = values.count || '';
    const unit = values.unit || 'Paragraphs';

    if (!countRaw || countRaw.trim() === '') return [];

    const count = parseInt(countRaw, 10);

    if (isNaN(count) || count < 1 || count > 50) return [];

    let generatedText = '';

    if (unit === 'Words') {
      generatedText = generateWords(count);
    } else if (unit === 'Sentences') {
      generatedText = generateSentences(count);
    } else {
      generatedText = generateParagraphs(count);
    }

    const wordCount = generatedText.split(/\s+/).filter((w) => w.length > 0).length;
    const charCount = generatedText.length;

    return [
      {
        id: 'generatedText',
        label: 'Generated Text',
        value: generatedText,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'wordCount',
        label: 'Word Count',
        value: wordCount.toLocaleString(),
        color: 'neutral',
      },
      {
        id: 'charCount',
        label: 'Character Count',
        value: charCount.toLocaleString(),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LoremIpsumPanel, { values, results });
  },
  educational: {
    formula: 'Lorem Ipsum = scrambled Latin text from Cicero (45 BC)',
    formulaDescription:
      `Lorem Ipsum is derived from sections 1.10.32-33 of Cicero's "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil), a philosophical treatise on ethics written in 45 BC. The standard passage has been used as dummy placeholder text since the 1500s when an unknown printer scrambled the original Latin to create a type specimen book.`,
    variables: [
      {
        symbol: 'Paragraph',
        name: 'Paragraph Unit',
        description:
          'A block of 3-6 sentences separated by double newlines. Best for simulating realistic page layouts and document structures.',
      },
      {
        symbol: 'Sentence',
        name: 'Sentence Unit',
        description:
          'A single complete Lorem Ipsum sentence. Useful for short placeholders such as form labels, captions, or small UI elements.',
      },
      {
        symbol: 'Word',
        name: 'Word Unit',
        description:
          'Individual words from the Lorem Ipsum vocabulary. Useful for inline placeholders, short descriptions, or filling small spaces.',
      },
      {
        symbol: 'de Finibus',
        name: 'Source Text',
        description:
          'Cicero\'s 45 BC philosophical treatise discusses pleasure and pain. The Latin text was adapted into the scrambled Lorem Ipsum used today.',
      },
    ],
    howToUse: [
      'Select the unit type: Paragraphs for page mockups, Sentences for UI mockups, or Words for short placeholders.',
      'Set the count to the desired number of units using the number input (between 1 and 50).',
      'Optionally choose whether to start with the classic "Lorem ipsum dolor sit amet" opening when generating paragraphs.',
      'Click calculate to generate the Lorem Ipsum text, which appears immediately in the output panel below.',
      'Copy the generated text from the output field using the copy button, then paste it into your design tool, code editor, or mockup.',
    ],
    quickReference: [
      { label: 'Standard passage start', value: '"Lorem ipsum dolor sit amet..."' },
      { label: 'Original author', value: 'Cicero (106–43 BC)' },
      { label: 'Original work', value: '"de Finibus Bonorum et Malorum", 45 BC' },
      { label: 'Max units', value: '50 paragraphs / sentences / words' },
    ],
    commonUses: [
      'Filling page layouts and wireframes during web design and front-end development.',
      'Creating realistic-looking document templates and print mockups for client presentations.',
      'Demonstrating font styles, sizes, and typography in design portfolios and type specimen sheets.',
      'Testing content management systems and template rendering engines with realistic text volumes.',
      'Providing placeholder text for client proposals, draft websites, and pre-launch landing pages.',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="40" width="320" height="260" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><rect x="80" y="60" width="200" height="18" fill="var(--svg-3b82f6)" rx="3"/><line x1="80" y1="95" x2="340" y2="95" stroke="var(--svg-94a3b8)" stroke-width="2"/><line x1="80" y1="115" x2="320" y2="115" stroke="var(--svg-94a3b8)" stroke-width="2"/><line x1="80" y1="135" x2="335" y2="135" stroke="var(--svg-94a3b8)" stroke-width="2"/><line x1="80" y1="155" x2="280" y2="155" stroke="var(--svg-94a3b8)" stroke-width="2"/><line x1="80" y1="175" x2="340" y2="175" stroke="var(--svg-94a3b8)" stroke-width="2"/><line x1="80" y1="195" x2="310" y2="195" stroke="var(--svg-94a3b8)" stroke-width="2"/><line x1="80" y1="215" x2="300" y2="215" stroke="var(--svg-d1d5db)" stroke-width="2"/><line x1="80" y1="235" x2="325" y2="235" stroke="var(--svg-d1d5db)" stroke-width="2"/><line x1="80" y1="255" x2="290" y2="255" stroke="var(--svg-d1d5db)" stroke-width="2"/><text x="220" y="280" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Lorem Ipsum placeholder text filling a page layout</text></svg>',
      alt: 'Page layout showing Lorem Ipsum text lines as placeholder content',
      caption: 'Lorem Ipsum placeholder text simulating a filled document layout',
    },
    explanation:
      `Lorem Ipsum is the standard dummy text of the printing and typesetting industry with a history dating back to the 16th century. It has been used as placeholder text since the 1500s, when an unknown printer scrambled a passage of Latin text to create a type specimen book. The passage originates from Cicero's "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil), a treatise on ethics written in 45 BC by the Roman statesman and philosopher Marcus Tullius Cicero. The standard Lorem Ipsum passage begins with "Lorem ipsum dolor sit amet..." and has survived not only five centuries but also the transition to electronic typesetting, remaining essentially unchanged. It was popularized in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. The reason designers and developers use Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using "Content here, content here," making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text. The popularity of Lorem Ipsum continues because it focuses the viewer on the layout and design rather than being distracted by readable content. When a designer uses "greeking" text, the audience evaluates the visual structure and typography rather than reading and judging the content itself.`,
    faqs: [
      {
        question: 'Is Lorem Ipsum real Latin?',
        answer: 'Yes, the text is based on real Latin from Cicero\'s "de Finibus Bonorum et Malorum," written in 45 BC. However, the standard Lorem Ipsum passage is a scrambled and modified version — words were altered, truncated, and added to create a text that looks like readable Latin but has no coherent meaning. This was done intentionally so the placeholder text does not distract readers with meaningful content.',
      },
      {
        question: 'Why do designers use Lorem Ipsum instead of real text?',
        answer: 'Designers use Lorem Ipsum because it has a natural distribution of letters and word lengths that resembles readable English. Using real text could bias the viewer\'s perception of the design. Lorem Ipsum also avoids the problem of "content here, content here" text which looks unnatural and unprofessional in mockups. The neutral, nonsensical nature of Lorem Ipsum allows clients and stakeholders to focus on the visual design elements rather than reading the content.',
      },
      {
        question: 'What does "Lorem Ipsum" actually mean?',
        answer: '"Lorem Ipsum" is a truncated version of the Latin word "dolorem" (meaning pain or sorrow) combined with "ipsum" (meaning itself). In Cicero\'s original text, the phrase "dolorem ipsum" appears, meaning "pain itself." The first word of the standard passage lost its first two letters ("do") through centuries of typesetting practice, transforming "dolorem ipsum" into "lorem ipsum."',
      },
      {
        question: 'How long should my placeholder text be for different use cases?',
        answer: 'For web page mockups, 3-5 paragraphs provide a realistic content volume. For UI elements like buttons and form labels, 1-3 words are sufficient. For article previews or blog post mockups, 1-3 sentences work well. For full document templates, 5-10 paragraphs create a convincing page layout. The key is matching the volume to the actual content you expect in production.',
      },
      {
        question: 'Are there alternatives to Lorem Ipsum?',
        answer: 'Yes, there are many alternative placeholder text generators. "Cupcake Ipsum" uses dessert-themed text. "Hipster Ipsum" uses modern buzzwords. "Samuel L. Ipsum" generates movie quotes. "Bacon Ipsum" uses meat-related text. "Zombie Ipsum" uses zombie apocalypse themes. Each serves a different purpose, but traditional Lorem Ipsum remains the most professional choice for client-facing design mockups.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A UX designer is creating a blog post template in Figma and needs placeholder text to fill the article body. They want 3 paragraphs that look realistic in length and distribution to test how the layout handles various content volumes.',
        inputs: {
          'Unit': 'Paragraphs',
          'Count': '3',
        },
        result: '3 paragraphs generated (approximately 180 words, ~950 characters)',
        insight: 'Using 3 paragraphs of Lorem Ipsum provides a realistic simulation of a short- to medium-length blog post. The scrambled Latin has a letter distribution similar to English, so the text flows naturally and looks like readable content at a glance. This lets stakeholders focus on the visual design — spacing, typography, line height — without getting distracted by reading the actual content.',
      },
      {
        scenario: 'A frontend developer is building a card component with a title, short description, and label. They need 1 sentence for the description and want to test how the card handles varying text lengths.',
        inputs: {
          'Unit': 'Sentences',
          'Count': '1',
        },
        result: '1 sentence generated (approximately 85 characters)',
        insight: 'A single Lorem Ipsum sentence (~85 characters) is ideal for UI component placeholders like card descriptions, tooltips, or notification messages. The sentence length is realistic for a short description but still long enough to test text overflow, ellipsis, and responsive wrapping behavior. For testing edge cases, also try generating 2-3 sentences.',
      },
    ],
    proTips: [
      'Match the placeholder count to your real content volume. If your production pages will have 500 words of body text, generate Lorem Ipsum with roughly that word count — not 2 words or 20 paragraphs, which both misrepresent the final design.',
      'Use paragraphs for page-level mockups (body content, articles, documentation), sentences for component-level mockups (cards, notifications, descriptions), and words for micro-copy (buttons, labels, badges).',
      'When presenting mockups to clients, use the paragraph mode — it looks the most professional and avoids the "this is clearly fake" reaction that short placeholders can trigger.',
      'For multilingual layouts, pair Lorem Ipsum with a font that supports Latin character encoding. Not all fonts designed for East Asian or Arabic scripts include Latin glyphs — your placeholder will show as tofu (empty boxes) if the font lacks Latin support.',
      'When testing CMS templates, use at least 5 paragraphs to verify that the content management system handles the full content lifecycle: rendering, pagination, Read More truncation, and RSS feed generation.',
    ],
    limitations: [
      'Lorem Ipsum uses Latin text, which has a different word-length distribution than some languages. For layouts targeting Chinese, Japanese, Arabic, or other non-Latin scripts, use localized placeholder text to get accurate line-breaking behavior. When not to use: for testing non-Latin script layouts.',
      'The text is non-semantic and gibberish. It cannot be used to test accessibility features like screen readers (which will read the Latin phonetically), search functionality (which will find no real terms), or content-aware layouts. When not to use: for accessibility or SEO testing.',
      'This generator produces text from a fixed corpus of sentences, not truly random text. In rare cases, similar sentences may appear side by side, creating unrealistic repetition patterns. When not to use: for production-quality mockups requiring unique content throughout.',
      'Generated text should never be used in production or publicly visible content. Search engines may penalize pages with Lorem Ipsum text as low-quality content, and real users encountering placeholder text creates an unprofessional impression.',
    ],
    citations: [
      { source: 'Lorem Ipsum — History, Origins, and Information', url: 'https://www.lipsum.com/' },
      { source: 'Wikipedia — Lorem Ipsum', url: 'https://en.wikipedia.org/wiki/Lorem_ipsum' },
    ],
  },
};

export default loremIpsumConfig;
