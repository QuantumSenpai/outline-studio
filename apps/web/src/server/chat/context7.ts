import { z } from 'zod';
import { chatDocumentationSchema, type ChatDocumentation, type DocumentationQuery } from '@outline-studio/schemas';
import { responseJson } from '../response';

const code = z.object({ codeTitle: z.string().max(2000).default('Documentation'), codeId: z.string().max(3000), rank: z.number().default(100),
  codeDescription: z.string().max(50000).default(''), codeList: z.array(z.object({ code: z.string().max(100000) })).max(50).default([]) });
const info = z.object({ pageId: z.string().max(3000), breadcrumb: z.string().max(2000).default('Documentation'), content: z.string().max(100000), rank: z.number().default(100) });
const resultSchema = z.object({ codeSnippets: z.array(code).max(100).default([]), infoSnippets: z.array(info).max(100).default([]),
  version: z.object({ status: z.string().optional() }).optional() });
export type DocumentationResult = { context: string; metadata: ChatDocumentation };
export async function lookupDocumentation(query: DocumentationQuery, signal: AbortSignal): Promise<DocumentationResult> {
  try {
    const url = new URL('https://context7.com/api/v3/search');
    url.searchParams.set('query', query.query); url.searchParams.set('type', 'json');
    if (query.library) url.searchParams.set('library', query.library);
    const key = process.env.CONTEXT7_API_KEY;
    const response = await fetch(url, { headers: key ? { Authorization: `Bearer ${key}` } : {}, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) });
    if (!response.ok) return { context: '', metadata: { sources: [], notice: response.status === 429 ? 'Context7 rate limit reached. Answering without retrieved documentation; retry later.' : response.status === 401 || response.status === 403 ? 'Context7 access needs attention. Configure a valid server API key; answering without retrieved documentation.' : 'Context7 documentation is unavailable. Answering without retrieved documentation.' } };
    const result = resultSchema.parse(await responseJson(response, 600000));
    const items = [...result.codeSnippets.map(item => ({ title: item.codeTitle, url: item.codeId, rank: item.rank,
      text: [item.codeDescription, ...item.codeList.map(code => code.code)].join('\n') })),
    ...result.infoSnippets.map(item => ({ title: item.breadcrumb, url: item.pageId, rank: item.rank, text: item.content }))].sort((a, b) => a.rank - b.rank);
    const sources: ChatDocumentation['sources'] = []; const excerpts: string[] = [];
    for (const item of items) {
      const parsed = chatDocumentationSchema.safeParse({ sources: [{ title: item.title.slice(0, 200), url: item.url }] });
      if (!parsed.success || sources.some(source => source.url === item.url)) continue;
      sources.push(parsed.data.sources[0]); excerpts.push(`[${sources.length}] ${item.title}\n${item.url}\n${item.text.slice(0, 2400)}`);
      if (sources.length === 5) break;
    }
    return { context: excerpts.join('\n\n').slice(0, 12000), metadata: { sources,
      ...(!sources.length ? { notice: 'Context7 found no usable documentation. Answering without retrieved documentation.' } : result.version?.status === 'unverified' ? { notice: 'Context7 served fallback documentation; confirm the requested library version.' } : {}) } };
  } catch {
    signal.throwIfAborted();
    return { context: '', metadata: { sources: [], notice: 'Context7 lookup failed or timed out. Answering without retrieved documentation.' } };
  }
}
