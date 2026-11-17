import { expose } from 'comlink';
import { exportInputSchema, type ExportFormat } from '@/adapters/renderers/types';

export const exportService = {
  async render(format: ExportFormat, value: unknown, fonts?: { regular: Uint8Array; bold: Uint8Array }) {
    const input = exportInputSchema.parse(value);
    if (format === 'docx') return (await import('@/adapters/renderers/docx/exportDocx')).exportDocx(input);
    if (format === 'pptx') return (await import('@/adapters/renderers/pptx/exportPptx')).exportPptx(input);
    if (format === 'pdf' && fonts) return (await import('@/adapters/renderers/pdf/exportPdf')).exportPdf(input, fonts);
    throw new Error('Unsupported export format or missing PDF fonts.');
  },
};
expose(exportService);
