import JSZip from 'jszip';
import type { ChatAttachment, ChatAttachmentKind, ChatAttachmentMeta } from '@outline-studio/schemas';

const MAX_FILES = 6;
const MAX_BYTES = 4000000;
const MAX_TEXT = 20000;
const MAX_IMAGE_EDGE = 1280;

function kindFor(file: File): ChatAttachmentKind | null {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('image/')) return 'image';
  if (/\.(md|markdown|txt)$/.test(name)) return 'markdown';
  if (/\.pdf$/.test(name)) return 'pdf';
  if (/\.docx$/.test(name)) return 'docx';
  return null;
}

function decodeEntities(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function imageData(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare images for chat.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = canvas.toDataURL('image/jpeg', 0.82);
  if (data.length > 5600000) throw new Error(`${file.name} is still too large after resizing.`);
  return data;
}

async function docxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) throw new Error(`${file.name} does not contain a Word document.`);
  return decodeEntities(xml.replace(/<\/w:p>/g, '\n').replace(/<w:tab[^>]*\/>/g, '\t').replace(/<[^>]+>/g, '')).slice(0, MAX_TEXT);
}

async function prepare(file: File, kind: ChatAttachmentKind): Promise<ChatAttachment> {
  const base = { id: crypto.randomUUID(), name: file.name.slice(0, 200), kind, size: file.size };
  if (kind === 'image') return { ...base, data: await imageData(file) };
  if (kind === 'pdf') return { ...base, data: await readDataUrl(file) };
  const text = kind === 'docx' ? await docxText(file) : (await file.text()).slice(0, MAX_TEXT);
  if (!text.trim()) throw new Error(`${file.name} has no readable text.`);
  return { ...base, text };
}

export async function prepareAttachments(files: File[]): Promise<ChatAttachment[]> {
  if (!files.length) return [];
  if (files.length > MAX_FILES) throw new Error(`Attach at most ${MAX_FILES} files at once.`);
  const result: ChatAttachment[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 4 MB.`);
    const kind = kindFor(file);
    if (!kind) throw new Error(`${file.name} is not a supported image, Markdown, PDF or DOCX file.`);
    result.push(await prepare(file, kind));
  }
  return result;
}

export function attachmentMeta(attachment: ChatAttachment): ChatAttachmentMeta {
  const { id, name, kind, size, text } = attachment;
  return { id, name, kind, size, ...(text ? { text } : {}) };
}
