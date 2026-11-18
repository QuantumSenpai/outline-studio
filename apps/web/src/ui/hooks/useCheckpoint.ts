'use client';

import { useEffect, useState } from 'react';
import type { StyleId } from '@outline-studio/schemas';
import { localDatabase } from '@/adapters/storage/database';
import { saveProject } from '@/adapters/storage/projects';
import { newCheckpoint, resumeCheckpoint } from '@/domain/pipeline/checkpoint';
import { useWorkspace } from '../stores/workspaceStore';

export function useCheckpoint(style: StyleId, projectId?: string, fresh = false) {
  const { checkpoint, hydrated, hydrate, setPersistenceError, setSaveState } = useWorkspace();
  const [loaded, setLoaded] = useState('');
  const key = projectId ?? (fresh ? `new:${style}` : 'current');
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      const row = projectId ? await localDatabase.projects.get(projectId) : fresh ? undefined : await localDatabase.checkpoints.get('current');
      if (!active) return;
      if (projectId && !row) throw new Error('This project no longer exists. Open Projects or import a backup.');
      const data = row && ('checkpoint' in row ? row.checkpoint : row.data);
      const next = data ? resumeCheckpoint(data) : newCheckpoint(style);
      if (data && next.mode === 'document' && !next.outline && !next.document && !next.messages.length) next.mode = 'chat';
      if (!data && fresh) next.mode = 'document';
      await saveProject(next);
      if (!active) return;
      if (!projectId) window.history.replaceState(null, '', `/workspace?project=${next.projectId ?? next.runId}`);
      hydrate(next); setLoaded(key);
    }).catch(error => {
      if (!active) return;
      hydrate(newCheckpoint(style)); setLoaded(key); setSaveState('failed');
      setPersistenceError(error instanceof Error ? error.message : 'Local storage is unavailable. Export before leaving.');
    });
    return () => { active = false; const latest = useWorkspace.getState().checkpoint;
      if (latest) void saveProject(latest, false).catch(() => setPersistenceError('Could not save the project before navigation.')); };
  }, [style, projectId, fresh, key, hydrate, setPersistenceError, setSaveState]);
  useEffect(() => {
    if (loaded !== key || !hydrated || !checkpoint) return;
    setSaveState('saving');
    const timer = setTimeout(() => {
      void saveProject(checkpoint).then(() => {
        if (useWorkspace.getState().checkpoint?.updatedAt === checkpoint.updatedAt) { setSaveState('saved'); setPersistenceError(''); }
      }).catch(error => { setSaveState('failed'); setPersistenceError(error instanceof Error ? error.message : 'Saving failed. Export before leaving.'); });
    }, 180);
    return () => clearTimeout(timer);
  }, [checkpoint, hydrated, loaded, key, setSaveState, setPersistenceError]);
  return loaded === key;
}
