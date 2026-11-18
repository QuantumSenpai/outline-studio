'use client';

import { useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { useChat } from '@/ui/hooks/useChat';
import { ModelSwitcher } from '@/ui/components/workspace/ModelSwitcher';
import { DocumentationOptions } from '@/ui/components/workspace/DocumentationOptions';
import { SuggestionPills } from '@/ui/components/workspace/SuggestionPills';
import type { DocumentationSettings } from '@outline-studio/schemas';

export function PlaygroundInput({ checkpoint, onSubmit, onCancel, busy, docQuery, setDocQuery, attachments, chatError, inputError, chat }: {
  checkpoint: { mode: 'chat' | 'document'; composer: string } | null;
  onSubmit: () => void;
  onCancel: () => void;
  busy: boolean;
  docQuery: DocumentationSettings;
  setDocQuery: (v: DocumentationSettings) => void;
  attachments: { name: string; size: number; id: string }[];
  chatError: string;
  inputError: string;
  chat: ReturnType<typeof useChat>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { patch } = useWorkspace();
  const attachmentList = attachments.length > 0 ? (
    <div className="playground-attachments">
      {attachments.map(item => <div key={item.id} className="playground-attachment">
        <span>{item.name}</span><span className="size">{(item.size / 1024).toFixed(0)} KB</span>
        <button onClick={() => {}} aria-label={`Remove ${item.name}`}><X size={14} /></button>
      </div>)}
    </div>
  ) : null;

  return (
    <div className="playground-composer">
      {attachmentList}
      <div className="playground-input-wrap">
      <div className="playground-input-row">
        <button className="playground-attach" onClick={() => fileInputRef.current?.click()} aria-label="Attach files"><Paperclip size={18} /></button>
        <textarea ref={el => chat.setTextarea(el)} value={checkpoint?.composer ?? ''} onChange={e => patch({ composer: e.target.value })} placeholder="Send a message…" rows={1} disabled={busy} onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSubmit(); }
        }} />
        <ModelSwitcher disabled={busy} />
      </div>
      {checkpoint?.mode === 'chat' && <DocumentationOptions value={docQuery} onChange={setDocQuery} disabled={busy} />}
      <div className="playground-actions">
        <SuggestionPills onSelect={text => patch({ composer: text })} disabled={busy} />
        <div className="playground-send-row">
          {(chatError || inputError) && <span className="playground-error" role="alert">{inputError || chatError}</span>}
          <button className="playground-send" onClick={onSubmit} disabled={!checkpoint?.composer.trim() || busy} aria-label="Send"><Send size={18} /></button>
          {busy && <button className="playground-stop" onClick={onCancel} aria-label="Stop"><X size={16} /></button>}
        </div>
      </div>
      <input ref={fileInputRef} type="file" multiple accept="image/*,.md,.markdown,.txt,.pdf,.docx" hidden onChange={() => { /* handled in parent */ }} />
    </div>
    </div>
  );
}