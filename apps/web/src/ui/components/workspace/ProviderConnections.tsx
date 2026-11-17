import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { ConfiguredConnection, ProviderState } from '../../stores/providerStore';

export function ConnectionRow({ connection, index, state, revalidate, pending }: {
  connection: ConfiguredConnection; index: number; state: ProviderState;
  revalidate: (c: ConfiguredConnection) => void; pending: boolean
}) {
  return <div className="connection-row">
    <label className="check-label"><input type="radio" name="primary" disabled={pending} checked={state.primary === connection.provider} onChange={() => state.setPrimary(connection.provider)} />
      <span><strong>{connection.provider}</strong><small>{connection.model}</small>
        <small className={connection.validated ? 'success' : 'warning'}>
          {connection.validated ? 'Model list verified' : 'Revalidate before use'}
        </small></span></label>
    <div className="connection-actions">
      {!connection.validated && <button className="text-button small" disabled={pending} onClick={() => revalidate(connection)}>Revalidate</button>}
      <button className="icon-button" disabled={pending || index === 0} onClick={() => state.move(connection.provider, -1)} aria-label={`Move ${connection.provider} up`}><ArrowUp size={14} /></button>
      <button className="icon-button" disabled={pending || index === state.connections.length - 1} onClick={() => state.move(connection.provider, 1)} aria-label={`Move ${connection.provider} down`}><ArrowDown size={14} /></button>
      <button type="button" className="icon-button" disabled={pending} onClick={() => state.remove(connection.provider)} aria-label={`Remove ${connection.provider}`}><Trash2 size={14} /></button>
    </div>
  </div>;
}

export function FallbackToggle({ state }: { state: ProviderState }) {
  return <label className="check-label fallback-toggle">
    <input type="checkbox" checked={state.fallback} onChange={e => state.setFallback(e.target.checked)} />
    <span><strong>Enable automatic switching to my enabled order</strong><small>If the primary provider fails (rate limit, timeout), try the next connection in order.</small></span>
  </label>;
}
