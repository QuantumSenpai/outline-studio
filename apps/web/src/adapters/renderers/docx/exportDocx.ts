import { Document, Packer, Paragraph, Footer, Header, PageNumber, TextRun, ImageRun, type ISectionOptions } from 'docx';
import { renderBlocks } from './renderBlocks';
import { exportInputSchema, type ExportInput } from '../types';

export async function exportDocx(value: ExportInput) {
  const input = exportInputSchema.parse(value); const settings = input.settings;
  const academic = settings.style !== 'professional';
  const margin = Math.round(settings.margin * 56.693);
  const page = { size: settings.pageSize === 'A4' ? { width: 11906, height: 16838 } : { width: 12240, height: 15840 },
    margin: { top: margin, bottom: margin, left: margin, right: margin }, pageNumbers: { start: settings.numberStart } };
  const footer = new Footer({ children: [new Paragraph({ alignment: 'center', children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] });
  const header = new Header({ children: [new Paragraph({ text: 'Outline Studio draft', alignment: 'right' })] });
  const sections: ISectionOptions[] = [];
  if (settings.cover) {
    const details = [settings.university, settings.department, input.document.title, settings.course, settings.student,
      settings.roll && `Roll: ${settings.roll}`, settings.section && `Section: ${settings.section}`,
      settings.supervisor && `Faculty: ${settings.supervisor}`, settings.date].filter(Boolean);
    sections.push({ properties: { page }, headers: settings.watermark ? { default: header } : undefined,
      footers: settings.numbering && settings.numberCover ? { default: footer } : {},
      children: [
        ...(settings.logo ? [new Paragraph({ alignment: 'center', children: [new ImageRun({ type: settings.logo.startsWith('data:image/png') ? 'png' : 'jpg',
          data: settings.logo.split(',')[1], transformation: { width: 90, height: 90 } })] })] : []),
        ...details.map((text, index) => new Paragraph({ alignment: 'center', spacing: { before: index === 2 ? 1300 : 260, after: 180 },
          children: [new TextRun({ text, bold: index === 2, size: index === 2 ? 38 : 26 })] })),
      ] });
  }
  sections.push({ properties: { page: { ...page, pageNumbers: { start: settings.numberStart + (settings.cover && settings.numberCover ? 1 : 0) } } },
    footers: settings.numbering ? { default: footer } : {}, headers: settings.watermark ? { default: header } : undefined,
    children: renderBlocks(input) });
  const doc = new Document({ title: input.document.title, creator: '', description: 'User-reviewed document',
    styles: { default: { document: { run: { font: academic ? 'Times New Roman' : 'Arial', size: 24 },
      paragraph: { spacing: { line: Math.round(settings.lineSpacing * 240) } } } } }, sections });
  return new Uint8Array(await (await Packer.toBlob(doc)).arrayBuffer());
}
