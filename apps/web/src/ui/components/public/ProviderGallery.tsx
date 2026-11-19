import Image from 'next/image';

const panels = ['report', 'groq', 'slide', 'gemini', 'nvidia', 'diagram', 'openrouter', 'conversation'];
function Exhibit({ kind }: { kind: string }) {
  if (['groq', 'gemini', 'nvidia', 'openrouter'].includes(kind)) return <><Image src={`/providers/${kind}.svg`} alt="" width={66} height={66} unoptimized /><strong>{kind === 'nvidia' ? 'NVIDIA NIM' : kind === 'gemini' ? 'Gemini' : kind === 'groq' ? 'Groq' : 'OpenRouter'}</strong></>;
  if (kind === 'diagram') return <><small>DIAGRAM</small><div className="mini-flow"><span>Water supply</span><b>↓</b><span>Campus use</span><b>↓</b><span>Conservation</span></div></>;
  if (kind === 'conversation') return <><small>CONVERSATION</small><p>How can our campus save water?</p><p className="mini-reply">Let’s map demand, then compare the options.</p></>;
  return <><small>{kind === 'slide' ? 'PRESENTATION' : 'REPORT'}</small><h3>Every drop<br />counts.</h3><p>A campus water audit</p><div className="mini-rule" /><p>Measure use.<br />Find opportunities.<br />Make a plan.</p></>;
}
export function ProviderGallery() {
  return <div className="provider-gallery" aria-label="Illustrative reports, slides, diagrams and supported providers">
    {panels.map((kind, i) => <div key={kind} className={`perspective-panel panel-${i} art-${kind}`} aria-hidden="true"><Exhibit kind={kind} /></div>)}
    <div className="gallery-center" aria-hidden="true"><span>Brief</span><b>→</b><span>Outline</span><b>→</b><span>Document</span></div>
  </div>;
}
