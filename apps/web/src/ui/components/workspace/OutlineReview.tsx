'use client';

import { useState } from 'react';
import { outlineSchema } from '@outline-studio/schemas';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';

export function OutlineReview({ busy, onAccept }: { busy: boolean; onAccept: () => void }) {
  const { checkpoint, patch } = useWorkspace();
  const [editing, setEditing] = useState(false); const [error, setError] = useState('');
  const outline = checkpoint?.outline;
  if (!outline || !checkpoint) return null;
  function save(form: FormData) {
    const result = outlineSchema.safeParse({ ...outline, title: form.get('title'), sections: String(form.get('sections')).split('\n').map(s => s.trim()).filter(Boolean) });
    if (!result.success) { setError(result.error.issues[0]?.message ?? 'Check outline fields.'); return; }
    patch({ outline: result.data }); setEditing(false); setError('');
  }
  return <section className="outline-review"><div className="panel-title"><h3>{checkpoint.outlineAccepted ? 'Accepted outline' : 'Your outline, for approval'}</h3>
    {!checkpoint.outlineAccepted && <button className="text-button small" disabled={busy} onClick={() => setEditing(!editing)}>{editing ? 'Keep original' : 'Edit outline'}</button>}</div>
    {editing ? <form action={save} className="form-stack"><label>Title<input name="title" defaultValue={outline.title} maxLength={200} required /></label>
      <label>Sections · one per line<textarea name="sections" defaultValue={outline.sections.join('\n')} rows={7} maxLength={2000} /></label>
      {error && <p role="alert" className="notice error">{error}</p>}<Button>Save outline</Button></form>
      : <><p className="outline-title">{outline.title}</p><ol>{outline.sections.map((section, i) => <li key={`${i}-${section}`}>{section}</li>)}</ol>
        <details><summary>Requirements to review</summary><ul>{outline.requirements.map(item => <li key={item}>{item}</li>)}</ul></details>
        {outline.warnings.map(warning => <p className="notice small" key={warning}>{warning}</p>)}
        {!checkpoint.outlineAccepted && <Button disabled={busy} onClick={onAccept}>Accept outline & start coworkers</Button>}</>}
  </section>;
}
