import { it, expect } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { documentSchema } from '@outline-studio/schemas';
import { PDFDocument } from 'pdf-lib';
import { newCheckpoint } from '@/domain/pipeline/checkpoint';
import { exportDocx } from '@/adapters/renderers/docx/exportDocx';
import { exportPdf } from '@/adapters/renderers/pdf/exportPdf';
import { exportPptx } from '@/adapters/renderers/pptx/exportPptx';

it('exports four unrelated template documents with long paragraphs, lists, tables and metadata', async () => {
  const cases = [['academic', 'Urban forest cooling and community stewardship'], ['professional', 'Museum accessibility improvement report'],
    ['research', 'A proposed study of coastal erosion'], ['solutions', 'Q1. Algebra and geometry worked exercises']] as const;
  await mkdir('../../qa-output/templates', { recursive: true });
  for (const [style, title] of cases) {
    const paragraph = `${title}. Synthetic layout fixture: café, Δ and Ελληνικά. Review evidence independently. `;
    const document = documentSchema.parse({ version: 1, title, abstract: paragraph.repeat(4),
      sections: [{ heading: style === 'solutions' ? 'Q1(a) · Working steps' : 'Background and method', paragraphs: [paragraph.repeat(40)],
        bullets: ['State the assumptions.', 'Explain the limits.'], table: { headers: ['Criterion', 'Finding'], rows: [['Evidence', 'Synthetic example'], ['Limit', 'Not a verified study']] }, math: ['x^2 + y^2 = z^2'] },
      { heading: 'Limitations and next steps', paragraphs: [paragraph.repeat(8)] }], warnings: ['Synthetic layout fixture; not live research or a generated result.'] });
    const settings = { ...newCheckpoint(style).settings, student: 'Synthetic Student', roll: 'TEST-001', section: 'A', course: title,
      department: 'Example department', university: 'Example institution supplied for tests', supervisor: 'User-supplied faculty', date: '2026-11-17', contents: style === 'academic' };
    const family = style === 'professional' ? 'NotoSans' : 'Tinos';
    const fonts = { regular: new Uint8Array(await readFile(`public/fonts/${family}-Regular.ttf`)), bold: new Uint8Array(await readFile(`public/fonts/${family}-Bold.ttf`)) };
    const input = { document, settings }; const pdf = await exportPdf(input, fonts);
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThanOrEqual(3);
    for (const [extension, bytes] of [['pdf', pdf], ['docx', await exportDocx(input)], ['pptx', await exportPptx(input)]] as const)
      await writeFile(`../../qa-output/templates/${style}.${extension}`, bytes);
  }
});
