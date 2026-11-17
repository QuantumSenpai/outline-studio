import { useEffect, useRef, type RefObject } from 'react';

export function useOrchestraMotion(ref: RefObject<HTMLElement | null>, paused: boolean) {
  const pausedRef = useRef(paused);
  const syncRef = useRef(() => {});
  useEffect(() => { pausedRef.current = paused; syncRef.current(); }, [paused]);
  useEffect(() => {
    let active = true;
    let dispose = () => {};
    void import('gsap').then(({ gsap }) => {
      if (!active || !ref.current) return;
      const stage = ref.current;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2, defaults: { duration: .65, ease: 'power3.out' } });
        timeline.from('.brief-detail', { opacity: 0, y: 6, stagger: .16 })
          .from('.wire-trunk', { scaleY: 0, transformOrigin: 'top' }, .65)
          .from('.wire-report, .wire-slides', { scaleX: 0, transformOrigin: 'left', stagger: .12 }, .9)
          .from('.report-detail', { opacity: 0, y: 8, stagger: .15 }, 1.2)
          .from('.slide-detail', { opacity: 0, x: 8, stagger: .15 }, 2)
          .from('.diagram-node', { opacity: 0, y: 6, stagger: .18 }, 2.8)
          .from('.diagram-arrow', { opacity: 0, scaleX: 0, stagger: .18 }, 3.1)
          .from('.orchestra-status', { opacity: 0, y: 4 }, 3.8)
          .to({}, { duration: 3 })
          .to('.brief-detail, .report-detail, .slide-detail, .diagram-node, .diagram-arrow, .orchestra-wire, .orchestra-status', { opacity: 0, duration: .5 });
        let visible = false;
        const sync = () => { if (visible && !pausedRef.current && !document.hidden) timeline.resume(); else timeline.pause(); };
        syncRef.current = sync;
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .15 });
        observer.observe(stage);
        document.addEventListener('visibilitychange', sync);
        return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); timeline.kill(); syncRef.current = () => {}; };
      }, stage);
      dispose = () => media.revert();
    });
    return () => { active = false; dispose(); };
  }, [ref]);
}
