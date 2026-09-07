import { useEffect } from 'react';

/**
 * Bali Scroll Reveal
 * ------------------
 * Puro IntersectionObserver (sem window scroll listener, sem reflow).
 * Aplica a classe `.is-visible` em qualquer elemento com `.reveal` ou
 * `.stagger` assim que entra na viewport. Respeita prefers-reduced-motion
 * via CSS (as classes .reveal já ficam visíveis nesse caso).
 */
export function useScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.reveal, .stagger');
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
}

/** Convenience: pure CSS reveal class pair used by components. */
export const revealProps = {
  className: 'reveal',
};