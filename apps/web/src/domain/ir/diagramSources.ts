import { diagramSchema, type DiagramIR } from '@outline-studio/schemas';

const shape = { process: 'box', decision: 'diamond', start: 'ellipse', data: 'parallelogram', rectangle: 'box', ellipse: 'ellipse', diamond: 'diamond', parallelogram: 'parallelogram', cylinder: 'cylinder', document: 'note' };
const style = { process: 'rounded', decision: 'solid', start: 'solid', data: 'solid', rectangle: 'rounded', ellipse: 'solid', diamond: 'solid', parallelogram: 'solid', cylinder: 'solid', document: 'rounded' };

export function graphvizSource(value: DiagramIR) {
  const diagram = diagramSchema.parse(value);
  return `digraph Figure {
  graph [rankdir=TB,bgcolor="white",pad="0.55",nodesep="0.85",ranksep="0.9",splines="curved"];
  node [shape=box,style="setlinewidth(1.6)",fontname="Helvetica,Arial",fontsize=15,color="black",fontcolor="black",penwidth=1.6,margin="0.24,0.16"];
  edge [fontname="Helvetica,Arial",fontsize=12,fontcolor="black",color="black",penwidth=1.5,arrowsize="0.8",labeldistance="2.2",labelangle="28"];
${diagram.nodes.map(n => `  ${n.id} [shape=${shape[n.shape]},style="${style[n.shape]},setlinewidth(1.6)",label=${JSON.stringify(n.label)}];`).join('\n')}
${diagram.edges.map(e => `  ${e.from} -> ${e.to}${e.label ? ` [label=${JSON.stringify(e.label)}]` : ''};`).join('\n')}
}`;
}

export function mermaidSource(value: DiagramIR) {
  const diagram = diagramSchema.parse(value);
  const label = (text: string) => text.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>').replace(/[\r\n]/g, ' ');
  const ids = new Map(diagram.nodes.map((node, index) => [node.id, `n${index}`]));
  const shapes = { 
    process: ['["', '"]'], 
    decision: ['{"', '"}'], 
    start: ['(["', '"])'], 
    data: ['[/"', '"/]'],
    rectangle: ['["', '"]'],
    ellipse: ['(["', '"])'],
    diamond: ['{"', '"}'],
    parallelogram: ['[/"', '"/]'],
    cylinder: ['[((', '))]'],
    document: ['[["', '"]]']
  };
  return `flowchart TD\n${diagram.nodes.map(n => `${ids.get(n.id)}${shapes[n.shape][0]}${label(n.label)}${shapes[n.shape][1]}`).join('\n')}\n${diagram.edges.map(e => `${ids.get(e.from)} -->${e.label ? `|"${label(e.label)}"|` : ''} ${ids.get(e.to)}`).join('\n')}`;
}