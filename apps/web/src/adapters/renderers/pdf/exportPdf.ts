import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { exportInputSchema, type ExportInput } from '../types';
import { textLayout } from './layout';

export async function exportPdf(value: ExportInput, fonts: { regular: Uint8Array; bold: Uint8Array }) {
  const input = exportInputSchema.parse(value); const { document: doc, settings } = input;
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit); pdf.setTitle(doc.title); pdf.setAuthor('');
  const font = await pdf.embedFont(fonts.regular, { subset: true });
  const bold = await pdf.embedFont(fonts.bold, { subset: true });
  const [width, height] = settings.pageSize === 'A4' ? [595.28, 841.89] : [612, 792];
  const margin = settings.margin * 2.83465;
  const layout = textLayout(pdf, font, bold, width, height, margin, settings.lineSpacing);
  if (settings.cover) {
    if (settings.logo) {
      const image = settings.logo.startsWith('data:image/png') ? await pdf.embedPng(settings.logo) : await pdf.embedJpg(settings.logo);
      const size = image.scaleToFit(75,75); layout.getPage().drawImage(image, { x: (width-size.width)/2, y: layout.getY()-size.height, ...size }); layout.move(size.height+28);
    }
    for (const text of [settings.university, settings.department]) if (text) layout.write(text, 14);
    layout.move(65); layout.write(doc.title, 25, true); layout.move(28);
    for (const text of [settings.course, settings.student, settings.roll && `Roll: ${settings.roll}`, settings.section && `Section: ${settings.section}`,
      settings.supervisor && `Faculty: ${settings.supervisor}`, settings.date]) if (text) layout.write(text, 13);
    layout.nextPage();
  }
  if (settings.contents) {
    layout.write('Contents', 20, true); doc.sections.forEach(s => layout.write(s.heading)); layout.nextPage();
  }
  layout.write(doc.title, 22, true);
  if (doc.abstract) { layout.write('Abstract',16,true); layout.write(doc.abstract); }
  if (doc.keywords.length) layout.write(`Keywords: ${doc.keywords.join(', ')}`);
  for (const section of doc.sections) {
    layout.write(section.heading, 17, true); section.paragraphs.forEach(p => layout.write(p));
    section.bullets.forEach(p => layout.write(`• ${p}`, 12, false, 10));
    if (section.table) {
      layout.write(section.table.headers.join(' | '), 11, true);
      for (const row of section.table.rows) layout.write(row.map((cell, i) => `${section.table?.headers[i] ?? 'Value'}: ${cell}`).join(' · '),11);
    }
    section.math.forEach(math => layout.write(`Equation (TeX): ${math}`, 11));
  }
  if (input.diagram && input.diagramPng) {
    const image = await pdf.embedPng(input.diagramPng); const fit = image.scaleToFit(width-margin*2, 330);
    layout.reserve(fit.height + 65); layout.getPage().drawImage(image, { x: (width-fit.width)/2, y: layout.getY()-fit.height, ...fit });
    layout.move(fit.height+12); layout.write(`Figure 1. ${input.diagram.caption}`, 11);
  }
  if (doc.references.length) { layout.write('References', 17, true); doc.references.forEach((source,i) => layout.write(`${i+1}. ${source.title}. ${source.url}`, 11)); }
  const pages = pdf.getPages();
  pages.forEach((page,index) => {
    const excluded = settings.cover && !settings.numberCover ? 1 : 0;
    if (settings.numbering && index >= excluded) page.drawText(String(settings.numberStart + index - excluded), { x: width/2, y: 26, size: 10, font });
    if (settings.watermark) page.drawText('Outline Studio draft', { x: margin, y: height-28, size: 10, font, color: rgb(.5,.5,.5) });
  });
  return pdf.save();
}
