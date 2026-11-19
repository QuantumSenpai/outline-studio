import { Check, Circle, CircleAlert, GitBranch } from 'lucide-react';
import { useWorkspace } from '../../stores/workspaceStore';
import { SelectionIndicator } from './SelectionIndicator';

export const coworkers = {
  planner: { name: 'Planner', purpose: 'Turn the main brief into an outline you can accept.' },
  writer: { name: 'Writer', purpose: 'Develop the accepted sections into a shared document source.' },
  diagram: { name: 'Diagram designer', purpose: 'Express the subject with labelled nodes and connections.' },
  reviewer: { name: 'Reviewer', purpose: 'Check available content and diagram against your requirements.' },
};
export function TaskRail({ busy, onNavigate }: { busy: boolean; onNavigate?: () => void }) {
  const { checkpoint, activeTab, setTab, concurrency, setConcurrency } = useWorkspace();
  function navigate(tab: string) { setTab(tab); onNavigate?.(); }
  if (!checkpoint) return null;
  return <aside className="task-rail" aria-label="Coworkers"><SelectionIndicator value={activeTab} /><div className="panel-title"><h2>Your coworkers</h2><GitBranch size={17} /></div>

    <div className="coworker-list">{checkpoint.tasks.map(task => <button key={task.stage} onClick={() => navigate(task.stage)} aria-pressed={activeTab === task.stage} className="coworker-button">
      <span className={`task-mark ${task.status}`}>{task.status === 'completed' ? <Check size={16} /> : task.status === 'failed' ? <CircleAlert size={16} /> : <Circle size={16} />}</span>
      <span><strong>{coworkers[task.stage].name}</strong><small>{task.status}</small></span></button>)}</div>
    <div className="rail-secondary"><button aria-pressed={activeTab === 'researcher'} onClick={() => navigate('researcher')}>Researcher <span>Source metadata</span></button><button aria-pressed={activeTab === 'exporter'} onClick={() => navigate('exporter')}>Exporter <span>Local file rendering</span></button></div>
    <label className="concurrency-field">Independent task limit<select value={concurrency} disabled={busy} onChange={e => setConcurrency(e.target.value === '1' ? 1 : 2)}><option value={1}>1 task</option><option value={2}>2 tasks</option></select></label>

  </aside>;
}
