'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type ChatAttachment, type DocumentationQuery, chatRequestSchema } from '@outline-studio/schemas';
import { useWorkspace } from '../stores/workspaceStore';
import { useProviders } from '../stores/providerStore';
import { eligibleConnections, canFallback } from '@/adapters/providers/fallback';
import { chatHistory } from '@/domain/chat/history';
import { attachmentMeta, prepareAttachments } from '@/domain/chat/attachments';
import { readChatStream } from '@/adapters/providers/readChatStream';
import { api, ClientError, connectSession, messageFrom } from '@/lib/api';

export function useChat() {
  const checkpoint = useWorkspace(state => state.checkpoint);
  const request = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false); const [partial, setPartial] = useState(''); const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]); const [useImages, setUseImages] = useState(true); const [preparing, setPreparing] = useState(false);
  const cancel = useCallback(() => {
    if (!request.current) return;
    request.current.abort(); request.current = null; setPending(false); setPartial('');
    setError('Reply stopped. Your message is saved. Provider usage may still apply.');
  }, []);
  useEffect(() => () => cancel(), [checkpoint?.runId, checkpoint?.revision, cancel]);
  async function addFiles(files: File[]) {
    setPreparing(true);
    try { const prepared = await prepareAttachments(files); setAttachments(current => [...current, ...prepared].slice(0, 6)); setError(''); }
    catch (failure) { setError(messageFrom(failure)); }
    finally { setPreparing(false); }
  }
  function removeAttachment(id: string) { setAttachments(current => current.filter(item => item.id !== id)); }
  async function send(documentation?: DocumentationQuery, retry = false) {
    const store = useWorkspace.getState(); const original = store.checkpoint;
    if (!original || request.current || !retry && !original.composer.trim()) return;
    const provider = useProviders.getState(); const connections = eligibleConnections(provider.connections, provider.primary, provider.fallback, provider.cooldowns).slice(0, 3);
    if (!connections.length) { setError('Connect an authorized provider before chatting.'); return; }
    if (original.messages.length + (retry ? 1 : 2) > 200) { setError('This conversation is full. Export it or create a new project to continue.'); return; }
    const metas = attachments.map(attachmentMeta);
    const messages = retry ? original.messages : [...original.messages, { id: crypto.randomUUID(), role: 'user' as const, text: original.composer.trim(), attachments: metas }];
    if (messages.at(-1)?.role !== 'user') return;
    const controller = new AbortController(); request.current = controller; setPending(true); setError(''); setPartial('');
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]);
    const current = () => { const live = useWorkspace.getState().checkpoint; return !signal.aborted && request.current === controller && live?.runId === original.runId && live.revision === original.revision && live.messages.at(-1)?.id === messages.at(-1)?.id; };
    try {
      store.patch({ messages, composer: retry ? original.composer : '' });
      await connectSession(signal);
      let fallbackNote = '';
      for (const [index, connection] of connections.entries()) {
        const latest = useProviders.getState();
        if (index && !latest.fallback || !latest.connections.some(item => item.validated && item.authorized && item.provider === connection.provider && item.key === connection.key && item.model === connection.model)) throw new Error('Provider authorization changed. Reconnect and retry.');
        try {
          const input = chatRequestSchema.parse({ requestId: crypto.randomUUID(), connection: { provider: connection.provider, model: connection.model, key: connection.key, authorized: true },
            messages: chatHistory(messages), documentation, document: original.document,
            attachments: useImages ? attachments : attachments.filter(item => item.kind !== 'image') });
          const response = await api('/chat', input, signal); let at = 0;
          const result = await readChatStream(response, input.requestId, text => {
            if (current() && performance.now() - at > 80) { at = performance.now(); setPartial(text); }
          });
          if (!current()) return;
          store.patch({ messages: [...messages, { id: crypto.randomUUID(), role: 'studio', text: result.text, documentation: { ...result.documentation, notice: [fallbackNote, result.documentation.notice].filter(Boolean).join(' ').slice(0, 500) || undefined } }] });
          setError(''); setAttachments([]);
          return;
        } catch (failure) {
          if (signal.aborted || !(failure instanceof ClientError) || !canFallback(failure.details) || !useProviders.getState().fallback || index === connections.length - 1) throw failure;
          provider.cooldown(connection.provider, failure.details.retryAfter ?? 10); setPartial('');
          fallbackNote = `Used your enabled fallback from ${connection.provider} to ${connections[index + 1].provider} (${failure.details.code}).`;
          setError(`${connection.provider} could not reply (${failure.details.code}). Switching to your enabled ${connections[index + 1].provider} connection.`);
        }
      }
    } catch (failure) { if (request.current === controller) setError(messageFrom(failure)); }
    finally { if (request.current === controller) { request.current = null; setPending(false); setPartial(''); } }
  }
  function setTextarea(el: HTMLTextAreaElement | null) { textareaRef.current = el; }
  return { busy: pending, partial, error: error || '', send, cancel, attachments, addFiles, removeAttachment, useImages, setUseImages, preparing, setTextarea, setPartial, chatError: error };
}
