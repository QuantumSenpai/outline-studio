import { type PDFPage, type PDFFont, type PDFDocument, rgb } from 'pdf-lib';

export function textLayout(pdf: PDFDocument, font: PDFFont, bold: PDFFont, width: number, height: number, margin: number, spacing: number) {
  let page: PDFPage = pdf.addPage([width, height]); let y = height - margin;
  const supported = new Set(font.getCharacterSet());
  function assertGlyphs(text: string) {
    const missing = [...text].find(char => !/\s/.test(char) && !supported.has(char.codePointAt(0) ?? 0));
    if (missing) throw new Error(`PDF font does not support “${missing}”. Use DOCX/PPTX with a suitable installed font, or revise this character. Nothing was silently substituted.`);
  }
  function nextPage() { page = pdf.addPage([width, height]); y = height - margin; }
  function write(text: string, size = 12, strong = false, indent = 0) {
    assertGlyphs(text);
    const face = strong ? bold : font; const max = width - margin * 2 - indent;
    const words = text.replace(/\r/g, '').split(/\s+/); const lines: string[] = []; let line = '';
    for (const word of words) {
      if (face.widthOfTextAtSize(word, size) > max) {
        if (line) { lines.push(line); line = ''; }
        let fragment = '';
        for (const char of word) {
          if (face.widthOfTextAtSize(fragment + char, size) > max) { lines.push(fragment); fragment = ''; }
          fragment += char;
        }
        line = fragment; continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (face.widthOfTextAtSize(candidate, size) > max) { lines.push(line); line = word; } else line = candidate;
    }
    if (line) lines.push(line);
    const lineHeight = size * spacing;
    if (strong && y - lineHeight * Math.min(lines.length + 2, 6) < margin) nextPage();
    for (const text of lines) {
      if (y - lineHeight < margin) nextPage();
      page.drawText(text, { x: margin + indent, y: y - size, size, font: face, color: rgb(.08,.08,.08) }); y -= lineHeight;
    }
    y -= size * .65;
  }
  return { write, nextPage, getPage: () => page, getY: () => y,
    reserve: (space: number) => { if (y - space < margin) nextPage(); }, move: (space: number) => { y -= space; } };
}
