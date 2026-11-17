'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Key, Zap, Layers, FileText, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Orchestra } from './Orchestra';

const scenarios = [
  {
    id: 'academic',
    title: 'Academic assignment',
    brief: 'Compare renewable energy policies across three countries. Include a report with references, five slides, and a labelled diagram of policy mechanisms.',
    formats: 'DOCX / PDF',
    icon: FileText,
  },
  {
    id: 'professional',
    title: 'Professional report',
    brief: 'Write a project-status report for stakeholders. Executive summary, findings table, recommendations, and a risk diagram. Output as report and presentation.',
    formats: 'DOCX / PPTX',
    icon: Layers,
  },
  {
    id: 'research',
    title: 'Research-paper draft',
    brief: 'Draft a paper on urban heat island mitigation. Abstract, keywords, structured sections, numbered figures, and a bibliography.',
    formats: 'DOCX / PDF',
    icon: FileText,
  },
  {
    id: 'solutions',
    title: 'Question-paper solutions',
    brief: 'Solve a mathematics paper with worked steps. Preserve original numbering, show equations, flag ambiguities, and verify answers.',
    formats: 'DOCX / PDF',
    icon: Download,
  },
] as const;

export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [showApiGuide, setShowApiGuide] = useState(false);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let active = true;
    void import('gsap').then(({ gsap }) => {
      if (!active || !contentRef.current) return;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.from('.hero-heading-line', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1 }, 0)
            .from('.hero-description', { y: 20, opacity: 0, duration: 0.7 }, 0.2)
            .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.3)
            .from('.hero-scenario', { y: 20, opacity: 0, duration: 0.6 }, 0.4)
            .from('.hero-api-guide', { y: 20, opacity: 0, duration: 0.6 }, 0.5);
        }, contentRef);
        dispose = () => ctx.revert();
      });
    });
    return () => { active = false; dispose?.(); };
  }, []);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = setInterval(() => {
      setScenarioIndex((prev) => (prev + 1) % scenarios.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentScenario = scenarios[scenarioIndex];

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-grid">
        <div className="hero-content" ref={contentRef}>
          <h1 id="hero-heading" className="hero-heading">
            <span className="hero-heading-line">Every format.</span>
            <span className="hero-heading-line hero-heading-accent">One flow.</span>
          </h1>
          <p className="hero-description">
            Outline Studio turns one brief into coordinated reports, slides and diagrams—with AI coworkers you can direct.
          </p>
          <div className="hero-cta">
            <Button asChild className="hero-cta-primary"><a href="/workspace">Start a document <ArrowUpRight size={18} /></a></Button>
            <Button asChild variant="outline" className="hero-cta-secondary"><a href="/how-it-works">See how it works <ArrowRight size={16} /></a></Button>
          </div>
          <div className="hero-scenario" aria-live="polite">
            <span className="scenario-badge">{currentScenario.formats}</span>
            <strong>{currentScenario.title}</strong>
            <p>{currentScenario.brief}</p>
          </div>
          <div className="hero-api-guide">
            <button className="api-guide-toggle" onClick={() => setShowApiGuide(!showApiGuide)} aria-expanded={showApiGuide}>
              <Key size={18} /> Connect your provider. Keep control of your key.
            </button>
            {showApiGuide && (
              <div className="api-guide-panel" role="region" aria-label="Provider connection guide">
                <div className="api-guide-steps">
                  <div className="api-step"><Zap size={18} /><div><strong>Choose a provider</strong><span>NVIDIA, Groq, Gemini, OpenRouter, or more</span></div></div>
                  <div className="api-step"><ArrowUpRight size={18} /><div><strong>Get your key</strong><span>Open the provider&apos;s official key page and create one</span></div></div>
                  <div className="api-step"><Key size={18} /><div><strong>Paste & validate</strong><span>Enter your key, choose a model, and validate the connection</span></div></div>
                  <div className="api-step"><Layers size={18} /><div><strong>Choose storage</strong><span>Session-only (default) or encrypted local vault with a passphrase</span></div></div>
                  <div className="api-step"><ArrowRight size={18} /><div><strong>Start your document</strong><span>Your key only transits during generation. Drafts stay on your device.</span></div></div>
                </div>
                <div className="api-guide-actions">
                  <Button asChild className="api-guide-btn"><a href="/providers">Where do I get a key? <ArrowUpRight size={14} /></a></Button>
                  <Button asChild variant="outline" className="api-guide-btn"><a href="/workspace">Try a sample <ArrowRight size={14} /></a></Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="hero-illustration">
          <Orchestra />
        </div>
      </div>
    </section>
  );
}