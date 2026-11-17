import { workerRequest } from './workerRequest';
import { wrap, releaseProxy } from 'comlink';
import type { exportService } from './export.worker';
import type { ExportFormat, ExportInput } from '@/adapters/renderers/types';

export async function renderFile(format: ExportFormat, input: ExportInput) {
  let fonts: { regular: Uint8Array; bold: Uint8Array } | undefined;
  if (format === 'pdf') {
    const family = input.settings.style === 'professional' ? 'NotoSans' : 'Tinos';
    const responses = await Promise.all([`/fonts/${family}-Regular.ttf`, `/fonts/${family}-Bold.ttf`].map(url => fetch(url)));
    if (responses.some(response => !response.ok)) throw new Error('PDF font could not load. Check the connection and retry.');
    fonts = { regular: new Uint8Array(await responses[0].arrayBuffer()), bold: new Uint8Array(await responses[1].arrayBuffer()) };
  }
  const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
  const api = wrap<typeof exportService>(worker);
  try { return await workerRequest(worker, () => api.render(format, input, fonts)); }
  finally { api[releaseProxy](); worker.terminate(); }
}
