import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { newCheckpoint } from '@/domain/pipeline/checkpoint';
import { exportDocx } from '@/adapters/renderers/docx/exportDocx';
import { exportPptx } from '@/adapters/renderers/pptx/exportPptx';
import { exportPdf } from '@/adapters/renderers/pdf/exportPdf';
import { settingsSchema } from '@outline-studio/schemas';
import { document, diagram } from './fixtures';

describe('real template settings and complete export content', () => {
  it('uses different defaults for the four real workspace templates', () => {
    expect(newCheckpoint('academic').settings).toMatchObject({ cover: true, lineSpacing: 1.5 });
    expect(newCheckpoint('professional').settings).toMatchObject({ cover: true, lineSpacing: 1.15 });
    expect(newCheckpoint('research').settings.cover).toBe(false);
    expect(newCheckpoint('solutions').settings.cover).toBe(false);
  });
  it('applies numbered academic headings, professional summary labels and preserved question numbering', async () => {
    for (const style of ['academic', 'professional', 'solutions'] as const) {
      const input = { document: { ...document, title: 'Urban forest cooling plan', sections: [{ ...document.sections[0], heading: 'Q2(a) · Canopy assessment' }] }, settings: newCheckpoint(style).settings, diagram };
      const file = await JSZip.loadAsync(await exportDocx(input)); const xml = await file.file('word/document.xml')?.async('string');
      expect(xml).toContain(style === 'academic' ? '1. Q2(a)' : 'Q2(a)');
      expect(xml).toContain(style === 'professional' ? 'Executive summary' : style === 'solutions' ? 'Opening notes' : 'Abstract');
    }
  });
  it('retains equations and review warnings in presentation slides and speaker notes', async () => {
    const file = await JSZip.loadAsync(await exportPptx({ document, settings: newCheckpoint('research').settings, diagram }));
    const paths = Object.keys(file.files).filter(path => /ppt\/(slides|notesSlides)\/(slide|notesSlide)\d+\.xml$/.test(path));
    const content = (await Promise.all(paths.map(path => file.file(path)!.async('string')))).join('');
    expect(content).toContain('x^2 + y^2 = z^2'); expect(content).toContain('Synthetic test fixture');
  });
  it('fails clearly on unsupported PDF glyphs rather than silently substituting', async () => {
    const fonts = { regular: new Uint8Array(await readFile('public/fonts/Tinos-Regular.ttf')), bold: new Uint8Array(await readFile('public/fonts/Tinos-Bold.ttf')) };
    const input = { document: { ...document, title: 'Unsupported glyph 😀' }, settings: newCheckpoint().settings };
    await expect(exportPdf(input, fonts)).rejects.toThrow(/does not support/);
  });
  it('rejects mislabeled logos and unsafe image dimensions before persistence/export', () => {
    const invalid = 'data:image/png;base64,' + btoa('icns-not-a-png');
    expect(settingsSchema.safeParse({ logo: invalid }).success).toBe(false);
    const data = new Uint8Array(33); data.set([137,80,78,71,13,10,26,10]); const view = new DataView(data.buffer);
    view.setUint32(8,13); data.set(new TextEncoder().encode('IHDR'),12); view.setUint32(16,100000); view.setUint32(20,100000);
    expect(settingsSchema.safeParse({ logo: 'data:image/png;base64,' + btoa(String.fromCharCode(...data)) }).success).toBe(false);
  });
});
