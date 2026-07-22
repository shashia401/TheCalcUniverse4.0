// Machine-readable index of every calculator + its data endpoint. Static.
import type { APIRoute } from 'astro';
import { calculatorRegistry } from '../../lib/registry';
import { BASE_URL } from '../../config/constants';

export const GET: APIRoute = async () => {
  const list = calculatorRegistry.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    url: `${BASE_URL}/${e.categorySlug}/${e.id}/`,
    data: `${BASE_URL}/data/${e.categorySlug}/${e.id}.json`,
  }));
  return new Response(
    JSON.stringify({ count: list.length, calculators: list }, null, 2),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
};
