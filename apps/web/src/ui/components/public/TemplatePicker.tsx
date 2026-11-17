'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { styles } from '@outline-studio/config';
import type { StyleId } from '@outline-studio/schemas';
import { Button } from '../ui/button';

const templatePreviews: Record<StyleId, { title: string; sections: Array<{ heading: string; items: string[] }>; note: string }> = {
  academic: {
    title: 'Academic Assignment',
    sections: [
      { heading: 'Cover Page', items: ['Title, student name, roll number', 'Course, department, university', 'Supervisor, submission date', 'Optional university logo'] },
      { heading: 'Structure', items: ['Numbered sections & subsections', 'Introduction, discussion, conclusion', 'Figures with captions & cross-refs', 'Tables with headers & alignment'] },
      { heading: 'References', items: ['Numbered or author-date citations', 'Bibliography with DOIs/URLs', 'Optional table of contents', 'Academic formatting (margins, spacing)'] },
    ],
    note: 'Student and university details are supplied by you. Times New Roman when available; Tinos fallback.',
  },
  professional: {
    title: 'Professional Report',
    sections: [
      { heading: 'Cover', items: ['Report title & subtitle', 'Prepared for / Prepared by', 'Date, classification, version', 'Optional company logo'] },
      { heading: 'Executive Summary', items: ['Context & objectives', 'Key findings (3-5 bullets)', 'Recommendations', 'Limitations & next steps'] },
      { heading: 'Body', items: ['Findings with evidence', 'Comparison tables & charts', 'Risk assessment', 'Action items with owners'] },
    ],
    note: 'Sans-serif layout (Arial). Compact spacing. Page numbers. Watermark optional.',
  },
  research: {
    title: 'Research-Paper Draft',
    sections: [
      { heading: 'Front Matter', items: ['Title, authors, affiliations', 'Abstract (structured, < 300 words)', 'Keywords (5-8)', 'Optional: funding, conflicts'] },
      { heading: 'Main Sections', items: ['Introduction & research question', 'Methods / Approach', 'Results / Discussion', 'Limitations & future work'] },
      { heading: 'Figures & References', items: ['Numbered figures with captions', 'Tables with statistical notation', 'Bibliography (numbered)', 'Supplementary materials note'] },
    ],
    note: 'Paper layout with abstract/keywords. Does not guarantee journal compliance. Verify target venue requirements.',
  },
  solutions: {
    title: 'Question-Paper Solutions',
    sections: [
      { heading: 'Preserved Structure', items: ['Original question numbers & marks', 'Sub-question hierarchy (a, b, i, ii)', 'Section/page references from paper', 'No executive summary or abstract'] },
      { heading: 'Worked Content', items: ['Step-by-step explanations', 'Equations in TeX, code blocks', 'Diagrams for geometry/physics', 'Alternative methods where relevant'] },
      { heading: 'Uncertainty Flags', items: ['Ambiguous question wording', 'Multiple valid interpretations', 'Assumptions stated explicitly', 'Verification notes for each answer'] },
    ],
    note: 'Original numbering preserved. Focus on working & clarity. Never claims automatic correctness.',
  },
};

export function TemplatePicker({ initial }: { initial: StyleId }) {
  const [selected, setSelected] = useState<StyleId>(initial);
  const preview = templatePreviews[selected];
  return <div className="template-layout"><div><div className="template-options" aria-label="Document styles">{styles.map(style =>
    <button key={style.id} className="template-option" aria-pressed={selected === style.id} onClick={() => setSelected(style.id)}><div><strong>{style.name}</strong><p>{style.description}</p></div>
      {selected === style.id ? <Check size={20} /> : <ArrowUpRight size={20} />}</button>)}</div>
    <div style={{ marginTop: 28 }}><Button asChild><Link href={`/workspace?style=${selected}`}>Use this style <ArrowUpRight size={18} /></Link></Button></div>
  </div><div className="template-sample" aria-live="polite"><div className="sample-paper"><small>ILLUSTRATIVE STYLE PREVIEW</small><h2>{preview.title}</h2>
    {preview.sections.map((section, si) => (
      <div key={si} style={{ marginTop: si === 0 ? 24 : 16 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--ink)' }}>{section.heading}</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9, color: 'var(--muted)' }}>
          {section.items.map((item, ii) => <li key={ii}>{item}</li>)}
        </ul>
      </div>
    ))}
    <small style={{ display: 'block', marginTop: 16, color: 'var(--muted)' }}>{preview.note}</small></div>
    <p>Tinos is the licensed serif fallback in preview and exports. Times New Roman is used when installed in the viewer; pagination can vary between viewers.</p></div></div>;
}