'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useProviders } from '../../stores/providerStore';

export function ModelSwitcher({ disabled }: { disabled: boolean }) {
  const primary = useProviders(state => state.primary);
  const connections = useProviders(state => state.connections);
  const setModel = useProviders(state => state.setModel);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const active = connections.find(item => item.provider === primary && item.validated);
  if (!active) return null;
  const models = Array.from(new Set([active.model, ...(active.models ?? [])]));
  function apply() {
    const model = value.trim().slice(0, 200);
    if (model) setModel(active!.provider, model);
    setValue(''); setEditing(false);
  }
  return <div className="model-switcher">
    {editing ? <span className="model-edit"><input aria-label="Custom model ID" value={value} placeholder={active.model} maxLength={200}
      onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') apply(); if (event.key === 'Escape') setEditing(false); }} />
      <button type="button" aria-label="Use custom model" disabled={!value.trim()} onClick={apply}>Use</button></span>
      : <><span>Model</span><select aria-label="Active model" disabled={disabled || models.length < 2} value={active.model} onChange={event => setModel(active!.provider, event.target.value)}>
        {models.map(id => <option key={id} value={id}>{id}</option>)}</select>
        <button type="button" aria-label="Enter custom model ID" disabled={disabled} onClick={() => setEditing(true)}><Pencil size={13} /></button></>}
  </div>;
}
