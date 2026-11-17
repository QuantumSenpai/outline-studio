import { documentSchema, diagramSchema, outlineSchema, reviewSchema, settingsSchema } from '@outline-studio/schemas';
export const outline = outlineSchema.parse({ title: 'Computer networks: TCP and UDP', sections: ['Connection model', 'Delivery and tradeoffs'], requirements: ['Compare reliability', 'Include a labelled diagram'] });
export const document = documentSchema.parse({ version: 1, title: outline.title,
  abstract: 'An illustrative networking comparison used only for automated tests.', keywords: ['TCP', 'UDP'],
  sections: [{ heading: 'Connection model', paragraphs: ['TCP exposes a connection-oriented byte stream. UDP carries independent datagrams. Δ latency, café and Ελληνικά test Unicode handling.'],
    table: { headers: ['Property', 'TCP', 'UDP'], rows: [['Delivery', 'Ordered byte stream', 'Datagrams'], ['Reliability', 'Retransmission', 'Application dependent']] } },
  { heading: 'Delivery and tradeoffs', paragraphs: ['Applications choose protocols according to their requirements. Neither protocol is universally better.'], bullets: ['Verify transport requirements.', 'Review the meaning of each diagram edge.'], math: ['x^2 + y^2 = z^2'] }],
  references: [{ title: 'Transmission Control Protocol', url: 'https://www.rfc-editor.org/rfc/rfc9293' }], warnings: ['Synthetic test fixture; not a live model result.'] });
export const diagram = diagramSchema.parse({ caption: 'A transport selection example', nodes: [
  { id: 'a', label: 'Application requirement', shape: 'start' }, { id: 'b', label: 'Ordered reliable stream?', shape: 'decision' },
  { id: 'c', label: 'Consider TCP', shape: 'process' }, { id: 'd', label: 'Consider UDP', shape: 'process' }],
  edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'Yes' }, { from: 'b', to: 'd', label: 'No' }] });
export const review = reviewSchema.parse({ criteria: [{ requirement: 'Compare reliability', status: 'met', detail: 'Both transports are described.' },
  { requirement: 'Include a labelled diagram', status: 'met', detail: 'All nodes and branches carry labels.' }], warnings: ['Verify the technical meaning yourself.'] });
export const settings = settingsSchema.parse({ student: 'Synthetic Student', university: 'Example institution supplied for tests', course: 'Computer networks', contents: true });
