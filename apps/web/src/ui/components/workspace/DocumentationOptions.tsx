import type { DocumentationQuery } from '@outline-studio/schemas';

export type DocumentationSettings = DocumentationQuery & { enabled: boolean };
export function DocumentationOptions({ value, onChange, disabled }: {
  value: DocumentationSettings; onChange: (value: DocumentationSettings) => void; disabled: boolean;
}) {
  return <details className="chat-documentation"><summary>Look up documentation</summary>
    <label className="check-label"><input type="checkbox" checked={value.enabled} disabled={disabled} onChange={event => onChange({ ...value, enabled: event.target.checked })} />Use current software documentation for this reply</label>
    {value.enabled && <><p className="small muted">Context7 receives only this public documentation question and optional library name go to Context7. Keep keys, private code and personal details out. Availability depends on its limits.</p>
      <label>Documentation question<input value={value.query} disabled={disabled} minLength={3} maxLength={500} required onChange={event => onChange({ ...value, query: event.target.value })} placeholder="How does React useState work?" /></label>
      <label>Library or version (optional)<input value={value.library} disabled={disabled} maxLength={100} onChange={event => onChange({ ...value, library: event.target.value })} placeholder="React or /vercel/next.js" /></label></>}
  </details>;
}
