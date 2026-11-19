'use client';

import { useEffect, useState } from 'react';

type Engine = typeof import('gsap')['gsap'];
let pending: Promise<Engine> | undefined;

export function useGsap(priority = false) {
  const [engine, setEngine] = useState<Engine | null>(null);
  useEffect(() => {
    let active = true;
    let timer = 0;
    const load = () => {
      pending ??= import('gsap').then(module => module.gsap);
      void pending.then(value => { if (active) setEngine(() => value); }).catch(() => { pending = undefined; });
    };
    const schedule = () => { timer = window.setTimeout(load, 120); };
    if (priority) load();
    else if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => { active = false; clearTimeout(timer); window.removeEventListener('load', schedule); };
  }, [priority]);
  return engine;
}
