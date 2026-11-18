'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { ChatAttachment } from '@outline-studio/schemas';

const ACCEPT = 'image/*,.md,.markdown,.txt,.pdf,.docx';

export function AttachmentPicker({ attachments, onAdd, onRemove, busy, useImages, onUseImages, preparing }: {
  attachments: ChatAttachment[]; onAdd: (files: File[]) => void; onRemove: (id: string) => void;
  busy: boolean; useImages: boolean; onUseImages: (value: boolean) => void; preparing: boolean;
}) {
  const files = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const hasImages = attachments.some(item => item.kind === 'image');
  const pick = (input: HTMLInputElement | null) => { input?.click(); setOpen(false); };
  return <div className="attachments">
    <div className="attachment-actions">
      <button type="button" aria-label="Add attachment" aria-expanded={open} disabled={busy || attachments.length >= 6} onClick={() => setOpen(value => !value)}><Plus size={16} /></button>
      {open && <div className="attachment-menu" role="group" aria-label="Attachment options">
        <button type="button" disabled={busy} onClick={() => pick(files.current)}>Upload files</button>
        <button type="button" disabled={busy} onClick={() => pick(camera.current)}>Camera</button>
      </div>}
      {preparing && <span className="upload-progress" role="status" aria-label="Preparing attachment"><span /></span>}
      <input ref={files} type="file" multiple accept={ACCEPT} hidden onChange={event => { onAdd(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={event => { onAdd(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    </div>
    {hasImages && <label className="check-label"><input type="checkbox" checked={useImages} disabled={busy} onChange={event => onUseImages(event.target.checked)} />Send images to the model (needs a vision-capable model)</label>}
    {attachments.length > 0 && <ul className="attachment-list">{attachments.map(item => <li key={item.id}>
      <span>{item.name}</span><small className="muted">{Math.ceil(item.size / 1024)} KB</small>
      <button type="button" aria-label={`Remove ${item.name}`} disabled={busy} onClick={() => onRemove(item.id)}>×</button>
    </li>)}</ul>}
  </div>;
}
