'use client';

import { FilePlus2 } from 'lucide-react';
import { SuggestionPills } from '@/ui/components/workspace/SuggestionPills';

export function PlaygroundEmpty({ onSelect }: { onSelect: (text: string) => void }) {
  return <div className="playground-empty">
    <div className="playground-icon"><FilePlus2 size={28} /></div>
    <h1>What&apos;s on your mind?</h1>
    <p>Ask a question, get help with code, or start a document.</p>
    <SuggestionPills onSelect={onSelect} disabled={false} />
  </div>;
}