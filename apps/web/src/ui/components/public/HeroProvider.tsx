'use client';

import { useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import { useProviders } from '../../stores/providerStore';
import { ProviderSetup } from '../workspace/ProviderSetup';

export function HeroProvider() {
  const [open, setOpen] = useState(false);
  const connected = useProviders(state => state.connections.some(connection => connection.validated));
  return <div className="hero-provider">
    {connected ? <Check size={18} aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
    <div><strong>{connected ? 'Provider connected' : 'Bring your own API key'}</strong>
      <p>{connected ? 'Your provider is ready for this visit.' : 'Connect a provider to start generating.'}</p>
      <div className="provider-actions"><button onClick={() => setOpen(true)} className="text-link" aria-haspopup="dialog">{connected ? 'Manage provider' : 'Connect provider'}</button>
        <a href="/providers">Get an API key <span aria-hidden="true">↗</span></a></div>
    </div>
    <ProviderSetup open={open} onOpenChange={setOpen} />
  </div>;
}
