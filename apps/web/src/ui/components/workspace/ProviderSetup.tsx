'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { providers, isCandidateTextModel } from '@outline-studio/config';
import { type ProviderId } from '@outline-studio/schemas';
import { api, connectSession, messageFrom } from '@/lib/api';
import { useProviders, type ConfiguredConnection } from '../../stores/providerStore';
import { Modal } from '../ui/dialog';
import { VaultControls } from './VaultControls';
import { ChooseProviderStep, ValidateStep, ModelStep, DoneStep } from './ProviderSteps';
import { ConnectionRow, FallbackToggle } from './ProviderConnections';


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

  const [step, setStep] = useState<'choose' | 'validate' | 'model' | 'done'>('choose');
  const [provider, setProvider] = useState<ProviderId>('groq');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [verifiedAt, setVerifiedAt] = useState('');

  const current = providers.find(p => p.id === provider) ?? providers[0];

  async function validate() {
    if (!authorized) { setError('Please authorize before connecting.'); return; }
    if (key.trim().length < 8) { setError('Enter your API key.'); return; }
    const controller = beginRequest(); setModels([]); setError('');
    try {
      await connectSession(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
      const response = await api('/providers/validate', { provider, key, model: current.model, authorized: true }, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
      const result = validationSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      const textModels = result.models.filter(isCandidateTextModel);
      if (!textModels.length) throw new Error('No compatible text models found. Check your account permissions.');
      setModels(textModels);
      setModel(textModels.includes(current.model) ? current.model : textModels[0]);
      setVerifiedAt(result.verifiedAt);
      setStep('model');
    } catch (error) { if (!controller.signal.aborted) setError(messageFrom(error)); }
    finally { if (!controller.signal.aborted) setPending(false); }
  }

  function save() {
    if (!models.includes(model) || !authorized) return;
    state.put({ provider, key, model, authorized: true, validated: true, verifiedAt, models });
    setKey(''); setModels([]); setAuthorized(false); setError('');
    setStep('done');
  }

  async function revalidate(connection: ConfiguredConnection) {
    const controller = beginRequest();
    try {
      await connectSession(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
      const { provider, key, model, authorized } = connection;
      const response = await api('/providers/validate', { provider, key, model, authorized }, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
      const result = validationSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      if (!result.models.includes(connection.model)) throw new Error('Saved model is no longer listed. Configure a new model above.');
      const latest = useProviders.getState().connections.find(item => item.provider === connection.provider);
      if (!latest || latest.key !== connection.key || latest.model !== connection.model || !latest.authorized) return;
      state.put({ ...connection, validated: true, verifiedAt: result.verifiedAt, models: result.models.filter(isCandidateTextModel) });
    } catch (error) { if (!controller.signal.aborted) setError(messageFrom(error)); }
    finally { if (!controller.signal.aborted) setPending(false); }
  }

  function changeOpen(value: boolean) {
    if (!value) {
      request.current?.abort(); setPending(false); setKey(''); setShowKey(false); setModels([]);
      setModel(''); setAuthorized(false); setError(''); setStep('choose');
    }
    onOpenChange(value);
  }
  function chooseProvider(value: ProviderId) {
    setProvider(value); setKey(''); setShowKey(false); setModels([]); setModel(''); setAuthorized(false); setError('');
  }
  return <Modal open={open} onOpenChange={changeOpen} title="Connect your AI" description="Pick a provider, enter your key, and start generating. Keys stay in memory unless you save them in the encrypted vault below.">
    <div className="form-stack" role="region" aria-label="Provider setup">
      {step === 'choose' && <ChooseProviderStep
        provider={provider} onProviderChange={chooseProvider} current={providers.find(p => p.id === provider) ?? providers[0]} providers={providers}
        onNext={() => setStep('validate')}
      />}
      {step === 'validate' && <ValidateStep
        apiKey={key} onKeyChange={setKey} showKey={showKey} onShowKeyChange={setShowKey}
        authorized={authorized} onAuthorizedChange={setAuthorized} current={providers.find(p => p.id === provider) ?? providers[0]}
        pending={pending} error={error} onValidate={validate} setStep={setStep}
      />}
      {step === 'model' && <ModelStep
        models={models} model={model} onModelChange={setModel} authorized={authorized} onAuthorizedChange={setAuthorized}
        pending={pending} onSave={save} onBack={() => { setModels([]); setStep('validate'); }}
      />}
      {step === 'done' && <DoneStep onClose={changeOpen} />}
    </div>

    {state.connections.length > 0 && (
      <section className="provider-connections" aria-labelledby="saved-connections">
        <h3 id="saved-connections">Your connections</h3>
        {state.connections.map((connection, index) => (
          <ConnectionRow key={connection.provider} connection={connection} index={index} state={state} revalidate={revalidate} pending={pending} />
        ))}
        <FallbackToggle state={state} />
      </section>
    )}
    {error && step !== 'validate' && <p className="notice error" role="alert">{error}</p>}
    <VaultControls />
  </Modal>;
}
