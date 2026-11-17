import { z } from 'zod';
import { api } from './api';
const pageSchema = z.object({ feedback: z.array(z.unknown()).max(500), next: z.string().max(256).nullable().optional() });
export async function exportServerFeedback() {
  const signal = AbortSignal.timeout(45000); const feedback: unknown[] = []; let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const response = await api(`/data${cursor ? `?before=${encodeURIComponent(cursor)}` : ''}`, undefined, signal, 'GET');
    const result = pageSchema.parse(await response.json()); feedback.push(...result.feedback);
    if (!result.next) return { feedback, note: 'Session-owned feedback only. Local project documents and provider keys are excluded.' };
    cursor = result.next;
  }
  throw new Error('Feedback export reached its 10,000-record limit. Use the paginated data API for older records. No partial export was labelled complete.');
}
