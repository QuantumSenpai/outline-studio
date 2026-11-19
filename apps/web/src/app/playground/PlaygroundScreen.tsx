'use client';

import './playground.css';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { useProviders } from '@/ui/stores/providerStore';
import { useCheckpoint } from '@/ui/hooks/useCheckpoint';
import { ProviderSetup } from '@/ui/components/workspace/ProviderSetup';
import { useChat } from '@/ui/hooks/useChat';
import { usePipeline } from '@/ui/hooks/usePipeline';
import type { DocumentationSettings } from '@outline-studio/schemas';
import { intakeReply } from '@/domain/pipeline/intake';
import { Message } from './Message';
import { PlaygroundEmpty } from './PlaygroundEmpty';
import Link from 'next/link';
import { PlaygroundInput } from './PlaygroundInput';
import { messageFrom } from '@/lib/api';

export function PlaygroundScreen({ projectId }: { projectId?: string }) {
  const loaded = useCheckpoint('academic', projectId);
  const [assistantMode, setAssistantMode] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const checkpoint = useWorkspace(state => state.checkpoint);
  const { patch, message, saveState, persistenceError } = useWorkspace();
  const providers = useProviders();
  const chat = useChat({ attachmentsEnabled: !assistantMode });
  const pipeline = usePipeline();
  const [docQuery, setDocQuery] = useState<DocumentationSettings>({ enabled: false, query: '', library: '' });
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [following, setFollowing] = useState(true);

  function addFiles(files: File[]) {
    if (!assistantMode && !chat.busy && !pipeline.busy && !chat.preparing) void chat.addFiles(files);
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragActive(!assistantMode && !chat.busy && !pipeline.busy && e.dataTransfer.types.includes('Files')); }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragActive(false); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragActive(false); addFiles(Array.from(e.dataTransfer.files)); }

  useEffect(() => {
    const element = transcriptRef.current;
    if (element && checkpoint?.messages.length && following && !window.getSelection()?.toString()) element.scrollTop = element.scrollHeight;
  }, [checkpoint?.messages.length, chat.partial, following]);

  function submit() {
    if (!checkpoint || (chat.busy || pipeline.busy || chat.preparing) || !checkpoint.composer.trim()) return;
    if (checkpoint.mode === 'document') {
      const reply = intakeReply(checkpoint.composer);
      if (reply) {
        if (checkpoint.messages.length >= 199) return;
        setFollowing(true);
        message(checkpoint.composer.trim(), 'user'); message(reply); patch({ composer: '' });
      } else pipeline.plan().catch(error => message(messageFrom(error)));
    } else {
      void chat.send(!assistantMode && docQuery.enabled ? { query: docQuery.query, library: docQuery.library } : undefined);
    }
  }

  if (!loaded || !checkpoint) return <main id="main" className="page-container empty-page" aria-busy="true"><h1>Opening playground.</h1><p>Loading local drafts and checkpoints…</p></main>;

  return <main id="main" className="playground-root">
    <ProviderSetup open={providerOpen} onOpenChange={setProviderOpen} />
      <header className="workspace-toolbar"><Link href="/" className="chat-brand">Outline Studio</Link>
        <Link className="text-link" href={`/workspace?project=${checkpoint.projectId ?? checkpoint.runId}`}>Full workspace</Link>
        <span role="status">{saveState === 'saved' ? 'Saved on this device' : saveState === 'failed' ? 'Not saved · export a backup' : 'Saving locally…'}</span>
        <button onClick={() => setProviderOpen(true)} disabled={chat.busy || pipeline.busy}>{providers.primary ? `${providers.primary} connected` : 'Connect AI'}</button>
      </header>
    <div className={`playground-transcript${dragActive ? ' drag-active' : ''}`} ref={transcriptRef} onScroll={() => {
      const el = transcriptRef.current; if (!el) return;
      setFollowing(el.scrollHeight - el.scrollTop - el.clientHeight < 90);
    }} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {dragActive && <p role="status" className="drop-notice">Release to attach files</p>}
      {persistenceError && <p role="alert">{persistenceError}</p>}
      {!checkpoint?.messages?.length && <PlaygroundEmpty onSelect={text => patch({ composer: text })} />}
      <div className="playground-messages" role="log" aria-live="polite">{checkpoint?.messages?.map(msg =>
        <Message key={msg.id} message={msg} isStreaming={false} />
      )}{chat.partial && <Message message={{ id: 'streaming', role: 'studio', text: chat.partial, attachments: [] }} isStreaming={true} />}</div>
      {checkpoint?.messages && checkpoint.messages.length > 0 && !following && <button className="playground-follow" onClick={() => { setFollowing(true); const el = transcriptRef.current; if (el) el.scrollTop = el.scrollHeight; }}>
        <ArrowDown size={14} /> Latest
      </button>}
    </div>

    <div className="playground-dock">

      <div className="playground-mode-toggle">
        <input type="checkbox" id="assistant-mode" checked={assistantMode} disabled={chat.busy || pipeline.busy} onChange={e => setAssistantMode(e.target.checked)} />
        <label htmlFor="assistant-mode">Personal Assistant Mode</label>
        <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>{assistantMode ? 'Simple, conversational' : 'With docs & attachments'}</span>
      </div>
      {!chat.busy && checkpoint.mode === 'chat' && checkpoint.messages.at(-1)?.role === 'user' && <button className="text-link" onClick={() => void chat.send(undefined, true)}>Retry saved message</button>}
      <PlaygroundInput
        checkpoint={checkpoint}
        onSubmit={() => submit()}
        onCancel={chat.busy ? chat.cancel : pipeline.cancel}
        busy={chat.busy || pipeline.busy}
        docQuery={docQuery}
        assistantMode={assistantMode}
        setDocQuery={setDocQuery}
        onAddFiles={addFiles}
        chatError={chat.error}
        chat={chat}
      />
    </div>
  </main>;
}
