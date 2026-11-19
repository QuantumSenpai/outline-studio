'use client';

import Image from 'next/image';
import { useState } from 'react';
import { HeroPreview, type HeroFormat } from './HeroPreview';

const panels = ['report', 'groq', 'slide', 'gemini', 'nvidia', 'diagram', 'openrouter', 'conversation'];
const providers: Record<string, string> = { groq: 'Groq', gemini: 'Gemini', nvidia: 'NVIDIA NIM', openrouter: 'OpenRouter' };
function Exhibit({ kind }: { kind: string }) {
  if (['groq', 'gemini', 'nvidia', 'openrouter'].includes(kind)) return <><Image src={`/providers/${kind}.svg`} alt="" width={66} height={66} unoptimized /><strong>{kind === 'nvidia' ? 'NVIDIA NIM' : kind === 'gemini' ? 'Gemini' : kind === 'groq' ? 'Groq' : 'OpenRouter'}</strong></>;
  if (kind === 'diagram') return <><small>DIAGRAM</small><div className="mini-flow"><span>Water supply</span><b>↓</b><span>Campus use</span><b>↓</b><span>Conservation</span></div></>;
  if (kind === 'conversation') return <><small>CONVERSATION</small><p>How can our campus save water?</p><p className="mini-reply">Let’s map demand, then compare the options.</p></>;
  return <><small>{kind === 'slide' ? 'PRESENTATION' : 'REPORT'}</small><span className="mini-title">Every drop<br />counts.</span><p>A campus water audit</p><div className="mini-rule" /><p>Measure use.<br />Find opportunities.<br />Make a plan.</p></>;
}
export function ProviderGallery() {
  const [format, setFormat] = useState<HeroFormat>('report');
  const [idea, setIdea] = useState(0);
  const [provider, setProvider] = useState('');
  return <div className="provider-gallery" aria-label="Illustrative reports, slides, diagrams and supported providers">
    {panels.map((kind, i) => <button type="button" key={kind} className={`perspective-panel panel-${i} art-${kind}`}
      aria-label={providers[kind] ? `Try ${providers[kind]} in the preview` : undefined}
      aria-pressed={providers[kind] ? provider === providers[kind] : format === kind}
      onClick={() => providers[kind] ? setProvider(providers[kind]) : setFormat(kind as HeroFormat)}><span className="exhibit-content"><Exhibit kind={kind} /></span></button>)}
    <HeroPreview format={format} idea={idea} provider={provider} onFormat={setFormat} onIdea={() => setIdea(value => (value + 1) % 3)} />
  </div>;
}
