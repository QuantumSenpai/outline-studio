import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { providers, providerVerificationDate } from '@outline-studio/config';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('Provider setup', 'Connect NVIDIA, Groq, Gemini or OpenRouter with your own key. Understand key storage, models, fallback and costs.', '/providers');
export default function Providers() {
  return <main id="main" className="page-container"><header className="page-heading"><h1>Your AI.<br />Your choice.</h1><p>Start with one provider. Explore the walkthrough without a key. Connect and validate a model before real generation.</p></header>
    <section className="provider-guide" aria-label="Provider instructions">{providers.map(provider => <article key={provider.id}><h2>{provider.name}</h2><ol>{provider.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <div className="button-row"><a className="text-link" href={provider.keyUrl} target="_blank" rel="noopener noreferrer">Create a {provider.name} key <ArrowUpRight size={14} style={{ display: 'inline' }} /></a>
        <a className="text-link" href={provider.docs} target="_blank" rel="noopener noreferrer">Official instructions</a></div><p className="small muted" style={{ marginTop: 16 }}>Instructions checked {providerVerificationDate}. Availability, account permissions, trial credits and quotas vary. Check current pricing in your provider console.</p></article>)}</section>
    <section className="prose" style={{ paddingTop: 0 }}><h2>Keys, costs and switching</h2><p>Keys stay in memory for this visit unless you choose the encrypted local vault. Saved keys use a passphrase-derived key and authenticated encryption. The passphrase is not recoverable. Keys are never included in drafts or project exports.</p>
      <p>Validation checks the provider’s model list; it does not prove that generation is free or that a model supports every task. Choose a text/chat model and authorize its potential usage costs. A bounded generation call can still fail on model-specific permissions.</p>
      <p>Automatic fallback is off until you enable it and choose the order. Only configured, validated and authorized models can be used. Rate limits and outages can switch to the next eligible model; credential and credit problems require attention. The UI shows every switch.</p>
      <p>Cancellation stops local processing and asks the server/provider to abort. It cannot guarantee the provider stops billing or refunds consumed tokens.</p><Link href="/workspace" className="button button-primary">Set up a provider</Link></section></main>;
}
