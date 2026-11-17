'use client';

import { useEffect, useRef } from 'react';
import type { StyleId } from '@outline-studio/schemas';
import { localDatabase } from '@/adapters/storage/database';
import { checkpointSchema, newCheckpoint, resumeCheckpoint } from '@/domain/pipeline/checkpoint';
import { useWorkspace } from '../stores/workspaceStore';

export function useCheckpoint(style: StyleId) {
  const { checkpoint, hydrated, hydrate, setPersistenceError } = useWorkspace();
  const initialStyle = useRef(style);
  useEffect(() => {
    let active = true;
    void localDatabase.checkpoints.get('current').then(row => {
      if (active) hydrate(row ? resumeCheckpoint(row.data) : newCheckpoint(initialStyle.current));
    }).catch(() => {
      if (!active) return;
      hydrate(newCheckpoint(initialStyle.current));
      setPersistenceError('Local storage is unavailable or incompatible. Export a project before leaving; automatic saving is not available.');
    });
    return () => { active = false; };
  }, [hydrate, setPersistenceError]);
  useEffect(() => {
    if (!hydrated || !checkpoint) return;
    const timer = setTimeout(() => {
      void localDatabase.checkpoints.put({ id: 'current', data: checkpointSchema.parse(checkpoint) })
        .catch(() => setPersistenceError('Could not save the latest checkpoint. Export your project before leaving.'));
    }, 180);
    return () => clearTimeout(timer);
  }, [checkpoint, hydrated, setPersistenceError]);
}
