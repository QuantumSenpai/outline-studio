import type { Checkpoint } from '@/domain/pipeline/checkpoint';
import { retainedFileSchema } from '@/domain/projects/schema';
import { projectIdentity, snapshotProject } from './projects';
import { localDatabase as db } from './database';

export async function retainDownload(checkpoint: Checkpoint, data: Uint8Array, name: string, mime: string) {
  const metadata = retainedFileSchema.parse({ id: crypto.randomUUID(), projectId: projectIdentity(checkpoint), runId: checkpoint.runId,
    revision: checkpoint.revision, name, mime, createdAt: new Date().toISOString() });
  if (data.byteLength > 12 * 1024 * 1024) throw new Error('Downloaded, but not retained: this file exceeds 12 MB. Keep the downloaded copy.');
  await db.transaction('rw', db.files, db.versions, async () => {
    const files = db.files.where('projectId').equals(metadata.projectId);
    if (await files.count() >= 100) throw new Error('Downloaded, but not retained: this project has 100 retained files. Keep your downloaded copy.');
    let size = data.byteLength; await files.each(file => { size += file.data.byteLength; });
    if (size > 50 * 1024 * 1024) throw new Error('Downloaded, but not retained: local files exceed 50 MB for this project. Keep the downloaded copy.');
    const version = await db.versions.where('projectId').equals(metadata.projectId).filter(version => version.checkpoint.runId === checkpoint.runId && version.checkpoint.revision === checkpoint.revision).first();
    if (!version) await snapshotProject(checkpoint, 'Accepted export revision');
    await db.files.add({ ...metadata, data: new Uint8Array(data) });
  });
}
