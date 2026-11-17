'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { Modal } from '../ui/dialog';
import { Button } from '../ui/button';

const preference = z.object({ version: z.literal(1), optional: z.boolean(), at: z.string() });
function snapshot() {
  try { return localStorage.getItem('outline-preferences') ?? ''; } catch { return 'unavailable'; }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback); window.addEventListener('outline:preference-change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('outline:preference-change', callback); };
}
export function Preferences() {
  const saved = useSyncExternalStore(subscribe, snapshot, () => 'server');
  let selected: boolean | null = null;
  try { const parsed = preference.safeParse(JSON.parse(saved)); if (parsed.success) selected = parsed.data.optional; } catch { selected = null; }
  const [sessionChoice, setSessionChoice] = useState<boolean | null>(null);
  const choice = selected ?? sessionChoice;
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('outline:preferences', reopen);
    return () => window.removeEventListener('outline:preferences', reopen);
  }, []);
  function save(optional: boolean) {
    try {
      localStorage.setItem('outline-preferences', JSON.stringify({ version: 1, optional, at: new Date().toISOString() }));
      setStorageError('');
    } catch { setStorageError('Your choice applies for this visit. Browser storage is unavailable.'); }
    setSessionChoice(optional); setOpen(false); window.dispatchEvent(new Event('outline:preference-change'));
  }
  return <>
    {saved !== 'server' && choice === null && <aside className="preference-banner" aria-label="Storage preferences">
      <div><strong>A little clarity about storage.</strong><p>Drafts stay on this device. Necessary storage supports your workspace. No optional tracking is installed.</p></div>
      <div className="button-row"><Button variant="outline" onClick={() => save(false)}>Reject optional cookies</Button>
        <Button variant="outline" onClick={() => save(true)}>Accept optional cookies</Button>
        <button className="text-button" onClick={() => setOpen(true)}>Manage preferences</button></div>
    </aside>}
    {storageError && <p role="status" className="storage-notice">{storageError}</p>}
    <Modal open={open} onOpenChange={setOpen} title="Storage preferences"
      description="Your choice is saved on this device. You can change it from the footer at any time.">
      <div className="settings-copy"><h3>Necessary storage · always active</h3><p>Local drafts, encrypted vault data if you save keys, your preference and a secure guest-session cookie for generation and feedback.</p>
        <h3>Optional cookies</h3><p>No analytics, advertising or optional cookies are installed. Accepting does not activate tracking. Future optional services will need a new consent request.</p>
        <p>Current choice: {choice === null ? 'Not selected' : choice ? 'Accept optional cookies' : 'Reject optional cookies'}.</p></div>
      <div className="button-row"><Button variant="outline" onClick={() => save(false)}>Reject optional cookies</Button><Button onClick={() => save(true)}>Accept optional cookies</Button></div>
    </Modal>
  </>;
}
