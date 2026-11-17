import { Check, CircleAlert, Download } from 'lucide-react';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';

export function Completion({ onRevise }: { onRevise: () => void }) {
  const { checkpoint, setTab } = useWorkspace();
  const review = checkpoint?.review;
  if (!review) return null;
  const remaining = review.criteria.filter(c => c.status !== 'met');
  return <section className="completion-panel"><h3>Review finished. Your call next.</h3>
    <p>Report, slides and diagram can now be rendered from the reviewed source. Files are generated only when you choose a download.</p>
    <ul>{review.criteria.map((criterion, i) => <li key={i}>{criterion.status === 'met' ? <Check size={16} /> : <CircleAlert size={16} />}<span><strong>{criterion.status}</strong> · {criterion.requirement}<small>{criterion.detail}</small></span></li>)}</ul>
    <p className="small">{remaining.length ? `${remaining.length} missing or unverified criteria remain. Review before submitting.` : 'All listed criteria were marked met by the model. Factual accuracy still requires your review.'}</p>
    {review.warnings.map(warning => <p className="notice small" key={warning}>{warning}</p>)}
    <div className="button-row"><Button onClick={() => setTab('exporter')}><Download size={16} /> Prepare downloads</Button><Button variant="outline" onClick={onRevise}>Revise content</Button></div>
  </section>;
}
