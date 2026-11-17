import { PDFParse } from 'pdf-parse';
import type { ChatAttachment } from '@outline-studio/schemas';
import { ApiError } from '../errors';

const MAX_TEXT = 20000;
const MAX_BYTES = 4000000;

export async function resolveAttachments(attachments: ChatAttachment[], signal: AbortSignal) {
  const resolved = [];
  for (const attachment of attachments) {
    if (signal.aborted) throw new ApiError('cancelled', 'Chat was cancelled while reading attachments.', 499);
    if (attachment.kind !== 'pdf') {
      resolved.push(attachment);
      continue;
    }
    const bytes = Buffer.from((attachment.data ?? '').replace(/^data:[^,]+,/, ''), 'base64');
    if (!bytes.length || bytes.length > MAX_BYTES || bytes.subarray(0, 4).toString() !== '%PDF') throw new ApiError('invalid_input', 'Only valid PDF files under 4 MB can be read.', 422);
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      resolved.push({ ...attachment, data: undefined, text: (result.text || '').slice(0, MAX_TEXT) });
    } catch {
      throw new ApiError('invalid_input', 'This PDF could not be read. Remove it or use a text-based PDF.', 422);
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
  return resolved;
}

export function attachmentImages(attachments: ChatAttachment[]) {
  return attachments.filter(item => item.kind === 'image' && item.data).map(item => item.data!);
}
