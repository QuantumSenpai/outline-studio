'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, MessageSquareText } from 'lucide-react';

export function Footer() {
  const path = usePathname();
  if (path === '/workspace' || path === '/playground') return null;
  return <footer className="site-footer"><div className="footer-wordmark" aria-hidden="true">Outline Studio</div><div className="footer-panel">
    <div className="footer-top"><div className="footer-invitation"><p>Your next idea starts here.</p>
      <Link prefetch={false} href="/workspace" className="button footer-cta"><MessageSquareText size={17} />Open workspace</Link></div>
      <details className="footer-group" open><summary>Product</summary><nav aria-label="Footer navigation"><Link prefetch={false} href="/workspace">Workspace</Link><Link prefetch={false} href="/playground">Playground</Link><Link prefetch={false} href="/history">History</Link><Link prefetch={false} href="/templates">Templates</Link><Link prefetch={false} href="/projects">Your projects</Link><Link prefetch={false} href="/how-it-works">How it works</Link><Link prefetch={false} href="/feedback">Send feedback</Link></nav></details>
      <details className="footer-group" open><summary>Resources</summary><nav aria-label="Resources"><Link prefetch={false} href="/providers">Provider guide</Link><a href="https://github.com/QuantumSenpai/outline-studio/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT license</a><Link prefetch={false} href="/privacy">Privacy</Link><Link prefetch={false} href="/terms">Terms</Link><button onClick={() => window.dispatchEvent(new Event('outline:preferences'))}>Storage preferences</button></nav></details>
    </div>

    <div className="footer-base"><div><span>© {new Date().getFullYear()} QuantumSenpai</span></div>
      <a href="https://github.com/QuantumSenpai/outline-studio" target="_blank" rel="noopener noreferrer"><ExternalLink size={17} />View on GitHub</a></div>
  </div></footer>;
}
