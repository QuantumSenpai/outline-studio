import { Paragraph, TextRun, Table, TableCell, TableRow, WidthType, HeadingLevel, ImageRun } from 'docx';
import type { ExportInput } from '../types';

export function renderBlocks(input: ExportInput): (Paragraph | Table)[] {
  const { document: doc, settings, diagramPng, diagram } = input;
  const blocks: (Paragraph | Table)[] = [];
  const paragraph = (text: string) => new Paragraph({ text, spacing: { after: 180, line: Math.round(240 * settings.lineSpacing) } });
  if (settings.contents) {
    blocks.push(new Paragraph({ text: 'Contents', heading: HeadingLevel.HEADING_1 }));
    blocks.push(...doc.sections.map(s => paragraph(s.heading)));
    blocks.push(new Paragraph({ text: '', pageBreakBefore: true }));
  }
  blocks.push(new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }));
  if (doc.abstract) blocks.push(new Paragraph({ text: 'Abstract', heading: HeadingLevel.HEADING_1 }), paragraph(doc.abstract));
  if (doc.keywords.length) blocks.push(paragraph(`Keywords: ${doc.keywords.join(', ')}`));
  for (const section of doc.sections) {
    blocks.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1, keepNext: true }));
    blocks.push(...section.paragraphs.map(paragraph));
    blocks.push(...section.bullets.map(text => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 120 } })));
    if (section.table) {
      const rows = [section.table.headers, ...section.table.rows];
      blocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((row, index) =>
        new TableRow({ tableHeader: index === 0, cantSplit: true, children: row.map(text =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: index === 0 })] })] })) })) }));
    }
    blocks.push(...section.math.map(math => paragraph(`Equation (TeX): ${math}`)));
  }
  if (diagramPng && diagram) {
    blocks.push(new Paragraph({ children: [new ImageRun({ type: 'png', data: diagramPng.split(',')[1], transformation: { width: 430, height: 320 } })], alignment: 'center' }));
    blocks.push(paragraph(`Figure 1. ${diagram.caption}`));
  }
  if (doc.references.length) {
    blocks.push(new Paragraph({ text: 'References', heading: HeadingLevel.HEADING_1 }));
    blocks.push(...doc.references.map((source, index) => paragraph(`${index + 1}. ${source.title}. ${source.url}${source.doi ? ` DOI: ${source.doi}` : ''}`)));
  }
  if (doc.warnings.length) blocks.push(new Paragraph({ text: 'Review notes', heading: HeadingLevel.HEADING_1 }), ...doc.warnings.map(paragraph));
  return blocks;
}
