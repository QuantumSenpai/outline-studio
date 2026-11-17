import type { RetainedFile } from '@/domain/projects/schema';
const types: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', svg: 'image/svg+xml', png: 'image/png', md: 'text/markdown' };
export function validateArtifact(metadata: Omit<RetainedFile, 'data'>, bytes: Uint8Array) {
  const extension = metadata.name.split('.').at(-1)?.toLowerCase() ?? '';
  if (types[extension] !== metadata.mime) throw new Error('Retained file extension and MIME type do not match.');
  if (extension === 'png' && [137, 80, 78, 71, 13, 10, 26, 10].some((value, index) => bytes[index] !== value)) throw new Error('Invalid retained PNG file.');
  const header = new TextDecoder().decode(bytes.subarray(0, 8));
  if (extension === 'pdf' && !header.startsWith('%PDF-')) throw new Error('Invalid retained PDF file.');
  if (['docx', 'pptx'].includes(extension) && !header.startsWith('PK')) throw new Error('Invalid retained Office document.');
  if (['md', 'svg'].includes(extension)) new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
