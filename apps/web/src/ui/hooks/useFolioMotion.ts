'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { gsap } from 'gsap';
import { useGsap } from './useGsap';

export function folioPose(rank: number, expanded: boolean) {
  const poses = expanded ? [[0, -9, -4, 50], [65, 10, 19, 0], [-64, 12, -19, -30], [8, -32, 5, -60]] : [[0, 0, -4, 50], [13, 7, 5, 0], [-12, 13, -10, -30], [5, 20, 2, -60]];
  const [x, y, angle, z] = poses[rank];
  return `translate3d(${x}px,${y}px,${z}px) rotate(${angle}deg)`;
}

export function useFolioMotion(root: RefObject<HTMLElement | null>, selected: number, expanded: boolean, idea: number) {
  const context = useRef<gsap.Context | null>(null);
  const engine = useGsap();
  useLayoutEffect(() => {
    const gsap = engine;
    if (!gsap) return;
    const element = root.current;
    if (!element) return;
    element.setAttribute('data-engine', 'ready');
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const stage = element.querySelector<HTMLElement>('.folio-tilt');
      if (!stage) return;
      const xTo = gsap.quickTo(stage, 'rotationY', { duration: .65, ease: 'power3.out' });
      const yTo = gsap.quickTo(stage, 'rotationX', { duration: .65, ease: 'power3.out' });
      const fine = matchMedia('(hover:hover) and (pointer:fine)');
      const move = (event: PointerEvent) => {
        if (!fine.matches || event.pointerType === 'touch') return;
        const box = element.getBoundingClientRect();
        xTo(-10 + (event.clientX - box.left - box.width / 2) / box.width * 14);
        yTo(7 - (event.clientY - box.top - box.height / 2) / box.height * 10);
      };
      const reset = () => { xTo(-10); yTo(7); };
      element.addEventListener('pointermove', move); element.addEventListener('pointerleave', reset);
      return () => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', reset); };
    });
    context.current = gsap.context(() => {}, element);
    return () => { media.revert(); context.current?.revert(); };
  }, [root, engine]);
  useLayoutEffect(() => {
    const gsap = engine;
    if (!gsap) return;
    const element = root.current;
    if (!element) return;
    const pages = element.querySelectorAll<HTMLElement>('.folio-page');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.setAttribute('data-animating', reduced ? 'false' : 'true');
    context.current?.add(() => {
      pages.forEach((page, index) => {
        const rank = (index - selected + 4) % 4;
        gsap.to(page, { transform: folioPose(rank, expanded), duration: reduced ? 0 : .6, ease: 'power3.out', overwrite: true, onComplete: () => { if (rank === 0) element.setAttribute('data-animating', 'false'); } });
      });
      if (!reduced) gsap.fromTo(element.querySelectorAll('.folio-page[data-active=true] .folio-content'), { y: 10, opacity: .4 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out', overwrite: true });
    });
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const settle = () => {
      if (!preference.matches) return;
      gsap.killTweensOf(pages); gsap.killTweensOf(element.querySelectorAll('.folio-content'));
      pages.forEach((page, index) => gsap.set(page, { transform: folioPose((index - selected + 4) % 4, expanded) }));
      gsap.set(element.querySelectorAll('.folio-content'), { opacity: 1, y: 0 }); element.setAttribute('data-animating', 'false');
    };
    preference.addEventListener('change', settle);
    return () => preference.removeEventListener('change', settle);
  }, [root, selected, expanded, idea, engine]);
}
