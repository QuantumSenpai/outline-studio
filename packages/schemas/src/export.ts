import { z } from 'zod';

export const styleIdSchema = z.enum(['academic', 'professional', 'research', 'solutions']);
export const settingsSchema = z.object({
  style: styleIdSchema.default('academic'), student: z.string().max(120).default(''),
  roll: z.string().max(80).default(''), section: z.string().max(80).default(''),
  course: z.string().max(160).default(''), department: z.string().max(160).default(''),
  university: z.string().max(200).default(''), supervisor: z.string().max(120).default(''),
  date: z.string().max(40).default(''), cover: z.boolean().default(true), contents: z.boolean().default(false),
  pageSize: z.enum(['A4', 'LETTER']).default('A4'), margin: z.number().min(12).max(40).default(25),
  lineSpacing: z.number().min(1).max(2).default(1.5), numbering: z.boolean().default(true),
  numberStart: z.number().int().min(1).max(100).default(1), numberCover: z.boolean().default(false),
  watermark: z.boolean().default(false), logo: z.string().max(500000).regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/).optional(),
}).strict();
export type StyleId = z.infer<typeof styleIdSchema>;
export type DocumentSettings = z.infer<typeof settingsSchema>;
