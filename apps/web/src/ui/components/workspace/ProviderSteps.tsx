import { ArrowRight, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { providers } from '@outline-studio/config';
import type { ProviderId } from '@outline-studio/schemas';
import { Button } from '../ui/button';
type ProviderConfig = typeof providers[number];

export function ChooseProviderStep({ provider, onProviderChange, current, providers, onNext }: {
  provider: ProviderId; onProviderChange: (p: ProviderId) => void;
  current: ProviderConfig; providers: readonly ProviderConfig[]; onNext: () => void
}) {
  return <div className="step-flow">
    <h3>Step 1: Choose a provider</h3>
    <div className="provider-cards">
      {providers.map(p => <button key={p.id} className={`provider-card ${provider === p.id ? 'selected' : ''}`}
        type="button" onClick={() => onProviderChange(p.id)} aria-pressed={provider === p.id}>
        <strong>{p.name}</strong><span>{p.description}</span>
        {provider === p.id && <Check size={20} />}
      </button>)}
    </div>
    <details><summary>Where do I get an API key?</summary>
      <ol className="provider-steps">{current.steps.map(s => <li key={s}>{s}</li>)}</ol>
      <a className="text-link small" href={current.keyUrl} target="_blank" rel="noopener noreferrer">Open {current.name} key page <ArrowRight size={14} /></a>
    </details>
    <Button className="w-full" onClick={onNext}><ArrowRight size={16} /> Continue</Button>
  </div>;
}

export function ValidateStep({ apiKey, onKeyChange, showKey, onShowKeyChange, authorized, onAuthorizedChange, current, pending, error, onValidate, setStep }: {
  apiKey: string; onKeyChange: (k: string) => void; showKey: boolean; onShowKeyChange: (s: boolean) => void;
  authorized: boolean; onAuthorizedChange: (a: boolean) => void; current: { name: string; keyUrl: string; steps: readonly string[] };
  pending: boolean; error: string; onValidate: () => void; setStep: (s: 'choose' | 'validate' | 'model' | 'done') => void
}) {
  return <div className="step-flow">
    <h3>Step 2: Enter your <strong>{current.name}</strong> API key</h3>
    <p className="small muted">Your key passes through our API to your selected provider for connection checks and generation. It stays in memory unless you save the encrypted vault.</p>
    <label className="field">API key
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label="API key" type={showKey ? 'text' : 'password'} disabled={pending} value={apiKey} onChange={e => onKeyChange(e.target.value)}
          autoComplete="off" spellCheck={false} maxLength={512} placeholder="Paste your API key here" style={{ flex: 1 }} />
        <button type="button" className="icon-button" disabled={pending} onClick={() => onShowKeyChange(!showKey)} aria-label={showKey ? 'Hide key' : 'Show key'}>
          {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
    <label className="check-label"><input type="checkbox" disabled={pending} checked={authorized} onChange={e => onAuthorizedChange(e.target.checked)} />
      <span>I authorize connection checks and generation with my selected model. I understand this may incur charges on my {current.name} account.</span></label>
    {error && <p className="notice error" role="alert"><AlertCircle size={16} /> {error}</p>}
    <Button variant="outline" className="w-full" aria-busy={pending} onClick={onValidate} disabled={pending || apiKey.trim().length < 8 || !authorized}>
      {pending ? <><Loader2 size={16} className="animate-spin" /> Validating connection…</> : 'Validate connection & load models'}</Button>
    <Button variant="ghost" className="w-full" disabled={pending} onClick={() => setStep('choose')}>← Back</Button>
  </div>;
}

export function ModelStep({ models, model, onModelChange, authorized, onAuthorizedChange, pending, onSave, onBack }: {
  models: string[]; model: string; onModelChange: (m: string) => void; authorized: boolean; onAuthorizedChange: (a: boolean) => void;
  pending: boolean; onSave: () => void; onBack: () => void
}) {
  return <div className="step-flow">
    <h3>Step 3: Pick a model</h3>
    <p className="small muted">Only text/chat models are shown. Your choice will be used for all generation stages.</p>
    <label className="field">Available model<select value={model} onChange={e => onModelChange(e.target.value)} disabled={pending}>
      {models.map(id => <option key={id} value={id}>{id}</option>)}</select></label>
    <label className="check-label"><input type="checkbox" disabled={pending} checked={authorized} onChange={e => onAuthorizedChange(e.target.checked)} />
      <span>Confirm this model for all generation tasks.</span></label>
    <Button className="w-full" onClick={onSave} disabled={pending || !models.includes(model) || !authorized}>
      <Check size={16} /> Use this connection</Button>
    <Button variant="ghost" className="w-full" onClick={onBack}>← Back</Button>
  </div>;
}

export function DoneStep({ onClose }: { onClose: (open: boolean) => void }) {
  return <div className="step-flow" style={{ textAlign: 'center', padding: '24px 0' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
    <h3>Connected!</h3>
    <p className="small muted">Connection saved. Model-list access is verified; generation capability is checked when you run a task.</p>
    <Button className="w-full" onClick={() => onClose(false)}>Start generating</Button>
  </div>;
}

