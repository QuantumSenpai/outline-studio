import { ArrowLeft, RotateCcw, Square } from 'lucide-react';
import { type StageName } from '@outline-studio/schemas';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';
import { coworkers } from './TaskRail';

export function CoworkerPanel({ stage, busy, onRetry, onCancel }: { stage: StageName; busy: boolean; onRetry: () => void; onCancel: () => void }) {
  const { checkpoint, setTab } = useWorkspace();
  const task = checkpoint?.tasks.find(t => t.stage === stage);
  if (!checkpoint || !task) return null;
  const disabled = stage === 'planner' ? !checkpoint.brief : stage === 'reviewer' ? !checkpoint.document || !checkpoint.diagram : !checkpoint.outlineAccepted;
  return <section className="coworker-panel"><button className="text-button small" onClick={() => setTab('conversation')}><ArrowLeft size={14} style={{ display: 'inline' }} /> Main conversation</button>
    <h2>{coworkers[stage].name}</h2><p className="muted">{coworkers[stage].purpose}</p><div className="task-context"><strong>Main request</strong><p>{checkpoint.brief || 'No request yet. Start in the main conversation.'}</p></div>
    <div className="task-status-detail"><span className={`status-dot ${task.status}`} /><strong>{task.status}</strong><span>Attempt {task.attempt} / 3</span></div>
    <dl className="task-meta"><dt>Provider / model</dt><dd>{task.provider ? `${task.provider} / ${task.model}` : 'Assigned when this task starts'}</dd>
      <dt>Task summary</dt><dd aria-live="polite">{task.summary}</dd></dl>
    {task.partial && <p className="notice">Receiving {task.partial.length.toLocaleString()} characters. Partial output is not accepted until schema validation finishes.</p>}
    <div className="button-row">{task.status === 'running' ? <Button variant="outline" onClick={onCancel}><Square size={14} /> Cancel unfinished work</Button>
      : ['failed', 'cancelled'].includes(task.status) && <Button variant="outline" disabled={busy || disabled || task.attempt >= 3} onClick={onRetry}><RotateCcw size={15} /> Retry task</Button>}
      {stage === 'planner' && checkpoint.outline && <Button onClick={() => setTab('conversation')}>Review outline</Button>}
      {(stage === 'writer' && checkpoint.document || stage === 'diagram' && checkpoint.diagram) && <Button onClick={() => setTab('document')}>Inspect accepted output</Button>}
      {stage === 'reviewer' && checkpoint.review && <Button onClick={() => setTab('conversation')}>Read review results</Button>}</div>
    {task.attempt >= 3 && task.status !== 'completed' && <p className="notice small">Attempt budget used. Make a revision in the document view or start a new request. No automatic quota cycling occurs.</p>}
  </section>;
}
