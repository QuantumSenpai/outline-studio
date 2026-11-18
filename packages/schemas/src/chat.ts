import { z } from 'zod';
import { connectionSchema } from './provider';
import { documentSchema } from './document';

const publicUrl = z.url().max(2000).refine(value => { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; });
export const chatAttachmentKindSchema = z.enum(['image', 'markdown', 'pdf', 'docx']);
export const chatAttachmentMetaSchema = z.object({ id: z.uuid(), name: z.string().max(200), kind: chatAttachmentKindSchema,
  size: z.number().int().min(1).max(4000000), text: z.string().max(20000).optional() }).strict();
export const chatAttachmentSchema = chatAttachmentMetaSchema.extend({ data: z.string().max(5600000).optional() })
  .refine(value => value.kind === 'image' || value.kind === 'pdf' ? Boolean(value.data) : Boolean(value.text), 'Attachment content is missing.');
export const chatDocumentationSchema = z.object({ sources: z.array(z.object({ title: z.string().max(200), url: publicUrl }).strict()).max(6),
  notice: z.string().max(500).optional() }).strict();
export const conversationMessageSchema = z.object({ id: z.string(), role: z.enum(['user', 'studio']), text: z.string().max(16000),
  documentation: chatDocumentationSchema.optional(), attachments: z.array(chatAttachmentMetaSchema).max(6).optional() });
export const documentationQuerySchema = z.object({ query: z.string().trim().min(3).max(500).refine(value => !/\b(?:gsk_|sk-|ctx7sk-|Bearer\s)[\w-]{12,}/i.test(value), 'Remove credentials from the public documentation question.'),
  library: z.string().trim().max(100).default('') }).strict();
export const chatRequestSchema = z.object({ requestId: z.uuid(), connection: connectionSchema,
  messages: z.array(z.object({ role: z.enum(['user', 'studio']), text: z.string().trim().min(1).max(16000) }).strict()).min(1).max(20),
  documentation: documentationQuerySchema.optional(), document: documentSchema.optional(),
  attachments: z.array(chatAttachmentSchema).max(6).default([]) }).strict().superRefine((value, context) => {
  if (value.messages.at(-1)?.role !== 'user') context.addIssue({ code: 'custom', message: 'A chat request must end with your message.' });
  if (value.messages.reduce((total, message) => total + message.text.length, 0) > 60000) context.addIssue({ code: 'custom', message: 'Chat context exceeds its limit. Start a new project or send a shorter message.' });
  const bytes = value.attachments.reduce((total, item) => total + (item.data?.length ?? 0) + (item.text?.length ?? 0), 0);
  if (bytes > 8000000) context.addIssue({ code: 'custom', message: 'Attachments exceed the shared context limit. Use smaller files.' });
});
export const chatEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), requestId: z.uuid(), text: z.string().max(16000) }),
  z.object({ type: z.literal('done'), requestId: z.uuid(), text: z.string().min(1).max(16000), documentation: chatDocumentationSchema }),
]);
export type ChatAttachment = z.infer<typeof chatAttachmentSchema>;
export type ChatAttachmentKind = z.infer<typeof chatAttachmentKindSchema>;
export type ChatAttachmentMeta = z.infer<typeof chatAttachmentMetaSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatDocumentation = z.infer<typeof chatDocumentationSchema>;
export type DocumentationQuery = z.infer<typeof documentationQuerySchema>;
export type DocumentationSettings = DocumentationQuery & { enabled: boolean };
