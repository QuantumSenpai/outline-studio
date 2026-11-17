'use client';

import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { localDatabase } from '@/adapters/storage/database';
import { decryptVault, encryptVault } from '@/adapters/security/keyVault';
import { useProviders } from '../../stores/providerStore';
import { messageFrom } from '@/lib/api';
import { Button } from '../ui/button';

export function VaultControls() {
  const state = useProviders();
  const [passphrase, setPassphrase] = useState(''); const [status, setStatus] = useState(''); const [pending, setPending] = useState(false);
  async function vault(action: 'save' | 'unlock' | 'delete') {
    setPending(true); setStatus('');
    try {
      if (action === 'delete') { await localDatabase.vault.delete('keys'); setStatus('Encrypted vault deleted. Session keys are still in memory until you lock them.'); }
      if (action === 'save') {
        if (!state.connections.length) throw new Error('Connect a provider first.');
        const connections = state.connections.map(({ provider, model, key, authorized }) => ({ provider, model, key, authorized }));
        const encrypted = await encryptVault(connections, passphrase);
        await localDatabase.vault.put({ id: 'keys', data: encrypted });
        setStatus('Keys encrypted and saved on this device. Your passphrase cannot be recovered.');
      }
      if (action === 'unlock') {
        const saved = await localDatabase.vault.get('keys');
        if (!saved) throw new Error('There is no saved vault on this device.');
        const connections = await decryptVault(saved.data, passphrase);
        for (const connection of connections) state.put({ ...connection, validated: false, verifiedAt: '' });
        setStatus('Vault unlocked. Revalidate each connection above before generating.');
      }
    } catch (error) { setStatus(action === 'unlock' ? 'Could not unlock. Check your passphrase and vault; no keys were changed.' : messageFrom(error)); }
    finally { setPending(false); setPassphrase(''); }
  }
  return <details className="vault-details"><summary><LockKeyhole size={16} /> Optional encrypted vault</summary>
    <p className="small muted">Session-only is the default. Save keys with a passphrase of at least 12 characters. It is never stored. Use Revalidate beside each unlocked connection before generating.</p>
    <label>Vault passphrase<input type="password" autoComplete="off" value={passphrase} onChange={e => setPassphrase(e.target.value)} maxLength={256} /></label>
    <div className="button-row" style={{ marginTop: 16 }}><Button variant="outline" disabled={pending || passphrase.length < 12 || !state.connections.length} onClick={() => void vault('save')}>Encrypt & save</Button>
      <Button variant="outline" disabled={pending || passphrase.length < 12} onClick={() => void vault('unlock')}>Unlock vault</Button>
      <button className="text-button" disabled={pending} onClick={() => { state.lock(); setStatus('Session keys removed from memory.'); }}>Lock session</button>
      <button className="text-button" disabled={pending} onClick={() => void vault('delete')}>Delete saved vault</button></div>
    {status && <p className="notice" role="status">{status}</p>}
  </details>;
}
