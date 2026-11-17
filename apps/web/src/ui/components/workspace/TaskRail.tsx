import { Check, Circle, CircleAlert, GitBranch } from 'lucide-react';
import { useWorkspace } from '../../stores/workspaceStore';

export const coworkers = {
  planner: { name: 'Planner', purpose: 'Turn the main brief into an outline you can accept.' },
  writer: { name: 'Writer', purpose: 'Develop the accepted sections into a shared document source.' },
  diagram: { name: 'Diagram designer', purpose: 'Express the subject with labelled nodes and connections.' },
  reviewer: { name: 'Reviewer', purpose: 'Check available content and diagram against your requirements.' },
};
export function TaskRail({ busy }: { busy: boolean }) {
  const { checkpoint, activeTab, setTab, concurrency, setConcurrency } = useWorkspace();
  if (!checkpoint) return null;
  return <aside className="task-rail" aria-label="Coworkers"><div className="panel-title"><h2>Your coworkers</h2><GitBranch size={17} /></div>
    <p className="small muted">One request. Shared context.<br />You stay in the director’s seat.</p>
    <div className="coworker-list">{checkpoint.tasks.map(task => <button key={task.stage} onClick={() => setTab(task.stage)} aria-pressed={activeTab === task.stage} className="coworker-button">
      <span className={`task-mark ${task.status}`}>{task.status === 'completed' ? <Check size={16} /> : task.status === 'failed' ? <CircleAlert size={16} /> : <Circle size={16} />}</span>
      <span><strong>{coworkers[task.stage].name}</strong><small>{task.status}</small></span></button>)}</div>
    <div className="rail-secondary"><button onClick={() => setTab('researcher')}>Researcher <span>Source metadata</span></button><button onClick={() => setTab('exporter')}>Exporter <span>Local file rendering</span></button></div>
    <label className="concurrency-field">Independent task limit<select value={concurrency} disabled={busy} onChange={e => setConcurrency(e.target.value === '1' ? 1 : 2)}><option value={1}>1 task</option><option value={2}>2 tasks</option></select></label>
    <p className="small muted">Reviewer waits for content. Exporter waits for review. Browser must remain open for scheduling.</p>
  </aside>;
}
