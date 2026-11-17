'use client';

import { useState } from 'react';
import { documentSchema, diagramSchema } from '@outline-studio/schemas';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';

export function DocumentEditor({ onClose }: { onClose: () => void }) {
  const { checkpoint, patch } = useWorkspace();
  const [document, setDocument] = useState(checkpoint?.document);
  const [diagram, setDiagram] = useState(checkpoint?.diagram);
  const [error, setError] = useState('');
  if (!checkpoint || !document) return null;
  function save() {
    const parsed = documentSchema.safeParse(document);
    const figure = diagram ? diagramSchema.safeParse(diagram) : null;
    if (!parsed.success || figure && !figure.success) { setError('Check titles, paragraph lengths and diagram labels. Every section needs content.'); return; }
    if (!checkpoint || checkpoint.revision >= 1000) { setError('Revision limit reached. Export this project and start a new request.'); return; }
    patch({ document: parsed.data, diagram: figure?.success ? figure.data : undefined, review: undefined,
      revision: checkpoint.revision + 1, tasks: checkpoint.tasks.map(task => task.stage === 'reviewer'
        ? { ...task, status: 'queued', attempt: 0, summary: 'Content edited. Run a fresh review.', partial: '' } : task) });
    onClose();
  }
  return <div className="document-editor form-stack"><h2>Edit accepted content</h2><p className="muted">Save creates a local revision and requires a fresh review. Your current accepted draft stays intact until then.</p>
    <label>Document title<input value={document.title} maxLength={200} onChange={e => setDocument({ ...document, title: e.target.value })} /></label>
    <label>Abstract<textarea rows={3} maxLength={3000} value={document.abstract} onChange={e => setDocument({ ...document, abstract: e.target.value })} /></label>
    {document.sections.map((section, i) => <fieldset key={i}><legend>Section {i + 1}</legend><label>Heading<input value={section.heading} maxLength={180} onChange={e => setDocument({ ...document, sections: document.sections.map((s, j) => j === i ? { ...s, heading: e.target.value } : s) })} /></label>
      <label>Paragraphs · separate with a blank line<textarea rows={8} maxLength={20000} value={section.paragraphs.join('\n\n')} onChange={e => setDocument({ ...document, sections: document.sections.map((s, j) => j === i ? { ...s, paragraphs: e.target.value.split('\n\n') } : s) })} /></label>
      <label>Bullet points · one per line<textarea rows={3} value={section.bullets.join('\n')} maxLength={12000} onChange={e => setDocument({ ...document, sections: document.sections.map((s, j) => j === i ? { ...s, bullets: e.target.value.split('\n').filter(Boolean) } : s) })} /></label>
    </fieldset>)}
    {diagram && <fieldset><legend>Diagram labels</legend><label>Caption<input value={diagram.caption} maxLength={240} onChange={e => setDiagram({ ...diagram, caption: e.target.value })} /></label>
      {diagram.nodes.map((node, i) => <label key={node.id}>{node.id} · {node.shape}<input value={node.label} maxLength={100} onChange={e => setDiagram({ ...diagram, nodes: diagram.nodes.map((n, j) => i === j ? { ...n, label: e.target.value } : n) })} /></label>)}</fieldset>}
    {error && <p role="alert" className="notice error">{error}</p>}<div className="button-row"><Button onClick={save}>Save revision</Button><Button variant="outline" onClick={onClose}>Discard editor changes</Button></div>
  </div>;
}
