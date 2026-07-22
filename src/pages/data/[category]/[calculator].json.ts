// Static per-calculator data endpoint (build-time JSON). Makes every calculator
// machine-readable so AI assistants and search engines can cite exact capabilities.
// Pure static files — zero backend, zero security surface. (ROADMAP Workstream B1.)
import type { APIRoute } from 'astro';
import { calculatorRegistry } from '../../../lib/registry';
import { BASE_URL } from '../../../config/constants';

export async function getStaticPaths() {
  return calculatorRegistry.map((entry) => ({
    params: { category: entry.categorySlug, calculator: entry.id },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: (typeof calculatorRegistry)[number] };
  const { default: config } = await entry.loader();

  const data = {
    id: entry.id,
    title: entry.title,
    shortTitle: entry.shortTitle ?? undefined,
    description: entry.description,
    category: entry.category,
    url: `${BASE_URL}/${entry.categorySlug}/${entry.id}/`,
    lastVerified: entry.lastVerified ?? undefined,
    inputs: config.inputs
      .filter((i) => i.type !== 'custom')
      .map((i) => ({
        id: i.id,
        label: i.label,
        type: i.type,
        unit: i.unit ?? undefined,
        min: i.min ?? undefined,
        max: i.max ?? undefined,
        options: i.options?.map((o) => ({ label: o.label, value: o.value })),
      })),
    formula: config.educational?.formula ?? undefined,
    faqs: (config.educational?.faqs ?? []).map((f) => ({ question: f.question, answer: f.answer })),
    source: 'TheCalcUniverse — deterministic, tested calculator (not an AI estimate)',
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
