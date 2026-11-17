'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const chatSuggestions = [
  { label: 'Solve step by step', prompt: 'Solve this step by step and show all working.' },
  { label: 'Explain simply', prompt: 'Explain this in simple terms with an example.' },
  { label: 'Draft an answer', prompt: 'Draft a clear answer I can adapt, with headings.' },
  { label: 'Check my work', prompt: 'Check this work for errors and explain each correction.' },
  { label: 'Compare two ideas', prompt: 'Compare two ideas and give me a short table.' },
  { label: 'Plan a presentation', prompt: 'Help me plan a short presentation on a topic.' },
  { label: 'Explain with code', prompt: 'Write code for a small task and explain it.' },
  { label: 'Summarise notes', prompt: 'Turn my notes into a clean summary.' },
];

export function SuggestionPills({ onSelect, disabled }: { onSelect: (text: string) => void; disabled?: boolean }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setOffset(value => (value + 1) % chatSuggestions.length), 12000);
    return () => window.clearInterval(timer);
  }, []);
  const visible = Array.from({ length: 4 }, (_, index) => chatSuggestions[(offset + index) % chatSuggestions.length]);
  return <div className="suggestion-pills" role="group" aria-label="Suggestions" key={offset}>{visible.map(item =>
    <button key={item.label} type="button" disabled={disabled} onClick={() => onSelect(item.prompt)}>{item.label}<ArrowUp size={13} /></button>)}</div>;
}
