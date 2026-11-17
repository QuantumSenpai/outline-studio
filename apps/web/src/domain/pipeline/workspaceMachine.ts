import { setup, fromPromise } from 'xstate';
import { executeStage } from './executeStage';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { messageFrom } from '@/lib/api';

async function compose(signal: AbortSignal) {
  const state = useWorkspace.getState(); const checkpoint = state.checkpoint;
  if (!checkpoint?.outlineAccepted) throw new Error('Accept the outline before starting coworkers.');
  const tasks = [!checkpoint.document ? 'writer' as const : null, !checkpoint.diagram ? 'diagram' as const : null].filter(t => t !== null);
  if (state.concurrency === 1) { for (const task of tasks) await executeStage(task, signal); return; }
  const results = await Promise.allSettled(tasks.map(task => executeStage(task, signal)));
  const rejected = results.find(result => result.status === 'rejected');
  if (rejected?.status === 'rejected') throw rejected.reason;
}
export const workspaceMachine = setup({
  types: { events: {} as { type: 'PLAN' | 'ACCEPT' | 'COMPOSE' | 'REVIEW' | 'CANCEL' | 'RESET' } },
  actors: {
    plan: fromPromise(async ({ signal }) => executeStage('planner', signal)),
    compose: fromPromise(async ({ signal }) => compose(signal)),
    review: fromPromise(async ({ signal }) => {
      const checkpoint = useWorkspace.getState().checkpoint;
      if (!checkpoint?.document || !checkpoint.diagram) throw new Error('The writer and diagram must finish before review.');
      return executeStage('reviewer', signal);
    }),
  },
  guards: { accepted: () => Boolean(useWorkspace.getState().checkpoint?.outlineAccepted),
    reviewable: () => Boolean(useWorkspace.getState().checkpoint?.document && useWorkspace.getState().checkpoint?.diagram) },
}).createMachine({
  id: 'workspace', initial: 'idle', on: { CANCEL: '.idle', RESET: '.idle' },
  states: {
    idle: { on: { PLAN: 'planning', ACCEPT: { target: 'composing', guard: 'accepted' },
      COMPOSE: { target: 'composing', guard: 'accepted' }, REVIEW: { target: 'reviewing', guard: 'reviewable' } } },
    planning: { invoke: { src: 'plan', onDone: { target: 'idle' }, onError: { target: 'idle', actions: ({ event }) => useWorkspace.getState().message(messageFrom(event.error)) } } },
    composing: { invoke: { src: 'compose', onDone: { target: 'idle' }, onError: { target: 'idle', actions: ({ event }) => useWorkspace.getState().message(messageFrom(event.error)) } } },
    reviewing: { invoke: { src: 'review', onDone: { target: 'idle' }, onError: { target: 'idle', actions: ({ event }) => useWorkspace.getState().message(messageFrom(event.error)) } } },
  },
});
