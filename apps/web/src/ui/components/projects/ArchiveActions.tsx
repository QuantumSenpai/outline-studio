'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveFile, filename } from '@/lib/download';
import { messageFrom } from '@/lib/api';
import { saveProject } from '@/adapters/storage/projects';
import type { Checkpoint } from '@/domain/pipeline/checkpoint';
import { Button } from '../ui/button';

export function ProjectBackup({ id, name, checkpoint }: { id: string; name: string; checkpoint?: Checkpoint }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  return <div><Button variant="outline" disabled={pending} aria-busy={pending} onClick={async () => {
    setPending(true); setError('');
    try {
      if (checkpoint) await saveProject(checkpoint);
      const bytes = await (await import('@/adapters/projects/archive')).exportProjectArchive(id);
      saveFile(bytes, filename(name, 'project', 'zip'), 'application/zip');
    } catch (error) { setError(messageFrom(error)); } finally { setPending(false); }
  }}>{pending ? 'Preparing project backup…' : 'Export complete project ZIP'}</Button>{error && <p role="alert" className="notice error">{error}</p>}</div>;
}
export function ProjectImport() {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  return <section aria-label="Import project backup"><label>Import complete project ZIP<input type="file" disabled={pending} accept="application/zip,.zip" onChange={async event => {
    const input = event.currentTarget; const file = input.files?.[0]; if (!file) return;
    setPending(true); setError('');
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('Choose a project ZIP under 25 MB.');
      const project = await (await import('@/adapters/projects/archive')).importProjectArchive(new Uint8Array(await file.arrayBuffer()));
      router.push(`/workspace?project=${project.id}`);
    } catch (error) { setError(`${messageFrom(error)} Existing projects were preserved.`); }
    finally { setPending(false); input.value = ''; }
  }} /></label><p className="small muted">Imports create a separate project and preserve current work. Up to 25 MB compressed / 80 MB expanded; credentials and vault secrets are excluded. Imported source metadata must be checked again. Retained files are downloaded, never executed or automatically opened.</p>
    {pending && <p role="status">Validating project backup…</p>}{error && <p role="alert" className="notice error">{error}</p>}</section>;
}
