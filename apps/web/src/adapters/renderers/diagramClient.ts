import { workerRequest } from '@/workers/workerRequest';
import { wrap, releaseProxy } from 'comlink';
import type { DiagramIR } from '@outline-studio/schemas';
import type { diagramService } from '@/workers/diagram.worker';

export async function renderDiagram(value: DiagramIR) {
  const worker = new Worker(new URL('../../workers/diagram.worker.ts', import.meta.url), { type: 'module' });
  const api = wrap<typeof diagramService>(worker);
  try { return await workerRequest(worker, () => api.render(value)); } finally { api[releaseProxy](); worker.terminate(); }
}
