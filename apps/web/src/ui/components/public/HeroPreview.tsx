import { ArrowDown, Layers, Shuffle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFolioMotion } from '../../hooks/useFolioMotion';

export const heroIdeas = [
  { title: 'Every drop counts.', topic: 'Campus water audit', brief: 'How can our campus save water?', sections: ['Measure campus demand', 'Find the hidden leaks', 'Make every drop count'], flow: ['Water supply', 'Campus use', 'Conservation'] },
  { title: 'A brighter campus.', topic: 'Solar energy proposal', brief: 'Could our campus run on sunlight?', sections: ['Map our energy needs', 'Put rooftops to work', 'Plan a cleaner future'], flow: ['Sunlight', 'Solar panels', 'Clean energy'] },
  { title: 'Room for new ideas.', topic: 'Library renewal plan', brief: 'What could a better library look like?', sections: ['Listen to our readers', 'Make room for discovery', 'Bring the plan to life'], flow: ['Student voices', 'Shared spaces', 'New possibilities'] },
];
export type HeroFormat = 'report' | 'slide' | 'diagram' | 'conversation';
const formats = [['report', 'Report'], ['slide', 'Slides'], ['diagram', 'Diagram'], ['conversation', 'Chat']] as const;

export function HeroPreview({ format, idea, provider, onFormat, onIdea }: {
  format: HeroFormat; idea: number; provider: string; onFormat: (format: HeroFormat) => void; onIdea: () => void;
}) {
  const sample = heroIdeas[idea];
  const root = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(true);
  const selected = formats.findIndex(([view]) => view === format);
  useFolioMotion(root, selected, expanded, idea);
  return <section ref={root} className="gallery-center" aria-label="Interactive document preview" data-expanded={expanded} data-ui>
    <div className="hero-preview-stage folio-scene" aria-live="polite" aria-atomic="true"><div className="folio-tilt">
      {formats.map(([view], index) => <div key={view} className={`hero-preview-page folio-page preview-${view}`} data-rank={(index - selected + 4) % 4} data-active={format === view} aria-hidden={format !== view} style={{ zIndex: 5 - (index - selected + 4) % 4 }}>
        <div className="folio-content">
        <span className="folio-format">{formats[index][1]}</span>
        <p className="hero-preview-topic">{sample.topic}</p>
        {view === 'diagram' ? <div className="hero-preview-flow">{sample.flow.map((text, i) => <div key={i}>{i > 0 && <ArrowDown size={14} aria-hidden="true" />}<span>{text}</span></div>)}</div>
          : view === 'conversation' ? <div className="hero-preview-chat"><p>{sample.brief}</p><p>Let’s start with a clear outline. {sample.sections[0]}, then build a plan together.</p></div>
          : <><h2>{sample.title}</h2>{view === 'report' ? <ol>{sample.sections.map(text => <li key={text}>{text}</li>)}</ol>
            : <div className="hero-preview-slide"><span>{sample.sections[0]}</span><ArrowDown size={18} aria-hidden="true" /><strong>{sample.sections[2]}</strong></div>}</>}
        </div><span className="folio-fold" aria-hidden="true" />
      </div>)}
    </div></div>
    <div className="folio-actions"><button type="button" aria-label="Fan the pages" aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><Layers size={15} />Fan the pages</button>
      <button type="button" aria-label="Try another idea" onClick={onIdea}><Shuffle size={15} /></button></div>
    <div className="hero-preview-formats" role="group" aria-label="Preview format">{formats.map(([value, text]) =>
      <button type="button" key={value} aria-label={`Preview ${text.toLowerCase()}`} aria-pressed={format === value} onClick={() => onFormat(value)}>{text}</button>)}</div>
    <p className="hero-preview-note">One idea, every format. · {provider || 'Try the paper stack'}</p>
  </section>;
}
