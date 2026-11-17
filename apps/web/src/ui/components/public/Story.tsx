'use client';

import { useEffect, useRef } from 'react';
import { CheckCheck, FileDown, GitBranch, ListTree, MessageSquareText } from 'lucide-react';

const steps = [
  { Icon: MessageSquareText, title: 'One brief.', text: 'Describe what you need, who it is for and what matters.' },
  { Icon: ListTree, title: 'An accepted outline.', text: 'Shape the structure before your coworkers begin.' },
  { Icon: GitBranch, title: 'Work, together.', text: 'Independent writing and diagram tasks share the same plan.' },
  { Icon: CheckCheck, title: 'A careful review.', text: 'See what meets the brief and what still needs your judgment.' },
  { Icon: FileDown, title: 'Coordinated files.', text: 'Download the reviewed content in the formats you need.' },
];
export function Story() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    let dispose: (() => void) | undefined;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (!active) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.story-word', { y: 18, stagger: .06, duration: .55, ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } });
        gsap.from('.flow-step svg', { y: 10, opacity: .3, stagger: .08, duration: .5,
          scrollTrigger: { trigger: ref.current, start: 'top 65%', once: true } });
      }, ref);
      dispose = () => media.revert();
    });
    return () => { active = false; dispose?.(); };
  }, []);
  return <section ref={ref} className="flow-story page-container" aria-labelledby="story-heading"><div className="section-heading">
    <h2 id="story-heading" aria-label="Less switching. More making."><span aria-hidden="true"><span className="story-word">Less switching.</span><br /><span className="story-word">More making.</span></span></h2>
    <p>Keep the whole assignment in one conversation. You set the direction. Your AI coworkers carry it across the work.</p></div>
    <div className="flow-steps">{steps.map(({ Icon, title, text }) => <div key={title} className="flow-step"><Icon size={24} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></div>)}</div>
  </section>;
}
