'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Square } from 'lucide-react';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';
import { OutlineReview } from './OutlineReview';
import { Completion } from './Completion';
import { intakeReply } from '@/domain/pipeline/intake';
import { documentationQuerySchema, type ChatAttachment, type DocumentationQuery } from '@outline-studio/schemas';
import { DocumentationOptions, type DocumentationSettings } from './DocumentationOptions';
import { AttachmentPicker } from './AttachmentPicker';
import { ModelSwitcher } from './ModelSwitcher';
import { SuggestionPills } from './SuggestionPills';
import { ChatText } from './ChatText';
import { useConversationMotion } from '../../hooks/useConversationMotion';
import { SelectionIndicator } from './SelectionIndicator';

export function Conversation({ busy, onPlan, onCancel, onAccept, onReview, onResume, onChat, chatPartial, chatError, attachments, onAddFiles, onRemoveAttachment, useImages, onUseImages, preparing, chat }:
  { busy: boolean; onPlan: () => void; onCancel: () => void; onAccept: () => void; onReview: () => void; onResume: () => void; openProvider: () => void; onChat: (documentation?: DocumentationQuery, retry?: boolean) => void; chatPartial: string; chatError: string; attachments: ChatAttachment[]; onAddFiles: (files: File[]) => void; onRemoveAttachment: (id: string) => void; useImages: boolean; onUseImages: (value: boolean) => void; preparing: boolean; chat: ReturnType<typeof import('@/ui/hooks/useChat').useChat> }) {
  const { checkpoint, patch, setTab, message } = useWorkspace();
  const [documentation, setDocumentation] = useState<DocumentationSettings>({ enabled: false, query: '', library: '' });
  const [dragging, setDragging] = useState(false);
  const [inputError, setInputError] = useState('');
  const transcript = useRef<HTMLDivElement>(null);
  const motionRoot = useRef<HTMLDivElement>(null);
  useConversationMotion(motionRoot, Boolean(checkpoint), Boolean(checkpoint?.messages.length));
  const following = useRef(true); const [atBottom, setAtBottom] = useState(true);
  useEffect(() => {
    const element = transcript.current;
    if (following.current && element && (checkpoint?.messages.length || checkpoint?.outline || checkpoint?.review || busy)) element.scrollTop = element.scrollHeight;
  }, [checkpoint?.messages.length, checkpoint?.outline, checkpoint?.review, busy, chatPartial]);
  if (!checkpoint) return null;
  function submit() {
    if (!checkpoint || preparing || busy || !checkpoint.composer.trim()) return;
    setInputError('');
    if (checkpoint.mode === 'chat') {
      const parsed = documentation.enabled ? documentationQuerySchema.safeParse({ query: documentation.query, library: documentation.library }) : null;
      if (parsed && !parsed.success) { setInputError(parsed.error.issues[0]?.message ?? 'Check the documentation question.'); return; }
      following.current = true; onChat(parsed?.success ? parsed.data : undefined); return;
    }
    const reply = intakeReply(checkpoint.composer);
    if (reply) {
      if (checkpoint.messages.length >= 199) return;
      following.current = true;
      message(checkpoint.composer.trim(), 'user'); message(reply); patch({ composer: '' });
    } else onPlan();
  }
  const showResume = checkpoint.outlineAccepted && (!checkpoint.document || !checkpoint.diagram);
  return <div ref={motionRoot} className="conversation-pane" data-dragging={dragging} onDragOver={event => {
    if (checkpoint.mode !== 'chat' || busy || preparing || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault(); setDragging(true);
  }} onDragLeave={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }} onDrop={event => {
    event.preventDefault(); setDragging(false);
    if (checkpoint.mode === 'chat' && !busy && !preparing) onAddFiles(Array.from(event.dataTransfer.files));
  }}><div className="transcript" ref={transcript} onScroll={() => {
    const element = transcript.current; if (!element) return;
    following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 90; setAtBottom(following.current);
  }}>{!checkpoint.messages.length && <div className="conversation-intro">    <h2>{checkpoint.mode === 'chat' ? 'What’s on your mind?' : checkpoint.brief ? 'Your document, in motion.' : 'What are we making?'}</h2>
    <p>{checkpoint.mode === 'chat' ? 'Explore an idea, ask a question or work through a problem.' : 'Describe your topic and requirements to start an outline.'}</p></div>}
    {checkpoint.messages.length >= 199 && <p role="status" className="notice">{checkpoint.mode === 'chat' ? 'This conversation is full. Export a backup from History and create a new project to continue.' : 'This conversation is full. Send a detailed document request to archive it and start fresh, or export a backup from History.'}</p>}
    <div className="messages" role="log" aria-label="Main conversation" aria-live="polite">{checkpoint.messages.map(message =>
      <article key={message.id} className={`message ${message.role}`}><strong>{message.role === 'user' ? 'You' : 'Outline Studio'}</strong><ChatText text={message.text} />{message.attachments?.length ? <ul className="message-attachments">{message.attachments.map(item => <li key={item.id}><span>{item.name}</span>{item.text && <details><summary>Read text</summary><pre>{item.text}</pre></details>}</li>)}</ul> : null}{message.documentation && <><p className="small muted">{message.documentation.notice}</p>{message.documentation.sources.length > 0 && <details><summary>Context7 documentation sources</summary><ol>{message.documentation.sources.map((source, index) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">[{index + 1}] {source.title}</a></li>)}</ol></details>}</>}</article>)}</div>
    {checkpoint.mode === 'document' && checkpoint.outline && <OutlineReview busy={busy} onAccept={onAccept} />}
    {checkpoint.mode === 'document' && showResume && !busy && <div className="notice"><p>Accepted outputs have been kept. Retry only the unfinished coworkers.</p><Button variant="outline" onClick={onResume}>Resume unfinished tasks</Button></div>}
    {checkpoint.mode === 'document' && checkpoint.document && checkpoint.diagram && !checkpoint.review && <div className="notice"><p>Your draft and diagram are ready for inspection. Edit them in the document view, then run review.</p><div className="button-row">
      <Button variant="outline" onClick={() => setTab('document')}>Inspect & edit</Button><Button disabled={busy} onClick={onReview}>Review against requirements</Button></div></div>}
    {checkpoint.mode === 'document' && checkpoint.review && <Completion onRevise={() => setTab('document')} />}
    {chatPartial && <article className="message studio" data-streaming="true" aria-label="Reply in progress"><ChatText text={chatPartial} /><small>Reply in progress · not saved until complete</small></article>}
    {busy && <div role="status" className="working-status"><span className="status-dot running" />{checkpoint.mode === 'chat' ? 'Assistant is replying…' : 'Coworkers are working. Open a task to see its status.'}</div>}
  </div>{checkpoint.messages.length > 0 && !atBottom && <button className="follow-button" onClick={() => { following.current = true; setAtBottom(true); if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }}>Latest messages <ArrowDown size={14} /></button>}
    {(chatError || inputError) && <p className="notice error" role="alert">{inputError || chatError}</p>}
    {checkpoint.mode === 'chat' && !busy && checkpoint.messages.at(-1)?.role === 'user' && <button className="text-link chat-retry" onClick={() => onChat(undefined, true)}>Retry saved message</button>}
    <form className="composer" onSubmit={e => { e.preventDefault(); submit(); }}><label htmlFor="brief-composer" className="sr-only">Your document request</label>
      <div className="composer-top"><div className="conversation-mode" role="group" aria-label="Conversation mode"><SelectionIndicator value={checkpoint.mode} />{(['chat', 'document'] as const).map(mode => <button key={mode} type="button" aria-pressed={checkpoint.mode === mode} disabled={busy} onClick={() => { patch({ mode }); setInputError(''); }}>{mode === 'chat' ? 'Chat' : 'Create document'}</button>)}</div>
        <ModelSwitcher disabled={busy} /></div>
      <textarea id="brief-composer" value={checkpoint.composer} onChange={e => patch({ composer: e.target.value })} rows={2} maxLength={12000}
        placeholder="Send a message or describe your document…" disabled={busy} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
        }} ref={el => chat?.setTextarea?.(el)} />
      {checkpoint.mode === 'chat' && <><AttachmentPicker attachments={attachments} onAdd={onAddFiles} onRemove={onRemoveAttachment} busy={busy} useImages={useImages} onUseImages={onUseImages} preparing={preparing} />
        <DocumentationOptions value={documentation} onChange={setDocumentation} disabled={busy} /></>}
      <div className="composer-bottom">{checkpoint.mode === 'document' && <span>Local drafts · {checkpoint.composer.length.toLocaleString()} / 12,000</span>}{busy ? <Button type="button" variant="outline" onClick={onCancel}><Square size={14} /> Stop</Button>
        : <Button aria-label="Send message" type="submit" disabled={preparing || !checkpoint.composer.trim() || checkpoint.messages.length >= 199 && (checkpoint.mode === 'chat' || Boolean(intakeReply(checkpoint.composer)))}><span className="sr-only">Send message</span><ArrowUp size={16} /></Button>}</div>
    </form>{checkpoint.mode === 'chat' && <SuggestionPills onSelect={text => patch({ composer: text })} disabled={busy} />}
    {checkpoint.mode === 'document' && <p className="composer-note">Enter to send · Shift+Enter for a new line. A detailed request creates an outline and archives an existing draft.</p>}
  </div>;
}
