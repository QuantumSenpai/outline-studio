import 'server-only';
import { providers } from '@outline-studio/config';
import { modelListSchema, type Connection } from '@outline-studio/schemas';
import { ApiError } from '../errors';

export function endpoint(connection: Connection, path: '/models' | '/chat/completions') {
  const provider = providers.find(p => p.id === connection.provider);
  if (!provider) throw new ApiError('invalid_input', 'Unsupported provider.');
  return `${provider.base}${path}`;
}
export function headers(connection: Connection) {
  return { Authorization: `Bearer ${connection.key}`, 'Content-Type': 'application/json' };
}
export async function upstreamError(response: Response) {
  let details = '';
  try { details = (await response.text()).slice(0, 6000).toLowerCase(); } catch { details = ''; }
  const retry = response.headers.get('retry-after');
  const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : retry ? Math.ceil((Date.parse(retry) - Date.now()) / 1000) : 10;
  const delay = Math.min(300, Math.max(1, Number.isFinite(seconds) ? seconds : 10));
  if (response.status === 402 || /insufficient_quota|insufficient.credit|credit.balance|quota.exceeded/.test(details))
    return new ApiError('credit', 'Provider credit or quota is exhausted. Check your account before retrying.', 402);
  if ([401, 403].includes(response.status)) return new ApiError('credentials', 'The provider rejected this key or its permissions. Update the connection.', 401);
  if (response.status === 429) return new ApiError('rate_limit', 'The selected provider is rate limited.', 429, delay);
  if ([400, 404, 422].includes(response.status)) return new ApiError('model', 'This model did not accept the request. Choose a compatible text/chat model or reduce the brief.', 422);
  return new ApiError('unavailable', 'The provider is temporarily unavailable. Retry or use your enabled fallback.', 502, delay);
}
export async function listModels(connection: Connection, signal: AbortSignal) {
  const response = await fetch(endpoint(connection, '/models'), { headers: headers(connection), signal, redirect: 'error', cache: 'no-store' });
  if (!response.ok) throw await upstreamError(response);
  const body: unknown = await response.json();
  const result = modelListSchema.safeParse(body);
  if (!result.success) throw new ApiError('invalid_output', 'Provider returned an unreadable model list.', 502);
  return result.data.data.map(m => m.id).filter(id => /^[\w./:@-]+$/.test(id)).sort();
}
