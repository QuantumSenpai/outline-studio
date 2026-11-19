'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

export function useConversationMotion(root: RefObject<HTMLElement | null>, ready: boolean, started: boolean) {
  const composerTop = useRef<{ top: number; width: number; viewport: number } | null>(null);
  useLayoutEffect(() => {
    const composer = root.current?.querySelector<HTMLElement>('.composer, .playground-dock');
    if (!composer) return;
    const { top, width } = composer.getBoundingClientRect();
    if (started && composerTop.current !== null && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const delta = composerTop.current.width === width && composerTop.current.viewport === innerHeight ? composerTop.current.top - top : 0;
      if (Math.abs(delta) > 2) composer.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.23,1,.32,1)' });
    }
    composerTop.current = started ? null : { top, width, viewport: innerHeight };
  }, [root, ready, started]);
  useEffect(() => {
    const element = root.current;
    if (!ready || !element) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Set<Animation>();
    const observer = new MutationObserver(records => {
      const finishedStream = records.some(record => Array.from(record.removedNodes).some(node => node instanceof Element && node.matches('[data-streaming=true]')));
      for (const record of records) for (const node of record.addedNodes) {
        if (reduced.matches || !(node instanceof HTMLElement) || !node.matches('.message, .playground-message')) continue;
        if (finishedStream && node.classList.contains('studio')) continue;
        const animation = node.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
        active.add(animation);
        animation.onfinish = animation.oncancel = () => active.delete(animation);
      }
    });
    const stopMotion = () => { if (reduced.matches) active.forEach(animation => animation.cancel()); };
    reduced.addEventListener('change', stopMotion);
    observer.observe(element, { childList: true, subtree: true });
    return () => { observer.disconnect(); reduced.removeEventListener('change', stopMotion); active.forEach(animation => animation.cancel()); };
  }, [root, ready]);
}
