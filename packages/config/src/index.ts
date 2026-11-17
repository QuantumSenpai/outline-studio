export * from './providerDefaults';
export const styles = [
  { id: 'academic', name: 'Academic assignment', description: 'A configurable cover, clear sections and references.',
    instructions: 'Write a clear academic assignment. Use numbered headings and explain terminology. Never invent university rules or citations.' },
  { id: 'professional', name: 'Professional report', description: 'Executive context, findings and practical recommendations.',
    instructions: 'Write a professional report with an executive summary, findings, recommendations and limitations. Use concise, evidence-aware language.' },
  { id: 'research', name: 'Research-paper draft', description: 'Abstract, keywords, figures and a considered discussion.',
    instructions: 'Write a research-paper draft with abstract, keywords, methods or approach, discussion and limitations. Do not invent experiments, results or references. No journal-compliance claim.' },
  { id: 'solutions', name: 'Question-paper solutions', description: 'Original numbering, worked explanations and ambiguity flags.',
    instructions: 'Preserve original question numbers. Show useful working and explanations. Flag ambiguous questions and uncertain answers. Never claim automatic correctness.' },
] as const;
