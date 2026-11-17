import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { localDatabase as db } from '@/adapters/storage/database';
import { saveProject, snapshotProject } from '@/adapters/storage/projects';
import { newCheckpoint } from '@/domain/pipeline/checkpoint';
import { exportProjectArchive, importProjectArchive } from '@/adapters/projects/archive';
import { retainDownload } from '@/adapters/storage/retainedFiles';
import { inspectZip } from '@/adapters/projects/zipSafety';

afterEach(async () => { await db.projects.clear(); await db.versions.clear(); await db.files.clear(); await db.checkpoints.clear(); });
describe('safe complete project archives', () => {
  it('round-trips conversation, versions and assets into a separate project without vault data', async () => {
    const checkpoint = newCheckpoint('solutions'); checkpoint.brief = 'Worked solutions about algebra and geometry.';
    checkpoint.composer = checkpoint.brief; checkpoint.messages = [{ id: 'message', role: 'user', text: checkpoint.brief }];
    const project = await saveProject(checkpoint); await snapshotProject(checkpoint, 'Original solutions');
    await retainDownload(checkpoint, new TextEncoder().encode('# Algebra and geometry'), 'solutions-report.md', 'text/markdown');
    await db.vault.put({ id: 'keys', data: { ciphertext: 'never-in-the-archive' } });
    const bytes = await exportProjectArchive(project.id); const zip = await JSZip.loadAsync(bytes);
    expect(await zip.file('project.json')?.async('string')).not.toContain('never-in-the-archive');
    const imported = await importProjectArchive(bytes);
    expect(imported.id).not.toBe(project.id); expect(imported.checkpoint.messages).toEqual(checkpoint.messages);
    expect(imported.checkpoint.settings.style).toBe('solutions'); expect(await db.versions.where('projectId').equals(imported.id).count()).toBe(2);
    expect(await db.projects.get(project.id)).toBeDefined();
    const files = await db.files.where('projectId').equals(imported.id).toArray();
    expect(new TextDecoder().decode(files[0].data)).toBe('# Algebra and geometry');
  });
  it('rejects corruption, traversal, expansion bombs and failed imports without modifying existing projects', async () => {
    const checkpoint = newCheckpoint(); const project = await saveProject(checkpoint);
    const bytes = await exportProjectArchive(project.id); const zip = await JSZip.loadAsync(bytes);
    zip.file('project.json', '{}');
    await expect(importProjectArchive(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow();
    const bad = new JSZip(); bad.file('../project.json', '{}', { createFolders: false });
    expect(() => inspectZip(new Uint8Array())).toThrow();
    await expect(importProjectArchive(await bad.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/paths/);
    const bomb = new JSZip(); bomb.file('project.json', new Uint8Array(13 * 1024 * 1024));
    await expect(importProjectArchive(await bomb.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }))).rejects.toThrow(/expansion/);
    expect(await db.projects.count()).toBe(1);
    expect((await db.projects.get(project.id))?.checkpoint).toEqual(checkpoint);
  });
});
