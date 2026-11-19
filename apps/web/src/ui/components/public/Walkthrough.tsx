'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Circle, FileText, GitBranch, ListChecks } from 'lucide-react';

const frames = [
  { label: 'Brief', title: 'Campus water audit', text: 'Scope: teaching buildings, residence halls and shared green spaces.' },
  { label: 'Outline', title: 'An outline you can shape', text: 'Introduction, sections, requirements. You review and accept before coworkers start writing and designing.' },
  { label: 'Coworkers', title: 'Independent tasks, shared context', text: 'The writer and diagram designer work together after outline acceptance. The reviewer waits for their accepted outputs.' },
  { label: 'Review', title: 'Check the brief, then export', text: 'A structural check confirms headings and labels. A review records met, missing and unverified criteria. You still check factual accuracy and sources.' },
  { label: 'Files', title: 'One source, several formats', text: 'The accepted content feeds a report, a concise presentation and a static diagram. Downloads are created in your browser.' },
];
export function Walkthrough() {
  const [output, setOutput] = useState('Report');
  const [step, setStep] = useState(0);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step !== 2 || !preview.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cleanup: (() => void) | undefined;
    let active = true;
    void import('gsap').then(({ gsap }) => {
      if (!active) return;
      const context = gsap.context(() => {
        gsap.from('.task-row', { x: -12, opacity: .45, duration: .45, stagger: .1, ease: 'power3.out' });
      }, preview);
      cleanup = () => context.revert();
    });
    return () => { active = false; cleanup?.(); };
  }, [step]);
  return <div className="walkthrough"><div className="sample-brief"><p className="small">Interactive walkthrough · no provider call</p>
    <blockquote>&ldquo;Help me turn my campus water audit into a report, a slide deck and a flow diagram.&rdquo;</blockquote>
    <p><strong>Outline Studio</strong><br />Start with the audit scope. Then we can trace where water goes and compare improvements.</p>
    <div className="walkthrough-controls" aria-label="Walkthrough stages">{frames.map((frame, i) =>
      <button key={frame.label} aria-pressed={step === i} onClick={() => setStep(i)}>{frame.label}</button>)}</div>
  </div><div ref={preview} className="walkthrough-preview" aria-live="polite"><div className="preview-top"><span>Illustrative output</span><span>{step + 1} / {frames.length}</span></div>
    <div className="walkthrough-controls" aria-label="Output preview">{['Report', 'Slides', 'Diagram'].map(name => <button key={name} aria-pressed={output === name} onClick={() => { setOutput(name); setStep(0); }}>{name}</button>)}</div>
    {step === 0 && output === 'Slides' ? <div className="output-slide"><small>CAMPUS WATER AUDIT</small><h3>Measure. Repair. Conserve.</h3><p>Track building demand, repair leaks and prioritize efficient fixtures.</p></div> : step === 0 && output === 'Diagram' ? <div className="mini-flow"><span>Meter readings</span><b>↓</b><span>Building demand</span><b>↓</b><span>Conservation plan</span></div> : <h3>{frames[step].title}</h3>}<p className="muted">{frames[step].text}</p>
    {step === 0 && output === 'Report' && <ol className="sample-outline"><li>Trace supply from meter to building</li><li>Compare fixture use and landscape demand</li><li>Prioritize repairs and conservation measures</li></ol>}
    {step === 2 && <div>{[['Writer', 'Running'], ['Diagram designer', 'Running'], ['Reviewer', 'Queued']].map(([name, state]) =>
      <div className="task-row" key={name}><span>{state === 'Queued' ? <Circle size={16} /> : <GitBranch size={16} />} {name}</span><small>{state}</small></div>)}</div>}
    {step === 4 && <div>{[['Report', 'DOCX · PDF'], ['Presentation', 'PPTX'], ['Diagram', 'SVG · PNG']].map(([name, format]) =>
      <div className="task-row" key={name}><span><FileText size={17} />{name}</span><small>{format}</small></div>)}</div>}
    {step === 3 && <div className="task-row"><span><ListChecks size={18} /> Review before download</span><Check size={18} /></div>}
  </div></div>;
}