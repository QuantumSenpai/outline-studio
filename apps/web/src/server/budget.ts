import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ApiError } from './errors';

export const databaseBudget = new AsyncLocalStorage<AbortSignal>();
export async function withinStageBudget<T>(requestSignal: AbortSignal, work: () => Promise<T>) {
  const signal = AbortSignal.any([requestSignal, AbortSignal.timeout(45000)]);
  try { return await databaseBudget.run(signal, work); }
  catch (error) {
    if (signal.aborted) throw new ApiError(signal.reason?.name === 'TimeoutError' ? 'timeout' : 'cancelled', 'The bounded stage request ended. Accepted local work is preserved; retry explicitly.', 504);
    throw error;
  }
}
