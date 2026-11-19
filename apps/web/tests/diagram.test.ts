import { describe, expect, it } from 'vitest';
import { diagram } from './fixtures';
import { graphvizSource, mermaidSource } from '@/domain/ir/diagramSources';

describe('diagram sources', () => {
  it('emits a spacious, readable GraphViz figure with distinct node styles', () => {
    const source = graphvizSource(diagram);
    expect(source).toContain('ranksep="0.9"');
    expect(source).toContain('fontname="Helvetica,Arial"');
    expect(source).toContain('a [shape=ellipse,style="solid,setlinewidth(1.6)"');
    expect(source).toContain('c [shape=box,style="rounded,setlinewidth(1.6)"');
    expect(source).toContain('b -> c [label="Yes"]');
    expect(source.match(/->/g)).toHaveLength(3);
  });
  it('keeps the Mermaid fallback escaped and complete', () => {
    const source = mermaidSource(diagram);
    expect(source.startsWith('flowchart TD')).toBe(true);
    expect(source).toContain('n1{"Ordered reliable stream?"}');
    expect(source.match(/-->/g)).toHaveLength(3);
  });
  it('escapes special characters in node and edge labels', () => {
    const source = mermaidSource({ ...diagram,
      nodes: diagram.nodes.map(node => ({ ...node, label: 'A "quote" <tag> & value\nnext' })),
      edges: diagram.edges.map(edge => ({ ...edge, label: '"yes" < 2 & 3' })),
    });
    expect(source).toContain('A &quot;quote&quot; &lt;tag&gt; &amp; value next');
    expect(source).toContain('|"&quot;yes&quot; &lt; 2 &amp; 3"|');
  });
});
