import { localDatabase as db } from './database';
import { checkpointSchema, newCheckpoint, resumeCheckpoint, type Checkpoint } from '@/domain/pipeline/checkpoint';
import { projectSchema, versionSchema } from '@/domain/projects/schema';

export const projectIdentity = (checkpoint: Checkpoint) => checkpoint.projectId ?? checkpoint.runId;
export async function saveProject(value: Checkpoint, makeCurrent = true) {
  const checkpoint = checkpointSchema.parse({ ...value, projectId: projectIdentity(value) });
  return db.transaction('rw', db.projects, db.checkpoints, async () => {
    const id = projectIdentity(checkpoint); const existing = await db.projects.get(id);
    if (existing && existing.updatedAt > checkpoint.updatedAt) throw new Error('A newer project is saved. Reopen it before editing; export this draft to preserve both.');
    const row = projectSchema.parse({ id, name: existing?.name ?? (checkpoint.document?.title ?? checkpoint.outline?.title ?? 'Untitled project').slice(0, 160),
      createdAt: existing?.createdAt ?? checkpoint.updatedAt, updatedAt: checkpoint.updatedAt, checkpoint });
    await db.projects.put(row); if (makeCurrent) await db.checkpoints.put({ id: 'current', data: checkpoint }); return row;
  });
}
export async function snapshotProject(checkpoint: Checkpoint, name: string) {
  return db.transaction('rw', db.versions, async () => {
    const projectId = projectIdentity(checkpoint);
    const last = await db.versions.where('[projectId+number]').between([projectId, 0], [projectId, 10000]).last();
    const version = versionSchema.parse({ id: crypto.randomUUID(), projectId, number: (last?.number ?? 0) + 1,
      name, createdAt: new Date().toISOString(), checkpoint: { ...checkpoint, projectId } });
    await db.versions.add(version); return version;
  });
}
export async function restoreVersion(id: string) {
  return db.transaction('rw', db.projects, db.versions, db.checkpoints, async () => {
    const version = await db.versions.get(id); if (!version) throw new Error('Version no longer exists.');
    const project = await db.projects.get(version.projectId); if (!project) throw new Error('Project no longer exists.');
    if (project.checkpoint.revision >= 1000) throw new Error('Revision limit reached. Duplicate or export this project first.');
    await snapshotProject(project.checkpoint, 'Before version restore');
    const checkpoint = { ...resumeCheckpoint(version.checkpoint), projectId: project.id, runId: crypto.randomUUID(),
      revision: project.checkpoint.revision + 1, review: undefined, updatedAt: new Date(Math.max(Date.now(), Date.parse(project.updatedAt) + 1)).toISOString(),
      tasks: version.checkpoint.tasks.map(task => ({ ...task, attempt: 0, partial: '' })) };
    await saveProject(checkpoint); return checkpoint;
  });
}
export async function duplicateProject(id: string) {
  const project = await db.projects.get(id); if (!project) throw new Error('Project no longer exists.');
  const checkpoint = { ...resumeCheckpoint(project.checkpoint), projectId: crypto.randomUUID(), runId: crypto.randomUUID(), updatedAt: new Date().toISOString() };
  const row = await saveProject(checkpoint, false); await db.projects.update(row.id, { name: `${project.name.slice(0, 150)} (copy)` }); return row;
}
export async function deleteProject(id: string) {
  await db.transaction('rw', db.projects, db.versions, db.files, db.checkpoints, async () => {
    await db.projects.delete(id); await db.versions.where('projectId').equals(id).delete(); await db.files.where('projectId').equals(id).delete();
    const rows = await db.checkpoints.toArray();
    for (const row of rows) if (projectIdentity(row.data) === id) await db.checkpoints.delete(row.id);
  });
}
export async function createProject(style: Parameters<typeof newCheckpoint>[0]) {
  const checkpoint = newCheckpoint(style); checkpoint.mode = 'document'; await saveProject(checkpoint); return checkpoint;
}
