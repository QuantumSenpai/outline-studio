import { describe, expect, it } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { exportDocx } from '@/adapters/renderers/docx/exportDocx';
import { exportPdf } from '@/adapters/renderers/pdf/exportPdf';
import { exportPptx } from '@/adapters/renderers/pptx/exportPptx';
import { document, diagram, settings } from './fixtures';

describe('actual export artifacts', () => {
  it('creates readable DOCX, PDF and PPTX containers from one IR', async () => {
    const input = { document, settings, diagram };
    const root = resolve('../../qa-output'); await mkdir(root,{recursive:true});
    const docx = await exportDocx(input); const word = await JSZip.loadAsync(docx);
    const xml = await word.file('word/document.xml')?.async('string');
    expect(xml).toContain('TCP'); expect(xml).toContain('w:tbl'); expect(xml).toContain('w:pgNumType');
    const fonts = { regular:new Uint8Array(await readFile('public/fonts/Tinos-Regular.ttf')),bold:new Uint8Array(await readFile('public/fonts/Tinos-Bold.ttf')) };
    const pdf = await exportPdf(input,fonts); expect((await PDFDocument.load(pdf)).getPages().length).toBeGreaterThanOrEqual(3);
    const pptx = await exportPptx(input); const slides = await JSZip.loadAsync(pptx);
    expect(slides.file('ppt/slides/slide1.xml')).not.toBeNull();
    expect(Object.keys(slides.files).filter(path=>/^ppt\/slides\/slide\d+\.xml$/.test(path)).length).toBeGreaterThan(2);
    await Promise.all([['docx',docx],['pdf',pdf],['pptx',pptx]].map(([ext,data]) => writeFile(`${root}/computer-networks-tcp-udp-report.${ext}`,data)));
  });
});
