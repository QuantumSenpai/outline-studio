import { abstractLabel, sectionLabel } from '@outline-studio/config';
import PptxGenJS from 'pptxgenjs';
import { exportInputSchema, type ExportInput } from '../types';

export async function exportPptx(value: ExportInput) {
  const { document: doc, settings, diagram, diagramPng } = exportInputSchema.parse(value);
  const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'; pptx.author = ''; pptx.subject = doc.title; pptx.title = doc.title;
  const fontFace = settings.style === 'professional' ? 'Arial' : 'Times New Roman';
  let slideCount = 0;
  pptx.theme = { headFontFace: fontFace, bodyFontFace: fontFace };
  function slide(title: string, subtitle?: string, cover = false) {
    const current = pptx.addSlide(); slideCount += 1; current.background = { color: 'F7F4EE' };
    current.addText(title, { x: .65, y: .5, w: 12, h: 1.1, fontSize: 30, bold: true, color: '1E2030', breakLine: false, margin: 0, fit: 'shrink' });
    if (subtitle) current.addText(subtitle, { x: .65, y: 1.75, w: 11.8, h: 1.1, fontSize: 20, color: '535360', margin: 0, fit: 'shrink' });
    if (settings.numbering && (!cover || settings.numberCover)) current.addText(String(slideCount - (settings.cover && !settings.numberCover ? 2 : 1) + settings.numberStart), { x: 12, y: 7.03, w: .7, h: .2, fontSize: 10, color: '666666', align: 'right', margin: 0 });
    if (settings.watermark) current.addText('Outline Studio draft', { x: .65, y: 7.03, w: 4, h: .2, fontSize: 10, color: '777777', margin: 0 });
    return current;
  }
  if (settings.cover) {
    const title = slide(doc.title, settings.course || 'Presentation summary', true);
    const metadata = [settings.student && `Prepared by: ${settings.student}`, settings.roll && `Roll: ${settings.roll}`, settings.section && `Section: ${settings.section}`,
      settings.university, settings.department, settings.supervisor && `Faculty: ${settings.supervisor}`, settings.date].filter(Boolean);
    title.addNotes([...metadata, `Keywords: ${doc.keywords.join(', ')}`].join('\n'));
    if (settings.logo) title.addImage({ data: settings.logo, x: 11.1, y: 5.2, w: 1.1, h: 1.1 });
    for (let start = 0; start < metadata.length; start += 4) {
      const current = slide('Project details');
      metadata.slice(start, start + 4).forEach((text, index) => current.addText(text, { x: .65, y: 1.9 + index * 1.1, w: 12, h: .9, fontSize: 18, color: '535360', margin: 0, fit: 'shrink' }));
    }
  }
  if (doc.abstract) { const current = slide(`${abstractLabel(settings.style)}${doc.abstract.length > 700 ? ' · excerpt' : ''}`); current.addText(doc.abstract.length > 700 ? `${doc.abstract.slice(0, 697)}…` : doc.abstract, { x: .65, y: 1.9, w: 12, h: 4.6, fontSize: 20, color: '1E2030', margin: 0, fit: 'shrink' }); current.addNotes(doc.abstract); }
  for (const [sectionIndex, section] of doc.sections.entries()) {
    const points = (section.bullets.length ? section.bullets : section.paragraphs).map(p => p.length > 220 ? `${p.slice(0,217).replace(/\s+\S*$/, '')}…` : p);
    for (let start = 0; start < points.length; start += 4) {
      const current = slide(`${sectionLabel(section.heading, sectionIndex, settings.style)}${start ? ' (continued)' : ''}`);
      current.addNotes([...section.paragraphs, ...section.bullets, ...section.math.map(text => `Equation (TeX): ${text}`)].join('\n\n'));
      const rows = points.slice(start, start + 4);
      rows.forEach((text, index) => current.addText(text, { x: .9, y: 2 + index * 1.05, w: 11.4, h: .85,
        fontSize: 21, color: '1E2030', bullet: { indent: 20 }, margin: 0, breakLine: false, fit: 'shrink' }));
    }
    for (const [index, math] of section.math.entries()) {
      const current = slide(`${section.heading} · equation ${index + 1}`);
      current.addText(`Literal TeX source · inspect the typeset preview before use.\n\n${math}`, { x: .65, y: 1.9, w: 12, h: 4.6, fontSize: 18, fontFace: 'Courier New', color: '1E2030', margin: 0, fit: 'shrink' }); current.addNotes(math);
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
  for (const warning of doc.warnings) {
    const current = slide('Review notes');
    current.addText(warning, { x: .65, y: 1.9, w: 12, h: 4.6, fontSize: 18, color: '1E2030', margin: 0, fit: 'shrink' }); current.addNotes(warning);
  }
  const buffer = await pptx.write({ outputType: 'arraybuffer', compression: true });
  if (!(buffer instanceof ArrayBuffer)) throw new Error('Presentation export did not produce a valid file buffer.');
  return new Uint8Array(buffer);
}
