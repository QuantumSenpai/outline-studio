'use client';

import { useRef, useState } from 'react';
import { Check, Pause, Play, ArrowRight } from 'lucide-react';
import { useOrchestraMotion } from './useOrchestraMotion';

export function Orchestra() {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useOrchestraMotion(ref, paused);
  return <figure className="hero-illustration">
    <div className="orchestra-stage" ref={ref} role="img" aria-label="Illustration: one accepted brief connects a report, slides and a diagram.">
      <div className="orchestra-wire wire-trunk" aria-hidden="true" />
      <div className="orchestra-wire wire-report" aria-hidden="true" />
      <div className="orchestra-wire wire-slides" aria-hidden="true" />
      <article className="orchestra-card orchestra-brief" aria-hidden="true">
        <span className="art-label">01 / The brief</span>
        <strong className="brief-detail">Your topic.<br />Your format.</strong>
        <div className="art-lines brief-detail"><i /><i /><i /></div>
        <span className="brief-detail art-note">One accepted outline</span>
      </article>
      <article className="orchestra-card orchestra-report" aria-hidden="true">
        <span className="art-label">02 / Report</span>
        <strong className="report-detail">Structured<br />content.</strong>
        <div className="art-lines report-detail"><i /><i /><i /></div>
        <div className="report-table report-detail"><span>Findings</span><span>Sources</span></div>
      </article>
      <article className="orchestra-card orchestra-slides" aria-hidden="true">
        <span className="art-label">03 / Slides</span>
        <strong className="slide-detail">The key points.</strong>
        <div className="slide-chart slide-detail"><i /><i /><i /><i /></div>
        <span className="art-note slide-detail">A clear visual summary</span>
      </article>
      <article className="orchestra-card orchestra-diagram" aria-hidden="true">
        <span className="art-label">04 / Diagram</span>
        <div className="diagram-flow"><span className="diagram-node">Input</span><ArrowRight className="diagram-arrow" size={16} /><span className="diagram-node">Process</span><ArrowRight className="diagram-arrow" size={16} /><span className="diagram-node">Output</span></div>
      </article>
      <span className="orchestra-status" aria-hidden="true"><Check size={14} /> One shared source</span>
    </div>
    <figcaption className="hero-caption"><span>An accepted outline.<br />A coordinated set of files.</span><a className="text-link" href="/how-it-works">Illustrative output <span aria-hidden="true">↗</span></a></figcaption>
    <button className="motion-control illustration-control" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? <Play size={14} /> : <Pause size={14} />}{paused ? 'Resume illustration' : 'Pause illustration'}
    </button>
  </figure>;
}
