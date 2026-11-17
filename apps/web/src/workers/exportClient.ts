import { wrap, releaseProxy } from 'comlink';
import type { exportService } from './export.worker';
import type { ExportFormat, ExportInput } from '@/adapters/renderers/types';

export async function renderFile(format: ExportFormat, input: ExportInput) {
  let fonts: { regular: Uint8Array; bold: Uint8Array } | undefined;
  if (format === 'pdf') {
    const responses = await Promise.all(['/fonts/Tinos-Regular.ttf', '/fonts/Tinos-Bold.ttf'].map(url => fetch(url)));
    if (responses.some(response => !response.ok)) throw new Error('PDF font could not load. Check the connection and retry.');
    fonts = { regular: new Uint8Array(await responses[0].arrayBuffer()), bold: new Uint8Array(await responses[1].arrayBuffer()) };
  }
  const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
  const api = wrap<typeof exportService>(worker);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Local export exceeded its 30-second limit. Reduce the document and retry.')),30000); });
  try { return await Promise.race([api.render(format, input, fonts), deadline]); }
  finally { clearTimeout(timer); api[releaseProxy](); worker.terminate(); }
}
