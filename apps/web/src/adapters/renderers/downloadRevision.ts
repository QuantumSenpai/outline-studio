import type { Checkpoint } from '@/domain/pipeline/checkpoint';
import { validateExport } from '@/domain/ir/validateExport';
import { projectMarkdown } from '@/domain/projects/markdown';
import { filename } from '@/lib/download';

export const downloadFormats = {
  docx: { label: 'Word report', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  pdf: { label: 'PDF report', mime: 'application/pdf' },
  pptx: { label: 'Presentation', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  svg: { label: 'Vector diagram', mime: 'image/svg+xml' }, png: { label: 'Diagram image', mime: 'image/png' },
  md: { label: 'Markdown report', mime: 'text/markdown' },
} as const;
export type DownloadFormat = keyof typeof downloadFormats;
export async function renderRevision(checkpoint: Checkpoint, format: DownloadFormat) {
  if (!checkpoint.document) throw new Error('This snapshot has no accepted document to export.');
  if (format !== 'md' && (!checkpoint.diagram || !checkpoint.review)) throw new Error('Complete writing, diagram and review before final downloads.');
  validateExport(checkpoint.document, checkpoint.diagram);
  let title = checkpoint.document.title;
  for (const detail of [checkpoint.settings.student, checkpoint.settings.roll]) if (detail.trim()) title = title.split(detail).join('');
  const name = filename(title, ['svg', 'png'].includes(format) ? 'diagram' : format === 'pptx' ? 'slides' : 'report', format);
  const mime = downloadFormats[format].mime;
  if (format === 'md') return { data: new TextEncoder().encode(projectMarkdown(checkpoint)), name, mime };
  if (!checkpoint.diagram) throw new Error('An accepted diagram is required.');
  const assets = await (await import('./diagramDownload')).diagramAssets(checkpoint.diagram);
  if (format === 'svg') return { data: new TextEncoder().encode(assets.svg), name, mime };
  if (format === 'png') return { data: Uint8Array.from(atob(assets.png.split(',')[1]), char => char.charCodeAt(0)), name, mime };
  const data = await (await import('@/workers/exportClient')).renderFile(format, { document: checkpoint.document,
    settings: checkpoint.settings, diagram: checkpoint.diagram, diagramPng: assets.png });
  return { data: new Uint8Array(data), name, mime };
}
