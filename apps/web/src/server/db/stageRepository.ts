import { and, eq, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { StageRequest } from '@outline-studio/schemas';
import { database } from './client';
import { runs, stages } from './schema';
import { ApiError } from '../errors';

export async function openRun(id: string, runId: string, revision: number) {
  const db = database();
  const result = await db.insert(runs).values({ id: runId, owner: id, revision }).onConflictDoUpdate({
    target: runs.id, set: { revision, updatedAt: new Date() },
    setWhere: and(eq(runs.owner, id), sql`${runs.revision} <= ${revision}`),
  }).returning({ id: runs.id });
  if (!result.length) throw new ApiError('conflict', 'Run ownership or revision has changed. Start a new revision.', 409);
}
export async function acquireStage(id: string, request: StageRequest) {
  const db = database();
  const { connection, ...content } = request;
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...content,
    connection: { provider: connection.provider, model: connection.model } })).digest('hex');
  const results = await db.batch([
    db.execute(sql`select pg_advisory_xact_lock(hashtext(${request.runId}))`),
    db.execute(sql`insert into stages (request_id,run_id,revision,stage,attempt,fingerprint,status,provider,model)
      select ${request.requestId},${request.runId},${request.revision},${request.stage},${request.attempt},${fingerprint},'running',${connection.provider},${connection.model}
      where exists (select 1 from runs where id=${request.runId} and owner=${id} and revision=${request.revision})
      and (select count(*) from stages where run_id=${request.runId} and status='running' and started_at > now()-interval '60 seconds') < 2
      on conflict do nothing returning request_id`),
  ]);
  if (!results[1].rows.length) {
    const [existing] = await db.select({ status: stages.status, fingerprint: stages.fingerprint }).from(stages)
      .innerJoin(runs, eq(runs.id, stages.runId)).where(and(eq(stages.requestId, request.requestId), eq(runs.owner, id))).limit(1);
    if (existing?.fingerprint === fingerprint) throw new ApiError('uncertain', 'This request was already sent. Use its local checkpoint or retry explicitly with a new attempt; provider usage may have occurred.', 409);
    throw new ApiError('conflict', 'Stage attempt already exists, is stale, or concurrency is full. Resume the latest checkpoint or retry a new attempt.', 409);
  }
}
export async function finishStage(request: StageRequest, status: 'completed' | 'failed' | 'cancelled') {
  await database().update(stages).set({ status, endedAt: new Date() })
    .where(and(eq(stages.requestId, request.requestId), eq(stages.status, 'running')));
}
export async function currentRevision(id: string, request: StageRequest) {
  const [run] = await database().select({ revision: runs.revision }).from(runs)
    .where(and(eq(runs.id, request.runId), eq(runs.owner, id))).limit(1);
  if (run?.revision !== request.revision) throw new ApiError('conflict', 'A newer revision replaced this response. It was not accepted.', 409);
}
