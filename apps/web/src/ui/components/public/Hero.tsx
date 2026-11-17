'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Orchestra } from './Orchestra';
import { HeroProvider } from './HeroProvider';
import { HeroStrip } from './HeroStrip';
import '@/ui/styles/hero.css';

export function Hero() {
  return <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-grid">
      <div className="hero-content">
        <h1 id="hero-heading" className="hero-heading">
          <span className="hero-heading-line">Every format.</span>
          <span className="hero-heading-line hero-heading-accent">One flow.</span>
        </h1>
        <p className="hero-description">Outline Studio turns one brief into coordinated reports, slides and diagrams—with AI coworkers you can direct.</p>
        <div className="hero-cta">
          <Button asChild><Link href="/workspace?style=academic">Start a document <ArrowUpRight size={18} /></Link></Button>
          <Button asChild variant="outline"><Link href="/how-it-works">See how it works <ArrowRight size={16} /></Link></Button>
        </div>
        <HeroProvider />
      </div>
      <Orchestra />
      <HeroStrip />
    </div>
  </section>;
}
