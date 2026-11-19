'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

export function useWorkspaceMotion(root: RefObject<HTMLElement | null>, ready: boolean, tab: string, chat: boolean) {
  const previous = useRef<{ left: number; width: number; chat: boolean } | null>(null);
  const activePane = useRef<Element | null>(null);
  const previousTab = useRef(tab);
  useLayoutEffect(() => {
    const element = root.current;
    if (!ready || !element) return;
    const preference = matchMedia('(prefers-reduced-motion:reduce)');
    const animations = new Set<Animation>();
    let changedTab = previousTab.current !== tab;
    previousTab.current = tab;
    const animate = (node: HTMLElement, frames: Keyframe[], duration: number) => {
      if (preference.matches || document.activeElement?.matches(':focus-visible')) return;
      const motion = node.animate(frames, { duration, easing: 'cubic-bezier(.23,1,.32,1)' });
      animations.add(motion); motion.onfinish = () => animations.delete(motion);
    };
    const main = element.querySelector<HTMLElement>('.workspace-main');
    const snapshot = () => {
      if (!main) return;
      const box = main.getBoundingClientRect();
      previous.current = { left: box.left, width: box.width, chat };
    };
    element.addEventListener('pointerdown', snapshot, true);
    if (main) {
      const box = main.getBoundingClientRect();
      const last = previous.current;
      if (last && last.chat !== chat && element.clientWidth > 768) {
        animate(main, [{ transform: `translateX(${last.left - box.left}px)` }, { transform: 'translateX(0)' }], 280);
      }
      previous.current = { left: box.left, width: box.width, chat };
    }
    const enterPane = () => {
      const pane = element.querySelector<HTMLElement>('[role=tabpanel][data-state=active]');
      if (!pane || activePane.current === pane && !changedTab) return;
      if (activePane.current) animate(pane, [{ opacity: .55, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], 240);
      activePane.current = pane;
      changedTab = false;
    };
    enterPane();
    const observer = new MutationObserver(enterPane);
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
    const settle = () => { if (preference.matches) animations.forEach(animation => animation.cancel()); };
    preference.addEventListener('change', settle);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener('change', settle); element.removeEventListener('pointerdown', snapshot, true); };
  }, [root, ready, tab, chat]);
}
