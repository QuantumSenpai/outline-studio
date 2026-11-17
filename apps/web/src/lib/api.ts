import { errorSchema, type ErrorData } from '@outline-studio/schemas';

export class ClientError extends Error {
  constructor(public details: ErrorData) { super(details.message); this.name = 'ClientError'; }
}
export async function responseError(response: Response): Promise<ClientError> {
  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  const parsed = errorSchema.safeParse(body);
  return new ClientError(parsed.success ? parsed.data : { code: response.status === 504 ? 'timeout' : 'unavailable',
    message: response.status === 504 ? 'The server function timed out. Accepted local work is safe; retry the unfinished stage.' : 'The request failed. Check the connection and retry; local work is preserved.' });
}
export async function api(path: string, data?: unknown, signal?: AbortSignal, method = 'POST') {
  let response: Response;
  try { response = await fetch(`/api${path}`, { method, signal, credentials: 'same-origin',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) }); }
  catch (error) {
    if (signal?.aborted) {
      const timeout = signal.reason?.name === 'TimeoutError';
      throw new ClientError({ code: timeout ? 'timeout' : 'cancelled', message: timeout ? 'Connection timed out. Accepted work is preserved; retry the unfinished stage.' : 'Request cancelled. Provider usage may still apply.' });
    }
    throw new ClientError({ code: 'offline', message: error instanceof Error && error.name === 'TimeoutError' ? 'Connection timed out. Reconnect and retry.' : 'Connection lost. Your local work is preserved; reconnect and retry.' });
  }
  if (!response.ok) throw await responseError(response);
  return response;
}
export async function connectSession(signal?: AbortSignal) { await api('/session', undefined, signal); }
export function messageFrom(error: unknown) { return error instanceof ClientError && error.details.requestId ? `${error.message} (Reference: ${error.details.requestId})` : error instanceof Error ? error.message : 'This action could not be completed. Try again.'; }
