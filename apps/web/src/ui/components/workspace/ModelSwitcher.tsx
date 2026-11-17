'use client';

import { useProviders } from '../../stores/providerStore';

export function ModelSwitcher({ disabled }: { disabled: boolean }) {
  const primary = useProviders(state => state.primary);
  const connections = useProviders(state => state.connections);
  const setModel = useProviders(state => state.setModel);
  const active = connections.find(item => item.provider === primary && item.validated);
  if (!active) return null;
  const models = Array.from(new Set([active.model, ...(active.models ?? [])]));
  return <label className="model-switcher"><span>Model</span>
    <select aria-label="Active model" disabled={disabled || models.length < 2} value={active.model} onChange={event => setModel(active.provider, event.target.value)}>
      {models.map(id => <option key={id} value={id}>{id}</option>)}
    </select></label>;
}
