'use client';

import { useLayoutEffect, useRef } from 'react';

export function SelectionIndicator({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motion = useRef<Animation | null>(null);
  useLayoutEffect(() => () => motion.current?.cancel(), []);
  useLayoutEffect(() => {
    const indicator = ref.current;
    const root = indicator?.parentElement;
    if (!indicator || !root) return;
    const preference = matchMedia('(prefers-reduced-motion:reduce)');
    let positioned = !indicator.hidden && indicator.style.width !== '';
    const draw = () => {
      const selected = root.querySelector<HTMLElement>('button[aria-pressed=true], button[data-state=active]');
      if (!selected || !root.getClientRects().length) { indicator.hidden = true; positioned = false; return; }
      const before = indicator.getBoundingClientRect();
      const bounds = root.getBoundingClientRect();
      const target = selected.getBoundingClientRect();
      const x = target.left - bounds.left + root.scrollLeft;
      const y = target.top - bounds.top + root.scrollTop;
      const end = `translate(${x}px,${y}px) scale(1,1)`;
      const start = `translate(${before.left - bounds.left + root.scrollLeft}px,${before.top - bounds.top + root.scrollTop}px) scale(${before.width / target.width},${before.height / target.height})`;
      motion.current?.cancel(); indicator.hidden = false;
      indicator.style.setProperty('width', `${target.width}px`); indicator.style.setProperty('height', `${target.height}px`); indicator.style.setProperty('transform', end);
      if (positioned && target.width && target.height && !preference.matches && !document.activeElement?.matches(':focus-visible')) {
        motion.current = indicator.animate([{ transform: start }, { transform: end }], { duration: 240, easing: 'cubic-bezier(.23,1,.32,1)' });
      }
      positioned = true;
    };
    draw();
    const resize = new ResizeObserver(draw); resize.observe(root);
    const mutation = new MutationObserver(draw); mutation.observe(root, { childList: true, subtree: true, characterData: true });
    preference.addEventListener('change', draw);
    return () => { resize.disconnect(); mutation.disconnect(); preference.removeEventListener('change', draw); };
  }, [value]);
  return <span ref={ref} aria-hidden="true" className="selection-indicator" />;
}
