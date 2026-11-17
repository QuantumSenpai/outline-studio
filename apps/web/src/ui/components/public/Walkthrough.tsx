'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Circle, FileText, GitBranch, ListChecks } from 'lucide-react';

const frames = [
  { label: 'Brief', title: 'A clear starting point', text: 'Describe your document, audience and requirements. Pick a template style to guide structure and formatting.' },
  { label: 'Outline', title: 'An outline you can shape', text: 'Introduction, sections, requirements. You review and accept before coworkers start writing and designing.' },
  { label: 'Coworkers', title: 'Independent tasks, shared context', text: 'The writer and diagram designer work together after outline acceptance. The reviewer waits for their accepted outputs.' },
  { label: 'Review', title: 'Check the brief, then export', text: 'A structural check confirms headings and labels. A review records met, missing and unverified criteria. You still check factual accuracy and sources.' },
  { label: 'Files', title: 'One source, several formats', text: 'The accepted content feeds a report, a concise presentation and a static diagram. Downloads are created in your browser.' },
];
export function Walkthrough() {
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
    <blockquote>&ldquo;One brief. A report, slides and a diagram that agree.&rdquo;</blockquote>
    <div className="walkthrough-controls" aria-label="Walkthrough stages">{frames.map((frame, i) =>
      <button key={frame.label} aria-pressed={step === i} onClick={() => setStep(i)}>{frame.label}</button>)}</div>
  </div><div ref={preview} className="walkthrough-preview" aria-live="polite"><div className="preview-top"><span>Illustrative output</span><span>{step + 1} / {frames.length}</span></div>
    <h3>{frames[step].title}</h3><p className="muted">{frames[step].text}</p>
    {step === 2 && <div>{[['Writer', 'Running'], ['Diagram designer', 'Running'], ['Reviewer', 'Queued']].map(([name, state]) =>
      <div className="task-row" key={name}><span>{state === 'Queued' ? <Circle size={16} /> : <GitBranch size={16} />} {name}</span><small>{state}</small></div>)}</div>}
    {step === 4 && <div>{[['Report', 'DOCX · PDF'], ['Presentation', 'PPTX'], ['Diagram', 'SVG · PNG']].map(([name, format]) =>
      <div className="task-row" key={name}><span><FileText size={17} />{name}</span><small>{format}</small></div>)}</div>}
    {step === 3 && <div className="task-row"><span><ListChecks size={18} /> Review before download</span><Check size={18} /></div>}
  </div></div>;
}