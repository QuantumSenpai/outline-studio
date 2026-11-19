import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProviderGallery } from './ProviderGallery';
import '@/ui/styles/hero.css';

export function Hero() {
  return <section className="hero" aria-labelledby="hero-heading">
    <h1 id="hero-heading">One workspace.<br />From thought to document.</h1>
    <ProviderGallery />
    <div className="hero-detail"><p>Explore ideas in chat, shape an assignment, and create coordinated reports, slides and diagrams with the AI you choose.</p>
      <Link prefetch={false} className="button button-primary" href="/workspace">Open workspace <ArrowUpRight size={17} /></Link>
      <small>Drafts stay on this device. Bring your own AI key.</small>
    </div>
  </section>;
}
