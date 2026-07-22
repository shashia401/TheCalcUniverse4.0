import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CharacterTokenPanel from './CharacterTokenPanel';

// Token pricing for GPT-4o (used for cost estimate)
const INPUT_PRICE_PER_1K = 0.0025; // $0.0025 per 1K input tokens

// Simplified BPE-like token counter for OpenAI (cl100k_base approximation)
function estimateOpenAITokens(text: string): number {
  if (!text) return 0;

  // Split text into words and punctuation tokens
  // This approximates cl100k_base encoding rules
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    // Handle whitespace sequences
    if (/\s/.test(text[i])) {
      let ws = '';
      while (i < text.length && /\s/.test(text[i])) {
        ws += text[i];
        i++;
      }
      tokens.push(ws);
      continue;
    }

    // Handle word (sequence of word characters)
    if (/[a-zA-Z0-9]/.test(text[i])) {
      let word = '';
      while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) {
        word += text[i];
        i++;
      }
      // A word of length N produces roughly ceil(N/4) tokens for English
      const wordTokens = Math.max(1, Math.ceil(word.length / 4));
      for (let t = 0; t < wordTokens; t++) {
        tokens.push(word.substring(t * 4, (t + 1) * 4));
      }
      continue;
    }

    // Handle CJK characters (each is typically 1-2 tokens)
    if (/[一-鿿㐀-䶿豈-﫿]/.test(text[i])) {
      tokens.push(text[i]);
      tokens.push(text[i]); // CJK roughly 2 tokens per char in cl100k_base
      i++;
      continue;
    }

    // Handle punctuation/special characters
    tokens.push(text[i]);
    i++;
  }

  return tokens.length || 1;
}

function estimateClaudeTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 3.5));
}

function estimateLlamaTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 3.8));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const characterTokenConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'inputText',
      label: 'Input Text',
      type: 'text',
      placeholder: 'Paste or type your text here...',
      helpText: 'Paste or type the text you want to analyze for token count',
    },
    {
      id: 'tokenizerType',
      label: 'Tokenizer',
      type: 'select',
      required: true,
      options: [
        { label: 'OpenAI (cl100k_base)', value: 'openai' },
        { label: 'Claude', value: 'claude' },
        { label: 'Llama 3', value: 'llama3' },
        { label: 'General Estimate', value: 'general' },
      ],
      helpText: 'Select the AI model tokenizer to estimate token count',
    },
  ],
  calculate: (values) => {
    const inputText = values.inputText || '';
    const tokenizerType = values.tokenizerType || 'general';

    if (!inputText) return [];

    const charCount = inputText.length;
    const wordCount = countWords(inputText);

    let estimatedTokens: number;
    switch (tokenizerType) {
      case 'openai':
        estimatedTokens = estimateOpenAITokens(inputText);
        break;
      case 'claude':
        estimatedTokens = estimateClaudeTokens(inputText);
        break;
      case 'llama3':
        estimatedTokens = estimateLlamaTokens(inputText);
        break;
      case 'general':
      default:
        estimatedTokens = Math.max(1, Math.round(charCount * 0.25));
        break;
    }

    const tokenCharRatio = charCount > 0 ? estimatedTokens / charCount : 0;

    // Read time: ~300 tokens per minute
    const readTimeMin = estimatedTokens / 300;

    // Generation time: ~50 tokens per second for output
    const genTimeSec = estimatedTokens / 50;

    // Cost estimate (using GPT-4o pricing)
    const estimatedCost = ((estimatedTokens / 1000) * INPUT_PRICE_PER_1K);

    const formatReadTime = (minutes: number): string => {
      if (minutes < 1) return `${Math.round(minutes * 60)} seconds`;
      if (minutes < 60) return `${Math.round(minutes)} min ${Math.round((minutes % 1) * 60)} sec`;
      const hrs = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hrs}h ${mins}m`;
    };

    const formatGenTime = (sec: number): string => {
      if (sec < 1) return `${(sec * 1000).toFixed(0)} ms`;
      if (sec < 60) return `${sec.toFixed(1)} seconds`;
      return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
    };

    const fmtCost = (n: number): string => {
      if (n < 0.0001) return '<$0.0001';
      return `$${n.toFixed(4)}`;
    };

    // Format token count with commas
    const tokenCountFormatted = estimatedTokens.toLocaleString(undefined);

    return [
      { id: 'estimatedTokens', label: 'Estimated Tokens', value: tokenCountFormatted, highlight: true, color: 'positive' },
      { id: 'characterCount', label: 'Characters', value: charCount.toLocaleString(undefined), color: 'neutral' },
      { id: 'wordCount', label: 'Words', value: wordCount.toLocaleString(undefined), color: 'neutral' },
      { id: 'tokenCharRatio', label: 'Tokens per Character', value: tokenCharRatio.toFixed(4), color: 'neutral' },
      { id: 'estimatedReadTime', label: 'Estimated Read Time', value: formatReadTime(readTimeMin), color: 'neutral' },
      { id: 'estimatedGenTime', label: 'Estimated Generation Time', value: formatGenTime(genTimeSec), color: 'neutral' },
      { id: 'estimatedCost', label: 'Estimated API Cost (input)', value: fmtCost(estimatedCost), color: 'neutral' },
      { id: 'tokenizerType', label: 'Tokenizer', value: tokenizerType === 'openai' ? 'OpenAI (cl100k_base)' : tokenizerType === 'claude' ? 'Claude' : tokenizerType === 'llama3' ? 'Llama 3' : 'General Estimate' },
      { id: 'tokenCountFormatted', label: 'Token Count', value: tokenCountFormatted },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CharacterTokenPanel, { values, results });
  },
  educational: {
    formula: 'Tokens ≈ Characters × Ratio (depends on tokenizer) | OpenAI cl100k_base: ~0.25 tokens/char for English',
    formulaDescription:
      'Tokens are the basic processing units that large language models (LLMs) use. Unlike characters, tokens represent chunks of text — in English, one token is roughly 4 characters or 0.75 words on average. Different models use different tokenizers (cl100k_base for GPT-4/GPT-4o, Claude uses its own custom tokenizer, Llama 3 uses a BPE tokenizer similar to GPT-4 with modifications). Token count is the fundamental metric for API costs, context window capacity, and processing speed.',
    variables: [
      { symbol: 'Token, Tokenizer', name: 'Token & Tokenizer', description: 'The atomic text unit a model processes (≈0.75 words). Tokenizers split text into tokens, and different models use different tokenizers with varying vocabulary sizes.' },
      { symbol: 'Context Window', name: 'Context Window', description: 'The maximum number of tokens a model can accept in a single request, including both input prompt and generated output. GPT-4o: 128K, Claude 3.5 Sonnet: 200K tokens.' },
      { symbol: 'Token/Char Ratio', name: 'Token/Character Ratio', description: 'Efficiency metric: lower ratios mean more characters fit per token. English averages ~0.25, while CJK (Chinese, Japanese, Korean) languages can use 1.0-2.0 tokens per character due to larger character sets.' },
    ],
    howToUse: [
      'Paste or type the text you want to analyze into the input field.',
      'Select the tokenizer that matches your target model (OpenAI cl100k_base, OpenAI r50k_base, Claude, or Llama 3).',
      'View the estimated token count, character count, word count, and token-to-character ratio.',
      'Check the token/character ratio — a lower ratio means the tokenizer handles your text more efficiently.',
      'Review the estimated read time and generation time for planning API usage.',
      'The context window gauge shows how much of a typical 128K context window your text consumes.',
    ],
    explanation:
      'Token counting is essential for working with LLMs because API pricing, context window limits, and rate limits are all based on tokens, not characters or words. A token is not the same as a character or a word — in English, one token averages about 4 characters or 0.75 words. Different tokenizers produce different counts for the same text: the cl100k_base tokenizer (used by GPT-4 and GPT-4o) is optimized for English text and code, Claude uses its own tokenizer that may produce slightly different counts, and Llama 3 uses a similar BPE (Byte Pair Encoding) tokenizer. Non-English languages, especially CJK (Chinese, Japanese, Korean), typically require more tokens per character because the tokenizer vocabulary is dominated by common English word fragments. Always select the correct tokenizer type for your target model to get accurate cost projections and ensure your prompt fits within the model\'s context window. As a rule of thumb, 1000 tokens ≈ 750 English words, and this ratio helps with quick estimation when building prompts and managing API budgets.',
    faqs: [
      {
        question: 'Why do tokens matter?',
        answer: 'Tokens determine everything about your LLM API usage: cost (you pay per token — typically per 1000 tokens for both input and output), context window limits (a 128K token limit means roughly 96,000 English words max), and generation speed (models generate approximately 20-100 tokens per second depending on model size and hardware). Knowing your token count helps you estimate costs before making API calls, stay within context limits to avoid truncation, and plan for latency in production applications.',
      },
      {
        question: 'Why is the token count different for different models?',
        answer: 'Each model family uses its own tokenizer with different vocabulary size and encoding rules. OpenAI GPT-4 uses cl100k_base (100,000 token vocabulary), GPT-3 uses r50k_base (50,000 tokens). Anthropic\'s Claude uses a proprietary tokenizer optimized for multilingual text. Llama 3 uses a BPE tokenizer with a 128,000 token vocabulary. Token counts can vary by 10-20% between tokenizers for the same English text, and even more for code or non-English languages. This is why you must select the correct tokenizer for accurate estimation.',
      },
      {
        question: 'What is a context window?',
        answer: 'The context window is the maximum number of tokens a model can process in a single request, including your input (the prompt, instructions, and any documents or conversation history) plus the model\'s generated output. If your total exceeds the window, the oldest tokens are typically truncated (sliding window) or the request fails. Common sizes: GPT-4o and Claude 3.5 Sonnet: 128K-200K tokens, GPT-3.5: 16K, Llama 3: 8K-128K depending on variant. Planning your token usage within the window is critical for complex tasks that require large amounts of context.',
      },
    ],
    citations: [
      { source: 'OpenAI - Tokenizer', url: 'https://platform.openai.com/tokenizer' },
      { source: 'OpenAI - Models Overview', url: 'https://platform.openai.com/docs/models' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Tokenization Example</text><rect x="15" y="35" width="290" height="70" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="160" y="52" text-anchor="middle" font-size="10" fill="var(--svg-555555)">"Hello, world! How are you today?"</text><rect x="20" y="60" width="50" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="45" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Hello</text><rect x="75" y="60" width="20" height="18" rx="4" fill="var(--svg-ef4444)" opacity="0.7"/><text x="85" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">,</text><rect x="100" y="60" width="35" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="117" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">world</text><rect x="140" y="60" width="15" height="18" rx="4" fill="var(--svg-ef4444)" opacity="0.7"/><text x="147" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">!</text><rect x="160" y="60" width="25" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="172" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">How</text><rect x="190" y="60" width="25" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="202" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">are</text><rect x="220" y="60" width="25" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="232" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">you</text><rect x="250" y="60" width="35" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="267" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">today</text><rect x="15" y="118" width="290" height="72" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="138" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Tokens ≈ Characters × Ratio</text><text x="160" y="158" text-anchor="middle" font-size="10" fill="var(--svg-555555)">English: ~0.25 tokens/char (~4 chars per token)</text><line x1="20" y1="166" x2="300" y2="166" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="182" font-size="10" fill="var(--svg-333333)">CJK (Chinese/Japanese/Korean): 1–2 tokens/char</text><text x="310" y="182" text-anchor="end" font-size="10" fill="var(--svg-ef4444)">× more</text></svg>',
      alt: 'Tokenization example showing text split into individual tokens',
      caption: 'Tokens are the processing units of LLMs. English averages ~0.75 words per token; CJK languages use more tokens per character.',
    },
  },
};

export default characterTokenConfig;
