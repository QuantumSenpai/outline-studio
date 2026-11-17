'use client';

import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { localDatabase } from '@/adapters/storage/database';
import { projectIdentity, restoreVersion, saveProject, snapshotProject } from '@/adapters/storage/projects';
import { useWorkspace } from '../../stores/workspaceStore';
import { compareVersions } from '@/domain/projects/compare';
import { projectMarkdown } from '@/domain/projects/markdown';
import type { ProjectVersion } from '@/domain/projects/schema';
import { saveFile, filename } from '@/lib/download';
import { messageFrom } from '@/lib/api';
import { Button } from '../ui/button';
import { Modal } from '../ui/dialog';
import '@/ui/styles/projects.css';

export function VersionHistory() {
  const { checkpoint, hydrate } = useWorkspace();
  const [versions, setVersions] = useState<ProjectVersion[]>([]); const [selected, setSelected] = useState<ProjectVersion | null>(null);
  const [name, setName] = useState(''); const [page, setPage] = useState(0); const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false); const [confirm, setConfirm] = useState(false);
  const projectId = checkpoint ? projectIdentity(checkpoint) : '';
  useEffect(() => {
    if (!projectId) return;
    const subscription = liveQuery(() => localDatabase.versions.where('[projectId+number]').between([projectId, 0], [projectId, 10000]).reverse().offset(page * 20).limit(20).toArray())
      .subscribe({ next: setVersions, error: () => setStatus('Version history could not load. Export your current project before leaving.') });
    return () => subscription.unsubscribe();
  }, [projectId, page]);
  async function perform(work: () => Promise<void>) {
    setPending(true); setStatus(''); try { await work(); } catch (error) { setStatus(messageFrom(error)); } finally { setPending(false); }
  }
  if (!checkpoint) return null;
  const changes = selected ? compareVersions(selected.checkpoint, checkpoint) : [];
  return <section className="history-panel" aria-label="Local version history"><div><h2>Version history</h2><p className="muted">Named snapshots preserve your brief, conversation, accepted content, diagram, sources and settings. Restoring creates a new revision and keeps the current draft in history.</p></div>
    <div className="project-create"><label>Snapshot name<input value={name} onChange={event => setName(event.target.value)} maxLength={160} placeholder="Before final review" /></label>
      <Button disabled={pending || !name.trim()} onClick={() => void perform(async () => { await saveProject(checkpoint); const version = await snapshotProject(checkpoint, name); setSelected(version); setName(''); setStatus('Snapshot saved locally.'); })}>Save named snapshot</Button></div>
    {status && <p role="status" className="notice">{status}</p>}
    <div className="history-layout"><div><ul className="version-list">{versions.map(version => <li key={version.id}><button aria-pressed={selected?.id === version.id} onClick={() => setSelected(version)}>
      <strong>{version.name}</strong><small>Snapshot {version.number} · Revision {version.checkpoint.revision} · {new Date(version.createdAt).toLocaleString()}</small></button></li>)}</ul>
      {!versions.length && <p>No snapshots on this page. Save a named snapshot before major edits.</p>}
      <div className="button-row"><Button variant="outline" disabled={!page} onClick={() => setPage(value => value - 1)}>Newer snapshots</Button><Button variant="outline" disabled={versions.length < 20} onClick={() => setPage(value => value + 1)}>Older snapshots</Button></div></div>
      <div className="version-preview">{selected ? <><h2>{selected.name}</h2><p className="small muted">Preview and comparison are local. Markdown is regenerated from this snapshot, rather than a retained original file.</p>
        <div className="button-row"><Button variant="outline" onClick={() => saveFile(JSON.stringify(selected.checkpoint, null, 2), filename(selected.name, 'snapshot', 'json'), 'application/json')}>Download snapshot JSON</Button>
          <Button variant="outline" onClick={() => saveFile(projectMarkdown(selected.checkpoint), filename(selected.name, 'snapshot', 'md'), 'text/markdown')}>Download snapshot Markdown</Button>
          <Button disabled={pending} onClick={() => setConfirm(true)}>Restore as new revision</Button></div>
        <pre aria-label="Snapshot content preview">{projectMarkdown(selected.checkpoint)}</pre>
        <h3>Compared with current draft · {changes.length} changes</h3>{!changes.length && <p>Content, settings, sources and review match the current draft.</p>}
        <ul className="version-diff">{changes.map(change => <li key={change.field}><details><summary>{change.field}</summary><strong>Snapshot</strong><pre>{change.before}</pre><strong>Current draft</strong><pre>{change.after}</pre></details></li>)}</ul>
      </> : <p className="notice">Select a snapshot to preview its content and compare it with the current draft.</p>}</div></div>
    <Modal open={confirm} onOpenChange={setConfirm} title="Restore snapshot as a new revision" description="Your current draft will be saved as a snapshot first. Newer history stays intact. Restored output needs a fresh review before final document downloads.">
      <Button disabled={pending} onClick={() => void perform(async () => { if (!selected) return; const restored = await restoreVersion(selected.id); hydrate(restored); setConfirm(false); setStatus('Restored as a new revision. Newer snapshots were preserved.'); })}>Confirm restore</Button>
    </Modal>
  </section>;
}
