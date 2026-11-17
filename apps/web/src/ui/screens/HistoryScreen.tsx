'use client';

import Link from 'next/link';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { VersionHistory } from '../components/projects/VersionHistory';
import { useWorkspace } from '../stores/workspaceStore';
export function HistoryScreen({ projectId }: { projectId?: string }) {
  const loaded = useCheckpoint('academic', projectId);
  const error = useWorkspace(state => state.persistenceError);
  return <main id="main" className="page-container"><header className="page-heading"><h1>Your versions.</h1><p>Keep the work that led here. Restores preserve newer history.</p><Link className="text-link" href={projectId ? `/workspace?project=${projectId}` : '/workspace'}>Back to workspace</Link></header>
    {error && <p role="alert" className="notice error">{error}</p>}{loaded ? <VersionHistory /> : <p role="status">Opening local history…</p>}</main>;
}
