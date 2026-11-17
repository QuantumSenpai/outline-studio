'use client';

import { useState } from 'react';
import { z } from 'zod';
import { sourceSchema, type Source } from '@outline-studio/schemas';
import { api, connectSession, messageFrom } from '@/lib/api';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';

export function ResearchPanel({ busy }: { busy: boolean }) {
  const { checkpoint, setSources, patch } = useWorkspace();
  const [query, setQuery] = useState(''); const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Source[]>([]); const [error, setError] = useState('');
  if (!checkpoint) return null;
  async function search() {
    setPending(true); setError('');
    try {
      await connectSession(AbortSignal.timeout(15000));
      const response = await api(`/sources?q=${encodeURIComponent(query)}`, undefined, AbortSignal.timeout(15000), 'GET');
      const result = z.object({ sources: z.array(sourceSchema).max(5) }).parse(await response.json());
      setResults(result.sources);
    } catch (error) { setError(messageFrom(error)); } finally { setPending(false); }
  }
  function accept(source: Source) {
    if (!checkpoint || checkpoint.sources.some(s => s.url === source.url)) return;
    setSources([...checkpoint.sources, source]);
    if (checkpoint.document) patch({ document: { ...checkpoint.document, references: [...checkpoint.sources, source] }, review: undefined });
  }
  return <section className="coworker-panel"><h2>Researcher</h2><p className="muted">Read-only scholarly metadata lookup for your main request. No model provider is used here.</p>
    <p className="notice">Crossref checks bibliographic metadata, not whether an article supports a claim. Read original works. Software documentation connectors are not configured; training-data output is never labelled current verified information.</p>
    <form onSubmit={e => { e.preventDefault(); void search(); }} className="form-stack"><label>Title, topic or DOI<input value={query} onChange={e => setQuery(e.target.value)} minLength={3} maxLength={300} placeholder="Search scholarly metadata" /></label>
      <Button disabled={pending || query.trim().length < 3}>{pending ? 'Looking up metadata…' : 'Search Crossref'}</Button></form>
    {error && <p className="notice error" role="alert">{error}</p>}
    {results.map(source => <article className="source-result" key={source.url}><a className="text-link" target="_blank" rel="noopener noreferrer" href={source.url}>{source.title}</a>
      <p className="small muted">DOI: {source.doi}<br />Metadata retrieved: {source.retrievedAt}</p><Button variant="outline" disabled={busy || checkpoint.sources.length >= 20 || checkpoint.sources.some(s => s.url === source.url)} onClick={() => accept(source)}>Add to accepted sources</Button></article>)}
    <h3 style={{ marginTop: 32 }}>Accepted sources · {checkpoint.sources.length}</h3>{checkpoint.sources.length === 0 ? <p className="muted">No sources selected. Unsourced claims remain unverified.</p> : checkpoint.sources.map(source =>
      <div className="source-result" key={source.url}><a className="text-link" target="_blank" rel="noopener noreferrer" href={source.url}>{source.title}</a><button className="text-button small" disabled={busy} onClick={() => {
        const sources = checkpoint.sources.filter(s => s.url !== source.url); setSources(sources);
        if (checkpoint.document) patch({ document: { ...checkpoint.document, references: sources }, review: undefined });
      }}>Remove source</button></div>)}
  </section>;
}
