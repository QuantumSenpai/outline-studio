import JSZip, { type JSZipObject } from 'jszip';
import { projectSchema, versionSchema } from '@/domain/projects/schema';
import { manifestSchema } from './archiveSchema';
import { validateArtifact } from './validateArtifact';
import { archiveLimits, inspectZip, sha256 } from './zipSafety';

async function boundedBytes(entry: JSZipObject, maximum: number) {
  return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const chunks: Uint8Array[] = []; let total = 0;
    const stream = entry.internalStream('uint8array');
    stream.on('data', chunk => {
      total += chunk.byteLength;
      if (total > maximum) { stream.pause(); reject(new Error('Archive entry expanded beyond its limit.')); return; }
      chunks.push(chunk);
    }).on('error', reject).on('end', () => {
      const data = new Uint8Array(total); let offset = 0;
      for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
      resolve(data);
    }).resume();
  });
}
export async function readProjectArchive(bytes: Uint8Array) {
  const names = inspectZip(bytes); const zip = await JSZip.loadAsync(bytes);
  const file = (path: string) => { const entry = zip.file(path); if (!entry || entry.unsafeOriginalName && entry.unsafeOriginalName !== path) throw new Error('An archive file is missing or renamed.'); return entry; };
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const manifest = manifestSchema.parse(JSON.parse(decoder.decode(await boundedBytes(file('manifest.json'), 256000))));
  const expected = new Set(['manifest.json', manifest.project.path, ...manifest.versions.map(entry => entry.path), ...manifest.files.map(entry => entry.path)]);
  if (expected.size !== 2 + manifest.versions.length + manifest.files.length || expected.size !== names.size || [...expected].some(name => !names.has(name))) throw new Error('Archive manifest and entries do not match.');
  let expanded = 0;
  const read = async (entry: { path: string; hash: string }, maximum: number) => {
    const data = await boundedBytes(file(entry.path), maximum); expanded += data.byteLength;
    if (expanded > archiveLimits.expanded || await sha256(data) !== entry.hash) throw new Error('Project archive is corrupt or exceeds its expansion limit.');
    return data;
  };
  const project = projectSchema.parse(JSON.parse(decoder.decode(await read(manifest.project, 2000000))));
  const versions = [];
  for (const entry of manifest.versions) versions.push(versionSchema.parse(JSON.parse(decoder.decode(await read(entry, 2000000)))));
  if (versions.some(version => version.projectId !== project.id || version.checkpoint.projectId && version.checkpoint.projectId !== project.id)
    || project.checkpoint.projectId && project.checkpoint.projectId !== project.id || new Set(versions.map(version => version.id)).size !== versions.length || new Set(versions.map(version => version.number)).size !== versions.length)
    throw new Error('Project and version identities are inconsistent.');
  const files = []; let retainedSize = 0;
  for (const entry of manifest.files) {
    const metadata = entry.metadata;
    if (metadata.projectId !== project.id) throw new Error('A retained file belongs to a different project.');
    const data = await read(entry, archiveLimits.entry); retainedSize += data.byteLength;
    if (retainedSize > 50 * 1024 * 1024) throw new Error('Retained files exceed the 50 MB per-project limit.');
    validateArtifact(metadata, data);
    if (metadata.mime === 'image/svg+xml') {
      const { default: DOMPurify } = await import('dompurify'); const raw = decoder.decode(data);
      if (typeof DOMPurify.sanitize !== 'function' || DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true }, FORBID_TAGS: ['script', 'foreignObject', 'image', 'a'] }) !== raw)
        throw new Error('An imported SVG contains unsupported or active content.');
    }
    files.push({ ...metadata, data });
  }
  if (new Set(files.map(file => file.id)).size !== files.length) throw new Error('Retained file identifiers are duplicated.');
  return { project, versions, files };
}
