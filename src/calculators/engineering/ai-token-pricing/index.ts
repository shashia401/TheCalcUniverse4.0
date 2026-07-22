import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AITokenPricingPanel from './AITokenPricingPanel';

// Prices per 1M tokens. Source: official provider pricing as of May 2026
interface ModelInfo {
  inputPrice: number;
  outputPrice: number;
  cachedInput?: number;
  label: string;
  provider: string;
}

const MODELS: Record<string, ModelInfo> = {
  // OpenAI — GPT-5 series
  'gpt-5': { inputPrice: 15.00, outputPrice: 60.00, cachedInput: 2.50, label: 'GPT-5', provider: 'OpenAI' },
  'gpt-5-mini': { inputPrice: 2.00, outputPrice: 8.00, cachedInput: 0.30, label: 'GPT-5-mini', provider: 'OpenAI' },
  'gpt-4o': { inputPrice: 2.50, outputPrice: 10.00, cachedInput: 0.625, label: 'GPT-4o', provider: 'OpenAI' },
  'gpt-4o-mini': { inputPrice: 0.15, outputPrice: 0.60, cachedInput: 0.0375, label: 'GPT-4o-mini', provider: 'OpenAI' },
  // Anthropic — Claude 4.x series
  'claude-opus-4': { inputPrice: 15.00, outputPrice: 75.00, cachedInput: 1.50, label: 'Claude Opus 4.7', provider: 'Anthropic' },
  'claude-sonnet-4': { inputPrice: 3.00, outputPrice: 15.00, cachedInput: 0.30, label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  'claude-haiku-4': { inputPrice: 0.25, outputPrice: 1.25, cachedInput: 0.025, label: 'Claude Haiku 4.5', provider: 'Anthropic' },
  // Google — Gemini 3.x series
  'gemini-3-pro': { inputPrice: 1.50, outputPrice: 6.00, cachedInput: 0.1875, label: 'Gemini 3.1 Pro', provider: 'Google' },
  'gemini-3-flash': { inputPrice: 0.15, outputPrice: 0.60, cachedInput: 0.01875, label: 'Gemini 3.1 Flash', provider: 'Google' },
  // DeepSeek
  'deepseek-v3': { inputPrice: 0.50, outputPrice: 2.00, label: 'DeepSeek V3', provider: 'DeepSeek' },
  // xAI — Grok
  'grok-3': { inputPrice: 3.00, outputPrice: 15.00, label: 'Grok 3', provider: 'xAI' },
  // Meta — Llama
  'llama-4': { inputPrice: 0.50, outputPrice: 1.50, label: 'Llama 4', provider: 'Meta' },
};

// Rough token estimation: ~4 chars per token for English
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const LAST_UPDATED = '2026-05-02';

const aiTokenPricingConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'model',
      label: 'AI Model',
      type: 'select',
      required: true,
      helpText: 'Current pricing as of May 2026 — 12 models across 6 providers',
      options: [
        { label: 'GPT-5 (OpenAI)', value: 'gpt-5' },
        { label: 'GPT-5-mini (OpenAI)', value: 'gpt-5-mini' },
        { label: 'GPT-4o (OpenAI)', value: 'gpt-4o' },
        { label: 'GPT-4o-mini (OpenAI)', value: 'gpt-4o-mini' },
        { label: 'Claude Opus 4.7 (Anthropic)', value: 'claude-opus-4' },
        { label: 'Claude Sonnet 4.6 (Anthropic)', value: 'claude-sonnet-4' },
        { label: 'Claude Haiku 4.5 (Anthropic)', value: 'claude-haiku-4' },
        { label: 'Gemini 3.1 Pro (Google)', value: 'gemini-3-pro' },
        { label: 'Gemini 3.1 Flash (Google)', value: 'gemini-3-flash' },
        { label: 'DeepSeek V3', value: 'deepseek-v3' },
        { label: 'Grok 3 (xAI)', value: 'grok-3' },
        { label: 'Llama 4 (Meta)', value: 'llama-4' },
      ],
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
      step: 1,
      required: true,
      helpText: 'Output tokens per request (the model response)',
    },
    {
      id: 'useCachePricing',
      label: 'Use Prompt Caching',
      type: 'select',
      helpText: 'Prompt caching reduces input costs by ~75-90% for repeated context blocks',
      options: [
        { label: 'No — standard pricing', value: 'no' },
        { label: 'Yes — use cached input pricing', value: 'yes' },
      ],
    },
    {
      id: 'dailyActiveUsers',
      label: 'Daily Active Users (optional)',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '10000',
      min: 0,
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
    const effectiveInputPrice = useCache && modelInfo.cachedInput ? modelInfo.cachedInput : modelInfo.inputPrice;

    const inputCost = (promptTokens / 1_000_000) * effectiveInputPrice;
    const outputCost = (completionTokens / 1_000_000) * modelInfo.outputPrice;
    const costPerRequest = inputCost + outputCost;
    const totalMonthlyTokens = (promptTokens + completionTokens) * 30;

    const dau = parseFloat(values.dailyActiveUsers);
    const rpu = parseFloat(values.requestsPerUser);

    let monthlyCost = 0;
    let annualCost = 0;
    let costPerUser = 0;
    let requestsPerDay = 0;

    if (!isNaN(dau) && !isNaN(rpu) && dau > 0 && rpu > 0) {
      requestsPerDay = dau * rpu;
      monthlyCost = costPerRequest * requestsPerDay * 30;
      annualCost = monthlyCost * 12;
      costPerUser = monthlyCost / dau;
    }

    const fmtDollar = (n: number) => {
      if (n === 0) return '$0';
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
      if (n >= 0.01) return `$${n.toFixed(4)}`;
      return `$${n.toFixed(8)}`;
    };

    // Compute all-model comparison for the panel
    const modelComparison = Object.entries(MODELS).map(([id, m]) => ({
      id,
      label: m.label,
      provider: m.provider,
      inputPrice: m.inputPrice,
      outputPrice: m.outputPrice,
      cachedInput: m.cachedInput,
      costPerRequest: (promptTokens / 1_000_000) * m.inputPrice + (completionTokens / 1_000_000) * m.outputPrice,
    })).sort((a, b) => a.costPerRequest - b.costPerRequest);

    return [
      { id: 'modelName', label: 'Model', value: modelInfo.label },
      { id: 'provider', label: 'Provider', value: modelInfo.provider },
      { id: 'lastUpdated', label: 'Prices Last Updated', value: LAST_UPDATED },
      { id: 'inputPrice', label: useCache ? 'Cached Input Price (per 1M tokens)' : 'Input Price (per 1M tokens)', value: `$${effectiveInputPrice.toFixed(2)}`, color: 'neutral' },
      { id: 'outputPrice', label: 'Output Price (per 1M tokens)', value: `$${modelInfo.outputPrice.toFixed(2)}`, color: 'neutral' },
      { id: 'promptTokens', label: 'Prompt Tokens', value: promptTokens.toLocaleString(), color: 'neutral' },
      { id: 'completionTokens', label: 'Completion Tokens', value: completionTokens.toLocaleString(), color: 'neutral' },
      { id: 'inputCost', label: 'Input Cost per Request', value: fmtDollar(inputCost), color: 'neutral' },
      { id: 'outputCost', label: 'Output Cost per Request', value: fmtDollar(outputCost), color: 'neutral' },
      { id: 'costPerRequest', label: 'Cost per Request', value: fmtDollar(costPerRequest), highlight: true, color: 'positive' },
      { id: 'totalMonthlyTokens', label: 'Total Monthly Tokens', value: totalMonthlyTokens.toLocaleString(), color: 'neutral' },
      { id: 'monthlyCost', label: 'Estimated Monthly Cost', value: fmtDollar(monthlyCost), highlight: true, color: 'positive' },
      { id: 'annualCost', label: 'Estimated Annual Cost', value: fmtDollar(annualCost), color: 'neutral' },
      { id: 'costPerUser', label: 'Cost per User per Month', value: fmtDollar(costPerUser), color: 'neutral' },
      { id: 'requestsPerDay', label: 'Requests per Day', value: requestsPerDay.toLocaleString(), color: 'neutral' },
      { id: 'allModels', label: 'All Model Comparisons', value: JSON.stringify(modelComparison) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AITokenPricingPanel, { values, results });
  },
  educational: {
    formula: 'Cost = (PromptTokens / 1M × InputPrice) + (CompletionTokens / 1M × OutputPrice)',
    formulaDescription:
      'AI model pricing is based on token usage, split between input (prompt) tokens and output (completion) tokens. Output tokens typically cost 3-6x more than input tokens because generating tokens requires sequential compute. Prompt caching can reduce input costs by up to 90% for repeated context blocks.',
    variables: [
      { symbol: 'Prompt Tokens', name: 'Input Tokens', description: 'Tokens in the user prompt / system message. Includes system instructions, conversation history, and the user\'s current query.' },
      { symbol: 'Completion Tokens', name: 'Output Tokens', description: 'Tokens generated by the model in its response. Depends on task complexity and model\'s response style.' },
      { symbol: 'Input Price', name: 'Price per 1M Input Tokens', description: 'Cost per million tokens for the prompt portion. Ranges from $0.075 (Gemini Flash) to $15.00 (GPT-5, Opus).' },
      { symbol: 'Output Price', name: 'Price per 1M Output Tokens', description: 'Cost per million tokens for the generated response. Usually 3-6x input price.' },
      { symbol: 'Cached Input', name: 'Cached Input Price', description: 'Discounted rate for repeated prompt context blocks. Available on OpenAI, Anthropic, and Google. Typically 10-25% of standard input price.' },
    ],
    quickReference: [
      { label: 'GPT-5 (OpenAI)', value: '$15.00 input / $60.00 output per 1M tokens — cached: $2.50. Top-tier reasoning.' },
      { label: 'GPT-4o-mini (OpenAI)', value: '$0.15 input / $0.60 output per 1M tokens — cached: $0.0375. Budget workhorse.' },
      { label: 'Claude Opus 4.7 (Anthropic)', value: '$15.00 input / $75.00 output per 1M tokens — cached: $1.50. Premium reasoning.' },
      { label: 'Claude Haiku 4.5 (Anthropic)', value: '$0.25 input / $1.25 output per 1M tokens — cached: $0.025. Fast & cheap.' },
      { label: 'Gemini 3.1 Flash (Google)', value: '$0.15 input / $0.60 output per 1M tokens — cached: $0.01875. Lowest cost.' },
      { label: 'DeepSeek V3', value: '$0.50 input / $2.00 output per 1M tokens. Strong open competition.' },
      { label: 'Prompt Caching Savings', value: '75-90% off input costs. Reuse system prompts, conversation history, few-shot examples.' },
    ],
    workedExamples: [
      {
        scenario: 'Customer support chatbot: 10K DAU, 5 requests/user, 500 prompt + 150 output tokens each, GPT-4o',
        inputs: { model: 'gpt-4o', promptTokensPerRequest: '500', completionTokensPerRequest: '150', useCachePricing: 'yes', dailyActiveUsers: '10000', requestsPerUser: '5' },
        result: 'Cost per request: $0.0018125; Monthly: ~$2,719; Annual: ~$32,625 (with caching).',
        insight: 'With prompt caching enabled (cached input at $0.625/1M), input cost = $0.0003125/req + output cost = $0.0015/req = $0.0018125/req. 50K requests/day = ~$90.63/day, ~$2,719/month, ~$32,625/year. Without caching: ~$10,875/month. Caching saves ~75% on input costs. Switch to GPT-4o-mini and monthly costs drop to ~$65/month — a 40x reduction for simple classification/FAQ-style support.',
      },
      {
        scenario: 'Code review agent: 100 DAU devs, 20 requests/dev/day, 8000 prompt (codebase context) + 2000 output tokens, Claude Opus 4.7',
        inputs: { model: 'claude-opus-4', promptTokensPerRequest: '8000', completionTokensPerRequest: '2000', useCachePricing: 'yes', dailyActiveUsers: '100', requestsPerUser: '20' },
        result: 'Cost per request: $0.162; Daily: $324; Monthly: ~$9,720; Annual: ~$116,640.',
        insight: 'With caching at $1.50/1M input, cost = (8000/1M * $1.50) + (2000/1M * $75) = $0.012 + $0.15 = $0.162/request. 2000 requests/day = $324/day = ~$9,720/month, ~$116,640/year. For a 100-person team, that is ~$97/dev/month. Without caching, it would be ~$540/day. Claude Sonnet 4.6 at $3.00/$15.00 would reduce costs to ~$84/day while still providing excellent code review quality.',
      },
      {
        scenario: 'Simple text classification pipeline: 1M DAU free-tier users, 3 requests/user, 100 prompt + 10 output tokens, Gemini 3.1 Flash',
        inputs: { model: 'gemini-3-flash', promptTokensPerRequest: '100', completionTokensPerRequest: '10', useCachePricing: 'yes', dailyActiveUsers: '1000000', requestsPerUser: '3' },
        result: 'Cost per request: ~$0.0000062; Monthly: ~$557 at 3M requests/day.',
        insight: 'With cached input at $0.01875/1M: cost = (100/1M * $0.01875) + (10/1M * $0.60) = $0.0000001875 + $0.000006 = $0.0000061875/req. 3M requests/day = $18.56/day = ~$557/month. At this scale, even tiny prompt optimizations matter — shaving 10 tokens off the prompt saves ~$55/month. Model choice at scale has enormous leverage: GPT-5 would cost ~$24,480/month for the same pipeline.',
      },
    ],
    proTips: [
      'Enable prompt caching for any production workload. It reduces input costs by 75-90% and is supported by all major providers (OpenAI, Anthropic, Google). Structure your prompts to keep static content (system instructions, few-shot examples) at the beginning of the prompt — this is the portion that gets cached.',
      'Use tiered model routing: send simple tasks (classification, keyword extraction, formatting) to budget models like GPT-4o-mini or Gemini Flash, and route complex tasks (reasoning, code generation, analysis) to premium models like GPT-5 or Claude Opus. This can cut costs 50-70% without any user-perceptible quality difference.',
      'Track your actual token counts from API responses rather than estimating. Each provider returns prompt_tokens and completion_tokens in the API response. Use this data to build accurate cost dashboards. Our 4-char-per-token estimate is directionally useful but insufficient for production budgeting.',
      'Be aware that thinking/reasoning tokens (Claude\'s extended thinking, OpenAI\'s o-series) are charged at output token rates but are not visible to users. A model might consume 2000 thinking tokens to generate a 200-token response. Factor this into cost estimates for reasoning-heavy tasks — actual costs can be 5-10x higher than visible output suggests.',
    ],
    limitations: [
      'This calculator uses list prices from official API pricing pages as of the last-updated date. It does NOT account for volume discounts (OpenAI and Anthropic offer tiered pricing for $5K+/month committed spend), fine-tuning API costs (which have different token rates), batch/async API pricing (typically 50% off for 24-hour turnaround), or image/audio input token pricing (which uses different multipliers).',
      'The token counter uses a rough 4-characters-per-token estimate, which is accurate to about +/-20% for English text but diverges significantly for code, non-English languages, and structured data. For exact token counts, use each provider\'s official tokenizer: tiktoken (OpenAI), Anthropic\'s token-count API, or Google\'s countTokens endpoint.',
      'Pricing changes frequently — always verify against the provider\'s official pricing page before making budget commitments.',
    ],
    howToUse: [
      'Select your AI model from 12 options across 6 providers.',
      'Paste your actual prompt text to auto-count tokens, or enter token counts manually.',
      'Toggle prompt caching to see cached vs standard pricing.',
      'Enter daily active users and requests per user to project monthly and annual costs.',
      'Compare costs across all models to optimize your AI spend.',
      'Prices are updated regularly — last updated date is shown in results.',
    ],
    explanation:
      'AI token pricing varies dramatically across models and providers. GPT-5 and Claude Opus 4.7 are the most capable (and most expensive) at $15/$60 and $15/$75 per million tokens respectively. For high-volume production workloads, GPT-4o-mini ($0.15/$0.60) or Gemini 3.1 Flash ($0.15/$0.60) offer the best value. Prompt caching is now a standard feature across all major providers — cached input tokens cost 75-90% less than standard input. For production deployments, enabling caching and choosing the right model tier for each task are the two most impactful cost optimization strategies. A customer support chatbot handling 10K conversations/day might cost $50/day on GPT-5 but only $1.65/day on GPT-4o-mini — a 30x difference. Use the model comparison table below to find the optimal price/performance balance for your use case.',
    commonUses: [
      'Estimating production AI costs by comparing per-request pricing across 12+ models from OpenAI, Anthropic, Google, and others',
      'Choosing the most cost-effective model for each task — from budget-friendly (GPT-4o-mini, Gemini Flash) to premium (GPT-5, Claude Opus)',
      'Budgeting monthly AI infrastructure costs with usage projections based on daily active users and requests per user',
      'Optimizing prompt design and implementing caching strategies to reduce token consumption and lower operational costs',
    ],
    faqs: [
      {
        question: 'Which AI model is cheapest for production?',
        answer: 'GPT-4o-mini ($0.15/$0.60 per million tokens) and Gemini 3.1 Flash ($0.15/$0.60) are the most cost-effective models for high-volume production workloads. DeepSeek V3 ($0.50/$2.00) and Llama 4 ($0.50/$1.50) are competitive mid-range options. GPT-5 ($15/$60) and Claude Opus 4.7 ($15/$75) are premium models for complex reasoning tasks.',
      },
      {
        question: 'What is prompt caching and how much does it save?',
        answer: 'Prompt caching stores repeated context blocks (system prompts, conversation history) and charges a reduced rate when they\'re reused. OpenAI charges $0.625/1M cached tokens vs $2.50/1M standard (75% savings). Anthropic charges $0.30/1M vs $3.00/1M (90% savings). Google charges $0.01875/1M vs $0.15/1M (87.5% savings). In practice, caching can reduce total API costs by 30-60% for production workloads with shared context.',
      },
      {
        question: 'Why do output tokens cost more than input?',
        answer: 'Output tokens require autoregressive generation — the model generates each token one at a time, with each step requiring a full forward pass through the network. Input tokens are processed in parallel during encoding, making them computationally cheaper. This typically results in output costing 3-6x more than input across all providers.',
      },
      {
        question: 'How do I estimate tokens without an exact tokenizer?',
        answer: 'As a rough rule of thumb, one token equals approximately 4 characters for English text, or about 0.75 words. A 500-word article is roughly 667 tokens. Code and non-English languages may have different ratios. For exact counts, use each provider\'s official tokenizer — OpenAI\'s tiktoken, Anthropic\'s tokenizer API, or Google\'s token counting endpoint. Our paste-text counter uses the 4-character approximation.',
      },
      {
        question: 'What is the best model for my use case?',
        answer: 'For simple classification and extraction: GPT-4o-mini or Gemini Flash ($0.001-0.003 per request). For customer support chatbots: Claude Sonnet 4.6 or GPT-4o ($0.005-0.02 per request). For complex reasoning, code generation, or analysis: GPT-5 or Claude Opus 4.7 ($0.02-0.10 per request). Use the comparison table to see exactly how each model prices the same request.',
      },
    ],
    citations: [
      { source: 'OpenAI — API Pricing', url: 'https://openai.com/api/pricing/' },
      { source: 'Anthropic — API Pricing', url: 'https://www.anthropic.com/pricing' },
      { source: 'Google AI — Gemini API Pricing', url: 'https://ai.google.dev/pricing' },
    ],
  },
};

export default aiTokenPricingConfig;
