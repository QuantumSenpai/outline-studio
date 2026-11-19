'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, FileText, FolderOpen, GraduationCap, KeyRound, Layers, Menu, MessageSquareText, PanelTop } from 'lucide-react';
import { Brand } from './Brand';
import { Modal } from '../ui/dialog';
import { ExploreMenu } from './ExploreMenu';

const destinations = [
  { title: 'Start a conversation', text: 'Questions, ideas and a fresh perspective.', href: '/workspace', Icon: MessageSquareText },
  { title: 'Create an assignment', text: 'An outline, clear sections and references.', href: '/workspace?style=academic', Icon: GraduationCap },
  { title: 'Write a report', text: 'From a short brief to the bigger picture.', href: '/workspace?style=professional', Icon: FileText },
  { title: 'Templates', text: 'Four ways to find your starting point.', href: '/templates', Icon: Layers },
  { title: 'How it works', text: 'A closer look at your document workflow.', href: '/how-it-works', Icon: BookOpen },
  { title: 'Choose your AI', text: 'Connect a provider you already use.', href: '/providers', Icon: KeyRound },
];
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const path = pathname;
  if (path === '/workspace' || path === '/playground') return null;
  return <header className="site-header"><div className="header-inner"><Brand />
    <nav aria-label="Main navigation" className="desktop-nav">
      <ExploreMenu><p>What would you like to make?</p><div className="mega-menu-grid">{destinations.map(({ title, text, href, Icon }) =>
          <Link prefetch={false} href={href} key={title}><Icon size={22} strokeWidth={1.5} /><strong>{title}</strong><span>{text}</span></Link>)}</div>
      </ExploreMenu>
      <Link prefetch={false} href="/projects" aria-current={pathname === '/projects' ? 'page' : undefined}>Projects</Link>
      <Link prefetch={false} href="/providers" aria-current={pathname === '/providers' ? 'page' : undefined}>Provider guide</Link>
    </nav>
    <div className="header-actions"><Link prefetch={false} href="https://github.com/QuantumSenpai/outline-studio" target="_blank" rel="noopener noreferrer" className="header-source">Source code</Link>
      <Link prefetch={false} href="/workspace" className="button button-primary header-cta"><PanelTop size={16} />Open workspace</Link>
      <div className="mobile-nav"><Modal open={open} onOpenChange={setOpen} title="Explore Outline Studio" description="Open a workspace or browse the guides."
        trigger={<button className="icon-button" aria-label="Open navigation"><Menu size={22} /></button>}>
        <nav aria-label="Mobile navigation" className="mobile-links">{[...destinations, { title: 'Local projects', href: '/projects', Icon: FolderOpen }].map(({ title, href, Icon }) =>
          <Link key={title} href={href} onClick={() => setOpen(false)}><span>{title}</span><Icon size={19} /></Link>)}</nav>
      </Modal></div>
    </div>
  </div></header>;
}
