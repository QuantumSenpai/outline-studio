'use client';

import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { useWorkspace } from '../../stores/workspaceStore';
import { saveFile } from '@/lib/download';
import { messageFrom } from '@/lib/api';
import { retainDownload } from '@/adapters/storage/retainedFiles';
import { graphvizSource, mermaidSource } from '@/domain/ir/diagramSources';
import { Button } from '../ui/button';

const formats = [ ['docx', 'Word report', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['pdf', 'PDF report', 'application/pdf'], ['pptx', 'Presentation', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['svg', 'Vector diagram', 'image/svg+xml'], ['png', 'Diagram image', 'image/png'], ['md', 'Markdown report', 'text/markdown'] ] as const;
export function ExportPanel({ busy }: { busy: boolean }) {
  const { checkpoint, message } = useWorkspace();
  const [pending, setPending] = useState(''); const [error, setError] = useState(''); const [files, setFiles] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  if (!checkpoint) return null;
  const ready = checkpoint.document && checkpoint.diagram && checkpoint.review;
  async function download(format: typeof formats[number][0], mime: string) {
    if (!checkpoint?.document || !checkpoint.diagram || !checkpoint.review) return;
    setPending(format); setError('');
    try {
      const output = await (await import('@/adapters/renderers/downloadRevision')).renderRevision(checkpoint, format);
      const name = saveFile(output.data, output.name, mime);
      setFiles(current => [...current, name]); message(`File generated: ${name}. Review warnings and missing or unverified criteria before using it.`);
      try { await retainDownload(checkpoint, output.data, name, mime); } catch (error) { setError(messageFrom(error)); }
    } catch (error) { setError(messageFrom(error)); } finally { setPending(''); }
  }
  return <section className="coworker-panel export-panel"><h2>Exporter</h2><p className="muted">Local renderer · no AI provider. One accepted source feeds separate report and presentation layouts.</p>
    {!ready && <p className="notice">Complete writing, diagram design and review before final downloads. Project backups are available in Data controls at any time.</p>}
    <p className="notice small">Reports include full paragraphs; slides use concise excerpts with full section text in speaker notes. PDF tables are rendered as labelled rows. Math is preserved as literal TeX in exports. Professional PDFs embed Noto Sans; other PDFs embed Tinos. Check font substitution, Unicode and page breaks in your viewer.</p>
    {checkpoint.review && <label className="check-label"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />I have read the review, including missing/unverified criteria and warnings, and will inspect the generated files.</label>}
    <div className="export-list">{formats.map(([format,label,mime]) => <div key={format}><span><strong>{label}</strong><small>.{format.toUpperCase()}</small></span>
      <Button variant="outline" aria-busy={pending === format} disabled={!ready || busy || Boolean(pending) || !acknowledged} onClick={() => void download(format,mime)}>{pending === format ? 'Rendering…' : <><Download size={16} /> Download</>}</Button></div>)}</div>
    {error && <p role="alert" className="notice error">{error}</p>}
    {files.length > 0 && <div role="status"><h3>Files generated this visit</h3>{files.map((file,i) => <p className="generated-file" key={i}><Check size={16} />{file}</p>)}</div>}
    {checkpoint.diagram && <details><summary>Validated diagram sources</summary><p className="small muted">Generated from the same labelled nodes and edges, not arbitrary model code.</p><pre>{mermaidSource(checkpoint.diagram)}</pre><pre>{graphvizSource(checkpoint.diagram)}</pre></details>}
  </section>;
}
