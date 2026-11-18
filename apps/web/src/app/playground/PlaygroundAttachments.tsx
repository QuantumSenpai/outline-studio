'use client';

import { X } from 'lucide-react';
import type { ChatAttachment } from '@outline-studio/schemas';

export function PlaygroundAttachments({ attachments, onRemove }: { attachments: ChatAttachment[]; onRemove: (id: string) => void }) {
  return <div className="playground-attachments">
    {attachments.map(item => <div key={item.id} className="playground-attachment">
      <span>{item.name}</span><span className="size">{(item.size / 1024).toFixed(0)} KB</span>
      <button onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><X size={14} /></button>
    </div>)}
  </div>;
}