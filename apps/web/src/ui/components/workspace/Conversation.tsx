'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FilePlus2, Square } from 'lucide-react';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';
import { OutlineReview } from './OutlineReview';
import { Completion } from './Completion';

export function Conversation({ busy, onPlan, onCancel, onAccept, onReview, onResume, openProvider }:
  { busy: boolean; onPlan: () => void; onCancel: () => void; onAccept: () => void; onReview: () => void; onResume: () => void; openProvider: () => void }) {
  const { checkpoint, patch, setTab } = useWorkspace();
  const transcript = useRef<HTMLDivElement>(null);
  const following = useRef(true); const [atBottom, setAtBottom] = useState(true);
  useEffect(() => {
    const element = transcript.current;
    if (following.current && element) element.scrollTop = element.scrollHeight;
  }, [checkpoint?.messages.length, checkpoint?.outline, checkpoint?.review, busy]);
  if (!checkpoint) return null;
  const showResume = checkpoint.outlineAccepted && (!checkpoint.document || !checkpoint.diagram);
  return <div className="conversation-pane"><div className="transcript" ref={transcript} onScroll={() => {
    const element = transcript.current; if (!element) return;
    following.current = element.scrollHeight - element.scrollTop - element.clientHeight < 90; setAtBottom(following.current);
  }}><div className="conversation-intro"><span className="workspace-symbol"><FilePlus2 size={23} /></span>
    <h2>{checkpoint.brief ? 'Your document, in motion.' : 'What are we making?'}</h2>
    <p>One brief is enough to begin. Shape the outline, follow your coworkers and review the files before they leave your desk.</p>
    {!checkpoint.brief && <div className="suggestions">{['Compare TCP and UDP for a networking assignment.', 'Draft a professional report on a campus recycling initiative.', 'Explain these questions with worked solutions.'].map(text =>
      <button key={text} onClick={() => patch({ composer: text })}>{text}<ArrowUp size={14} /></button>)}</div>}
    {!checkpoint.brief && <button className="text-link small" onClick={openProvider}>Connect a provider to generate</button>}</div>
    <div className="messages" role="log" aria-label="Main conversation" aria-live="polite">{checkpoint.messages.map(message =>
      <article key={message.id} className={`message ${message.role}`}><strong>{message.role === 'user' ? 'You' : 'Outline Studio'}</strong><p>{message.text}</p></article>)}</div>
    {checkpoint.outline && <OutlineReview busy={busy} onAccept={onAccept} />}
    {showResume && !busy && <div className="notice"><p>Accepted outputs have been kept. Retry only the unfinished coworkers.</p><Button variant="outline" onClick={onResume}>Resume unfinished tasks</Button></div>}
    {checkpoint.document && checkpoint.diagram && !checkpoint.review && <div className="notice"><p>Your draft and diagram are ready for inspection. Edit them in the document view, then run review.</p><div className="button-row">
      <Button variant="outline" onClick={() => setTab('document')}>Inspect & edit</Button><Button disabled={busy} onClick={onReview}>Review against requirements</Button></div></div>}
    {checkpoint.review && <Completion onRevise={() => setTab('document')} />}
    {busy && <div role="status" className="working-status"><span className="status-dot running" />Coworkers are working. Open a task to see its status.</div>}
  </div>{!atBottom && <button className="follow-button" onClick={() => { following.current = true; setAtBottom(true); if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }}>Latest messages <ArrowDown size={14} /></button>}
    <form className="composer" onSubmit={e => { e.preventDefault(); onPlan(); }}><label htmlFor="brief-composer" className="sr-only">Your document request</label>
      <textarea id="brief-composer" value={checkpoint.composer} onChange={e => patch({ composer: e.target.value })} rows={3} maxLength={12000}
        placeholder="Describe your document, audience and requirements…" disabled={busy} />
      <div className="composer-bottom"><span>Local drafts · {checkpoint.composer.length.toLocaleString()} / 12,000</span>{busy ? <Button type="button" variant="outline" onClick={onCancel}><Square size={14} /> Stop</Button>
        : <Button type="submit" disabled={checkpoint.composer.trim().length < 10}>{checkpoint.brief ? 'Start a new request' : 'Create an outline'}<ArrowUp size={16} /></Button>}</div>
    </form><p className="composer-note">A new request archives this draft locally. Closing the browser may interrupt unfinished work.</p>
  </div>;
}
