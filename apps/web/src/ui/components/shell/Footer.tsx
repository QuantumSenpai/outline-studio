'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from './Brand';

export function Footer() {
  return <footer className="site-footer"><div className="footer-top"><div><Brand /><p>Every format. One flow.</p></div>
    <nav aria-label="Footer navigation"><Link href="/how-it-works">How it works</Link><Link href="/templates">Templates</Link>
      <Link href="/providers">Provider setup</Link><Link href="/feedback">Send feedback <ArrowUpRight size={14} /></Link></nav>
    <div className="footer-note">Your ideas, in good company.<br />Local drafts. Your choice of AI.</div></div>
    <div className="footer-base"><span>© {new Date().getFullYear()} Outline Studio contributors. MIT licensed.</span>
      <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
        <button onClick={() => window.dispatchEvent(new Event('outline:preferences'))}>Cookie preferences</button></div></div>
  </footer>;
}
