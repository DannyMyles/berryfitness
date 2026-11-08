'use client';

import { useEffect } from 'react';

/**
 * Adds .is-visible to every .reveal element as it scrolls into view (see the
 * "Scroll reveal" rules in globals.css). Watches the DOM too, so content that
 * arrives later (product grids, events loaded from the API) animates in.
 * Anything already scrolled past (fast flicks, jumping to an anchor) is shown
 * as well, so nothing can stay hidden.
 */
export default function RevealObserver() {
  useEffect(() => {
    const show = (el: Element) => el.classList.add('is-visible');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    const pending = () => document.querySelectorAll('.reveal:not(.is-visible)');
    const scan = () => pending().forEach((el) => io.observe(el));

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const limit = window.innerHeight;
        pending().forEach((el) => {
          if (el.getBoundingClientRect().top < limit) show(el);
        });
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
