'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from './Brand';

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) { node.classList.add('is-visible'); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { node.classList.add('is-visible'); observer.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <footer ref={ref} className="site-footer"><div className="footer-top"><div><Brand /><p>Every format. One flow.</p></div>
    <nav aria-label="Footer navigation"><Link href="/how-it-works">How it works</Link><Link href="/templates">Templates</Link>
      <Link href="/projects">Local projects</Link><Link href="/providers">Provider setup</Link><Link href="/feedback">Send feedback <ArrowUpRight size={14} /></Link></nav>
    <div className="footer-note">Your ideas, in good company.<br />Local drafts. Your choice of AI.</div></div>
    <p className="footer-reveal" data-reveal>Good work deserves a clean finish.</p>
    <div className="footer-base"><span>© {new Date().getFullYear()} Outline Studio contributors. MIT licensed.</span>
      <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
        <button onClick={() => window.dispatchEvent(new Event('outline:preferences'))}>Cookie preferences</button></div></div>
  </footer>;
}
