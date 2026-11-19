'use client';

import { AttachmentPicker } from '@/ui/components/workspace/AttachmentPicker';
import { Send, X } from 'lucide-react';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { useChat } from '@/ui/hooks/useChat';
import { ModelSwitcher } from '@/ui/components/workspace/ModelSwitcher';
import { DocumentationOptions } from '@/ui/components/workspace/DocumentationOptions';

import type { DocumentationSettings } from '@outline-studio/schemas';

export function PlaygroundInput({ checkpoint, onSubmit, onCancel, busy, docQuery, setDocQuery, onAddFiles, chatError, chat, assistantMode }: {
  assistantMode: boolean;
  checkpoint: { mode: 'chat' | 'document'; composer: string } | null;
  onSubmit: () => void;
  onCancel: () => void;
  busy: boolean;
  docQuery: DocumentationSettings;
  setDocQuery: (v: DocumentationSettings) => void;
  onAddFiles: (files: File[]) => void;
  chatError: string;
  chat: ReturnType<typeof useChat>;
}) {

  const patch = useWorkspace(state => state.patch);

  return (
    <div className="playground-composer">
      <div className="playground-input-wrap">
        <div className="playground-input-row">
        <textarea ref={el => chat.setTextarea(el)} value={checkpoint?.composer ?? ''} onChange={e => patch({ composer: e.target.value })} placeholder="Send a message…" rows={2} maxLength={12000} aria-label="Your message" disabled={busy || !checkpoint} onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSubmit(); }
        }} />

      </div>
      <ModelSwitcher disabled={busy} />
      {!assistantMode && <AttachmentPicker attachments={chat.attachments} onAdd={onAddFiles} onRemove={chat.removeAttachment} busy={busy}
        useImages={chat.useImages} onUseImages={chat.setUseImages} preparing={chat.preparing} />}
      {!assistantMode && checkpoint?.mode === 'chat' && <DocumentationOptions value={docQuery} onChange={setDocQuery} disabled={busy} />}
      <div className="playground-actions">

        <div className="playground-send-row">
          {chatError && <span className="playground-error" role="alert">{chatError}</span>}
          <button className="playground-send" onClick={onSubmit} disabled={!checkpoint?.composer.trim() || busy || chat.preparing} aria-label="Send"><Send size={18} /></button>
          {busy && <button className="playground-stop" onClick={onCancel} aria-label="Stop"><X size={16} /></button>}
        </div>
      </div>
    </div>
    </div>
  );
}