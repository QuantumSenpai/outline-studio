import JSZip from 'jszip';
import { localDatabase as db } from '../storage/database';
import { projectSchema, retainedFileSchema, versionSchema } from '@/domain/projects/schema';
import { resumeCheckpoint, type Checkpoint } from '@/domain/pipeline/checkpoint';
import { manifestSchema } from './archiveSchema';
import { archiveLimits, sha256 } from './zipSafety';
import { readProjectArchive } from './readArchive';

export async function exportProjectArchive(id: string) {
  const data = await db.transaction('r', db.projects, db.versions, db.files, async () => {
    const project = await db.projects.get(id); if (!project) throw new Error('Project no longer exists.');
    if (await db.versions.where('projectId').equals(id).count() > 1000) throw new Error('This archive supports up to 1000 snapshots. Export individual snapshots before reducing history.');
    return { project: projectSchema.parse(project), versions: await db.versions.where('projectId').equals(id).sortBy('number'), files: await db.files.where('projectId').equals(id).toArray() };
  });
  const zip = new JSZip(); const encoder = new TextEncoder(); let expanded = 0;
  const add = async (path: string, bytes: Uint8Array<ArrayBuffer>, maximum: number) => {
    expanded += bytes.byteLength;
    if (bytes.byteLength > maximum || expanded > archiveLimits.expanded) throw new Error('Project exceeds the 80 MB archive expansion limit. Export individual snapshots/files before reducing history.');
    zip.file(path, bytes, { createFolders: false }); return { path, hash: await sha256(bytes) };
  };
  const project = await add('project.json', encoder.encode(JSON.stringify(data.project)), 2000000);
  const versions = [];
  for (const [index, version] of data.versions.entries()) versions.push(await add(`versions/${index}.json`, encoder.encode(JSON.stringify(versionSchema.parse(version))), 2000000));
  const files = [];
  for (const file of data.files) {
    const { data: bytes, ...metadata } = file;
    files.push({ ...await add(`files/${file.id}/${file.name}`, bytes, archiveLimits.entry), metadata: retainedFileSchema.parse(metadata) });
  }
  const manifest = manifestSchema.parse({ format: 'outline-studio-project', version: 1, createdAt: new Date().toISOString(), project, versions, files });
  zip.file('manifest.json', JSON.stringify(manifest, null, 2), { createFolders: false });
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 3 } });
  if (bytes.byteLength > archiveLimits.compressed) throw new Error('Compressed project exceeds 25 MB. Export individual versions and files first.');
  return new Uint8Array(bytes);
}
function importedCheckpoint(checkpoint: Checkpoint, projectId: string) {
  const source = (item: Checkpoint['sources'][number]) => ({ ...item, verifiedMetadata: false });
  const data = resumeCheckpoint(checkpoint);
  return { ...data, projectId, sources: data.sources.map(source), document: data.document ? { ...data.document, references: data.document.references.map(source) } : undefined };
}
export async function importProjectArchive(bytes: Uint8Array) {
  const data = await readProjectArchive(bytes);
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  const highest = Math.max(data.project.checkpoint.revision, ...data.versions.map(version => version.checkpoint.revision));
  if (highest >= 1000) throw new Error('Imported revision limit reached. Export individual accepted files; this project cannot safely resume generation.');
  const checkpoint = { ...importedCheckpoint(data.project.checkpoint, id), runId: crypto.randomUUID(), revision: highest + 1, updatedAt: now };
  const project = projectSchema.parse({ ...data.project, id, name: `${data.project.name.slice(0, 145)} (imported)`, createdAt: now, updatedAt: now, checkpoint });
  const versions = data.versions.map(version => versionSchema.parse({ ...version, id: crypto.randomUUID(), projectId: id, checkpoint: importedCheckpoint(version.checkpoint, id) }));
  versions.push(versionSchema.parse({ id: crypto.randomUUID(), projectId: id, number: Math.max(0, ...versions.map(version => version.number)) + 1,
    name: 'Imported current draft', createdAt: now, checkpoint: importedCheckpoint(data.project.checkpoint, id) }));
  const files = data.files.map(file => ({ ...file, id: crypto.randomUUID(), projectId: id }));
  await db.transaction('rw', db.projects, db.versions, db.files, db.checkpoints, async () => {
    await db.projects.add(project); await db.versions.bulkAdd(versions); await db.files.bulkAdd(files);
    await db.checkpoints.put({ id: 'current', data: checkpoint });
  });
  return project;
}
