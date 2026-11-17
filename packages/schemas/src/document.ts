import { z } from 'zod';

const text = z.string().trim().min(1).max(12000);
export const sourceSchema = z.object({
  title: z.string().max(500), url: z.url().max(2000).refine(value => {
    const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password;
  }, 'Sources must use a public HTTPS link without credentials.'), doi: z.string().max(200).optional(),
  retrievedAt: z.iso.datetime().optional(), verifiedMetadata: z.boolean().default(false),
}).strict();
export const sectionSchema = z.object({
  heading: z.string().trim().min(1).max(180), paragraphs: z.array(text).min(1).max(12),
  bullets: z.array(z.string().max(2000)).max(12).default([]),
  table: z.object({ headers: z.array(z.string().max(120)).min(1).max(6),
    rows: z.array(z.array(z.string().max(800)).min(1).max(6)).max(24) }).optional(),
  math: z.array(z.string().max(1000)).max(6).default([]),
}).strict();
export const diagramSchema = z.object({
  caption: z.string().trim().min(1).max(240),
  nodes: z.array(z.object({ id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,15}$/),
    label: z.string().trim().min(1).max(100), shape: z.enum(['process', 'decision', 'start', 'data']) })).min(2).max(12),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().max(60).default('') })).min(1).max(18),
}).strict().superRefine((d, ctx) => {
  const ids = new Set(d.nodes.map(n => n.id));
  if (ids.size !== d.nodes.length || d.edges.some(e => !ids.has(e.from) || !ids.has(e.to)))
    ctx.addIssue({ code: 'custom', message: 'Diagram node identifiers must be unique and every connector must reference a node.' });
});
export const documentSchema = z.object({
  version: z.literal(1), title: z.string().trim().min(1).max(200),
  abstract: z.string().max(3000).default(''), keywords: z.array(z.string().max(60)).max(10).default([]),
  sections: z.array(sectionSchema).min(1).max(12),
  references: z.array(sourceSchema).max(40).default([]), warnings: z.array(z.string().max(800)).max(30).default([]),
}).strict();
export const outlineSchema = z.object({ title: z.string().trim().min(1).max(200),
  sections: z.array(z.string().trim().min(1).max(180)).min(2).max(8),
  requirements: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
  warnings: z.array(z.string().max(600)).max(12).default([]),
}).strict();
export const reviewSchema = z.object({
  criteria: z.array(z.object({ requirement: z.string().max(500),
    status: z.enum(['met', 'missing', 'unverified']), detail: z.string().max(1200) })).min(1).max(20),
  warnings: z.array(z.string().max(800)).max(20),
}).strict();
export type DocumentIR = z.infer<typeof documentSchema>;
export type Outline = z.infer<typeof outlineSchema>;
export type DiagramIR = z.infer<typeof diagramSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Source = z.infer<typeof sourceSchema>;
