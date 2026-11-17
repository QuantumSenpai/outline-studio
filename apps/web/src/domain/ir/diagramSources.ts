import { diagramSchema, type DiagramIR } from '@outline-studio/schemas';

export function graphvizSource(value: DiagramIR) {
  const diagram = diagramSchema.parse(value);
  const shape = { process: 'box', decision: 'diamond', start: 'ellipse', data: 'parallelogram' };
  return `digraph Figure { graph [rankdir=TB,bgcolor="white",pad="0.4",nodesep="0.6",ranksep="0.7"]; node [fontname="Arial",fontsize=16,color="black",penwidth=1.4,margin="0.2,0.15"]; edge [fontname="Arial",fontsize=13,color="black",penwidth=1.4];
${diagram.nodes.map(n => `${n.id} [shape=${shape[n.shape]},label=${JSON.stringify(n.label)}];`).join('\n')}
${diagram.edges.map(e => `${e.from} -> ${e.to} [label=${JSON.stringify(e.label)}];`).join('\n')}
}`;
}
export function mermaidSource(value: DiagramIR) {
  const diagram = diagramSchema.parse(value);
  const label = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\r\n]/g, ' ');
  const ids = new Map(diagram.nodes.map((node, index) => [node.id, `n${index}`]));
  const shapes = { process: ['["', '"]'], decision: ['{"', '"}'], start: ['(["', '"])'], data: ['[/"', '"/]'] };
  return `flowchart TD\n${diagram.nodes.map(n => `${ids.get(n.id)}${shapes[n.shape][0]}${label(n.label)}${shapes[n.shape][1]}`).join('\n')}\n${diagram.edges.map(e => `${ids.get(e.from)} -->${e.label ? `|"${label(e.label)}"|` : ''} ${ids.get(e.to)}`).join('\n')}`;
}
