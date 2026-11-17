import { type Connection, type StageName, type StageOutput, stageRequestSchema } from '@outline-studio/schemas';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { useProviders } from '@/ui/stores/providerStore';
import { saveProject } from '@/adapters/storage/projects';
import { eligibleConnections, canFallback } from '@/adapters/providers/fallback';
import { readStageStream } from '@/adapters/providers/readStageStream';
import { api, ClientError, connectSession, messageFrom } from '@/lib/api';

export async function executeStage(stage: StageName, signal: AbortSignal): Promise<StageOutput> {
  const store = useWorkspace.getState(); const checkpoint = store.checkpoint;
  if (!checkpoint) throw new Error('Workspace has not loaded.');
  const providerState = useProviders.getState();
  const connections = eligibleConnections(providerState.connections, providerState.primary, providerState.fallback, providerState.cooldowns);
  if (!connections.length) throw new Error('Connect an authorized provider, or wait for its cooldown before retrying.');
  await connectSession(signal);
  await api('/runs', { runId: checkpoint.runId, revision: checkpoint.revision }, signal);
  let last: unknown;
  for (const configured of connections) {
    const current = useWorkspace.getState().checkpoint;
    if (!current || current.runId !== checkpoint.runId || current.revision !== checkpoint.revision) throw new Error('A newer revision replaced this task.');
    const task = current.tasks.find(t => t.stage === stage);
    const attempt = (task?.attempt ?? 0) + 1;
    if (attempt > 3) throw new Error('Three attempts were used for this stage. Start a revision to retry; accepted work is preserved.');
    const connection: Connection = { provider: configured.provider, key: configured.key, model: configured.model, authorized: true };
    const request = stageRequestSchema.parse({ runId: current.runId, revision: current.revision, attempt, requestId: crypto.randomUUID(),
      stage, connection, brief: current.brief, settings: { ...current.settings, logo: undefined }, outline: current.outline,
      document: current.document, diagram: current.diagram, sources: current.sources });
    store.task(stage, { status: 'running', attempt, provider: connection.provider, model: connection.model, summary: 'Request sent. Waiting for validated output.', partial: '' });
    try {
      const latest = useWorkspace.getState().checkpoint;
      if (latest) await saveProject(latest).catch(() => store.setPersistenceError('Checkpoint storage failed. Export before leaving.'));
      const response = await api('/stages', request, AbortSignal.any([signal, AbortSignal.timeout(55000)]));
      const result = await readStageStream(response, request, partial => {
        const live = useWorkspace.getState().checkpoint;
        if (!signal.aborted && live?.runId === current.runId && live.revision === current.revision) store.task(stage, { partial, summary: 'Receiving output. It will be accepted after validation.' });
      });
      signal.throwIfAborted();
      const live = useWorkspace.getState().checkpoint;
      if (live?.runId !== current.runId || live.revision !== current.revision) throw new Error('A stale task result was rejected.');
      store.task(stage, { status: 'completed', summary: 'Validated output accepted for this request.', partial: '' });
      if (result.stage === 'planner') store.setOutline(result.output);
      if (result.stage === 'writer') store.patch({ document: result.output, review: undefined });
      if (result.stage === 'diagram') store.patch({ diagram: result.output, review: undefined });
      if (result.stage === 'reviewer') store.setReview(result.output);
      return result;
    } catch (error) {
      last = error;
      const latest = useWorkspace.getState().checkpoint;
      if (latest?.runId === current.runId && latest.revision === current.revision)
        store.task(stage, { status: signal.aborted ? 'cancelled' : 'failed', summary: messageFrom(error), partial: '' });
      if (signal.aborted) throw error;
      if (!(error instanceof ClientError) || !canFallback(error.details) || !providerState.fallback) throw error;
      const seconds = Math.max(error.details.retryAfter ?? 10, 2 ** attempt);
      providerState.cooldown(connection.provider, seconds);
      const next = connections[connections.indexOf(configured) + 1];
      if (next) store.message(`${connection.provider} could not finish (${error.details.code}). Switching ${stage} to your enabled ${next.provider}/${next.model}. Accepted work is preserved. ${connection.provider} cooldown: ${seconds}s.`);
    }
  }
  throw new Error(`Enabled fallback order exhausted. ${messageFrom(last)} Your accepted checkpoints are preserved.`);
}
