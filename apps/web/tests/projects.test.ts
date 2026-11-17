import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { localDatabase } from '@/adapters/storage/database';
import { newCheckpoint } from '@/domain/pipeline/checkpoint';
import { saveProject, snapshotProject, restoreVersion, duplicateProject, deleteProject } from '@/adapters/storage/projects';

afterEach(async () => { await localDatabase.projects.clear(); await localDatabase.versions.clear(); await localDatabase.files.clear(); await localDatabase.checkpoints.clear(); });
describe('local project history', () => {
  it('migrates v1 checkpoints and leaves the encrypted vault intact', async () => {
    await localDatabase.delete();
    const legacy = new Dexie('outline-studio'); legacy.version(1).stores({ checkpoints: 'id', vault: 'id' });
    const checkpoint = newCheckpoint(); delete checkpoint.projectId;
    await legacy.table('checkpoints').put({ id: 'current', data: checkpoint });
    await legacy.table('vault').put({ id: 'keys', data: { ciphertext: 'preserve-encrypted-record' } });
    legacy.close(); await localDatabase.open();
    expect((await localDatabase.projects.get(checkpoint.runId))?.checkpoint.brief).toBe(checkpoint.brief);
    expect((await localDatabase.vault.get('keys'))?.data).toEqual({ ciphertext: 'preserve-encrypted-record' });
  });
  it('preserves newer history when restoring an older version', async () => {
    const first = newCheckpoint(); first.brief = 'A report about coral reefs.';
    await saveProject(first);
    const version = await snapshotProject(first, 'First outline');
    const newer = { ...first, brief: 'A revised report about coral reefs.', revision: 3, updatedAt: new Date(Date.now() + 1).toISOString() };
    await saveProject(newer);
    await snapshotProject(newer, 'Newer draft');
    const restored = await restoreVersion(version.id);
    expect(restored.brief).toBe(first.brief);
    expect(restored.revision).toBeGreaterThan(newer.revision);
    expect(await localDatabase.versions.count()).toBe(3);
  });
  it('duplicates independently and only deletes the selected project', async () => {
    const checkpoint = newCheckpoint(); await saveProject(checkpoint);
    const copy = await duplicateProject(checkpoint.projectId!);
    expect(copy.id).not.toBe(checkpoint.projectId);
    await deleteProject(copy.id);
    expect(await localDatabase.projects.get(checkpoint.projectId!)).toBeDefined();
    expect(await localDatabase.projects.get(copy.id)).toBeUndefined();
  });
  it('rejects stale autosaves instead of silently overwriting a newer draft', async () => {
    const checkpoint = newCheckpoint(); await saveProject(checkpoint);
    const next = { ...checkpoint, brief: 'A newer accepted draft.', updatedAt: new Date(Date.now() + 100).toISOString() };
    await saveProject(next);
    await expect(saveProject(checkpoint)).rejects.toThrow(/newer/i);
    expect((await localDatabase.projects.get(checkpoint.projectId!))?.checkpoint.brief).toBe(next.brief);
  });
});
