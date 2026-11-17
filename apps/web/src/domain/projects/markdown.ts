import type { Checkpoint } from '../pipeline/checkpoint';

export function projectMarkdown(checkpoint: Checkpoint) {
  const document = checkpoint.document;
  const lines = [`# ${document?.title ?? checkpoint.outline?.title ?? 'Outline Studio project'}`, '',
    checkpoint.review ? 'User-reviewed structured revision. Verify factual accuracy and citations.' : 'Draft snapshot. Review is incomplete.', '',
    ...[checkpoint.settings.student, checkpoint.settings.roll, checkpoint.settings.course, checkpoint.settings.department, checkpoint.settings.university, checkpoint.settings.supervisor, checkpoint.settings.date].filter(Boolean), ''];
  if (!document) return [...lines, '## Brief', checkpoint.brief || checkpoint.composer, '', '## Outline', ...(checkpoint.outline?.sections ?? []).map(heading => `- ${heading}`)].join('\n');
  if (document.abstract) lines.push('## Abstract', document.abstract, '');
  if (document.keywords.length) lines.push(`Keywords: ${document.keywords.join(', ')}`, '');
  const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  for (const section of document.sections) {
    lines.push(`## ${section.heading}`, '', ...section.paragraphs.flatMap(text => [text, '']), ...section.bullets.map(text => `- ${text}`), '');
    if (section.table) lines.push(`| ${section.table.headers.map(cell).join(' | ')} |`, `| ${section.table.headers.map(() => '---').join(' | ')} |`, ...section.table.rows.map(row => `| ${row.map(cell).join(' | ')} |`), '');
    for (const equation of section.math) lines.push('```tex', equation, '```', '');
  }
  if (checkpoint.diagram) lines.push(`Figure 1. ${checkpoint.diagram.caption}`, '', 'Diagram labels:', ...checkpoint.diagram.nodes.map(node => `- ${node.id}: ${node.label}`),
    ...checkpoint.diagram.edges.map(edge => `- ${edge.from} → ${edge.to}${edge.label ? ` (${edge.label})` : ''}`), '');
  if (document.references.length) lines.push('## References', ...document.references.map((source, index) => `${index + 1}. ${source.title} — ${source.url}${source.doi ? ` DOI: ${source.doi}` : ''}`), '');
  if (document.warnings.length) lines.push('## Review notes', ...document.warnings.map(text => `- ${text}`), '');
  if (checkpoint.review) lines.push('## Requirement review', ...checkpoint.review.criteria.map(item => `- [${item.status}] ${item.requirement}: ${item.detail}`), ...checkpoint.review.warnings.map(text => `- ${text}`));
  return lines.join('\n');
}
