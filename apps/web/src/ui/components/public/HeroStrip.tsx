'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Presentation, FileCheck, Network, BookOpen, ListChecks, Pause, Play } from 'lucide-react';

const items = [
  { label: 'DOCX · Academic assignments', href: '/templates?style=academic', icon: FileText },
  { label: 'PPTX · Presentations', href: '/templates?style=professional', icon: Presentation },
  { label: 'PDF · Professional reports', href: '/templates?style=professional', icon: FileCheck },
  { label: 'SVG · Technical diagrams', href: '/how-it-works', icon: Network },
  { label: 'Research-paper drafts', href: '/templates?style=research', icon: BookOpen },
  { label: 'Question-paper solutions', href: '/templates?style=solutions', icon: ListChecks },
];

export function HeroStrip() {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div className="hero-strip" ref={ref} data-paused={paused} data-visible={visible}>
    <div className="strip-window" role="region" aria-label="Formats and starting points" tabIndex={0}>
      <div className="strip-track">
        {[false, true].map(duplicate => <ul className="strip-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
          {items.map(({ label, href, icon: Icon }) => <li key={label}>
            <a href={href} tabIndex={duplicate ? -1 : undefined}><Icon size={17} aria-hidden="true" />{label}</a></li>)}
        </ul>)}
      </div>
    </div>
    <button className="motion-control strip-control" aria-label={paused ? 'Resume scrolling strip' : 'Pause scrolling strip'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? <Play size={16} /> : <Pause size={16} />}
    </button>
  </div>;
}
