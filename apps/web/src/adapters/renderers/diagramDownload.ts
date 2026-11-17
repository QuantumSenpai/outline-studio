import type { DiagramIR } from '@outline-studio/schemas';
import { renderDiagram } from './diagramClient';

export async function diagramAssets(diagram: DiagramIR) {
  const { default: DOMPurify } = await import('dompurify');
  const raw = await renderDiagram(diagram);
  const svg = DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true }, FORBID_TAGS: ['script', 'foreignObject', 'image', 'a'] });
  const objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = objectUrl; await image.decode();
    const canvas = document.createElement('canvas');
    const scale = Math.min(3, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.ceil(image.naturalWidth*scale); canvas.height = Math.ceil(image.naturalHeight*scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot rasterize a diagram. Download SVG instead.');
    context.fillStyle = 'white'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(image,0,0,canvas.width,canvas.height);
    return { svg, png: canvas.toDataURL('image/png') };
  } finally { URL.revokeObjectURL(objectUrl); }
}
