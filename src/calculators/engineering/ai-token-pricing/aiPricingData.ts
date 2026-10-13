/**
 * LLM API list prices, USD per 1M tokens, shared by index.ts and AITokenPricingPanel.tsx.
 *
 * PRICES CHANGE OFTEN - these are a dated snapshot, never live data. `verified: true` rows were read from the
 * provider's own pricing page on PRICES_AS_OF:
 *  - Anthropic: platform.claude.com/docs/en/about-claude/pricing (Opus 4.7 $5/$25, Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5,
 *    cache hits 0.1x base input)
 *  - Google: ai.google.dev/gemini-api/docs/pricing (Gemini 3.1 Pro preview <=200k prompts $2/$12, context cache $0.20;
 *    Gemini 3 Flash preview $0.50/$3.00, cache $0.05)
 * `verified: false` rows could not be read from the provider's page (OpenAI blocks automated reading; xAI, DeepSeek and
 * Meta were not checked) and are INDICATIVE only: confirm on the provider's site before budgeting.
 */
export const PRICES_AS_OF = '2026-10-12';

export interface ModelInfo {
  inputPrice: number;
  outputPrice: number;
  cachedInput?: number;
  label: string;
  provider: string;
  verified: boolean;
}

export const MODELS: Record<string, ModelInfo> = {
  'gpt-5': { inputPrice: 1.25, outputPrice: 10.0, cachedInput: 0.125, label: 'GPT-5', provider: 'OpenAI', verified: false },
  'gpt-5-mini': { inputPrice: 0.25, outputPrice: 2.0, cachedInput: 0.025, label: 'GPT-5-mini', provider: 'OpenAI', verified: false },
  'gpt-4o': { inputPrice: 2.5, outputPrice: 10.0, cachedInput: 1.25, label: 'GPT-4o', provider: 'OpenAI', verified: false },
  'gpt-4o-mini': { inputPrice: 0.15, outputPrice: 0.6, cachedInput: 0.075, label: 'GPT-4o-mini', provider: 'OpenAI', verified: false },
  'claude-opus-4': { inputPrice: 5.0, outputPrice: 25.0, cachedInput: 0.5, label: 'Claude Opus 4.7', provider: 'Anthropic', verified: true },
  'claude-sonnet-4': { inputPrice: 3.0, outputPrice: 15.0, cachedInput: 0.3, label: 'Claude Sonnet 4.6', provider: 'Anthropic', verified: true },
  'claude-haiku-4': { inputPrice: 1.0, outputPrice: 5.0, cachedInput: 0.1, label: 'Claude Haiku 4.5', provider: 'Anthropic', verified: true },
  'gemini-3-pro': { inputPrice: 2.0, outputPrice: 12.0, cachedInput: 0.2, label: 'Gemini 3.1 Pro (preview)', provider: 'Google', verified: true },
  'gemini-3-flash': { inputPrice: 0.5, outputPrice: 3.0, cachedInput: 0.05, label: 'Gemini 3 Flash (preview)', provider: 'Google', verified: true },
  'deepseek-v3': { inputPrice: 0.5, outputPrice: 2.0, label: 'DeepSeek V3', provider: 'DeepSeek', verified: false },
  'grok-3': { inputPrice: 3.0, outputPrice: 15.0, label: 'Grok 3', provider: 'xAI', verified: false },
  'llama-4': { inputPrice: 0.5, outputPrice: 1.5, label: 'Llama 4 (hosted; varies by host)', provider: 'Meta', verified: false },
};

/** Rough English estimate (~4 characters per token); code and non-English text differ a lot. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface RequestCost {
  inputCost: number;
  outputCost: number;
  total: number;
  /** Effective input price after the cached share is applied, $ per 1M tokens. */
  effectiveInputPrice: number;
}

/**
 * Cost of one request. `cachedShare` (0-1) is the fraction of prompt tokens billed at the cached rate; it only applies
 * when the model has a cached price.
 */
export function requestCost(m: ModelInfo, promptTokens: number, completionTokens: number, useCache: boolean, cachedShare = 1): RequestCost {
  const share = useCache && m.cachedInput !== undefined ? Math.min(1, Math.max(0, cachedShare)) : 0;
  const effectiveInputPrice = m.inputPrice * (1 - share) + (m.cachedInput ?? m.inputPrice) * share;
  const inputCost = (promptTokens / 1_000_000) * effectiveInputPrice;
  const outputCost = (completionTokens / 1_000_000) * m.outputPrice;
  return { inputCost, outputCost, total: inputCost + outputCost, effectiveInputPrice };
}
