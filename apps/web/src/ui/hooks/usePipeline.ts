'use client';

import { useMachine } from '@xstate/react';
import { workspaceMachine } from '@/domain/pipeline/workspaceMachine';
import { newCheckpoint } from '@/domain/pipeline/checkpoint';
import { localDatabase } from '@/adapters/storage/database';
import { useWorkspace } from '../stores/workspaceStore';

export function usePipeline() {
  const [state, send] = useMachine(workspaceMachine);
  const busy = !state.matches('idle');
  function cancel() {
    send({ type: 'CANCEL' });
    const store = useWorkspace.getState();
    const checkpoint = store.checkpoint;
    if (checkpoint) store.patch({ tasks: checkpoint.tasks.map(task => task.status === 'running'
      ? { ...task, status: 'cancelled', summary: 'Cancelled. Accepted work is preserved. Provider usage may still apply.', partial: '' } : task) });
    store.message('Cancelled unfinished work. Accepted checkpoints are preserved. Cancellation cannot guarantee refunded provider usage.');
  }
  async function plan() {
    const store = useWorkspace.getState(); const checkpoint = store.checkpoint;
    if (!checkpoint || busy || checkpoint.composer.trim().length < 10) return;
    if (checkpoint.brief || checkpoint.document) await localDatabase.checkpoints.put({ id: `${checkpoint.runId}:${checkpoint.revision}`, data: checkpoint })
      .catch(() => { throw new Error('Could not archive this draft. Export it before starting a new request.'); });
    const next = newCheckpoint(checkpoint.settings.style);
    next.settings = checkpoint.settings; next.brief = checkpoint.composer.trim(); next.sources = checkpoint.sources;
    next.messages = [{ id: crypto.randomUUID(), role: 'user', text: next.brief }];
    store.hydrate(next);
    send({ type: 'PLAN' });
  }
  function accept() {
    const store = useWorkspace.getState();
    if (!store.checkpoint?.outline) return;
    store.patch({ outlineAccepted: true });
    store.message('Outline accepted. The writer and diagram designer can now work from the same plan.');
    send({ type: 'ACCEPT' });
  }
  return { busy, state, cancel, plan, accept, send };
}
