'use client';

import { useRef, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { feedbackSchema } from '@outline-studio/schemas';
import { api, connectSession, messageFrom } from '@/lib/api';
import { Button } from '../ui/button';

export function FeedbackForm() {
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState<number | undefined>();
  const id = useRef<string | null>(null);
  async function submit(form: FormData) {
    if (pending) return;
    id.current ??= crypto.randomUUID();
    const parsed = feedbackSchema.safeParse({ category: form.get('category'), message: form.get('message'),
      contact: form.get('contact'), website: form.get('website'), rating, submissionId: id.current });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check the form.'); return; }
    setPending(true); setError('');
    try {
      await connectSession(AbortSignal.timeout(15000));
      const response = await api('/feedback', parsed.data, AbortSignal.timeout(15000));
      const data: unknown = await response.json();
      if (typeof data !== 'object' || !data || !('saved' in data) || data.saved !== true) throw new Error('The server did not confirm persistence. Your message has been kept.');
      setSaved(true);
    } catch (error) { setError(messageFrom(error)); } finally { setPending(false); }
  }
  if (saved) return <div className="feedback-confirmation" role="status"><Check size={34} color="var(--teal)" />
    <h2 style={{ fontSize: '2rem', marginTop: 20 }}>Message received.</h2><p className="muted">Your feedback has been saved. Thank you for helping shape Outline Studio.</p>
    <Button variant="outline" onClick={() => { setSaved(false); id.current = null; setRating(undefined); }}>Send another message</Button></div>;
  return <form onSubmit={event => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }} className="form-stack" aria-busy={pending}>
    <label>What is this about?<select name="category" defaultValue="idea"><option value="idea">An idea</option><option value="problem">Something isn’t working</option><option value="experience">My experience</option></select></label>
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend>How is it going? <span className="muted small">(optional)</span></legend>
      <div className="rating-options">{[1,2,3,4,5].map(n => <button type="button" key={n} aria-label={`Rate ${n} out of 5`} aria-pressed={rating === n} onClick={() => setRating(rating === n ? undefined : n)}>{n}</button>)}</div></fieldset>
    <label>Your message<textarea name="message" required minLength={10} maxLength={4000} rows={5} placeholder="What would make your work flow better?" /></label>
    <label>Email <span className="muted small">(optional, if you would like a reply)</span><input name="contact" type="email" maxLength={254} autoComplete="email" /></label>
    <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label></div>
    <p className="small muted">Only these form fields are submitted. No chats, documents, provider keys or student details are attached. Feedback is retained for up to 30 days when the operator runs retention.</p>
    {error && <p role="alert" className="notice error">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? 'Saving your message…' : 'Send feedback'}<ArrowUpRight size={17} /></Button>
  </form>;
}
