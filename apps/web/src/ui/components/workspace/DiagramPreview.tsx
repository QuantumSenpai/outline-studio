'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { DiagramIR } from '@outline-studio/schemas';
import { messageFrom } from '@/lib/api';

export function DiagramPreview({ diagram }: { diagram: DiagramIR }) {
  const [url, setUrl] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    let active = true; let objectUrl = '';
    void import('@/adapters/renderers/diagramClient').then(module => module.renderDiagram(diagram))
      .then(async svg => {
        const { default: DOMPurify } = await import('dompurify');
        const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: false }, FORBID_TAGS: ['script', 'foreignObject', 'image', 'a'] });
        objectUrl = URL.createObjectURL(new Blob([clean], { type: 'image/svg+xml' }));
        if (active) { setUrl(objectUrl); setError(''); } else URL.revokeObjectURL(objectUrl);
      }).catch(error => { if (active) setError(messageFrom(error)); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [diagram]);
  return <figure className="diagram-preview">{error ? <p className="notice error" role="alert">Diagram rendering failed. {error}</p>
    : url ? <Image unoptimized src={url} alt={diagram.caption} width={640} height={480} /> : <p role="status">Rendering a static black-and-white figure…</p>}
    <figcaption>Figure 1. {diagram.caption} Verify the meaning and labels before use.</figcaption></figure>;
}
