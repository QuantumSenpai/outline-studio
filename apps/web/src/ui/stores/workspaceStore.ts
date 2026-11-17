import { create } from 'zustand';
import type { DocumentIR, DiagramIR, Outline, Review, StageName, DocumentSettings, Source } from '@outline-studio/schemas';
import { checkpointSchema, type Checkpoint, type Task } from '@/domain/pipeline/checkpoint';

type WorkspaceState = {
  saveState: 'loading' | 'saving' | 'saved' | 'failed'; setSaveState: (value: 'loading' | 'saving' | 'saved' | 'failed') => void;
  checkpoint: Checkpoint | null; hydrated: boolean; persistenceError: string; activeTab: string; concurrency: 1 | 2;
  revise: (value: Partial<Checkpoint>) => void;
  hydrate: (value: Checkpoint) => void; patch: (value: Partial<Checkpoint>) => void;
  task: (stage: StageName, value: Partial<Task>) => void; message: (text: string, role?: 'studio' | 'user') => void;
  setTab: (tab: string) => void; setPersistenceError: (error: string) => void; setConcurrency: (limit: 1 | 2) => void;
  editDocument: (document: DocumentIR) => void; editDiagram: (diagram: DiagramIR) => void;
  setOutline: (outline: Outline) => void; setReview: (review: Review) => void;
  setSettings: (settings: DocumentSettings) => void; setSources: (sources: Source[]) => void;
};
export const useWorkspace = create<WorkspaceState>((set, get) => ({
  saveState: 'loading', setSaveState: saveState => set({ saveState }),
  checkpoint: null, hydrated: false, persistenceError: '', activeTab: 'conversation', concurrency: 2,
  hydrate: checkpoint => set({ checkpoint: checkpointSchema.parse(checkpoint), hydrated: true }),
  patch: value => set(state => ({ checkpoint: state.checkpoint ? checkpointSchema.parse({ ...state.checkpoint, ...value, updatedAt: new Date(Math.max(Date.now(), Date.parse(state.checkpoint.updatedAt) + 1)).toISOString() }) : null })),
  revise: value => {
    const checkpoint = get().checkpoint; if (!checkpoint) return;
    if (checkpoint.revision >= 1000) throw new Error('Revision limit reached. Duplicate or export this project before changing inputs.');
    get().patch({ ...value, review: undefined, revision: checkpoint.revision + 1, tasks: checkpoint.tasks.map(task => ({ ...task, attempt: 0, partial: '',
      status: task.stage === 'reviewer' ? 'queued' : task.status === 'running' ? 'cancelled' : task.status,
      summary: task.stage === 'reviewer' || task.status === 'running' ? 'Inputs changed. Retry explicitly with the latest revision.' : task.summary })) });
  },
  task: (stage, value) => {
    const checkpoint = get().checkpoint;
    if (checkpoint) get().patch({ tasks: checkpoint.tasks.map(t => t.stage === stage ? { ...t, ...value } : t) });
  },
  message: (text, role = 'studio') => {
    const checkpoint = get().checkpoint;
    if (checkpoint && checkpoint.messages.length < 200) get().patch({ messages: [...checkpoint.messages, { id: crypto.randomUUID(), role, text: text.slice(0,16000) }] });
  },
  setTab: activeTab => set({ activeTab }), setPersistenceError: persistenceError => set({ persistenceError }),
  setConcurrency: concurrency => set({ concurrency }),
  editDocument: document => get().revise({ document }),
  editDiagram: diagram => get().revise({ diagram }),
  setOutline: outline => get().patch({ outline, outlineAccepted: false, document: undefined, diagram: undefined, review: undefined }),
  setReview: review => get().patch({ review }),
  setSettings: settings => get().revise({ settings }),
  setSources: sources => { const checkpoint = get().checkpoint; get().revise({ sources, document: checkpoint?.document ? { ...checkpoint.document, references: sources } : undefined }); },
}));
