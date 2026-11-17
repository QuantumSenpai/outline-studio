'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Menu } from 'lucide-react';
import { Brand } from './Brand';
import { Button } from '../ui/button';
import { Modal } from '../ui/dialog';

const links = [['How it works', '/how-it-works'], ['Templates', '/templates'], ['Projects', '/projects'], ['Provider guide', '/providers']] as const;
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <header className="site-header"><div className="header-inner"><Brand />
    <nav aria-label="Main navigation" className="desktop-nav">{links.map(([label, href]) =>
      <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>
    <div className="header-actions"><Button asChild variant="outline" className="header-cta"><Link href="/workspace">Open workspace <ArrowUpRight size={16} /></Link></Button>
      <div className="mobile-nav"><Modal open={open} onOpenChange={setOpen} title="Explore Outline Studio"
        description="One brief. A coordinated set of documents."
        trigger={<button className="icon-button" aria-label="Open navigation"><Menu /></button>}>
        <nav aria-label="Mobile navigation" className="mobile-links">{[...links, ['Feedback', '/feedback'], ['Open workspace', '/workspace']].map(([label, href]) =>
          <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={18} /></Link>)}</nav>
      </Modal></div>
    </div>
  </div></header>;
}
