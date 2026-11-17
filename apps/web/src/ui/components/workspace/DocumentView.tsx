'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useWorkspace } from '../../stores/workspaceStore';
import { DocumentEditor } from './DocumentEditor';
import { DiagramPreview } from './DiagramPreview';
import { MathText } from './MathText';
import { Button } from '../ui/button';

export function DocumentView({ busy }: { busy: boolean }) {
  const { checkpoint } = useWorkspace(); const [editing, setEditing] = useState(false);
  if (!checkpoint?.document) return <div className="workspace-empty"><h2>A place for the document.</h2><p>Accept an outline and let the writer build a draft. Your accepted content and editable preview appear here.</p></div>;
  const { document, settings, diagram } = checkpoint;
  if (editing) return <DocumentEditor onClose={() => setEditing(false)} />;
  return <div className="document-view"><div className="panel-title"><div><h2>Document preview</h2><p className="small muted">Continuous preview; actual pagination depends on the export and viewer.</p></div><Button variant="outline" disabled={busy} onClick={() => setEditing(true)}>Edit content</Button></div>
    <p className="notice small">Academic type: licensed Tinos fallback. DOCX/PPTX request Times New Roman in your viewer. Check substitutions and Unicode after download. Math is typeset here; exports preserve its TeX source.</p>
    <article className={`document-paper ${settings.style}`} style={{ lineHeight: settings.lineSpacing, padding: `clamp(20px,4vw,${settings.margin * 2}px)` }}>
      {settings.watermark && <div className="preview-watermark">Outline Studio draft</div>}
      {settings.cover && <header className="document-cover">{settings.logo && <Image unoptimized src={settings.logo} alt="User-supplied university logo" width={90} height={90} />}
        <p>{settings.university}</p><p>{settings.department}</p><h3>{document.title}</h3><p>{settings.course}</p>
        <div>{[settings.student, settings.roll && `Roll: ${settings.roll}`, settings.section && `Section: ${settings.section}`, settings.supervisor && `Faculty: ${settings.supervisor}`, settings.date].filter(Boolean).map(text => <p key={text}>{text}</p>)}</div></header>}
      <h3 className="document-title">{document.title}</h3>
      {settings.contents && <section><h4>Contents</h4><ol>{document.sections.map((s, i) => <li key={i}>{s.heading}</li>)}</ol></section>}
      {document.abstract && <section><h4>Abstract</h4><p>{document.abstract}</p></section>}{document.keywords.length > 0 && <p><strong>Keywords:</strong> {document.keywords.join(', ')}</p>}
      {document.sections.map((section, index) => <section key={index}><h4>{section.heading}</h4>{section.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        {section.bullets.length > 0 && <ul>{section.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
        {section.table && <div className="table-scroll"><table><thead><tr>{section.table.headers.map((header, i) => <th key={i}>{header}</th>)}</tr></thead>
          <tbody>{section.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
        {section.math.map((math, i) => <MathText key={i} expression={math} />)}</section>)}
      {diagram && <DiagramPreview diagram={diagram} />}
      {document.references.length > 0 && <section><h4>References</h4><ol>{document.references.map((source, i) => <li key={i}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-link">{source.title}</a>{source.doi && ` · DOI: ${source.doi}`}</li>)}</ol></section>}
      {settings.numbering && <div className="preview-page-number">Page numbering starts at {settings.numberStart}{settings.numberCover ? ', including the cover' : ', after the cover'}.</div>}
    </article>{document.warnings.map((warning, i) => <p className="notice small" key={i}>{warning}</p>)}
  </div>;
}
