'use client';

import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import type { ChatAttachment } from '@outline-studio/schemas';

const ACCEPT = 'image/*,.md,.markdown,.txt,.pdf,.docx';

export function AttachmentPicker({ attachments, onAdd, onRemove, busy, useImages, onUseImages, preparing }: {
  attachments: ChatAttachment[]; onAdd: (files: File[]) => void; onRemove: (id: string) => void;
  busy: boolean; useImages: boolean; onUseImages: (value: boolean) => void; preparing: boolean;
}) {
  const files = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const locked = busy || preparing;
  const hasImages = attachments.some(item => item.kind === 'image');
  const pick = (input: HTMLInputElement | null) => { input?.click(); setOpen(false); };
  return <div className="attachments" data-dragging={dragging} data-open={open} onDragOver={event => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = locked ? 'none' : 'copy';
    setDragging(!locked);
  }} onDragLeave={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }} onDrop={event => {
    event.preventDefault(); event.stopPropagation(); setDragging(false);
    if (!locked && event.dataTransfer.files.length) onAdd(Array.from(event.dataTransfer.files));
  }}>
    <div className="attachment-actions">
      <button type="button" aria-label="Add attachment" aria-expanded={open} disabled={locked || attachments.length >= 6} onClick={() => setOpen(value => !value)}><Paperclip size={16} /> Attach</button>
      {open && <div className="attachment-menu" role="group" aria-label="Attachment options">
        <button type="button" disabled={locked} onClick={() => pick(files.current)}>Upload files</button><small>Images, text, PDF or DOCX. Up to 6 files, 4 MB each.</small>
        <button type="button" disabled={locked} onClick={() => pick(camera.current)}>Camera</button>
      </div>}
      <small aria-live="polite">{preparing ? 'Preparing files…' : dragging ? 'Release to attach' : ''}</small>
      <input ref={files} type="file" multiple accept={ACCEPT} hidden onChange={event => { onAdd(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={event => { onAdd(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    </div>
    {hasImages && <label className="check-label"><input type="checkbox" checked={useImages} disabled={locked} onChange={event => onUseImages(event.target.checked)} />Send images to the model (needs a vision-capable model)</label>}
    {attachments.length > 0 && <ul className="attachment-list">{attachments.map(item => <li key={item.id}>
      <span>{item.name}</span><small className="muted">{Math.ceil(item.size / 1024)} KB</small>
      <button type="button" aria-label={`Remove ${item.name}`} disabled={locked} onClick={() => onRemove(item.id)}><X size={15} /></button>
    </li>)}</ul>}
  </div>;
}
