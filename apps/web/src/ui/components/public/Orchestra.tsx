'use client';

import { useEffect, useRef } from 'react';
import { MobileOrchestra } from './MobileOrchestra';

export function Orchestra() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let active = true;
    void import('gsap').then(({ gsap }) => {
      if (!active || !ref.current) return;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: .65 } });
        timeline.from('.brief-layer', { x: -16, opacity: 0 }, 0)
          .from('.document-layer', { y: 22, opacity: 0, stagger: .1 }, .1)
          .from('.connection', { opacity: 0, duration: .45, stagger: .06 }, .25);
      }, ref);
      dispose = () => media.revert();
    });
    return () => { active = false; dispose?.(); };
  }, []);
  return <figure style={{ margin: 0 }}><div className="hero-art">
    <svg className="desktop-orchestra" ref={ref} viewBox="0 0 1120 400" role="img" aria-labelledby="orchestra-title orchestra-description">
      <title id="orchestra-title">One brief, three coordinated documents</title>
      <desc id="orchestra-description">An accepted outline connects a report, a presentation and a labelled flow diagram. Illustrative output.</desc>
      <g className="connection" fill="none" stroke="#9189d4" strokeWidth="1.5"><path d="M245 200H320V95H398" /><path d="M245 200H580" /><path d="M245 200H320V320H853" />
        <circle cx="320" cy="200" r="5" fill="#4338CA" stroke="none" /></g>
      <g className="brief-layer"><rect x="30" y="123" width="218" height="154" rx="8" fill="#1E2030" />
        <text x="53" y="157" fill="#c3c2d0" fontSize="13">THE BRIEF</text><text x="53" y="189" fill="#fff" fontSize="19" fontWeight="500">Your topic, your format.</text>
        <text x="53" y="215" fill="#d7d7df" fontSize="14">One report. Slides. A diagram.</text><text x="53" y="237" fill="#d7d7df" fontSize="14">All from one accepted outline.</text>
      </g>
      <g className="document-layer" transform="translate(385 27) rotate(-5 127 160)"><rect width="258" height="333" rx="4" fill="#fffefa" stroke="#cecbc4" />
        <rect width="258" height="7" rx="2" fill="#4338CA" /><text x="24" y="43" fill="#66666f" fontSize="12">REPORT / ILLUSTRATIVE</text>
        <text x="24" y="87" fontSize="25" fontWeight="600" fill="#1E2030">Structured content.</text><text x="24" y="118" fontSize="25" fontWeight="600" fill="#1E2030">Clear hierarchy.</text>
        <text x="24" y="153" fill="#66666f" fontSize="13">Sections, tables, figures.</text>
        <path d="M24 173H232M24 192H207M24 211H226M24 230H190" stroke="#d4d1ca" strokeWidth="3" />
        <rect x="24" y="255" width="97" height="44" rx="3" fill="#eae7fa" /><rect x="133" y="255" width="99" height="44" rx="3" fill="#e5f0ed" />
        <text x="42" y="282" fill="#4338CA" fontSize="15">Report</text><text x="151" y="282" fill="#087F8C" fontSize="15">Diagram</text>
      </g>
      <g className="document-layer" transform="translate(652 66) rotate(4 197 102)"><rect width="390" height="205" rx="5" fill="#4338CA" />
        <text x="27" y="34" fill="#d8d4fc" fontSize="12">SLIDES / ILLUSTRATIVE</text><text x="27" y="80" fill="white" fontSize="27" fontWeight="500">Concise presentation.</text>
        <path d="M28 102H359" stroke="#7971dd" />
        <text x="29" y="133" fill="white" fontSize="17">Key points</text><text x="209" y="133" fill="white" fontSize="17">Visual summary</text>
        <text x="29" y="158" fill="#dedbff" fontSize="13">Executive summary</text><text x="209" y="158" fill="#dedbff" fontSize="13">Findings & actions</text>
        <text x="29" y="180" fill="#dedbff" fontSize="13">Next steps</text><text x="209" y="180" fill="#dedbff" fontSize="13">Risks & mitigation</text>
      </g>
      <g className="document-layer" transform="translate(696 250)"><rect width="352" height="128" rx="5" fill="#fffefa" stroke="#cecbc4" />
        <text x="20" y="25" fill="#66666f" fontSize="12">DIAGRAM / ILLUSTRATIVE</text>
        <g fill="none" stroke="#1E2030" strokeWidth="1.3"><rect x="20" y="56" width="77" height="35" rx="17" /><path d="M100 74H128m-5-4 5 4-5 4" />
          <path d="m177 48 47 26-47 26-47-26Z" /><path d="M225 74H254m-5-4 5 4-5 4" /><rect x="257" y="56" width="74" height="35" /></g>
        <g fill="#1E2030" fontSize="12" textAnchor="middle"><text x="59" y="78">Input</text><text x="177" y="78">Process</text><text x="294" y="78">Output</text><text x="240" y="63" fontSize="10">→</text></g>
      </g>
    </svg><MobileOrchestra /></div><figcaption className="hero-caption"><span>An accepted outline. A shared source. A coordinated set of files.</span><span>Illustrative output <span aria-hidden="true">↗</span></span></figcaption></figure>;
}