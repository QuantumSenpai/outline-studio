import { documentSchema, diagramSchema, type DocumentIR, type DiagramIR } from '@outline-studio/schemas';

export function validateExport(document: DocumentIR, diagram?: DiagramIR) {
  const doc = documentSchema.parse(document);
  if (diagram) diagramSchema.parse(diagram);
  const problems: string[] = [];
  for (const section of doc.sections) {
    if (section.table?.rows.some(row => row.length !== section.table?.headers.length)) problems.push(`Table in “${section.heading}” has inconsistent columns.`);
  }
  if (new Set(doc.sections.map(section => section.heading)).size !== doc.sections.length) problems.push('Duplicate section headings need review.');
  if (problems.length) throw new Error(problems.join(' '));
  return { document: doc, diagram };
}
