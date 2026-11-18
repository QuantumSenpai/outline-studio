'use client';

import './playground.css';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useWorkspace } from '@/ui/stores/workspaceStore';
import { useProviders } from '@/ui/stores/providerStore';
import { useChat } from '@/ui/hooks/useChat';
import { usePipeline } from '@/ui/hooks/usePipeline';
import { type DocumentationSettings, type ChatAttachment, type ErrorData } from '@outline-studio/schemas';
import { intakeReply } from '@/domain/pipeline/intake';
import { Message } from './Message';
import { PlaygroundEmpty } from './PlaygroundEmpty';
import { PlaygroundAttachments } from './PlaygroundAttachments';
import { PlaygroundInput } from './PlaygroundInput';
import { api, connectSession, messageFrom } from '@/lib/api';
import { eligibleConnections, canFallback } from '@/adapters/providers/fallback';
import { chatHistory } from '@/domain/chat/history';
import { attachmentMeta, prepareAttachments } from '@/domain/chat/attachments';
import { readChatStream } from '@/adapters/providers/readChatStream';
import { chatRequestSchema } from '@outline-studio/schemas';

export default function PlaygroundPage() {
  const checkpoint = useWorkspace(state => state.checkpoint);
  const { patch, message } = useWorkspace();
  const providers = useProviders();
  const chat = useChat();
  const pipeline = usePipeline();
  const [docQuery, setDocQuery] = useState<DocumentationSettings>({ enabled: false, query: '', library: '' });
  const [inputError, setInputError] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [useImages] = useState(true);
  const [following, setFollowing] = useState(true);
  const [assistantMode, setAssistantMode] = useState(false);

  function sendChat(retry = false) {
    const store = useWorkspace.getState(); const original = store.checkpoint;
    if (!original || retry && !original.composer.trim()) return;
    const conns = eligibleConnections(providers.connections, providers.primary, providers.fallback, providers.cooldowns).slice(0, 3);
    if (!conns.length) { setInputError('Connect an authorized provider before chatting.'); return; }
    if (original.messages.length + (retry ? 1 : 2) > 200) { setInputError('This conversation is full. Export it or create a new project to continue.'); return; }
    const metas = attachments.map(attachmentMeta);
    const messages = retry ? original.messages : [...original.messages, { id: crypto.randomUUID(), role: 'user' as const, text: original.composer.trim(), attachments: metas }];
    if (messages.at(-1)?.role !== 'user') return;
    const controller = new AbortController(); const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]);
    const current = () => { const live = useWorkspace.getState().checkpoint; return !signal.aborted && live?.runId === original.runId && live.revision === original.revision && live.messages.at(-1)?.id === messages.at(-1)?.id; };
    store.patch({ messages, composer: retry ? original.composer : '' });
    connectSession(signal).then(() => {
      let fallbackNote = '';
      for (const [index, connection] of conns.entries()) {
        const latest = useProviders.getState();
        if (index && !latest.fallback || !latest.connections.some(item => item.validated && item.authorized && item.provider === connection.provider && item.key === connection.key && item.model === connection.model)) { setInputError('Provider authorization changed. Reconnect and retry.'); return; }
        try {
          const input = chatRequestSchema.parse({ requestId: crypto.randomUUID(), connection: { provider: connection.provider, model: connection.model, key: connection.key, authorized: true },
            messages: chatHistory(messages), documentation: docQuery.enabled ? docQuery : undefined, document: original.document,
            attachments: useImages ? attachments : attachments.filter(item => item.kind !== 'image') });
          api('/chat', input, signal).then(response => {
            readChatStream(response, input.requestId, text => { if (current()) chat.setPartial(text); }).then(result => {
              if (!current()) return;
              store.patch({ messages: [...messages, { id: crypto.randomUUID(), role: 'studio', text: result.text, documentation: { ...result.documentation, notice: [fallbackNote, result.documentation.notice].filter(Boolean).join(' ').slice(0, 500) || undefined } }] });
              setInputError(''); setAttachments([]);
            }).catch(failure => {
              if (signal.aborted || !(failure instanceof Error && 'details' in failure)) { if (!signal.aborted) setInputError(messageFrom(failure)); return; }
              const details = (failure as { details: { code: string; message: string; retryAfter?: number } }).details;
              const errorData = { code: details.code as ErrorData['code'], message: details.message, retryAfter: details.retryAfter };
              if (!canFallback(errorData) || !latest.fallback || index === conns.length - 1) { setInputError(messageFrom(failure)); return; }
              latest.cooldown(connection.provider, details.retryAfter ?? 10); chat.setPartial('');
              fallbackNote = `Used your enabled fallback from ${connection.provider} to ${conns[index + 1].provider} (${details.code}).`;
              setInputError(`${connection.provider} could not reply (${details.code}). Switching to your enabled ${conns[index + 1].provider} connection.`);
            });
          });
        } catch (failure) { if (controller.signal.aborted) setInputError(messageFrom(failure)); }
        finally { chat.setPartial(''); }
      }
    });
  }

  function addFiles(files: File[]) {
    Promise.all(files.map(fileToAttachment)).then(prepared => {
      setAttachments(current => [...current, ...prepared].slice(0, 6));
      setInputError('');
    }).catch(err => { setInputError(messageFrom(err)); });
  }
  function removeAttachment(id: string) { setAttachments(current => current.filter(item => item.id !== id)); }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragActive(true); }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragActive(false); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragActive(false); addFiles(Array.from(e.dataTransfer.files)); }

  useEffect(() => {
    if (dragActive) transcriptRef.current?.classList.add('drag-active');
    else transcriptRef.current?.classList.remove('drag-active');
  }, [dragActive]);

  function submit() {
    if (!checkpoint || (chat.busy || pipeline.busy) || !checkpoint.composer.trim()) return;
    setInputError('');
    if (checkpoint.mode === 'document') {
      const reply = intakeReply(checkpoint.composer);
      if (reply) {
        if (checkpoint.messages.length >= 199) return;
        setFollowing(true);
        message(checkpoint.composer.trim(), 'user'); message(reply); patch({ composer: '' });
      } else pipeline.plan().catch(error => message(messageFrom(error)));
    } else {
      sendChat();
    }
  }

  return <main className="playground-root">
    <div className="playground-transcript" ref={transcriptRef} onScroll={() => {
      const el = transcriptRef.current; if (!el) return;
      setFollowing(el.scrollHeight - el.scrollTop - el.clientHeight < 90);
    }} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {!checkpoint?.messages?.length && <PlaygroundEmpty onSelect={text => patch({ composer: text })} />}
      <div className="playground-messages" role="log" aria-live="polite">{checkpoint?.messages?.map(msg =>
        <Message key={msg.id} message={msg} isStreaming={false} />
      )}{chat.partial && <Message message={{ id: 'streaming', role: 'studio', text: chat.partial, attachments: [] }} isStreaming={true} />}</div>
      {checkpoint?.messages && checkpoint.messages.length > 0 && !following && <button className="playground-follow" onClick={() => { setFollowing(true); const el = transcriptRef.current; if (el) el.scrollTop = el.scrollHeight; }}>
        <ArrowDown size={14} /> Latest
      </button>}
    </div>

    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
      <PlaygroundAttachments attachments={attachments} onRemove={removeAttachment} />
      <div className="playground-mode-toggle">
        <input type="checkbox" id="assistant-mode" checked={assistantMode} onChange={e => setAssistantMode(e.target.checked)} />
        <span>Personal Assistant Mode</span>
        <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>{assistantMode ? 'Simple, conversational' : 'With docs & attachments'}</span>
      </div>
      <PlaygroundInput
        checkpoint={checkpoint}
        onSubmit={() => submit()}
        onCancel={() => { chat.cancel(); pipeline.cancel(); }}
        busy={chat.busy || pipeline.busy}
        docQuery={assistantMode ? { enabled: false, query: '', library: '' } : docQuery}
        setDocQuery={setDocQuery}
        onAddFiles={addFiles}
        chatError={chat.error}
        inputError={inputError}
        chat={chat}
      />
    </div>
  </main>;
}

const fileToAttachment = (file: File): Promise<ChatAttachment> => prepareAttachments([file]).then(arr => arr[0]);