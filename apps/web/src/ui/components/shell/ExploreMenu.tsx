'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { gsap } from 'gsap';
import { useGsap } from '../../hooks/useGsap';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export function ExploreMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const engine = useGsap(open);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const current = useRef(false);
  const fallback = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const gsap = engine;
    if (!gsap) return;
    fallback.current?.finish(); fallback.current?.cancel(); fallback.current = null;
    const media = gsap.matchMedia();
    media.add({ reduced: '(prefers-reduced-motion:reduce)', motion: '(prefers-reduced-motion:no-preference)' }, context => {
      const node = panel.current;
      if (!node) return;
      const reduced = Boolean(context.conditions?.reduced);
      timeline.current = gsap.timeline({ paused: true, onReverseComplete: () => { if (!current.current) node.hidden = true; } })
        .fromTo(node, { opacity: 0, y: -12, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: reduced ? .001 : .24, ease: 'power3.out' })
        .fromTo(node.querySelectorAll('a'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: reduced ? .001 : .22, stagger: reduced ? 0 : .025, ease: 'power3.out' }, reduced ? 0 : .04);
      timeline.current.progress(current.current ? 1 : 0).pause();
      if (!current.current) node.hidden = true;
      return () => { timeline.current = null; };
    });
    return () => media.revert();
  }, [engine]);
  useLayoutEffect(() => {
    current.current = open;
    if (!engine && panel.current) {
      const node = panel.current;
      const opacity = node.hidden ? '0' : getComputedStyle(node).opacity;
      fallback.current?.cancel();
      node.hidden = false;
      const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
      const animation = node.animate([{ opacity }, { opacity: open ? 1 : 0 }], { duration: reduced ? 0 : 200, fill: 'forwards', easing: 'cubic-bezier(.23,1,.32,1)' });
      animation.onfinish = () => { if (!current.current) node.hidden = true; };
      fallback.current = animation;
      return;
    }
    if (open) { if (panel.current) panel.current.hidden = false; timeline.current?.timeScale(1).play(); }
    else if (timeline.current && timeline.current.progress() > 0) timeline.current.timeScale(1.35).reverse();
    else if (panel.current) panel.current.hidden = true;
  }, [open, engine]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && current.current) { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); fallback.current?.cancel(); };
  }, []);
  return <div ref={root} className="explore-menu"><button ref={trigger} type="button" aria-expanded={open} aria-controls="explore-panel" onClick={() => setOpen(value => !value)}>Explore <ChevronDown size={15} /></button>
    <div ref={panel} id="explore-panel" className="mega-menu" hidden inert={!open} onClick={event => { if ((event.target as Element).closest('a')) setOpen(false); }}>{children}</div>
  </div>;
}
