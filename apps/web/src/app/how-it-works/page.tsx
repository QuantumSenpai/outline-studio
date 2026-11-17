import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';
import { Walkthrough } from '@/ui/components/public/Walkthrough';
import { Story } from '@/ui/components/public/Story';
export const metadata = pageMetadata('How it works', 'From one brief to an accepted outline, coordinated tasks, review and downloadable files.', '/how-it-works');
export default function HowItWorks() {
  return <main id="main"><div className="page-container"><header className="page-heading"><h1>You direct.<br />The work connects.</h1>
    <p>One conversation holds your brief, decisions and results. Coworker views show tasks and accepted work, never hidden reasoning.</p></header></div>
    <section className="walkthrough-band" aria-label="Illustrative walkthrough"><div className="page-container"><h2>Try the flow.</h2><Walkthrough /></div></section><Story />
    <section className="page-container prose"><h2>A few useful boundaries</h2><p>Connect one provider to generate. Your API key and the relevant brief pass through the same-origin server to that provider. Quotas, regions and charges vary by account.</p>
      <p>Work is scheduled by your open browser in short stages. Accepted checkpoints stay on this device. Closing the browser does not guarantee work continues; unfinished stages may need retry and provider charges may still apply.</p>
      <p>Review is assistance, not proof of correctness. You remain responsible for claims, references, technical diagram meaning and your institution’s rules.</p>
      <Link className="button button-primary" href="/workspace">Open your workspace</Link></section></main>;
}
