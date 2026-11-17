'use client';

import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import type { Checkpoint } from '@/domain/pipeline/checkpoint';
import type { RetainedFile } from '@/domain/projects/schema';
import { localDatabase } from '@/adapters/storage/database';
import { projectIdentity } from '@/adapters/storage/projects';
import { retainDownload } from '@/adapters/storage/retainedFiles';
import { downloadFormats, type DownloadFormat } from '@/adapters/renderers/downloadRevision';
import { saveFile } from '@/lib/download';
import { messageFrom } from '@/lib/api';
import { Button } from '../ui/button';

export function RevisionDownloads({ checkpoint }: { checkpoint: Checkpoint }) {
  const [files, setFiles] = useState<RetainedFile[]>([]); const [format, setFormat] = useState<DownloadFormat>('docx');
  const [pending, setPending] = useState(false); const [status, setStatus] = useState('');
  const id = projectIdentity(checkpoint);
  useEffect(() => {
    const subscription = liveQuery(() => localDatabase.files.where('projectId').equals(id)
      .filter(file => file.runId === checkpoint.runId && file.revision === checkpoint.revision).toArray())
      .subscribe({ next: setFiles, error: () => setStatus('Retained files could not be loaded. You can regenerate from this snapshot.') });
    return () => subscription.unsubscribe();
  }, [id, checkpoint.runId, checkpoint.revision]);
  return <section aria-label="Snapshot files"><h3>Snapshot files</h3><p className="small muted">Retained originals are downloaded byte-for-byte. Regeneration uses this snapshot with today&apos;s installed renderer and may differ in pagination. Review incomplete snapshots before final document downloads.</p>
    <ul>{files.map(file => <li key={file.id}><button className="text-link" onClick={() => saveFile(file.data, file.name, file.mime)}>Download retained {file.name}</button></li>)}</ul>
    {checkpoint.document && <div className="project-create"><label>Regenerate snapshot format<select value={format} onChange={event => setFormat(Object.keys(downloadFormats).find(key => key === event.target.value) as DownloadFormat ?? 'docx')}>
      {(Object.keys(downloadFormats) as DownloadFormat[]).map(key => <option key={key} value={key}>{downloadFormats[key].label}</option>)}</select></label>
      <Button variant="outline" disabled={pending || format !== 'md' && !checkpoint.review} aria-busy={pending} onClick={async () => {
        setPending(true); setStatus('');
        try {
          const output = await (await import('@/adapters/renderers/downloadRevision')).renderRevision(checkpoint, format);
          const name = saveFile(output.data, output.name, output.mime); setStatus('Snapshot file generated.');
          await retainDownload(checkpoint, output.data, name, output.mime);
        } catch (error) { setStatus(messageFrom(error)); } finally { setPending(false); }
      }}>{pending ? 'Regenerating snapshot…' : 'Regenerate snapshot file'}</Button></div>}
    {status && <p role="status" className="notice">{status}</p>}
  </section>;
}
