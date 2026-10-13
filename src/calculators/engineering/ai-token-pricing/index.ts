import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AITokenPricingPanel from './AITokenPricingPanel';

import { MODELS, PRICES_AS_OF, estimateTokens, requestCost } from './aiPricingData';

const LAST_UPDATED = PRICES_AS_OF;

const aiTokenPricingConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'model',
      label: 'AI Model',
      type: 'select',
      required: true,
      helpText: `List prices snapshot dated ${LAST_UPDATED}, not live data. Anthropic and Google rows were read from the providers' pricing pages; models marked "unverified" are indicative only.`,
      options: Object.entries(MODELS).map(([value, m]) => ({ label: `${m.label} (${m.provider})${m.verified ? '' : ' — unverified'}`, value })),
    },
    {
      id: 'promptText',
      label: 'Paste your prompt to auto-count tokens',
      type: 'textarea',
      placeholder: 'Paste your system prompt and user message here to estimate token count automatically…',
      helpText: 'Rough estimate (~4 chars per token). Adjust Prompt Tokens below for exact counts.',
    },
    {
      id: 'promptTokensPerRequest',
      label: 'Prompt Tokens per Request',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '500',
      min: 0,
      max: 100000000,
      step: 1,
      required: true,
      helpText: 'Input tokens per request (system prompt + message). Auto-filled from text above.',
    },
    {
      id: 'completionTokensPerRequest',
      label: 'Completion Tokens per Request',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '150',
      min: 0,
      max: 100000000,
      step: 1,
      required: true,
      helpText: 'Output tokens per request (the model response)',
    },
    {
      id: 'useCachePricing',
      label: 'Use Prompt Caching',
      type: 'select',
      helpText: 'Prompt caching bills repeated prompt prefixes at a much lower cached-read rate (Anthropic and Google: 10% of the input price). Cache writes may cost extra and are not modelled.',
      options: [
        { label: 'No — standard pricing', value: 'no' },
        { label: 'Yes — use cached input pricing', value: 'yes' },
      ],
    },
    {
      id: 'cachedShare',
      label: 'Share of Prompt Read from Cache (optional)',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '100',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      helpText: 'Only used when caching is on. Blank = 100% of prompt tokens at the cached rate; set e.g. 80 if 80% of the prompt is a repeated prefix.',
      showWhen: (v) => v.useCachePricing === 'yes',
    },
    {
      id: 'dailyActiveUsers',
      label: 'Daily Active Users (optional)',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '10000',
      min: 0,
      max: 1000000000,
      step: 1,
      helpText: 'Number of unique users making requests each day',
    },
    {
      id: 'requestsPerUser',
      label: 'Requests per User per Day (optional)',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '5',
      min: 0,
      max: 1000000,
      step: 1,
      helpText: 'Average number of requests each user makes per day',
    },
  ],
  calculate: (values) => {
    const modelId = values.model || 'gpt-4o';
    const modelInfo = MODELS[modelId];
    if (!modelInfo) return [];

    // Auto-fill prompt tokens from pasted text
    const pastedText = values.promptText || '';
    const estimatedTokens = pastedText ? estimateTokens(pastedText) : 0;
    const promptTokens = parseFloat(values.promptTokensPerRequest) || estimatedTokens || 0;
    const completionTokens = parseFloat(values.completionTokensPerRequest) || 0;

    if (promptTokens <= 0 || completionTokens <= 0) return [];

    const useCache = values.useCachePricing === 'yes';
    const shareRaw = values.cachedShare !== undefined && values.cachedShare !== '' ? parseFloat(values.cachedShare) : 100;
    if (!Number.isFinite(shareRaw) || shareRaw < 0 || shareRaw > 100) return [];
    const cost = requestCost(modelInfo, promptTokens, completionTokens, useCache, shareRaw / 100);
    const { inputCost, outputCost, effectiveInputPrice } = cost;
    const costPerRequest = cost.total;

    const dau = parseFloat(values.dailyActiveUsers);
    const rpu = parseFloat(values.requestsPerUser);

    let monthlyCost = 0;
    let annualCost = 0;
    let costPerUser = 0;
    let requestsPerDay = 0;
    let totalMonthlyTokens = 0;

    if (Number.isFinite(dau) && Number.isFinite(rpu) && dau > 0 && rpu > 0) {
      requestsPerDay = dau * rpu;
      monthlyCost = costPerRequest * requestsPerDay * 30; // 30-day month
      annualCost = costPerRequest * requestsPerDay * 365;
      costPerUser = monthlyCost / dau;
      totalMonthlyTokens = (promptTokens + completionTokens) * requestsPerDay * 30;
    }

    const fmtDollar = (n: number) => {
      if (n === 0) return '$0';
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
      if (n >= 0.01) return `$${n.toFixed(4)}`;
      return `$${n.toFixed(8)}`;
    };

    return [
      { id: 'modelName', label: 'Model', value: modelInfo.label },
      { id: 'provider', label: 'Provider', value: modelInfo.provider },
      { id: 'lastUpdated', label: 'Prices Snapshot Date', value: LAST_UPDATED },
      { id: 'priceStatus', label: 'Price Source', value: modelInfo.verified ? "Read from the provider's pricing page on the snapshot date" : 'Unverified / indicative — confirm on the provider site', color: modelInfo.verified ? 'neutral' : 'negative' },
      { id: 'inputPrice', label: useCache && modelInfo.cachedInput !== undefined ? 'Effective Input Price with Cache (per 1M tokens)' : 'Input Price (per 1M tokens)', value: `$${effectiveInputPrice >= 0.1 ? effectiveInputPrice.toFixed(2) : effectiveInputPrice.toFixed(4)}`, color: 'neutral' },
      { id: 'outputPrice', label: 'Output Price (per 1M tokens)', value: `$${modelInfo.outputPrice.toFixed(2)}`, color: 'neutral' },
      { id: 'promptTokens', label: 'Prompt Tokens', value: promptTokens.toLocaleString(), color: 'neutral' },
      { id: 'completionTokens', label: 'Completion Tokens', value: completionTokens.toLocaleString(), color: 'neutral' },
      { id: 'inputCost', label: 'Input Cost per Request', value: fmtDollar(inputCost), color: 'neutral' },
      { id: 'outputCost', label: 'Output Cost per Request', value: fmtDollar(outputCost), color: 'neutral' },
      { id: 'costPerRequest', label: 'Cost per Request', value: fmtDollar(costPerRequest), highlight: true, color: 'positive' },
      { id: 'totalMonthlyTokens', label: 'Total Monthly Tokens (30 days, needs users + requests)', value: totalMonthlyTokens.toLocaleString(), color: 'neutral' },
      { id: 'monthlyCost', label: 'Estimated Monthly Cost', value: fmtDollar(monthlyCost), highlight: true, color: 'positive' },
      { id: 'annualCost', label: 'Estimated Annual Cost (365 days)', value: fmtDollar(annualCost), color: 'neutral' },
      { id: 'costPerUser', label: 'Cost per User per Month', value: fmtDollar(costPerUser), color: 'neutral' },
      { id: 'requestsPerDay', label: 'Requests per Day', value: requestsPerDay.toLocaleString(), color: 'neutral' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AITokenPricingPanel, { values, results });
  },
  educational: {
    formula: 'Cost = (PromptTokens / 1M × InputPrice) + (CompletionTokens / 1M × OutputPrice)',
    formulaDescription:
      'LLM APIs bill per token, with separate rates per million input (prompt) and output (completion) tokens. Output tokens usually cost several times more than input tokens (about 5x for the Anthropic and Google models here). Cached prompt prefixes are billed at a reduced read rate: 10% of the input price for the Anthropic and Google models in this calculator. All prices are a dated snapshot, not live.',
    variables: [
      { symbol: 'Prompt Tokens', name: 'Input Tokens', description: 'Tokens sent to the model: system instructions, conversation history and the current query.' },
      { symbol: 'Completion Tokens', name: 'Output Tokens', description: 'Tokens the model generates. Reasoning/thinking tokens are billed as output on most providers even though they may not be shown.' },
      { symbol: 'Input Price', name: 'Price per 1M Input Tokens', description: 'List price per million prompt tokens on the snapshot date. Varies by model and sometimes by prompt length.' },
      { symbol: 'Output Price', name: 'Price per 1M Output Tokens', description: 'List price per million generated tokens.' },
      { symbol: 'Cached Input', name: 'Cached Input Price', description: 'Discounted rate for prompt tokens read from a prompt cache. Anthropic and Google bill reads at 10% of the input price; cache writes or storage can cost extra and are not modelled.' },
    ],
    quickReference: [
      { label: 'Claude Opus 4.7', value: '$5 input / $25 output per 1M tokens, cache hit $0.50 (Anthropic pricing page, snapshot 2026-10-12)' },
      { label: 'Claude Sonnet 4.6', value: '$3 / $15, cache hit $0.30 (Anthropic)' },
      { label: 'Claude Haiku 4.5', value: '$1 / $5, cache hit $0.10 (Anthropic)' },
      { label: 'Gemini 3.1 Pro (preview, prompts up to 200k)', value: '$2 / $12, context cache $0.20 (Google)' },
      { label: 'Gemini 3 Flash (preview)', value: '$0.50 / $3.00, context cache $0.05 (Google)' },
      { label: 'OpenAI, xAI, DeepSeek, Meta rows', value: 'Unverified, indicative only — check the provider site' },
      { label: 'Tokens ↔ words', value: 'About 4 characters or 0.75 words per token in English' },
    ],
    workedExamples: [
      {
        scenario: 'Support chatbot: 10,000 daily users × 5 requests, 500 prompt + 150 completion tokens, Claude Sonnet 4.6, no caching',
        inputs: { model: 'claude-sonnet-4', promptTokensPerRequest: '500', completionTokensPerRequest: '150', useCachePricing: 'no', dailyActiveUsers: '10000', requestsPerUser: '5' },
        result: 'Per request: 500/1M × $3 + 150/1M × $15 = $0.0015 + $0.00225 = $0.00375. 50,000 requests/day: $187.50/day, $5,625/month (30 days), $68,437.50/year (365 days).',
        insight: 'Output is 60% of the cost even though it is under a quarter of the tokens, because output costs 5x input. With the whole prompt served from cache ($0.30/1M) the input part falls to $0.00015 and the request to $0.0024, a monthly bill of $3,600. In practice only a repeated prefix is cached, so set the cached share to match.',
      },
      {
        scenario: 'Code review agent: 100 developers × 20 requests/day, 8,000 prompt + 2,000 completion tokens, Claude Opus 4.7, prompt fully cached',
        inputs: { model: 'claude-opus-4', promptTokensPerRequest: '8000', completionTokensPerRequest: '2000', useCachePricing: 'yes', cachedShare: '100', dailyActiveUsers: '100', requestsPerUser: '20' },
        result: 'Per request: 8,000/1M × $0.50 + 2,000/1M × $25 = $0.004 + $0.05 = $0.054. 2,000 requests/day: $108/day, $3,240/month, $39,420/year.',
        insight: 'Uncached, the input would cost 8,000/1M × $5 = $0.04, making a request $0.09 and the month $5,400. Cached or not, the 2,000 output tokens dominate. Per developer that is $32.40 a month with caching.',
      },
      {
        scenario: 'Bulk classification: 1,000,000 daily users × 3 requests, 100 prompt + 10 completion tokens, Gemini 3 Flash (preview), prompt cached',
        inputs: { model: 'gemini-3-flash', promptTokensPerRequest: '100', completionTokensPerRequest: '10', useCachePricing: 'yes', cachedShare: '100', dailyActiveUsers: '1000000', requestsPerUser: '3' },
        result: 'Per request: 100/1M × $0.05 + 10/1M × $3 = $0.000005 + $0.00003 = $0.000035. 3,000,000 requests/day: $105/day, $3,150/month.',
        insight: 'The same traffic on Claude Opus 4.7 without caching costs $0.00075 per request (100/1M × $5 + 10/1M × $25), about 21x more. Model choice matters far more than shaving prompt tokens at this scale.',
      },
    ],
    proTips: [
      'Cache the stable front of your prompt (system instructions, tool definitions, few-shot examples) and put changing content last; only a repeated prefix can be read from cache.',
      'Route simple tasks (classification, extraction, formatting) to a small, cheap model and reserve the large model for hard requests. Measure quality on your own data first.',
      'Use the token counts returned in each API response for budgeting. The 4-characters-per-token estimate here is only a rough guide; code and non-English text can differ a lot, and newer tokenizers can produce noticeably more tokens for the same text.',
      'Reasoning/thinking tokens are billed as output but may not be visible, so a short visible answer can hide a much larger billed output.',
      'Check batch or flex tiers and volume discounts with your provider: they can change the effective price substantially but are not modelled here.',
    ],
    limitations: [
      'Prices are a dated snapshot of list prices (see the snapshot date in the results) and change often. Only the Anthropic and Google rows were read from the providers\' pricing pages; OpenAI, xAI, DeepSeek and Meta rows are indicative and may be out of date. Always confirm before budgeting.',
      'Not modelled: batch/flex discounts, volume or committed-use pricing, long-context surcharges (some models charge more for prompts above a size threshold), cache write and storage fees, fine-tuning, image/audio token rates, tool-use or search fees, and taxes.',
      'The token counter uses a rough 4-characters-per-token estimate for English; use each provider\'s tokenizer or the usage field in API responses for exact counts.',
      'Monthly cost assumes a 30-day month and annual cost 365 days, with identical usage every day.',
    ],
    howToUse: [
      'Select an AI model.',
      'Paste your prompt to estimate tokens, or enter prompt and completion token counts directly.',
      'Turn on prompt caching and set what share of the prompt is read from cache, if you use it.',
      'Enter daily active users and requests per user to project monthly and annual cost.',
      'Compare the same request across all models in the table below the results.',
    ],
    explanation:
      'Token-priced LLM APIs charge separately for what you send and what the model writes. For example, a 500-token prompt with a 150-token answer on a model priced at $3 input and $15 output per million tokens costs 500/1,000,000 × $3 + 150/1,000,000 × $15 = $0.00375. Output tokens are the more expensive side (5x here), so response length is usually the main cost lever; prompt caching helps when the same prefix is sent repeatedly. Pricing differs widely between model tiers: a small model can cost a small fraction of a frontier model per request, so routing tasks to the right tier is the biggest saving at scale. Prices change frequently, so treat this as a planning tool and check the provider\'s page for current rates.',
    commonUses: [
      'Estimating the cost of an LLM feature before building it',
      'Comparing the same workload across models and providers',
      'Budgeting monthly spend from users and requests per user',
      'Judging how much prompt caching or a smaller model would save',
    ],
    faqs: [
      {
        question: 'Why do output tokens cost more than input tokens?',
        answer: 'Generating text is sequential: each output token needs its own pass through the model, while the prompt can be processed in parallel. Providers therefore price output higher; in this snapshot it is 4x to 6x the input price for most models.',
      },
      {
        question: 'What is prompt caching and how much does it save?',
        answer: 'When the start of a prompt repeats across requests, the provider can reuse its processed form and bill those tokens at a reduced cache-read rate. Anthropic and Google bill cache reads at 10% of the normal input price (Sonnet 4.6: $0.30 instead of $3 per million), so the maximum saving on the cached part of the input is 90%. Only the repeated prefix qualifies, and writing to the cache or storing it can cost extra, so real savings are smaller than the headline.',
      },
      {
        question: 'How do I estimate tokens without a tokenizer?',
        answer: 'A common rule for English is about 4 characters or 0.75 words per token, so a 500-word article is roughly 670 tokens. Code, non-English text and different tokenizers vary; for exact counts use the provider\'s token-counting tool or the usage numbers returned by the API.',
      },
      {
        question: 'How current are the prices?',
        answer: 'The results show the snapshot date. Anthropic and Google prices were read from their pricing pages on that date. OpenAI, xAI, DeepSeek and Meta rows are marked unverified because their pages could not be read automatically. LLM pricing changes often, so always check the provider before committing a budget.',
      },
      {
        question: 'Which model is cheapest?',
        answer: 'Use the comparison table: it prices your exact request on every model. Cheaper per-token models are not always cheaper overall if they need longer prompts, retries or produce lower-quality answers, so test quality on your own tasks too.',
      },
    ],
    citations: [
      { source: 'Anthropic — Claude API pricing', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
      { source: 'Google AI — Gemini API pricing', url: 'https://ai.google.dev/gemini-api/docs/pricing' },
      { source: 'OpenAI — API pricing (not machine-readable; verify manually)', url: 'https://openai.com/api/pricing/' },
    ],
  },
};

export default aiTokenPricingConfig;
