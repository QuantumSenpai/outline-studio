'use client';

import { useState } from 'react';
import { checkpointSchema, newCheckpoint, resumeCheckpoint, type Checkpoint } from '@/domain/pipeline/checkpoint';
import { localDatabase } from '@/adapters/storage/database';
import { useProviders } from '../../stores/providerStore';
import { useWorkspace } from '../../stores/workspaceStore';
import { saveFile } from '@/lib/download';
import { api, messageFrom } from '@/lib/api';
import { Modal } from '../ui/dialog';
import { Button } from '../ui/button';

export function DataControls({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { checkpoint, hydrate } = useWorkspace(); const lock = useProviders(s => s.lock);
  const [status, setStatus] = useState(''); const [pending, setPending] = useState(false);
  const [archives, setArchives] = useState<Checkpoint[]>([]); const [confirm, setConfirm] = useState(false);
  async function serverData(remove: boolean) {
    setPending(true);
    try {
      const response = await api('/data', undefined, AbortSignal.timeout(15000), remove ? 'DELETE' : 'GET');
      if (!remove) saveFile(JSON.stringify(await response.json(), null, 2), 'outline-server-data.json', 'application/json');
      setStatus(remove ? 'Server data for this guest session was deleted. Existing local drafts are unchanged.' : 'Server feedback records exported. Run metadata is paginated through /api/runs.');
    } catch (error) { setStatus(messageFrom(error)); } finally { setPending(false); }
  }
  async function clearLocal() {
    if (!confirm) { setStatus('Select the confirmation checkbox first.'); return; }
    try {
      await localDatabase.transaction('rw', localDatabase.checkpoints, localDatabase.vault, async () => {
        await localDatabase.checkpoints.clear(); await localDatabase.vault.clear();
      });
      lock(); hydrate(newCheckpoint()); setArchives([]); setConfirm(false); setStatus('Local drafts, archives and encrypted vault deleted. Memory keys locked.');
    } catch (error) { setStatus(messageFrom(error)); }
  }
  return <Modal open={open} onOpenChange={onOpenChange} title="Your data, your controls" description="Project exports include local content and student details you entered. Provider keys and vault data are always excluded.">
    <div className="form-stack"><Button variant="outline" disabled={!checkpoint} onClick={() => {
      if (checkpoint) saveFile(JSON.stringify(checkpointSchema.parse(checkpoint), null, 2), 'outline-project.json', 'application/json');
    }}>Export local project</Button>
      <label>Import a project · replaces current view, keeps an archive<input type="file" accept="application/json,.json" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        try {
          if (file.size > 2000000) throw new Error('Choose a project under 2 MB.');
          const parsed = resumeCheckpoint(JSON.parse(await file.text()));
          if (checkpoint) await localDatabase.checkpoints.put({ id: `${checkpoint.runId}:${checkpoint.revision}`, data: checkpoint });
          hydrate({ ...parsed, runId: crypto.randomUUID(), revision: 1 }); setStatus('Imported locally. No keys were imported. Reconnect before generation.');
        } catch { setStatus('This file is not a compatible Outline Studio project. Current work was preserved.'); }
      }} /></label>
      <Button variant="outline" onClick={() => void localDatabase.checkpoints.toArray().then(rows => setArchives(rows.filter(r => r.id !== 'current').map(r => resumeCheckpoint(r.data)))).catch(error => setStatus(messageFrom(error)))}>Show local archives</Button>
      {archives.map((draft, index) => <button className="archive-item" key={`${draft.runId}:${draft.revision}:${index}`} onClick={async () => {
        if (checkpoint) await localDatabase.checkpoints.put({ id: `${checkpoint.runId}:${checkpoint.revision}`, data: checkpoint });
        hydrate(draft); setStatus('Local archive restored. Review before generating or downloading.');
      }}>{draft.document?.title ?? draft.outline?.title ?? draft.brief.slice(0, 90)}<small>Revision {draft.revision} · {new Date(draft.updatedAt).toLocaleDateString()}</small></button>)}
      <div className="button-row"><Button variant="outline" disabled={pending} onClick={() => void serverData(false)}>Export server feedback</Button><Button variant="outline" disabled={pending || !confirm} onClick={() => void serverData(true)}>Delete my server records</Button></div>
      <label className="check-label"><input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} />I understand deletion is irreversible for the selected local or server data.</label>
      <Button variant="outline" disabled={!confirm} onClick={() => void clearLocal()}>Delete local drafts, archives & vault</Button>
      <Button variant="outline" onClick={() => { lock(); setStatus('All session keys locked. Encrypted vault remains until deleted.'); }}>Lock session keys</Button>
      {status && <p className="notice" role="status">{status}</p>}</div>
  </Modal>;
}
