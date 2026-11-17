import { Hono } from 'hono';
import { z } from 'zod';
import { owner } from '../http';
import { limit } from '../db/limits';
import { ApiError } from '../errors';

const crossref = z.object({ message: z.object({ items: z.array(z.object({
  DOI: z.string(), title: z.array(z.string()).optional(), URL: z.url(),
})).max(5) }) });
export const sourceRoutes = new Hono();
sourceRoutes.get('/sources', async c => {
  const id = await owner(c);
  const query = z.string().trim().min(3).max(300).safeParse(c.req.query('q'));
  if (!query.success) throw new ApiError('invalid_input', 'Enter a source search between 3 and 300 characters.');
  await limit(`sources:${id}`, 30);
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', query.data); url.searchParams.set('rows', '5');
  url.searchParams.set('select', 'DOI,title,URL');
  const response = await fetch(url, { signal: AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(10000)]),
    headers: { 'User-Agent': 'OutlineStudio/0.1 (read-only bibliographic metadata lookup)' }, next: { revalidate: 3600 } });
  if (!response.ok) throw new ApiError('unavailable', 'Scholarly metadata lookup is unavailable. Add checked sources later; no verification is implied.', 503);
  const result = crossref.safeParse(await response.json());
  if (!result.success) throw new ApiError('invalid_output', 'Source metadata could not be validated.', 502);
  const retrievedAt = new Date().toISOString();
  return c.json({ sources: result.data.message.items.map(item => ({ title: (item.title?.[0] ?? item.DOI).slice(0, 500),
    doi: item.DOI, url: `https://doi.org/${encodeURI(item.DOI)}`, retrievedAt, verifiedMetadata: true })),
    limitation: 'Crossref metadata lookup only. A matching DOI does not prove that a source supports a claim. Read the original work.' });
});
