import PptxGenJS from 'pptxgenjs';
import { exportInputSchema, type ExportInput } from '../types';

export async function exportPptx(value: ExportInput) {
  const { document: doc, settings, diagram, diagramPng } = exportInputSchema.parse(value);
  const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'; pptx.author = ''; pptx.subject = doc.title; pptx.title = doc.title;
  const fontFace = settings.style === 'professional' ? 'Arial' : 'Times New Roman';
  let slideCount = 0;
  pptx.theme = { headFontFace: fontFace, bodyFontFace: fontFace };
  function slide(title: string, subtitle?: string) {
    const current = pptx.addSlide(); slideCount += 1; current.background = { color: 'F7F4EE' };
    current.addText(title, { x: .65, y: .5, w: 12, h: 1.1, fontSize: 30, bold: true, color: '1E2030', breakLine: false, margin: 0, fit: 'shrink' });
    if (subtitle) current.addText(subtitle, { x: .65, y: 1.75, w: 11.8, h: 1.1, fontSize: 20, color: '535360', margin: 0, fit: 'shrink' });
    if (settings.numbering) current.addText(String(slideCount - 1 + settings.numberStart), { x: 12, y: 7.03, w: .7, h: .2, fontSize: 10, color: '666666', align: 'right', margin: 0 });
    if (settings.watermark) current.addText('Outline Studio draft', { x: .65, y: 7.03, w: 4, h: .2, fontSize: 10, color: '777777', margin: 0 });
    return current;
  }
  const title = slide(doc.title, settings.course || 'Presentation summary');
  const details = [settings.student, settings.university, settings.date].filter(Boolean).join(' · ');
  if (details) title.addText(details, { x: .65, y: 5.7, w: 10.8, h: .7, fontSize: 16, color: '535360', margin: 0, fit: 'shrink' });
  if (settings.logo) title.addImage({ data: settings.logo, x: 11.1, y: 5.2, w: 1.1, h: 1.1 });
  for (const section of doc.sections) {
    const points = (section.bullets.length ? section.bullets : section.paragraphs).map(p => p.length > 220 ? `${p.slice(0,217).replace(/\s+\S*$/, '')}…` : p);
    for (let start = 0; start < points.length; start += 4) {
      const current = slide(`${section.heading}${start ? ' (continued)' : ''}`);
      const rows = points.slice(start, start + 4);
      rows.forEach((text, index) => current.addText(text, { x: .9, y: 2 + index * 1.05, w: 11.4, h: .85,
        fontSize: 21, color: '1E2030', bullet: { indent: 20 }, margin: 0, breakLine: false, fit: 'shrink' }));
    }
    if (section.table) {
      const current = slide(`${section.heading} · comparison`);
      current.addTable([section.table.headers, ...section.table.rows].map(row => row.map(text => ({ text, options: { fontFace } }))),
        { x: .65, y: 1.9, w: 12, h: 4.5, fontSize: 16, border: { type: 'solid', pt: .7, color: '888888' },
          color: '1E2030', fill: { color: 'FFFFFF' }, margin: .1, autoPage: true, autoPageRepeatHeader: true, autoPageSlideStartY: 1.9 });
    }
  }
  if (diagram && diagramPng) {
    const current = slide('A visual explanation');
    current.addImage({ data: diagramPng, x: 2.6, y: 1.8, w: 8.1, h: 4.3 });
    current.addText(`Figure 1. ${diagram.caption}`, { x: .65, y: 6.4, w: 12, h: .4, fontSize: 14, color: '535360', margin: 0, fit: 'shrink' });
  }
  if (doc.references.length) {
    for (let start = 0; start < doc.references.length; start += 5) {
      const current = slide('References');
      doc.references.slice(start,start+5).forEach((source,i) => current.addText(`${start+i+1}. ${source.title}\n${source.url}`,
        { x: .65, y: 1.9+i*.9, w: 12, h: .75, fontSize: 14, color: '1E2030', margin: 0, fit: 'shrink' }));
    }
  }
  const buffer = await pptx.write({ outputType: 'arraybuffer', compression: true });
  if (!(buffer instanceof ArrayBuffer)) throw new Error('Presentation export did not produce a valid file buffer.');
  return new Uint8Array(buffer);
}
