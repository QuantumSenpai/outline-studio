import type { Checkpoint } from '../pipeline/checkpoint';

export function compareVersions(before: Checkpoint, after: Checkpoint) {
  const changes: { field: string; before: string; after: string }[] = [];
  const add = (field: string, left: unknown, right: unknown) => {
    if (JSON.stringify(left) !== JSON.stringify(right)) changes.push({ field, before: typeof left === 'string' ? left : JSON.stringify(left ?? null), after: typeof right === 'string' ? right : JSON.stringify(right ?? null) });
  };
  add('Conversation mode', before.mode, after.mode); add('Draft request', before.composer, after.composer); add('Conversation', before.messages, after.messages);
  add('Brief', before.brief, after.brief); add('Document title', before.document?.title, after.document?.title);
  add('Accepted outline', before.outline, after.outline); add('Abstract', before.document?.abstract, after.document?.abstract);
  const headings = new Set([...(before.document?.sections ?? []), ...(after.document?.sections ?? [])].map(section => section.heading));
  for (const heading of headings) add(`Section: ${heading}`, before.document?.sections.filter(section => section.heading === heading), after.document?.sections.filter(section => section.heading === heading));
  add('Diagram', before.diagram, after.diagram); add('Sources', before.sources, after.sources);
  add('Settings', before.settings, after.settings); add('Review', before.review, after.review);
  return changes;
}
