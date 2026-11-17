'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Trash2 } from 'lucide-react';
import { providers, providerVerificationDate } from '@outline-studio/config';
import { providerIdSchema, type ProviderId, type Connection } from '@outline-studio/schemas';
import { api, connectSession, messageFrom } from '@/lib/api';
import { useProviders } from '../../stores/providerStore';
import { Button } from '../ui/button';
import { Modal } from '../ui/dialog';
import { VaultControls } from './VaultControls';

const validationSchema = z.object({ models: z.array(z.string()).max(5000), verifiedAt: z.string() });
export function ProviderSetup({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const state = useProviders();
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function beginRequest() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError(''); return controller;
  }
  const [provider, setProvider] = useState<ProviderId>('groq');
  const [key, setKey] = useState(''); const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState(''); const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState(''); const [verifiedAt, setVerifiedAt] = useState('');
  const current = providers.find(p => p.id === provider) ?? providers[0];
  async function validate() {
    if (!authorized) { setError('Authorize model-list access and potential generation costs before connecting.'); return; }
    const controller = beginRequest(); setModels([]);
    try {
      await connectSession(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
      const response = await api('/providers/validate', { provider, key, model: current.model, authorized: true }, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
      const result = validationSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      const textModels = result.models.filter(id => !/embed|whisper|tts|audio|imagen|vision-only|dall-e|rerank/i.test(id));
      if (!textModels.length) throw new Error('No candidate text models were returned for this account. Check permissions.');
      setModels(textModels); setModel(textModels.includes(current.model) ? current.model : textModels[0]); setVerifiedAt(result.verifiedAt);
    } catch (error) { if (!controller.signal.aborted) setError(messageFrom(error)); }
    finally { if (!controller.signal.aborted) setPending(false); }
  }
  function save() {
    if (!models.includes(model) || !authorized) return;
    state.put({ provider, key, model, authorized: true, validated: true, verifiedAt });
    setKey(''); setModels([]); setAuthorized(false); setError('');
  }
  async function revalidate(connection: Connection) {
    const controller = beginRequest();
    try {
      await connectSession(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
      const response = await api('/providers/validate', connection, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
      const result = validationSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      if (!result.models.includes(connection.model)) throw new Error('Saved model is no longer listed. Configure a new model above.');
      state.put({ ...connection, validated: true, verifiedAt: result.verifiedAt });
    } catch (error) { if (!controller.signal.aborted) setError(messageFrom(error)); }
    finally { if (!controller.signal.aborted) setPending(false); }
  }
  return <Modal open={open} onOpenChange={value => { if (!value) { request.current?.abort(); setPending(false); setKey(''); setModels([]); setAuthorized(false); setError(''); } onOpenChange(value); }}
    title="Connect your AI" description="Start with one provider. Keys stay in memory for this visit unless you choose the encrypted vault.">
    <div className="form-stack"><label>Provider<select disabled={pending} value={provider} onChange={e => { setProvider(providerIdSchema.parse(e.target.value)); setModels([]); setKey(''); setAuthorized(false); }}>
      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <ol className="provider-steps">{current.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <a className="text-link small" href={current.keyUrl} target="_blank" rel="noopener noreferrer">Create a {current.name} key <ArrowUpRight size={14} style={{ display: 'inline' }} /></a>
      <label>API key<input type="password" disabled={pending} value={key} onChange={e => { setKey(e.target.value); setModels([]); }} autoComplete="off" spellCheck={false} maxLength={512} placeholder="Paste your provider key" /></label>
      <label className="check-label"><input type="checkbox" disabled={pending} checked={authorized} onChange={e => setAuthorized(e.target.checked)} />
        <span>I authorize connection checks and generation with my selected model, including potential provider charges. I have checked its pricing and account permissions.</span></label>
      <Button variant="outline" aria-busy={pending} onClick={() => void validate()} disabled={pending || key.trim().length < 8}>{pending ? 'Validating connection…' : 'Validate connection & load models'}</Button>
      {models.length > 0 && <><label>Available model<select value={model} onChange={e => setModel(e.target.value)}>{models.map(id => <option key={id}>{id}</option>)}</select></label>
        <p className="small muted">Model-list access verified. Choose a text/chat model. Actual stage compatibility and usage limits are checked when generating.</p><Button onClick={save}>Use this connection <Check size={16} /></Button></>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <p className="small muted">Instructions checked {providerVerificationDate}. Trial credits, regions and quotas vary. Cancelling cannot guarantee refunded provider usage.</p>
    </div>
    {state.connections.length > 0 && <section className="provider-connections"><h3>Configured connections</h3>
      {state.connections.map((connection, index) => <div className="connection-row" key={connection.provider}><label className="check-label"><input type="radio" name="primary" checked={state.primary === connection.provider} onChange={() => state.setPrimary(connection.provider)} />
        <span><strong>{connection.provider}</strong><small>{connection.model}</small><small>{connection.validated ? 'Model list verified' : 'Revalidate before generation'}</small></span></label>
        <div className="connection-actions">{!connection.validated && <button className="text-button small" disabled={pending} onClick={() => void revalidate(connection)}>Revalidate</button>}<button aria-label={`Move ${connection.provider} earlier`} className="icon-button" disabled={index === 0} onClick={() => state.move(connection.provider, -1)}><ArrowUp size={16} /></button>
          <button aria-label={`Move ${connection.provider} later`} className="icon-button" disabled={index === state.connections.length - 1} onClick={() => state.move(connection.provider, 1)}><ArrowDown size={16} /></button>
          <button aria-label={`Remove ${connection.provider}`} className="icon-button" onClick={() => state.remove(connection.provider)}><Trash2 size={16} /></button></div></div>)}
      <label className="check-label"><input type="checkbox" checked={state.fallback} onChange={e => state.setFallback(e.target.checked)} /><span>Enable automatic switching, starting with the selected primary and then the order above. Only authorized connections are eligible. At most three attempts per stage.</span></label>
    </section>}
    <VaultControls />
  </Modal>;
}
